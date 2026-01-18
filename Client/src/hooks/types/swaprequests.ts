export interface ValidationCheck {
  check_name: string;
  passed: boolean;
  severity: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ValidationNotes {
  decision: string;
  confidence: number;
  reasoning: string;
  checks: ValidationCheck[];
  risk_factors: string[];
  suggestions: string[];
}

export interface ManagerSwapRequest {
  id: number;
  requester_id: number;
  requester_shift_id: number;
  target_employee_id: number;
  target_shift_id: number;
  status: string;
  swap_reason?: string;
  validation_passed: boolean;
  validation_notes?: ValidationNotes;
  created_at: string;
  requester?: {
    id: number;
    full_name: string;
  };
  target_employee?: {
    id: number;
    full_name: string;
  };
  requester_shift?: {
    id: number;
    shift_date: string;
    shift_type: string;
  };
  target_shift?: {
    id: number;
    shift_date: string;
    shift_type: string;
  };
}

export interface ManagerSwapsResponse {
  status: string;
  message: string;
  payload: ManagerSwapRequest[];
}
export interface ReviewSwapParams {
  swapId: number;
  decision: "approve" | "reject";
  notes?: string;
}