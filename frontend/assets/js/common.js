// assets/js/common.js — UrbanAware Global JS
// ─── CONFIG ──────────────────────────────────────────────────
const API_BASE = 'http://localhost:3001/api';

// ─── AUTH HELPERS ─────────────────────────────────────────────
function getToken() { return localStorage.getItem('ua_token'); }
function getUser()  { 
  try { return JSON.parse(localStorage.getItem('ua_user') || 'null'); } 
  catch { return null; } 
}
function setAuth(token, user) {
  localStorage.setItem('ua_token', token);
  localStorage.setItem('token', token);          // compatibility alias
  localStorage.setItem('ua_user', JSON.stringify(user));
}
function clearAuth() {
  localStorage.removeItem('ua_token');
  localStorage.removeItem('token');
  localStorage.removeItem('ua_user');
  localStorage.removeItem('ua_impact_score');
}
function isLoggedIn() { return !!getToken(); }

async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    return res.json();
  } catch (e) {
    return { success: false, message: 'Network error. Please check if the backend is running.' };
  }
}

// ─── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('fade-in');
  setupNavigation();
  injectProfileButton();
  initUserImpactScore();
});

// ─── NAV ──────────────────────────────────────────────────────
function setupNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'home.html';
  const navLinks = document.querySelectorAll('nav a, header nav a');

  navLinks.forEach(link => {
    const linkPath = link.getAttribute('href');
    if (!linkPath || linkPath.startsWith('#')) return;
    if (linkPath === currentPage) {
      link.classList.add('nav-link-active');
    } else {
      link.classList.remove('nav-link-active', 'text-ua-green', 'bg-green-50');
    }
    link.addEventListener('click', (e) => {
      if (linkPath && !linkPath.startsWith('#')) {
        e.preventDefault();
        document.body.style.opacity = '0';
        setTimeout(() => { window.location.href = linkPath; }, 250);
      }
    });
  });

  const logo = document.querySelector('[data-purpose="logo"]');
  if (logo) { logo.style.cursor = 'pointer'; logo.addEventListener('click', () => { window.location.href = 'home.html'; }); }
}

// ─── PROFILE BUTTON INJECTION ─────────────────────────────────
function injectProfileButton() {
  // Find the rightmost element of any nav (varies per page)
  const navContainers = [
    document.querySelector('nav .flex.items-center.justify-between'),
    document.querySelector('header nav'),
    document.querySelector('nav > div > div.flex.justify-between'),
  ].filter(Boolean);

  const navRight = document.querySelector(
    'nav > div > div > a[href="dashboard.html"]:last-child, ' +
    'header > nav > a[href="reportissue.html"], ' +
    'nav .flex.justify-between.h-16'
  );

  // Universal approach: insert before the last child of any nav's flex container
  const headers = document.querySelectorAll('header, nav');
  headers.forEach(header => {
    if (header.querySelector('.ua-profile-btn')) return; // already injected

    // Find the rightmost slot
    const rightSlot = header.querySelector(
      'a[href="dashboard.html"].px-5, ' +  // home.html nav
      'a.bg-brand-green[href="reportissue.html"], ' + // reportissue nav
      'div.w-10.h-10.rounded-full' // dashboard nav
    );

    const btn = buildProfileButton();
    
    if (rightSlot) {
      rightSlot.parentNode.insertBefore(btn, rightSlot.nextSibling);
    } else {
      // Find flex row that holds nav items and append
      const flexRow = header.querySelector('.flex.items-center.justify-between, .flex.justify-between');
      if (flexRow) flexRow.appendChild(btn);
    }
  });
}

function buildProfileButton() {
  const user = getUser();
  const wrapper = document.createElement('div');
  wrapper.className = 'ua-profile-btn relative ml-3 flex-shrink-0';

  if (isLoggedIn() && user) {
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : 'UA';
    wrapper.innerHTML = `
      <button onclick="window.location.href='profile.html'" 
        class="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md hover:shadow-lg transition-all hover:scale-105 border-2 border-white" 
        title="View Profile (${user.name})">
        ${user.avatar 
          ? `<img src="${user.avatar}" alt="${user.name}" class="w-full h-full object-cover rounded-full" />`
          : initials
        }
      </button>
    `;
  } else {
    wrapper.innerHTML = `
      <button onclick="openAuthModal()" 
        class="px-4 py-1.5 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all hover:scale-105"
        title="Login / Sign Up">
        Login
      </button>
    `;
  }
  return wrapper;
}

// ─── AUTH MODAL ───────────────────────────────────────────────
function openAuthModal(defaultTab = 'login') {
  let overlay = document.getElementById('ua-auth-modal');
  if (overlay) { overlay.classList.add('active'); switchAuthTab(defaultTab); return; }

  overlay = document.createElement('div');
  overlay.id = 'ua-auth-modal';
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:420px;">
      <div class="flex items-center justify-between mb-6">
        <div class="flex gap-4">
          <button id="tab-login" onclick="switchAuthTab('login')" class="font-bold text-lg border-b-2 border-green-500 text-green-600 pb-1">Login</button>
          <button id="tab-signup" onclick="switchAuthTab('signup')" class="font-bold text-lg border-b-2 border-transparent text-slate-400 pb-1">Sign Up</button>
        </div>
        <button onclick="document.getElementById('ua-auth-modal').classList.remove('active')" class="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
      </div>

      <div id="auth-form-login">
        <form onsubmit="handleLogin(event)" class="space-y-4">
          <input id="login-email" type="email" placeholder="Email address" required
            class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
          <input id="login-password" type="password" placeholder="Password" required
            class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
          <button type="submit" id="login-btn"
            class="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:opacity-90 transition-all">
            Login
          </button>
          <p class="text-center text-xs text-slate-400">Don't have an account? <button type="button" onclick="switchAuthTab('signup')" class="text-green-600 font-bold">Sign up</button></p>
        </form>
      </div>

      <div id="auth-form-signup" class="hidden">
        <form onsubmit="handleSignup(event)" class="space-y-4">
          <input id="signup-name" type="text" placeholder="Full name" required
            class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
          <input id="signup-email" type="email" placeholder="Email address" required
            class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
          <input id="signup-password" type="password" placeholder="Password (min 6 chars)" required minlength="6"
            class="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
          <button type="submit" id="signup-btn"
            class="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:opacity-90 transition-all">
            Create Account
          </button>
          <p class="text-center text-xs text-slate-400">Already have an account? <button type="button" onclick="switchAuthTab('login')" class="text-green-600 font-bold">Login</button></p>
        </form>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
}

