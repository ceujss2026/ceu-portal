// ============================================
// CEU Portal v1.1 — app.js
// SPA Router, Pengawal Aplikasi, Halaman Login
// Pengesahan Sesi, Pengawal Peranan, Navigasi
// ============================================

// ============================================
// 1. KONFIGURASI LALUAN (ROUTES)
// ============================================
const ROUTES = {
  '/login':             { page: 'login',           auth: false,  role: null,    title: 'Log Masuk' },
  '/home':              { page: 'home',            auth: true,   role: null,    title: 'Utama' },
  '/calendar':          { page: 'calendar',        auth: true,   role: null,    title: 'Kalendar' },
  '/documents':         { page: 'documents',       auth: true,   role: null,    title: 'Dokumen' },
  '/rsvp':              { page: 'rsvp',            auth: true,   role: null,    title: 'RSVP Saya' },
  '/notifications':     { page: 'notifications',   auth: true,   role: null,    title: 'Pemberitahuan' },
  '/profile':           { page: 'profile',         auth: true,   role: null,    title: 'Profil' },
  '/admin':             { page: 'admin',           auth: true,   role: 'admin', title: 'Dashboard Pentadbir' },
  '/admin/events':      { page: 'admin-events',    auth: true,   role: 'admin', title: 'Urus Acara' },
  '/admin/docs':        { page: 'admin-docs',      auth: true,   role: 'admin', title: 'Urus Dokumen' },
  '/admin/broadcast':   { page: 'admin-broadcast', auth: true,   role: 'admin', title: 'Hantar Hebahan' },
  '/admin/rsvp-report': { page: 'admin-rsvp',      auth: true,   role: 'admin', title: 'Laporan RSVP' },
  '/admin/directory':   { page: 'admin-directory', auth: true,   role: 'admin', title: 'Direktori Guru' },
  '/admin/users':       { page: 'admin-users',     auth: true,   role: 'admin', title: 'Kelulusan Guru' },
};

