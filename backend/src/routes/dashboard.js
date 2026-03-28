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

// ─── GET /api/dashboard/data ──────────────────────────────────
// Returns AQI, weather, traffic, waste — mock with realistic variance
router.get('/data', async (req, res) => {
  try {
    const WAQI_TOKEN = process.env.WAQI_TOKEN || process.env.WAQI_API_TOKEN || 'demo';
    const OWM_KEY    = process.env.OPENWEATHER_KEY || process.env.OPENWEATHER_API_KEY || '';

    let aqi     = null;
    let weather = null;

    // Try WAQI (AQI) — works with 'demo' token for Delhi
    if (WAQI_TOKEN) {
      try {
        const axios = require('axios');
        const r = await axios.get(
          `https://api.waqi.info/feed/delhi/?token=${WAQI_TOKEN}`,
          { timeout: 4000 }
        );
        if (r.data.status === 'ok') aqi = r.data.data.aqi;
      } catch (_) {}
    }

    // Try OpenWeatherMap
    if (OWM_KEY && OWM_KEY !== 'demo') {
      try {
        const axios = require('axios');
        const r = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=Delhi&appid=${OWM_KEY}&units=metric`,
          { timeout: 4000 }
        );
        weather = {
          temperature: Math.round(r.data.main.temp),
          condition:   r.data.weather[0].description
        };
      } catch (_) {}
    }

    // Realistic mock fallbacks with slight randomness
    if (aqi === null) aqi = 120 + Math.floor(Math.random() * 60);
    if (!weather) weather = {
      temperature: 28 + Math.floor(Math.random() * 8),
      condition:   ['Partly Cloudy', 'Hazy', 'Sunny', 'Overcast'][Math.floor(Math.random() * 4)]
    };

    const heatIndex     = weather.temperature + Math.floor(Math.random() * 5) + 2;
    const trafficOpts   = ['Low', 'Moderate', 'High', 'Very High'];
    const wasteOpts     = ['On Schedule', 'Delayed', 'Completed'];
    const traffic       = trafficOpts[Math.floor(Math.random() * trafficOpts.length)];
    const waste         = wasteOpts[Math.floor(Math.random() * wasteOpts.length)];

    res.json({
      success: true,
      data: {
        aqi:       { value: aqi,                   status: aqiLabel(aqi), color: aqiColor(aqi) },
        weather:   { temp: weather.temperature,    description: weather.condition },
        heatIndex,
        traffic:   { level: 50 + Math.floor(Math.random() * 40), status: traffic },
        waste:     { level: 75 + Math.floor(Math.random() * 20), status: waste },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Dashboard data error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/dashboard/aqi-trend ────────────────────────────
// Returns last 24h AQI trend data for Chart.js
router.get('/aqi-trend', (req, res) => {
  const labels = [];
  const values = [];
  let base = 100 + Math.floor(Math.random() * 40);

  for (let h = 0; h < 24; h++) {
    const hour = h.toString().padStart(2, '0') + ':00';
    labels.push(hour);
    base += Math.floor(Math.random() * 20) - 8;
    base  = Math.max(35, Math.min(220, base));
    values.push(base);
  }

  res.json({ success: true, labels, values, data: values });
});

// ─── helpers (module-scoped, not exported) ────────────────────
function aqiLabel(v) {
  if (v <= 50)  return 'Good';
  if (v <= 100) return 'Moderate';
  if (v <= 150) return 'Unhealthy for Sensitive';
  if (v <= 200) return 'Unhealthy';
  return 'Very Unhealthy';
}
function aqiColor(v) {
  if (v <= 50)  return 'emerald';
  if (v <= 100) return 'amber';
  return 'pink';
}
