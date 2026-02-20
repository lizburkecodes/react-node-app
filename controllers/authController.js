const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

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

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Email is required");
  }

  const user = await User.findOne({ email });

  // Always respond success to prevent email enumeration attacks
  if (!user) {
    return res.status(200).json({
      message: "If that email exists, a reset link has been sent.",
    });
  }

  // Generate secure random token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token before saving
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 15 * 60 * 1000; // 15 minutes

  await user.save();

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  await sendEmail({
    to: user.email,
    subject: "Password Reset",
    html: `
      <h3>Password Reset</h3>
      <p>You requested a password reset.</p>
      <p>This link expires in 15 minutes.</p>
      <a href="${resetUrl}">${resetUrl}</a>
    `,
  });

  res.status(200).json({
    message: "If that email exists, a reset link has been sent.",
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

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    res.status(400);
    throw new Error("Token and newPassword are required");
  }

  if (newPassword.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  // Hash incoming token to compare with stored hash
  const hashedToken = require("crypto")
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  // Hash and update password
  user.passwordHash = await bcrypt.hash(newPassword, 10);

  // Clear reset fields
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Track password change time
  user.passwordChangedAt = Date.now();

  await user.save();

  res.status(200).json({
    message: "Password has been reset successfully",
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
};