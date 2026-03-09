/* ═══════════════════════════════════════════════════
   SCENEWS — Application principale
   ═══════════════════════════════════════════════════ */

'use strict';

// ── Type configurations ──────────────────────────────────────────────────────
const INFRA_TYPES = {
  'Centre culturel': { color: '#004a70', bg: '#e0f2fe', icon: '🏛️' },
  "Centre d'animation": { color: '#92400e', bg: '#fef3c7', icon: '🎭' },
  'Cinéma': { color: '#991b1b', bg: '#fee2e2', icon: '🎬' },
  'Foyer des femmes': { color: '#86198f', bg: '#fdf4ff', icon: '👩' },
  'Foyer des jeunes': { color: '#1e40af', bg: '#eff6ff', icon: '🏠' },
  'Galerie': { color: '#155e75', bg: '#ecfeff', icon: '🖼️' },
  'Musée': { color: '#5b21b6', bg: '#f5f3ff', icon: '🏺' },
  'Salle des fêtes': { color: '#9d174d', bg: '#fdf2f8', icon: '🎉' },
  'Village artisanal': { color: '#9a3412', bg: '#fff7ed', icon: '🧵' },
  '_default': { color: '#334155', bg: '#f8fafc', icon: '🏢' },
};

const FORMATION_TYPES = {
  'ARTS': { color: '#6b21a8', bg: '#f3e8ff', icon: '🎨' },
  'ARTS - AUDIOVISUEL': { color: '#6b21a8', bg: '#f3e8ff', icon: '🎨' },
  'ARTS- INFOGRAPHIE': { color: '#6b21a8', bg: '#f3e8ff', icon: '🎨' },
  'AUDIOVISUEL': { color: '#991b1b', bg: '#fee2e2', icon: '📹' },
  'INFOGRAPHIE': { color: '#075985', bg: '#e0f2fe', icon: '💻' },
  'INFOGRAPHIE - AUDIOVISUEL': { color: '#075985', bg: '#e0f2fe', icon: '💻' },
  'INFOGRAPHIE - SERIGRAPHIE': { color: '#075985', bg: '#e0f2fe', icon: '🖨️' },
  'PEINTURE': { color: '#065f46', bg: '#d1fae5', icon: '🖌️' },
  'SERIGRAPHIE': { color: '#92400e', bg: '#fef3c7', icon: '🖨️' },
  '_default': { color: '#334155', bg: '#f8fafc', icon: '🎓' },
};

const REGIONS = [
  'DAKAR', 'DIOURBEL', 'FATICK', 'KAFFRINE', 'KAOLACK',
  'KEDOUGOU', 'KOLDA', 'LOUGA', 'MATAM', 'SAINT LOUIS',
  'SEDHIOU', 'TAMBACOUNDA', 'THIES', 'ZIGUINCHOR'
];

