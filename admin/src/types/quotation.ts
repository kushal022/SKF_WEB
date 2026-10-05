import type { PaginationMetadata } from './catalog';

export type QuotationStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export interface QuotationItemProduct {
  public_id: string;
  name: string;
  slug: string;
  product_code: string;
}

export interface QuotationItem {
  public_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  customization_amount: number;
  discount_amount: number;
  line_total: number;
  metadata?: Record<string, any> | null;
  product?: QuotationItemProduct | null;
  created_at: string;
}

export interface QuotationStatusLog {
  public_id: string;
  from_status: QuotationStatus;
  to_status: QuotationStatus;
  comment: string | null;
  changed_by: {
    public_id: string;
    name: string;
    email: string;
  } | null;
  created_at: string;
}

export interface QuotationEnquiryReference {
  public_id: string;
  customer_name: string;
  phone: string;
  email: string | null;
  status: string;
}

export interface QuotationB2BReference {
  public_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
}

export interface QuotationUserReference {
  public_id: string;
  name: string;
  email: string;
}

export interface QuotationDetail {
  public_id: string;
  quotation_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  subtotal: number;
  customization_amount: number;
  transport_amount: number;
  installation_amount: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  valid_until: string | null;
  status: QuotationStatus;
  notes: string | null;
  enquiry?: QuotationEnquiryReference | null;
  b2b_account?: QuotationB2BReference | null;
  created_by?: QuotationUserReference | null;
  items: QuotationItem[];
  status_logs?: QuotationStatusLog[];
  created_at: string;
  updated_at: string;
}

export interface QuotationListItem extends Omit<QuotationDetail, 'status_logs'> {}

export interface QuotationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: QuotationStatus;
  customer?: string;
  enquiry_public_id?: string;
  b2b_account_public_id?: string;
  from_date?: string;
  to_date?: string;
  sort_by?: 'created_at' | 'total_amount' | 'quotation_number' | 'valid_until';
  sort_order?: 'asc' | 'desc' | 'ASC' | 'DESC';
}

export interface CreateQuotationItemPayload {
  product_public_id?: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  customization_amount?: number;
  discount_amount?: number;
  metadata?: Record<string, any> | null;
}

export interface CreateQuotationPayload {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string | null;
  enquiry_public_id?: string | null;
  b2b_account_public_id?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  customization_amount?: number;
  transport_amount?: number;
  installation_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
  items: CreateQuotationItemPayload[];
}

export interface UpdateQuotationPayload {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string | null;
  valid_until?: string | null;
  notes?: string | null;
  customization_amount?: number;
  transport_amount?: number;
  installation_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
}

export interface UpdateQuotationStatusPayload {
  status: QuotationStatus;
  comment?: string | null;
}

export interface UpdateQuotationItemPayload {
  product_public_id?: string | null;
  description?: string;
  quantity?: number;
  unit_price?: number;
  customization_amount?: number;
  discount_amount?: number;
  metadata?: Record<string, any> | null;
}

export interface PaginatedQuotationsResult {
  items: QuotationListItem[];
  pagination: PaginationMetadata;
}
