// ============================================
// CEU Portal v1.1 — ui.js
// Utiliti Antaramuka: Toast, Skeleton, Modal,
// Top Bar, Bottom Nav, Admin Sidebar, Formatters
// ============================================

// ============================================
// 1. TOAST NOTIFICATIONS
// ============================================
function showToast(message, type, duration) {
  type = type || 'info';
  duration = duration || 3500;
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = {
    success: 'check_circle', error: 'error', info: 'info', warning: 'warning'
  };

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.innerHTML =
    '<span class="material-symbols-outlined icon-sm">' + (icons[type] || 'info') + '</span>' +
    '<span>' + escapeHtml(message) + '</span>';
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 260);
  }, duration);
}

// ============================================
// 2. SKELETON LOADING
// ============================================
function showSkeleton(container, count, type) {
  count = count || 3;
  type = type || 'card';
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return;

  let html = '';
  for (let i = 0; i < count; i++) {
    if (type === 'card') {
      html += '<div class="skeleton skeleton-card"></div>';
    } else if (type === 'list') {
      html += '<div style="display:flex;gap:12px;align-items:center;padding:12px 0">' +
        '<div class="skeleton skeleton-avatar"></div>' +
        '<div style="flex:1"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text" style="width:90%"></div></div></div>';
    } else if (type === 'table') {
      html += '<div class="skeleton skeleton-text" style="width:100%;height:40px;margin-bottom:4px"></div>';
    }
  }
  el.innerHTML = html;
}

function hideSkeleton(container) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (el) el.innerHTML = '';
}

// ============================================
// 3. MODAL DIALOG
// ============================================
function showModal(title, content, actions) {
  hideModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'modal-active';
  overlay.onclick = (e) => { if (e.target === overlay) hideModal(); };

  let actionsHtml = '';
  if (actions && actions.length) {
    actionsHtml = '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:20px">';
    actions.forEach(a => {
      const cls = a.danger
        ? 'background:#ba1a1a;color:#fff'
        : a.primary
          ? 'background:#167db2;color:#fff'
          : 'background:#e4efff;color:#001d35';
      actionsHtml += '<button onclick="' + (a.onclick || 'hideModal()') + '" ' +
        'style="padding:10px 20px;border:none;border-radius:10px;font-weight:600;font-size:14px;cursor:pointer;' + cls + '" ' +
        'class="btn-press">' + escapeHtml(a.label) + '</button>';
    });
    actionsHtml += '</div>';
  }

  overlay.innerHTML = '<div class="modal-card">' +
    '<h3 style="font-family:var(--font-headline);font-size:1.125rem;font-weight:600;color:var(--color-on-surface);margin:0 0 12px">' + escapeHtml(title) + '</h3>' +
    '<div style="font-size:0.875rem;color:var(--color-on-surface-variant);line-height:1.5">' + content + '</div>' +
    actionsHtml + '</div>';

  document.body.appendChild(overlay);
}

function hideModal() {
  const m = document.getElementById('modal-active');
  if (m) m.remove();
}

// ============================================
// 4. TOP BAR
// ============================================
function renderTopBar(config) {
  config = config || {};
  const header = document.getElementById('app-header');
  if (!header) return;

  const notifCount = config.notifCount || 0;
  const badgeHtml = notifCount > 0
    ? '<span style="position:absolute;top:6px;right:6px;min-width:18px;height:18px;padding:0 4px;background:#ba1a1a;color:#fff;border-radius:9999px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;ring:2px solid #fff">' + notifCount + '</span>'
    : '';

  header.className = 'top-bar';
  header.innerHTML =
    '<div style="display:flex;align-items:center;gap:8px;min-width:0">' +
      '<img src="assets/logo-upk.png" alt="UPK" style="height:32px;width:auto;object-fit:contain;flex-shrink:0" onerror="this.style.display=\'none\'">' +
      '<div style="display:flex;flex-direction:column;overflow:hidden">' +
        '<span style="font-family:var(--font-headline);font-size:1.1rem;font-weight:600;color:var(--color-on-surface);line-height:1.1;letter-spacing:-0.01em">CEU PORTAL</span>' +
        '<span style="font-size:0.75rem;color:var(--color-on-surface-variant);line-height:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">Unit Pendidikan Kerjaya</span>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:4px">' +
      '<button onclick="navigateTo(\'notifications\')" style="position:relative;width:44px;height:44px;border-radius:50%;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-on-surface-variant)" class="btn-press">' +
        '<span class="material-symbols-outlined" style="font-size:24px">notifications</span>' +
        badgeHtml +
      '</button>' +
      '<button onclick="navigateTo(\'profile\')" style="width:44px;height:44px;border-radius:50%;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center" class="btn-press">' +
        '<div style="width:32px;height:32px;border-radius:50%;background:var(--color-surface-container);display:flex;align-items:center;justify-content:center;color:var(--color-primary)">' +
          '<span class="material-symbols-outlined" style="font-size:20px">person</span>' +
        '</div>' +
      '</button>' +
    '</div>';
}

