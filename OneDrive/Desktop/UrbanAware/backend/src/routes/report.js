// src/routes/report.js
const router = require('express').Router();
const Report  = require('../models/Report');
const { optionalAuth }            = require('../middleware/auth');
const { updateUserScore, POINTS } = require('../utils/scoring');
const { sendEmail, reportConfirmation } = require('../utils/email');

// POST /api/report — submit a new issue report
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { type, location, description, reporterName, reporterContact, isAnonymous } = req.body;

    if (!type || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'Type, location, and description are required.'
      });
    }

    const validTypes = ['garbage', 'pollution', 'traffic'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Type must be one of: ${validTypes.join(', ')}.`
      });
    }

    const report = await Report.create({
      type,
      location,
      description,
      reporterName:    isAnonymous ? undefined : reporterName,
      reporterContact: isAnonymous ? undefined : reporterContact,
      isAnonymous:     !!isAnonymous,
      userId:          req.user ? req.user._id : null,
      status:          'submitted'
    });

    if (req.user) {
      await updateUserScore(
        req.user,
        POINTS.REPORT_ISSUE,
        'report',
        `Reported ${type} issue at ${location}`
      );
    }

    if (!isAnonymous && reporterContact) {
      try {
        const emailData = reportConfirmation(
          reporterName || 'Community Member',
          type,
          location
        );
        await sendEmail({ to: reporterContact, ...emailData });
      } catch (emailErr) {
        console.error('Report email error:', emailErr.message);
      }
    }

    res.status(201).json({
      success:  true,
      message:  'Report submitted successfully!',
      reportId: report._id,
      points:   req.user ? POINTS.REPORT_ISSUE : 0
    });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/report — list reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, reports });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
