// src/models/Report.js
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['garbage', 'pollution', 'traffic'], 
    required: true 
  },
  location: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, default: null },
  reporterName: String,
  reporterContact: String,
  isAnonymous: { type: Boolean, default: false },
  status: { 
    type: String, 
    enum: ['submitted', 'under_review', 'forwarded', 'resolved'], 
    default: 'submitted' 
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
