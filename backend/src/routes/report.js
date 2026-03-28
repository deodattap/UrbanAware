// src/routes/report.js
const path   = require('path');
const router = require('express').Router();
const Report = require('../models/Report');
const upload = require('../middleware/upload');
const { optionalAuth }                    = require('../middleware/auth');
const { updateUserScore, POINTS }         = require('../utils/scoring');
const { sendEmail, reportConfirmation }   = require('../utils/email');

// POST /api/report — submit a new issue report (multipart/form-data)
router.post('/', optionalAuth, upload.single('image'), async (req, res) => {
  try {
    const {
      issueType,
      type,           // accept legacy field name too
      location,
      description,
      reporterName,
      reporterContact,
      isAnonymous
    } = req.body;

    // Support both 'issueType' (new) and 'type' (legacy) field names
    const resolvedType = issueType || type;

    if (!resolvedType || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'issueType, location, and description are required.'
      });
    }

    const validTypes = ['garbage', 'pollution', 'traffic'];
    if (!validTypes.includes(resolvedType)) {
      return res.status(400).json({
        success: false,
        message: `issueType must be one of: ${validTypes.join(', ')}.`
      });
    }

    // Build image path if a file was uploaded
    const imagePath = req.file
      ? path.join('uploads', req.file.filename).replace(/\\/g, '/')
      : null;

    const anonymous = isAnonymous === 'true' || isAnonymous === true;

    const report = await Report.create({
      issueType:       resolvedType,
      type:            resolvedType,          // backwards compat
      location,
      description,
      image:           imagePath,
      imageUrl:        imagePath,             // backwards compat
      reporterName:    anonymous ? undefined : reporterName,
      reporterContact: anonymous ? undefined : reporterContact,
      isAnonymous:     anonymous,
      user:            req.user ? req.user._id : null,
      userId:          req.user ? req.user._id : null, // backwards compat
      status:          'submitted'
    });

    // Award +15 points to authenticated users using the EXISTING scoring system
    if (req.user) {
      await updateUserScore(
        req.user,
        POINTS.REPORT_ISSUE,
        'report',
        `Reported ${resolvedType} issue at ${location}`
      );
    }

    // Send confirmation email (non-fatal)
    if (!anonymous && reporterContact) {
      try {
        const emailData = reportConfirmation(
          reporterName || 'Community Member',
          resolvedType,
          location
        );
        await sendEmail({ to: reporterContact, ...emailData });
      } catch (emailErr) {
        console.error('Report confirmation email error:', emailErr.message);
      }
    }

    res.status(201).json({
      success:  true,
      message:  'Report submitted successfully!',
      reportId: report._id,
      image:    imagePath,
      points:   req.user ? POINTS.REPORT_ISSUE : 0
    });
  } catch (err) {
    console.error('Submit report error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/report — list reports (most recent first)
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('user', 'name email');
    res.json({ success: true, reports });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;