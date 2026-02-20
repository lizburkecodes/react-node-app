const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/user');

const authMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if password was changed after token was issued
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    // If password was changed after token was issued, reject token
    if (user.passwordChangedAt) {
      const passwordChangedTime = Math.floor(user.passwordChangedAt.getTime() / 1000);
      const tokenIssuedTime = decoded.iat;

      if (tokenIssuedTime < passwordChangedTime) {
        res.status(401);
        throw new Error('Not authorized, password recently changed');
      }
    }

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      _id: decoded.userId,
    };

    next();
  } catch (error) {
    res.status(401);
    throw new Error(error.message || 'Not authorized, invalid token');
  }
});

module.exports = authMiddleware;