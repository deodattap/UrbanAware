// src/utils/scoring.js
/**
 * Centralised scoring helper for UrbanAware.
 *
 * Usage:
 *   const { updateUserScore, POINTS } = require('../utils/scoring');
 *   await updateUserScore(req.user, POINTS.QUIZ_CORRECT, 'quiz', 'Quiz: 6/8 correct');
 */

// ─── Point values ─────────────────────────────────────────────
const POINTS = {
  QUIZ_CORRECT:  15,   // per correct answer
  SCENARIO_MIN:   1,   // lower bound for scenario evaluation
  SCENARIO_MAX:  20,   // upper bound for scenario evaluation
  DRIVE_JOIN:    15,
  DRIVE_HOST:    25,
  REPORT_ISSUE:  15
};

/**
 * Award points to a user, update their badge, append an activity
 * entry, and persist the document.
 *
 * @param {mongoose.Document} user        - Mongoose User document (must be mutable)
 * @param {number}            points      - Points to award (must be > 0)
 * @param {string}            type        - Activity type key (see activitySchema enum)
 * @param {string}            description - Human-readable description of the action
 * @returns {Promise<mongoose.Document>}  - The updated user document
 * @throws Will throw if points <= 0 or if the DB save fails
 */
const updateUserScore = async (user, points, type, description) => {
  if (!user)        throw new Error('updateUserScore: user is required');
  if (points <= 0)  throw new Error('updateUserScore: points must be greater than 0');
  if (!type)        throw new Error('updateUserScore: activity type is required');

  return user.addPoints(points, type, description || '');
};

/**
 * Clamp a raw scenario score (e.g. from AI) to the valid [SCENARIO_MIN, SCENARIO_MAX] range.
 *
 * @param {number} rawScore
 * @returns {number}
 */
const clampScenarioScore = (rawScore) =>
  Math.max(POINTS.SCENARIO_MIN, Math.min(POINTS.SCENARIO_MAX, Math.round(rawScore)));

module.exports = { POINTS, updateUserScore, clampScenarioScore };
