/* ═══════════════════════════════════════════════════
   SCENEWS — Application principale
   ═══════════════════════════════════════════════════ */

'use strict';

// ── Type configurations ──────────────────────────────────────────────────────
const INFRA_TYPES = {
  'Centre culturel': { color: '#172331', bg: '#e2e8f0', icon: '🏛️' },
  "Centre d'animation": { color: '#f26a21', bg: '#ffedd5', icon: '🎭' },
  'Cinéma': { color: '#e11d48', bg: '#ffe4e6', icon: '🎬' },
  'Foyer des femmes': { color: '#9333ea', bg: '#f3e8ff', icon: '👩' },
  'Foyer des jeunes': { color: '#2563eb', bg: '#dbeafe', icon: '🏠' },
  'Galerie': { color: '#0891b2', bg: '#cffafe', icon: '🖼️' },
  'Musée': { color: '#7c3aed', bg: '#ede9fe', icon: '🏺' },
  'Salle des fêtes': { color: '#db2777', bg: '#fce7f3', icon: '🎉' },
  'Village artisanal': { color: '#d97706', bg: '#fef3c7', icon: '🧵' },
  '_default': { color: '#64748b', bg: '#f1f5f9', icon: '🏢' },
};

const FORMATION_TYPES = {
  'ARTS': { color: '#8b5cf6', bg: '#ede9fe', icon: '🎨' },
  'ARTS - AUDIOVISUEL': { color: '#8b5cf6', bg: '#ede9fe', icon: '🎨' },
  'ARTS- INFOGRAPHIE': { color: '#8b5cf6', bg: '#ede9fe', icon: '🎨' },
  'AUDIOVISUEL': { color: '#e11d48', bg: '#ffe4e6', icon: '📹' },
  'INFOGRAPHIE': { color: '#0ea5e9', bg: '#e0f2fe', icon: '💻' },
  'INFOGRAPHIE - AUDIOVISUEL': { color: '#0ea5e9', bg: '#e0f2fe', icon: '💻' },
  'INFOGRAPHIE - SERIGRAPHIE': { color: '#0ea5e9', bg: '#e0f2fe', icon: '🖨️' },
  'PEINTURE': { color: '#10b981', bg: '#d1fae5', icon: '🖌️' },
  'SERIGRAPHIE': { color: '#f59e0b', bg: '#fef3c7', icon: '🖨️' },
  '_default': { color: '#64748b', bg: '#f1f5f9', icon: '🎓' },
};

