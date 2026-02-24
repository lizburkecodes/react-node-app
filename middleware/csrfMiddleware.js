const csrf = require('csurf');
const cookieParser = require('cookie-parser');

/**
 * CSRF Protection Middleware
 * Protects against Cross-Site Request Forgery attacks
 * 
 * Strategy:
 * - Uses "double-submit cookie" pattern with CSRF tokens
 * - Token must be provided in request headers (X-CSRF-Token) for state-changing requests
 * - Token stored in httpOnly cookie by csurf, validated on each request
 * - GET requests (safe) are excluded from validation
 */

// Initialize CSRF protection middleware
// Uses cookies to store the CSRF token
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,      // Prevent JavaScript access
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',  // Prevent cross-site cookie access
    path: '/',
    maxAge: 60 * 60 * 1000, // 1 hour
  },
});

/**
 * Get CSRF token endpoint middleware
 * Generates a new CSRF token and returns it to client
 * Client must include this token in X-CSRF-Token header for state-changing requests
 */
const csrfTokenHandler = (req, res) => {
  try {
    // Generate a new CSRF token
    const token = req.csrfToken();
    
    // Return token to client
    res.json({ 
      csrfToken: token,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to generate CSRF token',
      message: error.message 
    });
  }
};

/**
 * Error handler for CSRF validation failures
 * Called when CSRF token is missing or invalid
 */
const csrfErrorHandler = (err, req, res, next) => {
  // Check if error is a CSRF error
  if (err.code === 'EBADCSRFTOKEN') {
    // CSRF token errors
    res.status(403).json({
      code: 'CSRF_INVALID',
      message: 'Invalid CSRF token. Please try again.',
      statusCode: 403,
    });
  } else {
    // Pass other errors to next handler
    next(err);
  }
};

module.exports = {
  csrfProtection,
  csrfTokenHandler,
  csrfErrorHandler,
};
