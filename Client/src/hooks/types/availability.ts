export type EmployeeAvailability = {
    id: number;
    employee_id: number;
    day_of_week: number | null; // 0=Sun, 6=Sat
    specific_date: string | null;
    is_available: boolean;
    preferred_shift_type: 'day' | 'evening' | 'night' | 'any' | null;
    reason: 'vacation' | 'sick' | 'personal' | 'appointment' | 'other' | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type AvailabilityResponse = {
    status: string;
    payload: EmployeeAvailability[];
};

export type StoreAvailabilityPayload = {
    employee_id: number;
    day_of_week?: number;
    specific_date?: string;
    is_recurring?: boolean;
    is_available?: boolean;
    preferred_shift_type?: 'day' | 'evening' | 'night' | 'any';
    reason?: 'vacation' | 'sick' | 'personal' | 'appointment' | 'other';
    notes?: string;
};
