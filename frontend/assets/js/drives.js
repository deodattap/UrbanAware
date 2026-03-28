// assets/js/drives.js — UrbanAware Drives API Integration

document.addEventListener('DOMContentLoaded', () => {
  loadDrives();
  hookHostButton();
});

// ─── LOAD DRIVES ──────────────────────────────────────────────
async function loadDrives() {
  const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-3');
  if (!grid) return;

  // Show a loading state
  grid.innerHTML = `
    <div class="col-span-3 text-center py-16 text-gray-400">
      <i class="fa-solid fa-spinner fa-spin text-3xl mb-4 block"></i>
      <p class="font-semibold">Loading drives…</p>
    </div>`;

  const data = await apiRequest('/drives');

  if (!data.success || !data.drives?.length) {
    grid.innerHTML = renderStaticDrives(); // fall back to static HTML cards
    hookDriveCards();
    return;
  }

  grid.innerHTML = data.drives.map(renderDriveCard).join('');
  hookDriveCards();
}

function renderDriveCard(drive) {
  const date = new Date(drive.date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
  const organizer = drive.organizer || (drive.host?.name) || 'Community Member';
  const count     = drive.participantCount || 0;
  const colors    = ['bg-green-500', 'bg-sky-500', 'bg-orange-500', 'bg-purple-500'];
  const color     = colors[Math.floor(Math.random() * colors.length)];
  const images    = [
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80',
    'https://images.unsplash.com/photo-1530982011887-3cc11cc85693?w=600&q=80',
  ];
  const img = images[Math.floor(Math.random() * images.length)];

  return `
  <article class="drive-card bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col"
           data-drive-id="${drive._id}" data-drive-title="${escHtml(drive.title)}">
    <div class="relative h-56 overflow-hidden">
      <img src="${img}" alt="${escHtml(drive.title)}" class="w-full h-full object-cover"/>
      <div class="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-700 flex items-center gap-1">
        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
        </svg>
        ${count}
      </div>
    </div>
    <div class="p-6 flex-grow">
      <h3 class="text-xl font-extrabold mb-3 leading-tight">${escHtml(drive.title)}</h3>
      <p class="text-gray-500 text-sm mb-6 line-clamp-2">${escHtml(drive.description || '')}</p>
      <div class="space-y-2 mb-6">
        <div class="flex items-center gap-2 text-gray-500 text-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
          </svg>
          ${date}
        </div>
        <div class="flex items-center gap-2 text-gray-500 text-xs">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
            <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/>
          </svg>
          ${escHtml(drive.location)}
        </div>
      </div>
      <div class="bg-gray-50 rounded-xl p-3 mb-6">
        <span class="text-[10px] uppercase font-bold text-gray-400 block mb-1">Organised By</span>
        <span class="text-sm font-bold text-gray-700">${escHtml(organizer)}</span>
      </div>
      <button class="ua-join-btn w-full ${color} hover:opacity-90 text-white font-bold py-4 rounded-2xl transition-all shadow-md">
        Join Drive
      </button>
    </div>
  </article>`;
}

// ─── JOIN DRIVE ───────────────────────────────────────────────
function hookDriveCards() {
  document.querySelectorAll('.ua-join-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card     = btn.closest('[data-drive-id]');
      const driveId  = card?.dataset.driveId;
      const driveName= card?.dataset.driveTitle || 'this drive';
      openJoinModal(driveId, driveName);
    });
  });

  // Also hook static cards that don't have data attributes
  document.querySelectorAll('.drive-card:not([data-drive-id]) button').forEach(btn => {
    if (btn.textContent?.trim().toLowerCase() === 'join drive') {
      btn.addEventListener('click', () => openJoinModal(null, 'this drive'));
    }
  });
}

function openJoinModal(driveId, driveName) {
  if (!isLoggedIn()) {
    showToast('Please log in to join a drive.');
    openAuthModal();
    return;
  }

  const user = getUser();
  showModal(
    `Join: ${driveName}`,
    `<div class="space-y-3">
       <p class="text-gray-600 text-sm">Joining as: <strong>${user?.name || 'You'}</strong></p>
       <input id="join-location" type="text" placeholder="Your area / locality (optional)"
         class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
     </div>`,
    async () => {
      const location = document.getElementById('join-location')?.value.trim();
      const payload  = {
        driveId,
        driveName,
        name:     user?.name  || 'Anonymous',
        email:    user?.email || '',
        location: location    || ''
      };
      const result = await apiRequest('/drives/join', {
        method: 'POST',
        body:   JSON.stringify(payload)
      });
      if (result.success) {
        showToast(`✅ Joined! ${result.points ? `+${result.points} pts 🌱` : ''}`);
        if (result.points) addPoints(result.points);
      } else {
        showToast(result.message || 'Could not join drive.');
      }
    }
  );
}

