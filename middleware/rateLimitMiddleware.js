const rateLimit = require('express-rate-limit');

// Login rate limiter: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
});

// Forgot password rate limiter: 3 attempts per hour per IP
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3, // limit each IP to 3 requests per hour
  message: 'Too many password reset requests, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests to prevent enumeration
});

// Reset password rate limiter: 5 attempts per hour per IP
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5, // limit each IP to 5 requests per hour
  message: 'Too many password reset attempts, please try again after 1 hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

module.exports = {
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
};
