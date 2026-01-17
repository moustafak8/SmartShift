"""LangGraph state definition for shift swap validation workflow"""

from typing import Optional, List, Dict, Any
from typing_extensions import TypedDict


class SwapValidationState(TypedDict):
    """State schema for the validation workflow"""
    
    # Input fields
    swap_id: int
    requester_id: int
    requester_shift_id: int
    target_employee_id: int
    target_shift_id: int
    swap_reason: Optional[str]
    
    # TODO: Add workflow state fields as needed
