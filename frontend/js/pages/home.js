// ============================================
// CEU Portal v1.1 — pages/home.js
// W-02: Dashboard Guru Kerjaya
// Paparan Utama, Ringkasan Status, RSVP Pantas
// ============================================

window.renderHomePage = async function(container) {
  const user = getCurrentUser() || {};
  const cacheKey = 'ceu_boot_cache';
  
  // Baca cache sedia ada untuk render serta-merta (Optimistic UI)
  let cachedData = null;
  try {
    const raw = localStorage.getItem(cacheKey);
    if (raw) cachedData = JSON.parse(raw);
  } catch (e) {}

  // Render rangka awal atau data cache
  container.innerHTML = _buildHomeSkeleton(user, cachedData);

  // Ambil data segar dari server melalui boot endpoint
  try {
    const res = await apiGet('boot');
    if (res && res.success) {
      localStorage.setItem(cacheKey, JSON.stringify(res));
      _renderHomeContent(container, user, res);
      
      // Kemas kini lencana notifikasi di header jika ada
      if (res.notif_unread !== undefined && window.renderTopBar) {
        window._unreadNotifCount = res.notif_unread;
        window.renderTopBar({ notifCount: res.notif_unread });
      }
    } else if (!cachedData) {
      _renderHomeFallback(container, user);
    }
  } catch (err) {
    if (!cachedData) {
      _renderHomeFallback(container, user);
    }
  }
};

function _buildHomeSkeleton(user, data) {
  if (data) {
    return _buildHomeHtml(user, data);
  }
  return `
    <div class="flex flex-col w-full px-4 sm:px-6 pb-24 gap-4 animate-pulse">
      <div class="h-10 bg-surface-container rounded-xl"></div>
      <div class="h-44 bg-surface-container rounded-2xl"></div>
      <div class="h-6 bg-surface-container rounded w-1/3"></div>
      <div class="h-48 bg-surface-container rounded-2xl"></div>
      <div class="h-6 bg-surface-container rounded w-1/4"></div>
      <div class="h-24 bg-surface-container rounded-xl"></div>
    </div>
  `;
}

function _renderHomeContent(container, user, data) {
  container.innerHTML = _buildHomeHtml(user, data);
  _bindHomeEvents(container, data);
}

function _renderHomeFallback(container, user) {
  const dummyData = {
    programs: [],
    memos: [],
    stats: { weekly_programs: 0, pending_rsvp: 0, new_memos: 0 }
  };
  container.innerHTML = _buildHomeHtml(user, dummyData);
  _bindHomeEvents(container, dummyData);
}