// ============================================
// 2. PENGURUS SESI (Session Manager)
// ============================================
function getCurrentUser() {
  try {
    const raw = localStorage.getItem('ceu_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function getToken() {
  return localStorage.getItem('ceu_token') || '';
}

function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  // Semak tamat tempoh token (decode HMAC token: base64 JSON part)
  try {
    const parts = token.split('.');
    if (parts.length < 2) return false;
    const payload = JSON.parse(atob(parts[0]));
    if (payload.exp && payload.exp < Date.now()) {
      // Token tamat — bersihkan
      localStorage.removeItem('ceu_token');
      localStorage.removeItem('ceu_user');
      return false;
    }
    return true;
  } catch (e) {
    // Token format tak standard — anggap sah dan biar server sahkan
    return !!token;
  }
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.peranan === 'admin';
}

function logout() {
  const token = getToken();
  // Panggil API untuk revoke sesi di server
  if (token) {
    apiPost('logout', {}).catch(() => {});
  }
  localStorage.removeItem('ceu_token');
  localStorage.removeItem('ceu_user');
  localStorage.removeItem('ceu_boot');
  navigateTo('login');
  showToast('Anda telah log keluar.', 'info');
}

// ============================================
// 3. SPA ROUTER
// ============================================
let _currentPath = '';
let _pollingHandle = null;

function navigateTo(path) {
  // Normalize path — buang / prefix jika ada
  path = path.replace(/^\/+/, '');
  window.location.hash = '#/' + path;
}

function getRoutePath() {
  const hash = window.location.hash || '#/login';
  return hash.replace('#', '') || '/login';
}

function handleRoute() {
  const path = getRoutePath();
  const route = ROUTES[path];

  // Route tidak dijumpai → redirect
  if (!route) {
    navigateTo(isLoggedIn() ? (isAdmin() ? 'admin' : 'home') : 'login');
    return;
  }

  // Pengawal pengesahan (Auth Guard)
  if (route.auth && !isLoggedIn()) {
    navigateTo('login');
    return;
  }

  // Jika sudah log masuk, jangan ke login
  if (path === '/login' && isLoggedIn()) {
    navigateTo(isAdmin() ? 'admin' : 'home');
    return;
  }

  // Pengawal peranan (Role Guard)
  if (route.role === 'admin' && !isAdmin()) {
    navigateTo('home');
    showToast('Akses ditolak. Anda bukan pentadbir.', 'error');
    return;
  }

  // Elak render semula halaman yang sama
  if (_currentPath === path) return;
  _currentPath = path;

  // Kemas kini tajuk
  document.title = route.title + ' — CEU Portal';

  // Hentikan polling terdahulu
  if (_pollingHandle) {
    _pollingHandle.stop();
    _pollingHandle = null;
  }

  // Tentukan susun atur (Layout)
  setupLayout(route);

  // Render halaman dengan animasi peralihan
  renderPage(route);
}

// ============================================
// 4. SUSUN ATUR (Layout Manager)
// ============================================
function setupLayout(route) {
  const header = document.getElementById('app-header');
  const nav = document.getElementById('app-nav');
  const sidebar = document.getElementById('app-sidebar');
  const content = document.getElementById('app-content');

  if (route.page === 'login') {
    // Login — sembunyikan semua nav
    if (header) header.className = 'hidden';
    if (nav) nav.className = 'hidden';
    if (sidebar) sidebar.className = 'fixed top-0 left-0 bottom-0 z-50 hidden';
    if (content) {
      content.className = 'min-h-screen transition-all duration-200';
      content.style.paddingTop = '';
      content.style.paddingBottom = '';
      content.style.paddingLeft = '';
    }
  } else if (route.role === 'admin') {
    // Admin — sidebar layout
    if (header) header.className = 'hidden';
    if (nav) nav.className = 'hidden';
    if (sidebar) sidebar.className = 'admin-sidebar';
    renderAdminSidebar(route.page === 'admin' ? 'admin' : route.page.replace('admin-', 'admin/'));
    if (content) {
      content.className = 'admin-content admin-layout transition-all duration-200';
    }
  } else {
    // Guru — top bar + bottom nav
    if (header) header.className = 'top-bar';
    renderTopBar({ notifCount: _unreadNotifCount });
    renderBottomNav(route.page);
    if (sidebar) sidebar.className = 'fixed top-0 left-0 bottom-0 z-50 hidden';
    if (content) {
      content.className = 'min-h-screen transition-all duration-200';
      content.style.paddingLeft = '';
    }
  }
}

let _unreadNotifCount = 0;

// ============================================
// 5. RENDER HALAMAN (Page Renderer)
// ============================================
function renderPage(route) {
  const content = document.getElementById('app-content');
  if (!content) return;

  // Animasi keluar
  content.classList.add('page-leave');

  setTimeout(() => {
    content.classList.remove('page-leave');

    // Render berdasarkan halaman
    switch (route.page) {
      case 'login':
        renderLoginPage(content);
        break;
      case 'home':
        if (window.renderHomePage) window.renderHomePage(content);
        else renderPlaceholderPage(content, 'Utama', 'home', 'Dashboard guru kerjaya');
        break;
      case 'calendar':
        if (window.renderCalendarPage) window.renderCalendarPage(content);
        else renderPlaceholderPage(content, 'Kalendar', 'calendar_month', 'Kalendar interaktif program');
        break;
      case 'documents':
        if (window.renderDocumentsPage) window.renderDocumentsPage(content);
        else renderPlaceholderPage(content, 'Dokumen, Memo & Minit', 'description', 'Hab dokumen rasmi');
        break;
      case 'rsvp':
        if (window.renderRsvpPage) window.renderRsvpPage(content);
        else renderPlaceholderPage(content, 'RSVP Saya', 'check_box', 'Senarai pengesahan kehadiran program');
        break;
      case 'notifications':
        if (window.renderNotificationsPage) window.renderNotificationsPage(content);
        else renderPlaceholderPage(content, 'Pemberitahuan', 'notifications', 'Hebahan rasmi');
        break;
      case 'profile':
        if (window.renderProfilePage) window.renderProfilePage(content);
        else renderPlaceholderPage(content, 'Profil Saya', 'person', 'Maklumat peribadi dan tetapan');
        break;
      case 'admin':
        if (window.renderAdminDashboardPage) window.renderAdminDashboardPage(content);
        else renderPlaceholderPage(content, 'Dashboard Pentadbir', 'dashboard', 'Analitis keseluruhan', true);
        break;
      case 'admin-events':
        if (window.renderAdminEventsPage) window.renderAdminEventsPage(content);
        else renderPlaceholderPage(content, 'Urus Kalendar & Acara', 'calendar_month', 'Cipta dan urus program', true);
        break;
      case 'admin-docs':
        if (window.renderAdminDocsPage) window.renderAdminDocsPage(content);
        else renderPlaceholderPage(content, 'Urus Memo & Dokumen', 'description', 'Urus dokumen rasmi', true);
        break;
      case 'admin-broadcast':
        if (window.renderAdminBroadcastPage) window.renderAdminBroadcastPage(content);
        else renderPlaceholderPage(content, 'Hantar Hebahan', 'campaign', 'Hantar hebahan notifikasi', true);
        break;
      case 'admin-rsvp':
        if (window.renderAdminDashboardPage) window.renderAdminDashboardPage(content);
        else renderPlaceholderPage(content, 'Laporan Kehadiran RSVP', 'check_circle', 'Semakan kehadiran', true);
        break;
      case 'admin-directory':
      case 'admin-users':
        if (window.renderAdminUsersPage) window.renderAdminUsersPage(content);
        else renderPlaceholderPage(content, 'Kelulusan Guru Baharu', 'how_to_reg', 'Kelulusan permohonan guru', true);
        break;
      default:
        content.innerHTML = '<div class="p-8 text-center text-secondary">Halaman tidak dijumpai.</div>';
    }

    // Animasi masuk
    content.classList.add('page-enter');
    setTimeout(() => content.classList.remove('page-enter'), 300);
  }, 180);
}

// ============================================
// 6. HALAMAN PLACEHOLDER (Fasa Seterusnya)
// ============================================
function renderPlaceholderPage(container, title, icon, desc, isAdminPage) {
  const padding = isAdminPage ? 'px-4 md:px-8 py-6' : 'px-4 py-6';
  const user = getCurrentUser();
  const greeting = user ? ('Selamat datang, ' + escapeHtml(user.nama || user.email || '')) : '';

  container.innerHTML =
    '<div class="' + padding + ' max-w-3xl mx-auto">' +
      // Header greeting (guru sahaja)
      (!isAdminPage && greeting ? (
        '<div class="mb-6">' +
          '<p class="text-body-sm text-secondary">' + greeting + '</p>' +
        '</div>'
      ) : '') +

      // Placeholder card
      '<div class="bg-surface-container-lowest rounded-xl shadow-sm p-8 text-center">' +
        '<div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-fixed flex items-center justify-center">' +
          '<span class="material-symbols-outlined text-primary text-[32px]">' + icon + '</span>' +
        '</div>' +
        '<h2 class="font-headline text-headline-md text-on-surface font-semibold mb-2">' + escapeHtml(title) + '</h2>' +
        '<p class="text-body-md text-secondary mb-6 max-w-md mx-auto">' + escapeHtml(desc) + '</p>' +
        '<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container text-secondary text-body-sm">' +
          '<span class="material-symbols-outlined text-[16px] text-tertiary">construction</span>' +
          '<span>Modul ini akan dilaksanakan dalam fasa seterusnya</span>' +
        '</div>' +
      '</div>' +

      // Quick actions untuk navigation testing
      (isAdminPage ? '' : (
        '<div class="mt-6 grid grid-cols-2 gap-3">' +
          '<button onclick="navigateTo(\'calendar\')" class="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl shadow-sm text-left btn-press card-hover">' +
            '<span class="material-symbols-outlined text-primary">calendar_month</span>' +
            '<span class="text-body-md font-medium text-on-surface">Kalendar</span>' +
          '</button>' +
          '<button onclick="navigateTo(\'documents\')" class="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl shadow-sm text-left btn-press card-hover">' +
            '<span class="material-symbols-outlined text-primary">description</span>' +
            '<span class="text-body-md font-medium text-on-surface">Dokumen</span>' +
          '</button>' +
          '<button onclick="navigateTo(\'rsvp\')" class="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl shadow-sm text-left btn-press card-hover">' +
            '<span class="material-symbols-outlined text-primary">check_box</span>' +
            '<span class="text-body-md font-medium text-on-surface">RSVP Saya</span>' +
          '</button>' +
          '<button onclick="navigateTo(\'notifications\')" class="flex items-center gap-3 p-4 bg-surface-container-lowest rounded-xl shadow-sm text-left btn-press card-hover">' +
            '<span class="material-symbols-outlined text-primary">notifications</span>' +
            '<span class="text-body-md font-medium text-on-surface">Hebahan</span>' +
          '</button>' +
        '</div>'
      )) +
    '</div>';
}

// ============================================
// 7. HALAMAN LOG MASUK (Login Page — PENUH)
//    Replika visual Stitch prototype
// ============================================
let _loginState = 'email'; // 'email' | 'otp' | 'loading' | 'access'
let _loginEmail = '';
let _otpTimer = null;
let _otpTimeLeft = 0;

function renderLoginPage(container) {
  _loginState = 'email';
  _loginEmail = '';

  container.innerHTML =
    '<div class="flex flex-col w-full min-h-screen bg-surface px-4 sm:px-6 pb-6">' +
      '<div class="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">' +
        // Logo & Title
        _buildLoginHeader() +
        // Form Card
        '<div id="login-card" class="w-full bg-surface-container-lowest rounded-xl shadow-sm p-4 sm:p-6 flex flex-col gap-4 mt-3">' +
          _buildEmailStep() +
        '</div>' +
        // Onboarding CTA
        _buildAccessRequest() +
      '</div>' +
      // Footer
      _buildLoginFooter() +
    '</div>';
}

function _buildLoginHeader() {
  return (
    '<div class="relative w-full flex flex-col items-center pt-4 pb-3">' +
      // Ambient glow
      '<div class="absolute -top-12 w-48 h-48 bg-primary-fixed/40 rounded-full blur-3xl pointer-events-none"></div>' +
      // Logo
      '<div class="relative w-20 h-20 rounded-full bg-surface-container-lowest shadow-md flex items-center justify-center p-1 mb-3">' +
        '<img alt="UPK Official Emblem" class="w-full h-full object-contain rounded-full"' +
        ' src="assets/logo-upk.png"' +
        ' onerror="this.onerror=null;this.parentElement.innerHTML=\'<div class=\\\'w-full h-full rounded-full bg-primary flex items-center justify-center text-on-primary font-headline text-2xl font-bold\\\'>UPK</div>\'">' +
      '</div>' +
      // Title
      '<h1 class="font-headline text-headline-md text-on-surface tracking-tight font-bold text-center">CEU PORTAL</h1>' +
      '<p class="text-label-sm text-secondary text-center mt-1">Unit Pendidikan Kerjaya, Jabatan Sekolah-Sekolah</p>' +
      // Status badge
      '<div class="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 rounded-full bg-surface-container text-primary text-label-sm font-semibold">' +
        '<span class="w-1.5 h-1.5 rounded-full bg-primary live-dot"></span>' +
        'Portal Pengesahan Selamat' +
      '</div>' +
    '</div>'
  );
}

function _buildEmailStep() {
  return (
    '<div class="flex flex-col gap-1.5">' +
      '<div class="flex items-center justify-between">' +
        '<label class="text-label-md font-semibold text-on-surface" for="login-email">Emel Rasmi</label>' +
        '<span class="text-body-sm text-secondary font-medium">.gov.bn / .moe.bn</span>' +
      '</div>' +
      '<div class="relative flex items-center">' +
        '<span class="material-symbols-outlined absolute left-3 text-secondary text-[20px] pointer-events-none">mail</span>' +
        '<input class="w-full h-11 pl-10 pr-4 bg-surface-container-low rounded-lg text-body-md text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 transition-all outline-none"' +
        ' id="login-email" type="email" placeholder="nama.pengguna@moe.bn" autocomplete="email" inputmode="email" autofocus>' +
      '</div>' +
      '<p class="text-body-sm text-secondary flex items-start gap-1.5 mt-0.5">' +
        '<span class="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">info</span>' +
        '<span>Kod laluan sekali guna (6-digit OTP) akan dihantar ke peti emel rasmi anda.</span>' +
      '</p>' +
    '</div>' +
    // Submit button
    '<button onclick="handleRequestOtp()" id="btn-request-otp" class="w-full h-[46px] bg-primary text-on-primary rounded-xl text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all btn-press">' +
      '<span class="material-symbols-outlined text-[20px]">send</span>' +
      '<span>Hantar Kod OTP</span>' +
    '</button>'
  );
}

function _buildOtpStep() {
  return (
    // Divider
    '<div class="flex items-center gap-2">' +
      '<div class="h-px bg-surface-container flex-1"></div>' +
      '<span class="text-label-sm text-secondary uppercase tracking-wider px-1 font-semibold">Pengesahan OTP</span>' +
      '<div class="h-px bg-surface-container flex-1"></div>' +
    '</div>' +
    // OTP label
    '<div class="flex flex-col gap-2">' +
      '<div class="flex items-center justify-between">' +
        '<span class="text-label-md font-semibold text-on-surface">Masukkan 6-Digit Kod OTP</span>' +
        '<span class="text-body-sm text-primary font-medium flex items-center gap-0.5">' +
          '<span class="material-symbols-outlined text-[14px]">lock</span> Disulitkan' +
        '</span>' +
      '</div>' +
      // 6-digit grid
      '<div class="grid grid-cols-6 gap-2 w-full" id="otp-container">' +
        '<input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" class="otp-box h-[52px] rounded-lg bg-surface-container-low shadow-sm text-center font-headline text-headline-md text-on-surface font-semibold focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 outline-none transition-all" data-idx="0">' +
        '<input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" class="otp-box h-[52px] rounded-lg bg-surface-container-low shadow-sm text-center font-headline text-headline-md text-on-surface font-semibold focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 outline-none transition-all" data-idx="1">' +
        '<input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" class="otp-box h-[52px] rounded-lg bg-surface-container-low shadow-sm text-center font-headline text-headline-md text-on-surface font-semibold focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 outline-none transition-all" data-idx="2">' +
        '<input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" class="otp-box h-[52px] rounded-lg bg-surface-container-low shadow-sm text-center font-headline text-headline-md text-on-surface font-semibold focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 outline-none transition-all" data-idx="3">' +
        '<input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" class="otp-box h-[52px] rounded-lg bg-surface-container-low shadow-sm text-center font-headline text-headline-md text-on-surface font-semibold focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 outline-none transition-all" data-idx="4">' +
        '<input type="text" maxlength="1" inputmode="numeric" pattern="[0-9]" class="otp-box h-[52px] rounded-lg bg-surface-container-low shadow-sm text-center font-headline text-headline-md text-on-surface font-semibold focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/30 outline-none transition-all" data-idx="5">' +
      '</div>' +
      // Resend & timer
      '<div class="flex items-center justify-between pt-1">' +
        '<div class="flex items-center gap-1.5 text-body-sm text-secondary">' +
          '<span class="material-symbols-outlined text-[16px] text-tertiary">schedule</span>' +
          '<span>Hantar semula dalam <strong class="text-on-surface font-semibold" id="otp-countdown">05:00</strong></span>' +
        '</div>' +
        '<button onclick="handleResendOtp()" id="btn-resend-otp" class="text-label-sm text-primary hover:text-primary-container active:opacity-75 transition-opacity inline-flex items-center gap-1 disabled:opacity-40" disabled>' +
          '<span>Hantar Semula</span>' +
          '<span class="material-symbols-outlined text-[14px]">refresh</span>' +
        '</button>' +
      '</div>' +
    '</div>' +
    // Verify button
    '<button onclick="handleVerifyOtp()" id="btn-verify-otp" class="w-full h-[46px] bg-primary text-on-primary rounded-xl text-label-md font-semibold flex items-center justify-center gap-2 shadow-sm active:scale-[0.99] transition-all btn-press">' +
      '<span class="material-symbols-outlined text-[20px]">verified_user</span>' +
      '<span>Sahkan & Log Masuk</span>' +
    '</button>' +
    // Security badge
    '<div class="flex items-center justify-center gap-1.5 text-secondary text-body-sm">' +
      '<span class="material-symbols-outlined text-[15px] text-secondary">shield</span>' +
      '<span>Akses Selamat Menggunakan Gov.bn ID Gateway</span>' +
    '</div>'
  );
}

function _buildAccessRequest() {
  return (
    '<div class="w-full mt-4 flex flex-col items-center text-center gap-2">' +
      '<div class="w-full h-px bg-surface-container"></div>' +
      '<p class="text-body-sm text-secondary pt-1">Belum mempunyai akses guru kerjaya?</p>' +
      '<button onclick="showAccessRequestModal()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low text-primary text-label-md font-semibold hover:bg-surface-container active:scale-95 transition-all btn-press">' +
        '<span class="material-symbols-outlined text-[18px]">person_add</span>' +
        '<span>+ Mohon Capaian Guru Baharu</span>' +
      '</button>' +
    '</div>'
  );
}

function _buildLoginFooter() {
  return (
    '<div class="mt-4">' +
      // Institution badge
      '<div class="max-w-sm mx-auto w-full bg-surface-container-low rounded-xl p-3 flex items-center gap-3 mb-4">' +
        '<div class="w-10 h-10 rounded-lg bg-primary-fixed flex items-center justify-center shrink-0">' +
          '<span class="material-symbols-outlined text-primary text-[22px]">domain</span>' +
        '</div>' +
        '<div class="flex flex-col min-w-0">' +
          '<span class="text-label-sm font-semibold text-on-surface truncate">Kementerian Pendidikan Brunei Darussalam</span>' +
          '<span class="text-body-sm text-secondary truncate">Kluster 1 - 6 Sekolah Rendah & Menengah</span>' +
        '</div>' +
        '<span class="material-symbols-outlined text-secondary ml-auto text-[18px]">verified</span>' +
      '</div>' +
      // Footer text
      '<footer class="text-center flex flex-col items-center gap-1 pb-4">' +
        '<p class="text-body-sm text-secondary font-medium">Sistem Pengurusan Kerjaya Bersepadu • Versi ' + APP_VERSION + '</p>' +
        '<p class="text-body-sm text-outline text-[11px]">Hak Cipta Terpelihara © ' + new Date().getFullYear() + ' Jabatan Sekolah-Sekolah.</p>' +
      '</footer>' +
    '</div>'
  );
}

// ============================================
// 8. INTERAKSI LOGIN — LOGIK OTP
// ============================================

/**
 * Langkah 1: Hantar permintaan OTP ke emel rasmi.
 */
async function handleRequestOtp() {
  const input = document.getElementById('login-email');
  const btn = document.getElementById('btn-request-otp');
  if (!input || !btn) return;

  const email = input.value.trim().toLowerCase();

  // Validasi format emel rasmi
  if (!email) {
    showToast('Sila masukkan emel rasmi anda.', 'warning');
    input.focus();
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showToast('Format emel tidak sah.', 'error');
    input.focus();
    return;
  }

  // Simpan emel
  _loginEmail = email;

  // Tunjuk loading
  btn.disabled = true;
  btn.innerHTML =
    '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>' +
    '<span>Menghantar OTP...</span>';

  try {
    const res = await apiPost('requestOtp', { email: email });

    if (res.success) {
      showToast('Kod OTP telah dihantar ke ' + email, 'success');
      _loginState = 'otp';
      _showOtpStep();
    } else {
      showToast(res.message || 'Gagal menghantar OTP.', 'error');
      btn.disabled = false;
      btn.innerHTML =
        '<span class="material-symbols-outlined text-[20px]">send</span>' +
        '<span>Hantar Kod OTP</span>';
    }
  } catch (err) {
    showToast('Ralat rangkaian. Sila cuba lagi.', 'error');
    btn.disabled = false;
    btn.innerHTML =
      '<span class="material-symbols-outlined text-[20px]">send</span>' +
      '<span>Hantar Kod OTP</span>';
  }
}

/**
 * Papar borang OTP selepas emel berjaya dihantar.
 */
function _showOtpStep() {
  const card = document.getElementById('login-card');
  if (!card) return;

  // Tunjuk emel yang digunakan (read-only) + borang OTP
  card.innerHTML =
    // Email display (locked)
    '<div class="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg">' +
      '<span class="material-symbols-outlined text-primary text-[20px]">mail</span>' +
      '<div class="flex flex-col min-w-0 flex-1">' +
        '<span class="text-body-sm text-secondary">OTP telah dihantar ke:</span>' +
        '<span class="text-body-md text-on-surface font-medium truncate">' + escapeHtml(_loginEmail) + '</span>' +
      '</div>' +
      '<button onclick="handleChangeEmail()" class="text-label-sm text-primary hover:text-primary-container btn-press flex items-center gap-0.5">' +
        '<span class="material-symbols-outlined text-[16px]">edit</span>' +
        '<span>Tukar</span>' +
      '</button>' +
    '</div>' +
    _buildOtpStep();

  // Setup OTP input auto-focus dan auto-tab
  _setupOtpInputs();

  // Mula pemasa countdown (5 minit)
  _startOtpCountdown(300);

  // Focus pada input pertama
  const firstInput = card.querySelector('.otp-box[data-idx="0"]');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

/**
 * Setup OTP input behaviour: auto-tab, backspace, paste.
 */
function _setupOtpInputs() {
  const boxes = document.querySelectorAll('.otp-box');
  if (!boxes.length) return;

  boxes.forEach((box, idx) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/\D/g, '');
      e.target.value = val.charAt(0) || '';
      if (val && idx < 5) {
        boxes[idx + 1].focus();
      }
      // Auto-submit jika semua 6 digit diisi
      _checkOtpComplete();
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && idx > 0) {
        boxes[idx - 1].focus();
        boxes[idx - 1].value = '';
      }
      if (e.key === 'Enter') {
        handleVerifyOtp();
      }
    });

    // Handle paste — isi semua 6 kotak sekaligus
    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (paste.length >= 6) {
        for (let i = 0; i < 6; i++) {
          boxes[i].value = paste.charAt(i);
        }
        boxes[5].focus();
        _checkOtpComplete();
      }
    });
  });
}