// ============================================
// 5. BOTTOM NAVIGATION BAR
// ============================================
const NAV_ITEMS = [
  { path: 'home', icon: 'home', label: 'Utama' },
  { path: 'calendar', icon: 'calendar_month', label: 'Kalendar' },
  { path: 'documents', icon: 'description', label: 'Dokumen' },
  { path: 'rsvp', icon: 'check_box', label: 'RSVP Saya' },
  { path: 'profile', icon: 'person', label: 'Profil' }
];

function renderBottomNav(activePath) {
  const nav = document.getElementById('app-nav');
  if (!nav) return;

  nav.className = 'bottom-nav force-show';
  nav.innerHTML = NAV_ITEMS.map(item => {
    const isActive = item.path === activePath;
    return '<button class="bottom-nav-item' + (isActive ? ' active' : '') + '" onclick="navigateTo(\'' + item.path + '\')">' +
      '<span class="material-symbols-outlined" style="font-size:24px">' + item.icon + '</span>' +
      '<span class="bottom-nav-label">' + item.label + '</span>' +
    '</button>';
  }).join('');
}

// ============================================
// 6. ADMIN SIDEBAR (Desktop)
// ============================================
const ADMIN_NAV_ITEMS = [
  { path: 'admin', icon: 'dashboard', label: 'Dashboard & Analitis' },
  { path: 'admin/events', icon: 'calendar_month', label: 'Urus Kalendar & Acara' },
  { path: 'admin/docs', icon: 'description', label: 'Urus Memo & Dokumen' },
  { path: 'admin/broadcast', icon: 'campaign', label: 'Hantar Hebahan Notifikasi' },
  { path: 'admin/rsvp-report', icon: 'check_circle', label: 'Laporan Kehadiran RSVP' },
  { path: 'admin/directory', icon: 'group', label: 'Direktori Guru & Sekolah' },
  { path: 'admin/users', icon: 'how_to_reg', label: 'Kelulusan Guru Baharu', badge: true }
];

