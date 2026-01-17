export interface SwapCandidate {
  employee_id: number;
  full_name: string;
  email: string;
  assignment_id: number;
  shift_id: number;
  shift_date: string;
  shift_type: string;
}

export interface SwapCandidatesResponse {
  status: string;
  message: string;
  payload: SwapCandidate[];
}

export interface CreateSwapRequest {
  requester_shift_id: number;
  target_employee_id: number;
  target_shift_id: number;
  swap_reason?: string;
}

export interface ShiftSwap {
  id: number;
  requester_id: number;
  requester_shift_id: number;
  target_employee_id: number;
  target_shift_id: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  swap_reason?: string;
  validation_passed?: boolean;
  validation_notes?: {
    decision: string;
    confidence: number;
    reasoning: string;
    checks: Array<{
      check_name: string;
      passed: boolean;
      severity: string;
      message: string;
    }>;
    suggestions?: Array<{
      type: string;
      message: string;
      action: string;
    }>;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateSwapResponse {
  status: string;
  message: string;
  payload: ShiftSwap;
}