/**
 * Semak jika semua 6 digit telah diisi.
 */
function _checkOtpComplete() {
  const boxes = document.querySelectorAll('.otp-box');
  let code = '';
  boxes.forEach(b => code += b.value);
  if (code.length === 6) {
    // Highlight verify button
    const btn = document.getElementById('btn-verify-otp');
    if (btn) {
      btn.classList.add('ring-2', 'ring-primary/40', 'shadow-md');
    }
  }
}

/**
 * Pemasa undur OTP — 5 minit.
 */
function _startOtpCountdown(seconds) {
  _otpTimeLeft = seconds;
  const display = document.getElementById('otp-countdown');
  const resendBtn = document.getElementById('btn-resend-otp');

  if (_otpTimer) clearInterval(_otpTimer);

  _otpTimer = setInterval(() => {
    _otpTimeLeft--;
    if (display) {
      const m = Math.floor(_otpTimeLeft / 60);
      const s = _otpTimeLeft % 60;
      display.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    if (_otpTimeLeft <= 0) {
      clearInterval(_otpTimer);
      _otpTimer = null;
      if (display) display.textContent = '00:00';
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.classList.remove('disabled:opacity-40');
      }
    }
  }, 1000);
}

/**
 * Langkah 2: Sahkan OTP dan log masuk.
 */
