export type EmployeePreference = {
    id: number;
    employee_id: number;
    preferred_shift_types: string[] | null;
    max_shifts_per_week: number;
    max_hours_per_week: number;
    max_consecutive_days: number;
    prefers_weekends: boolean;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type PreferenceResponse = {
    status: string;
    payload: EmployeePreference;
};

export type StorePreferencePayload = {
    employee_id: number;
    preferred_shift_types?: string[];
    max_shifts_per_week?: number;
    max_hours_per_week?: number;
    max_consecutive_days?: number;
    prefers_weekends?: boolean;
    notes?: string;
};
