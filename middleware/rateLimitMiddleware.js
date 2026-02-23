const rateLimit = require('express-rate-limit');

/**
 * Helper function to create a key generator for rate limiting
 * For authenticated endpoints, uses userId + IP to prevent distributed attacks
 * For public endpoints, omits keyGenerator to use express-rate-limit's default IP handling
 */
const createKeyGenerator = (useAuth = false) => {
  if (!useAuth) {
    // Return undefined so express-rate-limit uses its default IP handler (IPv6 safe)
    return undefined;
  }
  // For authenticated endpoints, combine userId with IP
  return (req, res) => {
    if (req.user?.userId) {
      // Use a simple colon-separated key
      return `user:${req.user.userId}`;
    }
    // Fallback - should not happen if middleware is ordered correctly
    return 'anonymous';
  };
};

// ============================================================================
// AUTHENTICATION LIMITERS
// ============================================================================

// Login rate limiter: 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
});

// Register rate limiter: 5 per 10 minutes per IP (prevent spam accounts)
const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: 'Too many registration attempts, please try again after 10 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Forgot password rate limiter: 5 attempts per hour per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset requests, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Reset password rate limiter: 5 attempts per hour per IP
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many password reset attempts, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// ============================================================================
// STORE & PRODUCT LIMITERS (User-based for authenticated endpoints)
// ============================================================================

// Create store limiter: 10 per hour per user (prevent spam store creation)
const createStoreLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'You have created too many stores. Please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: createKeyGenerator(true),
});

// Update store limiter: 10 per hour per user
const updateStoreLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Too many store updates. Please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: createKeyGenerator(true),
});

// Create product limiter: 30 per hour per user (prevent product spam)
const createProductLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'You have created too many products. Please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: createKeyGenerator(true),
});

// Update product limiter: 30 per hour per user
const updateProductLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many product updates. Please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: createKeyGenerator(true),
});

// Delete product limiter: 30 per hour per user
const deleteProductLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: 'Too many product deletions. Please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  keyGenerator: createKeyGenerator(true),
});

// ============================================================================
// SEARCH & PUBLIC API LIMITERS
// ============================================================================

// Search limiter: 50 per minute per IP (prevent expensive geo queries DoS)
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: 'Too many search requests. Please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Image suggestion limiter: 20 per minute per IP (calls external Pexels API)
const imageSuggestionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many image requests. Please try again after a minute',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// General API limiter: 1000 per hour per IP (fallback for other endpoints)
const generalApiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: 'Too many requests to the API, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

module.exports = {
  // Auth
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  // Store
  createStoreLimiter,
  updateStoreLimiter,
  // Product
  createProductLimiter,
  updateProductLimiter,
  deleteProductLimiter,
  // Search & Public
  searchLimiter,
  imageSuggestionLimiter,
  generalApiLimiter,
};
