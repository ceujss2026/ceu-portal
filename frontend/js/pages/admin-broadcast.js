// ============================================
// CEU Portal v1.1 — pages/admin-broadcast.js
// W-10: Hantar Hebahan Notifikasi Pentadbir
// Penggubah Emel Rasmi (BCC Batch 50) & Suapan Notifikasi
// ============================================

window.renderAdminBroadcastPage = async function(container) {
  window._adminBroadcastState = window._adminBroadcastState || {
    history: []
  };

  const state = window._adminBroadcastState;

  container.innerHTML = _buildAdminBroadcastShell(state);
  _renderBroadcastHistory(state);

  try {
    const res = await apiGet('getNotifications', {});
    if (res && res.success && res.notifications) {
      state.history = res.notifications;
      _renderBroadcastHistory(state);
    }
  } catch (err) {
    console.warn('Gagal memuatkan sejarah hebahan:', err);
  }
};

function _buildAdminBroadcastShell(state) {
  return `
    <div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-6xl mx-auto">
      
      <!-- 1. Header Section -->
      <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-outline-variant/20 flex flex-col gap-1">
        <div class="flex items-center gap-2 text-primary text-label-sm font-semibold">
          <span class="material-symbols-outlined text-[18px]">campaign</span>
          <span class="tracking-wide uppercase">Saluran Komunikasi Bersepadu</span>
        </div>
        <h1 class="font-headline text-headline-xl text-on-surface tracking-tight font-bold">
          Hantar Hebahan Notifikasi Rasmi
        </h1>
        <p class="text-body-md text-secondary leading-relaxed">
          Edarkan pemberitahuan segera atau hebahan rasmi kepada guru bimbingan kerjaya melalui peti emel rasmi (Google Mail BCC) dan suapan portal.
        </p>
      </div>

      <!-- 2. Split Layout: Borang Penggubah (7 cols) + Sejarah Hebahan (5 cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left: Borang Penggubah (7 cols) -->
        <div class="lg:col-span-7 bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-outline-variant/20 flex flex-col gap-4">
          <h2 class="font-headline text-title-sm text-on-surface font-bold flex items-center gap-2 pb-2 border-b border-outline-variant/20">
            <span class="material-symbols-outlined text-primary text-[22px]">edit_note</span>
            <span>Penggubah Mesej Hebahan</span>
          </h2>

          <form id="broadcast-form" onsubmit="event.preventDefault(); adminBroadcastSubmit();" class="flex flex-col gap-4">
            
            <!-- Sasaran Penerima & Keutamaan -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label class="text-label-sm font-semibold text-on-surface block mb-1">Sasaran Penerima *</label>
                <select id="bc-target" class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none">
                  <option value="all">Semua Guru Berdaftar (148)</option>
                  <option value="Kluster 1">Kluster 1 (Sekolah Menengah)</option>
                  <option value="Kluster 2">Kluster 2 (Sekolah Menengah)</option>
                  <option value="Kluster 3">Kluster 3 (Sekolah Rendah)</option>
                  <option value="Kluster 4">Kluster 4 (Sekolah Rendah)</option>
                </select>
              </div>

              <div>
                <label class="text-label-sm font-semibold text-on-surface block mb-1">Tahap Keutamaan *</label>
                <select id="bc-priority" class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none">
                  <option value="normal">Hebahan Biasa (Makluman)</option>
                  <option value="urgent">Segera / Tindakan Diperlukan</option>
                  <option value="perubahan">Perubahan Jadual</option>
                </select>
              </div>
            </div>

            <!-- Saluran Hebahan -->
            <div>
              <label class="text-label-sm font-semibold text-on-surface block mb-1.5">Saluran Penghantaran</label>
              <div class="flex items-center gap-4">
                <label class="flex items-center gap-2 cursor-pointer text-body-md text-on-surface font-medium">
                  <input type="checkbox" id="bc-channel-email" checked class="rounded w-4 h-4 text-primary">
                  <span>Emel Rasmi (GmailApp BCC)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer text-body-md text-on-surface font-medium">
                  <input type="checkbox" id="bc-channel-portal" checked class="rounded w-4 h-4 text-primary">
                  <span>Suapan Aplikasi CEU</span>
                </label>
              </div>
            </div>

            <!-- Tajuk -->
            <div>
              <label class="text-label-sm font-semibold text-on-surface block mb-1">Tajuk Mesej *</label>
              <input type="text" id="bc-title" required placeholder="Cth: Peringatan Tarikh Tutup RSVP Siri 1/2026" 
                class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none focus:border-primary transition-all">
            </div>

            <!-- Kandungan Mesej -->
            <div>
              <label class="text-label-sm font-semibold text-on-surface block mb-1">Kandungan Hebahan *</label>
              <textarea id="bc-message" rows="5" required placeholder="Tulis mesej hebahan rasmi di sini. Guru akan menerima teks ini pada portal dan peti emel..." 
                class="w-full p-3 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none focus:border-primary transition-all leading-relaxed"></textarea>
            </div>

            <!-- Pautan URL Tindakan (Pilihan) -->
            <div>
              <label class="text-label-sm font-semibold text-on-surface block mb-1">Pautan URL Tindakan (Pilihan)</label>
              <input type="url" id="bc-action-url" placeholder="https://drive.google.com/... atau kosongkan" 
                class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none">
            </div>

            <div class="pt-2">
              <button type="submit" id="btn-send-bc" 
                class="w-full h-12 rounded-xl bg-primary text-on-primary text-label-md font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all btn-press">
                <span class="material-symbols-outlined text-[20px]">send</span>
                <span>Hantar Hebahan Kepada Guru</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Right: Sejarah Hebahan Terdahulu (5 cols) -->
        <div class="lg:col-span-5 flex flex-col gap-3">
          <h2 class="font-headline text-title-sm text-on-surface font-bold pb-1">Sejarah Hebahan Terdahulu</h2>
          <div id="broadcast-history-container" class="flex flex-col gap-3">
            <!-- Injected by _renderBroadcastHistory() -->
          </div>
        </div>

      </div>

    </div>
  `;
}

