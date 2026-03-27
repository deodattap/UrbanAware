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
});

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
  // Find quiz start button(s)
  document.querySelectorAll('button').forEach(btn => {
    if (btn.classList.contains('btn-gradient') || btn.textContent.trim().includes('Take Quiz')) {
      btn.addEventListener('click', () => startQuiz('mcq'));
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
    loadScenario(0);
  }
}
window.startQuiz = startQuiz;

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