// ── Application state ────────────────────────────────────────────────────────
const state = {
  activeTab: 'carte',   // 'infrastructures' | 'formations' | 'carte'
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
  fullLegendList: $('fullLegendList'),
  fullLegendHandle: $('fullLegendHandle'),
  fullMapBar: document.querySelector('.full-map-bar'),
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
      width: 40px;
      height: 40px;
      background-color: ${color};
      border: 3px solid #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 2px #000000, 0 4px 12px rgba(0,0,0,0.45);
    ">
      <span style="font-size: 20px; line-height: 1;">${icon}</span>
    </div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
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
  $('infraBadge').textContent = formatNum(infraCount);

  // Build filter UIs
  buildRegionOptions();
  buildTypeChips();
  buildBrancheChips();
  buildDrawerContent();

  // First render
  applyFiltersAndRender();

  // Init or populate full map immediately
  if (!state.maps.full) {
    initFullMap();
  } else {
    populateFullMap(state.activeLayer);
    buildFullLegend();
  }
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
         href="https://www.google.com/maps/search/?api=1&query=${lat},${lon}"
         target="_blank" rel="noopener">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
        Voir sur Google Maps
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
      minZoom: 7,
      maxBounds: [[12.2, -17.8], [16.8, -11.2]],
      maxBoundsViscosity: 1.0,
      attributionControl: true,
    });
    L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '© Google Maps',
      subdomains: ['0', '1', '2', '3'],
      maxZoom: 20,
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
    center: [14.497, -14.452],
    zoom: 7,
    minZoom: 6,
    zoomSnap: 0.1,    // Permet un zoom fractionnaire pour un fit parfait
    zoomDelta: 0.5,
    maxBounds: [[12.1, -17.8], [16.65, -11.2]], // Limite Nord très serrée pour cacher la Mauritanie
    maxBoundsViscosity: 1.0,
  });

  // Track map interactions to cancel idle timeout
  state.maps.full.on('movestart zoomstart click dragstart', () => {
    clearFullMapIdleTimeout();
  });

  L.tileLayer('https://mt{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
    attribution: '© Google Maps',
    subdomains: ['0', '1', '2', '3'],
    maxZoom: 20,
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
  buildLegend(dom.fullLegendList || dom.fullLegend, { ...INFRA_TYPES, ...FORMATION_TYPES }, 'full');
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
        // Redescendre le tiroir après le choix
        if (dom.fullLegend) dom.fullLegend.classList.remove('expanded');
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
    <div class="popup-loc">📍 ${titleCase(record.COMMUNE || '')}${record.DEPARTEMENT ? ' (' + titleCase(record.DEPARTEMENT) + ')' : ''}</div>
    <div class="popup-loc">🏘 ${titleCase(isFormation ? record.LOCALITE : record.LOCALITES || '')}</div>
    <div class="popup-loc">🗺 Région de ${titleCase(record.REGION || '')}</div>
    ${hasCoords ? `
    <button class="popup-nav-btn" onclick="navigateTo(${navId})">
      🚀 S'y rendre (Maps)
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




// ── NLP Map Search Engine ─────────────────────────────────────────────────────

const NLP_TYPES = {
  'musée': 'Musée', 'musees': 'Musée', 'musee': 'Musée', 'expositions': 'Musée', 'histoire': 'Musée', 'patrimoine': 'Musée', 'expo': 'Musée', 'culture': 'Musée', 'monument': 'Musée', 'tresor': 'Musée', 'antiquite': 'Musée', 'archeologie': 'Musée', 'archives': 'Musée', 'historique': 'Musée',
  'cinéma': 'Cinéma', 'cinema': 'Cinéma', 'cinemas': 'Cinéma', 'film': 'Cinéma', 'ecran': 'Cinéma', 'projection': 'Cinéma', 'projections': 'Cinéma', 'films': 'Cinéma', 'salle obscure': 'Cinéma', 'cine': 'Cinéma', 'audiovisuel': 'Cinéma', '7eme art': 'Cinéma', 'septieme art': 'Cinéma',
  'centre culturel': 'Centre culturel', 'centre': 'Centre culturel', 'centres': 'Centre culturel', 'culturel': 'Centre culturel', 'maison de la culture': 'Centre culturel', 'espace culturel': 'Centre culturel', 'complexe culturel': 'Centre culturel', 'institut': 'Centre culturel', 'alliance': 'Centre culturel',
  "centre d'animation": "Centre d'animation", 'animation': "Centre d'animation", 'culturelle': 'Centre culturel', 'activités': "Centre d'animation", 'loisirs': "Centre d'animation", 'animation culturelle': "Centre d'animation", 'jeunesse': "Centre d'animation", 'socio-culturel': "Centre d'animation",
  'foyer femmes': 'Foyer des femmes', 'foyer des femmes': 'Foyer des femmes', 'femmes': 'Foyer des femmes', 'amazones': 'Foyer des femmes', 'case des femmes': 'Foyer des femmes', 'groupement': 'Foyer des femmes', 'cooperative': 'Foyer des femmes', 'association': 'Foyer des femmes',
  'foyer femme': 'Foyer des femmes', 'femme': 'Foyer des femmes', 'atelier femme': 'Foyer des femmes', 'promotion': 'Foyer des femmes',
  'foyer jeunes': 'Foyer des jeunes', 'foyer des jeunes': 'Foyer des jeunes', 'jeunes': 'Foyer des jeunes', 'jeunesses': 'Foyer des jeunes', 'maison de quartier': 'Foyer des jeunes', 'foyer municipal': 'Foyer des jeunes',
  'foyer jeune': 'Foyer des jeunes', 'foyer': 'Foyer des jeunes', 'foyers': 'Foyer des jeunes', 'jeune': 'Foyer des jeunes', 'case des jeunes': 'Foyer des jeunes', 'mjc': 'Foyer des jeunes', 'clac': 'Foyer des jeunes',
  'galerie': 'Galerie', 'galeries': 'Galerie', 'art': 'Galerie', 'exposition': 'Galerie', 'tableaux': 'Galerie', 'peinture': 'Galerie', 'peintre': 'Galerie', 'artistes': 'Galerie', 'plasticien': 'Galerie', 'sculpture': 'Galerie', 'visuel': 'Galerie', 'arts plastiques': 'Galerie', 'vernissage': 'Galerie',
  'salle fête': 'Salle des fêtes', 'salle des fêtes': 'Salle des fêtes', 'salle fetes': 'Salle des fêtes', 'evenement': 'Salle des fêtes', 'fetes': 'Salle des fêtes', 'ceremonie': 'Salle des fêtes', 'mariage': 'Salle des fêtes', 'reunion': 'Salle des fêtes', 'reception': 'Salle des fêtes',
  'salle': 'Salle des fêtes', 'salles': 'Salle des fêtes', 'polyvalent': 'Salle des fêtes', 'polyvalente': 'Salle des fêtes', 'auditorium': 'Salle des fêtes', 'banquet': 'Salle des fêtes', 'conference': 'Salle des fêtes', 'seminaire': 'Salle des fêtes',
  'village artisanal': 'Village artisanal', 'artisanal': 'Village artisanal', 'artisanat': 'Village artisanal', 'souvenirs': 'Village artisanal', 'marche artisanal': 'Village artisanal', 'sculpture': 'Village artisanal', 'boutique': 'Village artisanal', 'metier': 'Village artisanal', 'forge': 'Village artisanal', 'tissage': 'Village artisanal', 'couture': 'Village artisanal', 'poterie': 'Village artisanal', 'souvenir': 'Village artisanal',
  'bibliothèque': 'Bibliothèque', 'bibliotheque': 'Bibliothèque', 'livre': 'Bibliothèque', 'lecture': 'Bibliothèque', 'lire': 'Bibliothèque', 'bouquin': 'Bibliothèque', 'mediatheque': 'Bibliothèque', 'archives': 'Bibliothèque', 'documentation': 'Bibliothèque', 'lecture publique': 'Bibliothèque',
  'maison de la culture': 'Maison de la culture', 'maison culture': 'Maison de la culture',
  'théâtre': ['Centre culturel', 'Salle des fêtes'], 'theatre': ['Centre culturel', 'Salle des fêtes'], 'comedie': ['Centre culturel', 'Salle des fêtes'], 'piece': ['Centre culturel', 'Salle des fêtes'], 'drame': ['Centre culturel', 'Salle des fêtes'], 'spectacle vivant': ['Centre culturel', 'Salle des fêtes'],
  'spectacle': ['Centre culturel', 'Salle des fêtes', "Centre d'animation"], 'spectacles': ['Centre culturel', 'Salle des fêtes', "Centre d'animation"], 'concert': ['Centre culturel', 'Salle des fêtes'], 'musique': ['Centre culturel', 'Salle des fêtes'], 'performance': ['Centre culturel', 'Salle des fêtes'], 'festival': ['Centre culturel', 'Salle des fêtes', 'Musée'],
  'scène': ['Centre culturel', 'Salle des fêtes'], 'podium': ['Centre culturel', 'Salle des fêtes'], 'danse': ['Centre culturel', 'Salle des fêtes'], 'folklore': ['Centre culturel', 'Salle des fêtes'], 'ballet': ['Centre culturel', 'Salle des fêtes'],
  'foyer': 'Foyer des jeunes', 'case': 'Foyer des jeunes', 'social': 'Foyer des jeunes', 'communautaire': 'Foyer des jeunes',
  'formation': 'formations', 'ecole': 'formations', 'etablissement': 'formations', 'cours': 'formations', 'etudes': 'formations', 'apprendre': 'formations', 'metier': 'formations', 'formation professionnelle': 'formations', 'metiers du spectacle': 'formations',
};

const NLP_STOP_WORDS = [
  'je', 'cherche', 'trouve', 'montre', 'donne', 'moi', 'les', 'des', 'un', 'une', 'le', 'la', 'salut', 'coucou', 'bonjour', 'bonsoir', 'hey', 'yo', 'recherche',
  'pourriez', 'vous', 'vouloir', 'voir', 'tous', 'ceux', 'celui', 'ce', 'cette', 'est', 'sont', 'dis', 'parle', 'sait', 'connais', 'liste', 'recapitulatif',
  'il', 'y', 'a', 'ou', 'se', 'trouvent', 'situés', 'ouvert', 'dans', 'sur', 'autour', 'de', 'quand', 'comment', 'pourquoi', 'qui', 'quoi', 'quel', 'quelle', 'quelles',
  'du', 'au', 'aux', 'pres', 'proche', 'chez', 'avec', 'et', 'à', 'quel', 'quels', 'toutes', 'mon', 'ma', 'ton', 'ta', 'son', 'sa', 'notre', 'votre', 'leur', 'leurs',
  'svp', 'plait', 'merci', 'bien', 'tres', 'vraiment', 'un peu', 'beaucoup', 'quelques', 'plusieurs', 'certains', 'dites', 'indique', 'trouve-moi'
];

const NLP_REGIONS = {
  'dakar': 'DAKAR', 'diourbel': 'DIOURBEL', 'fatick': 'FATICK',
  'kaffrine': 'KAFFRINE', 'kaolack': 'KAOLACK', 'kedougou': 'KEDOUGOU',
  'kédougou': 'KEDOUGOU', 'kolda': 'KOLDA', 'louga': 'LOUGA',
  'matam': 'MATAM', 'saint-louis': 'SAINT LOUIS', 'saint louis': 'SAINT LOUIS',
  'sedhiou': 'SEDHIOU', 'sédhiou': 'SEDHIOU',
  'tambacounda': 'TAMBACOUNDA', 'tamba': 'TAMBACOUNDA',
  'thies': 'THIES', 'thiès': 'THIES', 'thies': 'THIES',
  'ziguinchor': 'ZIGUINCHOR', 'zigui': 'ZIGUINCHOR',
};

const NLP_MILIEU = {
  'urbain': 'URBAIN', 'ville': 'URBAIN', 'urban': 'URBAIN',
  'rural': 'RURAL', 'campagne': 'RURAL', 'village': 'RURAL',
};

// Region bounding boxes for auto-zoom [south, west, north, east]
const REGION_BOUNDS = {
  'DAKAR': [[14.60, -17.55], [14.87, -17.10]],
  'THIES': [[14.50, -17.10], [15.10, -16.70]],
  'DIOURBEL': [[14.50, -16.30], [15.00, -15.70]],
  'SAINT LOUIS': [[15.50, -16.60], [16.65, -15.00]],
  'LOUGA': [[15.20, -16.30], [16.00, -14.80]],
  'MATAM': [[14.90, -13.80], [16.00, -12.20]],
  'FATICK': [[13.90, -16.90], [14.55, -15.70]],
  'KAOLACK': [[13.80, -16.40], [14.60, -15.60]],
  'KAFFRINE': [[13.70, -15.50], [14.40, -14.80]],
  'KEDOUGOU': [[12.20, -12.75], [13.10, -11.80]],
  'KOLDA': [[12.60, -15.20], [13.40, -13.90]],
  'SEDHIOU': [[12.40, -16.10], [13.00, -14.90]],
  'TAMBACOUNDA': [[12.70, -14.80], [14.00, -11.50]],
  'ZIGUINCHOR': [[12.30, -16.70], [12.75, -15.60]],
};

function parseNaturalQuery(raw) {
  const qClean = raw.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "") // Strip punctuation
    .replace(/\s{2,}/g, " ") // Clean double spaces
    .replace(/['']/g, "'");

  const intent = { types: [], regions: [], milieu: null, freeText: '' };

  // Detect types (can match multiple)
  Object.keys(NLP_TYPES).forEach(key => {
    const kNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (new RegExp(`\\b${kNorm}\\b`).test(qClean)) {
      const val = NLP_TYPES[key];
      if (val === 'formations') {
        state.activeLayer = 'formations';
      } else {
        const vals = Array.isArray(val) ? val : [val];
        vals.forEach(v => {
          if (!intent.types.includes(v)) intent.types.push(v);
        });
      }
    }
  });

  // Detect regions
  Object.keys(NLP_REGIONS).forEach(key => {
    const kNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (new RegExp(`\\b${kNorm}\\b`).test(qClean)) {
      const val = NLP_REGIONS[key];
      if (!intent.regions.includes(val)) intent.regions.push(val);
    }
  });

  // Detect milieu
  for (const [key, val] of Object.entries(NLP_MILIEU)) {
    const kNorm = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (new RegExp(`\\b${kNorm}\\b`).test(qClean)) {
      intent.milieu = val;
      break;
    }
  }

  // Final cleanup for free text
  let words = qClean.split(/\s+/);
  intent.freeText = words
    .filter(w => !NLP_STOP_WORDS.includes(w))
    .filter(w => !Object.keys(NLP_TYPES).some(k => k.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === w))
    .filter(w => !Object.keys(NLP_REGIONS).some(k => k.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === w))
    .filter(w => !Object.keys(NLP_MILIEU).some(k => k.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === w))
    .join(' ')
    .trim();

  return intent;
}

function matchRecord(record, isFormation, intent) {
  const name = (isFormation ? record.NOM_ETABLISSEMENT : record.DESIGNATION) || '';
  const region = (record.REGION || '').toUpperCase();
  const milieu = (record.MILIEU || '').toUpperCase();
  const typeKey = isFormation ? record.BRANCHE : record.DESCRIPTIF;
  const commune = (record.COMMUNE || '').toLowerCase();
  const localite = ((isFormation ? record.LOCALITE : record.LOCALITES) || '').toLowerCase();

  // Type filter
  if (intent.types.length) {
    const match = intent.types.some(t =>
      (typeKey || '').toLowerCase().includes(t.toLowerCase()) ||
      t.toLowerCase().includes((typeKey || '').toLowerCase())
    );
    if (!match) return false;
  }

  // Region filter
  if (intent.regions.length) {
    if (!intent.regions.includes(region)) return false;
  }

  // Milieu filter
  if (intent.milieu && milieu !== intent.milieu) return false;

  // Free text — matching all words in keywords
  if (intent.freeText.length > 1) {
    const hay = [name, commune, localite].join(' ').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const needles = intent.freeText.normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/\s+/);

    // Each word in the freeText must be found in the record fields
    const allMatch = needles.every(word => hay.includes(word));
    if (!allMatch) return false;
  }

  return true;
}

function renderNlpChips(intent, count) {
  const box = document.getElementById('nlpInterpret');
  if (!box) return;

  if (!intent.types.length && !intent.regions.length && !intent.milieu && !intent.freeText) {
    box.classList.add('hidden');
    return;
  }

  const chips = [];
  intent.types.forEach(t =>
    chips.push(`<span class="nlp-chip type">🏛 ${t}</span>`));
  intent.regions.forEach(r =>
    chips.push(`<span class="nlp-chip region">📍 ${r}</span>`));
  if (intent.milieu)
    chips.push(`<span class="nlp-chip milieu">🌍 ${intent.milieu}</span>`);
  if (intent.freeText)
    chips.push(`<span class="nlp-chip name">🔤 "${intent.freeText}"</span>`);

  chips.push(`<span class="nlp-count${count === 0 ? ' zero' : ''}">${count} résultat${count > 1 ? 's' : ''}</span>`);

  box.innerHTML = chips.join('');
  box.classList.remove('hidden');
}

function autoZoomToResults(intent, hits) {
  const map = state.maps.full;
  if (!map || !hits.length) return;

  // Zoom to region bounds if single region
  if (intent.regions.length === 1 && REGION_BOUNDS[intent.regions[0]]) {
    map.flyToBounds(REGION_BOUNDS[intent.regions[0]], { duration: 1.0, padding: [30, 30] });
    return;
  }

  // Otherwise fit all result markers
  const latlngs = hits
    .filter(r => r.lat && r.lon)
    .map(r => [r.lat, r.lon]);
  if (latlngs.length) {
    const bounds = L.latLngBounds(latlngs);
    map.flyToBounds(bounds, { duration: 1.0, padding: [40, 40], maxZoom: 12 });
  }
}

// ── Voice & Chatbot ─────────────────────────────────────────────────────────
function speakText(text, lang = 'fr-FR') {
  if (!window.speechSynthesis) return;
  // Stop existing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  // Find a good female voice if possible
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.startsWith('fr') && v.name.includes('Google'));
  if (preferredVoice) utterance.voice = preferredVoice;

  window.speechSynthesis.speak(utterance);
}

function speakWelcome() {
  const french = "Bonjour ! Je suis votre guide Scenews. Que souhaitez-vous découvrir au Sénégal aujourd'hui ?";
  const wolof = "Salamalekum ! Man moy sa guide culturel. Lan nga beugg guiss ci Sénégal tay ?";

  speakText(french);
  // Optional delay for Wolof
  setTimeout(() => speakText(wolof), 6000);
}

// ── Full map search & Bot ─────────────────────────────────────────────────────
function addBotMessage(text, options = []) {
  const container = document.getElementById('chatbotContainer');
  if (!container) return;

  // Typing indicator
  const indicator = document.createElement('div');
  indicator.className = 'chatbot-bubble';
  indicator.id = 'typingIndicator';
  indicator.innerHTML = `
    <div class="bot-avatar">🎭</div>
    <div class="typing-indicator">
      <div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>
    </div>`;
  container.appendChild(indicator);
  container.parentElement.scrollTop = container.parentElement.scrollHeight;

  setTimeout(() => {
    indicator.remove();
    const bubble = document.createElement('div');
    bubble.className = 'chatbot-bubble';
    bubble.innerHTML = `
      <div class="bot-avatar">🎭</div>
      <div class="bot-msg">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px;">
          <span>${text}</span>
          <button onclick="speakText('${text.replace(/'/g, "\\'").replace(/<[^>]*>/g, '')}')" style="background:none; border:none; cursor:pointer; font-size:16px; opacity:0.6;" title="Écouter">🔊</button>
        </div>
        ${options.length ? `
          <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
            ${options.map(opt => `<button class="chip" onclick="document.getElementById('fullMapSearch').value='${opt}'; document.getElementById('fullMapSearch').dispatchEvent(new Event('input'))" style="font-size:11px; padding:4px 10px; cursor:pointer; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:20px;">${opt}</button>`).join('')}
          </div>
        ` : ''}
      </div>`;
    container.appendChild(bubble);
    container.parentElement.scrollTop = container.parentElement.scrollHeight;
  }, 600);
}

function getBotResponse(intent, count, raw) {
  const low = raw.toLowerCase().trim();

  // Salutations
  if (low.match(/\b(bonjour|salut|coucou|bonsoir|he?y|yo|salam|amalekum)\b/)) {
    let greeting = "Bonjour ! Salamalekum ! ✨ Je suis ravi de vous accompagner dans votre exploration du patrimoine sénégalais.";
    if (count > 0) {
      greeting = `Bonjour ! Salamalekum ! ✨ Ravi de vous revoir. J'ai justement identifié <b>${count} lieu${count > 1 ? 's' : ''}</b> qui pourraient vous intéresser au vu de votre recherche actuelle.`;
    }
    return greeting;
  }

  // Aide et fonctionnement
  if (low.match(/\b(aide|help|comment|marche|quoi faire|utilis[er|at])\b/)) {
    return "C'est très simple ! Je suis votre guide intelligent. Posez-moi une question comme si vous parliez à un ami. <br><br>Ex: <i>'Quels sont les musées à Saint-Louis ?'</i> ou <i>'Je cherche un centre culturel urbain'</i>. Je filtrerai la carte instantanément pour vous ! 🗺️";
  }

  // Identité et mission
  if (low.match(/\b(qui|es|tu|application|scenews|concept|mission)\b/)) {
    return "Je suis l'âme numérique de <b>Scenews</b>. Ma mission est de valoriser la richesse culturelle du Sénégal en rendant chaque centre, musée ou galerie visible et accessible à tous, partout sur le territoire. 🎭🇸🇳";
  }

  // Gratitude
  if (low.match(/\b(merci|thx|thanks|genial|super|top|bravo|waaw|diereudieuf)\b/)) {
    return "Diereudieuf ! C'est un plaisir de vous aider. N'hésitez pas si vous avez d'autres curiosités culturelles ! 🐢✨";
  }

  // Gestion des résultats nuls
  if (count === 0) {
    if (intent.regions.length && intent.types.length) {
      return `Je n'ai pas trouvé d'infrastructures de type <i>${intent.types.join(', ')}</i> spécifiquement en région <b>${intent.regions.join(', ')}</b> pour le moment. <br><br>💡 Conseil : Essayez d'élargir votre recherche ou de vérifier les régions voisines !`;
    }
    if (intent.freeText) {
      return `Zéro résultat pour "<b>${intent.freeText}</b>". Peut-être un word-clé plus général ? J'apprends encore chaque jour, n'hésitez pas à reformuler ! ✨`;
    }
    return "Aïe, je n'ai pas trouvé de correspondance exacte... ✨ <br>Voulez-vous essayer de chercher par type (Musées, Galeries...) ou par région ?";
  }

  // Réponses structurées et riches
  let msg = `Parfait ! J'ai sélectionné <b>${count} point${count > 1 ? 's' : ''}</b> remarquable${count > 1 ? 's' : ''}`;

  const typeStr = intent.types.length ? ` de type <i>${intent.types.join(', ')}</i>` : "";
  const regStr = intent.regions.length ? ` en région <b>${intent.regions.join(', ')}</b>` : "";
  const searchStr = (intent.freeText && intent.freeText.length > 2) ? ` correspondant à votre recherche "<b>${intent.freeText}</b>"` : "";

  msg += typeStr + regStr + searchStr + ".";

  // Ajout d'une touche de personnalité selon le volume de résultats
  if (count === 1) {
    msg += " C'est une petite pépite à découvrir absolument ! 📍";
  } else if (count > 10) {
    msg += " La zone est particulièrement dynamique, vous avez l'embarras du choix ! 🎨🎭";
  } else {
    msg += " Jetez un œil aux détails sur la carte, c'est passionnant ! 📍🗺️";
  }

  return msg;
}

