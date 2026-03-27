// src/routes/user.js
const router = require('express').Router();
const User   = require('../models/User');
const { protect } = require('../middleware/auth');

// ─── GET /api/user/profile ────────────────────────────────────
// Returns full profile: score, badge, activities, avatar, etc.
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.json({
      success: true,
      user: {
        id:         user._id,
        name:       user.name,
        email:      user.email,
        avatar:     user.avatar,
        score:      user.score,
        badge:      user.badge,
        activities: user.activities,
        createdAt:  user.createdAt
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/user/profile ──────────────────────────────────
// Update name and/or avatar
router.patch('/profile', protect, async (req, res) => {
  try {
    const { name, avatar } = req.body;
    const updates = {};
    if (name   !== undefined) updates.name   = name.trim();
    if (avatar !== undefined) updates.avatar = avatar;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        avatar: user.avatar,
        score:  user.score,
        badge:  user.badge
      }
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/user/score ──────────────────────────────────────
// Lightweight score + badge snapshot (useful for frontend headers)
router.get('/score', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('score badge');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    res.json({ success: true, score: user.score, badge: user.badge });
  } catch (err) {
    console.error('Get score error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/user/activities ─────────────────────────────────
// Paginated activity feed (most recent first)
router.get('/activities', protect, async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit)  || 20, 50);
    const offset = Math.max(parseInt(req.query.offset) || 0,   0);

    const user = await User.findById(req.user._id).select('activities');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const slice = user.activities.slice(offset, offset + limit);
    res.json({
      success:    true,
      activities: slice,
      total:      user.activities.length,
      limit,
      offset
    });
  } catch (err) {
    console.error('Get activities error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/user/leaderboard ────────────────────────────────
// Top 10 users by score (public — no auth required)
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const users = await User.find()
      .select('name score badge avatar')
      .sort({ score: -1 })
      .limit(limit);

    res.json({ success: true, leaderboard: users });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
