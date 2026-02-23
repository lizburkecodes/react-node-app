/**
 * Custom class for structured error handling
 * Distinguishes between operational and programming errors
 * Provides error code and HTTP status code
 */

class AppError extends Error {
  /**
   * Create an AppError instance
   * @param {string} message - User-friendly error message
   * @param {number} statusCode - HTTP status code (400-599)
   * @param {string} code - Error code for client (e.g., AUTH_001, VALIDATION_001)
   * @param {boolean} isOperational - Whether error is operational vs programming error
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON response format
   * @returns {object} Formatted error response
   */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      // Only include stack trace in development
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

// ============================================================================
// ERROR CONSTANTS
// ============================================================================

// Authentication Errors (AUTH_*)
AppError.INVALID_CREDENTIALS = (message = 'Invalid email or password') =>
  new AppError(message, 401, 'AUTH_001', true);

AppError.UNAUTHORIZED = (message = 'You must be logged in to access this resource') =>
  new AppError(message, 401, 'AUTH_002', true);

AppError.TOKEN_EXPIRED = (message = 'Your session has expired. Please log in again') =>
  new AppError(message, 401, 'AUTH_003', true);

AppError.TOKEN_INVALID = (message = 'Invalid or malformed token') =>
  new AppError(message, 401, 'AUTH_004', true);

AppError.EMAIL_ALREADY_EXISTS = (message = 'Email is already registered') =>
  new AppError(message, 409, 'AUTH_005', true);

AppError.ACCOUNT_LOCKED = (message = 'Account is locked due to too many login attempts') =>
  new AppError(message, 429, 'AUTH_006', true);

// Validation Errors (VALIDATION_*)
AppError.INVALID_EMAIL = (message = 'Invalid email format') =>
  new AppError(message, 400, 'VALIDATION_001', true);

AppError.INVALID_PASSWORD = (message = 'Password must be at least 8 characters') =>
  new AppError(message, 400, 'VALIDATION_002', true);

AppError.PASSWORD_MISMATCH = (message = 'Passwords do not match') =>
  new AppError(message, 400, 'VALIDATION_003', true);

AppError.INVALID_DISPLAY_NAME = (message = 'Display name must be 2-100 characters') =>
  new AppError(message, 400, 'VALIDATION_004', true);

AppError.INVALID_PRODUCT_NAME = (message = 'Product name must be 1-200 characters') =>
  new AppError(message, 400, 'VALIDATION_005', true);

AppError.INVALID_QUANTITY = (message = 'Quantity must be a number between 0-999999') =>
  new AppError(message, 400, 'VALIDATION_006', true);

AppError.INVALID_LOCATION = (message = 'Location must be 3-500 characters') =>
  new AppError(message, 400, 'VALIDATION_007', true);

AppError.INVALID_COORDINATES = (message = 'Invalid latitude or longitude') =>
  new AppError(message, 400, 'VALIDATION_008', true);

AppError.INVALID_SEARCH_QUERY = (message = 'Search query is invalid') =>
  new AppError(message, 400, 'VALIDATION_009', true);

AppError.INVALID_RADIUS = (message = 'Radius must be between 0-50000 meters') =>
  new AppError(message, 400, 'VALIDATION_010', true);

AppError.MISSING_REQUIRED_FIELD = (field = 'field') =>
  new AppError(`${field} is required`, 400, 'VALIDATION_011', true);

// Resource Not Found Errors (NOT_FOUND_*)
AppError.USER_NOT_FOUND = (message = 'User not found') =>
  new AppError(message, 404, 'NOT_FOUND_001', true);

AppError.STORE_NOT_FOUND = (message = 'Store not found') =>
  new AppError(message, 404, 'NOT_FOUND_002', true);

AppError.PRODUCT_NOT_FOUND = (message = 'Product not found') =>
  new AppError(message, 404, 'NOT_FOUND_003', true);

AppError.RESET_TOKEN_NOT_FOUND = (message = 'Password reset token not found or expired') =>
  new AppError(message, 404, 'NOT_FOUND_004', true);

// Permission/Authorization Errors (FORBIDDEN_*)
AppError.INSUFFICIENT_PERMISSIONS = (message = 'You do not have permission to access this resource') =>
  new AppError(message, 403, 'FORBIDDEN_001', true);

AppError.CANNOT_MODIFY_OTHER_USER = (message = 'You can only modify your own resources') =>
  new AppError(message, 403, 'FORBIDDEN_002', true);

AppError.STORE_NOT_OWNED_BY_USER = (message = 'You do not own this store') =>
  new AppError(message, 403, 'FORBIDDEN_003', true);

AppError.PRODUCT_NOT_IN_STORE = (message = 'Product does not belong to your store') =>
  new AppError(message, 403, 'FORBIDDEN_004', true);

// Rate Limiting Errors (RATE_LIMIT_*)
AppError.RATE_LIMIT_EXCEEDED = (message = 'Too many requests. Please try again later') =>
  new AppError(message, 429, 'RATE_LIMIT_001', true);

// Database/Server Errors (DATABASE_*, SERVER_*)
AppError.DATABASE_ERROR = (message = 'Database operation failed') =>
  new AppError(message, 500, 'DATABASE_001', true);

AppError.DUPLICATE_KEY = (field = 'field') =>
  new AppError(`${field} already exists`, 409, 'DATABASE_002', true);

AppError.INTERNAL_SERVER_ERROR = (message = 'An unexpected error occurred. Please try again later') =>
  new AppError(message, 500, 'SERVER_001', false); // Programming error, not operational

AppError.EXTERNAL_API_ERROR = (message = 'External service is temporarily unavailable') =>
  new AppError(message, 503, 'SERVER_002', true);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if error is an AppError (operational error)
 * @param {Error} error
 * @returns {boolean}
 */
function isAppError(error) {
  return error instanceof AppError;
}

/**
 * Check if error is operational (safe to send to client)
 * @param {Error} error
 * @returns {boolean}
 */
function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Convert MongoDB errors to AppErrors
 * @param {Error} error - MongoDB/Mongoose error
 * @returns {AppError|null}
 */
function handleMongooseError(error) {
  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return AppError.DUPLICATE_KEY(field);
  }

  // Validation error
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors)
      .map(err => err.message)
      .join(', ');
    return new AppError(messages, 400, 'VALIDATION_999', true);
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return new AppError('Invalid resource ID format', 400, 'VALIDATION_012', true);
  }

  return null;
}

module.exports = {
  AppError,
  isAppError,
  isOperationalError,
  handleMongooseError
};