async function handleVerifyOtp() {
  const boxes = document.querySelectorAll('.otp-box');
  let code = '';
  boxes.forEach(b => code += b.value);

  if (code.length < 6) {
    showToast('Sila masukkan 6 digit kod OTP.', 'warning');
    return;
  }

  const btn = document.getElementById('btn-verify-otp');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML =
      '<span class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>' +
      '<span>Mengesahkan...</span>';
  }

  try {
    const res = await apiPost('verifyOtp', { email: _loginEmail, otp: code });

    if (res.success) {
      // Simpan token & data pengguna
      localStorage.setItem('ceu_token', res.token);
      localStorage.setItem('ceu_user', JSON.stringify(res.user || {}));

      showToast('Log masuk berjaya! Selamat datang.', 'success');

      // Hentikan timer
      if (_otpTimer) { clearInterval(_otpTimer); _otpTimer = null; }

      // Redirect berdasarkan peranan
      const user = res.user || {};
      setTimeout(() => {
        navigateTo(user.peranan === 'admin' ? 'admin' : 'home');
      }, 500);
    } else {
      showToast(res.message || 'Kod OTP tidak sah.', 'error');
      // Reset OTP boxes
      boxes.forEach(b => b.value = '');
      if (boxes[0]) boxes[0].focus();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML =
          '<span class="material-symbols-outlined text-[20px]">verified_user</span>' +
          '<span>Sahkan & Log Masuk</span>';
      }
    }
  } catch (err) {
    showToast('Ralat rangkaian. Sila cuba lagi.', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML =
        '<span class="material-symbols-outlined text-[20px]">verified_user</span>' +
        '<span>Sahkan & Log Masuk</span>';
    }
  }
}

