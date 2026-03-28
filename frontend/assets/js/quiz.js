// assets/js/quiz.js — API adapter for the quiz system (loaded after learn.js)
// Patches the quiz fetch so the API's { question, options, correct } shape
// is normalised to the { q, options, correct } shape learn.js expects.

(function patchQuizFetch() {
  // Intercept window.fetch calls for /quiz/questions and normalise the response
  const _origFetch = window.fetch;
  window.fetch = async function (url, opts) {
    const res = await _origFetch.call(this, url, opts);

    // Only intercept the quiz questions endpoint
    if (typeof url === 'string' && url.includes('/quiz/questions')) {
      const clone = res.clone();
      const json  = await clone.json().catch(() => null);

      if (json && json.success && Array.isArray(json.questions)) {
        // Normalise: add `.q` alias if missing (API uses `question`)
        const normalised = json.questions.map(q => ({
          ...q,
          q: q.q || q.question || ''
        }));

        const normalBody = JSON.stringify({ ...json, questions: normalised });
        return new Response(normalBody, {
          status:     res.status,
          statusText: res.statusText,
          headers:    res.headers
        });
      }
      return res; // return original if shape is unexpected
    }

    return res;
  };
})();

// ─── ENHANCED QUIZ SUBMIT ─────────────────────────────────────
// Override the finishMCQ submit so it uses the auth header from common.js
// (learn.js already does this but only for token, not using apiRequest wrapper)
document.addEventListener('DOMContentLoaded', () => {
  hookQuizSubmitOverride();
  hookScenarioLevelSelect();
});

function hookQuizSubmitOverride() {
  // Patch the global finishMCQ if available, otherwise the existing one works fine.
  // We simply ensure the Authorization header is always sent.
  const origFinish = window.finishMCQ;
  if (typeof origFinish === 'function') return; // already defined natively; leave it

  // Fallback: define finishMCQ if learn.js didn't expose it globally
  window.finishMCQ = async function () {
    // This path is only reached if learn.js hasn't defined it globally
    const points = (window.userScore || 0) * 5;
    await apiRequest('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify({
        score: window.userScore || 0,
        total: (window.quizQuestions || []).length || 10
      })
    });
    if (points > 0) addPoints(points);
    showToast(`🎉 Quiz Complete! You earned ${points} pts`);
  };
}

// ─── SCENARIO LEVEL SELECTOR ──────────────────────────────────
// Adds a level selector UI before scenario mode and calls the backend
function hookScenarioLevelSelect() {
  const quizSection = document.getElementById('quiz-section');
  if (!quizSection) return;

  // Override the scenario start with a level-picker flow
  const origStartQuiz = window.startQuiz;
  window.startQuiz = async function (mode) {
    if (mode !== 'scenario') {
      return origStartQuiz && origStartQuiz(mode);
    }

    // Show level picker
    quizSection.classList.remove('hidden');
    quizSection.scrollIntoView({ behavior: 'smooth' });
    quizSection.innerHTML = `
      <div class="text-center mb-8">
        <span class="bg-secondary/10 text-secondary px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest">Scenario Quiz</span>
        <h3 class="text-2xl font-bold mt-4 text-gray-800">Choose Your Difficulty</h3>
        <p class="text-gray-500 mt-2 text-sm">Answer open-ended sustainability scenarios and earn points based on the quality of your response.</p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        ${[
          { level: 'easy',   max: 10,  color: 'from-green-400 to-emerald-500',  icon: '🌱', desc: 'Everyday actions' },
          { level: 'medium', max: 20,  color: 'from-blue-400 to-indigo-500',    icon: '🌍', desc: 'Community challenges' },
          { level: 'hard',   max: 30,  color: 'from-orange-400 to-red-500',     icon: '🔥', desc: 'Policy & systems' }
        ].map(t => `
          <button onclick="startScenarioLevel('${t.level}')"
            class="p-6 rounded-3xl bg-gradient-to-br ${t.color} text-white font-bold shadow-lg hover:scale-105 transition-transform text-left">
            <div class="text-3xl mb-2">${t.icon}</div>
            <div class="capitalize text-xl mb-1">${t.level}</div>
            <div class="text-white/80 text-xs font-normal">${t.desc}</div>
            <div class="mt-3 text-xs bg-white/20 rounded-full px-2 py-0.5 inline-block">Up to ${t.max} pts</div>
          </button>`).join('')}
      </div>
      <button onclick="document.getElementById('quiz-section').classList.add('hidden')"
        class="text-gray-400 font-bold px-6 py-3 hover:text-gray-600 transition block mx-auto">
        ← Back
      </button>`;
  };
}

