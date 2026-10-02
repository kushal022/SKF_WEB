/**
 * Express validation middleware using Zod schema
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate
 * @param {'body'|'params'|'query'} [target='body'] - Request target to validate
 * @returns {Function} Express middleware handler
 */
const validate = (schema, target = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[target]);
  if (!result.success) {
    return next(result.error);
  }
  if (target === 'body') {
    req.body = result.data;
  } else {
    Object.assign(req[target], result.data);
  }
  next();
};

module.exports = validate;
