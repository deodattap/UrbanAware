// assets/js/dashboard.js — UrbanAware Dashboard API Integration

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadDashboardActivity();
  // loadCityData();
});

// ─── STATS ────────────────────────────────────────────────────
async function loadDashboardStats() {
  if (!isLoggedIn()) {
    renderGuestBanner();
    return;
  }

  const data = await apiRequest('/dashboard/stats');
  if (!data.success) return;

  const { totalScore, badge, totalReports, totalDrivesHosted, totalDrivesJoined } = data.stats;

  // Update sustainability score banner
  const scoreEl = document.querySelector('[data-purpose="hero-banner"] .text-5xl');
  if (scoreEl) scoreEl.textContent = totalScore.toLocaleString();

  const badgeEl = document.querySelector('[data-purpose="hero-banner"] .fa-leaf')?.closest('div');
  if (badgeEl) badgeEl.innerHTML = `<i class="fa-solid fa-leaf text-green-300"></i> ${badge}`;

  // Update progress bar
  const BADGE_THRESHOLDS = [
    { min: 3000, label: 'Eco Champion', next: null },
    { min: 1500, label: 'Sustainability Hero', next: 3000 },
    { min: 500,  label: 'Green Citizen', next: 1500 },
    { min: 100,  label: 'Eco Starter', next: 500 },
    { min: 0,    label: 'Eco Beginner', next: 100 }
  ];
  const tier      = BADGE_THRESHOLDS.find(t => totalScore >= t.min) || BADGE_THRESHOLDS[4];
  const prevMin   = tier.min;
  const nextMin   = tier.next;
  const progressEl = document.querySelector('.sustainability-progress-bar');
  const progressLabel = document.querySelector('[data-purpose="hero-banner"] .flex.justify-between span:first-child');
  const progressPct   = document.querySelector('[data-purpose="hero-banner"] .flex.justify-between span:last-child');

  if (progressEl) {
    const pct = nextMin
      ? Math.min(Math.round(((totalScore - prevMin) / (nextMin - prevMin)) * 100), 100)
      : 100;
    progressEl.style.width = `${pct}%`;
    if (progressPct) progressPct.textContent = `${pct}%`;
  }
  if (progressLabel && nextMin) {
    const nextBadge = BADGE_THRESHOLDS.find(t => t.min === nextMin);
    if (nextBadge) progressLabel.textContent = `Progress to ${nextBadge.label}`;
  }

  // Sync local score display
  localStorage.setItem('ua_impact_score', totalScore);
  updateScoreDisplay(totalScore);

  // Inject stat cards into the metrics grid if stat elements exist
  injectUserStatCards(totalReports, totalDrivesHosted, totalDrivesJoined);
}

