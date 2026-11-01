// ============================================
// CEU Portal v1.1 — pages/calendar.js
// W-03: Kalendar & Jadual Aktiviti Interaktif
// Pandangan Bulan, Minggu, Senarai, Penapis & Integrasi
// ============================================

window.renderCalendarPage = async function(container) {
  // Tetapan state kalendar
  const today = new Date();
  window._calState = window._calState || {
    view: 'month', // 'month' | 'week' | 'agenda'
    currentYear: today.getFullYear(),
    currentMonth: today.getMonth(), // 0-indexed
    selectedDate: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
    selectedCategory: 'all',
    events: []
  };

  const state = window._calState;

  // Render rangka awal
  container.innerHTML = _buildCalendarShell(state);
  _renderCalendarBody(state);

  // Ambil data acara dari backend
  try {
    const res = await apiGet('getCalendar', {
      tahun: state.currentYear,
      bulan: state.currentMonth + 1
    });

    if (res && res.success && res.events) {
      state.events = res.events;
      _renderCalendarBody(state);
    }
  } catch (err) {
    console.warn('Gagal memuatkan acara kalendar:', err);
  }
};

function _buildCalendarShell(state) {
  const bulanNama = BULAN_MELAYU[state.currentMonth];
  const tahun = state.currentYear;

  return `
    <div class="flex flex-col w-full px-4 sm:px-6 pb-24 gap-3.5 max-w-3xl mx-auto">
      
      <!-- 1. View Toggle Bar (Bulan | Minggu | Senarai) -->
      <div class="w-full pt-1">
        <div class="bg-surface-container p-1 rounded-xl flex items-center justify-between shadow-xs">
          <button onclick="calSetView('month')" 
            class="flex-1 py-2 rounded-lg ${state.view === 'month' ? 'bg-primary-container text-on-primary font-bold shadow-sm' : 'text-secondary hover:text-on-surface'} text-label-md text-center transition-all flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[18px]">calendar_view_month</span>
            <span>Bulan</span>
          </button>
          <button onclick="calSetView('week')" 
            class="flex-1 py-2 rounded-lg ${state.view === 'week' ? 'bg-primary-container text-on-primary font-bold shadow-sm' : 'text-secondary hover:text-on-surface'} text-label-md text-center transition-all flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[18px]">calendar_view_week</span>
            <span>Minggu</span>
          </button>
          <button onclick="calSetView('agenda')" 
            class="flex-1 py-2 rounded-lg ${state.view === 'agenda' ? 'bg-primary-container text-on-primary font-bold shadow-sm' : 'text-secondary hover:text-on-surface'} text-label-md text-center transition-all flex items-center justify-center gap-1.5">
            <span class="material-symbols-outlined text-[18px]">format_list_bulleted</span>
            <span>Senarai</span>
          </button>
        </div>
      </div>

      <!-- 2. Month Navigation Header -->
      <div class="flex items-center justify-between bg-surface-container-lowest p-3.5 sm:p-4 rounded-xl shadow-xs border border-outline-variant/20">
        <div class="flex items-center gap-2">
          <button onclick="calPrevMonth()" aria-label="Bulan Sebelumnya" class="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container transition-colors btn-press">
            <span class="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <div class="flex flex-col">
            <span class="font-headline text-headline-md text-on-surface font-bold leading-none" id="cal-month-title">
              ${bulanNama} ${tahun}
            </span>
            <span class="text-body-sm text-secondary mt-0.5">Jadual Program & Acara UPK</span>
          </div>
          <button onclick="calNextMonth()" aria-label="Bulan Seterusnya" class="w-9 h-9 rounded-full flex items-center justify-center text-secondary hover:bg-surface-container transition-colors btn-press">
            <span class="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
        <button onclick="calToday()" class="px-3 py-1.5 bg-secondary-container hover:bg-secondary-fixed text-on-secondary-container rounded-lg text-label-sm font-semibold transition-colors flex items-center gap-1 btn-press">
          <span class="material-symbols-outlined text-[16px]">today</span>
          <span>Hari Ini</span>
        </button>
      </div>

      <!-- 3. Category Filter Chips -->
      <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button onclick="calSetCategory('all')" 
          class="cal-filter-chip px-3.5 py-1.5 rounded-full ${state.selectedCategory === 'all' ? 'bg-primary-container text-on-primary font-bold' : 'bg-surface-container-lowest text-secondary'} text-label-sm whitespace-nowrap shadow-xs hover:opacity-90 transition-all">
          Semua
        </button>
        <button onclick="calSetCategory('Bengkel')" 
          class="cal-filter-chip px-3.5 py-1.5 rounded-full ${state.selectedCategory === 'Bengkel' ? 'bg-primary-container text-on-primary font-bold' : 'bg-surface-container-lowest text-secondary'} text-label-sm whitespace-nowrap shadow-xs hover:opacity-90 transition-all">
          Bengkel
        </button>
        <button onclick="calSetCategory('Mesyuarat')" 
          class="cal-filter-chip px-3.5 py-1.5 rounded-full ${state.selectedCategory === 'Mesyuarat' ? 'bg-primary-container text-on-primary font-bold' : 'bg-surface-container-lowest text-secondary'} text-label-sm whitespace-nowrap shadow-xs hover:opacity-90 transition-all">
          Mesyuarat
        </button>
        <button onclick="calSetCategory('Taklimat')" 
          class="cal-filter-chip px-3.5 py-1.5 rounded-full ${state.selectedCategory === 'Taklimat' ? 'bg-primary-container text-on-primary font-bold' : 'bg-surface-container-lowest text-secondary'} text-label-sm whitespace-nowrap shadow-xs hover:opacity-90 transition-all">
          Taklimat
        </button>
        <button onclick="calSetCategory('Lawatan')" 
          class="cal-filter-chip px-3.5 py-1.5 rounded-full ${state.selectedCategory === 'Lawatan' ? 'bg-primary-container text-on-primary font-bold' : 'bg-surface-container-lowest text-secondary'} text-label-sm whitespace-nowrap shadow-xs hover:opacity-90 transition-all">
          Lawatan
        </button>
      </div>

      <!-- 4. Dynamic Calendar Body Container -->
      <div id="cal-dynamic-content" class="flex flex-col gap-3.5">
        <!-- Injected by _renderCalendarBody() -->
      </div>

    </div>
  `;
}

