export interface FatigueScore {
    score_date: string;
    total_score: number;
    risk_level: "low" | "medium" | "high";
    quantitative_score: number;
    qualitative_score: number;
    psychological_score: number;
}

export interface Employee {
    employee_id: number;
    employee_name: string;
    is_active: number;
    position: string;
    fatigue_score?: FatigueScore;
}

export interface EmployeesPayload {
    department_name: string;
    employees: Employee[];
}

export interface EmployeesResponse {
    status: string;
    payload: EmployeesPayload;
}

export interface AddEmployeeFormData {
    full_name: string;
    email: string;
    password: string;
    phone?: string;
    user_type_id: number;
    department_id: number;
    position_id: number | null;
}

export interface Position {
    id: number;
    name: string;
}

export interface PositionsResponse {
    status: string;
    payload: Position[];
}

