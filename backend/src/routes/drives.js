// src/routes/drives.js
<<<<<<< HEAD
const router = require('express').Router();
const Drive = require('../models/Drive');
const User = require('../models/User');
const { optionalAuth } = require('../middleware/auth');
const { sendEmail, driveJoinConfirmation } = require('../utils/email');

// GET /api/drives — list all drives
=======
const mongoose = require('mongoose');
const router   = require('express').Router();
const Drive    = require('../models/Drive');
const { protect, optionalAuth }               = require('../middleware/auth');
const { updateUserScore, POINTS }             = require('../utils/scoring');
const { sendEmail, driveJoinConfirmation }    = require('../utils/email');

// ─── GET /api/drives ──────────────────────────────────────────
// List all active/approved drives (public)
>>>>>>> 729b6a7 (updated report and drive issue)
router.get('/', async (req, res) => {
  try {
    const drives = await Drive.find({ status: { $in: ['active', 'approved'] } })
      .select('-participants')
<<<<<<< HEAD
      .sort({ date: 1 });
    res.json({ success: true, drives });
  } catch (err) {
=======
      .populate('host', 'name email avatar')
      .sort({ date: 1 });
    res.json({ success: true, drives });
  } catch (err) {
    console.error('Get drives error:', err);
>>>>>>> 729b6a7 (updated report and drive issue)
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

<<<<<<< HEAD
// POST /api/drives/join
router.post('/join', optionalAuth, async (req, res) => {
  try {
    const { driveId, driveName, name, email, location } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required.' });
    }

    // Award points to user if logged in
    if (req.user) {
      await req.user.addPoints(8, 'drive_join', `Joined drive: ${driveName || driveId}`);
    }

    // Try to save to DB
    if (driveId) {
      try {
        await Drive.findByIdAndUpdate(driveId, {
          $push: { participants: { name, email, location } },
          $inc: { participantCount: 1 }
        });
      } catch (e) { /* drive may not be in DB */ }
    }

    // Send confirmation email
    try {
      const emailData = driveJoinConfirmation(name, driveName || 'the drive', 'See event details', location || 'TBD');
      await sendEmail({ to: email, ...emailData });
    } catch (emailErr) {
      console.error('Email error:', emailErr.message);
    }

    res.json({ success: true, message: 'Joined successfully! Confirmation email sent.', points: 8 });
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
      return res.status(400).json({ success: false, message: 'Title, date, location, and organizer name are required.' });
=======
// ─── POST /api/drives/host ────────────────────────────────────
// Create a new drive; host is automatically the first participant
router.post('/host', protect, async (req, res) => {
  try {
    const { title, description, date, location } = req.body;

    if (!title || !date || !location) {
      return res.status(400).json({
        success: false,
        message: 'title, date, and location are required.'
      });
>>>>>>> 729b6a7 (updated report and drive issue)
    }

    const drive = await Drive.create({
      title,
<<<<<<< HEAD
      description,
      date: new Date(date),
      location,
      organizer,
      organizerEmail,
      isCustom: true,
      status: 'pending'
    });

    // Award points if logged in
    if (req.user) {
      await req.user.addPoints(10, 'drive_host', `Hosted drive: ${title}`);
    }

    res.status(201).json({ success: true, message: 'Drive submitted for review!', driveId: drive._id, points: 10 });
=======
      description:      description || '',
      date:             new Date(date),
      location,
      host:             req.user._id,
      organizer:        req.user.name,        // legacy field
      organizerEmail:   req.user.email,       // legacy field
      participants:     [req.user._id],       // host is first participant
      participantCount: 1,
      isCustom:         true,
      status:           'pending'
    });

    // Award +25 points using the EXISTING scoring system
    await updateUserScore(
      req.user,
      POINTS.DRIVE_HOST,
      'drive_host',
      `Hosted drive: ${title}`
    );

    // Send host confirmation email (non-fatal)
    try {
      const emailData = driveJoinConfirmation(
        req.user.name,
        title,
        new Date(date).toDateString(),
        location
      );
      await sendEmail({ to: req.user.email, ...emailData });
    } catch (emailErr) {
      console.error('Host drive email error:', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Drive submitted for review!',
      driveId: drive._id,
      points:  POINTS.DRIVE_HOST
    });
>>>>>>> 729b6a7 (updated report and drive issue)
  } catch (err) {
    console.error('Host drive error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

<<<<<<< HEAD
=======
// ─── POST /api/drives/join ────────────────────────────────────
// Join an existing drive; prevents duplicate joins
router.post('/join', protect, async (req, res) => {
  try {
    const { driveId } = req.body;

    if (!driveId) {
      return res.status(400).json({ success: false, message: 'driveId is required.' });
    }

    if (!mongoose.Types.ObjectId.isValid(driveId)) {
      return res.status(400).json({ success: false, message: 'Invalid driveId.' });
    }

    const drive = await Drive.findById(driveId);
    if (!drive) {
      return res.status(404).json({ success: false, message: 'Drive not found.' });
    }

    // Prevent duplicate joins
    const alreadyJoined = drive.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (alreadyJoined) {
      return res.status(409).json({
        success: false,
        message: 'You have already joined this drive.'
      });
    }

    // Add user to participants
    await Drive.findByIdAndUpdate(driveId, {
      $push: { participants: req.user._id },
      $inc:  { participantCount: 1 }
    });

    // Award +15 points using the EXISTING scoring system
    await updateUserScore(
      req.user,
      POINTS.DRIVE_JOIN,
      'drive_join',
      `Joined drive: ${drive.title}`
    );

    // Send join confirmation email (non-fatal)
    try {
      const emailData = driveJoinConfirmation(
        req.user.name,
        drive.title,
        drive.date.toDateString(),
        drive.location
      );
      await sendEmail({ to: req.user.email, ...emailData });
    } catch (emailErr) {
      console.error('Join drive email error:', emailErr.message);
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

>>>>>>> 729b6a7 (updated report and drive issue)
module.exports = router;