function _renderCalendarBody(state) {
  const container = document.getElementById('cal-dynamic-content');
  if (!container) return;

  if (state.view === 'month') {
    container.innerHTML = _buildMonthGrid(state) + _buildSelectedDayEvents(state);
  } else if (state.view === 'week') {
    container.innerHTML = _buildWeekGrid(state) + _buildSelectedDayEvents(state);
  } else {
    container.innerHTML = _buildAgendaList(state);
  }
}

/**
 * Membina Grid Kalendar Bulan
 */
function _buildMonthGrid(state) {
  const year = state.currentYear;
  const month = state.currentMonth;
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Ahad
  // Ubah ke format Isnin-Ahad (0 = Isn, 6 = Ahd)
  const mondayOffset = (firstDayIndex === 0 ? 6 : firstDayIndex - 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const isThisMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  let daysHtml = '';

  // Hari bulan lepas
  for (let i = mondayOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    daysHtml += `
      <div class="flex flex-col items-center justify-center py-2 opacity-35">
        <span class="text-body-md text-secondary">${d}</span>
        <div class="h-1.5 mt-0.5"></div>
      </div>
    `;
  }

  // Hari bulan semasa
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = isThisMonth && d === todayDate;
    const isSelected = state.selectedDate && 
      state.selectedDate.getFullYear() === year && 
      state.selectedDate.getMonth() === month && 
      state.selectedDate.getDate() === d;

    // Periksa jika ada acara pada hari ini
    const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayEvents = (state.events || []).filter(e => {
      const eDate = (e.tarikh_mula || e.tarikh || '').split('T')[0];
      return eDate === dayDateStr;
    });

    let dotsHtml = '<div class="h-1.5 mt-0.5"></div>';
    if (dayEvents.length > 0) {
      dotsHtml = `
        <div class="flex items-center justify-center gap-0.5 h-1.5 mt-0.5">
          ${dayEvents.slice(0, 3).map(() => '<span class="w-1.5 h-1.5 rounded-full bg-primary"></span>').join('')}
        </div>
      `;
    }

    let cellClass = 'cursor-pointer hover:bg-surface-container rounded-xl transition-all';
    let textClass = 'text-body-md text-on-surface';

    if (isSelected) {
      cellClass = 'bg-primary-container text-on-primary font-bold rounded-xl shadow-xs';
      textClass = 'text-body-md text-white font-bold';
      dotsHtml = `
        <div class="flex items-center justify-center gap-0.5 h-1.5 mt-0.5">
          <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
        </div>
      `;
    } else if (isToday) {
      textClass = 'text-body-md text-primary font-bold underline';
    }

    daysHtml += `
      <div onclick="calSelectDay(${year}, ${month}, ${d})" class="flex flex-col items-center justify-center py-2 ${cellClass}">
        <span class="${textClass}">${d}</span>
        ${dotsHtml}
      </div>
    `;
  }

  return `
    <div class="bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-xs border border-outline-variant/20 flex flex-col gap-2">
      <!-- Nama Hari -->
      <div class="grid grid-cols-7 text-center text-label-sm font-semibold text-secondary pb-1">
        <span>Isn</span>
        <span>Sel</span>
        <span>Rab</span>
        <span>Kha</span>
        <span>Jum</span>
        <span class="text-tertiary">Sab</span>
        <span class="text-error">Ahd</span>
      </div>
      <!-- Grid Hari -->
      <div class="grid grid-cols-7 gap-y-1.5 text-center items-center">
        ${daysHtml}
      </div>
    </div>
  `;
}

