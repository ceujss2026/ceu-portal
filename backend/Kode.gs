// ============================================
// CEU Portal v1.1 — Kode.gs
// Titik Masuk Utama: doGet / doPost REST API
// Router Tindakan + Pengawal Akses + Telemetri
// ============================================

const APP_VERSION = '1.1.0';

// Bendera web (untuk antrean notifikasi di luar lock)
let _IN_WEB = false;
const _NQ = [];

// ============================================
// doGet — Titik masuk GET (data awam & boot)
// ============================================
function doGet(e) {
  _IN_WEB = true;
  const t0 = Date.now();
  let res;
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    switch (action) {
      case 'ping':
        res = ok({ status: 'online', app: APP_NAME });
        break;
      case 'boot':
        res = _handleBoot(e);
        break;
      case 'getCalendar':
        res = _handleGetCalendar(e);
        break;
      case 'getDocuments':
        res = _handleGetDocuments(e);
        break;
      default:
        res = fail('Tindakan GET tidak dikenali: ' + action);
    }
  } catch (err) {
    res = fail(err.message || String(err));
  }
  res.ms = Date.now() - t0;
  res.v = APP_VERSION;
  _IN_WEB = false;
  return buildResponse(res);
}

// ============================================
// doPost — Titik masuk POST (semua tindakan)
// ============================================
function doPost(e) {
  _IN_WEB = true;
  const t0 = Date.now();
  let body = {};
  let res;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    res = dispatch(body);
  } catch (err) {
    res = fail(err && err.message ? err.message : String(err));
  }
  res.ms = Date.now() - t0;
  res.v = APP_VERSION;
  res.nq = _NQ.length; // Bilangan notifikasi dalam antrean

  // Log pertanyaan perlahan (> 4 saat)
  if (res.ms > 4000) {
    logAudit_('-', 'SLOW_QUERY', (body.action || 'unknown') + ' — ' + res.ms + 'ms');
  }

  _IN_WEB = false;
  return buildResponse(res);
}

// ============================================
// ROUTER TINDAKAN UTAMA
// ============================================

/**
 * Menghalakan tindakan POST ke pengendali yang betul.
 * Menguruskan pengesahan token dan kawalan peranan.
 */
function dispatch(body) {
  const action = body.action || '';

  // --- Laluan Awam (Tanpa Token) ---
  switch (action) {
    case 'requestOtp':    return _handleRequestOtp(body);
    case 'verifyOtp':     return _handleVerifyOtp(body);
    case 'requestAccess': return _handleRequestAccess(body);
    case 'loginDarurat':  return _handleLoginDarurat(body);
  }

  // --- Laluan Bertoken (Wajib Log Masuk) ---
  const user = verifyToken_(body.token);
  if (!user) {
    return { success: false, message: 'Sesi tamat tempoh atau tidak sah. Sila log masuk semula.', expired: true };
  }

  // Laluan Guru & Admin
  switch (action) {
    // Guru
    case 'submitRsvp':      return _handleSubmitRsvp(body, user);
    case 'getMyRsvp':       return _handleGetMyRsvp(body, user);
    case 'getNotifications': return _handleGetNotifications(body, user);
    case 'markNotifRead':   return _handleMarkNotifRead(body, user);
    case 'logout':          return _handleLogout(body, user);

    // Admin sahaja
    case 'getDashboardStats':   return _guardAdmin(user, () => _handleGetDashboardStats(body, user));
    case 'createEvent':         return _guardAdmin(user, () => _handleCreateEvent(body, user));
    case 'updateEvent':         return _guardAdmin(user, () => _handleUpdateEvent(body, user));
    case 'deleteEvent':         return _guardAdmin(user, () => _handleDeleteEvent(body, user));
    case 'createDocument':      return _guardAdmin(user, () => _handleCreateDocument(body, user));
    case 'updateDocument':      return _guardAdmin(user, () => _handleUpdateDocument(body, user));
    case 'sendBroadcast':       return _guardAdmin(user, () => _handleSendBroadcast(body, user));
    case 'approveUser':         return _guardAdmin(user, () => _handleApproveUser(body, user));
    case 'rejectUser':          return _guardAdmin(user, () => _handleRejectUser(body, user));
    case 'getTeacherDirectory': return _guardAdmin(user, () => _handleGetTeacherDirectory(body, user));
    case 'exportCsv':           return _guardAdmin(user, () => _handleExportCsv(body, user));

    default:
      return fail('Tindakan tidak dikenali: ' + action);
  }
}

