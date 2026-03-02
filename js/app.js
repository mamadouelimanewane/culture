/* ═══════════════════════════════════════════════════
   CULTURE SÉNÉGAL — Application principale
   ═══════════════════════════════════════════════════ */

'use strict';

// ── Type configurations ──────────────────────────────────────────────────────
const INFRA_TYPES = {
  'Centre culturel':    { color: '#1a6b3e', bg: '#e8f5ee', icon: '🏛️' },
  "Centre d'animation": { color: '#0369a1', bg: '#e0f2fe', icon: '🎭' },
  'Cinéma':             { color: '#dc2626', bg: '#fee2e2', icon: '🎬' },
  'Foyer des femmes':   { color: '#9333ea', bg: '#f3e8ff', icon: '👩' },
  'Foyer des jeunes':   { color: '#2563eb', bg: '#dbeafe', icon: '🏠' },
  'Galerie':            { color: '#0891b2', bg: '#cffafe', icon: '🖼️' },
  'Musée':              { color: '#7c3aed', bg: '#ede9fe', icon: '🏺' },
  'Salle des fêtes':    { color: '#db2777', bg: '#fce7f3', icon: '🎉' },
  'Village artisanal':  { color: '#d97706', bg: '#fef3c7', icon: '🧵' },
  '_default':           { color: '#6b7280', bg: '#f3f4f6', icon: '🏢' },
};

const FORMATION_TYPES = {
  'ARTS':                    { color: '#9333ea', bg: '#f3e8ff', icon: '🎨' },
  'ARTS - AUDIOVISUEL':      { color: '#9333ea', bg: '#f3e8ff', icon: '🎨' },
  'ARTS- INFOGRAPHIE':       { color: '#9333ea', bg: '#f3e8ff', icon: '🎨' },
  'AUDIOVISUEL':             { color: '#dc2626', bg: '#fee2e2', icon: '📹' },
  'INFOGRAPHIE':             { color: '#0891b2', bg: '#cffafe', icon: '💻' },
  'INFOGRAPHIE - AUDIOVISUEL':{ color: '#0891b2', bg: '#cffafe', icon: '💻' },
  'INFOGRAPHIE - SERIGRAPHIE':{ color: '#0891b2', bg: '#cffafe', icon: '🖨️' },
  'PEINTURE':                { color: '#16a34a', bg: '#dcfce7', icon: '🖌️' },
  'SERIGRAPHIE':             { color: '#d97706', bg: '#fef3c7', icon: '🖨️' },
  '_default':                { color: '#6b7280', bg: '#f3f4f6', icon: '🎓' },
};

const REGIONS = [
  'DAKAR','DIOURBEL','FATICK','KAFFRINE','KAOLACK',
  'KEDOUGOU','KOLDA','LOUGA','MATAM','SAINT LOUIS',
  'SEDHIOU','TAMBACOUNDA','THIES','ZIGUINCHOR'
];

// ── Application state ────────────────────────────────────────────────────────
const state = {
  activeTab: 'infrastructures',   // 'infrastructures' | 'formations' | 'carte'
  activeView: 'grid',              // 'grid' | 'map'
  activeLayer: 'all',             // 'all' | 'infrastructures' | 'formations'
  data: { infrastructures: [], formations: [] },
  filtered: [],
  filters: { search: '', region: '', type: '', milieu: '' },
  page: 1,
  perPage: 24,
  maps: { panel: null, full: null },
  clusters: { panel: null, full: null },
  loading: true,
};

// ── Navigation / Routing state ───────────────────────────────────────────────
const nav = {
  control:      null,   // L.Routing.Control instance
  userMarker:   null,   // marker position utilisateur
  destMarker:   null,   // marker destination
  active:       false,
  profile:      'driving',  // 'driving' | 'walking' | 'cycling'
  destLat:      null,
  destLon:      null,
  destName:     '',
};

// Store pour les données des popups (évite les problèmes d'échappement)
const _navStore = [];
function storeNav(lat, lon, name) {
  _navStore.push({ lat, lon, name });
  return _navStore.length - 1;
}

// ── DOM references ───────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

const dom = {
  // Header
  navTabs:       $$('.nav-tab'),
  mnavBtns:      $$('.mnav-btn'),
  hamburger:     $('hamburger'),
  headerSearchBtn: $('headerSearchBtn'),

  // Layout
  appLayout:     $('appLayout'),
  fullMapSection: $('fullMapSection'),

  // Sidebar
  searchInput:   $('searchInput'),
  searchClear:   $('searchClear'),
  regionSelect:  $('regionSelect'),
  typeBlock:     $('typeBlock'),
  brancheBlock:  $('brancheBlock'),
  milieuBlock:   $('milieuBlock'),
  typeChips:     $('typeChips'),
  brancheChips:  $('brancheChips'),
  milieuGroup:   $('milieuGroup'),
  clearAll:      $('clearAll'),
  sideViewGrid:  $('sideViewGrid'),
  sideViewMap:   $('sideViewMap'),

  // Toolbar
  resultsTxt:    $('resultsTxt'),
  filterOpenBtn: $('filterOpenBtn'),
  toolViewGrid:  $('toolViewGrid'),
  toolViewMap:   $('toolViewMap'),

  // Content
  cardsWrapper:  $('cardsWrapper'),
  cardsGrid:     $('cardsGrid'),
  loadingState:  $('loadingState'),
  pagination:    $('pagination'),
  panelMapWrapper: $('panelMapWrapper'),

  // Full map
  layerBtns:     $$('.layer-btn'),
  fullMapSearch: $('fullMapSearch'),
  fullLegend:    $('fullLegend'),
  panelLegend:   $('panelLegend'),

  // Drawer
  drawerOverlay: $('drawerOverlay'),
  filterDrawer:  $('filterDrawer'),
  drawerBody:    $('drawerBody'),
  drawerClose:   $('drawerClose'),
  applyDrawerFilters: $('applyDrawerFilters'),

  // Modal
  modalOverlay:  $('modalOverlay'),
  modalBox:      $('modalBox'),
  modalBody:     $('modalBody'),
  modalClose:    $('modalClose'),
};