/**
 * Grid Paparan Minggu
 */
function _buildWeekGrid(state) {
  const current = new Date(state.selectedDate || new Date());
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Isnin
  const monday = new Date(current.setDate(diff));

  let weekDaysHtml = '';
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    const isSelected = state.selectedDate && nextDay.toDateString() === state.selectedDate.toDateString();

    const dStr = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
    const hasEvent = (state.events || []).some(e => (e.tarikh_mula || e.tarikh || '').startsWith(dStr));

    weekDaysHtml += `
      <div onclick="calSelectDay(${nextDay.getFullYear()}, ${nextDay.getMonth()}, ${nextDay.getDate()})"
        class="flex flex-col items-center justify-center py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-primary text-on-primary font-bold shadow-xs' : 'bg-surface-container-low hover:bg-surface-container'}">
        <span class="text-[11px] uppercase ${isSelected ? 'text-white/80' : 'text-secondary'} font-semibold">${HARI_MELAYU[nextDay.getDay()].substring(0, 3)}</span>
        <span class="text-headline-md font-bold mt-0.5">${nextDay.getDate()}</span>
        ${hasEvent ? `<span class="w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-primary'}"></span>` : '<span class="h-1.5 mt-1"></span>'}
      </div>
    `;
  }

  return `
    <div class="bg-surface-container-lowest rounded-2xl p-4 shadow-xs border border-outline-variant/20">
      <div class="grid grid-cols-7 gap-1.5 text-center">
        ${weekDaysHtml}
      </div>
    </div>
  `;
}

/**
 * Acara bagi hari yang dipilih
 */
function _buildSelectedDayEvents(state) {
  const selDate = state.selectedDate || new Date();
  const selDateStr = `${selDate.getFullYear()}-${String(selDate.getMonth() + 1).padStart(2, '0')}-${String(selDate.getDate()).padStart(2, '0')}`;

  let filteredEvents = (state.events || []).filter(e => {
    const eDate = (e.tarikh_mula || e.tarikh || '').split('T')[0];
    const matchDate = eDate === selDateStr;
    const matchCat = state.selectedCategory === 'all' || (e.kategori || '').toLowerCase() === state.selectedCategory.toLowerCase();
    return matchDate && matchCat;
  });

  const headerTitle = formatDate(selDate, 'day');

  return `
    <div class="flex flex-col gap-2.5 mt-1">
      <div class="flex items-center justify-between">
        <h3 class="font-headline text-title-sm text-on-surface font-semibold">
          Acara pada ${headerTitle}
        </h3>
        <span class="text-label-sm font-semibold text-secondary">
          ${filteredEvents.length} Program Dijadualkan
        </span>
      </div>

      <div class="flex flex-col gap-2.5">
        ${filteredEvents.length > 0
          ? filteredEvents.map(e => _buildEventCard(e)).join('')
          : `
            <div class="bg-surface-container-lowest rounded-xl p-6 text-center border border-outline-variant/20">
              <span class="material-symbols-outlined text-[32px] text-secondary/60 mb-1">event_busy</span>
              <p class="text-body-md text-secondary">Tiada acara dijadualkan pada tarikh ini.</p>
            </div>
          `
        }
      </div>
    </div>
  `;
}

/**
 * Pandangan Senarai (Agenda) Penuh
 */