/** Pengawal peranan Admin. */
function _guardAdmin(user, fn) {
  if (user.role !== 'Admin') {
    return fail('Akses ditolak. Hanya pentadbir yang dibenarkan.');
  }
  return fn();
}

// ============================================
// PENGENDALI PENGESAHAN (Auth)
// ============================================

/** Hantar OTP ke emel rasmi. */
function _handleRequestOtp(body) {
  const email = String(body.email || '').toLowerCase().trim();
  if (!email) return fail('Sila masukkan alamat emel rasmi.');
  if (!/\.(moe|gov|edu)\.bn$/i.test(email) && email !== 'admin.upk@moe.bn') {
    return fail('Hanya emel rasmi (.moe.bn / .gov.bn / .edu.bn) dibenarkan.');
  }

  // Semak pengguna berdaftar
  const users = readSheet('Users');
  const user = users.find(u => String(u.Email).toLowerCase() === email && u.Status === 'Aktif');
  if (!user) {
    return fail('Emel ini tidak berdaftar dalam sistem. Sila mohon capaian baharu.');
  }

  // Jana dan hantar OTP
  const kod = janaOtp_(email);
  try {
    hantarEmelOtp_(email, kod);
  } catch (e) {
    return fail('Gagal menghantar emel OTP. Sila cuba sebentar lagi.');
  }

  logAudit_(email, 'OTP_DIMINTA', 'OTP dihantar ke emel.');
  return ok({ sent: true }, 'Kod OTP telah dihantar ke ' + samarkan_(email));
}

/** Sahkan OTP dan terbitkan token sesi. */
function _handleVerifyOtp(body) {
  const email = String(body.email || '').toLowerCase().trim();
  const kod = String(body.kod || '').trim();

  if (!email || !kod) return fail('Emel dan kod OTP diperlukan.');

  if (!sahkanOtp_(email, kod)) {
    logAudit_(email, 'OTP_GAGAL', 'Pengesahan OTP gagal.');
    return fail('Kod OTP tidak sah atau telah tamat tempoh.');
  }

  // Dapatkan maklumat pengguna
  const users = readSheet('Users');
  const user = users.find(u => String(u.Email).toLowerCase() === email && u.Status === 'Aktif');
  if (!user) return fail('Pengguna tidak ditemui.');

  // Terbitkan token sesi
  const token = buatSesi_(email, user.Peranan, user.Nama, false);

  // Pra-panaskan cache boot
  warmupBoot_(email, user.Peranan);

  logAudit_(email, 'LOG_MASUK', 'Log masuk berjaya via OTP.');

  return ok({
    token: token,
    user: {
      email: user.Email,
      nama: user.Nama,
      peranan: user.Peranan,
      sekolah: user.Sekolah,
      daerah: user.Daerah
    }
  }, 'Log masuk berjaya!');
}

/** Mohon capaian guru baharu. */
function _handleRequestAccess(body) {
  const data = body.data || {};
  const email = String(data.email || '').toLowerCase().trim();
  const nama = String(data.nama || '').trim();
  const sekolah = String(data.sekolah || '').trim();
  const jawatan = String(data.jawatan || '').trim();

  if (!email || !nama || !sekolah) {
    return fail('Nama, emel, dan sekolah diperlukan.');
  }

  // Semak duplikasi
  const sedia = readSheet('Users').find(u => String(u.Email).toLowerCase() === email);
  if (sedia) return fail('Emel ini sudah berdaftar dalam sistem.');

  const pending = readSheet('Permohonan').find(p => String(p.Email).toLowerCase() === email && p.Status === 'Menunggu');
  if (pending) return fail('Permohonan untuk emel ini masih dalam proses kelulusan.');

  appendToSheet('Permohonan', {
    ID: 'REQ' + Date.now(),
    Nama: nama,
    Email: email,
    Sekolah: sekolah,
    Jawatan: jawatan || 'Guru Pendidikan Kerjaya',
    Masa: new Date().toISOString(),
    Status: 'Menunggu'
  });

  logAudit_(email, 'MOHON_AKSES', 'Permohonan capaian baharu dihantar.');
  return ok(null, 'Permohonan anda telah dihantar. Pegawai UPK akan menyemak dan meluluskan akses anda.');
}