function _buildHomeHtml(user, data) {
  const userName = escapeHtml(user.nama || user.email || 'Guru Kerjaya');
  const userSchool = escapeHtml(user.sekolah || 'Sekolah Kerajaan');
  const userCluster = user.daerah ? `Kluster • ${escapeHtml(user.daerah)}` : 'Kluster 1 - 6';

  const stats = data.stats || {
    weekly_programs: (data.programs || []).length,
    pending_rsvp: (data.programs || []).filter(p => !p.my_rsvp || p.my_rsvp === 'menunggu').length,
    new_memos: (data.memos || []).length
  };

  // Program terdekat untuk kad RSVP
  const nextProgram = (data.programs && data.programs.length > 0) ? data.programs[0] : null;

  return `
    <div class="flex flex-col w-full px-4 sm:px-6 pb-24 gap-4 max-w-3xl mx-auto">
      
      <!-- 1. Fast Sync Status Notification Pill -->
      <div class="flex items-center justify-between px-4 py-2.5 bg-surface-container-low rounded-xl shadow-xs">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="relative flex h-2.5 w-2.5 flex-shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          <p class="text-label-sm font-semibold text-on-surface truncate">
            Penyegerakan Google Calendar Aktif
          </p>
        </div>
        <span class="text-body-sm text-secondary flex-shrink-0 ml-2">
          ${formatTime(new Date())}
        </span>
      </div>

      <!-- 2. Greeting Hero Card -->
      <section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container to-inverse-surface p-5 sm:p-6 text-on-primary shadow-md">
        <svg class="absolute -right-8 -top-8 w-44 h-44 text-on-primary-container opacity-10 pointer-events-none" fill="none" viewBox="0 0 160 160" xmlns="http://www.w3.org/2000/svg">
          <circle cx="80" cy="80" r="70" stroke="currentColor" stroke-dasharray="8 6" stroke-width="4"></circle>
          <circle cx="80" cy="80" r="45" stroke="currentColor" stroke-width="3"></circle>
          <circle cx="80" cy="80" r="20" stroke="currentColor" stroke-width="2"></circle>
        </svg>

        <div class="relative z-10 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white font-label-sm text-[11px] font-semibold uppercase tracking-wide">
              Sesi Persekolahan 2026
            </span>
            <span class="material-symbols-outlined text-[20px] text-tertiary-fixed opacity-90">verified</span>
          </div>

          <div class="flex flex-col mt-0.5">
            <h1 class="font-headline text-headline-md font-bold text-white tracking-tight">
              Selamat Kembali, ${userName}
            </h1>
            <p class="text-body-md text-white/80 flex items-center gap-1.5 mt-0.5">
              <span class="material-symbols-outlined text-[16px]">school</span>
              <span>${userSchool} • ${userCluster}</span>
            </p>
          </div>

          <!-- Quick Summary Chips -->
          <div class="flex items-center gap-2 mt-2 overflow-x-auto no-scrollbar py-1">
            <div onclick="navigateTo('calendar')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-white flex-shrink-0 text-label-sm font-medium cursor-pointer hover:bg-white/25 transition-all">
              <span class="material-symbols-outlined text-[16px]">event_note</span>
              <span>${stats.weekly_programs || 0} Program Sesi Ini</span>
            </div>
            <div onclick="navigateTo('rsvp')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary text-on-tertiary flex-shrink-0 text-label-sm font-semibold shadow-sm cursor-pointer hover:brightness-110 transition-all">
              <span class="material-symbols-outlined text-[16px] text-tertiary-fixed">notifications_active</span>
              <span>${stats.pending_rsvp || 0} Menunggu RSVP</span>
            </div>
            <div onclick="navigateTo('documents')" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed flex-shrink-0 text-label-sm font-semibold shadow-sm cursor-pointer hover:brightness-105 transition-all">
              <span class="material-symbols-outlined text-[16px]">mark_email_unread</span>
              <span>${stats.new_memos || 0} Memo Baharu</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Urgent / Actionable RSVP Section -->
      <section class="flex flex-col gap-2.5 mt-1">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[22px]">notification_important</span>
            <h2 class="font-headline text-title-sm text-on-surface font-semibold tracking-tight">
              Acara Akan Datang & RSVP Segera
            </h2>
          </div>
          <span class="text-label-sm font-bold text-error px-2 py-0.5 rounded-full bg-error-container">
            Tindakan Diperlukan
          </span>
        </div>

        ${nextProgram ? _buildFeaturedRsvpCard(nextProgram) : _buildEmptyRsvpCard()}
      </section>

      <!-- 4. Recent Circulars & Meeting Minutes Section -->
      <section class="flex flex-col gap-2.5 mt-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[22px]">folder_managed</span>
            <h2 class="font-headline text-title-sm text-on-surface font-semibold tracking-tight">
              Memo & Minit Mesyuarat Terkini
            </h2>
          </div>
          <button onclick="navigateTo('documents')" class="text-label-sm font-semibold text-primary flex items-center hover:underline">
            <span>Lihat Semua</span>
            <span class="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        <div class="flex flex-col gap-2.5">
          ${(data.memos && data.memos.length > 0)
            ? data.memos.slice(0, 3).map(m => _buildMemoCard(m)).join('')
            : _buildEmptyMemosCard()
          }
        </div>
      </section>

    </div>
  `;
}

