const logger = require('../utils/logger');

/**
 * Audit middleware to log all sensitive operations
 * Logs authenticated requests and tracks user actions
 * @param {string} action - Action name (e.g., 'PRODUCT_CREATE', 'STORE_DELETE')
 * @param {string|null} resourceType - Type of resource affected (optional)
 * @returns {function} Express middleware
 */
function auditLog(action, resourceType = null) {
  return (req, res, next) => {
    // Store action info in request for logging in response
    req.audit = {
      action,
      resourceType,
      startTime: Date.now(),
    };

    // Capture the original res.json and res.status methods
    const originalJson = res.json.bind(res);
    const originalStatus = res.status.bind(res);

    // Track status code
    let statusCode = 200;
    res.status = function (code) {
      statusCode = code;
      return originalStatus(code);
    };

    // Override json response to log after response is sent
    res.json = function (data) {
      // Log the audit event
      const duration = Date.now() - req.audit.startTime;
      const ipAddress = req.ip || req.connection.remoteAddress;
      const userId = req.user?.userId;
      const email = req.user?.email;

      const auditEntry = {
        timestamp: new Date().toISOString(),
        action: req.audit.action,
        statusCode,
        method: req.method,
        url: req.originalUrl,
        duration, // in milliseconds
        ipAddress,
        userAgent: req.get('user-agent'),
      };

      // Add optional fields if available
      if (userId) auditEntry.userId = userId;
      if (email) auditEntry.email = email;
      if (req.audit.resourceType) auditEntry.resourceType = req.audit.resourceType;
      if (req.params.id) auditEntry.resourceId = req.params.id;
      if (req.params.storeId) auditEntry.storeId = req.params.storeId;

      // Determine log level based on status code and action
      if (statusCode >= 400) {
        logger.warn(`AUDIT: ${action} FAILED`, auditEntry);
      } else if (['DELETE', 'UPDATE', 'POST'].includes(req.method)) {
        logger.audit(action, auditEntry);
      } else {
        logger.info(`AUDIT: ${action}`, auditEntry);
      }

      // Call original json method
      return originalJson(data);
    };

    next();
  };
}

/**
 * Log authentication attempts
 * @returns {function} Express middleware
 */
function auditAuthAttempt() {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    let statusCode = 200;

    const originalStatus = res.status.bind(res);
    res.status = function (code) {
      statusCode = code;
      return originalStatus(code);
    };

    res.json = function (data) {
      const ipAddress = req.ip || req.connection.remoteAddress;
      const email = req.body?.email;

      if (statusCode >= 400 && req.path.includes('login')) {
        // Failed login attempt
        logger.authFailure(email, 'Invalid credentials or user not found', ipAddress);
      } else if (statusCode === 201 && req.path.includes('register')) {
        // Successful registration
        logger.audit('USER_REGISTERED', {
          email,
          ipAddress,
          timestamp: new Date().toISOString(),
        });
      } else if (statusCode === 200 && req.path.includes('login')) {
        // Successful login
        logger.audit('USER_LOGIN', {
          email,
          ipAddress,
          timestamp: new Date().toISOString(),
        });
      }

      return originalJson(data);
    };

    next();
  };
}

/**
 * Log password-related operations
 * @returns {function} Express middleware
 */
function auditPasswordChange() {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    let statusCode = 200;

    const originalStatus = res.status.bind(res);
    res.status = function (code) {
      statusCode = code;
      return originalStatus(code);
    };

    res.json = function (data) {
      const userId = req.user?.userId;
      const ipAddress = req.ip || req.connection.remoteAddress;

      if (statusCode >= 400) {
        logger.security('PASSWORD_CHANGE_FAILED', {
          userId,
          ipAddress,
          reason: data?.message || 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      } else if (statusCode === 200) {
        logger.security('PASSWORD_CHANGED', {
          userId,
          ipAddress,
          timestamp: new Date().toISOString(),
          type: 'SECURITY',
        });
      }

      return originalJson(data);
    };

    next();
  };
}

module.exports = {
  auditLog,
  auditAuthAttempt,
  auditPasswordChange,
};
