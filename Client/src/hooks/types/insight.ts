export type InsightType = "weekly_summary" | "alert" | "trend";
export type InsightPriority = "normal" | "high" | "urgent";

export interface AIInsight {
  id: number;
  department_id: number;
  insight_type: InsightType;
  title: string;
  content: string;
  priority: InsightPriority;
  is_read: boolean;
  created_at: string;
  updated_at: string;
  department?: {
    id: number;
    name: string;
  };
}

export interface InsightsResponse {
  status: string;
  payload: AIInsight[];
}

export interface InsightResponse {
  status: string;
  payload: AIInsight | null;
}

export interface UnreadCountResponse {
  status: string;
  payload: {
    count: number;
  };
}

export type InsightFilter =
  | "all"
  | "unread"
  | "weekly_summary"
  | "alert"
  | "urgent";
