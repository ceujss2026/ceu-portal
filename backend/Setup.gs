// ============================================
// CEU Portal v1.1 — Setup.gs
// Penyediaan Persekitaran Automatik (Idempoten)
// Selamat dijalankan berulang kali (R10)
// ============================================

/**
 * 🚀 JALANKAN FUNGSI INI SEKALI di Google Apps Script Editor.
 * Cipta Spreadsheet database, folder Drive, dan Script Properties.
 * Bersifat idempoten — tidak akan menimpa data atau rahsia sedia ada.
 */
function setupAppEnvironment() {
  Logger.log('🚀 Memulakan penyediaan persekitaran ' + APP_NAME + ' v1.1...');

  // --- 1. Cipta Spreadsheet jika belum wujud ---
  let ssId = prop_('SPREADSHEET_ID');
  let ss;

  if (ssId) {
    try {
      ss = SpreadsheetApp.openById(ssId);
      Logger.log('📊 Spreadsheet sedia ada ditemui: ' + ss.getUrl());
    } catch (e) {
      Logger.log('⚠️ Spreadsheet lama tidak dapat dibuka. Mencipta baharu...');
      ssId = '';
    }
  }

  if (!ssId) {
    ss = SpreadsheetApp.create('🗃️ Database — CEU Portal v1.1');
    ssId = ss.getId();
    setProp_('SPREADSHEET_ID', ssId);
    Logger.log('✅ Spreadsheet baharu dicipta: ' + ss.getUrl());
  }

  // --- 2. Cipta semua helaian (sheet) ---
  const sheets = {
    'Program': ['ID', 'Nama', 'Kategori', 'Tarikh', 'TarikhTamat', 'Masa', 'Lokasi', 'Sasaran', 'Keterangan', 'Status'],
    'Kalendar': ['ID', 'Tajuk', 'Jenis', 'Tarikh', 'MasaMula', 'MasaTamat', 'Lokasi', 'Keterangan', 'Sasaran', 'RSVP', 'CalEventId'],
    'RSVP': ['ID', 'AcaraID', 'Email', 'Nama', 'Sekolah', 'Status', 'Catatan', 'Masa'],
    'Memo_Minit': ['ID', 'Jenis', 'Tajuk', 'NoRujukan', 'Tarikh', 'Kategori', 'Pautan', 'Ringkasan'],
    'Dokumen': ['ID', 'Jenis', 'Tajuk', 'Tahun', 'Format', 'Pautan'],
    'Sekolah': ['ID', 'Nama', 'Kod', 'Daerah', 'Kluster', 'Status'],
    'Guru': ['ID', 'Nama', 'Jawatan', 'Email', 'Sekolah', 'Daerah', 'Status'],
    'Users': ['Email', 'Nama', 'Peranan', 'Sekolah', 'Daerah', 'Status'],
    'Permohonan': ['ID', 'Nama', 'Email', 'Sekolah', 'Jawatan', 'Masa', 'Status'],
    'Notifikasi': ['ID', 'Tajuk', 'Kategori', 'Keutamaan', 'Mesej', 'SasaranJenis', 'SasaranData', 'Saluran', 'Penghantar', 'Masa', 'Ref'],
    'Log': ['Masa', 'Email', 'Tindakan', 'Butiran']
  };

  // Padam sheet lalai "Sheet1" jika masih wujud dan tiada data
  const sheet1 = ss.getSheetByName('Sheet1');
  
  Object.keys(sheets).forEach(name => {
    let sh = ss.getSheetByName(name);
    if (!sh) {
      sh = ss.insertSheet(name);
      sh.appendRow(sheets[name]);
      // Format header: tebal, latar kelabu
      sh.getRange(1, 1, 1, sheets[name].length)
        .setFontWeight('bold')
        .setBackground('#f1f5f9');
      Logger.log('  📋 Sheet "' + name + '" dicipta (' + sheets[name].length + ' lajur)');
    } else {
      Logger.log('  ✓ Sheet "' + name + '" sudah wujud.');
    }
  });

  // Padam Sheet1 kosong selepas sheet lain dicipta
  if (sheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(sheet1); } catch (e) { /* abaikan */ }
  }

  // --- 3. Cipta folder Google Drive ---
  let rootFolderId = prop_('ROOT_FOLDER_ID');
  let rootFolder;

  if (rootFolderId) {
    try {
      rootFolder = DriveApp.getFolderById(rootFolderId);
      Logger.log('📁 Folder root sedia ada: ' + rootFolder.getName());
    } catch (e) {
      rootFolderId = '';
    }
  }

  if (!rootFolderId) {
    rootFolder = DriveApp.createFolder('📁 CEU_Portal_Files');
    rootFolderId = rootFolder.getId();
    setProp_('ROOT_FOLDER_ID', rootFolderId);
    Logger.log('✅ Folder root Drive dicipta.');

    // Pindahkan Spreadsheet ke folder root
    DriveApp.getFileById(ssId).moveTo(rootFolder);
  }

  // Subfolder: Memo & Minit
  if (!prop_('FOLDER_MEMO')) {
    const folderMemo = rootFolder.createFolder('📂 Memo_dan_Minit');
    setProp_('FOLDER_MEMO', folderMemo.getId());
    Logger.log('  📂 Subfolder Memo_dan_Minit dicipta.');
  }

  // Subfolder: Dokumen Tahunan
  if (!prop_('FOLDER_DOKUMEN')) {
    const folderDok = rootFolder.createFolder('📂 Dokumen_Tahunan');
    setProp_('FOLDER_DOKUMEN', folderDok.getId());
    Logger.log('  📂 Subfolder Dokumen_Tahunan dicipta.');
  }

  // --- 4. Bangkitkan rahsia (R3, R10) ---
  setupRahasia_();

  // --- 5. Masukkan data pentadbir sampel ---
  const users = readSheet('Users');
  const adminExist = users.some(u => u.Peranan === 'Admin');
  if (!adminExist) {
    appendToSheet('Users', {
      Email: 'admin.upk@moe.bn',
      Nama: 'Pegawai Pentadbir UPK',
      Peranan: 'Admin',
      Sekolah: 'Jabatan Sekolah-Sekolah',
      Daerah: 'Brunei-Muara',
      Status: 'Aktif'
    });
    Logger.log('👤 Pengguna Admin sampel ditambah: admin.upk@moe.bn');
  }

  // --- 6. Masukkan data sekolah sampel ---
  const sekolah = readSheet('Sekolah');
  if (sekolah.length === 0) {
    const sekolahSampel = [
      { ID: 'SCH001', Nama: 'SMK Bandar Seri Begawan', Kod: 'BMB2001', Daerah: 'Brunei-Muara', Kluster: 'Kluster 1', Status: 'Aktif' },
      { ID: 'SCH002', Nama: 'SM Sayyidina Husen', Kod: 'BMB2002', Daerah: 'Brunei-Muara', Kluster: 'Kluster 1', Status: 'Aktif' },
      { ID: 'SCH003', Nama: 'SM Pengiran Anak Puteri Hajah Rashidah', Kod: 'TUT2001', Daerah: 'Tutong', Kluster: 'Kluster 3', Status: 'Aktif' },
      { ID: 'SCH004', Nama: 'SM Belait', Kod: 'BEL2001', Daerah: 'Belait', Kluster: 'Kluster 5', Status: 'Aktif' },
      { ID: 'SCH005', Nama: 'SM Temburong', Kod: 'TEM2001', Daerah: 'Temburong', Kluster: 'Kluster 6', Status: 'Aktif' }
    ];
    sekolahSampel.forEach(s => appendToSheet('Sekolah', s));
    Logger.log('🏫 ' + sekolahSampel.length + ' sekolah sampel ditambah.');
  }

  // --- 7. Masukkan program sampel ---
  const programs = readSheet('Kalendar');
  if (programs.length === 0) {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 86400000);
    const nextMonth = new Date(now.getTime() + 30 * 86400000);
    const programSampel = [
      {
        ID: 'EVT001',
        Tajuk: 'Bengkel Bimbingan Kerjaya Sekolah Menengah Siri 1/2026',
        Jenis: 'Bengkel',
        Tarikh: nextWeek.toISOString().split('T')[0],
        MasaMula: '08:30',
        MasaTamat: '12:30',
        Lokasi: 'Dewan Serbaguna JSS',
        Keterangan: 'Bengkel bimbingan kerjaya untuk guru-guru kaunseling kerjaya sekolah menengah.',
        Sasaran: 'Semua Guru Menengah',
        RSVP: 'Ya',
        CalEventId: ''
      },
      {
        ID: 'EVT002',
        Tajuk: 'Taklimat Biasiswa Luar Negara 2026',
        Jenis: 'Taklimat',
        Tarikh: nextWeek.toISOString().split('T')[0],
        MasaMula: '14:00',
        MasaTamat: '16:00',
        Lokasi: 'Google Meet',
        Keterangan: 'Penerangan mengenai peluang biasiswa luar negara bagi pelajar tingkatan enam.',
        Sasaran: 'Semua Guru',
        RSVP: 'Ya',
        CalEventId: ''
      },
      {
        ID: 'EVT003',
        Tajuk: 'Mesyuarat Penyelarasan Pendidikan Kerjaya Bil. 3/2026',
        Jenis: 'Mesyuarat',
        Tarikh: nextMonth.toISOString().split('T')[0],
        MasaMula: '09:00',
        MasaTamat: '12:00',
        Lokasi: 'Bilik Gerakan UPK',
        Keterangan: 'Mesyuarat penyelarasan suku tahun terakhir untuk semua guru kaunseling kerjaya.',
        Sasaran: 'Semua Guru',
        RSVP: 'Ya',
        CalEventId: ''
      }
    ];
    programSampel.forEach(p => appendToSheet('Kalendar', p));
    Logger.log('📅 ' + programSampel.length + ' program sampel ditambah.');
  }

  // --- 8. Masukkan memo sampel ---
  const memos = readSheet('Memo_Minit');
  if (memos.length === 0) {
    const memoSampel = [
      {
        ID: 'MEM001',
        Jenis: 'Memo Rasmi',
        Tajuk: 'Pelaksanaan Program Pameran Kerjaya Peringkat Kebangsaan 2026',
        NoRujukan: 'UPK/JSS/04/2026',
        Tarikh: new Date().toISOString().split('T')[0],
        Kategori: 'Pentadbiran',
        Pautan: 'https://drive.google.com/file/d/SAMPLE/view',
        Ringkasan: 'Pemberitahuan kepada semua guru kaunseling kerjaya mengenai jadual taklimat dan format laporan.'
      },
      {
        ID: 'MEM002',
        Jenis: 'Minit Mesyuarat',
        Tajuk: 'Minit Mesyuarat Penyelarasan Kerjaya Bil. 2/2026',
        NoRujukan: 'MINIT-02/2026',
        Tarikh: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
        Kategori: 'Mesyuarat',
        Pautan: 'https://drive.google.com/file/d/SAMPLE2/view',
        Ringkasan: 'Minit mesyuarat penyelarasan suku tahun ketiga bersama semua guru kaunseling.'
      }
    ];
    memoSampel.forEach(m => appendToSheet('Memo_Minit', m));
    Logger.log('📄 ' + memoSampel.length + ' memo sampel ditambah.');
  }

  Logger.log('');
  Logger.log('═══════════════════════════════════════════');
  Logger.log('✅ PENYEDIAAN PERSEKITARAN CEU PORTAL SELESAI!');
  Logger.log('═══════════════════════════════════════════');
  Logger.log('📊 Spreadsheet : ' + ss.getUrl());
  Logger.log('📁 Folder Drive: https://drive.google.com/drive/folders/' + rootFolderId);
  Logger.log('');
  Logger.log('Langkah seterusnya:');
  Logger.log('1. Deploy Web App: Manage deployments → New deployment → Web app');
  Logger.log('2. Execute as: Me | Who has access: Anyone');
  Logger.log('3. Salin URL /exec ke frontend js/config.js');
}

