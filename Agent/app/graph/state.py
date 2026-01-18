
from typing import Optional, List, Dict, Any
from typing_extensions import TypedDict
class SwapValidationState(TypedDict):   
    swap_id: int
    requester_id: int
    requester_shift_id: int
    target_employee_id: int
    target_shift_id: int
    swap_reason: Optional[str]
    
  
    requester_data: Optional[Dict[str, Any]]      
    target_data: Optional[Dict[str, Any]]         
    requester_shift_data: Optional[Dict[str, Any]]  
    target_shift_data: Optional[Dict[str, Any]]     
    
   
    availability_check: Optional[Dict[str, Any]]
    fatigue_check: Optional[Dict[str, Any]]
    staffing_check: Optional[Dict[str, Any]]
    compliance_check: Optional[Dict[str, Any]]
    
   
    decision: Optional[str]        
    confidence: Optional[float]    
    reasoning: Optional[str]       
    risk_factors: List[str]         
    all_checks: List[Dict[str, Any]]  
    error: Optional[str]            
