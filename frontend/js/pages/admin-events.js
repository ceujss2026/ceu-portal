// ============================================
// CEU Portal v1.1 — pages/admin-events.js
// W-08: Pengurusan Kalendar & Acara Unit
// CRUD Acara, Integrasi Google Calendar API
// ============================================

window.renderAdminEventsPage = async function(container) {
  window._adminEventState = window._adminEventState || {
    events: [],
    searchQuery: '',
    category: 'Semua',
    editingEventId: null
  };

  const state = window._adminEventState;

  // Render rangka awal
  container.innerHTML = _buildAdminEventsShell(state);
  _renderEventsList(state);

  // Ambil data acara dari backend
  try {
    const res = await apiGet('getCalendar', {});
    if (res && res.success && res.events) {
      state.events = res.events;
      _renderEventsList(state);
    }
  } catch (err) {
    console.warn('Gagal memuatkan acara pentadbir:', err);
  }
};

function _buildAdminEventsShell(state) {
  return `
    <div class="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 max-w-6xl mx-auto">
      
      <!-- 1. Header & Integration Banner -->
      <div class="bg-surface-container-lowest rounded-2xl p-6 shadow-xs border border-outline-variant/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex flex-col gap-1 max-w-2xl">
          <div class="flex items-center gap-2 text-primary text-label-sm font-semibold">
            <span class="material-symbols-outlined text-[18px]">cloud_sync</span>
            <span class="tracking-wide uppercase">Google Calendar API Sync</span>
            <span class="w-1.5 h-1.5 rounded-full bg-green-500 live-dot"></span>
            <span class="text-green-700 font-bold">Aktif</span>
          </div>
          <h1 class="font-headline text-headline-xl text-on-surface tracking-tight font-bold">
            Pengurusan Kalendar & Acara Unit
          </h1>
          <p class="text-body-md text-secondary leading-relaxed">
            Cipta, kemaskini dan segerak program rasmi Unit Pendidikan Kerjaya bersama Google Calendar & database spreadsheet.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 flex-shrink-0">
          <button onclick="adminEventResetForm()" class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-label-md font-semibold hover:bg-primary-container transition-all shadow-xs btn-press">
            <span class="material-symbols-outlined text-[20px]">add_circle</span>
            <span>+ Cipta Program Baharu</span>
          </button>
        </div>
      </div>

      <!-- 2. Search & Filter Bar -->
      <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/20 flex flex-col sm:flex-row items-center gap-3">
        <div class="relative flex-1 w-full">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary text-[20px]">search</span>
          <input oninput="adminEventHandleSearch(this.value)" 
            class="w-full pl-10 pr-4 py-2 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none focus:bg-surface-container-lowest focus:border-primary transition-all" 
            placeholder="Cari tajuk program, lokasi, atau penganjur..." 
            type="text" 
            value="${escapeHtml(state.searchQuery)}"/>
        </div>

        <select onchange="adminEventSetCategory(this.value)" 
          class="w-full sm:w-auto px-4 py-2 bg-surface-container-low rounded-xl text-body-md text-on-surface font-semibold border border-outline-variant/30 outline-none cursor-pointer">
          <option value="Semua" ${state.category === 'Semua' ? 'selected' : ''}>Semua Kategori</option>
          <option value="Bengkel" ${state.category === 'Bengkel' ? 'selected' : ''}>Bengkel Kerjaya</option>
          <option value="Mesyuarat" ${state.category === 'Mesyuarat' ? 'selected' : ''}>Mesyuarat Penyelarasan</option>
          <option value="Taklimat" ${state.category === 'Taklimat' ? 'selected' : ''}>Taklimat Hala Tuju</option>
          <option value="Lawatan" ${state.category === 'Lawatan' ? 'selected' : ''}>Lawatan Industri</option>
        </select>
      </div>

      <!-- 3. Split Layout: Senarai Acara (7 cols) + Borang Cipta/Urus (5 cols) -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Kolum Kiri: Senarai Program (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-3">
          <div class="flex items-center justify-between pb-1">
            <h2 class="font-headline text-title-sm text-on-surface font-bold">Senarai Program Rasmi UPK</h2>
            <span id="admin-event-count" class="text-body-sm text-secondary font-semibold">...</span>
          </div>
          <div id="admin-events-list-container" class="flex flex-col gap-3">
            <!-- Injected by _renderEventsList() -->
          </div>
        </div>

        <!-- Kolum Kanan: Borang Cipta / Kemaskini (5 cols) -->
        <div class="lg:col-span-5 bg-surface-container-lowest rounded-2xl p-5 sm:p-6 shadow-xs border border-outline-variant/20 sticky top-20">
          <div class="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
            <h3 class="font-headline text-title-sm text-on-surface font-bold flex items-center gap-2" id="event-form-title">
              <span class="material-symbols-outlined text-primary text-[22px]">event_note</span>
              <span>Cipta Program Baharu</span>
            </h3>
            <button onclick="adminEventResetForm()" class="text-label-sm text-secondary hover:text-on-surface" id="btn-cancel-edit" style="display:none">
              Batal
            </button>
          </div>

          <form id="admin-event-form" onsubmit="event.preventDefault(); adminEventSubmitForm();" class="flex flex-col gap-3.5">
            <input type="hidden" id="event-id" value="">

            <div>
              <label class="text-label-sm font-semibold text-on-surface block mb-1">Tajuk / Nama Program *</label>
              <input type="text" id="event-title" required placeholder="Cth: Bengkel Kaunseling Kerjaya Siri 2" 
                class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none focus:border-primary transition-all">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-label-sm font-semibold text-on-surface block mb-1">Kategori *</label>
                <select id="event-category" required class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none">
                  <option value="Bengkel">Bengkel</option>
                  <option value="Mesyuarat">Mesyuarat</option>
                  <option value="Taklimat">Taklimat</option>
                  <option value="Lawatan">Lawatan</option>
                </select>
              </div>

              <div>
                <label class="text-label-sm font-semibold text-on-surface block mb-1">Penganjur</label>
                <input type="text" id="event-organizer" value="Unit Pendidikan Kerjaya, JSS" 
                  class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-label-sm font-semibold text-on-surface block mb-1">Tarikh Mula *</label>
                <input type="date" id="event-start-date" required 
                  class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none">
              </div>

              <div>
                <label class="text-label-sm font-semibold text-on-surface block mb-1">Masa Mula</label>
                <input type="time" id="event-start-time" value="08:30" 
                  class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none">
              </div>
            </div>

            <div>
              <label class="text-label-sm font-semibold text-on-surface block mb-1">Lokasi / Pautan Meet *</label>
              <input type="text" id="event-location" required placeholder="Cth: Bilik Gerakan UPK / Google Meet" 
                class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none">
            </div>

            <div>
              <label class="text-label-sm font-semibold text-on-surface block mb-1">Penerangan Program</label>
              <textarea id="event-desc" rows="2" placeholder="Catatan atau taklimat ringkas mengenai program..." 
                class="w-full p-2.5 bg-surface-container-low rounded-xl text-body-md text-on-surface border border-outline-variant/30 outline-none"></textarea>
            </div>

            <div class="pt-2">
              <button type="submit" id="btn-save-event" 
                class="w-full h-11 rounded-xl bg-primary text-on-primary text-label-md font-semibold flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all btn-press">
                <span class="material-symbols-outlined text-[20px]">save</span>
                <span id="btn-save-event-text">Simpan & Segerak ke Kalendar</span>
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  `;
}

