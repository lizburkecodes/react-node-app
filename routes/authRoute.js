const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getMe,
} = require('../controllers/authController');

const authMiddleware = require('../middleware/authMiddleware');

// Register + Login
router.post('/register', registerUser);
router.post('/login', loginUser);

// Get current user (requires JWT)
router.get('/me', authMiddleware, getMe);

module.exports = router;