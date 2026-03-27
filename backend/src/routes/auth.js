// src/routes/auth.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

<<<<<<< HEAD
const signToken = (id) => jwt.sign(
  { id },
  process.env.JWT_SECRET || 'fallback_secret',
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);
=======
const signToken = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
>>>>>>> 729b6a7 (updated report and drive issue)

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
<<<<<<< HEAD
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
=======
      return res
        .status(400)
        .json({ success: false, message: 'Name, email, and password are required.' });
>>>>>>> 729b6a7 (updated report and drive issue)
    }

    const existing = await User.findOne({ email });
    if (existing) {
<<<<<<< HEAD
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password, score: 0 });

=======
      return res
        .status(409)
        .json({ success: false, message: 'An account with this email already exists.' });
    }

    const user = await User.create({ name, email, password, score: 0 });
>>>>>>> 729b6a7 (updated report and drive issue)
    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        score: user.score,
        badge: user.badge,
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
<<<<<<< HEAD
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
=======
      return res
        .status(400)
        .json({ success: false, message: 'Email and password are required.' });
>>>>>>> 729b6a7 (updated report and drive issue)
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
<<<<<<< HEAD
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
=======
      return res
        .status(401)
        .json({ success: false, message: 'Invalid email or password.' });
>>>>>>> 729b6a7 (updated report and drive issue)
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        score: user.score,
        badge: user.badge,
        avatar: user.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

<<<<<<< HEAD
// GET /api/auth/me — verify token & return user
=======
// GET /api/auth/me — verify token & return current user
>>>>>>> 729b6a7 (updated report and drive issue)
router.get('/me', protect, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      score: req.user.score,
      badge: req.user.badge,
      avatar: req.user.avatar
    }
  });
});

module.exports = router;
