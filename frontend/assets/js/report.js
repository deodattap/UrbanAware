// assets/js/report.js — UrbanAware Report Issue API Integration

document.addEventListener('DOMContentLoaded', () => {
  initReportForm();
});

function initReportForm() {
  // The report page (reportissue.html) uses learn.js for quiz but also has a report intent.
  // We inject a report form modal / intercept any report-related buttons.

  // Look for existing report form elements by common patterns
  hookReportButtons();
  hookLearnPageReportIntent();
}

// ─── Hook any "Report Issue" buttons ──────────────────────────
function hookReportButtons() {
  document.querySelectorAll(
    'button, a, [data-action="report"], [href*="reportissue"]'
  ).forEach(el => {
    const text = el.textContent?.trim().toLowerCase();
    if (
      el.getAttribute('data-action') === 'report' ||
      (el.tagName === 'A' && el.getAttribute('href') === 'reportissue.html')
    ) {
      el.addEventListener('click', e => {
        e.preventDefault();
        openReportModal();
      });
    }
  });
}

// ─── On the learn/report page itself ──────────────────────────
function hookLearnPageReportIntent() {
  // The reportissue.html page's content is managed by learn.js.
  // We inject a persistent "Report Issue" floating button and modal.
  injectReportButton();
}

function injectReportButton() {
  if (document.getElementById('ua-report-fab')) return;

  const fab = document.createElement('button');
  fab.id = 'ua-report-fab';
  fab.title = 'Report an Issue';
  fab.innerHTML = '<i class="fa-solid fa-flag text-lg"></i>';
  fab.className = [
    'fixed bottom-6 right-6 z-50',
    'w-14 h-14 rounded-full shadow-xl',
    'bg-gradient-to-br from-red-500 to-orange-500 text-white',
    'flex items-center justify-center',
    'hover:scale-110 transition-transform'
  ].join(' ');
  fab.addEventListener('click', openReportModal);
  document.body.appendChild(fab);
}

// ─── REPORT MODAL ─────────────────────────────────────────────
function openReportModal() {
  if (document.getElementById('ua-report-modal')) {
    document.getElementById('ua-report-modal').classList.add('active');
    return;
  }

  const overlay = document.createElement('div');
  overlay.id = 'ua-report-modal';
  overlay.className = 'modal-overlay';
  overlay.style.cssText = 'z-index:9999;';
  overlay.innerHTML = `
    <div class="modal-content" style="max-width:500px;max-height:90vh;overflow-y:auto;">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-2xl font-bold text-gray-800">🚩 Report an Issue</h2>
        <button id="ua-report-close" class="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
      </div>

      <form id="ua-report-form" class="space-y-4" novalidate>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Issue Type *</label>
          <select id="rpt-type" required
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 bg-white">
            <option value="">Select type…</option>
            <option value="garbage">🗑️ Garbage / Waste</option>
            <option value="pollution">🌫️ Pollution</option>
            <option value="traffic">🚦 Traffic</option>
          </select>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Location *</label>
          <input id="rpt-location" type="text" required placeholder="e.g. MG Road, Bangalore"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Description *</label>
          <textarea id="rpt-description" rows="3" required placeholder="Describe the issue briefly…"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400 resize-none"></textarea>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Photo (optional)</label>
          <input id="rpt-image" type="file" accept="image/*"
            class="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-green-50 file:text-green-700 file:font-semibold hover:file:bg-green-100"/>
        </div>

        <div id="rpt-anon-row" class="flex items-center gap-3">
          <input id="rpt-anon" type="checkbox" class="w-4 h-4 rounded text-green-500"/>
          <label for="rpt-anon" class="text-sm text-gray-600">Submit anonymously</label>
        </div>

        <div id="rpt-contact-fields" class="space-y-3">
          <input id="rpt-name" type="text" placeholder="Your name (optional)"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
          <input id="rpt-contact" type="email" placeholder="Email for confirmation (optional)"
            class="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-green-400"/>
        </div>

        <div id="rpt-error" class="hidden text-red-500 text-sm font-semibold"></div>

        <button type="submit" id="rpt-submit"
          class="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold hover:opacity-90 transition-all">
          Submit Report
        </button>
      </form>
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));

  document.getElementById('ua-report-close').addEventListener('click', () => overlay.classList.remove('active'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('active'); });

  // Toggle anon contact fields
  document.getElementById('rpt-anon').addEventListener('change', function () {
    document.getElementById('rpt-contact-fields').style.display = this.checked ? 'none' : '';
  });

  // Pre-fill if logged in
  const user = getUser();
  if (user) {
    const nameEl = document.getElementById('rpt-name');
    const emailEl = document.getElementById('rpt-contact');
    if (nameEl && user.name) nameEl.value = user.name;
    if (emailEl && user.email) emailEl.value = user.email;
  }

  document.getElementById('ua-report-form').addEventListener('submit', handleReportSubmit);
}

async function handleReportSubmit(e) {
  e.preventDefault();

  const type        = document.getElementById('rpt-type').value;
  const location    = document.getElementById('rpt-location').value.trim();
  const description = document.getElementById('rpt-description').value.trim();
  const isAnonymous = document.getElementById('rpt-anon').checked;
  const name        = document.getElementById('rpt-name')?.value.trim();
  const contact     = document.getElementById('rpt-contact')?.value.trim();
  const imageFile   = document.getElementById('rpt-image')?.files[0];
  const errEl       = document.getElementById('rpt-error');
  const btn         = document.getElementById('rpt-submit');

  errEl.classList.add('hidden');

  if (!type || !location || !description) {
    errEl.textContent = 'Issue type, location and description are required.';
    errEl.classList.remove('hidden');
    return;
  }

  btn.textContent = 'Submitting…';
  btn.disabled = true;

  // Build FormData for multipart (supports image upload)
  const fd = new FormData();
  fd.append('issueType', type);
  fd.append('type', type);           // legacy field
  fd.append('location', location);
  fd.append('description', description);
  fd.append('isAnonymous', isAnonymous);
  if (!isAnonymous && name)    fd.append('reporterName', name);
  if (!isAnonymous && contact) fd.append('reporterContact', contact);
  if (imageFile) fd.append('image', imageFile);

  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let result;
  try {
    const res = await fetch(`${API_BASE}/report`, {
      method: 'POST',
      headers,      // NOTE: do NOT set Content-Type; browser sets multipart boundary automatically
      body: fd
    });
    result = await res.json();
  } catch {
    result = { success: false, message: 'Network error. Is the backend running?' };
  }

  if (result.success) {
    document.getElementById('ua-report-modal').classList.remove('active');
    showToast(`✅ Report submitted! ${result.points ? `+${result.points} pts 🌱` : ''}`);
    if (result.points) addPoints(result.points);
  } else {
    errEl.textContent = result.message || 'Submission failed. Please try again.';
    errEl.classList.remove('hidden');
    btn.textContent = 'Submit Report';
    btn.disabled = false;
  }
}

window.openReportModal = openReportModal;
