import type { PaginationMetadata } from './catalog';

export type GalleryStatus = 'draft' | 'published' | 'archived';

export interface GalleryImage {
  public_id: string;
  image_url: string;
  cloudinary_public_id: string | null;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
}

export interface GalleryItem {
  public_id: string;
  title: string;
  slug: string;
  category: string | null;
  description: string | null;
  status: GalleryStatus;
  images: GalleryImage[];
  created_at: string;
  updated_at: string;
}

export interface CreateGalleryPayload {
  title: string;
  slug: string;
  category?: string | null;
  description?: string | null;
  status?: GalleryStatus;
}

export interface UpdateGalleryPayload {
  title?: string;
  slug?: string;
  category?: string | null;
  description?: string | null;
  status?: GalleryStatus;
}

export interface CreateGalleryImagePayload {
  image_url: string;
  cloudinary_public_id?: string | null;
  alt_text?: string | null;
  sort_order?: number;
}

export interface UpdateGalleryImagePayload {
  image_url?: string;
  cloudinary_public_id?: string | null;
  alt_text?: string | null;
  sort_order?: number;
}

export interface GalleryQueryParams {
  page?: number;
  limit?: number;
  status?: GalleryStatus | '';
  category?: string;
  search?: string;
  sort?: string;
}

export interface PaginatedGalleriesResult {
  items: GalleryItem[];
  pagination: PaginationMetadata;
}
