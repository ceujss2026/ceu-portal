// ============================================
// CEU Portal v1.1 — Migrasi.gs
// Modul Migrasi & Sinkronisasi Database
// Berdasarkan Prinsip gas-migrasi-database
// Baca batch berbasis header, upsert idempoten, dry-run & delta-sync
// ============================================

/**
 * Buka spreadsheet sumber (lama) dengan selamat.
 * Spreadsheet lama hanya DIBACA, tidak pernah ditulis.
 * @param {string} idOrUrl - ID atau URL spreadsheet sumber.
 * @return {Spreadsheet}
 */
function openSource_(idOrUrl) {
  const m = String(idOrUrl).match(/\/d\/([A-Za-z0-9_-]{20,})/);
  const id = m ? m[1] : String(idOrUrl).trim();
  const currentSs = getSpreadsheet();
  if (currentSs && id === currentSs.getId()) {
    throw new Error('Spreadsheet yang dimasukkan adalah spreadsheet aplikasi baru. Masukkan ID spreadsheet LAMA.');
  }
  try {
    return SpreadsheetApp.openById(id);
  } catch (e) {
    throw new Error('Spreadsheet tidak dapat dibuka. Pastikan ID betul dan berada di akaun Google yang sama.');
  }
}

/**
 * Baca helaian sumber dan tukar baris ke array objek berasaskan header.
 * @param {Spreadsheet} ss - Objek spreadsheet sumber.
 * @param {string} name - Nama helaian.
 * @return {Array<Object>|null}
 */
function readSource_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) return null;
  const v = sh.getDataRange().getValues();
  if (v.length <= 1) return [];
  const h = v[0].map(String);
  return v.slice(1).filter(r => r.join('') !== '')
    .map(r => {
      const o = {};
      h.forEach((k, i) => { if (k) o[k] = r[i]; });
      return o;
    });
}

/**
 * Laksanakan pelan upsert idempoten secara batch di memori.
 * @param {Object} plan - Konfigurasi: target sheet, rows, key function, updatable fields.
 * @param {boolean} dryRun - Jika true, hanya kiraan statistik tanpa menulis ke Sheets.
 * @return {Object} { inserted, updated, skipped }
 */
function upsertPlan_(plan, dryRun) {
  const ss = getSpreadsheet();
  const sh = ss.getSheetByName(plan.target);
  if (!sh) throw new Error('Helaian sasaran ' + plan.target + ' tidak ditemui.');

  const values = sh.getDataRange().getValues();
  const h = values[0].map(String);
  const index = {};

  // Indeks baris sedia ada mengikut kunci unik
  for (let r = 1; r < values.length; r++) {
    const o = {};
    h.forEach((k, i) => o[k] = values[r][i]);
    const k = plan.key(o);
    if (k) index[k] = r;
  }

  const res = { inserted: 0, updated: 0, skipped: 0 };
  const newRows = [];
  const seen = {};

  plan.rows.forEach(src => {
    const k = plan.key(src);
    if (!k || seen[k]) { res.skipped++; return; }
    seen[k] = true;

    if (index[k] !== undefined) {
      // Baris sudah wujud — semak jika ada perubahan pada kolom yang dibenarkan
      const row = values[index[k]];
      let changed = false;
      (plan.updatable || []).forEach(col => {
        const colIdx = h.indexOf(col);
        if (colIdx !== -1 && src[col] !== undefined && String(src[col]) !== String(row[colIdx])) {
          row[colIdx] = src[col];
          changed = true;
        }
      });
      if (changed) res.updated++; else res.skipped++;
    } else {
      // Baris baharu — bina baris mengikut susunan header target
      const newRow = h.map(col => src[col] !== undefined ? src[col] : '');
      newRows.push(newRow);
      res.inserted++;
    }
  });

  if (!dryRun) {
    // Tulis kemaskini dalam batch
    if (res.updated > 0) {
      sh.getDataRange().setValues(values);
    }
    // Tambah baris baharu dalam satu panggilan setValues
    if (newRows.length > 0) {
      const startRow = sh.getLastRow() + 1;
      sh.getRange(startRow, 1, newRows.length, h.length).setValues(newRows);
    }
  }

  return res;
}

/**
 * Fungsi Pindai (Dry-Run) Migrasi.
 * Menjalankan simulasi penuh tanpa mengubah sebarang data di spreadsheet sasaran.
 * @param {string} sourceId - ID spreadsheet lama.
 * @return {Object} Laporan ringkasan pindaan.
 */
function pindaiMigrasi(sourceId) {
  return _laksanaMigrasi(sourceId, true);
}

/**
 * Fungsi Eksekusi Sebenar Migrasi (Cutover / Delta-sync).
 * Memindahkan dan mengemas kini data ke spreadsheet CEU Portal.
 * @param {string} sourceId - ID spreadsheet lama.
 * @return {Object} Laporan hasil migrasi.
 */
function jalankanMigrasi(sourceId) {
  return _laksanaMigrasi(sourceId, false);
}

/**
 * Logik teras migrasi pelbagai helaian: Guru, Sekolah, Program, Dokumen
 */
function _laksanaMigrasi(sourceId, dryRun) {
  const ssLama = openSource_(sourceId);
  const laporan = {
    mod: dryRun ? 'SIMULASI (DRY-RUN)' : 'EKSEKUSI SEBENAR',
    tarikh: new Date().toISOString(),
    hasil: {}
  };

  // 1. Migrasi Data Sekolah
  const rowsSekolah = readSource_(ssLama, 'Sekolah');
  if (rowsSekolah) {
    laporan.hasil.Sekolah = upsertPlan_({
      target: 'Sekolah',
      rows: rowsSekolah,
      key: r => String(r.kod_sekolah || r.Kod || r.ID || '').trim().toUpperCase(),
      updatable: ['nama_sekolah', 'daerah', 'kluster', 'telefon', 'emel']
    }, dryRun);
  }

  // 2. Migrasi Data Guru
  const rowsGuru = readSource_(ssLama, 'Guru');
  if (rowsGuru) {
    laporan.hasil.Guru = upsertPlan_({
      target: 'Guru',
      rows: rowsGuru,
      key: r => String(r.email || r.Emel || '').trim().toLowerCase(),
      updatable: ['nama', 'sekolah', 'daerah', 'telefon', 'peranan', 'status']
    }, dryRun);
  }

  // 3. Migrasi Program / Kalendar
  const rowsProg = readSource_(ssLama, 'Program') || readSource_(ssLama, 'Kalendar');
  if (rowsProg) {
    laporan.hasil.Program = upsertPlan_({
      target: 'Program',
      rows: rowsProg,
      key: r => String(r.id || r.kod_program || r.ID || '').trim(),
      updatable: ['nama_program', 'tarikh_mula', 'masa_mula', 'lokasi', 'penerangan', 'status']
    }, dryRun);
  }

  // 4. Migrasi Memo & Dokumen
  const rowsDocs = readSource_(ssLama, 'Dokumen') || readSource_(ssLama, 'Memo_Minit');
  if (rowsDocs) {
    laporan.hasil.Dokumen = upsertPlan_({
      target: 'Dokumen',
      rows: rowsDocs,
      key: r => String(r.no_rujukan || r.id || r.ID || '').trim(),
      updatable: ['tajuk', 'kategori', 'drive_link', 'tarikh', 'status']
    }, dryRun);
  }

  // Invalidate cache jika bukan dryRun
  if (!dryRun) {
    bumpGlobal_();
  }

  Logger.log('=== LAPORAN MIGRASI ===\n' + JSON.stringify(laporan, null, 2));
  return laporan;
}