function renderAdminSidebar(activePath, pendingCount) {
  const nav = document.getElementById('app-nav');
  if (!nav) return;

  nav.className = 'admin-sidebar';
  const user = getCurrentUser();

  let navLinksHtml = ADMIN_NAV_ITEMS.map(item => {
    const isActive = item.path === activePath;
    let badgeHtml = '';
    if (item.badge && pendingCount > 0) {
      badgeHtml = '<span style="margin-left:auto;background:#ba1a1a;color:#fff;font-size:11px;padding:2px 8px;border-radius:9999px;font-weight:600">' + pendingCount + '</span>';
    }
    return '<button class="nav-item' + (isActive ? ' active' : '') + '" onclick="navigateTo(\'' + item.path + '\')">' +
      '<span class="material-symbols-outlined" style="font-size:20px">' + item.icon + '</span>' +
      '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + item.label + '</span>' +
      badgeHtml +
    '</button>';
  }).join('');

  nav.innerHTML =
    '<div>' +
      '<div style="height:64px;padding:0 16px;display:flex;align-items:center;gap:8px">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:var(--color-primary-container);display:flex;align-items:center;justify-content:center;color:#fff">' +
          '<span class="material-symbols-outlined" style="font-size:20px">verified</span>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;min-width:0">' +
          '<span style="font-family:var(--font-headline);font-size:16px;font-weight:700;color:#fff;letter-spacing:-0.01em">CEU PORTAL</span>' +
          '<span style="font-size:11px;color:var(--color-inverse-on-surface);opacity:0.6;letter-spacing:0.05em">Admin Command • JSS</span>' +
        '</div>' +
      '</div>' +
      '<div style="padding:8px 16px"><span style="font-size:10px;color:var(--color-surface-highest);opacity:0.5;text-transform:uppercase;letter-spacing:0.1em;font-weight:600">Modul Pentadbiran</span></div>' +
      '<nav style="display:flex;flex-direction:column;gap:2px;padding:0 4px">' + navLinksHtml + '</nav>' +
    '</div>' +
    '<div style="padding:12px 16px;background:rgba(255,255,255,0.03)">' +
      '<div style="display:flex;align-items:center;gap:8px;padding:8px;border-radius:12px;background:rgba(255,255,255,0.06)">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:var(--color-primary-container);display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0">' +
          '<span class="material-symbols-outlined" style="font-size:18px">person</span>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;min-width:0;flex:1">' +
          '<span style="font-size:13px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(user ? user.nama : 'Pentadbir') + '</span>' +
          '<span style="font-size:11px;color:rgba(233,241,255,0.6);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + escapeHtml(user ? user.email : '') + '</span>' +
        '</div>' +
        '<button onclick="logout()" style="padding:6px;border:none;background:none;cursor:pointer;color:rgba(233,241,255,0.6);border-radius:8px" class="btn-press" title="Log Keluar">' +
          '<span class="material-symbols-outlined" style="font-size:20px">logout</span>' +
        '</button>' +
      '</div>' +
    '</div>';
}

// ============================================
// 7. FORMATTING & UTILITIES
// ============================================

const BULAN_MELAYU = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
const BULAN_PENDEK = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];
const HARI_MELAYU = ['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'];

function formatDate(date, format) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '-';
  format = format || 'short';
  if (format === 'full') return d.getDate() + ' ' + BULAN_MELAYU[d.getMonth()] + ' ' + d.getFullYear();
  if (format === 'day') return HARI_MELAYU[d.getDay()] + ', ' + d.getDate() + ' ' + BULAN_PENDEK[d.getMonth()];
  return d.getDate() + ' ' + BULAN_PENDEK[d.getMonth()] + ' ' + d.getFullYear();
}

function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {
    // Cuba parse "HH:MM" string
    if (typeof date === 'string' && /^\d{1,2}:\d{2}$/.test(date)) {
      const [h, m] = date.split(':').map(Number);
      const ampm = h < 12 ? 'Pagi' : (h < 18 ? 'Petang' : 'Malam');
      const h12 = h % 12 || 12;
      return (h12 < 10 ? '0' : '') + h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
    }
    return '-';
  }
  const h = d.getHours(), m = d.getMinutes();
  const ampm = h < 12 ? 'Pagi' : (h < 18 ? 'Petang' : 'Malam');
  const h12 = h % 12 || 12;
  return (h12 < 10 ? '0' : '') + h12 + ':' + (m < 10 ? '0' : '') + m + ' ' + ampm;
}

function timeAgo(date) {
  const d = date instanceof Date ? date : new Date(date);
  const now = Date.now();
  const diff = now - d.getTime();
  if (diff < 0) return 'baru sahaja';
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'baru sahaja';
  const min = Math.floor(sec / 60);
  if (min < 60) return min + ' minit lepas';
  const hr = Math.floor(min / 60);
  if (hr < 24) return hr + ' jam lepas';
  const days = Math.floor(hr / 24);
  if (days < 7) return days + ' hari lepas';
  if (days < 30) return Math.floor(days / 7) + ' minggu lepas';
  return formatDate(d);
}

function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
  return String(str || '').replace(/[&<>"']/g, c => map[c]);
}

function truncate(str, len) {
  str = String(str || '');
  len = len || 100;
  return str.length > len ? str.substring(0, len) + '…' : str;
}
