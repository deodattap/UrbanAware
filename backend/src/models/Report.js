// src/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Primary field for issue type
  issueType: {
    type: String,
    enum: ['garbage', 'pollution', 'traffic'],
    required: true
  },
  // Legacy 'type' field kept for backwards compatibility with existing data
  type: {
    type: String,
    enum: ['garbage', 'pollution', 'traffic']
  },
  location:        { type: String, required: true },
  description:     { type: String, required: true },
  image:           { type: String, default: null },   // relative path stored by multer
  imageUrl:        { type: String, default: null },   // backwards compat alias
  reporterName:    String,
  reporterContact: String,
  isAnonymous:     { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'forwarded', 'resolved'],
    default: 'submitted'
  },
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // backwards compat
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
