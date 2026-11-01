// ============================================
// CEU Portal v1.1 — Utils.gs
// Utiliti Teras: Script Properties, Kriptografi,
// Sesi HMAC, Redaksi, Pembantu Sheets
// ============================================

// --- Pemalar Global ---
const APP_NAME = 'CEU Portal';

// ============================================
// 1. AKSES SATU PINTU SCRIPT PROPERTIES (R2)
// ============================================
const PROPS = PropertiesService.getScriptProperties();
let _PROP_MEMO = null;

/**
 * Baca nilai Script Property dengan memoization.
 * @param {string} key - Nama kunci.
 * @param {*} def - Nilai lalai jika tidak wujud.
 * @return {string}
 */
function prop_(key, def) {
  if (!_PROP_MEMO) _PROP_MEMO = PROPS.getProperties();
  const v = _PROP_MEMO[key];
  return v === undefined || v === null || v === '' ? (def === undefined ? '' : def) : v;
}

function setProp_(key, val) {
  PROPS.setProperty(key, String(val));
  if (_PROP_MEMO) _PROP_MEMO[key] = String(val);
}

function setProps_(obj) {
  PROPS.setProperties(obj);
  if (_PROP_MEMO) Object.keys(obj).forEach(k => { _PROP_MEMO[k] = String(obj[k]); });
}

function delProp_(key) {
  PROPS.deleteProperty(key);
  if (_PROP_MEMO) delete _PROP_MEMO[key];
}

// ============================================
// 2. KRIPTOGRAFI & KESELAMATAN
// ============================================

/**
 * Jana rentetan rawak kriptografi selamat.
 * Menggunakan computeDigest + UUID (bukan Math.random) — R3.
 */
function acak_(n, huruf) {
  huruf = huruf || 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  while (s.length < n) {
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid())
      .forEach(b => { if (s.length < n) s += huruf[(b & 0xff) % huruf.length]; });
  }
  return s;
}

/** Jana kata laluan rawak dengan jaminan alfanumerik. */
function sandiAcak_(n) {
  const s = acak_(n || 16);
  return /\d/.test(s) && /[A-Za-z]/.test(s) ? s : sandiAcak_(n);
}

/** Hash kata laluan dengan 300 iterasi HMAC-SHA256 + salt (R4). */
function hashPass_(pass, salt) {
  let h = String(pass);
  for (let i = 0; i < 300; i++) {
    h = Utilities.base64Encode(Utilities.computeHmacSha256Signature(h + salt, salt));
  }
  return h;
}

/** Perbandingan masa-konstan untuk cegah serangan timing (R4). */
function samaAman_(a, b) {
  a = String(a); b = String(b);
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/** Samarkan nilai sensitif: "ABCD••••••xyz" (R6). */
function samarkan_(v) {
  v = String(v || '');
  return !v ? '' : v.length <= 8 ? '••••••' : v.slice(0, 4) + '••••••' + v.slice(-3);
}

// ============================================
// 3. SESI HMAC STATELESS (R8)
// ============================================
const SESI_JAM = 12;

/** Bangkitkan SESSION_SECRET jika belum ada (R3). */
function secret_() {
  let s = prop_('SESSION_SECRET');
  if (!s) { s = acak_(64); setProp_('SESSION_SECRET', s); }
  return s;
}

function hmac_(s) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeHmacSha256Signature(s, secret_())
  ).replace(/=+$/, '');
}

function signToken_(p) {
  const body = Utilities.base64EncodeWebSafe(JSON.stringify(p)).replace(/=+$/, '');
  return body + '.' + hmac_(body);
}

/**
 * Cipta token sesi baharu.
 * @param {string} email
 * @param {string} role - 'Admin' atau 'Guru'
 * @param {string} nama
 * @param {boolean} darurat
 * @return {string} Token HMAC
 */
function buatSesi_(email, role, nama, darurat) {
  const now = Date.now();
  return signToken_({
    e: email,
    r: role,
    n: nama || '',
    i: now,
    x: now + SESI_JAM * 3600e3,
    d: darurat ? 1 : 0
  });
}

