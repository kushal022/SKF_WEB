const { z } = require('zod');

/**
 * Registration request body schema
 */
const registerSchema = z
  .object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(1, 'Name is required')
      .max(150, 'Name must not exceed 150 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email address format')
      .max(255, 'Email must not exceed 255 characters')
      .transform((val) => val.toLowerCase()),
    phone: z
      .string()
      .trim()
      .max(20, 'Phone must not exceed 20 characters')
      .optional()
      .nullable(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters long')
      .max(72, 'Password must not exceed 72 characters'),
  })
  .strict(); // Rejects extraneous fields such as 'role' or 'status'

/**
 * Login request body schema
 */
const loginSchema = z
  .object({
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .email('Invalid email address format')
      .transform((val) => val.toLowerCase()),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  })
  .strict();

/**
 * Revoke session URL parameter schema
 */
const revokeSessionParamSchema = z.object({
  publicId: z.string().uuid('Invalid session identifier format'),
});

/**
 * Express middleware generator to validate request target against a Zod schema.
 *
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'params'|'query'} [target='body'] - Request property to validate
 * @returns {Function} Express middleware
 */
const validate = (schema, target = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[target]);
  if (!result.success) {
    return next(result.error);
  }
  req[target] = result.data;
  next();
};

module.exports = {
  registerSchema,
  loginSchema,
  revokeSessionParamSchema,
  validate,
};
