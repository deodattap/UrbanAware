// src/routes/quiz.js
const router = require('express').Router();
<<<<<<< HEAD
const axios = require('axios');
const { optionalAuth } = require('../middleware/auth');

// GET /api/quiz/questions — returns shuffled questions
=======
const axios  = require('axios');
const { optionalAuth }                        = require('../middleware/auth');
const { updateUserScore, POINTS, clampScenarioScore } = require('../utils/scoring');

// ─── Quiz question bank ───────────────────────────────────────
const QUIZ_QUESTIONS = [
  { id: 1,  q: 'Which is the most energy-efficient way to travel short distances?',      options: ['Electric SUV', 'Walking or Biking', 'Diesel Taxi', 'Motorbike'],                           correct: 1 },
  { id: 2,  q: 'What should you do with wet kitchen waste?',                             options: ['Burn it', 'Mix with plastic', 'Compost it', 'Flush it'],                                   correct: 2 },
  { id: 3,  q: 'How does carpooling help the environment?',                              options: ['Reduces traffic and emissions', 'Makes cars faster', 'Saves walking time', 'Increases fuel use'], correct: 0 },
  { id: 4,  q: 'Which is a major source of urban air pollution?',                        options: ['Solar panels', 'Bicycle lanes', 'Vehicle exhaust', 'Planting trees'],                       correct: 2 },
  { id: 5,  q: "What is recommended when AQI levels are 'Poor'?",                        options: ['Go for a run', 'Stay indoors, use air purifiers', 'Open all windows', 'Start a bonfire'],  correct: 1 },
  { id: 6,  q: 'Which light bulb is most energy-efficient?',                             options: ['Incandescent', 'Fluorescent', 'LED', 'Halogen'],                                           correct: 2 },
  { id: 7,  q: 'Where should you dispose of old electronics?',                           options: ['Regular bin', 'E-waste collection center', 'Nearest river', 'Bury in soil'],               correct: 1 },
  { id: 8,  q: 'What is the best way to reduce plastic waste?',                          options: ['Use more plastic bags', 'Switch to reusable bags', 'Buy only bottled water', 'Throw in park'], correct: 1 },
  { id: 9,  q: 'What does AQI stand for?',                                               options: ['Air Quality Index', 'Atmospheric Quality Indicator', 'Annual Quality Index', 'Air Quantity Index'], correct: 0 },
  { id: 10, q: 'Which practice most reduces the urban heat island effect?',              options: ['Dark asphalt roads', 'More concrete buildings', 'Rooftop gardens and trees', 'Removing parks'], correct: 2 }
];

// GET /api/quiz/questions — 8 shuffled questions
>>>>>>> 729b6a7 (updated report and drive issue)
router.get('/questions', (req, res) => {
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 8);
  res.json({ success: true, questions: shuffled });
});

<<<<<<< HEAD
// POST /api/quiz/submit — submit quiz score
router.post('/submit', optionalAuth, async (req, res) => {
  const { score, total } = req.body;
  const points = (score || 0) * 10;

  if (req.user) {
    try {
      await req.user.addPoints(points, 'quiz', `Quiz: ${score}/${total} correct`);
    } catch (e) {}
  }

  res.json({ success: true, points, message: `Quiz complete! You earned ${points} points.` });
});

