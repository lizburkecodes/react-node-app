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

// Register + Login
router.post('/register', registerUser);
router.post('/login', loginLimiter, loginUser);

// Get current user (requires JWT)
router.get('/me', authMiddleware, getMe);

// Change password (requires JWT)
router.put('/change-password', authMiddleware, changePassword);

// forgot password
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
// reset password flow
router.post("/reset-password", resetPasswordLimiter, resetPassword);

module.exports = router;