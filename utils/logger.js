/**
 * Simple structured logger for the application
 * Logs to console in development, can be extended to use Winston/Pino in production
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * Format log entry with timestamp and level
 * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
 * @param {string} message - Log message
 * @param {object} context - Additional context data
 * @returns {object} Formatted log entry
 */
function formatLogEntry(level, message, context = {}) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context
  };
}

/**
 * Log debug message
 * @param {string} message
 * @param {object} context
 */
function debug(message, context = {}) {
  if (process.env.LOG_LEVEL === 'DEBUG') {
    console.log(JSON.stringify(formatLogEntry(LOG_LEVELS.DEBUG, message, context)));
  }
}

/**
 * Log info message
 * @param {string} message
 * @param {object} context
 */
function info(message, context = {}) {
  console.log(JSON.stringify(formatLogEntry(LOG_LEVELS.INFO, message, context)));
}

/**
 * Log warning message
 * @param {string} message
 * @param {object} context
 */
function warn(message, context = {}) {
  console.warn(JSON.stringify(formatLogEntry(LOG_LEVELS.WARN, message, context)));
}

/**
 * Log error message
 * @param {string} message
 * @param {object} context
 */
function error(message, context = {}) {
  console.error(JSON.stringify(formatLogEntry(LOG_LEVELS.ERROR, message, context)));
}

module.exports = {
  debug,
  info,
  warn,
  error
};
