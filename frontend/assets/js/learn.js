// assets/js/learn.js — UrbanAware Learn Page
const API = window.API_BASE || 'http://localhost:3001/api';

const modules = {
  'Waste Management': {
    icon: `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>`,
    dos: ['Separate wet and dry waste daily', 'Compost organic kitchen scraps', 'Reuse plastic containers when safe', 'Support local recycling programs'],
    donts: ["Don't throw trash on streets", 'Avoid single-use plastics', "Don't burn waste in the open", "Don't mix e-waste with general garbage"]
  },
  'Traffic Awareness': {
    icon: `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>`,
    dos: ['Use public transport for daily commute', 'Carpool whenever possible', 'Walk or bike for short distances', 'Keep your vehicle well-maintained'],
    donts: ['Avoid unnecessary solo car trips', "Don't idle your engine", "Don't block traffic or double park", 'Avoid peak-hours when possible']
  },
  'Pollution Control': {
    icon: `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>`,
    dos: ['Plant trees in your neighbourhood', 'Monitor AQI on UrbanAware daily', 'Use energy-efficient appliances', 'Report smoke and noise issues'],
    donts: ["Don't use loud horns in silence zones", 'Avoid firecrackers', "Don't use high-VOC paints", "Don't ignore vehicle emission checks"]
  },
  'Energy Saving': {
    icon: `<svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>`,
    dos: ['Switch off lights when not in use', 'Use solar panels if possible', 'Switch to LED bulbs throughout', 'Unplug electronics when not charging'],
    donts: ["Don't leave AC on when you leave", 'Avoid old inefficient electronics', "Don't waste water — it takes energy to pump", "Don't use a dryer in summer"]
  }
};

const SCENARIOS = [
  "You notice a large pile of garbage dumped near your apartment gate every morning. The garbage truck comes only twice a week. Residents are frustrated. What would you do as a responsible urban citizen?",
  "Your neighbourhood has heavy traffic congestion every morning from 8-10am, causing significant air pollution. You have the option to drive, carpool, or take public transport. What's your approach and why?",
  "A factory near your area seems to be releasing smoke at night to avoid inspection. AQI levels spike to 200+ on those days. How would you respond as an UrbanAware citizen?",
  "Your apartment complex uses 30% more electricity than the city average. You've been asked to lead an energy audit. What steps would you take to reduce consumption?",
  "A local park is being converted into a parking lot. Residents are divided — some need the parking, others value green space. How would you approach this urban sustainability conflict?"
];

let currentQuestionIndex = 0;
let userScore = 0;
let quizQuestions = [];
let quizMode = 'mcq'; // 'mcq' or 'scenario'

document.addEventListener('DOMContentLoaded', () => {
  initModuleSelection();
  initQuizButtons();
  initReportSection();  // inject report form on reportissue.html
});

