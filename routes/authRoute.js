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

// Register + Login
router.post('/register', registerUser);
router.post('/login', loginUser);

// Get current user (requires JWT)
router.get('/me', authMiddleware, getMe);

// Change password (requires JWT)
router.put('/change-password', authMiddleware, changePassword);

// forgot password
router.post("/forgot-password", forgotPassword);
// reset password flow
router.post("/reset-password", resetPassword);

module.exports = router;