function injectUserStatCards(reports, hosted, joined) {
  const grid = document.querySelector('[data-purpose="metrics-grid"]');
  if (!grid) return;

  // Remove old injected stat cards to avoid duplicates
  grid.querySelectorAll('.ua-user-stat').forEach(el => el.remove());

  const cards = [
    { label: 'My Reports',      value: reports, icon: 'fa-flag',       color: 'blue' },
    { label: 'Drives Hosted',   value: hosted,  icon: 'fa-calendar',   color: 'green' },
    { label: 'Drives Joined',   value: joined,  icon: 'fa-users',      color: 'purple' }
  ];

  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-500',   dot: 'bg-blue-500',   badge: 'text-blue-500 bg-blue-50',   border: 'border-blue-50' },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-500', dot: 'bg-green-500',  badge: 'text-green-500 bg-green-50', border: 'border-green-50' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-500',dot: 'bg-purple-500',badge: 'text-purple-500 bg-purple-50',border: 'border-purple-50' }
  };

  cards.forEach(({ label, value, icon, color }) => {
    const c = colorMap[color];
    const div = document.createElement('div');
    div.className = `ua-user-stat bg-white p-5 rounded-3xl card-shadow border ${c.border}`;
    div.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div class="w-10 h-10 rounded-xl ${c.icon} flex items-center justify-center">
          <i class="fa-solid ${icon}"></i>
        </div>
        <span class="text-[10px] font-bold ${c.badge} px-2 py-0.5 rounded-full">My Stats</span>
      </div>
      <p class="text-[10px] uppercase font-bold text-gray-400 tracking-wider">${label}</p>
      <p class="text-3xl font-bold text-gray-800 my-1">${value}</p>
      <div class="flex items-center gap-1 mt-2">
        <span class="w-2 h-2 rounded-full ${c.dot}"></span>
        <span class="text-[10px] font-bold ${c.badge.split(' ')[0]} uppercase">Updated</span>
      </div>`;
    grid.appendChild(div);
  });
}

function renderGuestBanner() {
  const banner = document.querySelector('[data-purpose="hero-banner"]');
  if (!banner) return;
  const scoreEl = banner.querySelector('.text-5xl');
  if (scoreEl) scoreEl.textContent = '—';
  const hint = document.createElement('p');
  hint.className = 'text-white/70 text-sm mt-3';
  hint.innerHTML = '<button onclick="openAuthModal()" class="underline font-bold">Log in</button> to see your personal sustainability score.';
  banner.querySelector('.relative.z-10')?.appendChild(hint);
}

// ─── ACTIVITY ─────────────────────────────────────────────────
async function loadDashboardActivity() {
  if (!isLoggedIn()) return;

  const data = await apiRequest('/dashboard/activity');
  if (!data.success || !data.activities?.length) return;

  // Find the city-status section — inject activity feed just before it
  const cityStatus = document.querySelector('[data-purpose="city-status"]');
  if (!cityStatus) return;

  const section = document.createElement('section');
  section.className = 'bg-white rounded-[40px] p-8 card-shadow mb-10';
  section.innerHTML = `
    <div class="flex items-center gap-2 mb-6">
      <div class="w-1.5 h-6 bg-ua-green rounded-full"></div>
      <h3 class="text-2xl font-bold text-gray-800">Recent Activity</h3>
    </div>
    <ul class="space-y-3" id="ua-activity-list"></ul>`;

  cityStatus.parentNode.insertBefore(section, cityStatus);

  const list = document.getElementById('ua-activity-list');
  const iconMap = {
    report:   { icon: 'fa-flag',          color: 'bg-blue-100 text-blue-500' },
    drive:    { icon: 'fa-people-group',  color: 'bg-green-100 text-green-600' },
    quiz:     { icon: 'fa-circle-question',color: 'bg-purple-100 text-purple-500' },
    scenario: { icon: 'fa-lightbulb',     color: 'bg-amber-100 text-amber-600' }
  };

  data.activities.forEach(item => {
    const meta = iconMap[item.type] || { icon: 'fa-circle-dot', color: 'bg-gray-100 text-gray-500' };
    const date = new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const pts  = item.points != null ? `<span class="text-xs font-bold text-green-600 ml-2">+${item.points} pts</span>` : '';
    const li   = document.createElement('li');
    li.className = 'flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-colors';
    li.innerHTML = `
      <div class="w-9 h-9 rounded-xl ${meta.color} flex items-center justify-center flex-shrink-0">
        <i class="fa-solid ${meta.icon} text-sm"></i>
      </div>
      <div class="flex-grow min-w-0">
        <p class="text-sm font-semibold text-gray-800 truncate">${item.description}${pts}</p>
        <p class="text-[11px] text-gray-400 mt-0.5">${date}</p>
      </div>`;
    list.appendChild(li);
  });
}

// ─── CITY DATA (existing dashboard endpoint) ──────────────────
/*
async function loadCityData() {
  const data = await apiRequest('/dashboard/data');
  if (!data.success) return;

  const { aqi, weather, traffic } = data.data;

  // AQI card
  const aqiValueEl = document.querySelector('[data-purpose="metrics-grid"] .text-pink-500')
    ?.closest('.bg-white')?.querySelector('.text-3xl');
  if (aqiValueEl) aqiValueEl.textContent = aqi.value;

  // Temperature card
  const tempEl = document.querySelector('[data-purpose="metrics-grid"] .text-amber-500')
    ?.closest('.bg-white')?.querySelector('.text-3xl');
  if (tempEl) tempEl.textContent = `${weather.temp}°C`;

  // Traffic card
  const trafficEl = document.querySelector('[data-purpose="metrics-grid"] .text-orange-500')
    ?.closest('.bg-white')?.querySelector('.text-3xl');
  if (trafficEl) trafficEl.textContent = `${traffic.level}%`;
}
  */
