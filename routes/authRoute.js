const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');
const {
  loginLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} = require('../middleware/rateLimitMiddleware');

const {
  validateAuthRequest,
  validateChangePasswordRequest,
  validateForgotPasswordRequest,
  validateResetPasswordRequest,
} = require('../middleware/validationMiddleware');

const {
  auditAuthAttempt,
  auditPasswordChange,
} = require('../middleware/auditMiddleware');

// Register + Login with validation and audit logging
router.post('/register', validateAuthRequest, auditAuthAttempt(), registerUser);
router.post('/login', loginLimiter, validateAuthRequest, auditAuthAttempt(), loginUser);

// Get current user (requires JWT)
router.get('/me', authMiddleware, getMe);

// Change password (requires JWT) with audit logging
router.put('/change-password', authMiddleware, validateChangePasswordRequest, auditPasswordChange(), changePassword);

// forgot password with audit
router.post("/forgot-password", forgotPasswordLimiter, validateForgotPasswordRequest, forgotPassword);
// reset password flow with audit
router.post("/reset-password", resetPasswordLimiter, validateResetPasswordRequest, resetPassword);

module.exports = router;