// ─── HOST DRIVE ───────────────────────────────────────────────
function hookHostButton() {
  document.querySelectorAll('button').forEach(btn => {
    if (btn.textContent?.trim() === 'Host a Drive') {
      btn.addEventListener('click', openHostModal);
    }
  });
}

function openHostModal() {
  if (!isLoggedIn()) {
    showToast('Please log in to host a drive.');
    openAuthModal();
    return;
  }

  const user = getUser();

  // Remove existing host modal to allow re-open
  document.getElementById('ua-host-modal')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'ua-host-modal';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'z-index:9999;';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:480px;max-height:90vh;overflow-y:auto;">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800">🌱 Host a Drive</h2>
        <button id="ua-host-close" class="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
      </div>
      <form id="ua-host-form" class="space-y-4" novalidate>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Drive Title *</label>
          <input id="host-title" type="text" required placeholder="e.g. Tree Plantation Drive"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description</label>
          <textarea id="host-desc" rows="2" placeholder="Tell people what this drive is about…"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 resize-none"></textarea>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date *</label>
          <input id="host-date" type="date" required
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location *</label>
          <input id="host-location" type="text" required placeholder="e.g. Central Park, Delhi"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
        </div>
        <div id="host-error" class="hidden text-red-500 text-sm font-semibold"></div>
        <button type="submit" id="host-submit"
          class="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-xl font-bold hover:opacity-90 transition-all">
          Submit Drive for Review
        </button>
        <p class="text-center text-xs text-gray-400">Drives are reviewed before going live (+25 pts on approval)</p>
      </form>
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));

  document.getElementById('ua-host-close').addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });

  // Set min date to today
  document.getElementById('host-date').min = new Date().toISOString().split('T')[0];

  document.getElementById('ua-host-form').addEventListener('submit', async e => {
    e.preventDefault();
    const title    = document.getElementById('host-title').value.trim();
    const desc     = document.getElementById('host-desc').value.trim();
    const date     = document.getElementById('host-date').value;
    const location = document.getElementById('host-location').value.trim();
    const errEl    = document.getElementById('host-error');
    const btn      = document.getElementById('host-submit');

    errEl.classList.add('hidden');
    if (!title || !date || !location) {
      errEl.textContent = 'Title, date and location are required.';
      errEl.classList.remove('hidden');
      return;
    }

    btn.textContent = 'Submitting…';
    btn.disabled = true;

    const result = await apiRequest('/drives/host', {
      method: 'POST',
      body: JSON.stringify({
        title, description: desc, date, location,
        organizer:      user?.name  || 'Anonymous',
        organizerEmail: user?.email || ''
      })
    });

    if (result.success) {
      overlay.classList.remove('active');
      showToast(`🎉 Drive submitted for review! ${result.points ? `+${result.points} pts 🌱` : ''}`);
      if (result.points) addPoints(result.points);
    } else {
      errEl.textContent = result.message || 'Submission failed.';
      errEl.classList.remove('hidden');
      btn.textContent = 'Submit Drive for Review';
      btn.disabled = false;
    }
  });
}

// ─── STATIC FALLBACK ──────────────────────────────────────────
// Returns the original static drive cards as a string for fallback when API has no data
function renderStaticDrives() {
  return `
  <article class="drive-card bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
    <div class="relative h-56 overflow-hidden">
      <img alt="People planting trees" class="w-full h-full object-cover"
        src="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=80"/>
    </div>
    <div class="p-6 flex-grow">
      <h3 class="text-xl font-extrabold mb-3 leading-tight">Green Delhi: Tree Plantation Drive</h3>
      <p class="text-gray-500 text-sm mb-6">Join us in planting 10,000 trees across Delhi NCR to combat air pollution.</p>
      <div class="bg-gray-50 rounded-xl p-3 mb-6">
        <span class="text-[10px] uppercase font-bold text-gray-400 block mb-1">Organised By</span>
        <span class="text-sm font-bold text-gray-700">Delhi Green Initiative</span>
      </div>
      <button class="ua-join-btn w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-2xl transition-all shadow-md">Join Drive</button>
    </div>
  </article>
  <article class="drive-card bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
    <div class="relative h-56 overflow-hidden">
      <img alt="Beach cleanup" class="w-full h-full object-cover"
        src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80"/>
    </div>
    <div class="p-6 flex-grow">
      <h3 class="text-xl font-extrabold mb-3 leading-tight">Clean Mumbai: Beach Cleanup Campaign</h3>
      <p class="text-gray-500 text-sm mb-6">Restore our beaches by removing plastic waste and protecting marine life.</p>
      <div class="bg-gray-50 rounded-xl p-3 mb-6">
        <span class="text-[10px] uppercase font-bold text-gray-400 block mb-1">Organised By</span>
        <span class="text-sm font-bold text-gray-700">Clean Oceans Foundation</span>
      </div>
      <button class="ua-join-btn w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 rounded-2xl transition-all shadow-md">Join Drive</button>
    </div>
  </article>`;
}

// ─── UTIL ─────────────────────────────────────────────────────
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
