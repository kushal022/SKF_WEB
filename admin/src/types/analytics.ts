// admin/src/types/analytics.ts
// Domain types for Executive Dashboard & Basic Analytics (Step 12)

export interface DashboardSummaryData {
  users?: {
    total: number;
    active: number;
  };
  products?: {
    total: number;
    published: number;
    draft: number;
  };
  enquiries?: {
    total: number;
    new: number;
  };
  customRequests?: {
    total: number;
    new: number;
  };
  b2bAccounts?: {
    total: number;
    pending: number;
  };
  quotations?: {
    total: number;
    sent: number;
    accepted: number;
  };
  orders?: {
    total: number;
    pending: number;
    confirmed: number;
    manufacturing: number;
  };
  payments?: {
    total: number;
    paid: number;
    pending: number;
    failed: number;
  };
}

export type AnalyticsDateFilter = 'all' | 'today' | '7d' | '30d' | 'month';

export interface EnquiryPipelineBreakdown {
  new: number;
  contacted: number;
  quotation_sent: number;
  negotiation: number;
  confirmed: number;
  completed: number;
  lost: number;
  total: number;
}

export interface QuotationStatusBreakdown {
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  expired: number;
  cancelled: number;
  total: number;
  totalQuotedValue: number;
  acceptedQuotationValue: number;
}

export interface ReviewAnalyticsBreakdown {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
  featuredCount: number;
}

export interface GalleryAnalyticsBreakdown {
  total: number;
  published: number;
  archived: number;
}
