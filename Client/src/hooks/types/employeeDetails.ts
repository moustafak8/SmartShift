export interface FatigueScoreBreakdown {
    quantitative: number;
    qualitative: number;
    psychological: number;
}

export interface FatigueScoreDetail {
    total_score: number;
    risk_level: "low" | "medium" | "high";
    score_date: string;
    breakdown: FatigueScoreBreakdown;
}

export interface MonthStats {
    total_shifts: number;
    total_hours: number;
    night_shifts: number;
    consecutive_days: number;
}

export interface UpcomingShift {
    shift_id: number;
    shift_date: string;
    shift_date_formatted: string;
    start_time: string;
    end_time: string;
    duration_hours: number;
    shift_type: string;
    assignment_type: string;
    status: string;
}

export interface EmployeeDetailsPayload {
    employee_id: number;
    employee_name: string;
    email: string;
    phone: string | null;
    department: string;
    fatigue_score: FatigueScoreDetail;
    this_month_stats: MonthStats;
    upcoming_shifts: UpcomingShift[];
}

export interface EmployeeDetailsResponse {
    status: string;
    payload: EmployeeDetailsPayload;
}
