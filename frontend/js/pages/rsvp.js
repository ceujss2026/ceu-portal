// ============================================
// CEU Portal v1.1 — pages/rsvp.js
// W-04: Pengesahan Kehadiran (RSVP) Guru
// Borang Interaktif, Pengurusan Status & Sejarah
// ============================================

window.renderRsvpPage = async function(container) {
  window._rsvpState = window._rsvpState || {
    filter: 'pending', // 'pending' | 'confirmed' | 'archive'
    programs: [],
    myRsvps: [],
    selectedStatus: 'hadir',
    featuredProgramId: null
  };

  const state = window._rsvpState;

  // Render rangka awal
  container.innerHTML = _buildRsvpShell(state);
  _renderRsvpDynamicContent(state);

  // Ambil data program dan rekod RSVP pengguna
  try {
    const [progRes, rsvpRes] = await Promise.all([
      apiGet('getCalendar', {}),
      apiGet('getMyRsvp', {})
    ]);

    if (progRes && progRes.success) {
      state.programs = progRes.events || progRes.programs || [];
    }
    if (rsvpRes && rsvpRes.success) {
      state.myRsvps = rsvpRes.rsvps || [];
    }

    _renderRsvpDynamicContent(state);
  } catch (err) {
    console.warn('Gagal memuatkan data RSVP:', err);
  }
};

function _buildRsvpShell(state) {
  return `
    <div class="flex flex-col w-full px-4 sm:px-6 pb-24 gap-4 max-w-3xl mx-auto">
      
      <!-- Top Title & Sync Info -->
      <div class="pt-2 flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary">
              <span class="material-symbols-outlined text-[18px]">event_available</span>
            </span>
            <span class="text-label-sm text-primary font-bold tracking-wide uppercase">Tindakan Pengesahan</span>
          </div>
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-secondary shadow-xs">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span class="text-[11px] text-secondary font-semibold">Auto-Sync UPK</span>
          </div>
        </div>
        <h1 class="font-headline text-headline-md text-on-surface font-bold tracking-tight">
          Pengesahan Kehadiran (RSVP)
        </h1>
        <p class="text-body-sm text-secondary">
          Sila sahkan kehadiran anda bagi memastikan peruntukan logistik, tempat duduk dan dokumentasi rasmi dikemas kini.
        </p>
      </div>

      <!-- Filter Segmented Tabs -->
      <div class="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl overflow-x-auto no-scrollbar shadow-xs">
        <button onclick="rsvpSetFilter('pending')" 
          class="rsvp-tab-btn flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg ${state.filter === 'pending' ? 'bg-primary-container text-on-primary font-bold shadow-xs' : 'text-secondary hover:text-on-surface'} transition-all text-label-sm">
          <span class="material-symbols-outlined text-[16px]">pending_actions</span>
          <span>Menunggu Respon</span>
          <span id="rsvp-pending-count" class="ml-0.5 px-1.5 py-0.2 rounded-full ${state.filter === 'pending' ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'} text-[10px] font-bold">...</span>
        </button>

        <button onclick="rsvpSetFilter('confirmed')" 
          class="rsvp-tab-btn flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg ${state.filter === 'confirmed' ? 'bg-primary-container text-on-primary font-bold shadow-xs' : 'text-secondary hover:text-on-surface'} transition-all text-label-sm">
          <span class="material-symbols-outlined text-[16px]">verified</span>
          <span>Telah Disahkan</span>
          <span id="rsvp-confirmed-count" class="ml-0.5 px-1.5 py-0.2 rounded-full ${state.filter === 'confirmed' ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'} text-[10px] font-bold">...</span>
        </button>

        <button onclick="rsvpSetFilter('archive')" 
          class="rsvp-tab-btn flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg ${state.filter === 'archive' ? 'bg-primary-container text-on-primary font-bold shadow-xs' : 'text-secondary hover:text-on-surface'} transition-all text-label-sm">
          <span class="material-symbols-outlined text-[16px]">archive</span>
          <span>Arkib Program Selesai</span>
        </button>
      </div>

      <!-- Dynamic Content Area -->
      <div id="rsvp-dynamic-container" class="flex flex-col gap-4">
        <!-- Injected by _renderRsvpDynamicContent() -->
      </div>

    </div>
  `;
}

