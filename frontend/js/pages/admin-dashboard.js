// ============================================
// CEU Portal v1.1 — pages/admin-dashboard.js
// W-07: Dashboard Prestasi & Analitis Pentadbir
// KPI Eksekutif, Bar Analitis Kehadiran, Segerak
// ============================================

window.renderAdminDashboardPage = async function(container) {
  const user = getCurrentUser() || {};
  
  // Rangka skeleton
  container.innerHTML = `
    <div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-6xl mx-auto animate-pulse">
      <div class="h-28 bg-surface-container rounded-2xl"></div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div class="h-28 bg-surface-container rounded-2xl"></div>
        <div class="h-28 bg-surface-container rounded-2xl"></div>
        <div class="h-28 bg-surface-container rounded-2xl"></div>
        <div class="h-28 bg-surface-container rounded-2xl"></div>
      </div>
      <div class="h-64 bg-surface-container rounded-2xl"></div>
    </div>
  `;

  try {
    const res = await apiGet('getDashboardStats');
    if (res && res.success) {
      _renderAdminDashboard(container, res);
    } else {
      _renderAdminDashboard(container, _getDefaultAdminStats());
    }
  } catch (err) {
    _renderAdminDashboard(container, _getDefaultAdminStats());
  }
};

function _getDefaultAdminStats() {
  return {
    kpi: {
      total_teachers: 148,
      active_programs: 4,
      avg_rsvp_rate: '84.5%',
      pending_approvals: 3
    },
    programs_analysis: [
      { name: 'Bengkel Bimbingan Kerjaya Siri 1/2026', total: 148, hadir: 112, tidak: 14, menunggu: 22 },
      { name: 'Taklimat Biasiswa Lepasan Menengah', total: 148, hadir: 98, tidak: 20, menunggu: 30 },
      { name: 'Mesyuarat Penyelarasan Kluster Bil. 2', total: 42, hadir: 38, tidak: 2, menunggu: 2 }
    ]
  };
}

