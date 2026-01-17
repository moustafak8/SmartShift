"""LangGraph state definition for shift swap validation workflow"""

from typing import Optional, List, Dict, Any
from typing_extensions import TypedDict


class SwapValidationState(TypedDict):
    """
    State schema for the validation workflow.
    
    This TypedDict defines all data that flows through the LangGraph workflow,
    from initial input through each validation check to final decision.
    """
    
    # ==========================================
    # Input Fields (from request)
    # ==========================================
    swap_id: int
    requester_id: int
    requester_shift_id: int
    target_employee_id: int
    target_shift_id: int
    swap_reason: Optional[str]
    
    # ==========================================
    # Context Data (fetched from Laravel API)
    # ==========================================
    requester_data: Optional[Dict[str, Any]]      # Employee profile
    target_data: Optional[Dict[str, Any]]         # Target employee profile
    requester_shift_data: Optional[Dict[str, Any]]  # Shift being given away
    target_shift_data: Optional[Dict[str, Any]]     # Shift being received
    
    # ==========================================
    # Validation Check Results
    # Each check follows format:
    # {passed: bool, severity: str, message: str, details: dict}
    # ==========================================
    availability_check: Optional[Dict[str, Any]]
    fatigue_check: Optional[Dict[str, Any]]
    staffing_check: Optional[Dict[str, Any]]
    compliance_check: Optional[Dict[str, Any]]
    
    # ==========================================
    # Final Output
    # ==========================================
    decision: Optional[str]         # "auto_approve", "requires_review", "auto_reject"
    confidence: Optional[float]     # 0.0 to 1.0
    reasoning: Optional[str]        # AI-generated explanation
    risk_factors: List[str]         # List of identified risks
    all_checks: List[Dict[str, Any]]  # Aggregated check results
    error: Optional[str]            # Error message if workflow failed
