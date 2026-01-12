export interface WellnessInsightSource {
    entry_id: number;
    citation_number: number;
    citation: string;
    employee_name: string;
    entry_date: string;
    score: number;
    preview: string;
    sentiment: "positive" | "negative" | "neutral";
    is_flagged: boolean;
}

export interface WellnessInsightPayload {
    query: string;
    answer: string;
    sources: WellnessInsightSource[];
}

export interface WellnessInsightResponse {
    status: string;
    payload: WellnessInsightPayload;
}

export interface WellnessInsightRequest {
    query: string;
}