/**
 * Hantar semula OTP.
 */
async function handleResendOtp() {
  const resendBtn = document.getElementById('btn-resend-otp');
  if (resendBtn) resendBtn.disabled = true;

  showToast('Menghantar semula OTP...', 'info');

  try {
    const res = await apiPost('requestOtp', { email: _loginEmail });
    if (res.success) {
      showToast('Kod OTP baharu telah dihantar.', 'success');
      _startOtpCountdown(300);
      // Reset OTP boxes
      document.querySelectorAll('.otp-box').forEach(b => b.value = '');
      const first = document.querySelector('.otp-box[data-idx="0"]');
      if (first) first.focus();
    } else {
      showToast(res.message || 'Gagal menghantar OTP.', 'error');
      if (resendBtn) resendBtn.disabled = false;
    }
  } catch (err) {
    showToast('Ralat rangkaian.', 'error');
    if (resendBtn) resendBtn.disabled = false;
  }
}

/**
 * Tukar emel — kembali ke langkah 1.
 */
function handleChangeEmail() {
  _loginState = 'email';
  if (_otpTimer) { clearInterval(_otpTimer); _otpTimer = null; }
  const card = document.getElementById('login-card');
  if (card) {
    card.innerHTML = _buildEmailStep();
    const input = document.getElementById('login-email');
    if (input) {
      input.value = _loginEmail;
      input.focus();
    }
  }
}

