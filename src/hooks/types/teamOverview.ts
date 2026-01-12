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
    name: string;
    email: string;
    password: string;
}

export interface TeamOverviewProps {
    onNavigate: (page: string, data?: any) => void;
}
