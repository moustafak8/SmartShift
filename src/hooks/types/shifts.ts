export interface ShiftTemplate {
  id: number;
  name: string;
  shift_type: "day" | "evening" | "night";
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface ShiftTemplatesResponse {
  status: string;
  payload: ShiftTemplate[];
}
