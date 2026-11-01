// ============================================
// CEU Portal v1.1 — pages/admin-docs.js
// W-09: Pengurusan Memo, Minit & Dokumen Pentadbir
// Terbit Dokumen Baharu & Integrasi Google Drive
// ============================================

window.renderAdminDocsPage = async function(container) {
  window._adminDocState = window._adminDocState || {
    docs: [],
    searchQuery: '',
    category: 'Semua'
  };

  const state = window._adminDocState;

  container.innerHTML = _buildAdminDocsShell(state);
  _renderAdminDocsList(state);

  try {
    const res = await apiGet('getDocuments', {});
    if (res && res.success && res.documents) {
      state.docs = res.documents;
      _renderAdminDocsList(state);
    }
  } catch (err) {
    console.warn('Gagal memuatkan dokumen pentadbir:', err);
  }
};

function _buildAdminDocsShell(state) {
  return `
    <div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-6xl mx-auto">
      
      <!-- 1. Header & Drive Info Banner -->
      <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-outline-variant/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex flex-col gap-1 max-w-2xl">
          <div class="flex items-center gap-2 text-primary text-label-sm font-semibold">
            <span class="material-symbols-outlined text-[18px]">cloud_sync</span>
            <span class="tracking-wide uppercase">Google Drive Shared Folder</span>
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 live-dot"></span>
            <span class="text-green-700 font-bold">Sinkronisasi Penuh</span>
          </div>
          <h1 class="font-headline text-headline-xl text-on-surface tracking-tight font-bold">
            Pengurusan Memo & Dokumen Rasmi
          </h1>
          <p class="text-body-md text-secondary leading-relaxed">
            Terbit dan edarkan memo rasmi, minit mesyuarat atau rancangan tahunan kepada guru-guru pendidikan kerjaya.
          </p>
        </div>

        <div class="flex items-center gap-2.5 flex-shrink-0">
          <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer" 
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container text-primary text-label-md font-semibold hover:bg-surface-container-high transition-all btn-press">
            <span class="material-symbols-outlined text-[20px]">folder</span>
            <span>Buka Folder Drive</span>
          </a>
        </div>
      </div>

      <!-- 2. Split Layout: Senarai Dokumen (7 cols) + Borang Terbit Dokumen (5 cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left: Senarai Dokumen (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-3">
          <div class="bg-surface-container-lowest rounded-2xl p-3 shadow-xs border border-outline-variant/20 flex items-center gap-2">
            <span class="material-symbols-outlined text-secondary text-[20px] ml-2">search</span>
            <input oninput="adminDocHandleSearch(this.value)" 
              class="w-full bg-transparent text-body-md text-on-surface outline-none" 
              placeholder="Cari tajuk dokumen, no. rujukan..." 
              value="${escapeHtml(state.searchQuery)}">
          </div>

          <div id="admin-docs-list-container" class="flex flex-col gap-3">
            <!-- Injected by _renderAdminDocsList() -->
          </div>
        </div>

        <!-- Right: Borang Terbit Dokumen Baharu (5 cols) -->
        <div class="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-xs border border-outline-variant/20 sticky top-20">
          <div class="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
            <h3 class="font-headline text-title-sm text-on-surface font-bold flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-[22px]">post_add</span>
              <span>Terbit Dokumen / Memo Baharu</span>
            </h3>
          </div>

          <form id="admin-doc-form" onsubmit="event.preventDefault(); adminDocSubmitForm();" class="flex flex-col gap-3.5">
            <div>
              <label class="text-label-sm font-semibold text-on-surface block mb-1">Tajuk Dokumen / Memo *</label>
              <input type="text" id="doc-title" required placeholder="Cth: Taklimat Program Pameran Kerjaya 2026" 
                class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none focus:border-primary transition-all">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-label-sm font-semibold text-on-surface block mb-1">No. Rujukan Rasmi *</label>
                <input type="text" id="doc-ref" required placeholder="UPK/JSS/05/2026" 
                  class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none">
              </div>

              <div>
                <label class="text-label-sm font-semibold text-on-surface block mb-1">Kategori *</label>
                <select id="doc-category" required class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none">
                  <option value="Memo">Memo Rasmi</option>
                  <option value="Minit">Minit Mesyuarat</option>
                  <option value="Rancangan">Rancangan Tahunan</option>
                  <option value="Laporan">Laporan Tahunan</option>
                  <option value="Panduan">Panduan & Bahan</option>
                </select>
              </div>
            </div>

            <div>
              <label class="text-label-sm font-semibold text-on-surface block mb-1">Pautan Google Drive (URL) *</label>
              <input type="url" id="doc-drive-link" required placeholder="https://drive.google.com/file/d/..." 
                class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none focus:border-primary transition-all">
            </div>

            <div>
              <label class="text-label-sm font-semibold text-on-surface block mb-1">Ringkasan / Penerangan</label>
              <textarea id="doc-desc" rows="3" placeholder="Penerangan ringkas mengenai intipati memo atau dokumen ini..." 
                class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none"></textarea>
            </div>

            <div class="pt-2">
              <button type="submit" id="btn-save-doc" 
                class="w-full h-11 rounded-xl bg-primary text-on-primary text-label-md font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all btn-press">
                <span class="material-symbols-outlined text-[20px]">publish</span>
                <span>Terbit Dokumen Sekarang</span>
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  `;
}

