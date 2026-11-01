// ============================================
// CEU Portal v1.1 — pages/notifications.js
// W-06: Pemberitahuan & Hebahan Rasmi UPK
// Saluran Siaran Mesej, Notifikasi & Tindakan Pantas
// ============================================

window.renderNotificationsPage = async function(container) {
  window._notifState = window._notifState || {
    filter: 'all', // 'all' | 'urgent' | 'normal'
    notifications: []
  };

  const state = window._notifState;

  // Render rangka awal
  container.innerHTML = _buildNotifShell(state);
  _renderNotifList(state);

  // Ambil data notifikasi
  try {
    const res = await apiGet('getNotifications', {});
    if (res && res.success && res.notifications) {
      state.notifications = res.notifications;
      _renderNotifList(state);
    }
  } catch (err) {
    console.warn('Gagal memuatkan notifikasi:', err);
  }
};

function _buildNotifShell(state) {
  return `
    <div class="flex flex-col w-full px-4 sm:px-6 pb-24 gap-4 max-w-3xl mx-auto">
      
      <!-- Top Action & Intro Header -->
      <div class="pt-2 flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary text-label-sm font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-primary live-dot"></span>
            <span>Saluran Siaran Langsung</span>
          </span>
          <button onclick="notifMarkAllRead()" 
            class="inline-flex items-center gap-1 text-primary hover:text-primary-container text-label-sm font-semibold py-1 px-2 rounded-lg active:bg-surface-container-low transition-colors btn-press">
            <span class="material-symbols-outlined text-[16px]">done_all</span>
            <span>Tanda Semua Dibaca</span>
          </button>
        </div>

        <div>
          <h1 class="font-headline text-headline-md text-on-surface font-bold tracking-tight">
            Pemberitahuan & Hebahan Rasmi
          </h1>
          <p class="text-body-sm text-secondary mt-0.5">
            Mesej segera dan hebahan rasmi terus dari Pegawai Unit Pendidikan Kerjaya.
          </p>
        </div>

        <!-- Filter Segmented Tabs -->
        <div class="flex items-center gap-2 mt-1 overflow-x-auto no-scrollbar py-1">
          <button onclick="notifSetFilter('all')" 
            class="notif-tab flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ${state.filter === 'all' ? 'bg-primary text-on-primary font-bold shadow-xs' : 'bg-surface-container-lowest text-secondary border border-outline-variant/20'} text-label-sm transition-all">
            <span>Semua</span>
            <span id="notif-count-all" class="px-1.5 py-0.2 rounded-full ${state.filter === 'all' ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'} text-[10px] font-bold">...</span>
          </button>

          <button onclick="notifSetFilter('urgent')" 
            class="notif-tab flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ${state.filter === 'urgent' ? 'bg-error text-on-error font-bold shadow-xs' : 'bg-surface-container-lowest text-secondary border border-outline-variant/20'} text-label-sm transition-all">
            <span>Segera</span>
            <span id="notif-count-urgent" class="px-1.5 py-0.2 rounded-full ${state.filter === 'urgent' ? 'bg-white/20 text-white' : 'bg-error-container text-on-error-container'} text-[10px] font-bold">...</span>
          </button>

          <button onclick="notifSetFilter('normal')" 
            class="notif-tab flex items-center gap-1.5 px-3.5 py-1.5 rounded-full ${state.filter === 'normal' ? 'bg-primary text-on-primary font-bold shadow-xs' : 'bg-surface-container-lowest text-secondary border border-outline-variant/20'} text-label-sm transition-all">
            <span>Biasa</span>
            <span id="notif-count-normal" class="px-1.5 py-0.2 rounded-full ${state.filter === 'normal' ? 'bg-white/20 text-white' : 'bg-surface-container text-secondary'} text-[10px] font-bold">...</span>
          </button>
        </div>
      </div>

      <!-- Dynamic Notification Feed -->
      <div id="notif-feed-container" class="flex flex-col gap-3.5">
        <!-- Injected by _renderNotifList() -->
      </div>

    </div>
  `;
}