function _renderEventsList(state) {
  const container = document.getElementById('admin-events-list-container');
  if (!container) return;

  const q = (state.searchQuery || '').toLowerCase();
  const cat = state.category;

  const filtered = (state.events || []).filter(e => {
    const matchCat = cat === 'Semua' || (e.kategori || '').toLowerCase() === cat.toLowerCase();
    const matchSearch = !q || (e.nama_program || e.tajuk || '').toLowerCase().includes(q) || (e.lokasi || '').toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const countEl = document.getElementById('admin-event-count');
  if (countEl) countEl.textContent = `${filtered.length} Acara Ditemui`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/20">
        <p class="text-body-md text-secondary">Tiada acara ditemui untuk penapis ini.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(e => {
    const id = e.id || e.kod_program;
    const tajuk = escapeHtml(e.nama_program || e.tajuk);
    const tarikh = formatDate(e.tarikh_mula || e.tarikh);
    const masa = e.masa_mula || '08:30';
    const lokasi = escapeHtml(e.lokasi || 'Lokasi Menanti');
    const kategori = escapeHtml(e.kategori || 'Bengkel');

    return `
      <article class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/20 flex flex-col gap-2.5 hover:shadow-sm transition-all">
        <div class="flex items-center justify-between gap-2">
          <span class="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary text-[11px] font-bold uppercase tracking-wide">
            ${kategori}
          </span>
          <span class="text-body-sm text-secondary font-medium">${tarikh} • ${masa}</span>
        </div>

        <div class="flex flex-col">
          <h3 class="font-headline text-headline-md font-bold text-on-surface leading-snug">${tajuk}</h3>
          <p class="text-body-sm text-secondary flex items-center gap-1 mt-0.5">
            <span class="material-symbols-outlined text-[16px] text-error">location_on</span>
            <span class="truncate">${lokasi}</span>
          </p>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
          <button onclick="adminEventEdit('${id}')" class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary text-label-sm font-semibold flex items-center gap-1 btn-press">
            <span class="material-symbols-outlined text-[16px]">edit</span>
            <span>Kemaskini</span>
          </button>
          <button onclick="adminEventDelete('${id}')" class="px-3 py-1.5 rounded-lg bg-error-container/30 hover:bg-error-container text-error text-label-sm font-semibold flex items-center gap-1 btn-press">
            <span class="material-symbols-outlined text-[16px]">delete</span>
            <span>Padam</span>
          </button>
        </div>
      </article>
    `;
  }).join('');
}

// ============================================
// HANDLER FUNGSI INTERAKTIF
// ============================================
window.adminEventHandleSearch = function(val) {
  if (window._adminEventState) {
    window._adminEventState.searchQuery = val;
    _renderEventsList(window._adminEventState);
  }
};

window.adminEventSetCategory = function(cat) {
  if (window._adminEventState) {
    window._adminEventState.category = cat;
    _renderEventsList(window._adminEventState);
  }
};

window.adminEventEdit = function(id) {
  const state = window._adminEventState;
  const e = (state.events || []).find(x => (x.id || x.kod_program) === id);
  if (!e) return;

  state.editingEventId = id;
  const formTitle = document.getElementById('event-form-title');
  const btnCancel = document.getElementById('btn-cancel-edit');
  const btnSaveText = document.getElementById('btn-save-event-text');

  if (formTitle) formTitle.innerHTML = `<span class="material-symbols-outlined text-primary text-[22px]">edit</span><span>Kemaskini Acara</span>`;
  if (btnCancel) btnCancel.style.display = 'block';
  if (btnSaveText) btnSaveText.textContent = 'Simpan Perubahan';

  document.getElementById('event-id').value = id;
  document.getElementById('event-title').value = e.nama_program || e.tajuk || '';
  document.getElementById('event-category').value = e.kategori || 'Bengkel';
  document.getElementById('event-organizer').value = e.penganjur || 'Unit Pendidikan Kerjaya, JSS';
  document.getElementById('event-start-date').value = (e.tarikh_mula || e.tarikh || '').split('T')[0];
  document.getElementById('event-start-time').value = e.masa_mula || '08:30';
  document.getElementById('event-location').value = e.lokasi || '';
  document.getElementById('event-desc').value = e.penerangan || '';

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.adminEventResetForm = function() {
  const state = window._adminEventState;
  if (state) state.editingEventId = null;

  const formTitle = document.getElementById('event-form-title');
  const btnCancel = document.getElementById('btn-cancel-edit');
  const btnSaveText = document.getElementById('btn-save-event-text');

  if (formTitle) formTitle.innerHTML = `<span class="material-symbols-outlined text-primary text-[22px]">event_note</span><span>Cipta Program Baharu</span>`;
  if (btnCancel) btnCancel.style.display = 'none';
  if (btnSaveText) btnSaveText.textContent = 'Simpan & Segerak ke Kalendar';

  const form = document.getElementById('admin-event-form');
  if (form) form.reset();
  const idEl = document.getElementById('event-id');
  if (idEl) idEl.value = '';
};

window.adminEventSubmitForm = async function() {
  const id = document.getElementById('event-id').value;
  const data = {
    nama_program: document.getElementById('event-title').value.trim(),
    kategori: document.getElementById('event-category').value,
    penganjur: document.getElementById('event-organizer').value.trim(),
    tarikh_mula: document.getElementById('event-start-date').value,
    masa_mula: document.getElementById('event-start-time').value,
    lokasi: document.getElementById('event-location').value.trim(),
    penerangan: document.getElementById('event-desc').value.trim()
  };

  const isEdit = !!id;
  const btn = document.getElementById('btn-save-event');
  if (btn) btn.disabled = true;

  showToast(isEdit ? 'Mengemas kini program...' : 'Mencipta dan menyegerakkan ke Google Calendar...', 'info', 2000);

  try {
    const action = isEdit ? 'updateEvent' : 'createEvent';
    if (isEdit) data.id = id;

    const res = await apiPost(action, data);
    if (res && res.success) {
      showToast(isEdit ? 'Program berjaya dikemas kini!' : 'Program baharu berjaya dicipta & disegerak!', 'success');
      adminEventResetForm();
      const content = document.getElementById('app-content');
      if (content) window.renderAdminEventsPage(content);
    } else {
      showToast(res.message || 'Gagal menyimpan program.', 'error');
      if (btn) btn.disabled = false;
    }
  } catch (err) {
    showToast('Ralat rangkaian.', 'error');
    if (btn) btn.disabled = false;
  }
};

window.adminEventDelete = function(id) {
  showModal('Sahkan Padam Acara', 'Adakah anda pasti mahu memadamkan program ini? Tindakan ini akan memadam rekod program dan kalendar.', [
    { label: 'Batal', onclick: 'hideModal()' },
    { label: 'Padam Program', danger: true, onclick: `adminEventConfirmDelete('${id}')` }
  ]);
};

window.adminEventConfirmDelete = async function(id) {
  hideModal();
  showToast('Memadamkan program...', 'info', 1500);

  try {
    const res = await apiPost('deleteEvent', { id: id });
    if (res && res.success) {
      showToast('Program berjaya dipadam.', 'success');
      const content = document.getElementById('app-content');
      if (content) window.renderAdminEventsPage(content);
    } else {
      showToast(res.message || 'Gagal memadam program.', 'error');
    }
  } catch (err) {
    showToast('Ralat rangkaian.', 'error');
  }
};