function _buildAgendaList(state) {
  let allEvents = (state.events || []).filter(e => {
    return state.selectedCategory === 'all' || (e.kategori || '').toLowerCase() === state.selectedCategory.toLowerCase();
  });

  return `
    <div class="flex flex-col gap-2.5">
      <div class="flex items-center justify-between">
        <h3 class="font-headline text-title-sm text-on-surface font-semibold">
          Semua Program & Bengkel (${state.currentYear})
        </h3>
        <span class="text-label-sm font-semibold text-secondary">${allEvents.length} Acara</span>
      </div>

      <div class="flex flex-col gap-2.5">
        ${allEvents.length > 0
          ? allEvents.map(e => _buildEventCard(e)).join('')
          : `
            <div class="bg-surface-container-lowest rounded-xl p-8 text-center border border-outline-variant/20">
              <p class="text-body-md text-secondary">Tiada rekod program ditemui.</p>
            </div>
          `
        }
      </div>
    </div>
  `;
}

function _buildEventCard(e) {
  const tajuk = escapeHtml(e.nama_program || e.tajuk || 'Program UPK');
  const kategori = escapeHtml(e.kategori || 'Program');
  const lokasi = escapeHtml(e.lokasi || 'Lokasi Belum Ditetapkan');
  const tarikhMula = formatDate(e.tarikh_mula || e.tarikh);
  const masa = e.masa_mula ? `${formatTime(e.masa_mula)} - ${formatTime(e.masa_tamat || '12:00')}` : 'Masa Menyusul';
  const progId = e.id || e.kod_program || '';

  return `
    <div class="bg-surface-container-lowest rounded-xl p-4 shadow-xs border border-outline-variant/20 flex flex-col gap-2.5 hover:shadow-sm transition-all">
      <div class="flex items-center justify-between gap-2">
        <span class="px-2.5 py-0.5 rounded-full bg-surface-container-high text-primary text-[11px] font-bold uppercase tracking-wide">
          ${kategori}
        </span>
        <span class="text-body-sm text-secondary flex items-center gap-1 font-medium">
          <span class="material-symbols-outlined text-[16px] text-primary">schedule</span>
          <span>${masa}</span>
        </span>
      </div>

      <div>
        <h4 class="font-headline text-headline-md text-on-surface font-semibold leading-snug">
          ${tajuk}
        </h4>
        <p class="text-body-md text-secondary flex items-center gap-1.5 mt-1">
          <span class="material-symbols-outlined text-[18px] text-error flex-shrink-0">location_on</span>
          <span class="truncate">${lokasi}</span>
        </p>
      </div>

      <div class="flex items-center justify-between pt-2 border-t border-outline-variant/20 mt-1">
        <span class="text-body-sm text-secondary font-medium">${tarikhMula}</span>
        <button onclick="navigateTo('rsvp')" 
          class="px-3 py-1.5 rounded-lg bg-surface-container text-primary hover:bg-primary hover:text-white text-label-sm font-semibold transition-all flex items-center gap-1 btn-press">
          <span class="material-symbols-outlined text-[16px]">how_to_reg</span>
          <span>RSVP</span>
        </button>
      </div>
    </div>
  `;
}

// ============================================
// HANDLER FUNGSI INTERAKTIF
// ============================================
window.calSetView = function(view) {
  if (window._calState) {
    window._calState.view = view;
    _renderCalendarBody(window._calState);
    const content = document.getElementById('app-content');
    if (content) window.renderCalendarPage(content);
  }
};

window.calPrevMonth = function() {
  if (!window._calState) return;
  let m = window._calState.currentMonth - 1;
  let y = window._calState.currentYear;
  if (m < 0) { m = 11; y--; }
  window._calState.currentMonth = m;
  window._calState.currentYear = y;
  window._calState.selectedDate = new Date(y, m, 1);
  const content = document.getElementById('app-content');
  if (content) window.renderCalendarPage(content);
};

window.calNextMonth = function() {
  if (!window._calState) return;
  let m = window._calState.currentMonth + 1;
  let y = window._calState.currentYear;
  if (m > 11) { m = 0; y++; }
  window._calState.currentMonth = m;
  window._calState.currentYear = y;
  window._calState.selectedDate = new Date(y, m, 1);
  const content = document.getElementById('app-content');
  if (content) window.renderCalendarPage(content);
};

window.calToday = function() {
  if (!window._calState) return;
  const t = new Date();
  window._calState.currentMonth = t.getMonth();
  window._calState.currentYear = t.getFullYear();
  window._calState.selectedDate = t;
  const content = document.getElementById('app-content');
  if (content) window.renderCalendarPage(content);
};

window.calSelectDay = function(y, m, d) {
  if (!window._calState) return;
  window._calState.selectedDate = new Date(y, m, d);
  _renderCalendarBody(window._calState);
};

window.calSetCategory = function(cat) {
  if (!window._calState) return;
  window._calState.selectedCategory = cat;
  const content = document.getElementById('app-content');
  if (content) window.renderCalendarPage(content);
};
