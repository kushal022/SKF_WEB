import type { PaginationMetadata } from './catalog';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ReviewProduct {
  public_id: string;
  name: string;
  slug: string;
}

export interface ReviewItem {
  public_id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  is_featured: boolean;
  status: ReviewStatus;
  product: ReviewProduct | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateReviewPayload {
  customer_name?: string;
  rating?: number;
  review_text?: string;
  is_featured?: boolean;
}

export interface UpdateReviewStatusPayload {
  status: ReviewStatus;
}

export interface SetReviewFeaturedPayload {
  is_featured: boolean;
}

export interface ReviewQueryParams {
  page?: number;
  limit?: number;
  status?: ReviewStatus | '';
  rating?: number | '';
  is_featured?: boolean | string;
  product_public_id?: string;
  search?: string;
  sort?: string;
}

export interface PaginatedReviewsResult {
  items: ReviewItem[];
  pagination: PaginationMetadata;
}