// ============================================
// 9. MODAL MOHON CAPAIAN GURU BAHARU
// ============================================
function showAccessRequestModal() {
  showModal('Mohon Capaian Guru Baharu', _buildAccessRequestForm(), [
    { label: 'Batal', onclick: 'hideModal()' },
    { label: 'Hantar Permohonan', primary: true, onclick: 'handleAccessRequest()' }
  ]);
}

function _buildAccessRequestForm() {
  return (
    '<div style="display:flex;flex-direction:column;gap:14px">' +
      '<div>' +
        '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Nama Penuh</label>' +
        '<input id="access-nama" type="text" placeholder="Cth: Azlan bin Haji Kassim" style="width:100%;padding:10px 12px;border:1px solid var(--color-outline-variant);border-radius:8px;font-size:14px;background:var(--color-surface-low);outline:none">' +
      '</div>' +
      '<div>' +
        '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Emel Rasmi</label>' +
        '<input id="access-email" type="email" placeholder="nama@moe.bn" style="width:100%;padding:10px 12px;border:1px solid var(--color-outline-variant);border-radius:8px;font-size:14px;background:var(--color-surface-low);outline:none">' +
      '</div>' +
      '<div>' +
        '<label style="font-size:13px;font-weight:600;display:block;margin-bottom:4px">Nama Sekolah</label>' +
        '<input id="access-sekolah" type="text" placeholder="Cth: SM Sayyidina Ali" style="width:100%;padding:10px 12px;border:1px solid var(--color-outline-variant);border-radius:8px;font-size:14px;background:var(--color-surface-low);outline:none">' +
      '</div>' +
      '<p style="font-size:12px;color:var(--color-on-surface-variant);line-height:1.5">Permohonan anda akan disemak oleh Unit Pendidikan Kerjaya dalam tempoh 1-3 hari bekerja.</p>' +
    '</div>'
  );
}

