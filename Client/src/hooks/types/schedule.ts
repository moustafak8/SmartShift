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

export interface GenerateScheduleResponse {
  success: boolean;
  message: string;
  assignments_count: number;
  start_date: string;
  end_date: string;
  department_id: number;
  persisted: boolean;
  assignments: ShiftAssignment[];
  shift_details: ShiftDetail[];
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
export interface CreateAssignmentRequest {
  shift_id: number;
  employee_id: number;
  position_id: number;
  assignment_type: "regular" | "overtime" | "cover";
  status: "assigned" | "confirmed";
}

export interface UpdateAssignmentRequest {
  shift_id: number;
  employee_id: number;
  position_id: number;
  assignment_type: "regular" | "overtime" | "cover";
  status: "assigned" | "confirmed";
}

export interface AvailableEmployee {
  id: number;
  employee_id: number;
  employee_name: string;
  position_id: number;
  position_name: string;
  is_available: boolean;
  preferred_shift_type: string;
}

export interface AvailableEmployeesResponse {
  status: string;
  payload: AvailableEmployee[];
}