function setupFullMapSearch() {
  const input = dom.fullMapSearch;
  const clearBtn = document.getElementById('fullMapClear');
  let timeout;
  let lastQuery = '';
  let lastIntentKey = '';

  const doSearch = () => {
    const raw = input.value.trim();
    if (clearBtn) clearBtn.classList.toggle('hidden', !raw);

    if (!state.maps.full) return;
    state.clusters.full.clearLayers();

    if (!raw) {
      document.getElementById('nlpInterpret')?.classList.add('hidden');
      populateFullMap(state.activeLayer);
      return;
    }

    const intent = parseNaturalQuery(raw);
    const hits = [];

    const processData = (dataset, isFo) => {
      dataset.forEach(rec => {
        if (!matchRecord(rec, isFo, intent)) return;

        const lat = rec.LATITUDE;
        const lon = rec.LONGITUDE;
        if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;

        const typeKey = isFo ? rec.BRANCHE : rec.DESCRIPTIF;
        const cfg = typeConfig(isFo ? 'formations' : 'infrastructures', typeKey);
        const name = isFo ? rec.NOM_ETABLISSEMENT : rec.DESIGNATION;

        const marker = L.marker([lat, lon], { icon: createMarkerIcon(cfg.color, cfg.icon) });
        marker.bindPopup(buildPopup(rec, isFo, cfg, name, typeKey));
        state.clusters.full.addLayer(marker);

        hits.push({ lat, lon });
      });
    };

    if (state.activeLayer === 'all' || state.activeLayer === 'infrastructures') {
      processData(state.data.infrastructures, false);
    }
    if (state.activeLayer === 'all' || state.activeLayer === 'formations') {
      processData(state.data.formations, true);
    }

    renderNlpChips(intent, hits.length);
    autoZoomToResults(intent, hits);

    // Chatbot response logic
    const intentKey = JSON.stringify({ t: intent.types, r: intent.regions, m: intent.milieu, f: intent.freeText });
    if (raw !== lastQuery && raw.length > 2 && intentKey !== lastIntentKey) {
      const response = getBotResponse(intent, hits.length, raw);
      addBotMessage(response);
      lastQuery = raw;
      lastIntentKey = intentKey;
    }
  };

  input.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(doSearch, 320);
  });

  // Fermer le clavier mobile après validation (touche Entrée / bouton Rechercher)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(timeout);
      doSearch();
      input.blur(); // Ferme le clavier virtuel
    }
  });

  // L'événement 'search' est déclenché sur type="search" quand on appuie Entrée ou ✕
  input.addEventListener('search', () => {
    clearTimeout(timeout);
    doSearch();
    setTimeout(() => input.blur(), 50);
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      lastQuery = '';
      lastIntentKey = '';
      // Reset chatbot container to welcome message with suggestions
      const chatbotContainer = document.getElementById('chatbotContainer');
      if (chatbotContainer) {
        chatbotContainer.innerHTML = `
          <div class="chatbot-bubble" id="botWelcome">
            <div class="bot-avatar">🎭</div>
            <div class="bot-msg">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <span>Bonjour ! Je suis votre guide culturel.</span>
                <button onclick="speakWelcome()" style="background:none; border:none; cursor:pointer; font-size:18px; padding:0 5px;" title="Écouter le message">🔊</button>
              </div>
              <b>Que souhaitez-vous découvrir au Sénégal aujourd'hui ?</b> 
              <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                <button class="chip" onclick="document.getElementById('fullMapSearch').value='Musées à Dakar'; document.getElementById('fullMapSearch').dispatchEvent(new Event('input'))" style="font-size:11px; padding:4px 10px; cursor:pointer; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:20px;">🏛 Musées</button>
                <button class="chip" onclick="document.getElementById('fullMapSearch').value='Cinémas'; document.getElementById('fullMapSearch').dispatchEvent(new Event('input'))" style="font-size:11px; padding:4px 10px; cursor:pointer; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:20px;">🎬 Cinémas</button>
                <button class="chip" onclick="document.getElementById('fullMapSearch').value='Salles de fête'; document.getElementById('fullMapSearch').dispatchEvent(new Event('input'))" style="font-size:11px; padding:4px 10px; cursor:pointer; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:20px;">🎉 Salles de fête</button>
                <button class="chip" onclick="document.getElementById('fullMapSearch').value='Artisanat'; document.getElementById('fullMapSearch').dispatchEvent(new Event('input'))" style="font-size:11px; padding:4px 10px; cursor:pointer; background:#f1f5f9; border:1px solid #cbd5e1; border-radius:20px;">🧵 Artisanat</button>
              </div>
              <br><small style="opacity:0.7;">(Tapez votre question ci-dessous)</small>
            </div>
          </div>`;
      }
      doSearch();
      input.blur();
    });
  }
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
  }, 15000); // 15 seconds
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
  const isMapTab = tab === 'carte';
  dom.appLayout.classList.toggle('hidden', isMapTab);
  dom.fullMapSection.classList.toggle('hidden', !isMapTab);

  // Masquer Header et Stats Bar en mode Carte pour maximiser l'espace
  const header = $('header');
  const statsBar = $('statsBar');
  if (header) header.style.display = isMapTab ? 'none' : '';
  if (statsBar) statsBar.style.display = isMapTab ? 'none' : '';

  // Ajuster la hauteur de la section carte si header/stats sont masqués
  if (isMapTab) {
    dom.fullMapSection.style.minHeight = '100vh';
    dom.fullMapSection.style.height = '100vh';
  } else {
    dom.fullMapSection.style.minHeight = '';
    dom.fullMapSection.style.height = '';
  }

  if (tab === 'carte') {
    initFullMap();
    setupFullMapSearch();
    speakWelcome();
    // Force map to resize
    setTimeout(() => {
      if (state.maps.full) {
        state.maps.full.invalidateSize();
        // Ajustement pour voir le Sénégal en haut de l'écran (cache la Mauritanie sur mobile)
        const senegalBounds = [[12.25, -17.55], [16.68, -11.35]];
        const isMobile = window.innerWidth <= 768;
        state.maps.full.fitBounds(senegalBounds, {
          paddingBottomRight: [0, isMobile ? 160 : 20],
          paddingTopLeft: [0, isMobile ? 70 : 0]
        });
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

  // ── Drag logic for mobile chatbot bar ──
  let touchStartY = 0;
  let currentTranslateY = 0;
  let isDragging = false;

  if (dom.fullMapBar) {
    dom.fullMapBar.addEventListener('touchstart', (e) => {
      if (window.innerWidth > 768) return;
      // Empêche le drag si on tape dans l'input
      if (e.target.tagName === 'INPUT' || e.target.closest('button')) return;

      touchStartY = e.touches[0].clientY;
      isDragging = true;
      dom.fullMapBar.style.transition = 'none';
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isDragging || window.innerWidth > 768) return;

      const touchY = e.touches[0].clientY;
      let diff = touchY - touchStartY;

      // On permet de glisser vers le bas ET largement vers le haut
      if (diff < -400) diff = -400; // Limite vers le haut (beaucoup plus libre)

      currentTranslateY = diff;
      dom.fullMapBar.style.transform = `translateY(${currentTranslateY}px)`;
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (!isDragging) return;
      isDragging = false;
      dom.fullMapBar.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

      // Si poussé de plus de 80px, on peut imaginer un "dock" ou juste retour
      if (currentTranslateY > 80) {
        // Optionnel: on pourrait le cacher ou le réduire, ici on le remet avec un effet élégant
        dom.fullMapBar.style.transform = `translateY(0)`;
      } else {
        dom.fullMapBar.style.transform = `translateY(0)`;
      }
      currentTranslateY = 0;
    });
  }

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

  // Swipe gesture for full map legend drawer
  if (dom.fullLegend) {
    let _touchStartY = 0;
    let _touchStartX = 0;

    dom.fullLegend.addEventListener('touchstart', (e) => {
      _touchStartY = e.touches[0].clientY;
      _touchStartX = e.touches[0].clientX;
    }, { passive: true });

    dom.fullLegend.addEventListener('touchend', (e) => {
      const dy = _touchStartY - e.changedTouches[0].clientY; // positive = swipe up
      const dx = Math.abs(_touchStartX - e.changedTouches[0].clientX);
      // Ignore horizontal swipes
      if (dx > Math.abs(dy)) return;
      const THRESHOLD = 30;
      if (dy > THRESHOLD) {
        // Swipe UP → expand
        dom.fullLegend.classList.add('expanded');
      } else if (dy < -THRESHOLD) {
        // Swipe DOWN → collapse
        dom.fullLegend.classList.remove('expanded');
      } else if (Math.abs(dy) < 8) {
        // Tap on handle area → toggle
        if (!e.target.closest('.legend-item')) {
          dom.fullLegend.classList.toggle('expanded');
        }
      }
    }, { passive: true });

    // Also handle the dedicated handle via click (desktop fallback)
    if (dom.fullLegendHandle) {
      dom.fullLegendHandle.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.fullLegend.classList.toggle('expanded');
      });
    }
  }

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
  // Carte par défaut
  setTab('carte');
}

// Expose reset for empty state button
window.resetAllFilters = resetAllFilters;

// Start
document.addEventListener('DOMContentLoaded', init);
