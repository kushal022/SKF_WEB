export interface NotificationUser {
  public_id: string;
  name: string;
  email: string;
}

export type NotificationType =
  | 'enquiry'
  | 'quotation'
  | 'custom_request'
  | 'review'
  | 'order'
  | 'system'
  | (string & {});

export interface NotificationItem {
  public_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  channel: string;
  is_read: boolean;
  read_at: string | null;
  related_entity_type: string | null;
  user: NotificationUser | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationQueryParams {
  page?: number;
  limit?: number;
  user_public_id?: string;
  type?: string;
  is_read?: 'true' | 'false';
  sort_order?: 'asc' | 'desc';
}

export interface NotificationPagination {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface PaginatedNotificationsResult {
  items: NotificationItem[];
  pagination: NotificationPagination;
}

export interface CreateNotificationPayload {
  user_public_id?: string | null;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  channel?: string;
  related_entity_type?: string | null;
}