/** Log masuk darurat (R9). */
function _handleLoginDarurat(body) {
  const username = String(body.username || '').trim();
  const password = String(body.password || '').trim();

  // Semak kunci akses darurat
  const kunciSampai = prop_('DARURAT_KUNCI_SAMPAI');
  if (kunciSampai && Date.now() < Number(kunciSampai)) {
    const baki = Math.ceil((Number(kunciSampai) - Date.now()) / 60000);
    return fail('Akses darurat dikunci. Cuba lagi dalam ' + baki + ' minit.');
  }

  const userDarurat = prop_('EMERGENCY_USER', 'darurat');
  if (username !== userDarurat) return fail('Kelayakan tidak sah.');

  const salt = prop_('EMERGENCY_SALT');
  const hash = prop_('EMERGENCY_PASS_HASH');
  if (!salt || !hash) return fail('Akses darurat belum disediakan.');

  if (!samaAman_(hashPass_(password, salt), hash)) {
    // Kira percubaan gagal
    const cubaan = Number(prop_('DARURAT_CUBAAN', '0')) + 1;
    setProp_('DARURAT_CUBAAN', String(cubaan));

    if (cubaan >= 5) {
      // Kunci selama 15 minit (R9)
      setProp_('DARURAT_KUNCI_SAMPAI', String(Date.now() + 15 * 60000));
      setProp_('DARURAT_CUBAAN', '0');
      logAudit_('darurat', 'DARURAT_KUNCI', '5x percubaan gagal — dikunci 15 minit.');
      return fail('Terlalu banyak percubaan gagal. Akses dikunci selama 15 minit.');
    }

    return fail('Kelayakan tidak sah. Percubaan ' + cubaan + '/5.');
  }

  // Reset kaunter percubaan
  delProp_('DARURAT_CUBAAN');
  delProp_('DARURAT_KUNCI_SAMPAI');

  const token = buatSesi_('darurat', 'Admin', 'Akses Darurat', true);
  logAudit_('darurat', 'LOG_MASUK_DARURAT', 'Log masuk darurat berjaya.');

  return ok({
    token: token,
    user: {
      email: 'darurat',
      nama: 'Akses Darurat',
      peranan: 'Admin',
      sekolah: '-',
      daerah: '-'
    }
  }, 'Log masuk darurat berjaya.');
}

// ============================================
// PENGENDALI BOOT & DATA AWAM
// ============================================

/** Muat data awal (boot) untuk pengguna. */
function _handleBoot(e) {
  const token = (e && e.parameter && e.parameter.token) || '';
  const user = verifyToken_(token);
  if (!user) return fail('Sesi tidak sah.');

  // Cuba cache dahulu
  const key = bootKey_(user.email);
  const cached = CacheX.get(key);
  if (cached) {
    return ok(cached, 'Boot data (dari cache).');
  }

  // Bina data boot segar
  const data = _buildBootData(user.email, user.role);
  CacheX.put(key, data, 3600);

  return ok(data, 'Boot data dimuat.');
}

/** Senarai acara kalendar. */
function _handleGetCalendar(e) {
  const bulan = (e && e.parameter && e.parameter.bulan) || '';
  const tahun = (e && e.parameter && e.parameter.tahun) || '';

  const cacheKey = 'cal_' + tahun + '_' + bulan;
  const cached = CacheX.get(cacheKey);
  if (cached) return ok(cached, 'Data kalendar (cache).');

  let acara = readSheet('Kalendar');

  if (bulan && tahun) {
    acara = acara.filter(a => {
      const d = new Date(a.Tarikh);
      return (d.getMonth() + 1) === Number(bulan) && d.getFullYear() === Number(tahun);
    });
  }

  acara.sort((a, b) => new Date(a.Tarikh) - new Date(b.Tarikh));
  CacheX.put(cacheKey, acara, 1800);

  return ok(acara, 'Senarai acara kalendar.');
}

