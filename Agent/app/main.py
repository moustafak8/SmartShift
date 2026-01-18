from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.models import SwapValidationRequest, SwapValidationResponse
from app.graph.tools import laravel_client
from app.utils.request_context import RequestContext, get_logger
from app.utils.cache import get_cache
import logging
import time
from datetime import datetime

settings = get_settings()

app = FastAPI(
    title="SmartShift AI Agent",
    version="1.0.0",
    description="LangGraph-powered shift swap validation"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


logging.basicConfig(level=settings.log_level)
logger = get_logger(__name__)


@app.on_event("startup")
async def startup_event():
    logger.info("Starting SmartShift AI Agent...")
    try:
        await laravel_client.token_manager.get_valid_token()
        logger.info("Pre-authentication successful")
    except Exception as e:
        logger.error(f"Pre-authentication failed: {e}")
        logger.warning("Agent will attempt to login on first request")


@app.get("/health")
async def health_check():
    token_valid = laravel_client.token_manager.is_token_valid()
    cache_stats = get_cache().get_stats()
    
    return {
        "status": "healthy",
        "service": "smartshift-agent",
        "laravel_authenticated": token_valid,
        "token_expiry": laravel_client.token_manager.token_expiry.isoformat() if laravel_client.token_manager.token_expiry else None,
        "cache": {
            "hit_rate_percent": cache_stats["hit_rate_percent"],
            "size": cache_stats["size"]
        }
    }


@app.get("/api/auth/status")
async def auth_status():
    token_valid = laravel_client.token_manager.is_token_valid()
    
    return {
        "authenticated": token_valid,
        "token_expiry": laravel_client.token_manager.token_expiry.isoformat() if laravel_client.token_manager.token_expiry else None,
        "time_until_expiry": str(laravel_client.token_manager.token_expiry - datetime.now()) if laravel_client.token_manager.token_expiry else None
    }


@app.post("/api/auth/refresh")
async def force_refresh():
    try:
        await laravel_client.token_manager._login()
        return {
            "status": "success",
            "token_expiry": laravel_client.token_manager.token_expiry.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/cache/stats")
async def cache_stats():
    stats = get_cache().get_stats()
    return {
        "hits": stats["hits"],
        "misses": stats["misses"],
        "hit_rate_percent": stats["hit_rate_percent"],
        "size": stats["size"],
        "max_size": stats["max_size"],
        "evictions": stats["evictions"]
    }


@app.post("/api/cache/clear")
async def clear_cache():
    await get_cache().clear()
    return {"status": "cleared"}


@app.post("/api/validate-swap", response_model=SwapValidationResponse)
async def validate_swap(request: SwapValidationRequest):
    from app.graph.workflow import validation_app
    from app.models import ValidationCheckResult
    
    start_time = time.time()
    
    correlation_id = RequestContext.new(
        swap_id=request.swap_id,
        extra={"requester_id": request.requester_id, "target_id": request.target_employee_id}
    )
    
    try:
        logger.info(f"Validating swap {request.swap_id}", extra={"correlation_id": correlation_id})
        
        initial_state = {
            "swap_id": request.swap_id,
            "requester_id": request.requester_id,
            "requester_shift_id": request.requester_shift_id,
            "target_employee_id": request.target_employee_id,
            "target_shift_id": request.target_shift_id,
            "swap_reason": request.swap_reason,
            # Initialize optional fields
            "requester_data": None,
            "target_data": None,
            "requester_shift_data": None,
            "target_shift_data": None,
            "availability_check": None,
            "fatigue_check": None,
            "staffing_check": None,
            "compliance_check": None,
            "decision": None,
            "confidence": None,
            "reasoning": None,
            "risk_factors": [],
            "all_checks": [],
            "suggestions": [],
            "error": None
        }
        
        logger.info("Starting validation workflow...")
        final_state = await validation_app.ainvoke(initial_state)
        
        processing_time = int((time.time() - start_time) * 1000)
        
        ctx = RequestContext.get()
        node_timings = ctx.get("node_timings", {})
        
        checks = []
        for check in final_state.get("all_checks", []):
            checks.append(ValidationCheckResult(
                check_name=check.get("check_name", "unknown"),
                passed=check.get("passed", False),
                severity=check.get("severity", "hard"),
                message=check.get("message", ""),
                details=check.get("details")
            ))
        
        validation_passed = final_state.get("decision") != "auto_reject"
        
        response = SwapValidationResponse(
            swap_id=request.swap_id,
            decision=final_state.get("decision", "requires_review"),
            confidence=final_state.get("confidence", 0.0),
            reasoning=final_state.get("reasoning", "Validation completed"),
            validation_passed=validation_passed,
            checks=checks,
            risk_factors=final_state.get("risk_factors", []),
            suggestions=final_state.get("suggestions", []),
            processing_time_ms=processing_time,
            correlation_id=correlation_id
        )
        
        logger.info(
            f"Validation complete: {response.decision}",
            extra={
                "decision": response.decision,
                "confidence": response.confidence,
                "processing_time_ms": processing_time,
                "node_timings": node_timings
            }
        )
        return response
        
    except Exception as e:
        logger.error(f"Validation failed: {str(e)}", exc_info=True)
        
        
        processing_time = int((time.time() - start_time) * 1000)
        return SwapValidationResponse(
            swap_id=request.swap_id,
            decision="requires_review",
            confidence=0.0,
            reasoning=f"Validation workflow encountered an error: {str(e)}",
            validation_passed=False,
            checks=[],
            risk_factors=["System error - manual review required"],
            suggestions=["Please try again or contact support"],
            processing_time_ms=processing_time
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.app_port)