const REGIONS = [
  'DAKAR', 'DIOURBEL', 'FATICK', 'KAFFRINE', 'KAOLACK',
  'KEDOUGOU', 'KOLDA', 'LOUGA', 'MATAM', 'SAINT LOUIS',
  'SEDHIOU', 'TAMBACOUNDA', 'THIES', 'ZIGUINCHOR'
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
  fullMapFilter: '',
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
  navTabs: $$('.nav-tab'),
  mnavBtns: $$('.mnav-btn'),
  hamburger: $('hamburger'),
  headerSearchBtn: $('headerSearchBtn'),

  // Layout
  appLayout: $('appLayout'),
  fullMapSection: $('fullMapSection'),

  // Sidebar
  searchInput: $('searchInput'),
  searchClear: $('searchClear'),
  regionSelect: $('regionSelect'),
  typeBlock: $('typeBlock'),
  brancheBlock: $('brancheBlock'),
  milieuBlock: $('milieuBlock'),
  typeChips: $('typeChips'),
  brancheChips: $('brancheChips'),
  milieuGroup: $('milieuGroup'),
  clearAll: $('clearAll'),
  sideViewGrid: $('sideViewGrid'),
  sideViewMap: $('sideViewMap'),

  // Toolbar
  resultsTxt: $('resultsTxt'),
  filterOpenBtn: $('filterOpenBtn'),
  toolViewGrid: $('toolViewGrid'),
  toolViewMap: $('toolViewMap'),

  // Content
  cardsWrapper: $('cardsWrapper'),
  cardsGrid: $('cardsGrid'),
  loadingState: $('loadingState'),
  pagination: $('pagination'),
  panelMapWrapper: $('panelMapWrapper'),

  // Full map
  layerBtns: $$('.layer-btn'),
  fullMapSearch: $('fullMapSearch'),
  fullLegend: $('fullLegend'),
  panelLegend: $('panelLegend'),

  // Drawer
  drawerOverlay: $('drawerOverlay'),
  filterDrawer: $('filterDrawer'),
  drawerBody: $('drawerBody'),
  drawerClose: $('drawerClose'),
  applyDrawerFilters: $('applyDrawerFilters'),

  // Modal
  modalOverlay: $('modalOverlay'),
  modalBox: $('modalBox'),
  modalBody: $('modalBody'),
  modalClose: $('modalClose'),
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
      width: 32px;
      height: 32px;
      background-color: ${color};
      border: 2.5px solid #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 3px 6px rgba(0,0,0,0.25);
    ">
      <span style="font-size: 15px; line-height: 1;">${icon}</span>
    </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

// ── Fullscreen map control ───────────────────────────────────────────────────
const FS_EXPAND = '<svg viewBox="0 0 24 24"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>';
const FS_COLLAPSE = '<svg viewBox="0 0 24 24"><path d="M4 14h6v6m10-10h-6V4M4 10h6V4m10 10h-6v6"/></svg>';

function createFullscreenControl(containerSelector) {
  const FullscreenControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd(map) {
      const btn = L.DomUtil.create('button', 'map-fullscreen-btn');
      btn.title = 'Plein écran';
      btn.innerHTML = FS_EXPAND;
      btn.type = 'button';
      const container = document.querySelector(containerSelector);

      L.DomEvent.disableClickPropagation(btn);

      L.DomEvent.on(btn, 'click', function (e) {
        L.DomEvent.stop(e);
        if (!document.fullscreenElement) {
          container.requestFullscreen().then(() => {
            btn.innerHTML = FS_COLLAPSE;
            btn.title = 'Quitter plein écran';
            setTimeout(() => map.invalidateSize(), 120);
          }).catch(() => { });
        } else {
          document.exitFullscreen().then(() => {
            btn.innerHTML = FS_EXPAND;
            btn.title = 'Plein écran';
            setTimeout(() => map.invalidateSize(), 120);
          });
        }
      });

      // Gérer Escape et sortie externe
      document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement) {
          btn.innerHTML = FS_EXPAND;
          btn.title = 'Plein écran';
          setTimeout(() => map.invalidateSize(), 120);
        }
      });

      // Masquer si le navigateur ne supporte pas le fullscreen
      if (!document.fullscreenEnabled) btn.style.display = 'none';

      return btn;
    }
  });
  return new FullscreenControl();
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
    state.data.formations = formJson.sheets['CENTRE_FORMATION_CULTURE'].records;

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
  const formCount = state.data.formations.length;

  // Update stat badges
  $('sInfra').textContent = formatNum(infraCount);
  $('sForm').textContent = formatNum(formCount);
  $('infraBadge').textContent = formatNum(infraCount);
  $('formBadge').textContent = formatNum(formCount);

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
  const cfg = typeConfig(isFormation ? 'formations' : 'infrastructures', typeKey);
  const name = isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION;
  const commune = record.COMMUNE || '—';
  const region = record.REGION || '—';
  const locale = isFormation ? record.LOCALITE : record.LOCALITES;

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
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
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