window.openAuthModal = openAuthModal;

window.switchAuthTab = function(tab) {
  const loginForm = document.getElementById('auth-form-login');
  const signupForm = document.getElementById('auth-form-signup');
  const loginTab = document.getElementById('tab-login');
  const signupTab = document.getElementById('tab-signup');
  if (!loginForm) return;

  if (tab === 'login') {
    loginForm.classList.remove('hidden');
    signupForm.classList.add('hidden');
    loginTab.className = 'font-bold text-lg border-b-2 border-green-500 text-green-600 pb-1';
    signupTab.className = 'font-bold text-lg border-b-2 border-transparent text-slate-400 pb-1';
  } else {
    loginForm.classList.add('hidden');
    signupForm.classList.remove('hidden');
    loginTab.className = 'font-bold text-lg border-b-2 border-transparent text-slate-400 pb-1';
    signupTab.className = 'font-bold text-lg border-b-2 border-green-500 text-green-600 pb-1';
  }
};

window.handleLogin = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.textContent = 'Logging in...'; btn.disabled = true;
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: document.getElementById('login-email').value, password: document.getElementById('login-password').value })
  });
  if (result.success) {
    setAuth(result.token, result.user);
    localStorage.setItem('ua_impact_score', result.user.score);
    document.getElementById('ua-auth-modal').classList.remove('active');
    showToast(`Welcome back, ${result.user.name}! 🌱`);
    setTimeout(() => location.reload(), 800);
  } else {
    showToast(result.message || 'Login failed.');
    btn.textContent = 'Login'; btn.disabled = false;
  }
};

window.handleSignup = async function(e) {
  e.preventDefault();
  const btn = document.getElementById('signup-btn');
  btn.textContent = 'Creating account...'; btn.disabled = true;
  const result = await apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name: document.getElementById('signup-name').value, email: document.getElementById('signup-email').value, password: document.getElementById('signup-password').value })
  });
  if (result.success) {
    setAuth(result.token, result.user);
    localStorage.setItem('ua_impact_score', result.user.score);
    document.getElementById('ua-auth-modal').classList.remove('active');
    showToast(`Welcome to UrbanAware, ${result.user.name}! 🌱`);
    setTimeout(() => location.reload(), 800);
  } else {
    showToast(result.message || 'Signup failed.');
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
};

// ─── TOAST ────────────────────────────────────────────────────
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('active');
  setTimeout(() => toast.classList.remove('active'), 3000);
}
window.showToast = showToast;

// ─── SCORE / GAMIFICATION ─────────────────────────────────────
function initUserImpactScore() {
  let score = localStorage.getItem('ua_impact_score');
  if (score === null) { score = 0; localStorage.setItem('ua_impact_score', score); }
  updateScoreDisplay(score);
}

function updateScoreDisplay(score) {
  document.querySelectorAll('.sustainability-score-value').forEach(el => { el.textContent = parseInt(score).toLocaleString(); });
  document.querySelectorAll('.sustainability-badge').forEach(el => { el.textContent = getBadge(score); });
  document.querySelectorAll('.sustainability-progress-bar').forEach(bar => {
    const nextMilestone = 5000;
    bar.style.width = `${Math.min((score / nextMilestone) * 100, 100)}%`;
  });
}

function getBadge(score) {
  if (score >= 3000) return 'Eco Champion';
  if (score >= 1500) return 'Sustainability Hero';
  if (score >= 500)  return 'Green Citizen';
  if (score >= 100)  return 'Eco Starter';
  return 'Eco Beginner';
}

async function addPoints(points) {
  let score = parseInt(localStorage.getItem('ua_impact_score') || 0);
  score += points;
  localStorage.setItem('ua_impact_score', score);
  updateScoreDisplay(score);
  showToast(`+${points} Sustainability Points! 🌱`);

  // Sync to backend if logged in
  if (isLoggedIn()) {
    try { await apiRequest('/user/profile'); } catch(e) {}
  }
}
window.addPoints = addPoints;

// ─── MODAL ────────────────────────────────────────────────────
function showModal(title, content, onConfirm) {
  let overlay = document.querySelector('.modal-overlay:not(#ua-auth-modal)');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-content">
        <h2 class="text-2xl font-bold mb-4"></h2>
        <div class="modal-body mb-6"></div>
        <div class="flex justify-end gap-4">
          <button class="modal-close px-6 py-2 border border-slate-200 rounded-xl font-semibold">Cancel</button>
          <button class="modal-confirm px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.classList.remove('active'));
  }
  overlay.querySelector('h2').textContent = title;
  overlay.querySelector('.modal-body').innerHTML = content;
  const confirmBtn = overlay.querySelector('.modal-confirm');
  const newBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);
  newBtn.addEventListener('click', () => { if (onConfirm) onConfirm(); overlay.classList.remove('active'); });
  overlay.classList.add('active');
}
window.showModal = showModal;
