const { AppError, isAppError, isOperationalError, handleMongooseError } = require('../utils/appError');
const logger = require('../utils/logger');

/**
 * Global error handling middleware
 * Must be registered AFTER all other routes and middleware
 * Express requires exactly 4 parameters (err, req, res, next) to recognize it as error middleware
 * @param {Error} err - The error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const errorMiddleware = (err, req, res, next) => {
  let appError = err;

  // Convert known database/validation errors to AppError
  if (!isAppError(err)) {
    // Try to handle Mongoose errors
    const mongooseError = handleMongooseError(err);
    if (mongooseError) {
      appError = mongooseError;
    } else if (err.name === 'JsonWebTokenError') {
      appError = AppError.TOKEN_INVALID();
    } else if (err.name === 'TokenExpiredError') {
      appError = AppError.TOKEN_EXPIRED();
    } else {
      // Unknown error - don't expose details in production
      appError = new AppError(
        process.env.NODE_ENV === 'development' 
          ? err.message 
          : 'An unexpected error occurred. Please try again later.',
        500,
        'SERVER_001',
        false // Mark as non-operational (programming error)
      );
    }
  }

  // Build error context for logging
  const errorContext = {
    code: appError.code,
    statusCode: appError.statusCode,
    isOperational: appError.isOperational,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
    ...(req.user && { userId: req.user._id })
  };

  // Log error details server-side (always log full details)
  if (appError.isOperational) {
    logger.warn(`Operational error: ${appError.message}`, {
      ...errorContext,
      timestamp: new Date().toISOString()
    });
  } else {
    // Non-operational errors (programming errors) should be logged as errors
    logger.error(`Non-operational error: ${appError.message}`, {
      ...errorContext,
      stack: appError.stack,
      originalError: err.message,
      timestamp: new Date().toISOString()
    });
  }

  // Send response to client
  // Never expose stack trace or internal details in production
  const response = {
    code: appError.code,
    message: appError.message,
    statusCode: appError.statusCode,
    ...(process.env.NODE_ENV === 'development' && { 
      stack: appError.stack,
      details: err.message !== appError.message ? err.message : undefined
    })
  };

  // Remove undefined fields
  Object.keys(response).forEach(key => response[key] === undefined && delete response[key]);

  res.status(appError.statusCode).json(response);
};

module.exports = errorMiddleware;