function _renderBroadcastHistory(state) {
  const container = document.getElementById('broadcast-history-container');
  if (!container) return;

  const history = state.history || [];
  if (history.length === 0) {
    container.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl p-6 text-center border border-outline-variant/20">
        <p class="text-body-md text-secondary">Tiada rekod hebahan terdahulu.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = history.slice(0, 5).map(h => {
    const tajuk = escapeHtml(h.tajuk);
    const tarikh = timeAgo(h.created_at || h.tarikh || new Date());
    const isUrgent = (h.kategori || '').toLowerCase() === 'segera';

    return `
      <div class="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/20 flex flex-col gap-1.5">
        <div class="flex items-center justify-between text-[11px]">
          <span class="px-2 py-0.5 rounded font-bold ${isUrgent ? 'bg-error-container text-error' : 'bg-surface-container text-primary'}">
            ${isUrgent ? 'SEGERA' : 'BIASA'}
          </span>
          <span class="text-secondary font-medium">${tarikh}</span>
        </div>
        <h4 class="font-headline text-label-md font-bold text-on-surface">${tajuk}</h4>
        <p class="text-body-sm text-secondary line-clamp-2">${escapeHtml(h.mesej || h.kandungan || '')}</p>
      </div>
    `;
  }).join('');
}

window.adminBroadcastSubmit = async function() {
  const title = document.getElementById('bc-title').value.trim();
  const message = document.getElementById('bc-message').value.trim();
  const priority = document.getElementById('bc-priority').value;
  const target = document.getElementById('bc-target').value;
  const sendEmail = document.getElementById('bc-channel-email').checked;

  if (!title || !message) {
    showToast('Sila lengkapkan tajuk dan kandungan mesej.', 'warning');
    return;
  }

  showModal('Sahkan Penghantaran Hebahan', `Adakah anda pasti mahu menyiarkan hebahan ini kepada ${target === 'all' ? 'semua guru berdaftar' : target}?`, [
    { label: 'Batal', onclick: 'hideModal()' },
    { label: 'Ya, Hantar Sekarang', primary: true, onclick: 'adminBroadcastConfirmSend()' }
  ]);
};

window.adminBroadcastConfirmSend = async function() {
  hideModal();
  const btn = document.getElementById('btn-send-bc');
  if (btn) btn.disabled = true;

  showToast('Menghantar hebahan ber-batch...', 'info', 2500);

  const payload = {
    tajuk: document.getElementById('bc-title').value.trim(),
    mesej: document.getElementById('bc-message').value.trim(),
    kategori: document.getElementById('bc-priority').value,
    target: document.getElementById('bc-target').value,
    send_email: document.getElementById('bc-channel-email').checked,
    action_url: document.getElementById('bc-action-url').value.trim()
  };

  try {
    const res = await apiPost('sendBroadcast', payload);
    if (res && res.success) {
      showToast('Hebahan berjaya dihantar kepada guru!', 'success');
      document.getElementById('broadcast-form').reset();
      const content = document.getElementById('app-content');
      if (content) window.renderAdminBroadcastPage(content);
    } else {
      showToast(res.message || 'Gagal menghantar hebahan.', 'error');
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    showToast('Ralat rangkaian.', 'error');
    if (btn) btn.disabled = false;
  }
};