window.goPage = function (page) {
  const totalPages = Math.ceil(state.filtered.length / state.perPage);
  if (page < 1 || page > totalPages) return;
  state.page = page;
  renderCards();
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Modal ────────────────────────────────────────────────────────────────────
window.openModal = function (idx) {
  const start = (state.page - 1) * state.perPage;
  const record = state.filtered[start + idx];
  if (!record) return;

  const isFormation = state.activeTab === 'formations';
  const typeKey = isFormation ? record.BRANCHE : record.DESCRIPTIF;
  const cfg = typeConfig(isFormation ? 'formations' : 'infrastructures', typeKey);
  const name = isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION;

  const details = isFormation
    ? [
      { label: 'Branche', val: record.BRANCHE },
      { label: 'Région', val: titleCase(record.REGION) },
      { label: 'Département', val: titleCase(record.DEPARTEMENT) },
      { label: 'Commune', val: titleCase(record.COMMUNE) },
      { label: 'Localité', val: titleCase(record.LOCALITE) },
    ]
    : [
      { label: 'Type', val: record.DESCRIPTIF },
      { label: 'Région', val: titleCase(record.REGION) },
      { label: 'Département', val: titleCase(record.DEPARTEMENT) },
      { label: 'Commune', val: titleCase(record.COMMUNE) },
      { label: 'Localité', val: titleCase(record.LOCALITES) },
      { label: 'Milieu', val: capitalize(record.MILIEU) },
      { label: 'Type de lieu', val: capitalize(record.TYPE_LOCALITE) },
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
      minZoom: 6,
      maxBounds: [[12.0, -18.0], [17.5, -11.0]],
      maxBoundsViscosity: 1.0,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 18,
    }).addTo(state.maps.panel);
    state.clusters.panel = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 50 });
    state.maps.panel.addLayer(state.clusters.panel);
    createFullscreenControl('.panel-map-wrapper').addTo(state.maps.panel);
  }

  // Clear & repopulate
  state.clusters.panel.clearLayers();

  const isFormation = state.activeTab === 'formations';

  state.filtered.forEach(record => {
    const lat = record.LATITUDE;
    const lon = record.LONGITUDE;
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

    const typeKey = isFormation ? record.BRANCHE : record.DESCRIPTIF;
    const cfg = typeConfig(isFormation ? 'formations' : 'infrastructures', typeKey);
    const name = isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION;

    const marker = L.marker([lat, lon], { icon: createMarkerIcon(cfg.color, cfg.icon) });
    marker.bindPopup(buildPopup(record, isFormation, cfg, name, typeKey));
    state.clusters.panel.addLayer(marker);
  });

  // Fit bounds
  if (state.clusters.panel.getLayers().length > 0) {
    state.maps.panel.fitBounds(state.clusters.panel.getBounds(), { padding: [40, 40] });
  }

  // Build legend
  buildLegend(dom.panelLegend, isFormation ? FORMATION_TYPES : INFRA_TYPES, 'panel');
}

// ── Full Map Tab ─────────────────────────────────────────────────────────────
function initFullMap() {
  if (state.maps.full) return;

  state.maps.full = L.map('fullMap', {
    center: [14.5, -14.5],
    zoom: 7,
    minZoom: 6,
    maxBounds: [[12.0, -18.0], [17.5, -11.0]],
    maxBoundsViscosity: 1.0,
  });

  // Track map interactions to cancel idle timeout
  state.maps.full.on('movestart zoomstart click dragstart', () => {
    clearFullMapIdleTimeout();
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  }).addTo(state.maps.full);

  state.clusters.full = L.markerClusterGroup({ chunkedLoading: true, maxClusterRadius: 60 });
  state.maps.full.addLayer(state.clusters.full);
  createFullscreenControl('.full-map-section').addTo(state.maps.full);

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
      if (state.fullMapFilter && state.fullMapFilter !== typeKey) return;

      const cfg = typeConfig(isFormation ? 'formations' : 'infrastructures', typeKey);
      const name = isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION;

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
  buildLegend(dom.fullLegend, { ...INFRA_TYPES, ...FORMATION_TYPES }, 'full');
}