/**
 * Sahkan dan nyahkod token sesi.
 * @param {string} t - Token dari klien.
 * @return {Object|null} { email, role, nama, exp, darurat } atau null.
 */
function verifyToken_(t) {
  try {
    const parts = String(t || '').split('.');
    if (parts.length !== 2 || !samaAman_(hmac_(parts[0]), parts[1])) return null;
    let b = parts[0];
    while (b.length % 4) b += '=';
    const p = JSON.parse(
      Utilities.newBlob(Utilities.base64DecodeWebSafe(b)).getDataAsString()
    );
    if (!p.x || p.x < Date.now()) return null;

    // Semak pembatalan sesi
    const rev = Number(
      CacheService.getScriptCache().get('rev_' + p.e) ||
      prop_('REV_' + p.e) || 0
    );
    if (p.i < rev) return null;

    return { email: p.e, role: p.r, nama: p.n || '', exp: p.x, darurat: !!p.d };
  } catch (e) {
    return null;
  }
}

/** Batalkan semua sesi untuk emel tertentu. */
function revokeAll_(email) {
  const t = String(Date.now());
  setProp_('REV_' + email, t);
  CacheService.getScriptCache().put('rev_' + email, t, 21600);
}

/** Putar rahsia sesi — semua sesi aktif tamat serta-merta. */
function rotasiSecretSesi() {
  setProp_('SESSION_SECRET', acak_(64));
  _PROP_MEMO = null;
  Logger.log('✅ SESSION_SECRET dirotasi — semua sesi aktif berakhir.');
}

// ============================================
// 4. REDAKSI & AUDIT (R6)
// ============================================
const POLA_RAHASIA = /(token|password|passwd|sandi|secret|rahasia|credential|kredensial|api[_-]?key|apikey|hash|salt|authorization|otp|pin)/i;

/** Redaksi rekursif untuk log dan audit. */
function redaksi_(o, depth) {
  depth = depth || 0;
  if (o === null || typeof o !== 'object' || depth > 4) return o;
  if (Array.isArray(o)) return o.map(x => redaksi_(x, depth + 1));
  const out = {};
  Object.keys(o).forEach(k => {
    out[k] = POLA_RAHASIA.test(k) ? '[DISAMARKAN]' : redaksi_(o[k], depth + 1);
  });
  return out;
}

/**
 * Log audit ke sheet Log.
 * @param {string} email
 * @param {string} tindakan
 * @param {string} butiran
 */
function logAudit_(email, tindakan, butiran) {
  try {
    const sh = getSheet('Log');
    if (!sh) return;
    sh.appendRow([
      new Date().toISOString(),
      email || '-',
      tindakan || '-',
      String(butiran || '').substring(0, 500)
    ]);
  } catch (e) {
    // Jangan gagalkan operasi utama kerana log
  }
}

// ============================================
// 5. PEMBANTU SHEETS
// ============================================

/**
 * Buka sheet mengikut nama dari Spreadsheet utama.
 * @param {string} name - Nama sheet.
 * @return {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getSheet(name) {
  const ss = SpreadsheetApp.openById(prop_('SPREADSHEET_ID'));
  return ss.getSheetByName(name);
}

/**
 * Baca seluruh sheet sebagai tatasusunan objek (berdasarkan header — bukan indeks).
 * @param {string} name - Nama sheet.
 * @return {Object[]}
 */
function readSheet(name) {
  const sh = getSheet(name);
  if (!sh) return [];
  const v = sh.getDataRange().getValues();
  if (v.length <= 1) return [];
  const h = v[0].map(String);
  return v.slice(1)
    .filter(r => r.join('') !== '')
    .map(r => {
      const o = {};
      h.forEach((k, i) => { if (k) o[k] = r[i]; });
      return o;
    });
}

/**
 * Tambah baris baharu ke sheet berdasarkan pemetaan header.
 * @param {string} name - Nama sheet.
 * @param {Object} obj - Data yang akan ditambah.
 * @param {string[]} [headers] - Senarai header (opsional, akan dibaca dari sheet).
 */
