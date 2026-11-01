// ============================================
// CEU Portal v1.1 — pages/admin-users.js
// W-11: Kelulusan Guru Baharu & Direktori Sekolah
// Pengesahan Akses RBAC, Senarai Guru & 42 Sekolah
// ============================================

window.renderAdminUsersPage = async function(container) {
  window._adminUserState = window._adminUserState || {
    tab: 'pending', // 'pending' | 'teachers' | 'schools'
    pendingUsers: [],
    teachers: [],
    schools: [],
    searchQuery: ''
  };

  const state = window._adminUserState;

  container.innerHTML = _buildAdminUsersShell(state);
  _renderTabContent(state);

  try {
    const res = await apiGet('getTeacherDirectory', {});
    if (res && res.success) {
      state.pendingUsers = res.pending || [];
      state.teachers = res.teachers || [];
      state.schools = res.schools || [];
      _renderTabContent(state);
    }
  } catch (err) {
    console.warn('Gagal memuatkan direktori guru:', err);
  }
};

function _buildAdminUsersShell(state) {
  return `
    <div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-6xl mx-auto">
      
      <!-- 1. Header Section -->
      <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-outline-variant/20 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div class="flex flex-col gap-1 max-w-2xl">
          <div class="flex items-center gap-2 text-primary text-label-sm font-semibold">
            <span class="material-symbols-outlined text-[18px]">verified_user</span>
            <span class="tracking-wide uppercase">Modul Kawalan RBAC & Direktori</span>
          </div>
          <h1 class="font-headline text-headline-xl text-on-surface tracking-tight font-bold">
            Pengurusan Akses Guru & Direktori
          </h1>
          <p class="text-body-md text-secondary leading-relaxed">
            Pusat kelulusan akaun guru kerjaya baharu dan direktori 42 buah sekolah kerajaan di bawah naungan Jabatan Sekolah-Sekolah.
          </p>
        </div>

        <div class="flex items-center gap-3 bg-surface-container-low p-2 rounded-xl flex-shrink-0">
          <div class="flex items-center gap-2.5 px-3 py-1.5 bg-surface-container-lowest rounded-lg shadow-xs">
            <span class="material-symbols-outlined text-primary text-[24px]">group</span>
            <div class="flex flex-col">
              <span class="font-headline text-headline-md font-bold leading-none text-on-surface" id="stat-active-teachers">${state.teachers.length || 148}</span>
              <span class="text-[11px] text-secondary font-semibold">Guru Aktif</span>
            </div>
          </div>
          <div class="flex items-center gap-2.5 px-3 py-1.5 bg-surface-container-lowest rounded-lg shadow-xs">
            <span class="material-symbols-outlined text-tertiary text-[24px]">domain</span>
            <div class="flex flex-col">
              <span class="font-headline text-headline-md font-bold leading-none text-on-surface">42</span>
              <span class="text-[11px] text-secondary font-semibold">Sekolah</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Tab Navigation -->
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button onclick="adminUserSwitchTab('pending')" 
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-label-md font-semibold transition-all ${state.tab === 'pending' ? 'bg-primary text-on-primary shadow-xs' : 'bg-surface-container-lowest text-secondary hover:bg-surface-container-low'}">
          <span class="material-symbols-outlined text-[18px]">pending_actions</span>
          <span>Permohonan Menunggu</span>
          <span id="tab-pending-badge" class="ml-1 px-2 py-0.5 rounded-full ${state.tab === 'pending' ? 'bg-error text-white' : 'bg-error-container text-error'} text-[11px] font-bold">
            ${state.pendingUsers.length}
          </span>
        </button>

        <button onclick="adminUserSwitchTab('teachers')" 
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-label-md font-semibold transition-all ${state.tab === 'teachers' ? 'bg-primary text-on-primary shadow-xs' : 'bg-surface-container-lowest text-secondary hover:bg-surface-container-low'}">
          <span class="material-symbols-outlined text-[18px]">badge</span>
          <span>Senarai Guru Kerjaya</span>
        </button>

        <button onclick="adminUserSwitchTab('schools')" 
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-label-md font-semibold transition-all ${state.tab === 'schools' ? 'bg-primary text-on-primary shadow-xs' : 'bg-surface-container-lowest text-secondary hover:bg-surface-container-low'}">
          <span class="material-symbols-outlined text-[18px]">domain</span>
          <span>Direktori 42 Sekolah</span>
        </button>
      </div>

      <!-- 3. Dynamic Tab Content -->
      <div id="admin-user-tab-content" class="flex flex-col gap-4">
        <!-- Injected by _renderTabContent() -->
      </div>

    </div>
  `;
}

