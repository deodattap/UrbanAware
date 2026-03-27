// src/models/User.js
const mongoose = require('mongoose');
<<<<<<< HEAD
const bcrypt = require('bcryptjs');

const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ['quiz', 'drive_join', 'drive_host', 'report', 'login'], required: true },
  description: String,
  points: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: null }, // URL or base64
  score: { type: Number, default: 0 },
  badge: { type: String, default: 'Eco Beginner' },
  activities: [activitySchema],
  createdAt: { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre('save', async function(next) {
=======
const bcrypt   = require('bcryptjs');

// ─── Badge thresholds (single source of truth) ───────────────
const BADGE_TIERS = [
  { min: 1000, label: 'Eco Champion'       },
  { min: 500,  label: 'Sustainability Hero' },
  { min: 200,  label: 'Green Citizen'       },
  { min: 100,  label: 'Eco Starter'         },
  { min: 0,    label: 'Eco Beginner'        }
];

// ─── Activity sub-schema ──────────────────────────────────────
const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['quiz', 'scenario', 'drive_join', 'drive_host', 'report', 'login'],
      required: true
    },
    description: { type: String, default: '' },
    points:      { type: Number, default: 0  },
    date:        { type: Date,   default: Date.now }
  },
  { _id: false }
);

// ─── User schema ──────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  avatar:   { type: String, default: null  },
  score:    { type: Number, default: 0, min: 0 },
  badge:    { type: String, default: 'Eco Beginner' },
  activities: { type: [activitySchema], default: [] },
  createdAt:  { type: Date, default: Date.now }
});

// ─── Hash password before save ────────────────────────────────
userSchema.pre('save', async function (next) {
>>>>>>> 729b6a7 (updated report and drive issue)
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

<<<<<<< HEAD
// Compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Auto-update badge based on score
userSchema.methods.updateBadge = function() {
  if (this.score >= 3000) this.badge = 'Eco Champion';
  else if (this.score >= 1500) this.badge = 'Sustainability Hero';
  else if (this.score >= 500) this.badge = 'Green Citizen';
  else if (this.score >= 100) this.badge = 'Eco Starter';
  else this.badge = 'Eco Beginner';
};

// Add points and activity
userSchema.methods.addPoints = async function(points, type, description) {
  this.score += points;
  this.updateBadge();
  this.activities.unshift({ type, description, points });
  if (this.activities.length > 50) this.activities = this.activities.slice(0, 50);
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
=======
// ─── Instance: compare passwords ─────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ─── Instance: resolve badge label from current score ─────────
userSchema.methods.resolveBadge = function () {
  const tier = BADGE_TIERS.find(t => this.score >= t.min);
  return tier ? tier.label : 'Eco Beginner';
};

// ─── Instance: sync badge field to current score ──────────────
userSchema.methods.updateBadge = function () {
  this.badge = this.resolveBadge();
};

// ─── Instance: award points, log activity, persist ───────────
userSchema.methods.addPoints = async function (points, type, description) {
  this.score += points;
  this.updateBadge();

  this.activities.unshift({
    type,
    description: description || '',
    points,
    date: new Date()
  });

  // Cap history at 50 most-recent entries
  if (this.activities.length > 50) {
    this.activities = this.activities.slice(0, 50);
  }

  await this.save();
  return this;
};

// ─── Static: resolve badge for any score (no instance needed) ─
userSchema.statics.badgeForScore = function (score) {
  const tier = BADGE_TIERS.find(t => score >= t.min);
  return tier ? tier.label : 'Eco Beginner';
};

const User = mongoose.model('User', userSchema);

module.exports = User;
module.exports.BADGE_TIERS = BADGE_TIERS;
>>>>>>> 729b6a7 (updated report and drive issue)
