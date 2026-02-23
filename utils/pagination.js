/**
 * Pagination utility for API responses
 * Handles parsing, validation, and calculation of pagination parameters
 */

/**
 * Parse and validate pagination parameters from query
 * @param {Object} query - Express query object
 * @returns {Object} - { page, limit, skip }
 */
const getPaginationParams = (query) => {
  const MAX_LIMIT = 100;
  const DEFAULT_LIMIT = 20;

  // Parse page (default 1)
  let page = parseInt(query.page) || 1;
  if (page < 1) page = 1;

  // Parse limit (default 20, max 100)
  let limit = parseInt(query.limit) || DEFAULT_LIMIT;
  if (limit < 1) limit = 1;
  if (limit > MAX_LIMIT) limit = MAX_LIMIT;

  // Calculate skip for database query
  const skip = (page - 1) * limit;

  return {
    page,
    limit,
    skip,
  };
};

/**
 * Build paginated response object
 * @param {Array} data - The array of documents
 * @param {number} total - Total count of documents in collection
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} - Paginated response with metadata
 */
const buildPaginatedResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Parse sort parameter from query
 * Supports format: "-createdAt" for descending, "name" for ascending
 * @param {string} sortQuery - Sort query parameter
 * @returns {Object} - Mongoose sort object
 */
const parseSortParam = (sortQuery) => {
  if (!sortQuery) {
    return { createdAt: -1 }; // Default: newest first
  }

  const sortObj = {};

  // Handle comma-separated sort params
  sortQuery.split(',').forEach((field) => {
    const trimmed = field.trim();
    if (trimmed.startsWith('-')) {
      // Descending
      sortObj[trimmed.slice(1)] = -1;
    } else {
      // Ascending
      sortObj[trimmed] = 1;
    }
  });

  return sortObj;
};

module.exports = {
  getPaginationParams,
  buildPaginatedResponse,
  parseSortParam,
};
