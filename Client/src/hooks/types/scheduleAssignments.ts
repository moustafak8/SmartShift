export type ShiftAssignment = {
  assignment_id: number;
  employee_id: number;
  full_name: string;
  department_name: string;
  assignment_type: "regular" | "overtime" | "swap";
  status: "confirmed" | "pending" | "cancelled";
};

export type ShiftLabels = {
  day: string;
  evening: string;
  night: string;
};

export type DayAssignments = {
  labels: ShiftLabels;
  day: ShiftAssignment[];
  evening: ShiftAssignment[];
  night: ShiftAssignment[];
};

export type WeekAssignments = {
  start_date: string;
  end_date: string;
  days: {
    [date: string]: DayAssignments;
  };
};

export type ScheduleAssignmentsResponse = {
  status: string;
  payload: WeekAssignments;
};