function _buildFeaturedRsvpCard(prog) {
  const myStatus = prog.my_rsvp || 'menunggu';
  const progId = prog.id || prog.kod_program || 'PROG-01';
  const tarikhStr = formatDate(prog.tarikh_mula || prog.tarikh || new Date(), 'day');
  const masaStr = formatTime(prog.masa_mula || '08:30');

  let bannerClass = 'bg-tertiary-fixed text-on-tertiary-fixed';
  let bannerIcon = 'pending_actions';
  let bannerText = 'Menunggu Pengesahan Kehadiran';

  if (myStatus === 'hadir') {
    bannerClass = 'bg-green-100 text-green-900';
    bannerIcon = 'check_circle';
    bannerText = 'Anda telah mengesahkan: Hadir Sendiri';
  } else if (myStatus === 'tidak') {
    bannerClass = 'bg-red-100 text-red-900';
    bannerIcon = 'cancel';
    bannerText = 'Anda telah mengesahkan: Tidak Dapat Hadir';
  } else if (myStatus === 'wakil') {
    bannerClass = 'bg-amber-100 text-amber-900';
    bannerIcon = 'swap_horiz';
    bannerText = 'Anda telah mengesahkan: Mewakilkan Guru Lain';
  }

  return `
    <div class="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col gap-3.5 border border-outline-variant/30 transition-all">
      <div class="flex items-center justify-between flex-wrap gap-2">
        <span class="px-2.5 py-1 rounded-md bg-surface-container-high text-primary text-label-sm font-bold tracking-wide uppercase">
          ${escapeHtml(prog.kategori || 'PROGRAM KERJAYA')}
        </span>
        <div class="flex items-center gap-1 text-secondary text-label-sm">
          <span class="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
          <span>${tarikhStr} • ${masaStr}</span>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <h3 class="font-headline text-headline-md text-on-surface font-semibold leading-snug">
          ${escapeHtml(prog.nama_program || prog.tajuk || 'Bengkel Bimbingan Kerjaya')}
        </h3>
        <p class="text-body-md text-secondary flex items-center gap-1.5 mt-0.5">
          <span class="material-symbols-outlined text-[18px] text-error flex-shrink-0">location_on</span>
          <span class="truncate">${escapeHtml(prog.lokasi || 'Dewan Serbaguna JSS / Google Meet')}</span>
        </p>
      </div>

      <!-- Status Notice -->
      <div class="flex items-center gap-2.5 p-3 rounded-xl ${bannerClass} transition-colors" id="home-rsvp-banner">
        <span class="material-symbols-outlined text-[20px] flex-shrink-0">${bannerIcon}</span>
        <div class="flex flex-col min-w-0">
          <span class="text-label-sm font-bold leading-tight">Status RSVP Anda</span>
          <span class="text-body-sm leading-tight opacity-90">${bannerText}</span>
        </div>
      </div>

      <!-- 3-Button Instant RSVP Action Grid -->
      <div class="grid grid-cols-3 gap-2 pt-1" role="group">
        <button onclick="handleInstantRsvp('${progId}', 'hadir')" 
          class="min-h-[46px] rounded-xl ${myStatus === 'hadir' ? 'bg-primary text-on-primary font-bold shadow-sm' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'} text-label-md flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all btn-press">
          <span class="material-symbols-outlined text-[18px]">check_circle</span>
          <span>Hadir</span>
        </button>
        <button onclick="handleInstantRsvp('${progId}', 'tidak')" 
          class="min-h-[46px] rounded-xl ${myStatus === 'tidak' ? 'bg-error text-on-error font-bold shadow-sm' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'} text-label-md flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all btn-press">
          <span class="material-symbols-outlined text-[18px]">cancel</span>
          <span>Tidak</span>
        </button>
        <button onclick="handleInstantRsvp('${progId}', 'wakil')" 
          class="min-h-[46px] rounded-xl ${myStatus === 'wakil' ? 'bg-tertiary-container text-on-tertiary-container font-bold shadow-sm' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'} text-label-md flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all btn-press">
          <span class="material-symbols-outlined text-[18px]">swap_horiz</span>
          <span>Wakil</span>
        </button>
      </div>
    </div>
  `;
}

