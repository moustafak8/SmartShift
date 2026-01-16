export type FlaggedWellnessEntry = {
  id: number;
  employee_id: number;
  employee_name: string;
  entry_text: string;
  word_count: number;
  created_at: string;
  is_flagged: number;
  flag_severity: "high" | "medium" | "low";
  flag_reason: string;
  sentiment_label: "positive" | "negative" | "neutral";
  sentiment_score: string;
};

export type FlaggedWellnessEntriesResponse = {
  status: string;
  payload: FlaggedWellnessEntry[];
};
