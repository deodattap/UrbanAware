// src/routes/dashboard.js
const router = require('express').Router();
const { protect }  = require('../middleware/auth');
const User         = require('../models/User');
const Report       = require('../models/Report');
const Drive        = require('../models/Drive');

// ─── GET /api/dashboard/stats ─────────────────────────────────
router.get('/stats', protect, async (req, res) => {
  try {
    const userId = req.user._id;

    const [totalReports, totalDrivesHosted, totalDrivesJoined] = await Promise.all([
      // Reports submitted by this user (both field names for compatibility)
      Report.countDocuments({ $or: [{ user: userId }, { userId }] }),

      // Drives where user is the host
      Drive.countDocuments({ host: userId }),

      // Drives where user is in participants array but is NOT the host
      Drive.countDocuments({ participants: userId, host: { $ne: userId } })
    ]);

    res.json({
      success: true,
      stats: {
        totalScore:        req.user.score,
        badge:             req.user.badge,
        totalReports,
        totalDrivesHosted,
        totalDrivesJoined
      }
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/dashboard/activity ─────────────────────────────
router.get('/activity', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const LIMIT  = 10;

    // Fetch raw data in parallel
    const [recentReports, recentDrivesHosted, recentDrivesJoined] = await Promise.all([
      Report.find({ $or: [{ user: userId }, { userId }] })
        .sort({ createdAt: -1 })
        .limit(LIMIT)
        .select('issueType type location createdAt status'),

      Drive.find({ host: userId })
        .sort({ createdAt: -1 })
        .limit(LIMIT)
        .select('title location date createdAt'),

      Drive.find({ participants: userId, host: { $ne: userId } })
        .sort({ createdAt: -1 })
        .limit(LIMIT)
        .select('title location date createdAt')
    ]);

    // Normalise into a common shape
    const activities = [];

    recentReports.forEach(r => {
      const issueLabel = r.issueType || r.type || 'issue';
      activities.push({
        type:        'report',
        description: `Reported ${issueLabel} issue at ${r.location}`,
        status:      r.status,
        date:        r.createdAt
      });
    });

    recentDrivesHosted.forEach(d => {
      activities.push({
        type:        'drive',
        description: `Hosted drive: ${d.title} at ${d.location}`,
        date:        d.createdAt
      });
    });

    recentDrivesJoined.forEach(d => {
      activities.push({
        type:        'drive',
        description: `Joined drive: ${d.title} at ${d.location}`,
        date:        d.createdAt
      });
    });

    // Quiz / scenario activities come from User.activities (already persisted by scoring system)
    const quizActivities = (req.user.activities || [])
      .filter(a => a.type === 'quiz' || a.type === 'scenario')
      .slice(0, LIMIT)
      .map(a => ({
        type:        a.type,
        description: a.description || `${a.type} completed`,
        points:      a.points,
        date:        a.date
      }));

    activities.push(...quizActivities);

    // Sort all by date descending, take top 10
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = activities.slice(0, LIMIT);

    res.json({ success: true, activities: recent, total: recent.length });
  } catch (err) {
    console.error('Dashboard activity error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/dashboard/profile-summary ──────────────────────
router.get('/profile-summary', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      profile: {
        name:   req.user.name,
        email:  req.user.email,
        score:  req.user.score,
        badge:  req.user.badge,
        avatar: req.user.avatar || null
      }
    });
  } catch (err) {
    console.error('Dashboard profile-summary error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
