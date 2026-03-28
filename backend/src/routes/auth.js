// src/routes/auth.js
const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Name, email, and password are required.' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password, score: 0 });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id:     user._id,
        name:   user.name,
        email:  user.email,
        score:  user.score,
        badge:  user.badge,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password.' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id:     user._id,
        name:   user.name,
        email:  user.email,
        score:  user.score,
        badge:  user.badge,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// GET /api/auth/me — verify token & return current user
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id:     req.user._id,
      name:   req.user.name,
      email:  req.user.email,
      score:  req.user.score,
      badge:  req.user.badge,
      avatar: req.user.avatar
    }
  });
});

module.exports = router;
