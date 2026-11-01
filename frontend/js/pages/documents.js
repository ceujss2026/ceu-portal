// ============================================
// CEU Portal v1.1 — pages/documents.js
// W-05: Hab Dokumen, Memo & Minit Mesyuarat
// Carian Dinamik, Penapisan & Pautan Google Drive
// ============================================

window.renderDocumentsPage = async function(container) {
  window._docState = window._docState || {
    searchQuery: '',
    category: 'all',
    documents: []
  };

  const state = window._docState;

  // Render rangka awal
  container.innerHTML = _buildDocShell(state);
  _renderDocList(state);

  // Ambil dokumen dari API
  try {
    const res = await apiGet('getDocuments', {});
    if (res && res.success && res.documents) {
      state.documents = res.documents;
      _renderDocList(state);
    }
  } catch (err) {
    console.warn('Gagal memuatkan dokumen:', err);
  }
};

function _buildDocShell(state) {
  return `
    <div class="flex flex-col w-full px-4 sm:px-6 pb-24 gap-4 max-w-3xl mx-auto">
      
      <!-- 1. Search Bar & Filter Area -->
      <div class="flex flex-col gap-2.5 pt-2">
        <div class="relative w-full flex items-center">
          <span class="material-symbols-outlined absolute left-3.5 text-secondary pointer-events-none text-[20px]">search</span>
          <input id="doc-search-input" 
            oninput="docHandleSearch(this.value)"
            class="w-full h-12 pl-10 pr-10 bg-surface-container-lowest text-on-surface text-body-md rounded-xl shadow-xs border border-outline-variant/30 outline-none placeholder:text-outline focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" 
            placeholder="Cari No. Rujukan (UPK/04/2026), tajuk, memo..." 
            type="search"
            value="${escapeHtml(state.searchQuery)}"/>
          ${state.searchQuery ? `
            <button onclick="docClearSearch()" class="absolute right-3 text-secondary hover:text-on-surface transition-colors">
              <span class="material-symbols-outlined text-[18px]">cancel</span>
            </button>
          ` : ''}
        </div>

        <!-- 2. Category Filter Chips -->
        <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button onclick="docSetCategory('all')" 
            class="doc-chip flex-shrink-0 px-3.5 py-1.5 rounded-full text-label-sm ${state.category === 'all' ? 'bg-primary-container text-on-primary font-bold shadow-xs' : 'bg-surface-container-lowest text-secondary border border-outline-variant/20'} hover:opacity-90 transition-all flex items-center gap-1.5">
            <span>Semua</span>
            <span id="doc-count-all" class="px-1.5 py-0.2 ${state.category === 'all' ? 'bg-white/20' : 'bg-surface-container'} rounded-full text-[10px]">...</span>
          </button>

          <button onclick="docSetCategory('memo')" 
            class="doc-chip flex-shrink-0 px-3.5 py-1.5 rounded-full text-label-sm ${state.category === 'memo' ? 'bg-primary-container text-on-primary font-bold shadow-xs' : 'bg-surface-container-lowest text-secondary border border-outline-variant/20'} hover:opacity-90 transition-all flex items-center gap-1.5">
            <span>Memo Rasmi</span>
            <span id="doc-count-memo" class="px-1.5 py-0.2 ${state.category === 'memo' ? 'bg-white/20' : 'bg-surface-container'} rounded-full text-[10px]">...</span>
          </button>

          <button onclick="docSetCategory('minit')" 
            class="doc-chip flex-shrink-0 px-3.5 py-1.5 rounded-full text-label-sm ${state.category === 'minit' ? 'bg-primary-container text-on-primary font-bold shadow-xs' : 'bg-surface-container-lowest text-secondary border border-outline-variant/20'} hover:opacity-90 transition-all flex items-center gap-1.5">
            <span>Minit Mesyuarat</span>
            <span id="doc-count-minit" class="px-1.5 py-0.2 ${state.category === 'minit' ? 'bg-white/20' : 'bg-surface-container'} rounded-full text-[10px]">...</span>
          </button>

          <button onclick="docSetCategory('rancangan')" 
            class="doc-chip flex-shrink-0 px-3.5 py-1.5 rounded-full text-label-sm ${state.category === 'rancangan' ? 'bg-primary-container text-on-primary font-bold shadow-xs' : 'bg-surface-container-lowest text-secondary border border-outline-variant/20'} hover:opacity-90 transition-all">
            <span>Rancangan Tahunan</span>
          </button>

          <button onclick="docSetCategory('laporan')" 
            class="doc-chip flex-shrink-0 px-3.5 py-1.5 rounded-full text-label-sm ${state.category === 'laporan' ? 'bg-primary-container text-on-primary font-bold shadow-xs' : 'bg-surface-container-lowest text-secondary border border-outline-variant/20'} hover:opacity-90 transition-all">
            <span>Laporan Tahunan</span>
          </button>
        </div>
      </div>

      <!-- 3. Drive Sync Info Banner -->
      <div class="bg-surface-container-lowest rounded-xl p-3 shadow-xs border border-outline-variant/20 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center flex-shrink-0 text-primary">
            <span class="material-symbols-outlined text-[20px]">cloud_sync</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="text-label-sm font-semibold text-on-surface truncate">Folder Rasmi Google Drive</span>
            <span class="text-[11px] text-secondary truncate font-mono">CEU_Portal_Files/Dokumen_2026</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low rounded-full flex-shrink-0">
          <span class="w-2 h-2 rounded-full bg-primary live-dot"></span>
          <span class="text-[11px] font-semibold text-primary">Disegerakkan</span>
        </div>
      </div>

      <!-- 4. Dynamic Documents List -->
      <div id="doc-cards-container" class="flex flex-col gap-3.5">
        <!-- Injected by _renderDocList() -->
      </div>

    </div>
  `;
}

