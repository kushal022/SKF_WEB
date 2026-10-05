import type { PaginationMetadata } from './catalog';

export type CustomRequestStatus =
  | 'new'
  | 'reviewing'
  | 'quoted'
  | 'approved'
  | 'rejected'
  | 'completed';

export interface CustomRequestImage {
  public_id: string;
  image_url: string;
  cloudinary_public_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface LinkedEnquiry {
  public_id: string;
  status: string;
  source: string;
  created_at: string;
}

export interface CustomRequestListItem {
  public_id: string;
  product_type: string;
  width: number | null;
  length: number | null;
  height: number | null;
  dimension_unit: string | null;
  material: string | null;
  finish: string | null;
  quantity: number;
  customer_name: string;
  phone: string;
  email: string | null;
  city: string | null;
  requirement: string | null;
  estimated_amount: number | null;
  status: CustomRequestStatus;
  images: CustomRequestImage[];
  created_at: string;
  updated_at: string;
}

export interface CustomRequestDetail extends CustomRequestListItem {
  linked_enquiries?: LinkedEnquiry[];
}

export interface UpdateCustomRequestPayload {
  product_type?: string;
  width?: number | null;
  length?: number | null;
  height?: number | null;
  dimension_unit?: string | null;
  material?: string | null;
  finish?: string | null;
  quantity?: number;
  customer_name?: string;
  phone?: string;
  email?: string | null;
  city?: string | null;
  requirement?: string | null;
  estimated_amount?: number | null;
}

export interface UpdateCustomRequestStatusPayload {
  status: CustomRequestStatus;
}

export interface CreateCustomRequestImagePayload {
  image_url: string;
  cloudinary_public_id?: string | null;
  sort_order?: number;
}

export interface UpdateCustomRequestImagePayload {
  image_url?: string;
  cloudinary_public_id?: string | null;
  sort_order?: number;
}

export interface CustomRequestQueryParams {
  page?: number;
  limit?: number;
  status?: CustomRequestStatus | '';
  product_type?: string;
  city?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
  sort?: string;
}

export interface PaginatedCustomRequestsResult {
  items: CustomRequestListItem[];
  pagination: PaginationMetadata;
}