function buildLegend(container, typesObj, context = 'panel') {
  if (!container) return;
  const items = Object.entries(typesObj)
    .filter(([k]) => k !== '_default')
    .map(([key, cfg]) => {
      const isActive = context === 'panel' ? state.filters.type === key : state.fullMapFilter === key;
      const hasActive = context === 'panel' ? !!state.filters.type : !!state.fullMapFilter;
      const opacity = (hasActive && !isActive) ? '0.4' : '1';
      return `
      <div class="legend-item" data-type="${key}" data-context="${context}" style="cursor:pointer; opacity:${opacity}; transition: opacity 0.2s; user-select:none;" title="Filtrer par ${key}">
        <span class="legend-dot" style="background:${cfg.color}"></span>
        <span>${cfg.icon} ${key}</span>
      </div>
    `;
    }).join('');
  container.innerHTML = items;

  // Add click events
  const legendItems = container.querySelectorAll('.legend-item');
  legendItems.forEach(item => {
    item.addEventListener('click', () => {
      const type = item.getAttribute('data-type');
      const ctx = item.getAttribute('data-context');

      if (ctx === 'panel') {
        if (state.filters.type === type) {
          state.filters.type = ''; // désélectionner
        } else {
          state.filters.type = type;
        }
        buildTypeChips();
        buildBrancheChips();
        buildDrawerContent();
        applyFiltersAndRender(true);
      } else if (ctx === 'full') {
        if (state.fullMapFilter === type) {
          state.fullMapFilter = ''; // désélectionner
        } else {
          state.fullMapFilter = type;
        }
        dom.fullMapSearch.dispatchEvent(new Event('input'));
        buildFullLegend();
      }
    });
  });
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
      📍 Itinéraire Google Maps
    </button>` : ''}
  </div>`;
}

// ── Navigation Google Maps ───────────────────────────────────────────────────

window.navigateTo = function (id) {
  const d = _navStore[id];
  if (!d) return;

  // Fermer les popups ouverts
  if (state.maps.panel) state.maps.panel.closePopup();
  if (state.maps.full) state.maps.full.closePopup();

  const dest = `${d.lat},${d.lon}`;

  // Essayer la géolocalisation pour inclure l'origine
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const origin = `${pos.coords.latitude},${pos.coords.longitude}`;
        window.open(
          `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=driving`,
          '_blank'
        );
      },
      () => {
        // GPS refusé → Google Maps détectera la position
        window.open(
          `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`,
          '_blank'
        );
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`,
      '_blank'
    );
  }
};




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
          if (state.fullMapFilter && state.fullMapFilter !== typeKey) return;
          const cfg = typeConfig(isFormation ? 'formations' : 'infrastructures', typeKey);
          const name = isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION;
          const marker = L.marker([lat, lon], { icon: createMarkerIcon(cfg.color, cfg.icon) });
          marker.bindPopup(buildPopup(record, isFormation, cfg, name, typeKey));
          state.clusters.full.addLayer(marker);
        });
      };

      const layer = state.activeLayer;
      if (layer === 'all' || layer === 'infrastructures') addFiltered(state.data.infrastructures, false);
      if (layer === 'all' || layer === 'formations') addFiltered(state.data.formations, true);
    }, 300);
  });
}

// ── Full map idle zoom logic ─────────────────────────────────────────────────
let fullMapIdleTimeout = null;

function clearFullMapIdleTimeout() {
  if (fullMapIdleTimeout) clearTimeout(fullMapIdleTimeout);
}

function startFullMapIdleTimeout() {
  clearFullMapIdleTimeout();
  fullMapIdleTimeout = setTimeout(() => {
    if (state.maps.full) {
      // Zoom vers la région Dakar/Mbour, qui concentre le plus d'activités
      state.maps.full.flyToBounds([
        [14.4, -17.55],
        [14.8, -16.95]
      ], { duration: 1.5 });
    }
  }, 5000);
}

function initFullMapIfVisible() {
  if (state.activeTab === 'carte') initFullMap();
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function setTab(tab) {
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
    setTimeout(() => {
      if (state.maps.full) {
        state.maps.full.invalidateSize();
        // Reset au panorama du Sénégal complet
        state.maps.full.setView([14.5, -14.5], 7);
        startFullMapIdleTimeout();
      }
    }, 100);
  } else {
    clearFullMapIdleTimeout();
    // Toggle sidebar filter blocks
    dom.typeBlock.classList.toggle('hidden', tab === 'formations');
    dom.brancheBlock.classList.toggle('hidden', tab === 'infrastructures');
    dom.milieuBlock.classList.toggle('hidden', tab === 'formations');

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
