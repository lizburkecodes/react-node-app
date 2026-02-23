/**
 * Structured logger using Winston
 * Provides logging to files and console with appropriate formatting
 * Supports audit logging, security events, and database errors
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'little-free-finder-api' },
  transports: [
    // Write all logs with level `error` and below to `error.log`
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs with level `warn` and below to `combined.log`
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write audit logs to separate file
    new winston.transports.File({
      filename: path.join(logsDir, 'audit.log'),
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let metaStr = '';
          if (Object.keys(meta).length > 0 && meta.service !== 'little-free-finder-api') {
            metaStr = JSON.stringify(meta, null, 2);
          }
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    })
  );
}

/**
 * Log audit event (for sensitive operations)
 * @param {string} action - Action name (e.g., USER_LOGIN, PRODUCT_CREATE)
 * @param {object} meta - Additional metadata
 */
logger.audit = function (action, meta = {}) {
  this.info(action, {
    ...meta,
    type: 'AUDIT',
  });
};

/**
 * Log failed authentication attempt
 * @param {string} email - Email or identifier
 * @param {string} reason - Reason for failure
 * @param {string} ipAddress - IP address of request
 */
logger.authFailure = function (email, reason, ipAddress) {
  this.warn('AUTH_FAILURE', {
    email,
    reason,
    ipAddress,
    type: 'SECURITY',
  });
};

/**
 * Log security-related event
 * @param {string} event - Event name
 * @param {object} meta - Event metadata
 */
logger.security = function (event, meta = {}) {
  this.warn(event, {
    ...meta,
    type: 'SECURITY',
  });
};

/**
 * Log database error
 * @param {string} operation - Database operation
 * @param {Error} error - Error object
 * @param {object} meta - Additional context
 */
logger.dbError = function (operation, error, meta = {}) {
  this.error(`DATABASE_ERROR: ${operation}`, {
    error: error.message,
    stack: error.stack,
    ...meta,
    type: 'DATABASE',
  });
};

module.exports = logger;
