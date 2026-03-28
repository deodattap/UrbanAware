// src/middleware/auth.js
const jwt  = require('jsonwebtoken');
const User = require('../models/User');

// protect — requires a valid JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: 'Not authorized — no token provided.' });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret'
    );
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: 'User belonging to this token no longer exists.' });
    }
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: 'Invalid or expired token.' });
  }
};

// optionalAuth — attaches user if token present, continues either way
const optionalAuth = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret'
      );
      req.user = await User.findById(decoded.id).select('-password');
    } catch (e) {
      req.user = null;
    }
  }
  next();
};

module.exports = { protect, optionalAuth };