function _renderRsvpDynamicContent(state) {
  const container = document.getElementById('rsvp-dynamic-container');
  if (!container) return;

  // Petakan RSVP pengguna mengikut program_id
  const rsvpMap = {};
  (state.myRsvps || []).forEach(r => {
    rsvpMap[r.program_id] = r;
  });

  const now = new Date();
  
  // Asingkan program
  const pendingProgs = [];
  const confirmedProgs = [];
  const archiveProgs = [];

  (state.programs || []).forEach(prog => {
    const progId = prog.id || prog.kod_program;
    const rsvpRecord = rsvpMap[progId];
    const pDate = new Date(prog.tarikh_mula || prog.tarikh || now);

    if (pDate < now && (!rsvpRecord || rsvpRecord.status)) {
      archiveProgs.push({ ...prog, rsvp: rsvpRecord });
    } else if (rsvpRecord && rsvpRecord.status && rsvpRecord.status !== 'menunggu') {
      confirmedProgs.push({ ...prog, rsvp: rsvpRecord });
    } else {
      pendingProgs.push({ ...prog, rsvp: rsvpRecord });
    }
  });

  // Kemas kini kaunter tab
  const pendingEl = document.getElementById('rsvp-pending-count');
  if (pendingEl) pendingEl.textContent = pendingProgs.length;
  const confirmedEl = document.getElementById('rsvp-confirmed-count');
  if (confirmedEl) confirmedEl.textContent = confirmedProgs.length;

  if (state.filter === 'pending') {
    if (pendingProgs.length === 0) {
      container.innerHTML = `
        <div class="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/20">
          <div class="w-14 h-14 mx-auto mb-2 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-[28px]">task_alt</span>
          </div>
          <h3 class="font-headline text-headline-md text-on-surface font-semibold">Semua RSVP Selesai!</h3>
          <p class="text-body-md text-secondary mt-1">Tiada program tertunggak yang memerlukan maklum balas anda pada masa ini.</p>
        </div>
      `;
    } else {
      // Featured pending card untuk program pertama
      const featured = pendingProgs[0];
      state.featuredProgramId = featured.id || featured.kod_program;
      container.innerHTML = _buildInteractiveRsvpForm(featured, state) + 
        (pendingProgs.length > 1 ? _buildOtherPendingList(pendingProgs.slice(1)) : '');
    }
  } else if (state.filter === 'confirmed') {
    if (confirmedProgs.length === 0) {
      container.innerHTML = `
        <div class="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/20">
          <p class="text-body-md text-secondary">Tiada rekod RSVP yang telah disahkan lagi.</p>
        </div>
      `;
    } else {
      container.innerHTML = confirmedProgs.map(p => _buildConfirmedCard(p)).join('');
    }
  } else {
    // Archive
    if (archiveProgs.length === 0) {
      container.innerHTML = `
        <div class="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/20">
          <p class="text-body-md text-secondary">Tiada arkib program terdahulu.</p>
        </div>
      `;
    } else {
      container.innerHTML = archiveProgs.map(p => _buildArchiveCard(p)).join('');
    }
  }
}

/**
 * Borang Interaktif RSVP untuk program terpilih
 */
