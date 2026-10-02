const { z } = require('zod');

const createEstimatorRuleSchema = z
  .object({
    name: z
      .string({ required_error: 'Rule name is required' })
      .trim()
      .min(1, 'Rule name is required')
      .max(150, 'Rule name must not exceed 150 characters'),
    product_type: z.string().trim().max(150).optional().nullable(),
    material: z.string().trim().max(150).optional().nullable(),
    finish: z.string().trim().max(150).optional().nullable(),
    dimension_multiplier: z.union([z.number(), z.string()]).optional().nullable(),
    material_rate: z.union([z.number(), z.string()]).optional().nullable(),
    finish_adjustment: z.union([z.number(), z.string()]).optional().nullable(),
    base_rate: z.union([z.number(), z.string()]).optional().nullable(),
    rule_config: z.any().optional().nullable(),
    priority: z.number().int().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

const updateEstimatorRuleSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    product_type: z.string().trim().max(150).optional().nullable(),
    material: z.string().trim().max(150).optional().nullable(),
    finish: z.string().trim().max(150).optional().nullable(),
    dimension_multiplier: z.union([z.number(), z.string()]).optional().nullable(),
    material_rate: z.union([z.number(), z.string()]).optional().nullable(),
    finish_adjustment: z.union([z.number(), z.string()]).optional().nullable(),
    base_rate: z.union([z.number(), z.string()]).optional().nullable(),
    rule_config: z.any().optional().nullable(),
    priority: z.number().int().optional(),
    is_active: z.boolean().optional(),
  })
  .strict();

const calculateEstimatorSchema = z
  .object({
    product_type: z.string().trim().max(150).optional().nullable(),
    width: z.number().positive('Width must be greater than 0'),
    length: z.number().positive('Length must be greater than 0'),
    height: z.number().min(0).optional().default(0),
    dimension_unit: z.enum(['mm', 'cm', 'in', 'ft', 'm']).default('mm'),
    material: z.string().trim().max(150).optional().nullable(),
    finish: z.string().trim().max(150).optional().nullable(),
    quantity: z.number().int().min(1).default(1),
  })
  .strict();

const estimatorParamSchema = z.object({
  publicId: z.string().uuid('Invalid estimator rule identifier format'),
});

module.exports = {
  createEstimatorRuleSchema,
  updateEstimatorRuleSchema,
  calculateEstimatorSchema,
  estimatorParamSchema,
};
