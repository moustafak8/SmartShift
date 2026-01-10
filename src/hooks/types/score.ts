export type ScoreBreakdownItem = {
    weight: number;
    score: number;
};

export type ScoreBreakdown = {
    schedule_pressure: ScoreBreakdownItem;
    physical_wellness: ScoreBreakdownItem;
    mental_health: ScoreBreakdownItem;
};

export type ScoreData = {
    employee_id: number;
    total_score: number;
    risk_level: string;
    breakdown: ScoreBreakdown;
};

export type ScoreResponse = {
    status: string;
    payload: ScoreData;
};
