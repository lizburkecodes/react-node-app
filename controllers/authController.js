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

module.exports = {
  registerUser,
  loginUser,
  getMe,
};