function appendToSheet(name, obj, headers) {
  const sh = getSheet(name);
  if (!sh) throw new Error('Sheet "' + name + '" tidak ditemui.');
  if (!headers) {
    headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  }
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sh.appendRow(row);
}

/**
 * Kemas kini baris tertentu dalam rentang blok kontigu (gas-scale-turbo).
 * Hanya menulis baris yang berubah, bukan seluruh sheet.
 * @param {string} name - Nama sheet.
 * @param {string} keyCol - Nama lajur kunci.
 * @param {Object} patchesByKey - { kunci: { lajur: nilaiBaruBaharu } }
 */
function updateWhere(name, keyCol, patchesByKey) {
  const sh = getSheet(name);
  const v = sh.getDataRange().getValues();
  const h = v[0].map(String);
  const ki = h.indexOf(keyCol);
  if (ki === -1) throw new Error('Lajur kunci "' + keyCol + '" tidak ditemui.');

  let min = Infinity, max = -1;
  for (let i = 1; i < v.length; i++) {
    const p = patchesByKey[String(v[i][ki])];
    if (!p) continue;
    Object.keys(p).forEach(k => {
      const c = h.indexOf(k);
      if (c > -1) v[i][c] = p[k];
    });
    min = Math.min(min, i);
    max = Math.max(max, i);
  }
  if (max > -1) {
    sh.getRange(min + 1, 1, max - min + 1, h.length).setValues(v.slice(min, max + 1));
  }
}

// ============================================
// 6. PEMBINA RESPONS JSON
// ============================================

/** Bina respons JSON standard untuk ContentService. */
function buildResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Respons kejayaan. */
function ok(data, msg) {
  return { success: true, message: msg || 'OK', data: data || null };
}

/** Respons kegagalan. */
function fail(msg) {
  return { success: false, message: msg || 'Ralat tidak diketahui.' };
}

// ============================================
// 7. PEMBANTU OTP
// ============================================

/**
 * Jana dan simpan OTP 6-digit ke cache (5 minit).
 * @param {string} email
 * @return {string} Kod OTP 6-digit.
 */
function janaOtp_(email) {
  const kod = acak_(6, '0123456789');
  const cache = CacheService.getScriptCache();
  cache.put('otp_' + email.toLowerCase(), kod, 300); // 5 minit
  cache.put('otp_try_' + email.toLowerCase(), '0', 300);
  return kod;
}

/**
 * Sahkan OTP dan padam dari cache.
 * @param {string} email
 * @param {string} kod
 * @return {boolean}
 */
function sahkanOtp_(email, kod) {
  const cache = CacheService.getScriptCache();
  const key = 'otp_' + email.toLowerCase();
  const tryKey = 'otp_try_' + email.toLowerCase();

  const stored = cache.get(key);
  if (!stored) return false;

  // Semak had percubaan (maks 5x)
  const tries = Number(cache.get(tryKey) || 0);
  if (tries >= 5) {
    cache.remove(key);
    cache.remove(tryKey);
    return false;
  }
  cache.put(tryKey, String(tries + 1), 300);

  if (samaAman_(stored, kod)) {
    cache.remove(key);
    cache.remove(tryKey);
    return true;
  }
  return false;
}

/**
 * Hantar emel OTP melalui GmailApp.
 * @param {string} email
 * @param {string} kod
 */
function hantarEmelOtp_(email, kod) {
  const subjek = '🔐 CEU Portal — Kod Pengesahan OTP Anda';
  const badan = [
    'Salam sejahtera,',
    '',
    'Kod pengesahan sekali guna (OTP) anda untuk log masuk ke CEU Portal:',
    '',
    '    ' + kod,
    '',
    'Kod ini sah selama 5 minit. Jangan kongsi kod ini dengan sesiapa.',
    '',
    'Jika anda tidak memohon kod ini, sila abaikan emel ini.',
    '',
    '---',
    'CEU Portal — Unit Pendidikan Kerjaya',
    'Jabatan Sekolah-Sekolah'
  ].join('\n');

  GmailApp.sendEmail(email, subjek, badan, {
    name: 'CEU Portal — Unit Pendidikan Kerjaya',
    noReply: true
  });
}
