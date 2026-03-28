// assets/js/dashboard.js — UrbanAware Dashboard API Integration

const API_BASE_URL = 'http://localhost:3001/api';
let leafletMap = null;
let aqiChart   = null;

document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadDashboardActivity();
  loadCityData();
  initLeafletMap();
  loadAqiTrendChart();
  initSearchBar();
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
    { min: 3000, label: 'Eco Champion',        next: null },
    { min: 1500, label: 'Sustainability Hero',  next: 3000 },
    { min: 500,  label: 'Green Citizen',        next: 1500 },
    { min: 100,  label: 'Eco Starter',          next: 500  },
    { min: 0,    label: 'Eco Beginner',         next: 100  }
  ];
  const tier      = BADGE_THRESHOLDS.find(t => totalScore >= t.min) || BADGE_THRESHOLDS[4];
  const prevMin   = tier.min;
  const nextMin   = tier.next;
  const progressEl    = document.querySelector('.sustainability-progress-bar');
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
  if (typeof updateScoreDisplay === 'function') updateScoreDisplay(totalScore);

  injectUserStatCards(totalReports, totalDrivesHosted, totalDrivesJoined);
}

function injectUserStatCards(reports, hosted, joined) {
  const grid = document.querySelector('[data-purpose="metrics-grid"]');
  if (!grid) return;

  grid.querySelectorAll('.ua-user-stat').forEach(el => el.remove());

  const cards = [
    { label: 'My Reports',    value: reports, icon: 'fa-flag',     color: 'blue'   },
    { label: 'Drives Hosted', value: hosted,  icon: 'fa-calendar', color: 'green'  },
    { label: 'Drives Joined', value: joined,  icon: 'fa-users',    color: 'purple' }
  ];

  const colorMap = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-500',    dot: 'bg-blue-500',   badge: 'text-blue-500 bg-blue-50',    border: 'border-blue-50'   },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-500',  dot: 'bg-green-500',  badge: 'text-green-500 bg-green-50',  border: 'border-green-50'  },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-500',dot: 'bg-purple-500', badge: 'text-purple-500 bg-purple-50',border: 'border-purple-50' }
  };

  cards.forEach(({ label, value, icon, color }) => {
    const c   = colorMap[color];
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
  const existing = banner.querySelector('.ua-guest-hint');
  if (existing) return;
  const hint = document.createElement('p');
  hint.className = 'ua-guest-hint text-white/70 text-sm mt-3';
  hint.innerHTML = '<button onclick="openAuthModal()" class="underline font-bold">Log in</button> to see your personal sustainability score.';
  banner.querySelector('.relative.z-10')?.appendChild(hint);
}

// ─── ACTIVITY ─────────────────────────────────────────────────
async function loadDashboardActivity() {
  if (!isLoggedIn()) return;

  const data = await apiRequest('/dashboard/activity');
  if (!data.success || !data.activities?.length) return;

  const cityStatus = document.querySelector('[data-purpose="city-status"]');
  if (!cityStatus) return;

  if (document.getElementById('ua-activity-section')) return; // already injected

  const section = document.createElement('section');
  section.id        = 'ua-activity-section';
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
    report:   { icon: 'fa-flag',           color: 'bg-blue-100 text-blue-500'    },
    drive:    { icon: 'fa-people-group',   color: 'bg-green-100 text-green-600'  },
    quiz:     { icon: 'fa-circle-question',color: 'bg-purple-100 text-purple-500' },
    scenario: { icon: 'fa-lightbulb',      color: 'bg-amber-100 text-amber-600'  }
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

// ─── CITY DATA (AQI + Weather) ────────────────────────────────
async function loadCityData() {
  let data;
  try {
    const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ua_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_URL}/dashboard/data`, { headers });
    data = await res.json();
  } catch (e) {
    console.warn('Dashboard data API unavailable, using static fallback.');
    return;
  }

  if (!data.success) return;

  const { aqi, weather, traffic, waste } = data.data;

  // AQI card — find by label text
  updateMetricCard('Air Quality Index', aqi.value, getAqiStatus(aqi.value), getAqiColor(aqi.value));

  // Temperature card
  if (weather) {
    updateMetricCard('Temperature', `${weather.temp}°C`, getTempStatus(weather.temp), 'amber');
  }

  // Traffic card
  if (traffic) {
    updateMetricCard('Traffic Level', `${traffic.level}%`, traffic.status, getTrafficColor(traffic.level));
  }

  // Waste card
  if (waste) {
    updateMetricCard('Waste Collection', `${waste.level}%`, waste.status, 'emerald');
  }

  // Update insight text
  const insightEl = document.querySelector('.bg-blue-50\\/50 p');
  if (insightEl && aqi && weather) {
    insightEl.innerHTML = `<span class="font-bold text-ua-blue">Insight:</span> AQI is currently <strong>${getAqiStatus(aqi.value)}</strong> (${aqi.value}). Temperature: ${weather.temp}°C, ${weather.description || ''}. Traffic is <strong>${traffic?.status || 'N/A'}</strong>.`;
  }
}

function updateMetricCard(labelText, value, statusText, colorKey) {
  const cards = document.querySelectorAll('[data-purpose="metrics-grid"] > div');
  cards.forEach(card => {
    const labelEl = card.querySelector('p.uppercase');
    if (!labelEl || labelEl.textContent.trim() !== labelText) return;

    const valueEl = card.querySelector('.text-3xl');
    if (valueEl) valueEl.textContent = value;

    const statusDot  = card.querySelector('.flex.items-center.gap-1 span:first-child');
    const statusSpan = card.querySelector('.flex.items-center.gap-1 span:last-child');
    const colorClass = getColorClass(colorKey);

    if (statusSpan) {
      statusSpan.textContent = statusText;
      statusSpan.className   = `text-[10px] font-bold text-${colorClass}-500 uppercase`;
    }
    if (statusDot) {
      statusDot.className = `w-2 h-2 rounded-full bg-${colorClass}-500`;
    }
  });
}

function getColorClass(key) {
  const map = { emerald: 'emerald', amber: 'amber', pink: 'pink', orange: 'orange', green: 'green' };
  return map[key] || 'gray';
}

function getAqiStatus(v) {
  if (v <= 50)  return 'Good';
  if (v <= 100) return 'Moderate';
  if (v <= 150) return 'Unhealthy';
  return 'Poor';
}

function getAqiColor(v) {
  if (v <= 50)  return 'emerald';
  if (v <= 100) return 'amber';
  return 'pink';
}

function getTempStatus(v) {
  if (v > 35) return 'Hot';
  if (v > 28) return 'Warm';
  return 'Cool';
}

function getTrafficColor(v) {
  if (v > 70) return 'pink';
  if (v > 40) return 'orange';
  return 'emerald';
}

// ─── LEAFLET MAP ──────────────────────────────────────────────
function initLeafletMap() {
  if (typeof L === 'undefined') return;

  // Replace the SVG placeholder with a real map div
  const mapContainer = document.querySelector('.lg\\:col-span-2.bg-\\[\\#F1FAFE\\]');
  if (!mapContainer) return;

  // Preserve the legend
  const legend = mapContainer.querySelector('.absolute.top-6.right-6');
  mapContainer.innerHTML = '';
  mapContainer.style.padding = '0';
  mapContainer.style.position = 'relative';

  const mapDiv = document.createElement('div');
  mapDiv.id    = 'ua-leaflet-map';
  mapDiv.style.cssText = 'width:100%;height:400px;border-radius:30px;overflow:hidden;';
  mapContainer.appendChild(mapDiv);

  if (legend) {
    legend.style.zIndex = '1000';
    mapContainer.appendChild(legend);
  }

  // Init map centered on India
  leafletMap = L.map('ua-leaflet-map', { zoomControl: true }).setView([20.5937, 78.9629], 5);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
    maxZoom: 18
  }).addTo(leafletMap);

  // Static city markers
  const cities = [
    { name: 'Delhi',     lat: 28.6139, lng: 77.2090, aqi: 156, temp: 32, traffic: 'Heavy'    },
    { name: 'Mumbai',    lat: 19.0760, lng: 72.8777, aqi: 88,  temp: 30, traffic: 'Moderate' },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946, aqi: 42,  temp: 26, traffic: 'Light'    },
    { name: 'Chennai',   lat: 13.0827, lng: 80.2707, aqi: 68,  temp: 33, traffic: 'Moderate' },
    { name: 'Kolkata',   lat: 22.5726, lng: 88.3639, aqi: 140, temp: 31, traffic: 'Heavy'    },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867, aqi: 75,  temp: 29, traffic: 'Moderate' },
    { name: 'Pune',      lat: 18.5204, lng: 73.8567, aqi: 55,  temp: 27, traffic: 'Light'    },
    { name: 'Nashik',    lat: 19.9975, lng: 73.7898, aqi: 48,  temp: 26, traffic: 'Light'    }
  ];

  cities.forEach(city => {
    const color = city.aqi <= 50 ? '#10b981' : city.aqi <= 100 ? '#f59e0b' : '#ef4444';
    L.circleMarker([city.lat, city.lng], {
      radius: 10, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.85
    })
      .addTo(leafletMap)
      .bindPopup(buildPopupHTML(city.name, city.aqi, city.traffic, city.temp));
  });

  // Click to fetch AQI for any location
  leafletMap.on('click', async (e) => {
    const { lat, lng } = e.latlng;
    const popup = L.popup().setLatLng(e.latlng).setContent('<p style="padding:8px;font-size:13px;">Fetching AQI…</p>').openOn(leafletMap);
    const result = await fetchAqiForLocation(lat, lng);
    popup.setContent(buildPopupHTML(`${lat.toFixed(3)}°N, ${lng.toFixed(3)}°E`, result.aqi, result.traffic, result.temp, true));

    // Also update the AQI card in metrics grid
    updateMetricCard('Air Quality Index', result.aqi, getAqiStatus(result.aqi), getAqiColor(result.aqi));
  });
}

async function fetchAqiForLocation(lat, lng) {
  // Try WAQI geo endpoint (works with 'demo' token for basic lookups)
  try {
    const res  = await fetch(`https://api.waqi.info/feed/geo:${lat};${lng}/?token=demo`);
    const json = await res.json();
    if (json.status === 'ok' && json.data && typeof json.data.aqi === 'number') {
      return {
        aqi:     json.data.aqi,
        temp:    Math.round(json.data.iaqi?.t?.v ?? 28),
        traffic: ['Light', 'Moderate', 'Heavy'][Math.floor(Math.random() * 3)]
      };
    }
  } catch (_) {}

  // Fallback: use backend
  try {
    const token   = typeof getToken === 'function' ? getToken() : localStorage.getItem('ua_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res  = await fetch(`${API_BASE_URL}/dashboard/data`, { headers });
    const json = await res.json();
    if (json.success) {
      return {
        aqi:     json.data.aqi?.value ?? 100,
        temp:    json.data.weather?.temp ?? 28,
        traffic: json.data.traffic?.status ?? 'Moderate'
      };
    }
  } catch (_) {}

  // Static fallback
  return {
    aqi:     Math.floor(Math.random() * 150) + 30,
    temp:    Math.floor(Math.random() * 12) + 24,
    traffic: ['Light', 'Moderate', 'Heavy'][Math.floor(Math.random() * 3)]
  };
}

function buildPopupHTML(name, aqi, traffic, temp, showCoords) {
  const status = getAqiStatus(aqi);
  const color  = aqi <= 50 ? '#10b981' : aqi <= 100 ? '#f59e0b' : '#ef4444';
  return `
    <div style="font-family:Inter,sans-serif;min-width:170px;padding:4px;">
      <h3 style="font-weight:800;font-size:14px;margin:0 0 6px;">${name}</h3>
      <div style="background:${color}22;border:1px solid ${color}55;border-radius:8px;padding:8px;margin-bottom:8px;">
        <div style="font-size:22px;font-weight:900;color:${color};">${aqi}</div>
        <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;">${status}</div>
      </div>
      <div style="font-size:12px;color:#374151;">
        <div>🚗 <strong>Traffic:</strong> ${traffic}</div>
        <div>🌡️ <strong>Temp:</strong> ${temp}°C</div>
      </div>
    </div>`;
}

// ─── SEARCH BAR ───────────────────────────────────────────────
function initSearchBar() {
  const searchInput = document.querySelector('input[placeholder="Search city or area..."]');
  if (!searchInput) return;

  searchInput.addEventListener('keypress', async (e) => {
    if (e.key !== 'Enter') return;
    const query = searchInput.value.trim();
    if (!query || !leafletMap) return;

    try {
      const res  = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
      const json = await res.json();
      if (json.length > 0) {
        const { lat, lon, display_name } = json[0];
        leafletMap.flyTo([lat, lon], 12);
        const aqiData = await fetchAqiForLocation(parseFloat(lat), parseFloat(lon));
        L.popup()
          .setLatLng([lat, lon])
          .setContent(buildPopupHTML(display_name.split(',')[0], aqiData.aqi, aqiData.traffic, aqiData.temp))
          .openOn(leafletMap);
        updateMetricCard('Air Quality Index', aqiData.aqi, getAqiStatus(aqiData.aqi), getAqiColor(aqiData.aqi));
      } else {
        if (typeof showToast === 'function') showToast('Location not found.');
      }
    } catch (_) {
      if (typeof showToast === 'function') showToast('Search failed. Please try again.');
    }
  });
}

// ─── CHART.JS AQI TREND ──────────────────────────────────────
async function loadAqiTrendChart() {
  let labels = ['6am','8am','10am','12pm','2pm','4pm','6pm','8pm','10pm'];
  let values = [85, 100, 140, 156, 148, 130, 110, 90, 75];

  // Try to fetch real trend data from backend
  try {
    const token   = typeof getToken === 'function' ? getToken() : localStorage.getItem('ua_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res  = await fetch(`${API_BASE_URL}/dashboard/aqi-trend`, { headers });
    const json = await res.json();
    if (json.success && json.labels && json.values) {
      labels = json.labels;
      values = json.values;
    }
  } catch (_) {
    // Use fallback defined above
  }

  // Find the existing SVG chart container and replace it with a canvas
  const chartWrapper = document.querySelector('.relative.h-64.w-full');
  if (!chartWrapper) return;

  // Remove existing SVG content, inject canvas
  chartWrapper.innerHTML = '<canvas id="ua-aqi-chart"></canvas>';
  chartWrapper.style.position = 'relative';

  // Dynamically load Chart.js if not already present
  if (typeof Chart === 'undefined') {
    await loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js');
  }

  const ctx = document.getElementById('ua-aqi-chart')?.getContext('2d');
  if (!ctx) return;

  // Destroy previous instance if re-initialising
  if (aqiChart) { aqiChart.destroy(); aqiChart = null; }

  aqiChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:           'AQI',
        data:            values,
        borderColor:     '#50C878',
        backgroundColor: 'rgba(80,200,120,0.15)',
        borderWidth:     2.5,
        fill:            true,
        tension:         0.4,
        pointRadius:     3,
        pointBackgroundColor: '#50C878'
      }]
    },
    options: {
      responsive:         true,
      maintainAspectRatio:false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` AQI: ${ctx.raw} (${getAqiStatus(ctx.raw)})`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
        y: {
          grid:  { color: '#f1f5f9' },
          ticks: { font: { size: 10 }, color: '#94a3b8' },
          suggestedMin: 0,
          suggestedMax: 200
        }
      }
    }
  });

  // Remove old static x-axis labels row that lives below the SVG
  const xLabelsRow = chartWrapper.nextElementSibling;
  if (xLabelsRow && xLabelsRow.classList.contains('flex') && xLabelsRow.classList.contains('justify-between')) {
    xLabelsRow.remove();
  }
}

// ─── HELPERS ──────────────────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s    = document.createElement('script');
    s.src      = src;
    s.onload   = resolve;
    s.onerror  = reject;
    document.head.appendChild(s);
  });
}