// ─── REPORT FORM (active on reportissue.html) ─────────────────
function initReportSection() {
  if (!window.location.pathname.includes('reportissue')) return;

  // Replace the hero section description to make it clear this is Report page
  const heroDesc = document.querySelector('[data-purpose="hero-section"] p');
  if (heroDesc) heroDesc.textContent = 'Report urban issues in your city — garbage, pollution, or traffic problems — and help make your community cleaner.';

  // Find the content-display section and replace it with the report form
  const contentDisplay = document.querySelector('[data-purpose="content-display"]');
  if (!contentDisplay) return;

  contentDisplay.innerHTML = `
    <div class="flex items-center gap-4 mb-8">
      <div class="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 text-2xl">🚩</div>
      <div>
        <h2 class="text-3xl font-extrabold text-gray-800">Report an Issue</h2>
        <p class="text-gray-500">Help improve your city by reporting problems</p>
      </div>
    </div>
    <form id="ua-report-page-form" class="space-y-5" novalidate>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Issue Type *</label>
          <select id="rp-type" required class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-red-400 bg-white">
            <option value="">Select type…</option>
            <option value="garbage">🗑️ Waste Issue</option>
            <option value="noise">🔊 Noise Pollution</option>
            <option value="traffic">🚦 Traffic Issue</option>
            <option value="pollution">🌫️ Air Pollution</option>
            <option value="water">💧 Water Issue</option>
            <option value="dumping">🚯 Illegal Dumping</option>
            <option value="road">🕳️ Road Damage</option>
            <option value="lighting">💡 Street Light Problem</option>
            <option value="other">📋 Other</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Location *</label>
          <input id="rp-location" type="text" required placeholder="e.g. MG Road, Bangalore"
            class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-red-400"/>
        </div>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description *</label>
        <textarea id="rp-description" rows="4" required placeholder="Describe the issue in detail…"
          class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-red-400 resize-none"></textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Your Name</label>
          <input id="rp-name" type="text" placeholder="Full name (optional)"
            class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-red-400"/>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Contact Email</label>
          <input id="rp-contact" type="email" placeholder="email@example.com (optional)"
            class="w-full px-4 py-3 border-2 border-gray-100 rounded-2xl text-sm focus:outline-none focus:border-red-400"/>
        </div>
      </div>
      <div>
        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Photo Evidence</label>
        <input id="rp-image" type="file" accept="image/*"
          class="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-red-50 file:text-red-700 file:font-semibold hover:file:bg-red-100"/>
      </div>
      <div class="flex items-center gap-3">
        <input id="rp-anon" type="checkbox" class="w-4 h-4 rounded text-red-500"/>
        <label for="rp-anon" class="text-sm text-gray-600">Submit anonymously</label>
      </div>
      <div id="rp-error" class="hidden text-red-500 text-sm font-semibold p-3 bg-red-50 rounded-xl"></div>
      <div id="rp-success" class="hidden text-green-700 font-semibold p-4 bg-green-50 border border-green-200 rounded-2xl text-center"></div>
      <button type="submit" id="rp-submit"
        class="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg">
        🚩 Submit Report
      </button>
    </form>`;

  // Pre-fill name/email if logged in
  const user = (typeof getUser === 'function') ? getUser() : null;
  if (user) {
    const n = document.getElementById('rp-name'); if (n && user.name) n.value = user.name;
    const e = document.getElementById('rp-contact'); if (e && user.email) e.value = user.email;
  }

  document.getElementById('rp-anon').addEventListener('change', function() {
    const fields = document.querySelectorAll('#rp-name, #rp-contact');
    fields.forEach(f => { f.closest('div').style.opacity = this.checked ? '0.4' : '1'; });
  });

  document.getElementById('ua-report-page-form').addEventListener('submit', submitReportForm);

  // Also hide the quiz section since this is the report page
  const quizSection = document.getElementById('quiz-section');
  if (quizSection) quizSection.classList.add('hidden');
}