function _renderDocList(state) {
  const container = document.getElementById('doc-cards-container');
  if (!container) return;

  const q = (state.searchQuery || '').toLowerCase();
  const cat = state.category;

  // Kira bilangan setiap kategori
  const allDocs = state.documents || [];
  const memoCount = allDocs.filter(d => (d.kategori || '').toLowerCase().includes('memo')).length;
  const minitCount = allDocs.filter(d => (d.kategori || '').toLowerCase().includes('minit')).length;

  const countAll = document.getElementById('doc-count-all');
  if (countAll) countAll.textContent = allDocs.length;
  const countMemo = document.getElementById('doc-count-memo');
  if (countMemo) countMemo.textContent = memoCount;
  const countMinit = document.getElementById('doc-count-minit');
  if (countMinit) countMinit.textContent = minitCount;

  // Tapis senarai
  const filtered = allDocs.filter(doc => {
    const docCat = (doc.kategori || '').toLowerCase();
    const docTajuk = (doc.tajuk || doc.nama || '').toLowerCase();
    const docNoRuj = (doc.no_rujukan || '').toLowerCase();
    const docDesc = (doc.penerangan || '').toLowerCase();

    const matchSearch = !q || docTajuk.includes(q) || docNoRuj.includes(q) || docDesc.includes(q);
    const matchCat = cat === 'all' || docCat.includes(cat);

    return matchSearch && matchCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/20">
        <span class="material-symbols-outlined text-[36px] text-secondary/60 mb-2">folder_off</span>
        <h3 class="font-headline text-headline-md text-on-surface font-semibold">Tiada Dokumen Ditemui</h3>
        <p class="text-body-md text-secondary mt-1">Sila cuba kata kunci carian yang lain atau pilih kategori Semua.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(doc => _buildDocArticle(doc)).join('');
}

function _buildDocArticle(doc) {
  const tajuk = escapeHtml(doc.tajuk || doc.nama || 'Dokumen Rasmi UPK');
  const noRuj = escapeHtml(doc.no_rujukan || 'UPK/JSS/2026');
  const penerangan = escapeHtml(doc.penerangan || 'Pemberitahuan rasmi kepada semua guru kaunseling dan bimbingan kerjaya.');
  const tarikh = formatDate(doc.tarikh || doc.created_at || new Date());
  const linkDrive = doc.drive_link || doc.url || '#';
  const kategori = (doc.kategori || 'memo').toUpperCase();
  const format = (doc.format || 'PDF').toUpperCase();
  const saiz = doc.saiz || '1.2 MB';

  return `
    <article class="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-outline-variant/20 hover:shadow-sm transition-all flex flex-col gap-3">
      <!-- Card Top: Category Pill + Meta -->
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <span class="px-2.5 py-0.5 rounded-full text-label-sm text-[11px] bg-primary-fixed text-on-primary-fixed-variant flex items-center gap-1 font-bold">
          <span class="material-symbols-outlined text-[13px]">description</span>
          <span>${kategori}</span>
        </span>
        <div class="flex items-center gap-2 text-secondary text-label-sm text-[11px]">
          <span class="font-mono bg-surface-container-low px-1.5 py-0.5 rounded font-normal">${noRuj}</span>
          <span>•</span>
          <time>${tarikh}</time>
        </div>
      </div>

      <!-- Title & Excerpt -->
      <div class="flex flex-col gap-1">
        <h3 class="font-headline text-headline-md text-on-surface font-bold tracking-tight leading-snug">
          ${tajuk}
        </h3>
        <p class="text-body-md text-secondary leading-relaxed">
          ${penerangan}
        </p>
      </div>

      <!-- File Spec & Authority -->
      <div class="flex items-center gap-2 pt-1 text-body-sm text-secondary">
        <div class="w-6 h-6 rounded ${format === 'PDF' ? 'bg-error-container text-error' : 'bg-primary-fixed text-primary'} flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-[15px]">${format === 'PDF' ? 'picture_as_pdf' : 'article'}</span>
        </div>
        <span class="font-semibold text-on-surface">${format}</span>
        <span>•</span>
        <span>${saiz}</span>
        <span>•</span>
        <span class="truncate text-secondary">Disahkan oleh UPK</span>
      </div>

      <!-- Action Button -->
      <div class="pt-1">
        <a href="${linkDrive}" target="_blank" rel="noopener noreferrer"
          class="w-full h-11 px-4 rounded-xl bg-surface-container-low hover:bg-primary-container hover:text-white text-primary text-label-md font-semibold flex items-center justify-center gap-2 transition-colors btn-press">
          <span class="material-symbols-outlined text-[18px]">add_to_drive</span>
          <span>Buka di Google Drive</span>
          <span class="material-symbols-outlined text-[16px]">arrow_outward</span>
        </a>
      </div>
    </article>
  `;
}

// ============================================
// HANDLER FUNGSI INTERAKTIF
// ============================================
window.docHandleSearch = function(val) {
  if (window._docState) {
    window._docState.searchQuery = val;
    _renderDocList(window._docState);
  }
};

window.docClearSearch = function() {
  if (window._docState) {
    window._docState.searchQuery = '';
    const input = document.getElementById('doc-search-input');
    if (input) input.value = '';
    _renderDocList(window._docState);
  }
};

window.docSetCategory = function(cat) {
  if (window._docState) {
    window._docState.category = cat;
    const content = document.getElementById('app-content');
    if (content) window.renderDocumentsPage(content);
  }
};
