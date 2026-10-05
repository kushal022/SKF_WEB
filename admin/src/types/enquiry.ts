import type { PaginationMetadata } from './catalog';

export type EnquiryStatus =
  | 'new'
  | 'contacted'
  | 'quotation_sent'
  | 'negotiation'
  | 'confirmed'
  | 'completed'
  | 'lost';

export type FollowUpStatus = 'pending' | 'completed' | 'cancelled';

export interface EnquiryProductReference {
  public_id: string;
  name: string;
  slug: string;
}

export interface EnquiryCustomRequestReference {
  public_id: string;
  product_type: string;
  status: string;
}

export interface EnquiryUserReference {
  public_id: string;
  name: string;
  email: string;
}

export interface EnquiryNote {
  public_id: string;
  note: string;
  user: EnquiryUserReference | null;
  created_at: string;
}

export interface EnquiryStatusLog {
  public_id: string;
  from_status: EnquiryStatus;
  to_status: EnquiryStatus;
  comment: string | null;
  changed_by: EnquiryUserReference | null;
  created_at: string;
}

export interface EnquiryFollowUp {
  public_id: string;
  follow_up_at: string;
  status: FollowUpStatus;
  note: string | null;
  completed_at: string | null;
  assigned_to: EnquiryUserReference | null;
  created_at: string;
  updated_at: string;
}

export interface EnquiryListItem {
  public_id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  source: string | null;
  message: string | null;
  status: EnquiryStatus;
  product: EnquiryProductReference | null;
  custom_request: EnquiryCustomRequestReference | null;
  created_at: string;
  updated_at: string;
}

export interface EnquiryDetail extends EnquiryListItem {
  notes?: EnquiryNote[];
  status_logs?: EnquiryStatusLog[];
  follow_ups?: EnquiryFollowUp[];
}

export interface EnquiryQueryParams {
  search?: string;
  status?: EnquiryStatus;
  source?: string;
  product_id?: string;
  product_public_id?: string;
  from_date?: string;
  to_date?: string;
  sort?:
    | 'created_at'
    | 'updated_at'
    | 'customer_name'
    | 'status'
    | '-created_at'
    | '-updated_at'
    | '-customer_name'
    | '-status';
  page?: number;
  limit?: number;
}

export interface UpdateEnquiryRequest {
  customer_name?: string;
  phone?: string;
  email?: string | null;
  source?: string | null;
  message?: string | null;
}

export interface UpdateEnquiryStatusRequest {
  status: EnquiryStatus;
  comment?: string | null;
}

export interface CreateEnquiryNoteRequest {
  note: string;
}

export interface UpdateEnquiryNoteRequest {
  note: string;
}

export interface CreateFollowUpRequest {
  follow_up_at: string;
  assigned_to?: string | null;
  note?: string | null;
  status?: FollowUpStatus;
}

export interface UpdateFollowUpRequest {
  follow_up_at?: string;
  assigned_to?: string | null;
  note?: string | null;
  status?: FollowUpStatus;
  completed_at?: string | null;
}

export interface PaginatedEnquiriesResult {
  items: EnquiryListItem[];
  pagination: PaginationMetadata;
}