async function submitReportForm(e) {
  e.preventDefault();
  const type        = document.getElementById('rp-type').value;
  const location    = document.getElementById('rp-location').value.trim();
  const description = document.getElementById('rp-description').value.trim();
  const isAnon      = document.getElementById('rp-anon').checked;
  const name        = document.getElementById('rp-name')?.value.trim();
  const contact     = document.getElementById('rp-contact')?.value.trim();
  const imageFile   = document.getElementById('rp-image')?.files[0];
  const errEl       = document.getElementById('rp-error');
  const successEl   = document.getElementById('rp-success');
  const btn         = document.getElementById('rp-submit');

  errEl.classList.add('hidden');
  successEl.classList.add('hidden');

  if (!type || !location || !description) {
    errEl.textContent = 'Issue type, location and description are required.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.textContent = 'Submitting…'; btn.disabled = true;

  const fd = new FormData();
  fd.append('issueType', type);
  fd.append('type', type);
  fd.append('location', location);
  fd.append('description', description);
  fd.append('isAnonymous', isAnon);
  if (!isAnon && name)    fd.append('reporterName', name);
  if (!isAnon && contact) fd.append('reporterContact', contact);
  if (imageFile)          fd.append('image', imageFile);

  const token = localStorage.getItem('ua_token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let result;
  try {
    const res = await fetch(`${API}/report`, { method: 'POST', headers, body: fd });
    result = await res.json();
  } catch {
    result = { success: false, message: 'Network error. Is the backend running?' };
  }

  if (result.success) {
    successEl.textContent = `✅ Report submitted successfully! ${result.points ? `You earned +${result.points} sustainability points 🌱` : ''}`;
    successEl.classList.remove('hidden');
    document.getElementById('ua-report-page-form').reset();
    if (result.points && typeof addPoints === 'function') addPoints(result.points);
    if (typeof showToast === 'function') showToast(`Report submitted! ${result.points ? `+${result.points} pts 🌱` : ''}`);
  } else {
    errEl.textContent = result.message || 'Submission failed. Please try again.';
    errEl.classList.remove('hidden');
  }
  btn.textContent = '🚩 Submit Report'; btn.disabled = false;
}

// ─── MODULE SELECTION ─────────────────────────────────────────
function initModuleSelection() {
  const moduleCards = document.querySelectorAll('[data-purpose="module-grid"] > div');
  moduleCards.forEach(card => {
    card.addEventListener('click', () => {
      const moduleName = card.querySelector('h3')?.textContent;
      const moduleData = modules[moduleName];
      if (!moduleData) return;

      // Update active card styles
      moduleCards.forEach(c => {
        c.classList.remove('bg-gradient-to-br', 'from-secondary', 'to-secondary-dark', 'text-white', 'shadow-lg');
        c.classList.add('bg-white');
      });
      card.classList.remove('bg-white');
      card.classList.add('bg-gradient-to-br', 'from-secondary', 'to-secondary-dark', 'text-white', 'shadow-lg');

      updateContentDisplay(moduleName, moduleData);
    });
  });
}

function updateContentDisplay(name, data) {
  const display = document.querySelector('[data-purpose="content-display"]');
  if (!display) return;
  const h2 = display.querySelector('h2');
  if (h2) h2.textContent = name;

  const iconEl = display.querySelector('.w-16.h-16');
  if (iconEl) iconEl.innerHTML = data.icon;

  const containers = display.querySelectorAll('.space-y-4');
  if (containers[0]) {
    containers[0].innerHTML = data.dos.map(item => `
      <div class="bg-primary/5 border border-primary/20 p-5 rounded-2xl flex items-center gap-4">
        <div class="w-6 h-6 bg-primary rounded-full flex-shrink-0 flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/></svg>
        </div>
        <p class="font-medium">${item}</p>
      </div>`).join('');
  }
  if (containers[1]) {
    containers[1].innerHTML = data.donts.map(item => `
      <div class="bg-red-50/50 border border-red-100 p-5 rounded-2xl flex items-center gap-4">
        <div class="w-6 h-6 bg-red-500 rounded-full flex-shrink-0 flex items-center justify-center">
          <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/></svg>
        </div>
        <p class="font-medium">${item}</p>
      </div>`).join('');
  }
}

// ─── QUIZ BUTTONS ─────────────────────────────────────────────
function initQuizButtons() {
  document.querySelectorAll('button').forEach(btn => {
    const txt = btn.textContent.trim();
    if (btn.classList.contains('btn-gradient') || txt.includes('Test Your Knowledge') || txt.includes('Take Quiz')) {
      // Replace the single button with two side-by-side buttons
      const wrapper = document.createElement('div');
      wrapper.className = 'flex flex-col sm:flex-row gap-3 mt-2';
      wrapper.innerHTML = `
        <button id="ua-start-quiz-btn" class="flex-1 btn-gradient p-1 rounded-2xl shadow-lg shadow-blue-100 transition-transform active:scale-95">
          <div class="bg-transparent text-white py-4 flex items-center justify-center gap-2 font-bold text-base">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
            Start Quiz
          </div>
        </button>
        <button id="ua-start-scenario-btn" class="flex-1 p-1 rounded-2xl border-2 border-purple-400 bg-purple-50 hover:bg-purple-100 transition-transform active:scale-95">
          <div class="text-purple-700 py-4 flex items-center justify-center gap-2 font-bold text-base">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
            Scenario Mode
          </div>
        </button>`;
      btn.replaceWith(wrapper);
      document.getElementById('ua-start-quiz-btn').addEventListener('click', () => startQuiz('mcq'));
      document.getElementById('ua-start-scenario-btn').addEventListener('click', () => {
        const quizSection = document.getElementById('quiz-section');
        if (quizSection) { quizSection.classList.remove('hidden'); quizSection.scrollIntoView({ behavior: 'smooth' }); }
        showLevelPicker();
      });
    }
  });
}

async function startQuiz(mode) {
  quizMode = mode;
  currentQuestionIndex = 0;
  userScore = 0;

  const quizSection = document.getElementById('quiz-section');
  if (!quizSection) return;
  quizSection.classList.remove('hidden');
  quizSection.scrollIntoView({ behavior: 'smooth' });

  if (mode === 'mcq') {
    try {
      const res = await fetch(`${API}/quiz/questions`);
      const json = await res.json();
      quizQuestions = json.success ? json.questions : FALLBACK_QUESTIONS;
    } catch (e) {
      quizQuestions = FALLBACK_QUESTIONS;
    }
    loadMCQQuestion(0);
  } else {
    showLevelPicker();
  }
}
window.startQuiz = startQuiz;

// Exposed so quiz.js and inline HTML onclick can call it directly
window.showLevelPickerDirect = function() {
  const quizSection = document.getElementById('quiz-section');
  if (quizSection) { quizSection.classList.remove('hidden'); quizSection.scrollIntoView({ behavior: 'smooth' }); }
  showLevelPicker();
};

// ─── LEVEL PICKER ─────────────────────────────────────────────
function showLevelPicker() {
  const container = document.getElementById('quiz-section');
  if (!container) return;
  container.innerHTML = `
    <div class="text-center mb-8">
      <span class="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest">🧠 Scenario Mode</span>
      <h3 class="text-2xl font-bold mt-4 text-gray-800">Choose Difficulty</h3>
      <p class="text-gray-500 mt-2 text-sm">Different levels award different points</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <button onclick="startScenarioLevel('easy')"
        class="p-6 rounded-2xl bg-green-50 border-2 border-green-200 hover:border-green-500 hover:bg-green-100 transition text-left cursor-pointer">
        <div class="text-2xl mb-2">🌱</div>
        <div class="font-bold text-green-700 text-lg">Easy</div>
        <div class="text-green-600 text-xs mt-1">Everyday actions · up to 10 pts</div>
      </button>
      <button onclick="startScenarioLevel('medium')"
        class="p-6 rounded-2xl bg-amber-50 border-2 border-amber-200 hover:border-amber-500 hover:bg-amber-100 transition text-left cursor-pointer">
        <div class="text-2xl mb-2">🌍</div>
        <div class="font-bold text-amber-700 text-lg">Medium</div>
        <div class="text-amber-600 text-xs mt-1">Community challenges · up to 20 pts</div>
      </button>
      <button onclick="startScenarioLevel('hard')"
        class="p-6 rounded-2xl bg-red-50 border-2 border-red-200 hover:border-red-500 hover:bg-red-100 transition text-left cursor-pointer">
        <div class="text-2xl mb-2">🔥</div>
        <div class="font-bold text-red-700 text-lg">Hard</div>
        <div class="text-red-600 text-xs mt-1">Policy & systems · up to 30 pts</div>
      </button>
    </div>
    <div class="text-center">
      <button onclick="startQuiz('mcq')" class="text-gray-400 text-sm hover:text-gray-600 transition">← Back to MCQ Quiz</button>
    </div>`;
}
window.showLevelPicker = showLevelPicker;

window.startScenarioLevel = async function(level) {
  const container = document.getElementById('quiz-section');
  container.innerHTML = `<div class="text-center py-10 text-gray-400"><p class="text-lg">Loading scenario…</p></div>`;

  let scenarioId, scenarioText;
  try {
    const res = await fetch(`${API}/quiz/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('ua_token') ? { Authorization: `Bearer ${localStorage.getItem('ua_token')}` } : {}) },
      body: JSON.stringify({ level })
    });
    const json = await res.json();
    if (json.success && json.scenario) {
      scenarioId   = json.scenario.id;
      scenarioText = json.scenario.scenario;
    }
  } catch (e) {}

  // Fallback to local scenario if backend unreachable
  if (!scenarioText) {
    scenarioText = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
  }

  const maxPts = { easy: 10, medium: 20, hard: 30 }[level] || 20;
  const levelColors = { easy: 'green', medium: 'amber', hard: 'red' };
  const c = levelColors[level] || 'purple';

  container.innerHTML = `
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-4">
        <span class="bg-${c}-100 text-${c}-700 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest">
          🧠 ${level.charAt(0).toUpperCase() + level.slice(1)} Scenario
        </span>
        <span class="text-xs text-gray-400">Up to ${maxPts} points</span>
      </div>
      <div class="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-6">
        <p class="text-gray-800 text-lg font-medium leading-relaxed">${scenarioText}</p>
      </div>
      <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Your Response</label>
      <textarea id="scenario-answer" rows="5" placeholder="Describe what actions you would take and why..."
        class="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-secondary outline-none text-sm leading-relaxed resize-none"
        oninput="document.getElementById('scenario-counter').textContent = this.value.length + '/500'"></textarea>
      <div class="flex justify-between text-xs text-gray-400 mt-1">
        <span>Be specific and think about community impact</span>
        <span id="scenario-counter">0/500</span>
      </div>
    </div>
    <div class="flex justify-between items-center mt-6">
      <button onclick="showLevelPicker()" class="text-gray-400 font-bold px-6 py-3 hover:text-gray-600 transition">← Change Level</button>
      <button id="scenario-submit-btn"
        class="bg-${c}-600 text-white px-10 py-4 rounded-2xl font-bold hover:opacity-90 transition">
        Submit Answer ✨
      </button>
    </div>`;

  document.getElementById('scenario-submit-btn').addEventListener('click', async () => {
    const answer = document.getElementById('scenario-answer')?.value?.trim();
    if (!answer || answer.length < 20) { showToast('Please write a more detailed response (at least 20 characters).'); return; }

    const btn = document.getElementById('scenario-submit-btn');
    btn.textContent = 'Evaluating…'; btn.disabled = true;

    // Inform guest users their answer is evaluated locally (no points saved)
    if (!localStorage.getItem('ua_token') && !localStorage.getItem('token')) {
      if (typeof showToast === 'function') showToast('Log in to save your sustainability points! 🌱');
    }

    let evaluation, points;
    try {
      const payload = scenarioId
        ? { level, scenarioId, answer }
        : { level, answer };
      const res = await fetch(`${API}/quiz/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('ua_token') ? { Authorization: `Bearer ${localStorage.getItem('ua_token')}` } : {}) },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (json.success) { evaluation = json.evaluation; points = json.points; }
    } catch (e) {}

    // Offline fallback
    if (!evaluation) {
      const words = answer.split(' ').length;
      points = Math.min(maxPts, Math.max(1, Math.floor(words / 5)));
      evaluation = {
        score: points, maxScore: maxPts,
        feedback: 'Your response shows thoughtfulness about urban sustainability challenges.',
        correct_approach: 'Ideal answers include community engagement, official reporting, and sustainable alternatives.',
        sustainability_tip: 'Document issues with photos and share on UrbanAware for community support.'
      };
    }

    addPoints(points || evaluation.score || 5);
    const sc = evaluation.score; const mx = evaluation.maxScore || maxPts;
    const scoreColor = (sc / mx) >= 0.7 ? 'green' : (sc / mx) >= 0.4 ? 'amber' : 'red';

    container.innerHTML = `
      <div class="space-y-6">
        <div class="text-center">
          <div class="w-20 h-20 bg-${scoreColor}-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span class="text-2xl font-black text-${scoreColor}-600">${sc}/${mx}</span>
          </div>
          <h3 class="text-2xl font-bold text-gray-800">Evaluation Result</h3>
        </div>
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <p class="text-sm font-bold text-blue-700 mb-2">📋 Feedback</p>
          <p class="text-gray-700 leading-relaxed">${evaluation.feedback}</p>
        </div>
        <div class="bg-green-50 border border-green-200 rounded-2xl p-5">
          <p class="text-sm font-bold text-green-700 mb-2">✅ Ideal Approach</p>
          <p class="text-gray-700 leading-relaxed">${evaluation.correct_approach}</p>
        </div>
        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p class="text-sm font-bold text-amber-700 mb-2">💡 Tip</p>
          <p class="text-gray-700 leading-relaxed">${evaluation.sustainability_tip}</p>
        </div>
        <div class="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-center">
          <p class="text-purple-700 font-bold">+${points || evaluation.score} Sustainability Points! 🌱</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <button onclick="startScenarioLevel('${level}')" class="bg-${c}-600 text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition">Try Another →</button>
          <button onclick="showLevelPicker()" class="bg-white border-2 border-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition">Change Level</button>
          <button onclick="startQuiz('mcq')" class="bg-white border-2 border-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition">Back to MCQ</button>
        </div>
      </div>`;
  });
};

