// assets/js/common.js — UrbanAware Global JS
// ─── CONFIG ──────────────────────────────────────────────────
const API_BASE = 'http://localhost:3001/api';

// ─── AUTH HELPERS ─────────────────────────────────────────────
function getToken() { return localStorage.getItem('ua_token') || localStorage.getItem('token'); }
function getUser()  {
  try { return JSON.parse(localStorage.getItem('ua_user') || 'null'); }
  catch { return null; }
}
function setAuth(token, user) {
  localStorage.setItem('ua_token', token);
  localStorage.setItem('token', token);
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
  injectAuthSlot();
  initUserImpactScore();
});

// ─── NAV ACTIVE LINK ──────────────────────────────────────────
function setupNavigation() {
  const currentPage = window.location.pathname.split('/').pop() || 'home.html';
  document.querySelectorAll('nav a, header nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    if (href === currentPage) link.classList.add('nav-link-active');
    link.addEventListener('click', (e) => {
      if (href && !href.startsWith('#')) {
        e.preventDefault();
        document.body.style.opacity = '0';
        setTimeout(() => { window.location.href = href; }, 250);
      }
    });
  });
  const logo = document.querySelector('[data-purpose="logo"]');
  if (logo) { logo.style.cursor = 'pointer'; logo.addEventListener('click', () => { window.location.href = 'home.html'; }); }
}

// ─── AUTH SLOT INJECTION ──────────────────────────────────────
function injectAuthSlot() {
  const slot = document.getElementById('ua-nav-auth-slot');
  if (slot) {
    slot.innerHTML = '';
    slot.appendChild(buildAuthButton());
    return;
  }
  // Fallback for any page missing the slot
  const targets = [
    document.querySelector('header'),
    document.querySelector('nav > div > div'),
    document.querySelector('nav'),
  ].filter(Boolean);
  for (const t of targets) {
    if (t.querySelector('.ua-auth-wrapper')) continue;
    t.appendChild(buildAuthButton());
    break;
  }
}

function buildAuthButton() {
  const user = getUser();
  const wrapper = document.createElement('div');
  wrapper.className = 'ua-auth-wrapper flex items-center gap-2 flex-shrink-0';
  if (isLoggedIn() && user) {
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'UA';
    wrapper.innerHTML = `
      <span class="text-sm font-semibold text-gray-600 hidden sm:block" style="max-width:100px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(user.name || '')}</span>
      <button onclick="window.location.href='profile.html'"
        style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#22c55e,#3b82f6);color:#fff;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.15);cursor:pointer;flex-shrink:0"
        title="Profile (${escHtml(user.name || '')})">${initials}</button>
      <button onclick="handleLogout()"
        style="padding:4px 10px;font-size:12px;font-weight:600;color:#6b7280;border:1px solid #e5e7eb;border-radius:10px;cursor:pointer;background:#fff;transition:all .2s"
        title="Logout">Logout</button>`;
  } else {
    wrapper.innerHTML = `
      <button onclick="openAuthModal('login')"
        style="padding:7px 16px;background:linear-gradient(135deg,#22c55e,#3b82f6);color:#fff;border-radius:12px;font-size:13px;font-weight:700;cursor:pointer;border:none;box-shadow:0 2px 8px rgba(0,0,0,.15)"
        title="Login">Login</button>`;
  }
  return wrapper;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─── LOGOUT ───────────────────────────────────────────────────
window.handleLogout = function() {
  clearAuth();
  showToast('Logged out. See you soon! 👋');
  setTimeout(() => location.reload(), 700);
};

// ─── AUTH MODAL ───────────────────────────────────────────────
function openAuthModal(defaultTab = 'login') {
  let overlay = document.getElementById('ua-auth-modal');
  if (overlay) { overlay.classList.add('active'); switchAuthTab(defaultTab); return; }

  overlay = document.createElement('div');
  overlay.id = 'ua-auth-modal';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'z-index:10000;';
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
          <div id="login-error" class="hidden text-red-500 text-sm font-semibold rounded-lg bg-red-50 px-3 py-2"></div>
          <button type="submit" id="login-btn"
            class="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:opacity-90 transition-all">Login</button>
          <p class="text-center text-xs text-slate-400">No account? <button type="button" onclick="switchAuthTab('signup')" class="text-green-600 font-bold">Sign up</button></p>
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
          <div id="signup-error" class="hidden text-red-500 text-sm font-semibold rounded-lg bg-red-50 px-3 py-2"></div>
          <button type="submit" id="signup-btn"
            class="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:opacity-90 transition-all">Create Account</button>
          <p class="text-center text-xs text-slate-400">Have an account? <button type="button" onclick="switchAuthTab('login')" class="text-green-600 font-bold">Login</button></p>
        </form>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
  switchAuthTab(defaultTab);
}
window.openAuthModal = openAuthModal;

window.switchAuthTab = function(tab) {
  const lf = document.getElementById('auth-form-login');
  const sf = document.getElementById('auth-form-signup');
  const lt = document.getElementById('tab-login');
  const st = document.getElementById('tab-signup');
  if (!lf) return;
  if (tab === 'login') {
    lf.classList.remove('hidden'); sf.classList.add('hidden');
    lt.className = 'font-bold text-lg border-b-2 border-green-500 text-green-600 pb-1';
    st.className = 'font-bold text-lg border-b-2 border-transparent text-slate-400 pb-1';
  } else {
    lf.classList.add('hidden'); sf.classList.remove('hidden');
    lt.className = 'font-bold text-lg border-b-2 border-transparent text-slate-400 pb-1';
    st.className = 'font-bold text-lg border-b-2 border-green-500 text-green-600 pb-1';
  }
};

window.handleLogin = async function(e) {
  e.preventDefault();
  const btn   = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  errEl.classList.add('hidden');
  btn.textContent = 'Logging in…'; btn.disabled = true;
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: document.getElementById('login-email').value.trim(), password: document.getElementById('login-password').value })
  });
  if (result.success) {
    setAuth(result.token, result.user);
    if (result.user.score !== undefined) localStorage.setItem('ua_impact_score', result.user.score);
    document.getElementById('ua-auth-modal').classList.remove('active');
    showToast(`Welcome back, ${result.user.name}! 🌱`);
    setTimeout(() => location.reload(), 800);
  } else {
    errEl.textContent = result.message || 'Login failed. Check your credentials.';
    errEl.classList.remove('hidden');
    btn.textContent = 'Login'; btn.disabled = false;
  }
};

