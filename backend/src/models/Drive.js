// src/models/Drive.js
const mongoose = require('mongoose');

const driveSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  date:        { type: Date, required: true },
  location:    { type: String, required: true },

  // Host is a User reference (required for logged-in hosts)
  host:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // Legacy string fields kept so existing pending drives are not broken
  organizer:      { type: String },
  organizerEmail: { type: String },

  // Participants are User references (enables duplicate-join prevention)
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  participantCount: { type: Number, default: 0 },
  isCustom: { type: Boolean, default: false },
  status:   { type: String, enum: ['pending', 'approved', 'active'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Drive', driveSchema);