// POST /api/quiz/scenario — AI-powered scenario evaluation
router.post('/scenario', optionalAuth, async (req, res) => {
  const { scenario, userAnswer } = req.body;

  if (!scenario || !userAnswer) {
    return res.status(400).json({ success: false, message: 'Scenario and answer required.' });
  }

  // If OpenAI key available, use AI
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_key_here') {
    try {
      const prompt = `You are an urban sustainability expert evaluating a student's answer.
=======
// POST /api/quiz/submit — submit quiz results (+15 per correct answer)
router.post('/submit', optionalAuth, async (req, res) => {
  try {
    const { score, total } = req.body;
    const correct = Math.max(0, parseInt(score) || 0);
    const points  = correct * POINTS.QUIZ_CORRECT;

    if (req.user && points > 0) {
      await updateUserScore(
        req.user,
        points,
        'quiz',
        `Quiz: ${correct}/${total || correct} correct`
      );
    }

    res.json({
      success: true,
      points,
      message: `Quiz complete! You earned ${points} points.`
    });
  } catch (err) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/quiz/scenario — AI or keyword-based scenario scoring (+1 to +20)
router.post('/scenario', optionalAuth, async (req, res) => {
  try {
    const { scenario, userAnswer } = req.body;

    if (!scenario || !userAnswer) {
      return res.status(400).json({ success: false, message: 'Scenario and answer required.' });
    }

    // ── AI path ───────────────────────────────────────────────
    const openAiKey = process.env.OPENAI_API_KEY;
    if (openAiKey && openAiKey !== 'your_openai_key_here' && openAiKey !== 'demo') {
      try {
        const prompt = `You are an urban sustainability expert evaluating a student's answer.
>>>>>>> 729b6a7 (updated report and drive issue)

SCENARIO: ${scenario}
STUDENT'S ANSWER: ${userAnswer}

Evaluate the response and return JSON only (no markdown):
{
<<<<<<< HEAD
  "score": <0-10>,
=======
  "score": <1-20>,
>>>>>>> 729b6a7 (updated report and drive issue)
  "feedback": "<2-3 sentence constructive feedback>",
  "correct_approach": "<what the ideal answer would emphasize>",
  "sustainability_tip": "<one practical tip related to this scenario>"
}`;

<<<<<<< HEAD
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.7
      }, {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        timeout: 10000
      });

      const content = response.data.choices[0].message.content;
      let evaluation;
      try {
        evaluation = JSON.parse(content.replace(/```json|```/g, '').trim());
      } catch {
        evaluation = { score: 7, feedback: 'Good effort! Your answer shows awareness of sustainability principles.', correct_approach: 'Focus on community impact and long-term sustainability.', sustainability_tip: 'Small actions collectively create big change.' };
      }

      const points = evaluation.score;
      if (req.user) {
        try { await req.user.addPoints(points, 'quiz', `Scenario quiz: ${points}/10`); } catch (e) {}
      }

      return res.json({ success: true, evaluation, points });
    } catch (err) {
      console.error('OpenAI error:', err.message);
    }
  }

  // Fallback: keyword-based mock scoring
  const keywords = ['reduce', 'reuse', 'recycle', 'sustainable', 'environment', 'community', 'green', 'pollution', 'energy', 'waste'];
  const lowerAnswer = userAnswer.toLowerCase();
  const matchCount = keywords.filter(k => lowerAnswer.includes(k)).length;
  const score = Math.min(10, 4 + matchCount);
  const points = score;

  if (req.user) {
    try { await req.user.addPoints(points, 'quiz', `Scenario quiz: ${points}/10`); } catch (e) {}
  }

  const evaluation = {
    score,
    feedback: score >= 7
      ? 'Great answer! You demonstrated strong sustainability awareness and practical thinking.'
      : score >= 5
      ? 'Good effort! Your answer touches on key sustainability concepts. Try to be more specific about community impact.'
      : 'Your answer shows some awareness, but consider focusing more on sustainable practices, community involvement, and long-term impact.',
    correct_approach: 'Ideal answers mention reducing waste at source, community engagement, policy advocacy, and measurable environmental impact.',
    sustainability_tip: 'Track your carbon footprint using free apps like Carbon Footprint Calculator to make your sustainability journey measurable.'
  };

  res.json({ success: true, evaluation, points });
});

const QUIZ_QUESTIONS = [
  { id: 1, q: "Which is the most energy-efficient way to travel short distances?", options: ["Electric SUV", "Walking or Biking", "Diesel Taxi", "Motorbike"], correct: 1 },
  { id: 2, q: "What should you do with wet kitchen waste?", options: ["Burn it", "Mix with plastic", "Compost it", "Flush it"], correct: 2 },
  { id: 3, q: "How does carpooling help the environment?", options: ["Reduces traffic and emissions", "Makes cars faster", "Saves walking time", "Increases fuel use"], correct: 0 },
  { id: 4, q: "Which is a major source of urban air pollution?", options: ["Solar panels", "Bicycle lanes", "Vehicle exhaust", "Planting trees"], correct: 2 },
  { id: 5, q: "What is recommended when AQI levels are 'Poor'?", options: ["Go for a run", "Stay indoors, use air purifiers", "Open all windows", "Start a bonfire"], correct: 1 },
  { id: 6, q: "Which light bulb is most energy-efficient?", options: ["Incandescent", "Fluorescent", "LED", "Halogen"], correct: 2 },
  { id: 7, q: "Where should you dispose of old electronics?", options: ["Regular bin", "E-waste collection center", "Nearest river", "Bury in soil"], correct: 1 },
  { id: 8, q: "What is the best way to reduce plastic waste?", options: ["Use more plastic bags", "Switch to reusable bags", "Buy only bottled water", "Throw in park"], correct: 1 },
  { id: 9, q: "What does AQI stand for?", options: ["Air Quality Index", "Atmospheric Quality Indicator", "Annual Quality Index", "Air Quantity Index"], correct: 0 },
  { id: 10, q: "Which of these practices most reduces urban heat island effect?", options: ["Dark asphalt roads", "More concrete buildings", "Rooftop gardens and trees", "Removing parks"], correct: 2 }
];

=======
        const aiRes = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
            temperature: 0.7
          },
          {
            headers: { Authorization: `Bearer ${openAiKey}` },
            timeout: 10000
          }
        );

        const content = aiRes.data.choices[0].message.content;
        let evaluation;
        try {
          evaluation = JSON.parse(content.replace(/```json|```/g, '').trim());
        } catch {
          evaluation = {
            score: 10,
            feedback: 'Good effort! Your answer shows awareness of sustainability principles.',
            correct_approach: 'Focus on community impact and long-term sustainability.',
            sustainability_tip: 'Small actions collectively create big change.'
          };
        }

        const points = clampScenarioScore(evaluation.score);
        evaluation.score = points;

        if (req.user && points > 0) {
          await updateUserScore(req.user, points, 'scenario', `Scenario quiz: ${points}/20`);
        }

        return res.json({ success: true, evaluation, points });
      } catch (err) {
        console.error('OpenAI error:', err.message);
        // fall through to keyword scoring
      }
    }

    // ── Keyword fallback ──────────────────────────────────────
    const keywords = [
      'reduce', 'reuse', 'recycle', 'sustainable', 'environment',
      'community', 'green', 'pollution', 'energy', 'waste'
    ];
    const lower      = userAnswer.toLowerCase();
    const matchCount = keywords.filter(k => lower.includes(k)).length;
    const rawScore   = 4 + matchCount * 1.6; // maps 0–10 keywords → ~4–20
    const points     = clampScenarioScore(rawScore);

    if (req.user && points > 0) {
      await updateUserScore(req.user, points, 'scenario', `Scenario quiz: ${points}/20`);
    }

    const evaluation = {
      score: points,
      feedback:
        points >= 14
          ? 'Great answer! You demonstrated strong sustainability awareness and practical thinking.'
          : points >= 8
          ? 'Good effort! Your answer touches on key sustainability concepts. Try to be more specific about community impact.'
          : 'Your answer shows some awareness, but consider focusing more on sustainable practices, community involvement, and long-term impact.',
      correct_approach:
        'Ideal answers mention reducing waste at source, community engagement, policy advocacy, and measurable environmental impact.',
      sustainability_tip:
        'Track your carbon footprint using free apps like Carbon Footprint Calculator to make your sustainability journey measurable.'
    };

    res.json({ success: true, evaluation, points });
  } catch (err) {
    console.error('Scenario error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

>>>>>>> 729b6a7 (updated report and drive issue)
module.exports = router;