function _renderNotifList(state) {
  const container = document.getElementById('notif-feed-container');
  if (!container) return;

  const notifs = state.notifications || [];
  const urgentCount = notifs.filter(n => (n.kategori || '').toLowerCase() === 'segera' || n.priority === 'urgent').length;
  const normalCount = notifs.length - urgentCount;

  const countAll = document.getElementById('notif-count-all');
  if (countAll) countAll.textContent = notifs.length;
  const countUrgent = document.getElementById('notif-count-urgent');
  if (countUrgent) countUrgent.textContent = urgentCount;
  const countNormal = document.getElementById('notif-count-normal');
  if (countNormal) countNormal.textContent = normalCount;

  const filtered = notifs.filter(n => {
    const isUrgent = (n.kategori || '').toLowerCase() === 'segera' || n.priority === 'urgent';
    if (state.filter === 'urgent') return isUrgent;
    if (state.filter === 'normal') return !isUrgent;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/20">
        <span class="material-symbols-outlined text-[36px] text-secondary/60 mb-2">notifications_off</span>
        <h3 class="font-headline text-headline-md text-on-surface font-semibold">Tiada Notifikasi</h3>
        <p class="text-body-md text-secondary mt-1">Peti masuk hebahan anda telah dikemas kini.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(n => _buildNotifItem(n)).join('');
}

function _buildNotifItem(n) {
  const isUrgent = (n.kategori || '').toLowerCase() === 'segera' || n.priority === 'urgent';
  const isPerubahan = (n.kategori || '').toLowerCase().includes('ubah') || (n.kategori || '').toLowerCase().includes('pindaan');
  
  const tajuk = escapeHtml(n.tajuk || 'Hebahan Rasmi');
  const mesej = escapeHtml(n.mesej || n.kandungan || '');
  const pengirim = escapeHtml(n.pengirim || 'Pentadbir Unit UPK');
  const masa = timeAgo(n.created_at || n.tarikh || new Date());
  const notifId = n.id || '';

  let containerCls = 'bg-surface-container-lowest border-outline-variant/20';
  let stripCls = 'bg-primary';
  let badgeCls = 'bg-surface-container text-primary';
  let badgeIcon = 'campaign';
  let badgeText = 'HEBAHAN AM';

  if (isUrgent) {
    containerCls = 'bg-error-container/20 border-error/30';
    stripCls = 'bg-error';
    badgeCls = 'bg-error text-on-error font-bold';
    badgeIcon = 'warning';
    badgeText = 'SEGERA / TINDAKAN';
  } else if (isPerubahan) {
    containerCls = 'bg-tertiary-fixed/20 border-tertiary-container/30';
    stripCls = 'bg-tertiary';
    badgeCls = 'bg-tertiary-container text-white font-bold';
    badgeIcon = 'update';
    badgeText = 'PERUBAHAN JADUAL';
  }

  return `
    <article class="relative flex flex-col rounded-2xl ${containerCls} shadow-xs p-4 sm:p-5 overflow-hidden border transition-all">
      <div class="absolute left-0 top-0 bottom-0 w-1.5 ${stripCls}"></div>
      
      <div class="flex items-start justify-between gap-2 pl-2">
        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full ${badgeCls} text-[11px] font-semibold">
          <span class="material-symbols-outlined text-[13px]">${badgeIcon}</span>
          <span>${badgeText}</span>
        </span>
        <span class="text-secondary text-body-sm whitespace-nowrap">${masa}</span>
      </div>

      <div class="mt-2.5 pl-2 flex flex-col gap-1">
        <div class="flex items-center gap-1.5 text-secondary text-body-sm font-medium">
          <span class="material-symbols-outlined text-[16px]">account_circle</span>
          <span>${pengirim}</span>
        </div>
        <h3 class="font-headline text-headline-md text-on-surface font-bold tracking-tight leading-snug">
          ${tajuk}
        </h3>
        <p class="text-body-md text-secondary leading-relaxed mt-0.5">
          ${mesej}
        </p>

        <!-- Pautan Tindakan Pantas jika berkaitan RSVP -->
        ${isUrgent ? `
          <div class="pt-2">
            <button onclick="navigateTo('rsvp')" class="w-full h-10 px-4 rounded-xl bg-error hover:opacity-95 text-on-error text-label-md font-semibold flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-[0.98] btn-press">
              <span>Buka Skrin RSVP Sekarang</span>
              <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        ` : ''}
      </div>
    </article>
  `;
}

// ============================================
// HANDLER FUNGSI INTERAKTIF
// ============================================
window.notifSetFilter = function(f) {
  if (window._notifState) {
    window._notifState.filter = f;
    const content = document.getElementById('app-content');
    if (content) window.renderNotificationsPage(content);
  }
};

window.notifMarkAllRead = async function() {
  showToast('Menandakan semua notifikasi sebagai dibaca...', 'info', 1500);
  try {
    const res = await apiPost('markNotifRead', { id: 'all' });
    if (res && res.success) {
      showToast('Semua notifikasi telah dibaca.', 'success');
      window._unreadNotifCount = 0;
      if (window.renderTopBar) {
        window.renderTopBar({ notifCount: 0 });
      }
    }
  } catch (err) {
    // Optimistic fallback
    window._unreadNotifCount = 0;
    if (window.renderTopBar) {
      window.renderTopBar({ notifCount: 0 });
    }
  }
};