function _buildEmptyRsvpCard() {
  return `
    <div class="bg-surface-container-lowest rounded-2xl p-6 text-center border border-outline-variant/30 flex flex-col items-center justify-center">
      <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-secondary mb-2">
        <span class="material-symbols-outlined text-[24px]">event_available</span>
      </div>
      <p class="text-label-md font-semibold text-on-surface">Tiada Program Menunggu RSVP</p>
      <p class="text-body-sm text-secondary mt-0.5">Semua pengesahan kehadiran anda telah dikemas kini.</p>
    </div>
  `;
}

function _buildMemoCard(memo) {
  const tajuk = escapeHtml(memo.tajuk || 'Memo Rasmi');
  const noRuj = escapeHtml(memo.no_rujukan || 'UPK/JSS/2026');
  const tarikh = formatDate(memo.tarikh || new Date());
  const linkDrive = memo.drive_link || memo.url || '#';
  const kategori = (memo.kategori || 'memo').toLowerCase();
  const isPdf = !memo.format || memo.format.toLowerCase() === 'pdf';

  return `
    <article class="bg-surface-container-lowest rounded-xl p-3.5 sm:p-4 shadow-xs border border-outline-variant/20 flex items-start gap-3 hover:bg-surface-container-low/50 transition-colors">
      <div class="w-11 h-11 rounded-lg ${isPdf ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'} flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs">
        <span class="material-symbols-outlined text-[22px]">${isPdf ? 'picture_as_pdf' : 'description'}</span>
      </div>
      <div class="flex flex-col flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-primary text-[10px] uppercase font-bold tracking-wide">
            ${kategori === 'minit' ? 'MINIT MESYUARAT' : 'MEMO RASMI'}
          </span>
          <span class="text-body-sm text-secondary">${tarikh}</span>
        </div>
        <h4 class="font-headline text-body-md font-semibold text-on-surface leading-snug line-clamp-2">
          ${tajuk}
        </h4>
        <div class="flex items-center justify-between mt-2 pt-1 border-t border-outline-variant/20">
          <span class="text-body-sm text-secondary truncate font-mono text-[11px]">${noRuj}</span>
          <a href="${linkDrive}" target="_blank" rel="noopener noreferrer" 
            class="text-label-sm font-semibold text-primary hover:text-primary-container flex items-center gap-1 ml-2">
            <span>Buka</span>
            <span class="material-symbols-outlined text-[14px]">arrow_outward</span>
          </a>
        </div>
      </div>
    </article>
  `;
}

function _buildEmptyMemosCard() {
  return `
    <div class="bg-surface-container-lowest rounded-xl p-5 text-center border border-outline-variant/20">
      <p class="text-body-sm text-secondary">Tiada memo atau minit mesyuarat terkini.</p>
    </div>
  `;
}

function _bindHomeEvents(container, data) {
  // Bind sebarang click listeners khusus jika perlu
}

/**
 * Handle RSVP Pantas dari dashboard utama
 */
window.handleInstantRsvp = async function(progId, status) {
  // Optimistic feedback
  showToast(`Mengesahkan kehadiran: ${status.toUpperCase()}...`, 'info', 1800);

  try {
    const res = await apiPost('submitRsvp', {
      program_id: progId,
      status: status,
      catatan: ''
    });

    if (res && res.success) {
      showToast('Status kehadiran berjaya dikemas kini!', 'success');
      // Muat semula data di skrin
      if (window.renderHomePage) {
        const content = document.getElementById('app-content');
        if (content) window.renderHomePage(content);
      }
    } else {
      showToast(res.message || 'Gagal mengemas kini RSVP.', 'error');
    }
  } catch (err) {
    showToast('Ralat rangkaian. Sila cuba lagi.', 'error');
  }
};
