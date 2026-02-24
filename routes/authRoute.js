const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logout,
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require('../middleware/rateLimitMiddleware');

const {
  validateBody,
  validateQuery,
} = require('../middleware/validationMiddleware');

const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  logoutSchema,
} = require('../schemas/authSchemas');

const {
  auditAuthAttempt,
  auditPasswordChange,
} = require('../middleware/auditMiddleware');

const {
  csrfProtection,
  csrfTokenHandler,
} = require('../middleware/csrfMiddleware');

// Get CSRF token (no auth required, public endpoint)
// Client must call this before making state-changing requests
router.get('/csrf-token', csrfProtection, csrfTokenHandler);

// Register with CSRF, rate limiting and validation
router.post('/register', csrfProtection, registerLimiter, validateBody(registerSchema), registerUser);
// Login with CSRF, rate limiting and validation
router.post('/login', csrfProtection, loginLimiter, validateBody(loginSchema), loginUser);

// Refresh access token (no auth required, uses refresh token in body)
router.post('/refresh', csrfProtection, validateBody(refreshTokenSchema), refreshAccessToken);

// Get current user (requires JWT)
router.get('/me', authMiddleware, getMe);

// Logout (requires JWT) with CSRF
router.post('/logout', authMiddleware, csrfProtection, logout);

// Change password (requires JWT) with CSRF, validation, and audit logging
router.put('/change-password', authMiddleware, csrfProtection, validateBody(changePasswordSchema), auditPasswordChange(), changePassword);

// forgot password with CSRF, rate limiting
router.post("/forgot-password", csrfProtection, forgotPasswordLimiter, validateBody(forgotPasswordSchema), forgotPassword);
// reset password flow with CSRF, rate limiting
router.post("/reset-password", csrfProtection, resetPasswordLimiter, validateBody(resetPasswordSchema), resetPassword);

module.exports = router;