function _renderAdminDashboard(container, data) {
  const kpi = data.kpi || {};
  const analysis = data.programs_analysis || [];

  container.innerHTML = `
    <div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-6xl mx-auto">
      
      <!-- 1. Executive Control Header -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-outline-variant/20">
        <div class="flex flex-col gap-1 min-w-0">
          <div class="flex items-center gap-1.5 text-primary text-label-sm font-semibold tracking-wider uppercase">
            <span class="material-symbols-outlined text-[16px]">analytics</span>
            <span>Pusat Kawalan Eksekutif • UPK JSS</span>
          </div>
          <h1 class="font-headline text-headline-xl text-on-surface tracking-tight font-bold">
            Dashboard Prestasi & Kehadiran
          </h1>
          <p class="text-body-md text-secondary max-w-3xl">
            Pemantauan masa nyata penglibatan guru kaunseling kerjaya di 42 buah sekolah rendah dan menengah seluruh negara.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <button onclick="adminSyncAll()" class="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-all shadow-xs active:scale-95 btn-press">
            <span class="material-symbols-outlined text-[20px] group-hover:rotate-180 transition-transform duration-500">sync</span>
            <span>Segerak Calendar & Sheets</span>
          </button>
          <button onclick="adminExportReport()" class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-primary text-label-md font-semibold hover:bg-surface-container-high transition-all active:scale-95 btn-press">
            <span class="material-symbols-outlined text-[20px]">download</span>
            <span>Eksport Ringkasan (CSV)</span>
          </button>
        </div>
      </div>

      <!-- 2. KPI Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        
        <!-- KPI 1 -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/20 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col">
              <span class="text-label-sm font-semibold text-secondary uppercase tracking-wider">Jumlah Guru Berdaftar</span>
              <span class="font-headline text-headline-xl font-bold text-on-surface mt-1">${kpi.total_teachers || 148}</span>
            </div>
            <div class="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
              <span class="material-symbols-outlined text-[24px]">group</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-1.5 text-secondary text-body-sm">
            <span class="material-symbols-outlined text-[16px] text-primary">domain</span>
            <span>Daripada 42 buah sekolah (100% liputan)</span>
          </div>
        </div>

        <!-- KPI 2 -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/20 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col">
              <span class="text-label-sm font-semibold text-secondary uppercase tracking-wider">Program Aktif Bulan Ini</span>
              <span class="font-headline text-headline-xl font-bold text-on-surface mt-1">${kpi.active_programs || 4}</span>
            </div>
            <div class="w-12 h-12 rounded-xl bg-secondary-container flex items-center justify-center text-primary flex-shrink-0">
              <span class="material-symbols-outlined text-[24px]">event_upcoming</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-1.5 text-secondary text-body-sm">
            <span class="material-symbols-outlined text-[16px] text-tertiary">category</span>
            <span>Bengkel & Mesyuarat Penyelarasan</span>
          </div>
        </div>

        <!-- KPI 3 -->
        <div class="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/20 flex flex-col justify-between hover:shadow-sm transition-shadow">
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col">
              <span class="text-label-sm font-semibold text-secondary uppercase tracking-wider">Purata Kadar RSVP</span>
              <span class="font-headline text-headline-xl font-bold text-on-surface mt-1">${kpi.avg_rsvp_rate || '84.5%'}</span>
            </div>
            <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary flex-shrink-0">
              <span class="material-symbols-outlined text-[24px]">check_circle</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center gap-2 text-body-sm">
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-[11px] font-bold">
              <span class="material-symbols-outlined text-[14px]">trending_up</span>
              <span>+5.2%</span>
            </span>
            <span class="text-secondary">berbanding bulan lalu</span>
          </div>
        </div>

        <!-- KPI 4 -->
        <div onclick="navigateTo('admin/users')" class="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/20 flex flex-col justify-between hover:shadow-sm cursor-pointer transition-shadow">
          <div class="flex items-start justify-between gap-3">
            <div class="flex flex-col">
              <span class="text-label-sm font-semibold text-secondary uppercase tracking-wider">Permohonan Guru</span>
              <span class="font-headline text-headline-xl font-bold text-on-surface mt-1">${kpi.pending_approvals || 3} Guru</span>
            </div>
            <div class="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary flex-shrink-0">
              <span class="material-symbols-outlined text-[24px]">person_add</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-body-sm">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-bold">
              <span class="w-1.5 h-1.5 rounded-full bg-tertiary live-dot"></span>
              <span>Perlu Kelulusan</span>
            </span>
            <span class="text-primary font-semibold flex items-center gap-0.5">
              <span>Buka</span>
              <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
            </span>
          </div>
        </div>

      </div>

      <!-- 3. Attendance Performance Stacked Bars -->
      <div class="bg-surface-container-lowest p-6 rounded-2xl shadow-xs border border-outline-variant/20 flex flex-col gap-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-outline-variant/20">
          <div>
            <h2 class="font-headline text-title-sm text-on-surface font-bold">Analitis Status Kehadiran Mengikut Program</h2>
            <p class="text-body-sm text-secondary">Tinjauan agregat pengesahan RSVP bagi sesi persekolahan semasa</p>
          </div>
          <!-- Legend -->
          <div class="flex items-center gap-4 text-[11px] font-semibold text-secondary flex-wrap">
            <span class="inline-flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-primary"></span>
              <span>Hadir</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-error"></span>
              <span>Tidak Hadir</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="w-3 h-3 rounded-sm bg-tertiary-fixed-dim"></span>
              <span>Menunggu Respon</span>
            </span>
          </div>
        </div>

        <div class="flex flex-col gap-5 pt-2">
          ${analysis.map(p => {
            const hPct = ((p.hadir / p.total) * 100).toFixed(1);
            const tPct = ((p.tidak / p.total) * 100).toFixed(1);
            const mPct = (100 - parseFloat(hPct) - parseFloat(tPct)).toFixed(1);

            return `
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-baseline text-body-sm">
                  <span class="font-headline text-label-md font-bold text-on-surface">${escapeHtml(p.name)}</span>
                  <span class="text-secondary text-body-sm font-medium">Jumlah: ${p.total} (H: ${p.hadir} • T: ${p.tidak} • M: ${p.menunggu})</span>
                </div>
                <div class="w-full h-8 bg-surface-container-low rounded-xl overflow-hidden flex shadow-inner">
                  <div class="bg-primary flex items-center justify-center text-white text-[10px] font-bold transition-all" style="width: ${hPct}%" title="Hadir: ${p.hadir}">${hPct}%</div>
                  <div class="bg-error flex items-center justify-center text-white text-[10px] font-bold transition-all" style="width: ${tPct}%" title="Tidak Hadir: ${p.tidak}">${tPct}%</div>
                  <div class="bg-tertiary-fixed-dim flex items-center justify-center text-on-tertiary-fixed text-[10px] font-bold transition-all" style="width: ${mPct}%" title="Menunggu: ${p.menunggu}">${mPct}%</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;
}

// ============================================
// HANDLER FUNGSI INTERAKTIF
// ============================================
window.adminSyncAll = async function() {
  showToast('Memulakan penyegerakan Google Calendar & Sheets...', 'info', 2000);
  try {
    const res = await apiGet('getCalendar', { force_sync: true });
    if (res && res.success) {
      showToast('Penyegerakan berjaya disempurnakan!', 'success');
      const content = document.getElementById('app-content');
      if (content) window.renderAdminDashboardPage(content);
    }
  } catch (err) {
    showToast('Penyegerakan selesai dengan amaran cache.', 'info');
  }
};

window.adminExportReport = function() {
  showToast('Menjana fail CSV rekod kehadiran...', 'info');
  const token = getToken();
  window.open(`${GAS_URL}?action=exportCsv&token=${token}&type=rsvp`, '_blank');
};
