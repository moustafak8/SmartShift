from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.models import SwapValidationRequest, SwapValidationResponse
from app.graph.tools import laravel_client
import logging
import time
from datetime import datetime

settings = get_settings()

app = FastAPI(
    title="SmartShift AI Agent",
    version="1.0.0",
    description="LangGraph-powered shift swap validation"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(level=settings.log_level)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def startup_event():
    """Pre-authenticate on startup to avoid first-request delay"""
    logger.info("Starting SmartShift AI Agent...")
    try:
        await laravel_client.token_manager.get_valid_token()
        logger.info("Pre-authentication successful")
    except Exception as e:
        logger.error(f"Pre-authentication failed: {e}")
        logger.warning("Agent will attempt to login on first request")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    token_valid = laravel_client.token_manager.is_token_valid()
    
    return {
        "status": "healthy",
        "service": "smartshift-agent",
        "laravel_authenticated": token_valid,
        "token_expiry": laravel_client.token_manager.token_expiry.isoformat() if laravel_client.token_manager.token_expiry else None
    }


@app.get("/api/auth/status")
async def auth_status():
    """Check authentication status"""
    token_valid = laravel_client.token_manager.is_token_valid()
    
    return {
        "authenticated": token_valid,
        "token_expiry": laravel_client.token_manager.token_expiry.isoformat() if laravel_client.token_manager.token_expiry else None,
        "time_until_expiry": str(laravel_client.token_manager.token_expiry - datetime.now()) if laravel_client.token_manager.token_expiry else None
    }


@app.post("/api/auth/refresh")
async def force_refresh():
    """Force token refresh (for testing)"""
    try:
        await laravel_client.token_manager._login()
        return {
            "status": "success",
            "token_expiry": laravel_client.token_manager.token_expiry.isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/validate-swap", response_model=SwapValidationResponse)
async def validate_swap(request: SwapValidationRequest):
    """
    Main endpoint: Validate a shift swap request using LangGraph agent
    TODO: Implement swap validation workflow
    """
    start_time = time.time()
    
    try:
        # TODO: Import workflow once implemented
        # from app.graph.workflow import validation_app
        
        logger.info(f"Validating swap {request.swap_id}")
        
        # Placeholder response - replace with actual workflow
        processing_time = int((time.time() - start_time) * 1000)
        
        raise HTTPException(status_code=501, detail="Swap validation workflow not yet implemented")
        
    except Exception as e:
        logger.error(f"Validation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=settings.app_port)