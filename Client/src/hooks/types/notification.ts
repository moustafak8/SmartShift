export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  is_read: boolean;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  status: string;
  message: string;
  payload: Notification[];
}

export interface UnreadCountResponse {
  status: string;
  message: string;
  payload: {
    count: number;
  };
}

export interface MarkReadResponse {
  status: string;
  message: string;
  payload: Notification | null;
}

export interface MarkAllReadResponse {
  status: string;
  message: string;
  payload: {
    marked_count: number;
  };
}

export type NotificationType =
  | 'swap_request'
  | 'swap_approved'
  | 'swap_rejected'
  | 'swap_cancelled'
  | 'swap_awaiting'
  | 'shift_assigned'
  | 'shift_updated'
  | 'shift_reminder'
  | 'fatigue_warning'
  | 'wellness_alert'
  | 'schedule_published'
  | 'system';