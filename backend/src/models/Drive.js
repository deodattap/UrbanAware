// src/models/Drive.js
const mongoose = require('mongoose');

<<<<<<< HEAD
const participantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  location: String,
  joinedAt: { type: Date, default: Date.now }
});

const driveSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  organizer: { type: String, required: true },
  organizerEmail: String,
  participantCount: { type: Number, default: 0 },
  participants: [participantSchema],
  isCustom: { type: Boolean, default: false }, // true = user-hosted
  status: { type: String, enum: ['pending', 'approved', 'active'], default: 'pending' },
=======
const driveSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  date:        { type: Date, required: true },
  location:    { type: String, required: true },

  // Phase 5: host is now a User reference (required for logged-in hosts)
  host:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Legacy string field kept so existing pending drives aren't broken
  organizer:      { type: String },
  organizerEmail: { type: String },

  // Phase 5: participants are User references (for duplicate-join prevention)
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  participantCount: { type: Number, default: 0 },
  isCustom: { type: Boolean, default: false },
  status:   { type: String, enum: ['pending', 'approved', 'active'], default: 'pending' },
>>>>>>> 729b6a7 (updated report and drive issue)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Drive', driveSchema);