// ── Utility helpers ──────────────────────────────────────────────────────────
function typeConfig(tab, key) {
  const map = tab === 'formations' ? FORMATION_TYPES : INFRA_TYPES;
  return map[key] || map['_default'];
}

function capitalize(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function titleCase(s) {
  if (!s) return '';
  return s.split(' ').map(w => capitalize(w)).join(' ');
}

function formatNum(n) {
  return n.toLocaleString('fr-FR');
}

// Create a custom Leaflet divIcon marker
function createMarkerIcon(color, icon) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:38px;position:relative;
    ">
      <svg viewBox="0 0 32 38" xmlns="http://www.w3.org/2000/svg" style="width:32px;height:38px;position:absolute;">
        <path d="M16 0C7.16 0 0 7.16 0 16c0 10.5 16 22 16 22S32 26.5 32 16C32 7.16 24.84 0 16 0z"
              fill="${color}" stroke="#fff" stroke-width="1.5"/>
      </svg>
      <span style="
        position:absolute;top:5px;left:50%;transform:translateX(-50%);
        font-size:14px;line-height:1;z-index:1;
      ">${icon}</span>
    </div>`,
    iconSize: [32, 38],
    iconAnchor: [16, 38],
    popupAnchor: [0, -40],
  });
}

// ── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
  try {
    const [infraRes, formRes] = await Promise.all([
      fetch('./infrastructures_culturelles.json'),
      fetch('./centre_formation_arts.json'),
    ]);

    if (!infraRes.ok || !formRes.ok) throw new Error('Network error');

    const [infraJson, formJson] = await Promise.all([
      infraRes.json(), formRes.json()
    ]);

    state.data.infrastructures = infraJson.sheets['INFRASTRUCTURES_CULTURELLES'].records;
    state.data.formations       = formJson.sheets['CENTRE_FORMATION_CULTURE'].records;

    state.loading = false;
    onDataReady();
  } catch (err) {
    console.error('Failed to load data:', err);
    dom.loadingState.innerHTML = `
      <span style="font-size:48px">⚠️</span>
      <p style="font-weight:600;">Erreur de chargement des données</p>
      <p style="font-size:13px;">${err.message}</p>
      <button onclick="location.reload()" style="margin-top:12px;padding:10px 20px;background:var(--primary);color:#fff;border-radius:8px;font-size:14px;">
        Réessayer
      </button>`;
  }
}

// ── Once data is ready ───────────────────────────────────────────────────────
function onDataReady() {
  const infraCount = state.data.infrastructures.length;
  const formCount  = state.data.formations.length;

  // Update stat badges
  $('sInfra').textContent = formatNum(infraCount);
  $('sForm').textContent  = formatNum(formCount);
  $('infraBadge').textContent = formatNum(infraCount);
  $('formBadge').textContent  = formatNum(formCount);

  // Build filter UIs
  buildRegionOptions();
  buildTypeChips();
  buildBrancheChips();
  buildDrawerContent();

  // First render
  applyFiltersAndRender();

  // Init full map data (lazy)
  initFullMapIfVisible();
}

// ── Filter UI builders ───────────────────────────────────────────────────────
function buildRegionOptions() {
  const activeData = state.activeTab === 'formations'
    ? state.data.formations
    : state.data.infrastructures;

  const regionKey = state.activeTab === 'formations' ? 'REGION' : 'REGION';
  const regions = [...new Set(activeData.map(r => r[regionKey]))].filter(Boolean).sort();

  dom.regionSelect.innerHTML = `<option value="">Toutes les régions</option>` +
    regions.map(r => `<option value="${r}" ${state.filters.region === r ? 'selected' : ''}>${titleCase(r)}</option>`).join('');
}

function buildTypeChips() {
  const types = [...new Set(state.data.infrastructures.map(r => r.DESCRIPTIF))].filter(Boolean).sort();
  dom.typeChips.innerHTML = types.map(t => {
    const cfg = typeConfig('infrastructures', t);
    return `<button class="chip ${state.filters.type === t ? 'active' : ''}" data-type="${t}"
      style="--type-color:${cfg.color};--type-bg:${cfg.bg}">
      ${cfg.icon} ${t}
    </button>`;
  }).join('');
}

function buildBrancheChips() {
  const branches = [...new Set(state.data.formations.map(r => r.BRANCHE))].filter(Boolean).sort();
  dom.brancheChips.innerHTML = branches.map(b => {
    const cfg = typeConfig('formations', b);
    return `<button class="chip ${state.filters.type === b ? 'active' : ''}" data-type="${b}"
      style="--type-color:${cfg.color};--type-bg:${cfg.bg}">
      ${cfg.icon} ${b}
    </button>`;
  }).join('');
}

function buildDrawerContent() {
  // Clone sidebar content into drawer for mobile
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar || !dom.drawerBody) return;
  dom.drawerBody.innerHTML = sidebar.innerHTML;

  // Sync drawer events
  $$('#searchInput', dom.drawerBody).forEach(el => {
    el.value = state.filters.search;
    el.addEventListener('input', e => {
      state.filters.search = e.target.value;
      $('searchInput').value = e.target.value;
    });
  });
  $$('#regionSelect', dom.drawerBody).forEach(el => {
    el.value = state.filters.region;
    el.addEventListener('change', e => {
      state.filters.region = e.target.value;
      $('regionSelect').value = e.target.value;
    });
  });
  $$('.chip', dom.drawerBody).forEach(el => {
    el.addEventListener('click', () => {
      const type = el.dataset.type;
      state.filters.type = (state.filters.type === type) ? '' : type;
      buildTypeChips();
      buildBrancheChips();
      buildDrawerContent();
    });
  });
  $$('.pill[data-milieu]', dom.drawerBody).forEach(el => {
    if (el.dataset.milieu === state.filters.milieu) el.classList.add('active');
    el.addEventListener('click', () => {
      state.filters.milieu = el.dataset.milieu;
      $$('.pill[data-milieu]', dom.drawerBody).forEach(p => p.classList.remove('active'));
      el.classList.add('active');
      $$('.pill[data-milieu]', document.querySelector('.sidebar')).forEach(p => {
        p.classList.toggle('active', p.dataset.milieu === state.filters.milieu);
      });
    });
  });
}

// ── Filter & render pipeline ─────────────────────────────────────────────────
function getActiveDataset() {
  return state.activeTab === 'formations'
    ? state.data.formations
    : state.data.infrastructures;
}

function applyFiltersAndRender(resetPage = false) {
  if (resetPage) state.page = 1;

  const dataset = getActiveDataset();
  const f = state.filters;
  const searchLower = f.search.toLowerCase().trim();

  const isFormation = state.activeTab === 'formations';

  state.filtered = dataset.filter(record => {
    // Search
    if (searchLower) {
      const haystack = [
        isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION,
        record.COMMUNE,
        isFormation ? record.LOCALITE : record.LOCALITES,
        record.REGION,
        record.DEPARTEMENT,
        isFormation ? record.BRANCHE : record.DESCRIPTIF,
      ].filter(Boolean).join(' ').toLowerCase();
      if (!haystack.includes(searchLower)) return false;
    }

    // Region
    if (f.region && record.REGION !== f.region) return false;

    // Type
    if (f.type) {
      const typeKey = isFormation ? record.BRANCHE : record.DESCRIPTIF;
      if (typeKey !== f.type) return false;
    }

    // Milieu (infra only)
    if (!isFormation && f.milieu && record.MILIEU !== f.milieu) return false;

    return true;
  });

  dom.resultsTxt.textContent = `${formatNum(state.filtered.length)} résultat${state.filtered.length !== 1 ? 's' : ''}`;

  if (state.activeView === 'grid') {
    renderCards();
  } else {
    renderPanelMap();
  }
}

// ── Card rendering ───────────────────────────────────────────────────────────
function renderCards() {
  dom.cardsWrapper.classList.remove('hidden');
  dom.panelMapWrapper.classList.add('hidden');

  const start = (state.page - 1) * state.perPage;
  const pageRecords = state.filtered.slice(start, start + state.perPage);
  const isFormation = state.activeTab === 'formations';

  if (pageRecords.length === 0) {
    dom.cardsGrid.innerHTML = `
      <div class="empty-state">
        <span style="font-size:48px">🔍</span>
        <p style="font-weight:600;font-size:16px;">Aucun résultat trouvé</p>
        <p style="font-size:13px;color:var(--text-sm);">Essayez de modifier vos filtres</p>
        <button onclick="resetAllFilters()" style="margin-top:10px;padding:10px 20px;background:var(--primary);color:#fff;border-radius:8px;font-size:14px;">
          Réinitialiser
        </button>
      </div>`;
    dom.pagination.innerHTML = '';
    return;
  }

  dom.cardsGrid.innerHTML = pageRecords.map((r, i) => buildCard(r, isFormation, start + i)).join('');
  renderPagination();
}

function buildCard(record, isFormation, idx) {
  const typeKey = isFormation ? record.BRANCHE : record.DESCRIPTIF;
  const cfg     = typeConfig(isFormation ? 'formations' : 'infrastructures', typeKey);
  const name    = isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION;
  const commune = record.COMMUNE || '—';
  const region  = record.REGION  || '—';
  const locale  = isFormation ? record.LOCALITE : record.LOCALITES;

  return `
  <article class="card" onclick="openModal(${idx})"
    style="--type-color:${cfg.color};--type-bg:${cfg.bg}"
    aria-label="${name}">
    <div class="card-header">
      <div class="card-icon">${cfg.icon}</div>
      <div class="card-meta">
        <span class="card-type">${typeKey}</span>
        <h3 class="card-name">${name || '—'}</h3>
      </div>
    </div>
    <div class="card-body">
      <div class="card-loc">
        <span class="card-loc-icon">📍</span>
        <span>${titleCase(commune)}${locale ? ', ' + titleCase(locale) : ''}</span>
      </div>
      <div class="card-loc">
        <span class="card-loc-icon">🗺</span>
        <span>${titleCase(region)}</span>
      </div>
    </div>
    <div class="card-footer">
      ${isFormation
        ? `<span class="region-tag">${titleCase(record.DEPARTEMENT || '')}</span>`
        : `<span class="card-milieu ${record.MILIEU === 'URBAIN' ? 'milieu-urbain' : 'milieu-rural'}">
             ${record.MILIEU === 'URBAIN' ? '🏙' : '🌾'} ${capitalize(record.MILIEU || '')}
           </span>`}
      ${(record.LATITUDE && record.LONGITUDE)
        ? `<span class="card-map-btn">📍 Voir sur carte</span>`
        : ''}
    </div>
  </article>`;
}

// ── Pagination ───────────────────────────────────────────────────────────────
function renderPagination() {
  const total = state.filtered.length;
  const totalPages = Math.ceil(total / state.perPage);

  if (totalPages <= 1) {
    dom.pagination.innerHTML = '';
    return;
  }

  const cur = state.page;
  let html = `<button class="page-btn" onclick="goPage(${cur - 1})" ${cur === 1 ? 'disabled' : ''}>← Préc.</button>`;

  const pages = getPageRange(cur, totalPages);
  pages.forEach(p => {
    if (p === '...') {
      html += `<span class="page-dots">…</span>`;
    } else {
      html += `<button class="page-btn ${p === cur ? 'active' : ''}" onclick="goPage(${p})">${p}</button>`;
    }
  });

  html += `<button class="page-btn" onclick="goPage(${cur + 1})" ${cur === totalPages ? 'disabled' : ''}>Suiv. →</button>`;
  dom.pagination.innerHTML = html;
}

function getPageRange(cur, total) {
  if (total <= 7) return Array.from({length: total}, (_, i) => i + 1);
  const pages = [];
  if (cur <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (cur >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', cur - 1, cur, cur + 1, '...', total);
  }
  return pages;
}

window.goPage = function(page) {
  const totalPages = Math.ceil(state.filtered.length / state.perPage);
  if (page < 1 || page > totalPages) return;
  state.page = page;
  renderCards();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Modal ────────────────────────────────────────────────────────────────────
window.openModal = function(idx) {
  const start   = (state.page - 1) * state.perPage;
  const record  = state.filtered[start + idx];
  if (!record) return;

  const isFormation = state.activeTab === 'formations';
  const typeKey = isFormation ? record.BRANCHE : record.DESCRIPTIF;
  const cfg     = typeConfig(isFormation ? 'formations' : 'infrastructures', typeKey);
  const name    = isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION;

  const details = isFormation
    ? [
        { label: 'Branche',     val: record.BRANCHE },
        { label: 'Région',      val: titleCase(record.REGION) },
        { label: 'Département', val: titleCase(record.DEPARTEMENT) },
        { label: 'Commune',     val: titleCase(record.COMMUNE) },
        { label: 'Localité',    val: titleCase(record.LOCALITE) },
      ]
    : [
        { label: 'Type',        val: record.DESCRIPTIF },
        { label: 'Région',      val: titleCase(record.REGION) },
        { label: 'Département', val: titleCase(record.DEPARTEMENT) },
        { label: 'Commune',     val: titleCase(record.COMMUNE) },
        { label: 'Localité',    val: titleCase(record.LOCALITES) },
        { label: 'Milieu',      val: capitalize(record.MILIEU) },
        { label: 'Type de lieu',val: capitalize(record.TYPE_LOCALITE) },
      ];

  const lat = record.LATITUDE;
  const lon = record.LONGITUDE;

  dom.modalBody.innerHTML = `
    <div class="modal-type-badge" style="background:${cfg.bg};color:${cfg.color}">
      ${cfg.icon} ${typeKey}
    </div>
    <h2 class="modal-title">${name || '—'}</h2>
    <div class="modal-detail-grid">
      ${details.filter(d => d.val).map(d => `
        <div class="detail-item">
          <div class="detail-item-lbl">${d.label}</div>
          <div class="detail-item-val">${d.val}</div>
        </div>`).join('')}
    </div>
    ${lat && lon ? `
      <div class="modal-coords">📍 ${lat.toFixed(5)}, ${lon.toFixed(5)}</div>
      <a class="modal-map-link"
         href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}&zoom=15"
         target="_blank" rel="noopener">
        🗺 Voir sur OpenStreetMap
      </a>
    ` : ''}
  `;

  dom.modalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
};

function closeModal() {
  dom.modalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Panel Map (in-content) ───────────────────────────────────────────────────
function renderPanelMap() {
  dom.cardsWrapper.classList.add('hidden');
  dom.panelMapWrapper.classList.remove('hidden');

  if (!state.maps.panel) {
    state.maps.panel = L.map('panelMap', {
      center: [14.5, -14.5],
      zoom: 7,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(state.maps.panel);
    state.clusters.panel = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
    state.maps.panel.addLayer(state.clusters.panel);
  }

  // Clear & repopulate
  state.clusters.panel.clearLayers();

  const isFormation = state.activeTab === 'formations';

  state.filtered.forEach(record => {
    const lat = record.LATITUDE;
    const lon = record.LONGITUDE;
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

    const typeKey = isFormation ? record.BRANCHE : record.DESCRIPTIF;
    const cfg     = typeConfig(isFormation ? 'formations' : 'infrastructures', typeKey);
    const name    = isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION;

    const marker = L.marker([lat, lon], { icon: createMarkerIcon(cfg.color, cfg.icon) });
    marker.bindPopup(buildPopup(record, isFormation, cfg, name, typeKey));
    state.clusters.panel.addLayer(marker);
  });

  // Fit bounds
  if (state.clusters.panel.getLayers().length > 0) {
    state.maps.panel.fitBounds(state.clusters.panel.getBounds(), { padding: [40, 40] });
  }

  // Build legend
  buildLegend(dom.panelLegend, isFormation ? FORMATION_TYPES : INFRA_TYPES);
}

// ── Full Map Tab ─────────────────────────────────────────────────────────────
function initFullMap() {
  if (state.maps.full) return;

  state.maps.full = L.map('fullMap', {
    center: [14.5, -14.5],
    zoom: 7,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(state.maps.full);

  state.clusters.full = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 60 });
  state.maps.full.addLayer(state.clusters.full);

  populateFullMap(state.activeLayer);
  buildFullLegend();
}

function populateFullMap(layer) {
  if (!state.maps.full) return;
  state.clusters.full.clearLayers();

  const addMarkers = (dataset, isFormation) => {
    dataset.forEach(record => {
      const lat = record.LATITUDE;
      const lon = record.LONGITUDE;
      if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

      const typeKey = isFormation ? record.BRANCHE : record.DESCRIPTIF;
      const cfg     = typeConfig(isFormation ? 'formations' : 'infrastructures', typeKey);
      const name    = isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION;

      const marker = L.marker([lat, lon], { icon: createMarkerIcon(cfg.color, cfg.icon) });
      marker.bindPopup(buildPopup(record, isFormation, cfg, name, typeKey));
      state.clusters.full.addLayer(marker);
    });
  };

  if (layer === 'all' || layer === 'infrastructures') {
    addMarkers(state.data.infrastructures, false);
  }
  if (layer === 'all' || layer === 'formations') {
    addMarkers(state.data.formations, true);
  }
}

function buildFullLegend() {
  buildLegend(dom.fullLegend, { ...INFRA_TYPES, ...FORMATION_TYPES });
}

function buildLegend(container, typesObj) {
  if (!container) return;
  const items = Object.entries(typesObj)
    .filter(([k]) => k !== '_default')
    .map(([key, cfg]) => `
      <div class="legend-item">
        <span class="legend-dot" style="background:${cfg.color}"></span>
        <span>${cfg.icon} ${key}</span>
      </div>
    `).join('');
  container.innerHTML = items;
}

function buildPopup(record, isFormation, cfg, name, typeKey) {
  const lat = record.LATITUDE;
  const lon = record.LONGITUDE;
  const hasCoords = lat && lon && !isNaN(lat) && !isNaN(lon);
  const navId = hasCoords ? storeNav(lat, lon, name || typeKey) : -1;

  return `<div class="popup-inner">
    <span class="popup-type" style="background:${cfg.bg};color:${cfg.color}">${cfg.icon} ${typeKey}</span>
    <div class="popup-name">${name || '—'}</div>
    <div class="popup-loc">📍 ${titleCase(record.COMMUNE || '')}${(isFormation ? record.LOCALITE : record.LOCALITES) ? ', ' + titleCase(isFormation ? record.LOCALITE : record.LOCALITES) : ''}</div>
    <div class="popup-loc">🗺 ${titleCase(record.REGION || '')}</div>
    ${hasCoords ? `
    <button class="popup-nav-btn" onclick="navigateTo(${navId})">
      🧭 M'y rendre
    </button>` : ''}
  </div>`;
}

// ── Navigation / Routing functions ───────────────────────────────────────────

// Point d'entrée depuis les popups
window.navigateTo = function(id) {
  const d = _navStore[id];
  if (!d) return;

  // Fermer les popups ouverts
  if (state.maps.panel) state.maps.panel.closePopup();
  if (state.maps.full)  state.maps.full.closePopup();

  // Toujours naviguer sur la carte globale
  if (state.activeTab !== 'carte') {
    setTab('carte');
    const waitMap = setInterval(() => {
      if (state.maps.full) {
        clearInterval(waitMap);
        setTimeout(() => startNavigation(d.lat, d.lon, d.name), 150);
      }
    }, 80);
  } else {
    startNavigation(d.lat, d.lon, d.name);
  }
};

// Changement de profil (voiture / marche / vélo)
window.setNavProfile = function(profile) {
  nav.profile = profile;
  $$('.route-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.profile === profile));
  if (nav.active && nav.destLat) {
    startNavigation(nav.destLat, nav.destLon, nav.destName);
  }
};

// Recalculer depuis la position actuelle
window.recalcRoute = function() {
  if (nav.destLat) startNavigation(nav.destLat, nav.destLon, nav.destName);
};

function startNavigation(destLat, destLon, destName) {
  nav.destLat  = destLat;
  nav.destLon  = destLon;
  nav.destName = destName;

  if (!navigator.geolocation) {
    showToast('error', '⚠️ Géolocalisation non disponible sur cet appareil.');
    return;
  }

  showRoutePanel('loading', destName);
  showToast('loading', '📡 Localisation GPS en cours…');

  navigator.geolocation.getCurrentPosition(
    pos => {
      hideToast();
      drawRoute(pos.coords.latitude, pos.coords.longitude, destLat, destLon, destName);
    },
    err => {
      hideToast();
      const msgs = {
        1: '🔒 Accès GPS refusé. Autorisez la localisation dans votre navigateur.',
        2: '📡 Position introuvable. Activez le GPS.',
        3: '⏱ Délai GPS dépassé. Réessayez.',
      };
      showRoutePanel('error', destName, null, null, msgs[err.code] || 'Erreur de géolocalisation.');
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
  );
}

function drawRoute(userLat, userLon, destLat, destLon, destName) {
  const map = state.maps.full;
  if (!map) return;

  // Supprimer l'itinéraire précédent
  clearRouteControl();

  showRoutePanel('loading', destName);

  const profiles = { driving: 'driving', walking: 'foot', cycling: 'cycling' };
  const osrmProfile = profiles[nav.profile] || 'driving';

  // Marqueur position utilisateur (pulsant)
  const userIcon = L.divIcon({
    className: '',
    html: `<div class="user-dot-wrap">
             <div class="user-pulse"></div>
             <div class="user-dot"></div>
           </div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
  nav.userMarker = L.marker([userLat, userLon], { icon: userIcon, zIndexOffset: 1000 })
    .bindPopup('<b>📍 Votre position</b>').addTo(map);

  // Créer le contrôle d'itinéraire
  nav.control = L.Routing.control({
    waypoints: [
      L.latLng(userLat, userLon),
      L.latLng(destLat, destLon),
    ],
    router: L.Routing.osrmv1({
      serviceUrl: `https://router.project-osrm.org/route/v1`,
      profile: osrmProfile,
    }),
    routeWhileDragging:   false,
    addWaypoints:         false,
    draggableWaypoints:   false,
    fitSelectedRoutes:    true,
    showAlternatives:     false,
    show:                 false,   // masquer le panneau LRM par défaut
    collapsible:          false,
    lineOptions: {
      styles: [
        { color: '#0f4428', weight: 7, opacity: .45 },
        { color: '#1a6b3e', weight: 5, opacity: .9 },
      ],
      extendToWaypoints: true,
      missingRouteTolerance: 10,
    },
    createMarker: (i, wp) => {
      if (i === 0) return null; // on gère soi-même le marqueur user
      // Marqueur destination
      return L.marker(wp.latLng, {
        icon: createMarkerIcon('#c0392b', '🏁'),
        zIndexOffset: 1000,
      }).bindPopup(`<b>🏁 ${destName}</b>`);
    },
  });

  nav.control.on('routesfound', e => {
    const route   = e.routes[0];
    const summary = route.summary;
    const steps   = route.instructions || [];
    nav.active = true;
    showRoutePanel('found', destName, summary, steps);
    showToast('success', '✅ Itinéraire calculé !');
    setTimeout(hideToast, 2000);
  });

  nav.control.on('routingerror', err => {
    const msg = err.error?.message || 'Itinéraire introuvable entre ces deux points.';
    showRoutePanel('error', destName, null, null, msg);
    showToast('error', '❌ ' + msg);
    setTimeout(hideToast, 4000);
  });

  nav.control.addTo(map);

  // S'assurer que le conteneur LRM est caché
  setTimeout(() => {
    document.querySelectorAll('.leaflet-routing-container').forEach(el => {
      el.style.display = 'none';
    });
  }, 200);
}

