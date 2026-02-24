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

// Register with rate limiting and validation
router.post('/register', registerLimiter, validateBody(registerSchema), registerUser);
// Login with rate limiting and validation
router.post('/login', loginLimiter, validateBody(loginSchema), loginUser);

// Refresh access token (no auth required, uses refresh token in body)
router.post('/refresh', validateBody(refreshTokenSchema), refreshAccessToken);

// Get current user (requires JWT)
router.get('/me', authMiddleware, getMe);

// Logout (requires JWT)
router.post('/logout', authMiddleware, logout);

// Change password (requires JWT) with audit logging
router.put('/change-password', authMiddleware, validateBody(changePasswordSchema), auditPasswordChange(), changePassword);

// forgot password with rate limiting
router.post("/forgot-password", forgotPasswordLimiter, validateBody(forgotPasswordSchema), forgotPassword);
// reset password flow with rate limiting
router.post("/reset-password", resetPasswordLimiter, validateBody(resetPasswordSchema), resetPassword);

module.exports = router;