export interface ShiftTemplate {
  id: number;
  name: string;
  shift_type: "day" | "evening" | "night";
  start_time: string;
  end_time: string;
  is_active: boolean;
  position_requirements?: PositionRequirement[];
}

export interface ShiftTemplatesResponse {
  status: string;
  payload: ShiftTemplate[];
}

export interface PositionRequirement {
  position_id: number;
  required_count: number;
}

export interface ShiftTemplate {
  id: number;
  name: string;
  shift_type: "day" | "evening" | "night";
  start_time: string;
  end_time: string;
  is_active: boolean;
  position_requirements?: PositionRequirement[];
}

export interface ShiftTemplatesResponse {
  status: string;
  payload: ShiftTemplate[];
}

export interface Shift {
  id: number;
  department_id: number;
  shift_template_id: number | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: "day" | "evening" | "night" | "rotating";
  required_staff_count: number;
  notes: string | null;
  status: "open" | "filled" | "understaffed" | "cancelled";
}

export interface ShiftsResponse {
  status: string;
  payload: Shift[];
}

export interface ShiftFormData {
  department_id: number;
  shift_template_id: number | null;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: "day" | "evening" | "night" | "rotating";
  required_staff_count: number;
  notes: string;
  status: "open" | "filled" | "understaffed" | "cancelled";
  is_recurring: boolean;
  recurrence_type: "daily" | "weekly" | "monthly" | null;
  recurrence_end_date: string;
  position_requirements?: PositionRequirement[];
}

// Shift Assignments Types
export interface ShiftAssignment {
  assignment_id: number;
  employee_id: number;
  full_name: string;
  initials: string;
  assignment_type: "regular" | "overtime" | "on_call";
  status: "assigned" | "pending" | "confirmed" | "cancelled";
}

export interface DayAssignments {
  day: ShiftAssignment[];
  evening: ShiftAssignment[];
  night: ShiftAssignment[];
}

export interface ShiftAssignmentsPayload {
  start_date: string;
  end_date: string;
  days: Record<string, DayAssignments>;
}

export interface ShiftAssignmentsResponse {
  status: string;
  payload: ShiftAssignmentsPayload;
}