function _buildInteractiveRsvpForm(prog, state) {
  const progId = prog.id || prog.kod_program;
  const tajuk = escapeHtml(prog.nama_program || prog.tajuk || 'Mesyuarat Penyelarasan Kerjaya');
  const lokasi = escapeHtml(prog.lokasi || 'Dewan Serbaguna JSS');
  const tarikhStr = formatDate(prog.tarikh_mula || prog.tarikh, 'full');
  const masaStr = prog.masa_mula ? `${formatTime(prog.masa_mula)} - ${formatTime(prog.masa_tamat || '12:00')}` : '09:00 Pagi';

  return `
    <div class="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-outline-variant/20 flex flex-col gap-4">
      
      <!-- Card Header -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm text-[11px] font-bold">
            <span class="material-symbols-outlined text-[14px]">priority_high</span>
            <span>Tindakan Diperlukan</span>
          </span>
          <span class="text-body-sm text-[11px] text-secondary font-mono">ID: ${escapeHtml(progId)}</span>
        </div>
        <h2 class="font-headline text-headline-md text-on-surface font-bold leading-snug mt-1">
          ${tajuk}
        </h2>
        <div class="flex items-center gap-1.5 text-secondary text-body-sm">
          <span class="material-symbols-outlined text-[16px] text-primary">account_balance</span>
          <span>Unit Pendidikan Kerjaya (UPK), JSS</span>
        </div>
      </div>

      <!-- Visual Metadata Banner -->
      <div class="p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-2">
        <div class="flex items-center gap-2 text-on-surface text-body-md font-semibold">
          <span class="material-symbols-outlined text-[18px] text-primary">calendar_clock</span>
          <span>${tarikhStr} • ${masaStr}</span>
        </div>
        <div class="flex items-center gap-2 text-secondary text-body-md">
          <span class="material-symbols-outlined text-[18px] text-error">pin_drop</span>
          <span class="truncate">${lokasi}</span>
        </div>
      </div>

      <!-- Borang Pilihan Status Kehadiran -->
      <form id="rsvp-main-form" onsubmit="event.preventDefault(); window.submitRsvpForm('${progId}');" class="flex flex-col gap-3">
        <label class="text-label-md font-semibold text-on-surface flex items-center justify-between">
          <span>Pilihan Status Kehadiran</span>
          <span class="text-label-sm text-primary text-[11px] font-semibold">*Wajib dipilih</span>
        </label>

        <!-- Option 1: Hadir -->
        <label onclick="rsvpSelectOption('hadir')" 
          class="rsvp-opt-item flex items-start gap-3 p-3.5 rounded-xl cursor-pointer border-2 ${state.selectedStatus === 'hadir' ? 'border-primary bg-primary-fixed/20 shadow-xs' : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'} transition-all">
          <input type="radio" name="rsvp_status" value="hadir" class="hidden" ${state.selectedStatus === 'hadir' ? 'checked' : ''}>
          <div class="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${state.selectedStatus === 'hadir' ? 'bg-primary text-white' : 'bg-surface-container-high text-transparent'}">
            <span class="material-symbols-outlined text-[14px]">check</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-label-md font-bold text-on-surface">Hadir Sendiri Secara Bersemuka</span>
            <span class="text-body-sm text-secondary text-[12px]">Pek taklimat rasmi, sijil kehadiran dan jamuan disediakan</span>
          </div>
        </label>

        <!-- Option 2: Tidak Hadir -->
        <label onclick="rsvpSelectOption('tidak')" 
          class="rsvp-opt-item flex items-start gap-3 p-3.5 rounded-xl cursor-pointer border-2 ${state.selectedStatus === 'tidak' ? 'border-error bg-error-container/20 shadow-xs' : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'} transition-all">
          <input type="radio" name="rsvp_status" value="tidak" class="hidden" ${state.selectedStatus === 'tidak' ? 'checked' : ''}>
          <div class="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${state.selectedStatus === 'tidak' ? 'bg-error text-white' : 'bg-surface-container-high text-transparent'}">
            <span class="material-symbols-outlined text-[14px]">check</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-label-md font-bold text-on-surface">Tidak Dapat Hadir</span>
            <span class="text-body-sm text-secondary text-[12px]">Sertakan sebab pelepasan rasmi untuk rekod jabatan</span>
          </div>
        </label>

        <!-- Option 3: Wakil -->
        <label onclick="rsvpSelectOption('wakil')" 
          class="rsvp-opt-item flex items-start gap-3 p-3.5 rounded-xl cursor-pointer border-2 ${state.selectedStatus === 'wakil' ? 'border-tertiary-container bg-tertiary-fixed/20 shadow-xs' : 'border-outline-variant/30 bg-surface-container-low hover:bg-surface-container'} transition-all">
          <input type="radio" name="rsvp_status" value="wakil" class="hidden" ${state.selectedStatus === 'wakil' ? 'checked' : ''}>
          <div class="w-5 h-5 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 ${state.selectedStatus === 'wakil' ? 'bg-tertiary-container text-white' : 'bg-surface-container-high text-transparent'}">
            <span class="material-symbols-outlined text-[14px]">check</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-label-md font-bold text-on-surface">Mewakilkan Guru Kaunseling/Kerjaya Lain</span>
            <span class="text-body-sm text-secondary text-[12px]">Delegasikan kepada rakan sejawat dari sekolah yang sama</span>
          </div>
        </label>

        <!-- Kotak Catatan / Butiran Wakil Tambahan -->
        <div id="rsvp-extra-fields" class="flex flex-col gap-2 mt-1 ${state.selectedStatus === 'hadir' ? 'hidden' : ''}">
          <label for="rsvp-catatan" class="text-label-sm font-semibold text-on-surface">
            ${state.selectedStatus === 'wakil' ? 'Nama Penuh Guru Wakil & Nombor Telefon' : 'Sebab Pelepasan / Catatan Rasmi'}
          </label>
          <textarea id="rsvp-catatan" rows="2" 
            placeholder="${state.selectedStatus === 'wakil' ? 'Cth: Cikgu Nurul Huda (Talian: +673 8881234)' : 'Cth: Terlibat dengan Peperiksaan Awam / Cuti Sakit'}"
            class="w-full p-3 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 transition-all"></textarea>
        </div>

        <!-- Submit Button -->
        <div class="pt-2">
          <button type="submit" id="btn-submit-rsvp" 
            class="w-full h-12 rounded-xl bg-primary text-on-primary text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all btn-press">
            <span class="material-symbols-outlined text-[20px]">how_to_reg</span>
            <span>Hantar Pengesahan Kehadiran</span>
          </button>
        </div>
      </form>

    </div>
  `;
}