function clearRouteControl() {
  if (nav.control && state.maps.full) {
    try { state.maps.full.removeControl(nav.control); } catch(e) {}
    nav.control = null;
  }
  if (nav.userMarker && state.maps.full) {
    try { state.maps.full.removeLayer(nav.userMarker); } catch(e) {}
    nav.userMarker = null;
  }
}

window.clearRoute = function() {
  clearRouteControl();
  nav.active   = false;
  nav.destLat  = null;
  nav.destLon  = null;
  nav.destName = '';
  hideRoutePanel();
};

// ── Route panel rendering ─────────────────────────────────────────────────────
function showRoutePanel(status, destName, summary, steps, errorMsg) {
  const panel = document.getElementById('routePanel');
  if (!panel) return;
  panel.classList.remove('hidden');

  const profileIcons = { driving: '🚗', walking: '🚶', cycling: '🚴' };

  const head = `
    <div class="route-panel-head">
      <span class="route-panel-title">
        🧭 Itinéraire vers
        <strong>${destName}</strong>
      </span>
      <button class="route-close-btn" onclick="clearRoute()">✕</button>
    </div>`;

  if (status === 'loading') {
    panel.innerHTML = head + `
      <div class="route-loading">
        <div class="spinner sm"></div>
        <span>Calcul de l'itinéraire en cours…</span>
      </div>`;
    return;
  }

  if (status === 'error') {
    panel.innerHTML = head + `
      <div style="padding:16px;font-size:13px;color:var(--accent);">${errorMsg}</div>
      <div class="route-panel-foot">
        <button class="btn-cancel-route" onclick="clearRoute()">✕ Fermer</button>
      </div>`;
    return;
  }

  // Format distance et durée
  const dist  = summary.totalDistance;
  const time  = summary.totalTime;
  const distStr = dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`;
  const timeStr = time >= 3600
    ? `${Math.floor(time / 3600)}h ${Math.floor((time % 3600) / 60)} min`
    : `${Math.floor(time / 60)} min`;

  // Mode de transport
  const modeBar = `
    <div class="route-mode-bar">
      ${['driving','walking','cycling'].map(p => `
        <button class="route-mode-btn ${nav.profile === p ? 'active' : ''}"
                data-profile="${p}"
                onclick="setNavProfile('${p}')">
          ${profileIcons[p]} ${p === 'driving' ? 'Voiture' : p === 'walking' ? 'À pied' : 'Vélo'}
        </button>`).join('')}
    </div>`;

  // Étapes turn-by-turn
  const stepsHtml = steps.map((step, i) => {
    const d = step.distance >= 1000
      ? `${(step.distance / 1000).toFixed(1)} km`
      : `${Math.round(step.distance)} m`;
    const isLast = i === steps.length - 1;
    return `
      <div class="route-step">
        <div class="step-num ${isLast ? 'dest' : ''}">${isLast ? '🏁' : i + 1}</div>
        <div class="step-body">
          <div class="step-text">${step.text}</div>
          ${!isLast ? `<div class="step-dist">${d}</div>` : ''}
        </div>
      </div>`;
  }).join('');

  panel.innerHTML = head + `
    <div class="route-summary">
      <div class="route-stat">
        <span class="route-stat-val">${distStr}</span>
        <span class="route-stat-lbl">Distance</span>
      </div>
      <div class="route-stat-sep"></div>
      <div class="route-stat">
        <span class="route-stat-val">${timeStr}</span>
        <span class="route-stat-lbl">Durée estimée</span>
      </div>
    </div>
    ${modeBar}
    <div class="route-steps">${stepsHtml}</div>
    <div class="route-panel-foot">
      <button class="btn-recalc" onclick="recalcRoute()">↺ Recalculer</button>
      <button class="btn-cancel-route" onclick="clearRoute()">✕ Annuler</button>
    </div>`;
}

function hideRoutePanel() {
  const panel = document.getElementById('routePanel');
  if (panel) panel.classList.add('hidden');
}

// ── Toast helpers ─────────────────────────────────────────────────────────────
let _toastTimer = null;

function showToast(type, msg) {
  const toast = document.getElementById('routeToast');
  if (!toast) return;
  clearTimeout(_toastTimer);
  toast.className = `route-toast ${type}`;
  toast.textContent = msg;
  toast.classList.remove('hidden');
}

function hideToast() {
  const toast = document.getElementById('routeToast');
  if (toast) toast.classList.add('hidden');
}

// ── Full map search ───────────────────────────────────────────────────────────
function setupFullMapSearch() {
  let timeout;
  dom.fullMapSearch.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const q = dom.fullMapSearch.value.toLowerCase().trim();
      if (!state.maps.full) return;

      state.clusters.full.clearLayers();

      const addFiltered = (dataset, isFormation) => {
        dataset.forEach(record => {
          const lat = record.LATITUDE;
          const lon = record.LONGITUDE;
          if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

          if (q) {
            const hay = [
              isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION,
              record.COMMUNE, record.REGION,
              isFormation ? record.LOCALITE : record.LOCALITES,
            ].filter(Boolean).join(' ').toLowerCase();
            if (!hay.includes(q)) return;
          }

          const typeKey = isFormation ? record.BRANCHE : record.DESCRIPTIF;
          const cfg     = typeConfig(isFormation ? 'formations' : 'infrastructures', typeKey);
          const name    = isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION;
          const marker  = L.marker([lat, lon], { icon: createMarkerIcon(cfg.color, cfg.icon) });
          marker.bindPopup(buildPopup(record, isFormation, cfg, name, typeKey));
          state.clusters.full.addLayer(marker);
        });
      };

      const layer = state.activeLayer;
      if (layer === 'all' || layer === 'infrastructures') addFiltered(state.data.infrastructures, false);
      if (layer === 'all' || layer === 'formations')       addFiltered(state.data.formations, true);
    }, 300);
  });
}

function initFullMapIfVisible() {
  if (state.activeTab === 'carte') initFullMap();
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function setTab(tab) {
  // Nettoyer l'itinéraire si on quitte la carte
  if (state.activeTab === 'carte' && tab !== 'carte') {
    clearRouteControl();
    hideRoutePanel();
  }

  state.activeTab = tab;
  state.page = 1;
  state.filters = { search: '', region: '', type: '', milieu: '' };

  // Update header tabs
  dom.navTabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));
  dom.mnavBtns.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tab));

  // Show/hide sections
  const showMain = tab !== 'carte';
  dom.appLayout.classList.toggle('hidden', !showMain);
  dom.fullMapSection.classList.toggle('hidden', showMain);

  if (tab === 'carte') {
    initFullMap();
    setupFullMapSearch();
    // Force map to resize
    setTimeout(() => state.maps.full && state.maps.full.invalidateSize(), 100);
  } else {
    // Toggle sidebar filter blocks
    dom.typeBlock.classList.toggle('hidden',    tab === 'formations');
    dom.brancheBlock.classList.toggle('hidden', tab === 'infrastructures');
    dom.milieuBlock.classList.toggle('hidden',  tab === 'formations');

    // Rebuild region options & chips
    buildRegionOptions();
    buildTypeChips();
    buildBrancheChips();

    // Reset UI
    dom.searchInput.value = '';
    dom.regionSelect.value = '';
    $$('.chip').forEach(c => c.classList.remove('active'));
    $$('.pill[data-milieu]').forEach(p => p.classList.toggle('active', p.dataset.milieu === ''));

    // Reset view
    setView('grid');

    applyFiltersAndRender();
  }
}

// ── View switching ────────────────────────────────────────────────────────────
function setView(view) {
  state.activeView = view;

  // Update all view buttons
  $$('.view-sm-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  $$('.view-pill').forEach(b => b.classList.toggle('active', b.dataset.view === view));

  if (view === 'grid') {
    renderCards();
  } else {
    renderPanelMap();
    setTimeout(() => state.maps.panel && state.maps.panel.invalidateSize(), 100);
  }
}

// ── Filter helpers ────────────────────────────────────────────────────────────
function resetAllFilters() {
  state.filters = { search: '', region: '', type: '', milieu: '' };
  dom.searchInput.value = '';
  dom.regionSelect.value = '';
  dom.searchClear.classList.add('hidden');

  $$('.chip').forEach(c => c.classList.remove('active'));
  $$('.pill[data-milieu]').forEach(p => p.classList.toggle('active', p.dataset.milieu === ''));

  applyFiltersAndRender(true);
}

// ── Event listeners ───────────────────────────────────────────────────────────
function bindEvents() {
  // Tab buttons
  dom.navTabs.forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));
  dom.mnavBtns.forEach(btn => btn.addEventListener('click', () => setTab(btn.dataset.tab)));

  // Search input
  let searchTimeout;
  dom.searchInput.addEventListener('input', () => {
    state.filters.search = dom.searchInput.value;
    dom.searchClear.classList.toggle('hidden', !dom.searchInput.value);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => applyFiltersAndRender(true), 280);
  });

  dom.searchClear.addEventListener('click', () => {
    dom.searchInput.value = '';
    state.filters.search = '';
    dom.searchClear.classList.add('hidden');
    applyFiltersAndRender(true);
    dom.searchInput.focus();
  });

  // Region select
  dom.regionSelect.addEventListener('change', () => {
    state.filters.region = dom.regionSelect.value;
    applyFiltersAndRender(true);
  });

  // Type chips (delegation)
  dom.typeChips.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const type = chip.dataset.type;
    state.filters.type = (state.filters.type === type) ? '' : type;
    buildTypeChips();
    applyFiltersAndRender(true);
  });

  dom.brancheChips.addEventListener('click', e => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const type = chip.dataset.type;
    state.filters.type = (state.filters.type === type) ? '' : type;
    buildBrancheChips();
    applyFiltersAndRender(true);
  });

  // Milieu pills
  dom.milieuGroup.addEventListener('click', e => {
    const pill = e.target.closest('.pill[data-milieu]');
    if (!pill) return;
    state.filters.milieu = pill.dataset.milieu;
    $$('.pill[data-milieu]').forEach(p => p.classList.toggle('active', p.dataset.milieu === state.filters.milieu));
    applyFiltersAndRender(true);
  });

  // View toggle (toolbar + sidebar)
  $$('.view-sm-btn').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));
  $$('.view-pill').forEach(btn => btn.addEventListener('click', () => setView(btn.dataset.view)));

  // Clear all
  dom.clearAll.addEventListener('click', resetAllFilters);

  // Mobile filter drawer
  dom.filterOpenBtn.addEventListener('click', openDrawer);
  dom.drawerClose.addEventListener('click', closeDrawer);
  dom.drawerOverlay.addEventListener('click', closeDrawer);
  dom.applyDrawerFilters.addEventListener('click', () => {
    closeDrawer();
    applyFiltersAndRender(true);
  });

  // Layer buttons (full map)
  dom.layerBtns.forEach(btn => btn.addEventListener('click', () => {
    state.activeLayer = btn.dataset.layer;
    dom.layerBtns.forEach(b => b.classList.toggle('active', b.dataset.layer === state.activeLayer));
    populateFullMap(state.activeLayer);
  }));

  // Modal close
  dom.modalClose.addEventListener('click', closeModal);
  dom.modalOverlay.addEventListener('click', e => {
    if (e.target === dom.modalOverlay) closeModal();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeDrawer();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      dom.searchInput.focus();
      dom.searchInput.select();
    }
  });

  // Header search button (focuses search or scrolls to it)
  dom.headerSearchBtn.addEventListener('click', () => {
    if (state.activeTab === 'carte') return;
    const w = window.innerWidth;
    if (w <= 700) {
      openDrawer();
    } else {
      dom.searchInput.focus();
      dom.searchInput.select();
    }
  });
}

function openDrawer() {
  buildDrawerContent();
  dom.filterDrawer.classList.remove('hidden');
  dom.drawerOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  dom.filterDrawer.classList.add('hidden');
  dom.drawerOverlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  bindEvents();
  loadData();
}

// Expose reset for empty state button
window.resetAllFilters = resetAllFilters;

// Start
document.addEventListener('DOMContentLoaded', init);