function _renderAdminDocsList(state) {
  const container = document.getElementById('admin-docs-list-container');
  if (!container) return;

  const q = (state.searchQuery || '').toLowerCase();
  const filtered = (state.docs || []).filter(d => {
    return !q || (d.tajuk || '').toLowerCase().includes(q) || (d.no_rujukan || '').toLowerCase().includes(q);
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/20">
        <p class="text-body-md text-secondary">Tiada dokumen ditemui.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(d => {
    const id = d.id || '';
    const tajuk = escapeHtml(d.tajuk);
    const noRuj = escapeHtml(d.no_rujukan || 'UPK/2026');
    const tarikh = formatDate(d.tarikh || d.created_at || new Date());
    const driveLink = d.drive_link || d.url || '#';
    const kategori = (d.kategori || 'Memo').toUpperCase();

    return `
      <article class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/20 flex flex-col gap-2 hover:shadow-sm transition-all">
        <div class="flex items-center justify-between gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary text-[11px] font-bold uppercase">
            ${kategori}
          </span>
          <span class="text-body-sm text-secondary font-mono">${noRuj} • ${tarikh}</span>
        </div>

        <h3 class="font-headline text-headline-md font-bold text-on-surface leading-snug">${tajuk}</h3>

        <div class="flex items-center justify-between pt-2 border-t border-outline-variant/20 mt-1">
          <a href="${driveLink}" target="_blank" rel="noopener noreferrer" 
            class="text-label-sm font-semibold text-primary hover:text-primary-container flex items-center gap-1">
            <span class="material-symbols-outlined text-[16px]">open_in_new</span>
            <span>Buka di Drive</span>
          </a>
          <span class="text-[11px] text-secondary">Disahkan UPK</span>
        </div>
      </article>
    `;
  }).join('');
}

window.adminDocHandleSearch = function(val) {
  if (window._adminDocState) {
    window._adminDocState.searchQuery = val;
    _renderAdminDocsList(window._adminDocState);
  }
};

window.adminDocSubmitForm = async function() {
  const data = {
    tajuk: document.getElementById('doc-title').value.trim(),
    no_rujukan: document.getElementById('doc-ref').value.trim(),
    kategori: document.getElementById('doc-category').value,
    drive_link: document.getElementById('doc-drive-link').value.trim(),
    penerangan: document.getElementById('doc-desc').value.trim(),
    tarikh: new Date().toISOString()
  };

  const btn = document.getElementById('btn-save-doc');
  if (btn) btn.disabled = true;

  showToast('Menerbitkan dokumen...', 'info', 2000);

  try {
    const res = await apiPost('createDocument', data);
    if (res && res.success) {
      showToast('Dokumen berjaya diterbitkan!', 'success');
      document.getElementById('admin-doc-form').reset();
      const content = document.getElementById('app-content');
      if (content) window.renderAdminDocsPage(content);
    } else {
      showToast(res.message || 'Gagal menerbitkan dokumen.', 'error');
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    showToast('Ralat rangkaian.', 'error');
    if (btn) btn.disabled = false;
  }
};
