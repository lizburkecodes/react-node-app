const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { AppError } = require('../utils/appError');

const User = require('../models/user');

// Helper: validate password strength
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const maxLength = 64;

  if (password.length < minLength) {
    throw AppError.INVALID_PASSWORD(`Password must be at least ${minLength} characters`);
  }
  if (password.length > maxLength) {
    throw AppError.INVALID_PASSWORD(`Password must not exceed ${maxLength} characters`);
  }
};

// Helper: sign JWT Access Token (15 minutes)
const signAccessToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT_SECRET is not set in environment variables', 500, 'CONFIG_001', false);
  }

  return jwt.sign({ userId }, secret, { expiresIn: '15m' });
};

// Helper: sign JWT Refresh Token (7 days)
const signRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new AppError('JWT_REFRESH_SECRET is not set in environment variables', 500, 'CONFIG_001', false);
  }

  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

// Helper: store refresh token in database and return it
const createRefreshToken = async (user) => {
  const refreshToken = signRefreshToken(user._id);
  
  // Add refresh token to user's tokens array
  user.refreshTokens.push({
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  });

  await user.save();
  return refreshToken;
};

// POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, displayName } = req.validated; // Already validated & sanitized

  // Check if user exists
  const existing = await User.findOne({ email });
  if (existing) {
    throw AppError.EMAIL_ALREADY_EXISTS();
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    passwordHash,
    displayName,
  });

  // Create access and refresh tokens
  const accessToken = signAccessToken(user._id);
  const refreshToken = await createRefreshToken(user);

  res.status(201).json({
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
    },
  });
});

// POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.validated; // Already validated & sanitized

  const user = await User.findOne({ email });
  if (!user) {
    throw AppError.INVALID_CREDENTIALS();
  }

  // Check if account is locked
  if (user.accountLockedUntil && user.accountLockedUntil > Date.now()) {
    throw AppError.ACCOUNT_LOCKED();
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    // Increment failed login attempts
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts for 30 minutes
    if (user.loginAttempts >= 5) {
      user.accountLockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
    
    await user.save();
    throw AppError.INVALID_CREDENTIALS();
  }

  // Reset login attempts on successful login
  user.loginAttempts = 0;
  user.accountLockedUntil = undefined;
  user.lastLoginAt = new Date();
  await user.save();

  // Create access and refresh tokens
  const accessToken = signAccessToken(user._id);
  const refreshToken = await createRefreshToken(user);

  res.status(200).json({
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
    },
  });
});

// POST /api/auth/forgot-password
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.validated; // Already validated & sanitized

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
    throw AppError.UNAUTHORIZED();
  }

  const user = await User.findById(userId).select('_id email displayName');
  if (!user) {
    throw AppError.USER_NOT_FOUND();
  }

  res.status(200).json(user);
});

// PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw AppError.UNAUTHORIZED();
  }

  const { currentPassword, newPassword } = req.validated; // Already validated & sanitized

  if (currentPassword === newPassword) {
    throw new AppError('New password must be different from old password', 400, 'VALIDATION_013', true);
  }

  // Find user with passwordHash included
  const user = await User.findById(userId);
  if (!user) {
    throw AppError.USER_NOT_FOUND();
  }

  // Verify old password
  const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw AppError.INVALID_CREDENTIALS('Current password is incorrect');
  }

  // Hash and update new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = newPasswordHash;
  user.passwordChangedAt = Date.now();
  user.lastPasswordChangeAt = new Date();
  await user.save();

  res.status(200).json({
    message: 'Password updated successfully',
  });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.validated; // Already validated & sanitized

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
    throw AppError.RESET_TOKEN_NOT_FOUND();
  }

  // Hash and update password
  user.passwordHash = await bcrypt.hash(newPassword, 10);

  // Clear reset fields
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Track password change time
  user.passwordChangedAt = Date.now();
  user.lastPasswordChangeAt = new Date();

  // Reset login attempts since password was reset
  user.loginAttempts = 0;
  user.accountLockedUntil = undefined;

  await user.save();

  res.status(200).json({
    message: "Password has been reset successfully",
  });
});

// POST /api/auth/refresh
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token is required', 400, 'VALIDATION_014', true);
  }

  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, secret);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401, 'AUTH_004', true);
  }

  // Find user and check if refresh token exists
  const user = await User.findById(decoded.userId);
  if (!user) {
    throw AppError.USER_NOT_FOUND();
  }

  // Verify refresh token is in user's tokens array and not expired
  const tokenEntry = user.refreshTokens.find(
    (t) => t.token === refreshToken && t.expiresAt > Date.now()
  );

  if (!tokenEntry) {
    throw new AppError('Refresh token has expired or is invalid', 401, 'AUTH_004', true);
  }

  // Generate new access token
  const newAccessToken = signAccessToken(user._id);

  // Optionally rotate refresh token: remove old, create new
  user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
  const newRefreshToken = await createRefreshToken(user);

  res.status(200).json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw AppError.UNAUTHORIZED();
  }

  const { refreshToken } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw AppError.USER_NOT_FOUND();
  }

  // Remove specific refresh token
  if (refreshToken) {
    user.refreshTokens = user.refreshTokens.filter((t) => t.token !== refreshToken);
  } else {
    // If no specific token, logout from all devices
    user.refreshTokens = [];
  }

  await user.save();

  res.status(200).json({
    message: 'Logged out successfully',
  });
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  logout,
};