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

// Register + Login with validation
router.post('/register', validateAuthRequest, registerUser);
router.post('/login', loginLimiter, validateAuthRequest, loginUser);

// Get current user (requires JWT)
router.get('/me', authMiddleware, getMe);

// Change password (requires JWT)
router.put('/change-password', authMiddleware, validateChangePasswordRequest, changePassword);

// forgot password
router.post("/forgot-password", forgotPasswordLimiter, validateForgotPasswordRequest, forgotPassword);
// reset password flow
router.post("/reset-password", resetPasswordLimiter, validateResetPasswordRequest, resetPassword);

module.exports = router;