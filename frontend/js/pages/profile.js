// ============================================
// CEU Portal v1.1 — pages/profile.js
// Profil Guru Kerjaya, Butiran Akaun & Tetapan
// ============================================

window.renderProfilePage = function(container) {
  const user = getCurrentUser() || {};
  const userName = escapeHtml(user.nama || user.email || 'Guru Kerjaya');
  const userEmail = escapeHtml(user.email || '');
  const userSchool = escapeHtml(user.sekolah || 'Kementerian Pendidikan');
  const userDaerah = escapeHtml(user.daerah || 'Brunei-Muara');
  const userRole = (user.peranan || 'guru').toUpperCase();
  const phone = escapeHtml(user.telefon || '+673 8xxxxxx');

  container.innerHTML = `
    <div class="flex flex-col w-full px-4 sm:px-6 pb-24 gap-4 max-w-2xl mx-auto">
      
      <!-- Top Profile Header Card -->
      <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-outline-variant/20 flex flex-col items-center text-center gap-3 mt-2">
        <div class="relative w-24 h-24 rounded-full bg-primary-container text-white flex items-center justify-center font-headline text-3xl font-bold shadow-md">
          ${userName.charAt(0).toUpperCase()}
          <span class="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white" title="Akaun Aktif">
            <span class="material-symbols-outlined text-[14px]">check</span>
          </span>
        </div>

        <div class="flex flex-col">
          <h2 class="font-headline text-headline-md font-bold text-on-surface">${userName}</h2>
          <span class="text-body-md text-secondary mt-0.5">${userEmail}</span>
          <div class="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-primary text-label-sm font-semibold mx-auto">
            <span class="material-symbols-outlined text-[16px]">verified_user</span>
            <span>${userRole === 'ADMIN' ? 'Pegawai Unit UPK (Pentadbir)' : 'Guru Pendidikan Kerjaya'}</span>
          </div>
        </div>
      </div>

      <!-- Detail Information Section -->
      <div class="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/20 flex flex-col gap-4">
        <h3 class="font-headline text-title-sm text-on-surface font-semibold flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">badge</span>
          <span>Maklumat Penempatan & Khidmat</span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div class="p-3 bg-surface-container-low rounded-xl flex flex-col">
            <span class="text-[11px] text-secondary font-semibold uppercase">Institusi / Sekolah</span>
            <span class="text-body-md text-on-surface font-semibold mt-0.5">${userSchool}</span>
          </div>

          <div class="p-3 bg-surface-container-low rounded-xl flex flex-col">
            <span class="text-[11px] text-secondary font-semibold uppercase">Daerah Persekolahan</span>
            <span class="text-body-md text-on-surface font-semibold mt-0.5">${userDaerah}</span>
          </div>

          <div class="p-3 bg-surface-container-low rounded-xl flex flex-col">
            <span class="text-[11px] text-secondary font-semibold uppercase">Status Akaun</span>
            <span class="text-body-md text-green-700 font-semibold mt-0.5 flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Aktif & Disahkan</span>
            </span>
          </div>

          <div class="p-3 bg-surface-container-low rounded-xl flex flex-col">
            <span class="text-[11px] text-secondary font-semibold uppercase">Portal Versi</span>
            <span class="text-body-md text-on-surface font-semibold mt-0.5 font-mono">v${APP_VERSION} (Gov.bn)</span>
          </div>
        </div>
      </div>

      <!-- Integrations & Actions -->
      <div class="bg-surface-container-lowest rounded-2xl p-5 shadow-xs border border-outline-variant/20 flex flex-col gap-3">
        <h3 class="font-headline text-title-sm text-on-surface font-semibold flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">sync</span>
          <span>Penyegerakan Kalendar</span>
        </h3>

        <div class="flex items-center justify-between p-3.5 bg-surface-container-low rounded-xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[22px]">calendar_today</span>
            </div>
            <div class="flex flex-col">
              <span class="text-label-md font-semibold text-on-surface">Google Calendar Unit</span>
              <span class="text-body-sm text-secondary">Sinkronisasi automatik acara UPK</span>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-green-100 text-green-800 text-[11px] font-bold">Tersambung</span>
        </div>
      </div>

      <!-- Logout Action -->
      <div class="pt-2">
        <button onclick="logout()" 
          class="w-full h-12 rounded-xl bg-error/10 hover:bg-error/20 text-error font-headline text-label-md font-semibold flex items-center justify-center gap-2 transition-colors btn-press">
          <span class="material-symbols-outlined text-[20px]">logout</span>
          <span>Log Keluar Sesi Ini</span>
        </button>
      </div>

    </div>
  `;
};
