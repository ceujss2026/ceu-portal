// ============================================
// CEU Portal v1.1 — api.js
// Lapisan Komunikasi API: Fetch Wrapper
// Anti-CORS, Deduplikasi In-Flight, Sesi Auto
// ============================================

const _inflight = {};
let _writeEpoch = 0;

/**
 * Panggilan API GET ke backend GAS.
 * @param {string} action - Nama tindakan (cth: 'boot', 'getCalendar').
 * @param {Object} [params] - Parameter query tambahan.
 * @return {Promise<Object>}
 */
async function apiGet(action, params) {
  const qs = new URLSearchParams({ action, ...params });
  const token = localStorage.getItem('ceu_token');
  if (token) qs.set('token', token);

  const url = GAS_URL + '?' + qs.toString();
  const k = _writeEpoch + '|GET|' + url;

  // Deduplikasi in-flight request
  if (_inflight[k]) return _inflight[k];

  const p = _fetchWithRetry(url, { method: 'GET' });
  _inflight[k] = p;
  p.finally(() => delete _inflight[k]);
  return p;
}

/**
 * Panggilan API POST ke backend GAS.
 * WAJIB gunakan Content-Type: text/plain;charset=utf-8 (ATURAN CORS GAS).
 * @param {string} action - Nama tindakan.
 * @param {Object} [data] - Data payload.
 * @return {Promise<Object>}
 */
async function apiPost(action, data) {
  const token = localStorage.getItem('ceu_token');
  const payload = { action, data: data || {}, token: token || '' };

  // Operasi tulis — tambah epoch supaya cache in-flight GET terbatal
  if (!/^(get|list|fetch|read|boot)/i.test(action)) {
    _writeEpoch++;
  }

  // Deduplikasi untuk operasi baca sahaja
  const isRead = /^(get|list|fetch|read|boot)/i.test(action);
  const k = isRead ? (_writeEpoch + '|POST|' + action + '|' + JSON.stringify(data || {})) : null;
  if (k && _inflight[k]) return _inflight[k];

  const p = _fetchWithRetry(GAS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // WAJIB text/plain
    body: JSON.stringify(payload)
  });

  if (k) {
    _inflight[k] = p;
    p.finally(() => delete _inflight[k]);
  }

  return p;
}

/**
 * Fetch dengan pengendalian ralat dan retry.
 * GAS redirect 302 dikendalikan secara automatik oleh browser fetch.
 */
async function _fetchWithRetry(url, options, retries) {
  retries = retries || 2;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, redirect: 'follow' });

      // Semak jika respons adalah HTML (GAS error page)
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error('Pelayan mengembalikan halaman ralat. Sila cuba lagi.');
      }

      const json = await res.json();

      // Semak sesi tamat
      if (json.expired) {
        localStorage.removeItem('ceu_token');
        localStorage.removeItem('ceu_user');
        window.location.hash = '#/login';
        showToast('Sesi tamat tempoh. Sila log masuk semula.', 'warning');
        throw new Error('SESSION_EXPIRED');
      }

      return json;
    } catch (err) {
      if (err.message === 'SESSION_EXPIRED') throw err;
      if (attempt === retries) {
        console.error('API Error:', err);
        showToast('Ralat rangkaian. Sila periksa sambungan internet anda.', 'error');
        return { success: false, message: err.message || 'Ralat rangkaian.' };
      }
      // Tunggu sebentar sebelum cuba lagi
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

/**
 * Polling adaptif — hentikan polling jika tab tidak aktif.
 * @param {Function} fn - Fungsi polling.
 * @param {number} activeMs - Selang masa semasa aktif (ms).
 * @param {number} idleMs - Selang masa semasa idle (ms).
 * @return {number} ID interval (untuk clearInterval).
 */
function startAdaptivePolling(fn, activeMs, idleMs) {
  activeMs = activeMs || 30000;
  idleMs = idleMs || 120000;
  let intervalId = null;
  let lastActivity = Date.now();

  function updateActivity() {
    lastActivity = Date.now();
  }

  document.addEventListener('click', updateActivity);
  document.addEventListener('keydown', updateActivity);
  document.addEventListener('touchstart', updateActivity);

  function tick() {
    if (document.visibilityState !== 'visible') return;
    fn();
  }

  function schedule() {
    const idle = Date.now() - lastActivity > 60000;
    const ms = idle ? idleMs : activeMs;
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      tick();
      schedule(); // Jadual semula mengikut aktiviti terkini
    }, ms);
  }

  schedule();
  tick(); // Panggil segera sekali

  return {
    stop: () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('click', updateActivity);
      document.removeEventListener('keydown', updateActivity);
      document.removeEventListener('touchstart', updateActivity);
    }
  };
}
