export type WellnessEntry = {
    id: number;
    employee_id: number;
    entry_text: string;
    word_count: number;
    created_at: string;
};

export type WellnessEntriesResponse = {
    status: string;
    payload: WellnessEntry[];
};
