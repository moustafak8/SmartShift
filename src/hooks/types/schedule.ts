export interface GenerateScheduleRequest {
  department_id: number;
  start_date: string;
  end_date: string;
}

export interface ShiftAssignment {
  shift_id: number;
  employee_id: number;
  employee_name: string;
  position_id: number;
  assignment_type: string;
  status: string;
}

export interface PositionDetail {
  position_id: number;
  position_name: string;
  required_count: number;
  eligible_candidates: number;
}

export interface ShiftDetail {
  shift_id: number;
  date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  positions: PositionDetail[];
}

export interface UnfilledPosition {
  shift_id: number;
  shift_date: string;
  position_name: string;
  required: number;
  filled: number;
  missing: number;
}

export interface ScheduleDebugInfo {
  total_shifts_considered: number;
  total_employees_active: number;
  shifts_with_no_candidates: any[];
  shifts_with_no_candidates_count: number;
  total_position_slots: number;
  assignments_by_shift: Record<string, number>;
  unfilled_positions: UnfilledPosition[];
  unfilled_count: number;
  shift_details: ShiftDetail[];
}

export interface GenerateScheduleResponse {
  success: boolean;
  message: string;
  assignments_count: number;
  start_date: string;
  end_date: string;
  department_id: number;
  persisted: boolean;
  assignments: ShiftAssignment[];
  debug: ScheduleDebugInfo;
}

export interface GenerateScheduleApiResponse {
  status: string;
  payload: GenerateScheduleResponse;
}

export interface SaveReviewedScheduleAssignment {
  shift_id: number;
  employee_id: number;
  position_id: number;
  assignment_type: string;
  status: string;
}

export interface SaveReviewedScheduleRequest {
  assignments: SaveReviewedScheduleAssignment[];
}

export interface SaveReviewedScheduleResponse {
  success: boolean;
  message: string;
  saved_count: number;
}

export interface SaveReviewedScheduleApiResponse {
  status: string;
  payload: SaveReviewedScheduleResponse;
}
