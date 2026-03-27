// src/routes/drives.js
const router = require('express').Router();
const Drive  = require('../models/Drive');
const { optionalAuth }                    = require('../middleware/auth');
const { updateUserScore, POINTS }         = require('../utils/scoring');
const { sendEmail, driveJoinConfirmation } = require('../utils/email');

// GET /api/drives — list all active/approved drives
router.get('/', async (req, res) => {
  try {
    const drives = await Drive.find({ status: { $in: ['active', 'approved'] } })
      .select('-participants')
      .sort({ date: 1 });
    res.json({ success: true, drives });
  } catch (err) {
    console.error('Get drives error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/drives/join
router.post('/join', optionalAuth, async (req, res) => {
  try {
    const { driveId, driveName, name, email, location } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    if (req.user) {
      await updateUserScore(
        req.user,
        POINTS.DRIVE_JOIN,
        'drive_join',
        `Joined drive: ${driveName || driveId || 'Unknown'}`
      );
    }

    if (driveId) {
      try {
        await Drive.findByIdAndUpdate(driveId, {
          $push: { participants: { name, email, location } },
          $inc:  { participantCount: 1 }
        });
      } catch (e) { /* drive may not be in DB */ }
    }

    try {
      const emailData = driveJoinConfirmation(
        name,
        driveName || 'the drive',
        'See event details',
        location || 'TBD'
      );
      await sendEmail({ to: email, ...emailData });
    } catch (emailErr) {
      console.error('Email error:', emailErr.message);
    }

    res.json({
      success: true,
      message: 'Joined successfully! Confirmation email sent.',
      points:  POINTS.DRIVE_JOIN
    });
  } catch (err) {
    console.error('Join drive error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/drives/host
router.post('/host', optionalAuth, async (req, res) => {
  try {
    const { title, description, date, location, organizer, organizerEmail } = req.body;

    if (!title || !date || !location || !organizer) {
      return res.status(400).json({
        success: false,
        message: 'Title, date, location, and organizer name are required.'
      });
    }

    const drive = await Drive.create({
      title,
      description: description || '',
      date:  new Date(date),
      location,
      organizer,
      organizerEmail,
      isCustom: true,
      status:   'pending'
    });

    if (req.user) {
      await updateUserScore(
        req.user,
        POINTS.DRIVE_HOST,
        'drive_host',
        `Hosted drive: ${title}`
      );
    }

    res.status(201).json({
      success: true,
      message: 'Drive submitted for review!',
      driveId: drive._id,
      points:  POINTS.DRIVE_HOST
    });
  } catch (err) {
    console.error('Host drive error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
