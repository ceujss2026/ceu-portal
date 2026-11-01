// ============================================
// CEU Portal v1.1 — Cache.gs
// CacheX: Sistem Cache Berpecah (Chunked)
// Menyokong data > 100KB dengan auto-chunking
// Mengikut pola gas-scale-turbo
// ============================================

const CacheX = {
  SZ: 50000, // 50KB selamat per partisi (karakter)

  /** Dapatkan instans CacheService. */
  c: function() {
    return CacheService.getScriptCache();
  },

  /**
   * Baca dari cache dengan penyusunan semula chunk automatik.
   * @param {string} key - Kunci cache.
   * @return {*} Data yang dinyahsiri (JSON.parse) atau null.
   */
  get: function(key) {
    try {
      const c = this.c();
      const head = c.get(key);
      if (head == null) return null;

      // Jika bukan data berpecah, terus parse
      if (head.indexOf('__chunks:') !== 0) return JSON.parse(head);

      // Baca semua bahagian chunk
      const n = +head.slice(9);
      const keys = [];
      for (let i = 0; i < n; i++) keys.push(key + '#' + i);

      const parts = c.getAll(keys);
      let s = '';
      for (let i = 0; i < n; i++) {
        if (parts[keys[i]] == null) return null; // Chunk hilang — cache rosak
        s += parts[keys[i]];
      }
      return JSON.parse(s);
    } catch (e) {
      return null;
    }
  },

  /**
   * Simpan ke cache dengan auto-chunking jika > 50KB.
   * @param {string} key - Kunci cache.
   * @param {*} val - Data (akan disiri ke JSON).
   * @param {number} ttl - Tempoh sah dalam saat (maks 21600 = 6 jam).
   * @return {boolean} true jika berjaya.
   */
  put: function(key, val, ttl) {
    try {
      const s = JSON.stringify(val);
      const c = this.c();

      // Data kecil — simpan terus
      if (s.length <= this.SZ) {
        c.put(key, s, ttl);
        return true;
      }

      // Data besar — pecah kepada beberapa chunk
      const n = Math.ceil(s.length / this.SZ);
      if (n > 20) return false; // Elak cache > 1MB

      const m = {};
      for (let i = 0; i < n; i++) {
        m[key + '#' + i] = s.substr(i * this.SZ, this.SZ);
      }
      c.putAll(m, ttl);
      // Metadata chunk ditulis terakhir untuk mengelakkan pembacaan separa
      c.put(key, '__chunks:' + n, ttl);
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Padam cache termasuk semua chunk.
   * @param {string} key - Kunci cache.
   */
  remove: function(key) {
    try {
      const c = this.c();
      const head = c.get(key);
      if (head != null && head.indexOf('__chunks:') === 0) {
        const n = +head.slice(9);
        const keys = [key];
        for (let i = 0; i < n; i++) keys.push(key + '#' + i);
        c.removeAll(keys);
      } else {
        c.remove(key);
      }
    } catch (e) {
      // Abaikan ralat pemadaman
    }
  }
};

// ============================================
// CACHE BERVERSI & INVALIDASI TERARAH
// ============================================

/**
 * Naikkan versi scope cache tertentu.
 * Semua cache yang bergantung pada scope ini akan terbatal secara automatik.
 * @param {string} scope - Nama scope (cth: 'global', 'program', 'memo').
 */
function bump(scope) {
  CacheService.getScriptCache().put('ver_' + scope, String(Date.now()), 21600);
}

/**
 * Naikkan versi cache khusus untuk pengguna tertentu.
 * @param {string} email
 */
function bumpUser_(email) {
  if (email) bump('u_' + email.toLowerCase());
}

/**
 * Bina kunci cache boot yang menggabungkan versi global + versi pengguna.
 * Jika mana-mana versi berubah, kunci cache turut berubah → data dimuat semula.
 * @param {string} email
 * @return {string}
 */
function bootKey_(email) {
  const c = CacheService.getScriptCache();
  const vg = c.get('ver_global') || '0';
  const vu = c.get('ver_u_' + email.toLowerCase()) || '0';
  return 'boot_' + vg + '_' + vu + '_' + email;
}

/**
 * Pra-panaskan cache boot untuk pengguna.
 * Memuat data awal (program terdekat, notifikasi, memo terkini) ke CacheX.
 * @param {string} email
 * @param {string} role
 */
function warmupBoot_(email, role) {
  try {
    const key = bootKey_(email);
    const existing = CacheX.get(key);
    if (existing) return; // Sudah panas

    const bootData = _buildBootData(email, role);
    CacheX.put(key, bootData, 3600); // 1 jam
  } catch (e) {
    // Warmup gagal — tidak kritikal
  }
}

/**
 * Bina data boot untuk pengguna (digunakan oleh warmup dan endpoint boot).
 * @param {string} email
 * @param {string} role
 * @return {Object}
 */
function _buildBootData(email, role) {
  const now = new Date();

  // Program terdekat (7 hari akan datang)
  const programs = readSheet('Kalendar')
    .filter(p => {
      const d = new Date(p.Tarikh);
      return d >= now && d <= new Date(now.getTime() + 7 * 86400000) && p.Tajuk;
    })
    .sort((a, b) => new Date(a.Tarikh) - new Date(b.Tarikh))
    .slice(0, 5);

  // Notifikasi terkini (10 terbaharu)
  const notifs = readSheet('Notifikasi')
    .sort((a, b) => new Date(b.Masa) - new Date(a.Masa))
    .slice(0, 10);

  // Memo/minit terkini (5 terbaharu)
  const memos = readSheet('Memo_Minit')
    .sort((a, b) => new Date(b.Tarikh) - new Date(a.Tarikh))
    .slice(0, 5);

  // RSVP menunggu untuk pengguna ini
  const myRsvpPending = readSheet('RSVP')
    .filter(r => String(r.Email).toLowerCase() === email.toLowerCase() && r.Status === 'Menunggu');

  const data = {
    programs: programs,
    notifications: notifs,
    memos: memos,
    myPendingRsvp: myRsvpPending,
    stats: {
      programsMingguIni: programs.length,
      rsvpMenunggu: myRsvpPending.length,
      memoBaharu: memos.filter(m => {
        const d = new Date(m.Tarikh);
        return (now - d) < 7 * 86400000;
      }).length
    }
  };

  // Statistik tambahan untuk Admin
  if (role === 'Admin') {
    data.adminStats = {
      jumlahGuru: readSheet('Users').filter(u => u.Status === 'Aktif').length,
      jumlahSekolah: readSheet('Sekolah').filter(s => s.Status === 'Aktif').length,
      permohonanMenunggu: readSheet('Permohonan').filter(p => p.Status === 'Menunggu').length
    };
  }

  return data;
}

// ============================================
// INVALIDASI CACHE PINTAR
// ============================================

/** Batal cache global (selepas perubahan program/memo/notifikasi). */
function bumpGlobal_() {
  bump('global');
}

/** Batal cache program/kalendar. */
function bumpProgram_() {
  bump('program');
  bumpGlobal_();
}

/** Batal cache memo/dokumen. */
function bumpMemo_() {
  bump('memo');
  bumpGlobal_();
}

/** Batal cache notifikasi. */
function bumpNotif_() {
  bump('notif');
  bumpGlobal_();
}