window.handleSignup = async function(e) {
  e.preventDefault();
  const btn   = document.getElementById('signup-btn');
  const errEl = document.getElementById('signup-error');
  errEl.classList.add('hidden');
  btn.textContent = 'Creating account…'; btn.disabled = true;
  const result = await apiRequest('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ name: document.getElementById('signup-name').value.trim(), email: document.getElementById('signup-email').value.trim(), password: document.getElementById('signup-password').value })
  });
  if (result.success) {
    setAuth(result.token, result.user);
    if (result.user.score !== undefined) localStorage.setItem('ua_impact_score', result.user.score);
    document.getElementById('ua-auth-modal').classList.remove('active');
    showToast(`Welcome to UrbanAware, ${result.user.name}! 🌱`);
    setTimeout(() => location.reload(), 800);
  } else {
    errEl.textContent = result.message || 'Signup failed.';
    errEl.classList.remove('hidden');
    btn.textContent = 'Create Account'; btn.disabled = false;
  }
};

// ─── TOAST ────────────────────────────────────────────────────
function showToast(message) {
  let toast = document.getElementById('ua-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ua-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('active');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('active'), 3500);
}
window.showToast = showToast;

// ─── SCORE ────────────────────────────────────────────────────
function initUserImpactScore() {
  let score = localStorage.getItem('ua_impact_score') || 0;
  updateScoreDisplay(score);
}
function updateScoreDisplay(score) {
  document.querySelectorAll('.sustainability-score-value').forEach(el => { el.textContent = parseInt(score).toLocaleString(); });
  document.querySelectorAll('.sustainability-badge').forEach(el => { el.textContent = getBadge(score); });
  document.querySelectorAll('.sustainability-progress-bar').forEach(bar => { bar.style.width = `${Math.min((score / 5000) * 100, 100)}%`; });
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
  if (isLoggedIn()) {
    try { await apiRequest('/user/score', { method: 'POST', body: JSON.stringify({ points }) }); } catch(e) {}
  }
}
window.addPoints = addPoints;

// ─── GENERIC MODAL ────────────────────────────────────────────
function showModal(title, content, onConfirm) {
  let overlay = document.getElementById('ua-generic-modal');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'ua-generic-modal';
    overlay.className = 'modal-overlay';
    overlay.style.cssText = 'z-index:9999;';
    overlay.innerHTML = `
      <div class="modal-content">
        <h2 class="text-2xl font-bold mb-4 ua-modal-title"></h2>
        <div class="modal-body mb-6 ua-modal-body"></div>
        <div class="flex justify-end gap-4">
          <button class="modal-close px-6 py-2 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-all">Cancel</button>
          <button class="modal-confirm px-6 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all">Confirm</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-close').addEventListener('click', () => overlay.classList.remove('active'));
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });
  }
  overlay.querySelector('.ua-modal-title').textContent = title;
  overlay.querySelector('.ua-modal-body').innerHTML = content;
  const oldBtn = overlay.querySelector('.modal-confirm');
  const newBtn = oldBtn.cloneNode(true);
  oldBtn.parentNode.replaceChild(newBtn, oldBtn);
  newBtn.addEventListener('click', () => { if (onConfirm) onConfirm(); overlay.classList.remove('active'); });
  overlay.classList.add('active');
}
window.showModal = showModal;