/** Senarai dokumen, memo, minit. */
function _handleGetDocuments(e) {
  const jenis = (e && e.parameter && e.parameter.jenis) || '';
  const carian = (e && e.parameter && e.parameter.q) || '';

  const cacheKey = 'docs_' + jenis + '_' + carian.substring(0, 20);
  const cached = CacheX.get(cacheKey);
  if (cached) return ok(cached, 'Dokumen (cache).');

  let docs = readSheet('Memo_Minit');

  if (jenis) {
    docs = docs.filter(d => d.Jenis === jenis);
  }
  if (carian) {
    const q = carian.toLowerCase();
    docs = docs.filter(d =>
      String(d.Tajuk).toLowerCase().includes(q) ||
      String(d.NoRujukan).toLowerCase().includes(q) ||
      String(d.Ringkasan).toLowerCase().includes(q)
    );
  }

  docs.sort((a, b) => new Date(b.Tarikh) - new Date(a.Tarikh));
  CacheX.put(cacheKey, docs, 1800);

  return ok(docs, 'Senarai dokumen.');
}

// ============================================
// PENGENDALI GURU
// ============================================

/** Hantar atau kemas kini RSVP. */
function _handleSubmitRsvp(body, user) {
  const data = body.data || {};
  const acaraId = String(data.acaraId || '').trim();
  const status = String(data.status || '').trim();
  const catatan = String(data.catatan || '').trim();

  if (!acaraId || !status) return fail('ID acara dan status RSVP diperlukan.');
  if (!['Hadir', 'Tidak Hadir', 'Mewakilkan'].includes(status)) {
    return fail('Status RSVP tidak sah. Pilihan: Hadir, Tidak Hadir, Mewakilkan.');
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return fail('Pelayan sibuk. Sila cuba sebentar lagi.');

  try {
    // Semak RSVP sedia ada
    const rsvps = readSheet('RSVP');
    const existing = rsvps.find(r =>
      r.AcaraID === acaraId && String(r.Email).toLowerCase() === user.email
    );

    if (existing) {
      // Kemas kini
      updateWhere('RSVP', 'ID', {
        [existing.ID]: {
          Status: status,
          Catatan: catatan,
          Masa: new Date().toISOString()
        }
      });
    } else {
      // Baharu
      appendToSheet('RSVP', {
        ID: 'RSVP' + Date.now(),
        AcaraID: acaraId,
        Email: user.email,
        Nama: user.nama,
        Sekolah: '',
        Status: status,
        Catatan: catatan,
        Masa: new Date().toISOString()
      });
    }

    bumpUser_(user.email);
    bumpGlobal_();
  } finally {
    lock.releaseLock();
  }

  logAudit_(user.email, 'RSVP', acaraId + ' → ' + status);
  return ok({ status: status }, 'RSVP berjaya dikemaskini.');
}

/** Senarai RSVP peribadi. */
function _handleGetMyRsvp(body, user) {
  const rsvps = readSheet('RSVP')
    .filter(r => String(r.Email).toLowerCase() === user.email)
    .sort((a, b) => new Date(b.Masa) - new Date(a.Masa));

  // Gabungkan maklumat acara
  const acara = readSheet('Kalendar');
  const enriched = rsvps.map(r => {
    const evt = acara.find(a => a.ID === r.AcaraID) || {};
    return {
      ...r,
      tajukAcara: evt.Tajuk || '-',
      tarikhAcara: evt.Tarikh || '-',
      lokasiAcara: evt.Lokasi || '-',
      jenisAcara: evt.Jenis || '-'
    };
  });

  return ok(enriched, 'Senarai RSVP anda.');
}

/** Senarai notifikasi. */
function _handleGetNotifications(body, user) {
  const notifs = readSheet('Notifikasi')
    .sort((a, b) => new Date(b.Masa) - new Date(a.Masa))
    .slice(0, 50);
  return ok(notifs, 'Senarai pemberitahuan.');
}

/** Tanda notifikasi sebagai dibaca. */
function _handleMarkNotifRead(body, user) {
  // Simpan ke cache (notifikasi yang telah dibaca oleh pengguna)
  const cache = CacheService.getScriptCache();
  const key = 'notif_read_' + user.email;
  const existing = JSON.parse(cache.get(key) || '[]');
  const notifId = body.data && body.data.notifId;
  if (notifId && !existing.includes(notifId)) {
    existing.push(notifId);
    cache.put(key, JSON.stringify(existing), 86400);
  }
  return ok(null, 'Pemberitahuan ditandakan dibaca.');
}

/** Log keluar. */
function _handleLogout(body, user) {
  revokeAll_(user.email);
  logAudit_(user.email, 'LOG_KELUAR', 'Sesi dibatalkan.');
  return ok(null, 'Log keluar berjaya.');
}

// ============================================
// PENGENDALI ADMIN
// ============================================

/** Statistik dashboard admin. */
function _handleGetDashboardStats(body, user) {
  const cacheKey = 'admin_stats';
  const cached = CacheX.get(cacheKey);
  if (cached) return ok(cached, 'Statistik dashboard (cache).');

  const users = readSheet('Users').filter(u => u.Status === 'Aktif');
  const sekolah = readSheet('Sekolah').filter(s => s.Status === 'Aktif');
  const acara = readSheet('Kalendar');
  const rsvps = readSheet('RSVP');
  const permohonan = readSheet('Permohonan').filter(p => p.Status === 'Menunggu');

  // Kira purata kadar RSVP
  const acaraDenganRsvp = acara.filter(a => a.RSVP === 'Ya');
  let totalHadir = 0, totalJumlah = 0;
  acaraDenganRsvp.forEach(a => {
    const rsvpAcara = rsvps.filter(r => r.AcaraID === a.ID);
    totalHadir += rsvpAcara.filter(r => r.Status === 'Hadir').length;
    totalJumlah += rsvpAcara.length || 1;
  });
  const puratKadar = totalJumlah > 0 ? Math.round((totalHadir / totalJumlah) * 1000) / 10 : 0;

  // RSVP mengikut daerah
  const daerahStats = {};
  users.forEach(u => {
    const d = u.Daerah || 'Lain-lain';
    if (!daerahStats[d]) daerahStats[d] = { jumlah: 0, hadir: 0 };
    daerahStats[d].jumlah++;
  });

  // Acara aktif bulan ini
  const now = new Date();
  const acaraBulanIni = acara.filter(a => {
    const d = new Date(a.Tarikh);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const stats = {
    jumlahGuru: users.length,
    jumlahSekolah: sekolah.length,
    acaraAktifBulanIni: acaraBulanIni.length,
    permohonanMenunggu: permohonan.length,
    purataKadarRsvp: puratKadar,
    daerahStats: daerahStats,
    acaraTerkini: acaraBulanIni.slice(0, 10).map(a => {
      const rsvpAcara = rsvps.filter(r => r.AcaraID === a.ID);
      return {
        id: a.ID,
        tajuk: a.Tajuk,
        tarikh: a.Tarikh,
        hadir: rsvpAcara.filter(r => r.Status === 'Hadir').length,
        tidakHadir: rsvpAcara.filter(r => r.Status === 'Tidak Hadir').length,
        menunggu: rsvpAcara.filter(r => r.Status === 'Menunggu').length
      };
    })
  };

  CacheX.put(cacheKey, stats, 600); // 10 minit
  return ok(stats, 'Statistik dashboard.');
}

/** Cipta acara baharu. */
function _handleCreateEvent(body, user) {
  const d = body.data || {};
  if (!d.tajuk || !d.tarikh) return fail('Tajuk dan tarikh acara diperlukan.');

  const id = 'EVT' + Date.now();
  appendToSheet('Kalendar', {
    ID: id, Tajuk: d.tajuk, Jenis: d.jenis || 'Lain-lain',
    Tarikh: d.tarikh, MasaMula: d.masaMula || '', MasaTamat: d.masaTamat || '',
    Lokasi: d.lokasi || '', Keterangan: d.keterangan || '',
    Sasaran: d.sasaran || 'Semua Guru', RSVP: d.rsvp || 'Ya', CalEventId: ''
  });

  bumpProgram_();
  logAudit_(user.email, 'CIPTA_ACARA', id + ' — ' + d.tajuk);
  return ok({ id: id }, 'Acara baharu berjaya dicipta.');
}

/** Kemas kini acara. */
function _handleUpdateEvent(body, user) {
  const d = body.data || {};
  if (!d.id) return fail('ID acara diperlukan.');

  const patch = {};
  ['Tajuk', 'Jenis', 'Tarikh', 'MasaMula', 'MasaTamat', 'Lokasi', 'Keterangan', 'Sasaran', 'RSVP'].forEach(f => {
    const key = f.charAt(0).toLowerCase() + f.slice(1);
    if (d[key] !== undefined) patch[f] = d[key];
  });

  updateWhere('Kalendar', 'ID', { [d.id]: patch });
  bumpProgram_();
  logAudit_(user.email, 'KEMASKINI_ACARA', d.id);
  return ok(null, 'Acara berjaya dikemaskini.');
}

/** Padam acara. */
function _handleDeleteEvent(body, user) {
  const id = body.data && body.data.id;
  if (!id) return fail('ID acara diperlukan.');

  const sh = getSheet('Kalendar');
  const v = sh.getDataRange().getValues();
  const h = v[0].map(String);
  const ki = h.indexOf('ID');

  for (let i = v.length - 1; i >= 1; i--) {
    if (String(v[i][ki]) === id) {
      sh.deleteRow(i + 1);
      break;
    }
  }

  bumpProgram_();
  logAudit_(user.email, 'PADAM_ACARA', id);
  return ok(null, 'Acara berjaya dipadam.');
}

/** Cipta rekod dokumen/memo baharu. */
function _handleCreateDocument(body, user) {
  const d = body.data || {};
  if (!d.tajuk || !d.pautan) return fail('Tajuk dan pautan dokumen diperlukan.');

  const id = 'DOC' + Date.now();
  appendToSheet('Memo_Minit', {
    ID: id, Jenis: d.jenis || 'Memo Rasmi', Tajuk: d.tajuk,
    NoRujukan: d.noRujukan || '', Tarikh: d.tarikh || new Date().toISOString().split('T')[0],
    Kategori: d.kategori || 'Lain-lain', Pautan: d.pautan, Ringkasan: d.ringkasan || ''
  });

  bumpMemo_();
  logAudit_(user.email, 'CIPTA_DOKUMEN', id + ' — ' + d.tajuk);
  return ok({ id: id }, 'Dokumen berjaya ditambah.');
}

/** Kemas kini rekod dokumen. */
function _handleUpdateDocument(body, user) {
  const d = body.data || {};
  if (!d.id) return fail('ID dokumen diperlukan.');

  const patch = {};
  ['Jenis', 'Tajuk', 'NoRujukan', 'Tarikh', 'Kategori', 'Pautan', 'Ringkasan'].forEach(f => {
    const key = f.charAt(0).toLowerCase() + f.slice(1);
    if (d[key] !== undefined) patch[f] = d[key];
  });

  updateWhere('Memo_Minit', 'ID', { [d.id]: patch });
  bumpMemo_();
  logAudit_(user.email, 'KEMASKINI_DOKUMEN', d.id);
  return ok(null, 'Dokumen berjaya dikemaskini.');
}

/** Siar notifikasi hebahan (in-app + emel BCC). */
function _handleSendBroadcast(body, user) {
  const d = body.data || {};
  if (!d.tajuk || !d.mesej) return fail('Tajuk dan mesej diperlukan.');

  const id = 'NOTIF' + Date.now();
  appendToSheet('Notifikasi', {
    ID: id, Tajuk: d.tajuk, Kategori: d.kategori || 'Umum',
    Keutamaan: d.keutamaan || 'Biasa', Mesej: d.mesej,
    SasaranJenis: d.sasaranJenis || 'Semua',
    SasaranData: d.sasaranData || '',
    Saluran: 'In-App,Emel',
    Penghantar: user.email, Masa: new Date().toISOString(),
    Ref: d.ref || ''
  });

  // Antrean penghantaran emel (di luar lock — gas-scale-turbo)
  if (d.hantarEmel !== false) {
    _enqueueBroadcastEmail(d, user);
  }

  bumpNotif_();
  logAudit_(user.email, 'SIAR_HEBAHAN', id + ' — ' + d.tajuk);
  return ok({ id: id }, 'Hebahan berjaya disiarkan.');
}

/** Antrean emel siaran secara kelompok BCC (50 penerima per emel). */
function _enqueueBroadcastEmail(data, sender) {
  try {
    let penerima = readSheet('Users')
      .filter(u => u.Status === 'Aktif' && u.Email)
      .map(u => u.Email);

    // Tapis mengikut sasaran
    if (data.sasaranJenis === 'Daerah' && data.sasaranData) {
      const daerahList = data.sasaranData.split(',').map(s => s.trim().toLowerCase());
      const users = readSheet('Users');
      penerima = users
        .filter(u => u.Status === 'Aktif' && daerahList.includes(String(u.Daerah).toLowerCase()))
        .map(u => u.Email);
    }

    // Hantar secara kelompok BCC (50 penerima per emel)
    const BATCH_SIZE = 50;
    for (let i = 0; i < penerima.length; i += BATCH_SIZE) {
      const batch = penerima.slice(i, i + BATCH_SIZE);
      try {
        GmailApp.sendEmail(
          sender.email, // Kepada: diri sendiri
          '📢 CEU Portal: ' + data.tajuk,
          data.mesej + '\n\n---\nDihantar melalui CEU Portal oleh ' + sender.nama,
          {
            bcc: batch.join(','),
            name: 'CEU Portal — Unit Pendidikan Kerjaya',
            noReply: true
          }
        );
      } catch (e) {
        logAudit_(sender.email, 'EMEL_GAGAL', 'Batch ' + Math.floor(i / BATCH_SIZE + 1) + ': ' + e.message);
      }
    }
  } catch (e) {
    logAudit_(sender.email, 'BROADCAST_GAGAL', e.message);
  }
}

/** Luluskan permohonan guru. */
function _handleApproveUser(body, user) {
  const id = body.data && body.data.id;
  if (!id) return fail('ID permohonan diperlukan.');

  const permohonan = readSheet('Permohonan').find(p => p.ID === id && p.Status === 'Menunggu');
  if (!permohonan) return fail('Permohonan tidak ditemui atau sudah diproses.');

  // Kemas kini status permohonan
  updateWhere('Permohonan', 'ID', { [id]: { Status: 'Diluluskan' } });

  // Tambah ke senarai pengguna
  appendToSheet('Users', {
    Email: permohonan.Email,
    Nama: permohonan.Nama,
    Peranan: 'Guru',
    Sekolah: permohonan.Sekolah,
    Daerah: '',
    Status: 'Aktif'
  });

  bumpGlobal_();
  logAudit_(user.email, 'LULUS_PENGGUNA', permohonan.Email);
  return ok(null, 'Permohonan ' + permohonan.Nama + ' berjaya diluluskan.');
}

/** Tolak permohonan guru. */
function _handleRejectUser(body, user) {
  const id = body.data && body.data.id;
  const sebab = body.data && body.data.sebab || '';
  if (!id) return fail('ID permohonan diperlukan.');

  updateWhere('Permohonan', 'ID', { [id]: { Status: 'Ditolak' } });
  logAudit_(user.email, 'TOLAK_PENGGUNA', id + (sebab ? ' — ' + sebab : ''));
  return ok(null, 'Permohonan berjaya ditolak.');
}

/** Senarai direktori guru dan sekolah. */
function _handleGetTeacherDirectory(body, user) {
  const guru = readSheet('Users').filter(u => u.Status === 'Aktif');
  const sekolah = readSheet('Sekolah');
  const permohonan = readSheet('Permohonan').filter(p => p.Status === 'Menunggu');

  return ok({
    guru: guru,
    sekolah: sekolah,
    permohonan: permohonan
  }, 'Direktori guru dan sekolah.');
}

/** Eksport data RSVP ke CSV (dikembalikan sebagai teks). */
function _handleExportCsv(body, user) {
  const acaraId = body.data && body.data.acaraId;
  let rsvps = readSheet('RSVP');

  if (acaraId) {
    rsvps = rsvps.filter(r => r.AcaraID === acaraId);
  }

  const headers = ['ID', 'AcaraID', 'Email', 'Nama', 'Sekolah', 'Status', 'Catatan', 'Masa'];
  const csvRows = [headers.join(',')];
  rsvps.forEach(r => {
    csvRows.push(headers.map(h => '"' + String(r[h] || '').replace(/"/g, '""') + '"').join(','));
  });

  logAudit_(user.email, 'EKSPORT_CSV', 'RSVP — ' + rsvps.length + ' baris');
  return ok({ csv: csvRows.join('\n'), count: rsvps.length }, 'Data CSV dijanakan.');
}