// ─── MCQ QUIZ ─────────────────────────────────────────────────
function loadMCQQuestion(index) {
  const container = document.getElementById('quiz-section');
  const q = quizQuestions[index];
  if (!q) return finishMCQ();

  container.innerHTML = `
    <div class="mb-8">
      <span class="bg-secondary/10 text-secondary px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest">
        Question ${index + 1} of ${quizQuestions.length}
      </span>
      <h3 class="text-2xl font-bold mt-4 text-gray-800">${q.q}</h3>
    </div>
    <div class="grid grid-cols-1 gap-4 mb-10">
      ${q.options.map((opt, i) => `
        <label class="flex items-center p-5 border-2 border-gray-100 rounded-3xl hover:border-secondary cursor-pointer transition-all quiz-option-label" data-index="${i}">
          <input class="w-5 h-5 text-secondary border-gray-300" name="quiz-option" type="radio" value="${i}"/>
          <span class="ml-4 text-base font-medium">${opt}</span>
        </label>`).join('')}
    </div>
    <div class="flex justify-between items-center">
      <button class="text-gray-400 font-bold px-6 py-3 hover:text-gray-600 transition" onclick="skipMCQ()">Skip</button>
      <button class="bg-gray-800 text-white px-10 py-4 rounded-2xl font-bold hover:bg-gray-700 transition" onclick="nextMCQ()">
        ${index === quizQuestions.length - 1 ? 'Finish Quiz' : 'Next Question'}
      </button>
    </div>`;

  // Highlight selected option
  container.querySelectorAll('.quiz-option-label').forEach(label => {
    label.addEventListener('click', () => {
      container.querySelectorAll('.quiz-option-label').forEach(l => {
        l.classList.remove('border-secondary', 'bg-secondary/5');
      });
      label.classList.add('border-secondary', 'bg-secondary/5');
    });
  });
}