// ============================================
// BANGKITKAN RAHSIA AUTOMATIK (R3, R10)
// ============================================

/** Bangkitkan rahsia dalaman jika belum wujud. Idempoten. */
function setupRahasia_() {
  // SESSION_SECRET
  secret_();
  Logger.log('🔑 SESSION_SECRET: ' + (prop_('SESSION_SECRET') ? 'Sedia ada ✓' : 'Baharu dijana'));

  // Akses Darurat
  if (!prop_('EMERGENCY_PASS_HASH')) {
    const sandi = sandiAcak_(16);
    const salt = Utilities.getUuid();
    setProps_({
      EMERGENCY_USER: 'darurat',
      EMERGENCY_SALT: salt,
      EMERGENCY_PASS_HASH: hashPass_(sandi, salt)
    });
    Logger.log('');
    Logger.log('🔐 ═══════════════════════════════════════');
    Logger.log('🔐 AKSES DARURAT (Catat sekarang — hanya tampil sekali):');
    Logger.log('🔐   Username : darurat');
    Logger.log('🔐   Password : ' + sandi);
    Logger.log('🔐 ═══════════════════════════════════════');
  } else {
    Logger.log('🔐 Akses darurat: Sedia ada ✓ (tidak ditimpa)');
  }
}

/** Reset akses darurat — jana kata laluan baharu. */
function resetAksesDarurat() {
  const p = sandiAcak_(16);
  const salt = Utilities.getUuid();
  setProps_({
    EMERGENCY_USER: 'darurat',
    EMERGENCY_SALT: salt,
    EMERGENCY_PASS_HASH: hashPass_(p, salt)
  });
  delProp_('DARURAT_KUNCI_SAMPAI');
  revokeAll_('darurat');
  Logger.log('🔐 Akses darurat baru direset: darurat / ' + p);
}
