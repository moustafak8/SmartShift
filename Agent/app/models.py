from pydantic import BaseModel
from typing import Optional, List, Dict, Any


class SwapValidationRequest(BaseModel):
    swap_id: int
    requester_id: int
    requester_shift_id: int
    target_employee_id: int
    target_shift_id: int
    swap_reason: Optional[str] = None


class ValidationCheckResult(BaseModel):
    check_name: str
    passed: bool
    severity: str  
    message: str
    details: Optional[Dict[str, Any]] = None


class SwapValidationResponse(BaseModel):
    swap_id: int
    decision: str 
    confidence: float  
    reasoning: str
    validation_passed: bool
    checks: List[ValidationCheckResult]
    risk_factors: List[str]
    suggestions: List[Any]  
    processing_time_ms: int
    correlation_id: Optional[str] = None  