window.startScenarioLevel = async function (level) {
  const quizSection = document.getElementById('quiz-section');
  if (!quizSection) return;

  quizSection.innerHTML = `
    <div class="text-center py-12 text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-3xl block mb-4"></i>
      <p>Loading scenario…</p>
    </div>`;

  // Fetch a scenario for the chosen level
  const data = await apiRequest('/quiz/scenario', {
    method: 'POST',
    body: JSON.stringify({ level })
  });

  if (!data.success || !data.scenario) {
    quizSection.innerHTML = `<p class="text-red-500 text-center">Could not load scenario. Please try again.</p>`;
    return;
  }

  const { id: scenarioId, scenario: text } = data.scenario;
  const maxPts = { easy: 10, medium: 20, hard: 30 }[level] || 20;

  quizSection.innerHTML = `
    <div class="mb-6">
      <span class="bg-secondary/10 text-secondary px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest">
        ${level.charAt(0).toUpperCase() + level.slice(1)} Scenario · Max ${maxPts} pts
      </span>
      <h3 class="text-xl font-bold mt-4 text-gray-800 leading-relaxed">${escHtmlQuiz(text)}</h3>
    </div>
    <div class="mb-8">
      <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Answer</label>
      <textarea id="scenario-answer" rows="5"
        placeholder="Write your detailed response here. Use specific actions, policies and community approaches for a higher score…"
        class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-secondary resize-none transition-colors"></textarea>
      <p class="text-[11px] text-gray-400 mt-1">Tip: Aim for at least 40–60 words with specific, practical suggestions.</p>
    </div>
    <div id="scenario-result" class="hidden mb-6 p-5 rounded-2xl bg-green-50 border border-green-100"></div>
    <div class="flex justify-between items-center">
      <button onclick="window.startQuiz('scenario')"
        class="text-gray-400 font-bold px-6 py-3 hover:text-gray-600 transition">← Change Level</button>
      <button id="scenario-submit-api"
        class="bg-gray-800 text-white px-10 py-4 rounded-2xl font-bold hover:bg-gray-700 transition">
        Submit Answer
      </button>
    </div>`;

  document.getElementById('scenario-submit-api').addEventListener('click', async () => {
    const answer = document.getElementById('scenario-answer')?.value.trim();
    const btn    = document.getElementById('scenario-submit-api');
    const result = document.getElementById('scenario-result');

    if (!answer || answer.length < 10) {
      showToast('Please write a more detailed answer first.');
      return;
    }

    btn.textContent = 'Evaluating…';
    btn.disabled = true;

    const res = await apiRequest('/quiz/scenario', {
      method: 'POST',
      body: JSON.stringify({ level, scenarioId, answer })
    });

    btn.textContent = 'Submit Answer';
    btn.disabled = false;

    if (!res.success) {
      showToast(res.message || 'Evaluation failed.');
      return;
    }

    const ev = res.evaluation;
    result.classList.remove('hidden');
    result.innerHTML = `
      <div class="flex items-center justify-between mb-3">
        <span class="font-bold text-gray-800 text-lg">Score: ${ev.score} / ${maxPts}</span>
        <span class="text-sm font-bold text-green-600">+${res.points} pts earned!</span>
      </div>
      <p class="text-sm text-gray-700 mb-2"><strong>Feedback:</strong> ${escHtmlQuiz(ev.feedback)}</p>
      <p class="text-sm text-gray-500 mb-2"><strong>Ideal approach:</strong> ${escHtmlQuiz(ev.correct_approach)}</p>
      <p class="text-xs text-emerald-600 italic mt-2">💡 ${escHtmlQuiz(ev.sustainability_tip)}</p>`;

    if (res.points > 0) addPoints(res.points);
    showToast(`✅ Scenario complete! +${res.points} pts 🌱`);
    btn.textContent = 'Try Another';
    btn.onclick = () => startScenarioLevel(level);
  });
};

function escHtmlQuiz(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