window.skipMCQ = function() {
  currentQuestionIndex < quizQuestions.length - 1 ? loadMCQQuestion(++currentQuestionIndex) : finishMCQ();
};

window.nextMCQ = function() {
  const selected = document.querySelector('input[name="quiz-option"]:checked');
  if (!selected) { showToast('Please select an answer!'); return; }

  if (parseInt(selected.value) === quizQuestions[currentQuestionIndex].correct) {
    userScore++;
    showToast('✅ Correct! +10 points');
  } else {
    showToast(`❌ Incorrect. Correct: ${quizQuestions[currentQuestionIndex].options[quizQuestions[currentQuestionIndex].correct]}`);
  }

  currentQuestionIndex < quizQuestions.length - 1 ? loadMCQQuestion(++currentQuestionIndex) : finishMCQ();
};

async function finishMCQ() {
  const points = userScore * 10;
  const perf = userScore / quizQuestions.length;
  const msg = perf >= 0.7 ? "Excellent! You're a true Green Citizen. 🌿" : "Good effort! Keep learning to improve.";

  try {
    await fetch(`${API}/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(localStorage.getItem('ua_token') ? { Authorization: `Bearer ${localStorage.getItem('ua_token')}` } : {}) },
      body: JSON.stringify({ score: userScore, total: quizQuestions.length })
    });
  } catch (e) {}
  addPoints(points);

  document.getElementById('quiz-section').innerHTML = `
    <div class="text-center py-10">
      <div class="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/></svg>
      </div>
      <h2 class="text-4xl font-bold mb-3">Quiz Complete!</h2>
      <p class="text-6xl font-black text-secondary mb-4">${userScore}/${quizQuestions.length}</p>
      <p class="text-lg text-gray-500 mb-6">${msg}</p>
      <div class="bg-green-50 border border-green-100 p-4 rounded-2xl mb-8 inline-block">
        <p class="text-green-700 font-bold">+${points} Sustainability Points earned! 🌱</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button onclick="startQuiz('mcq')" class="btn-gradient text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition">Retake Quiz</button>
        <button onclick="startQuiz('scenario')" class="bg-white border-2 border-secondary text-secondary px-8 py-4 rounded-2xl font-bold hover:bg-secondary/5 transition">Try Scenario Mode 🧠</button>
      </div>
    </div>`;
}

// ─── SCENARIO MODE ────────────────────────────────────────────
function loadScenario(index) {
  const container = document.getElementById('quiz-section');
  const scenario = SCENARIOS[index % SCENARIOS.length];

  container.innerHTML = `
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-4">
        <span class="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-widest">🧠 Scenario ${index + 1} of ${SCENARIOS.length}</span>
        <span class="text-xs text-gray-400">AI-Evaluated</span>
      </div>
      <div class="bg-amber-50 border border-amber-200 p-6 rounded-2xl mb-6">
        <p class="text-gray-800 text-lg font-medium leading-relaxed">${scenario}</p>
      </div>
      <label class="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Your Response</label>
      <textarea id="scenario-answer" rows="5" placeholder="Describe what actions you would take and why..." 
        class="w-full p-4 border-2 border-gray-100 rounded-2xl focus:border-secondary outline-none text-sm leading-relaxed resize-none"
        oninput="document.getElementById('scenario-counter').textContent = this.value.length + '/500'"></textarea>
      <div class="flex justify-between text-xs text-gray-400 mt-1">
        <span>Be specific and think about community impact</span>
        <span id="scenario-counter">0/500</span>
      </div>
    </div>
    <div class="flex justify-between items-center mt-6">
      <button onclick="skipScenario(${index})" class="text-gray-400 font-bold px-6 py-3 hover:text-gray-600 transition">Skip</button>
      <button onclick="submitScenario('${escapeForAttr(scenario)}', ${index})" id="scenario-submit-btn"
        class="bg-purple-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-purple-700 transition">
        Submit for AI Review ✨
      </button>
    </div>`;
}

window.skipScenario = function(index) {
  if (index < SCENARIOS.length - 1) loadScenario(index + 1);
  else finishScenarios();
};

window.submitScenario = async function(scenario, index) {
  const answer = document.getElementById('scenario-answer')?.value?.trim();
  if (!answer || answer.length < 20) { showToast('Please write a more detailed response (at least 20 characters).'); return; }

  const btn = document.getElementById('scenario-submit-btn');
  btn.textContent = 'Evaluating...'; btn.disabled = true;

  try {
    const res = await fetch(`${API}/quiz/scenario`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('ua_token') ? { Authorization: `Bearer ${localStorage.getItem('ua_token')}` } : {})
      },
      body: JSON.stringify({ scenario, userAnswer: answer })
    });
    const json = await res.json();

    if (json.success) {
      showScenarioFeedback(json.evaluation, json.points, index);
    } else {
      showToast('Could not evaluate. Try again.');
      btn.textContent = 'Submit for AI Review ✨'; btn.disabled = false;
    }
  } catch (e) {
    // Offline fallback scoring
    const words = answer.split(' ').length;
    const score = Math.min(10, Math.max(3, Math.floor(words / 5)));
    showScenarioFeedback({
      score,
      feedback: 'Your response shows thoughtfulness about urban sustainability challenges.',
      correct_approach: 'Ideal answers include community engagement, official reporting, and sustainable alternatives.',
      sustainability_tip: 'Document issues with photos and share on UrbanAware for community support.'
    }, score, index);
  }
};

function showScenarioFeedback(evaluation, points, index) {
  addPoints(points || evaluation.score || 5);
  const scoreColor = evaluation.score >= 8 ? 'green' : evaluation.score >= 5 ? 'amber' : 'red';
  const container = document.getElementById('quiz-section');

  container.innerHTML = `
    <div class="space-y-6">
      <div class="text-center">
        <div class="w-20 h-20 bg-${scoreColor}-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-3xl font-black text-${scoreColor}-600">${evaluation.score}/10</span>
        </div>
        <h3 class="text-2xl font-bold text-gray-800">AI Evaluation</h3>
      </div>
      <div class="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <p class="text-sm font-bold text-blue-700 mb-2">📋 Feedback</p>
        <p class="text-gray-700 leading-relaxed">${evaluation.feedback}</p>
      </div>
      <div class="bg-green-50 border border-green-200 rounded-2xl p-5">
        <p class="text-sm font-bold text-green-700 mb-2">✅ Ideal Approach</p>
        <p class="text-gray-700 leading-relaxed">${evaluation.correct_approach}</p>
      </div>
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p class="text-sm font-bold text-amber-700 mb-2">💡 Tip</p>
        <p class="text-gray-700 leading-relaxed">${evaluation.sustainability_tip}</p>
      </div>
      <div class="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-center">
        <p class="text-purple-700 font-bold">+${points || evaluation.score} Sustainability Points! 🌱</p>
      </div>
      <div class="flex flex-col sm:flex-row gap-4 justify-center pt-2">
        ${index < SCENARIOS.length - 1
          ? `<button onclick="loadScenario(${index + 1})" class="bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-700 transition">Next Scenario →</button>`
          : `<button onclick="finishScenarios()" class="bg-purple-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-purple-700 transition">Finish 🎉</button>`
        }
        <button onclick="startQuiz('mcq')" class="bg-white border-2 border-gray-200 text-gray-600 px-8 py-4 rounded-2xl font-bold hover:bg-gray-50 transition">Back to MCQ Quiz</button>
      </div>
    </div>`;
}

window.finishScenarios = function() {
  document.getElementById('quiz-section').innerHTML = `
    <div class="text-center py-10">
      <div class="text-6xl mb-4">🏆</div>
      <h2 class="text-3xl font-bold mb-3">Scenario Mode Complete!</h2>
      <p class="text-gray-500 mb-6">You've demonstrated real-world sustainability thinking.</p>
      <button onclick="location.reload()" class="btn-gradient text-white px-8 py-4 rounded-2xl font-bold hover:opacity-90 transition">Start Over</button>
    </div>`;
};

function escapeForAttr(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, '&quot;').replace(/\n/g, ' ');
}

const FALLBACK_QUESTIONS = [
  { id:1, q:"Which is the most energy-efficient travel for short distances?", options:["Electric SUV","Walking or Biking","Diesel Taxi","Motorbike"], correct:1 },
  { id:2, q:"What should you do with wet kitchen waste?", options:["Burn it","Mix with plastic","Compost it","Flush it"], correct:2 },
  { id:3, q:"How does carpooling help the environment?", options:["Reduces traffic & emissions","Makes cars faster","Saves walking time","Increases fuel use"], correct:0 },
  { id:4, q:"Major source of urban air pollution?", options:["Solar panels","Bicycle lanes","Vehicle exhaust","Planting trees"], correct:2 },
  { id:5, q:"Recommended action when AQI is 'Poor'?", options:["Go for a run","Stay indoors, use air purifiers","Open all windows","Start a bonfire"], correct:1 },
  { id:6, q:"Most energy-efficient light bulb?", options:["Incandescent","Fluorescent","LED","Halogen"], correct:2 },
  { id:7, q:"Where to dispose of old electronics?", options:["Regular bin","E-waste collection center","Nearest river","Bury in soil"], correct:1 },
  { id:8, q:"Best way to reduce plastic waste?", options:["Use more plastic bags","Switch to reusable bags","Buy only bottled water","Throw in park"], correct:1 },
];