function _renderTabContent(state) {
  const container = document.getElementById('admin-user-tab-content');
  if (!container) return;

  const badge = document.getElementById('tab-pending-badge');
  if (badge) badge.textContent = state.pendingUsers.length;

  if (state.tab === 'pending') {
    _renderPendingTab(container, state);
  } else if (state.tab === 'teachers') {
    _renderTeachersTab(container, state);
  } else {
    _renderSchoolsTab(container, state);
  }
}

function _renderPendingTab(container, state) {
  const pending = state.pendingUsers || [];

  if (pending.length === 0) {
    container.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/20">
        <div class="w-14 h-14 mx-auto mb-2 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
          <span class="material-symbols-outlined text-[28px]">done_all</span>
        </div>
        <h3 class="font-headline text-headline-md text-on-surface font-semibold">Semua Permohonan Telah Disemak</h3>
        <p class="text-body-md text-secondary mt-1">Tiada permohonan guru baharu yang sedang menunggu kelulusan.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${pending.map(p => {
        const id = p.id || p.email;
        const nama = escapeHtml(p.nama || 'Guru Pemohon');
        const email = escapeHtml(p.email || '');
        const sekolah = escapeHtml(p.sekolah || 'Sekolah');
        const tarikh = timeAgo(p.tarikh_mohon || p.created_at || new Date());

        return `
          <div class="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/20 flex flex-col justify-between gap-4">
            <div class="flex flex-col gap-2">
              <div class="flex items-start justify-between gap-2">
                <span class="px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-tertiary-fixed text-on-tertiary-fixed">
                  Permohonan Baharu
                </span>
                <span class="text-[11px] text-secondary">${tarikh}</span>
              </div>
              <h4 class="font-headline text-headline-md font-bold text-on-surface leading-snug">${nama}</h4>
              <div class="flex flex-col text-body-sm text-secondary gap-0.5">
                <span class="flex items-center gap-1 font-medium text-on-surface">
                  <span class="material-symbols-outlined text-[16px] text-primary">school</span>
                  <span>${sekolah}</span>
                </span>
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">mail</span>
                  <span class="truncate">${email}</span>
                </span>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-outline-variant/20">
              <button onclick="adminUserApprove('${id}')" 
                class="py-2 rounded-xl bg-primary text-on-primary text-label-sm font-semibold flex items-center justify-center gap-1 shadow-xs hover:bg-primary-container active:scale-95 transition-all btn-press">
                <span class="material-symbols-outlined text-[16px]">check</span>
                <span>Luluskan</span>
              </button>
              <button onclick="adminUserReject('${id}')" 
                class="py-2 rounded-xl bg-error-container/30 hover:bg-error-container text-error text-label-sm font-semibold flex items-center justify-center gap-1 active:scale-95 transition-all btn-press">
                <span class="material-symbols-outlined text-[16px]">close</span>
                <span>Tolak</span>
              </button>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function _renderTeachersTab(container, state) {
  const teachers = state.teachers || [];
  container.innerHTML = `
    <div class="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/20 overflow-hidden">
      <div class="p-4 bg-surface-container-low flex items-center justify-between">
        <h3 class="font-headline text-title-sm text-on-surface font-bold">Senarai Guru Kerjaya Berdaftar (${teachers.length})</h3>
        <button onclick="adminExportReport()" class="text-label-sm font-semibold text-primary flex items-center gap-1 hover:underline">
          <span class="material-symbols-outlined text-[16px]">download</span>
          <span>Eksport CSV</span>
        </button>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-body-sm text-on-surface">
          <thead class="bg-surface-container text-label-sm font-semibold text-secondary uppercase text-[11px]">
            <tr>
              <th class="p-3.5 pl-4">Nama Guru</th>
              <th class="p-3.5">Emel Rasmi</th>
              <th class="p-3.5">Sekolah</th>
              <th class="p-3.5">Daerah</th>
              <th class="p-3.5 pr-4">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-outline-variant/20">
            ${teachers.length > 0 ? teachers.map(t => `
              <tr class="hover:bg-surface-container-low/50 transition-colors">
                <td class="p-3.5 pl-4 font-semibold text-on-surface">${escapeHtml(t.nama)}</td>
                <td class="p-3.5 font-mono text-[12px] text-secondary">${escapeHtml(t.email)}</td>
                <td class="p-3.5">${escapeHtml(t.sekolah)}</td>
                <td class="p-3.5 text-secondary">${escapeHtml(t.daerah || 'Brunei-Muara')}</td>
                <td class="p-3.5 pr-4">
                  <span class="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[11px] font-bold">Aktif</span>
                </td>
              </tr>
            `).join('') : `
              <tr><td colspan="5" class="p-6 text-center text-secondary">Tiada rekod guru.</td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function _renderSchoolsTab(container, state) {
  const schools = state.schools || [];
  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      ${schools.length > 0 ? schools.map(s => `
        <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/20 flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-[11px]">
            <span class="px-2 py-0.5 rounded bg-surface-container text-primary font-bold">${escapeHtml(s.kluster || 'Kluster 1')}</span>
            <span class="text-secondary font-mono">${escapeHtml(s.kod_sekolah || '')}</span>
          </div>
          <h4 class="font-headline text-body-lg font-bold text-on-surface">${escapeHtml(s.nama_sekolah)}</h4>
          <span class="text-body-sm text-secondary">${escapeHtml(s.daerah || 'Brunei-Muara')}</span>
        </div>
      `).join('') : `
        <div class="col-span-3 p-8 text-center text-secondary bg-surface-container-lowest rounded-2xl">
          Direktori 42 sekolah akan dipaparkan di sini.
        </div>
      `}
    </div>
  `;
}

window.adminUserSwitchTab = function(t) {
  if (window._adminUserState) {
    window._adminUserState.tab = t;
    const content = document.getElementById('app-content');
    if (content) window.renderAdminUsersPage(content);
  }
};

window.adminUserApprove = async function(id) {
  showToast('Meluluskan permohonan capaian...', 'info', 1500);
  try {
    const res = await apiPost('approveUser', { id: id });
    if (res && res.success) {
      showToast('Permohonan berjaya diluluskan!', 'success');
      const content = document.getElementById('app-content');
      if (content) window.renderAdminUsersPage(content);
    } else {
      showToast(res.message || 'Gagal meluluskan.', 'error');
    }
  } catch (err) {
    showToast('Ralat rangkaian.', 'error');
  }
};

window.adminUserReject = function(id) {
  showModal('Tolak Permohonan', 'Adakah anda pasti mahu menolak permohonan capaian ini?', [
    { label: 'Batal', onclick: 'hideModal()' },
    { label: 'Tolak Permohonan', danger: true, onclick: `adminUserConfirmReject('${id}')` }
  ]);
};

window.adminUserConfirmReject = async function(id) {
  hideModal();
  showToast('Menolak permohonan...', 'info', 1500);
  try {
    const res = await apiPost('rejectUser', { id: id });
    if (res && res.success) {
      showToast('Permohonan telah ditolak.', 'info');
      const content = document.getElementById('app-content');
      if (content) window.renderAdminUsersPage(content);
    }
  } catch (err) {
    showToast('Ralat rangkaian.', 'error');
  }
};