async function handleAccessRequest() {
  const nama = (document.getElementById('access-nama') || {}).value || '';
  const email = (document.getElementById('access-email') || {}).value || '';
  const sekolah = (document.getElementById('access-sekolah') || {}).value || '';

  if (!nama.trim() || !email.trim() || !sekolah.trim()) {
    showToast('Sila lengkapkan semua ruangan.', 'warning');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    showToast('Format emel tidak sah.', 'error');
    return;
  }

  try {
    const res = await apiPost('requestAccess', {
      nama: nama.trim(),
      email: email.trim().toLowerCase(),
      sekolah: sekolah.trim()
    });

    hideModal();

    if (res.success) {
      showToast('Permohonan berjaya dihantar! Sila tunggu kelulusan.', 'success');
    } else {
      showToast(res.message || 'Gagal menghantar permohonan.', 'error');
    }
  } catch (err) {
    hideModal();
    showToast('Ralat rangkaian.', 'error');
  }
}

// ============================================
// 10. BOOT & INISIALISASI APLIKASI
// ============================================
function initApp() {
  // Daftarkan event listener untuk hash change
  window.addEventListener('hashchange', () => {
    _currentPath = ''; // Reset supaya route diproses
    handleRoute();
  });

  // Redirect default
  if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
    if (isLoggedIn()) {
      window.location.hash = isAdmin() ? '#/admin' : '#/home';
    } else {
      window.location.hash = '#/login';
    }
  }

  // Handle route awal
  handleRoute();
}

// Enter pada email input → submit
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.target.id === 'login-email') {
    e.preventDefault();
    handleRequestOtp();
  }
});

// Tunggu semua skrip dimuatkan, kemudian mulakan
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
