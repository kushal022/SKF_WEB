import type { PaginationMetadata } from './catalog';

export interface EstimatorRule {
  public_id: string;
  name: string;
  product_type: string | null;
  material: string | null;
  finish: string | null;
  dimension_multiplier: number | null;
  material_rate: number | null;
  finish_adjustment: number | null;
  base_rate: number | null;
  rule_config?: Record<string, any> | null;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEstimatorRulePayload {
  name: string;
  product_type?: string | null;
  material?: string | null;
  finish?: string | null;
  dimension_multiplier?: number | null;
  material_rate?: number | null;
  finish_adjustment?: number | null;
  base_rate?: number | null;
  rule_config?: Record<string, any> | null;
  priority?: number;
  is_active?: boolean;
}

export interface UpdateEstimatorRulePayload extends Partial<CreateEstimatorRulePayload> {}

export interface EstimatorQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  product_type?: string;
  material?: string;
  finish?: string;
  is_active?: boolean | string;
}

export interface PaginatedEstimatorRulesResult {
  items: EstimatorRule[];
  pagination: PaginationMetadata;
}

export interface CalculateEstimateRequest {
  product_type?: string | null;
  width: number;
  length: number;
  height?: number;
  dimension_unit: 'mm' | 'cm' | 'in' | 'ft' | 'm';
  material?: string | null;
  finish?: string | null;
  quantity?: number;
}

export interface CalculateEstimateResult {
  is_estimate: boolean;
  disclaimer: string;
  matched_rule: {
    public_id: string;
    name: string;
  } | null;
  unit_estimate: number;
  total_estimate: number;
  quantity: number;
  currency: string;
}