function _buildOtherPendingList(progs) {
  return `
    <div class="flex flex-col gap-2.5 mt-2">
      <h3 class="font-headline text-title-sm text-on-surface font-semibold">
        Program Lain Yang Perlu Pengesahan (${progs.length})
      </h3>
      ${progs.map(p => `
        <div class="bg-surface-container-lowest rounded-xl p-3.5 shadow-xs border border-outline-variant/20 flex items-center justify-between">
          <div class="flex flex-col min-w-0 pr-3">
            <span class="text-body-md font-semibold text-on-surface truncate">${escapeHtml(p.nama_program || p.tajuk)}</span>
            <span class="text-body-sm text-secondary">${formatDate(p.tarikh_mula || p.tarikh)}</span>
          </div>
          <button onclick="rsvpSelectProgram('${p.id || p.kod_program}')" class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-primary-container hover:text-white text-primary text-label-sm font-semibold transition-all">
            Pilih
          </button>
        </div>
      `).join('')}
    </div>
  `;
}

function _buildConfirmedCard(p) {
  const rsvp = p.rsvp || {};
  const status = (rsvp.status || 'hadir').toLowerCase();
  let badgeCls = 'bg-green-100 text-green-800';
  let statusText = 'Hadir Bersemuka';
  if (status === 'tidak') {
    badgeCls = 'bg-red-100 text-red-800';
    statusText = 'Tidak Hadir';
  } else if (status === 'wakil') {
    badgeCls = 'bg-amber-100 text-amber-800';
    statusText = `Wakil: ${rsvp.catatan || 'Guru Pengganti'}`;
  }

  return `
    <div class="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/20 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="px-2.5 py-0.5 rounded-full ${badgeCls} text-label-sm text-[11px] font-bold">
          ${statusText}
        </span>
        <span class="text-body-sm text-secondary font-medium">${formatDate(p.tarikh_mula || p.tarikh)}</span>
      </div>
      <h4 class="font-headline text-body-lg font-semibold text-on-surface">${escapeHtml(p.nama_program || p.tajuk)}</h4>
      <p class="text-body-sm text-secondary flex items-center gap-1">
        <span class="material-symbols-outlined text-[16px] text-error">location_on</span>
        <span>${escapeHtml(p.lokasi || 'UPK, JSS')}</span>
      </p>
      ${rsvp.catatan && status !== 'wakil' ? `<p class="text-body-sm text-secondary/80 italic mt-1 bg-surface-container-low p-2 rounded-lg">Catatan: "${escapeHtml(rsvp.catatan)}"</p>` : ''}
    </div>
  `;
}

function _buildArchiveCard(p) {
  return `
    <div class="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/20 opacity-75 flex flex-col gap-1.5">
      <div class="flex items-center justify-between">
        <span class="text-label-sm text-[11px] font-bold text-secondary uppercase">PROGRAM TELAH SELESAI</span>
        <span class="text-body-sm text-secondary">${formatDate(p.tarikh_mula || p.tarikh)}</span>
      </div>
      <h4 class="font-headline text-body-md font-semibold text-on-surface">${escapeHtml(p.nama_program || p.tajuk)}</h4>
      <span class="text-body-sm text-secondary">${escapeHtml(p.lokasi || '')}</span>
    </div>
  `;
}

