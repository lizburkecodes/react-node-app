const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

// Helper: sign JWT
const signToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in environment variables');
  }

  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

// POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password || !displayName) {
    res.status(400);
    throw new Error('email, password, and displayName are required');
  }

  // Normalize email
  const normalizedEmail = String(email).toLowerCase().trim();

  // Check if user exists
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    res.status(409);
    throw new Error('Email is already in use');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    email: normalizedEmail,
    passwordHash,
    displayName: String(displayName).trim(),
  });

  const token = signToken(user._id);

  res.status(201).json({
    token,
    user: {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
    },
  });
});

// POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('email and password are required');
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const token = signToken(user._id);

  res.status(200).json({
    token,
    user: {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
    },
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  // authMiddleware should set req.user = { userId }
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const user = await User.findById(userId).select('_id email displayName');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json(user);
});

// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401);
    throw new Error('Not authorized');
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('currentPassword and newPassword are required');
  }

  if (String(newPassword).length < 8) {
    res.status(400);
    throw new Error("New password must be at least 8 characters");
  }

  if (currentPassword === newPassword) {
    res.status(400);
    throw new Error('New password must be different from old password');
  }

  // Find user with passwordHash included
  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Verify old password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  // Hash and update new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = newPasswordHash;
  await user.save();

  res.status(200).json({
    message: 'Password updated successfully',
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  changePassword,
};