/**
 * Pagination helper utilities
 */

/**
 * Extracts and sanitizes pagination query parameters.
 *
 * @param {object} query - Express request query object
 * @param {number} [defaultLimit=20] - Default page limit
 * @param {number} [maxLimit=100] - Hard cap for limit
 * @returns {{ page: number, limit: number, offset: number }}
 */
const parsePagination = (query = {}, defaultLimit = 20, maxLimit = 100) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const requestedLimit = parseInt(query.limit, 10) || defaultLimit;
  const limit = Math.min(maxLimit, Math.max(1, requestedLimit));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Formats a standardized paginated response data payload.
 *
 * @param {object} params
 * @param {Array} params.items - List of items for current page
 * @param {number} params.total - Total items matching filter
 * @param {number} params.page - Current page number
 * @param {number} params.limit - Current page limit
 * @returns {object} Formatted { items, pagination }
 */
const formatPaginatedResponse = ({ items, total, page, limit }) => {
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

module.exports = {
  parsePagination,
  formatPaginatedResponse,
};