// ============================================
// HANDLER FUNGSI INTERAKTIF
// ============================================
window.rsvpSetFilter = function(filter) {
  if (window._rsvpState) {
    window._rsvpState.filter = filter;
    _renderRsvpDynamicContent(window._rsvpState);
    const content = document.getElementById('app-content');
    if (content) window.renderRsvpPage(content);
  }
};

window.rsvpSelectOption = function(status) {
  if (!window._rsvpState) return;
  window._rsvpState.selectedStatus = status;
  
  // Kemas kini visual radio
  const items = document.querySelectorAll('.rsvp-opt-item');
  items.forEach(el => {
    const isThis = el.querySelector(`input[value="${status}"]`);
    if (isThis) {
      el.classList.add('border-primary', 'bg-primary-fixed/20');
      el.classList.remove('border-outline-variant/30', 'bg-surface-container-low');
    } else {
      el.classList.remove('border-primary', 'border-error', 'border-tertiary-container', 'bg-primary-fixed/20', 'bg-error-container/20', 'bg-tertiary-fixed/20');
      el.classList.add('border-outline-variant/30', 'bg-surface-container-low');
    }
  });

  // Tunjuk / sembunyikan kotak catatan
  const extra = document.getElementById('rsvp-extra-fields');
  if (extra) {
    if (status === 'hadir') {
      extra.classList.add('hidden');
    } else {
      extra.classList.remove('hidden');
      const label = extra.querySelector('label');
      const textarea = extra.querySelector('textarea');
      if (status === 'wakil') {
        if (label) label.textContent = 'Nama Penuh Guru Wakil & Nombor Telefon';
        if (textarea) textarea.placeholder = 'Cth: Cikgu Nurul Huda (Talian: +673 8881234)';
      } else {
        if (label) label.textContent = 'Sebab Pelepasan / Catatan Rasmi';
        if (textarea) textarea.placeholder = 'Cth: Terlibat dengan Peperiksaan Awam / Cuti Sakit';
      }
    }
  }
};

window.rsvpSelectProgram = function(progId) {
  if (!window._rsvpState) return;
  // Cari program dalam pending list
  const found = (window._rsvpState.programs || []).find(p => (p.id || p.kod_program) === progId);
  if (found) {
    // Alihkan ke tempat pertama
    window._rsvpState.programs = [found, ...window._rsvpState.programs.filter(p => (p.id || p.kod_program) !== progId)];
    _renderRsvpDynamicContent(window._rsvpState);
  }
};

window.submitRsvpForm = async function(progId) {
  const state = window._rsvpState;
  const status = state ? state.selectedStatus : 'hadir';
  const catatanEl = document.getElementById('rsvp-catatan');
  const catatan = catatanEl ? catatanEl.value.trim() : '';

  if (status !== 'hadir' && !catatan) {
    showToast(status === 'wakil' ? 'Sila nyatakan nama guru wakil.' : 'Sila nyatakan sebab pelepasan.', 'warning');
    if (catatanEl) catatanEl.focus();
    return;
  }

  const btn = document.getElementById('btn-submit-rsvp');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `
      <span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
      <span>Menyimpan Pengesahan...</span>
    `;
  }

  try {
    const res = await apiPost('submitRsvp', {
      program_id: progId,
      status: status,
      catatan: catatan
    });

    if (res && res.success) {
      showToast('Pengesahan RSVP berjaya disimpan!', 'success');
      // Muat semula data
      const content = document.getElementById('app-content');
      if (content) window.renderRsvpPage(content);
    } else {
      showToast(res.message || 'Gagal menyimpan RSVP.', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
          <span class="material-symbols-outlined text-[20px]">how_to_reg</span>
          <span>Hantar Pengesahan Kehadiran</span>
        `;
      }
    }
  } catch (err) {
    showToast('Ralat rangkaian. Sila cuba lagi.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `
        <span class="material-symbols-outlined text-[20px]">how_to_reg</span>
        <span>Hantar Pengesahan Kehadiran</span>
      `;
    }
  }
};
