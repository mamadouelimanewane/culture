/* ═══════════════════════════════════════════════════════════
   ADMIN — Scenews   (vanilla JS, localStorage)
═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────
   DATABASE LAYER  (localStorage abstraction)
───────────────────────────────────────────── */
const DB = {
  _key: k => 'cultureAdmin_' + k,

  get(k) { try { return JSON.parse(localStorage.getItem(DB._key(k))); } catch (e) { return null; } },
  set(k, v) { localStorage.setItem(DB._key(k), JSON.stringify(v)); },
  remove(k) { localStorage.removeItem(DB._key(k)); },

  /* Collections */
  getAll(col) { return DB.get(col) || []; },
  save(col, arr) { DB.set(col, arr); },
  push(col, item) { const a = DB.getAll(col); a.push(item); DB.save(col, a); return item; },
  update(col, id, data) {
    const a = DB.getAll(col).map(r => r.id === id ? { ...r, ...data } : r);
    DB.save(col, a);
  },
  findById(col, id) { return DB.getAll(col).find(r => r.id === id) || null; },
  removeById(col, id) { DB.save(col, DB.getAll(col).filter(r => r.id !== id)); },

  /* ID generator */
  nextId(col) {
    const a = DB.getAll(col);
    return a.length ? Math.max(...a.map(r => r.id || 0)) + 1 : 1;
  },

  /* Activity Log */
  log(action, details) {
    const logs = DB.getAll('activity_log');
    logs.unshift({
      id: Date.now(),
      userId: currentUser?.id || 0,
      userName: currentUser?.name || 'Système',
      role: currentUser?.role || '',
      action,
      details,
      timestamp: new Date().toISOString()
    });
    DB.save('activity_log', logs.slice(0, 100)); // Keep last 100
  }
};

/* ─────────────────────────────────────────────
   SEED DEMO DATA (runs once)
───────────────────────────────────────────── */
function seedData() {
  // Bumping version key clears stale cached credentials from previous deployments
  if (DB.get('seeded_v3')) return;
  // Clear old seed flags
  DB.remove('seeded');
  DB.remove('seeded_v2');

  /* Users */
  DB.save('users', [
    {
      id: 1, name: 'Admin Principal', email: 'admin@culture.sn',
      password: 'admin123', role: 'admin',
      region: 'DAKAR', phone: '+221 77 100 00 01',
      status: 'active', createdAt: '2024-01-10',
    },
    {
      id: 2, name: 'Fatou Diallo', email: 'fatou@culture.sn',
      password: 'resp123', role: 'responsable',
      region: 'DAKAR', phone: '+221 77 200 00 02',
      status: 'active', infraName: 'Centre Culturel Douta Seck',
      createdAt: '2024-02-14',
    },
    {
      id: 3, name: 'Mamadou Fall', email: 'mamadou@culture.sn',
      password: 'resp456', role: 'responsable',
      region: 'SAINT LOUIS', phone: '+221 77 300 00 03',
      status: 'active', infraName: 'Bibliothèque Régionale de Saint-Louis',
      createdAt: '2024-03-05',
    },
  ]);

  /* Pending user registrations */
  DB.save('registrations', [
    {
      id: 1, name: 'Oumar Sène', email: 'oumar@example.com',
      phone: '+221 77 400 00 04', region: 'THIES',
      infraType: 'existing', infraName: 'Maison des Arts de Thiès',
      message: 'Je suis le directeur adjoint de cette infrastructure depuis 2019.',
      status: 'pending', createdAt: '2025-01-22',
    },
    {
      id: 2, name: 'Aissatou Ndiaye', email: 'aissatou@example.com',
      phone: '+221 78 500 00 05', region: 'KAOLACK',
      infraType: 'new', infraName: '',
      message: 'Responsable d\'un nouveau centre de formation aux arts plastiques.',
      status: 'pending', createdAt: '2025-01-29',
    },
  ]);

  /* Submissions */
  DB.save('submissions', [
    {
      id: 1, type: 'update', userId: 2,
      userName: 'Fatou Diallo', infraName: 'Centre Culturel Douta Seck',
      region: 'DAKAR',
      data: {
        description: 'Centre culturel national rénové, offrant des salles de spectacle, une galerie d\'art et des ateliers pour jeunes artistes.',
        capacity: '500 places', phone: '+221 33 821 00 00',
        email: 'douta.seck@culture.sn', website: 'www.ccd.sn',
        openingHours: 'Lun–Sam 9h–20h, Dim 14h–19h',
      },
      images: [],
      status: 'pending', createdAt: '2025-01-30',
      adminNote: '',
    },
    {
      id: 2, type: 'event', userId: 2,
      userName: 'Fatou Diallo', infraName: 'Centre Culturel Douta Seck',
      region: 'DAKAR',
      data: {
        title: 'Festival des Arts Urbains de Dakar 2025',
        dateStart: '2025-03-15', dateEnd: '2025-03-20',
        description: 'Célébration des arts urbains : graffiti, danse, musique hip-hop, spoken word. Ouvert à tous, entrée gratuite.',
        location: 'Esplanade du CCD, Dakar',
      },
      images: [],
      status: 'pending', createdAt: '2025-02-02',
      adminNote: '',
    },
    {
      id: 3, type: 'update', userId: 3,
      userName: 'Mamadou Fall', infraName: 'Bibliothèque Régionale de Saint-Louis',
      region: 'SAINT LOUIS',
      data: {
        description: 'Bibliothèque patrimoniale de la région nord, riche de plus de 25 000 ouvrages et documents d\'archives.',
        capacity: '120 places de lecture', phone: '+221 33 961 00 00',
        email: 'biblio.stlouis@culture.sn', website: '',
        openingHours: 'Lun–Ven 8h–18h',
      },
      images: [],
      status: 'approved', createdAt: '2025-01-15', reviewedAt: '2025-01-18',
      adminNote: 'Informations vérifiées et correctes.',
    },
    {
      id: 4, type: 'new_infra', userId: 2,
      userName: 'Fatou Diallo', infraName: '',
      region: 'DAKAR',
      data: {
        name: 'Atelier Collectif NGOR',
        type: 'Centre d\'animation', region: 'DAKAR',
        departement: 'DAKAR', commune: 'Ngor',
        lat: 14.745, lon: -17.516, milieu: 'URBAIN',
        description: 'Espace de création collective pour artistes émergents du quartier de Ngor.',
      },
      images: [],
      status: 'pending', createdAt: '2025-02-05',
      adminNote: '',
    },
  ]);

  DB.save('activity_log', [
    { id: 1, userId: 1, userName: 'Admin Principal', role: 'admin', action: 'Initialisation', details: 'Système configuré avec succès.', timestamp: new Date().toISOString() },
    { id: 2, userId: 2, userName: 'Fatou Diallo', role: 'responsable', action: 'Connexion', details: 'Sesssion ouverte depuis Dakar.', timestamp: new Date().toISOString() }
  ]);

  DB.set('seeded_v3', true);
}

/* ─────────────────────────────────────────────
   AUTH
───────────────────────────────────────────── */
let currentUser = null;

function login(email, password) {
  const users = DB.getAll('users');
  return users.find(u => u.email === email && u.password === password && u.status === 'active') || null;
}

function logout() {
  sessionStorage.removeItem('adminUser');
  currentUser = null;
  showLogin();
}

function checkAuth() {
  const stored = sessionStorage.getItem('adminUser');
  if (stored) {
    try { currentUser = JSON.parse(stored); return true; }
    catch (e) { }
  }
  return false;
}

function setSession(user) {
  const safe = { id: user.id, name: user.name, email: user.email, role: user.role, region: user.region };
  sessionStorage.setItem('adminUser', JSON.stringify(safe));
  currentUser = safe;
  DB.log('Connexion', `L'utilisateur ${user.name} s'est connecté.`);
}

/* ─────────────────────────────────────────────
   SECURITY & PERMISSIONS
   ───────────────────────────────────────────── */
function canEditRegion(recordRegion) {
  if (currentUser.role === 'admin') return true;
  return currentUser.region === recordRegion;
}

function filterByRegion(dataset) {
  if (currentUser.role === 'admin') return dataset;
  return dataset.filter(r => (r.region || r.REGION) === currentUser.region);
}


/* ─────────────────────────────────────────────
   NAVIGATION
───────────────────────────────────────────── */
let activeView = '';

function navigate(view) {
  activeView = view;
  renderView(view);
  updateSidebarActive(view);
}

function updateSidebarActive(view) {
  document.querySelectorAll('.sb-link').forEach(el => {
    el.classList.toggle('active', el.dataset.view === view);
  });
}

/* ─────────────────────────────────────────────
   UI HELPERS
───────────────────────────────────────────── */
function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
function qsa(sel, ctx) { return [...(ctx || document).querySelectorAll(sel)]; }

function setTitle(t) {
  qs('#topbarTitle').textContent = t;
}

function showToast(msg, type = 'success', duration = 3000) {
  const t = qs('#toast');
  t.textContent = msg;
  t.className = 'toast ' + type;
  t.classList.remove('hidden');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), duration);
}

function openSidebar() {
  qs('#sidebar').classList.add('open');
  qs('#sbOverlay').classList.add('open');
}
function closeSidebar() {
  qs('#sidebar').classList.remove('open');
  qs('#sbOverlay').classList.remove('open');
}

/* Password eye toggle */
function initPwEye() {
  const eye = qs('#pwEye');
  const inp = qs('#loginPassword');
  if (!eye || !inp) return;
  eye.addEventListener('click', () => {
    inp.type = inp.type === 'password' ? 'text' : 'password';
    eye.textContent = inp.type === 'password' ? '👁' : '🙈';
  });
}

/* ─────────────────────────────────────────────
   LOGIN
───────────────────────────────────────────── */
function showLogin() {
  qs('#loginScreen').classList.remove('hidden');
  qs('#mainApp').classList.add('hidden');
}

function showApp() {
  qs('#loginScreen').classList.add('hidden');
  qs('#mainApp').classList.remove('hidden');
  buildSidebar();
  updateTopbar();
  navigate('dashboard');
}

function initLoginForm() {
  qs('#loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const email = qs('#loginEmail').value.trim();
    const password = qs('#loginPassword').value;
    const errEl = qs('#loginError');
    errEl.classList.add('hidden');

    const user = login(email, password);
    if (!user) {
      errEl.textContent = 'Identifiants incorrects ou compte inactif.';
      errEl.classList.remove('hidden');
      return;
    }
    setSession(user);
    showApp();
  });
}

window.fillDemo = function (role) {
  if (role === 'admin') {
    qs('#loginEmail').value = 'admin@culture.sn';
    qs('#loginPassword').value = 'admin123';
  } else {
    qs('#loginEmail').value = 'fatou@culture.sn';
    qs('#loginPassword').value = 'resp123';
  }
};

/* ─────────────────────────────────────────────
   SIDEBAR BUILDER
───────────────────────────────────────────── */
function buildSidebar() {
  const nav = qs('#sbNav');
  const foot = qs('#sbFoot');
  const isAdmin = currentUser.role === 'admin';
  const pendingCount = DB.getAll('submissions').filter(s => s.status === 'pending').length
    + DB.getAll('registrations').filter(r => r.status === 'pending').length;

  const links = isAdmin
    ? [
      { section: 'Administration' },
      { view: 'dashboard', icon: '📊', label: 'Tableau de bord' },
      { view: 'pending', icon: '⏳', label: 'À valider', badge: pendingCount || null },
      { view: 'activity_log', icon: '📜', label: 'Journal d\'activité' },
      { view: 'users', icon: '👥', label: 'Utilisateurs' },
      { view: 'all_subs', icon: '📋', label: 'Toutes les soumissions' },
      { section: 'Données' },
      { view: 'infra_list', icon: '🏛', label: 'Infrastructures' },
      { view: 'agenda', icon: '📅', label: 'Agenda cultural' },
      { view: 'gallery', icon: '🖼', label: 'Photothèque' },
      { view: 'reports', icon: '🚨', label: 'Signalements' },
      { view: 'profile', icon: '👤', label: 'Mon profil' },
    ]
    : [
      { section: 'Mon espace' },
      { view: 'dashboard', icon: '📊', label: 'Tableau de bord' },
      { view: 'profile', icon: '👤', label: 'Mon profil' },
      { section: 'Soumettre' },
      { view: 'submit_update', icon: '✏️', label: 'Mise à jour infra' },
      { view: 'submit_event', icon: '🗓', label: 'Événement / Date' },
      { view: 'submit_new', icon: '➕', label: 'Nouvelle infrastructure' },
      { section: 'Historique' },
      { view: 'my_subs', icon: '📋', label: 'Mes soumissions' },
    ];

  nav.innerHTML = links.map(l => {
    if (l.section) return `<div class="sb-section">${l.section}</div>`;
    const badge = l.badge ? `<span class="sb-badge">${l.badge}</span>` : '';
    return `<button class="sb-link" data-view="${l.view}">
      <span class="sb-link-icon">${l.icon}</span>
      <span>${l.label}</span>
      ${badge}
    </button>`;
  }).join('');

  nav.querySelectorAll('.sb-link').forEach(btn => {
    btn.addEventListener('click', () => {
      navigate(btn.dataset.view);
      closeSidebar();
    });
  });

  /* Footer */
  const initials = currentUser.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = currentUser.role === 'admin' ? 'Administrateur' : 'Responsable';
  foot.innerHTML = `
    <div class="sb-user">
      <div class="sb-avatar">${initials}</div>
      <div>
        <div class="sb-user-name">${currentUser.name}</div>
        <div class="sb-user-role">${roleLabel}</div>
      </div>
    </div>
    <button class="sb-logout" onclick="logout()">🚪 Déconnexion</button>
  `;
}

function updateTopbar() {
  qs('#topbarUser').textContent = currentUser.name;
  const pending = DB.getAll('submissions').filter(s => s.status === 'pending').length
    + DB.getAll('registrations').filter(r => r.status === 'pending').length;
  qs('#notifDot').classList.toggle('hidden', pending === 0);
}

/* ─────────────────────────────────────────────
   NOTIFICATION PANEL
───────────────────────────────────────────── */
window.toggleNotifPanel = function () {
  const panel = qs('#notifPanel');
  const isOpen = !panel.classList.contains('hidden');
  if (isOpen) { panel.classList.add('hidden'); return; }
  renderNotifPanel();
  panel.classList.remove('hidden');

  /* close on outside click */
  const handler = e => {
    if (!qs('#notifWrap').contains(e.target)) {
      panel.classList.add('hidden');
      document.removeEventListener('click', handler, true);
    }
  };
  setTimeout(() => document.addEventListener('click', handler, true), 0);
};

function renderNotifPanel() {
  const list = qs('#notifList');
  const isAdmin = currentUser.role === 'admin';

  if (isAdmin) {
    const pendingSubs = DB.getAll('submissions').filter(s => s.status === 'pending');
    const pendingRegs = DB.getAll('registrations').filter(r => r.status === 'pending');
    const items = [
      ...pendingSubs.map(s => ({
        icon: s.type === 'update' ? '✏️' : s.type === 'event' ? '🗓' : '➕',
        title: `${subTypeLabel(s.type)} — ${s.infraName || s.data?.name || '—'}`,
        sub: `Par ${s.userName}`,
        time: formatDate(s.createdAt),
        action: () => { qs('#notifPanel').classList.add('hidden'); navigate('pending'); },
      })),
      ...pendingRegs.map(r => ({
        icon: '📝',
        title: `Demande d'accès — ${r.name}`,
        sub: r.email,
        time: formatDate(r.createdAt),
        action: () => { qs('#notifPanel').classList.add('hidden'); navigate('pending'); },
      })),
    ];

    if (!items.length) {
      list.innerHTML = '<div class="notif-empty">🎉 Aucune notification</div>';
      return;
    }

    list.innerHTML = items.map((it, i) => `
      <div class="notif-item" data-ni="${i}">
        <div class="notif-item-icon">${it.icon}</div>
        <div class="notif-item-body">
          <div class="notif-item-title">${it.title}</div>
          <div class="notif-item-time">${it.sub} · ${it.time}</div>
        </div>
      </div>`).join('');

    list.querySelectorAll('.notif-item').forEach((el, i) => {
      el.addEventListener('click', () => items[i].action());
    });

  } else {
    /* Responsable: show own reviewed subs */
    const reviewed = DB.getAll('submissions')
      .filter(s => s.userId === currentUser.id && s.status !== 'pending')
      .sort((a, b) => (b.reviewedAt || '').localeCompare(a.reviewedAt || ''))
      .slice(0, 8);

    if (!reviewed.length) {
      list.innerHTML = '<div class="notif-empty">Aucune notification</div>';
      return;
    }

    list.innerHTML = reviewed.map(s => {
      const icon = s.status === 'approved' ? '✅' : '❌';
      return `<div class="notif-item" onclick="navigate('my_subs'); qs('#notifPanel').classList.add('hidden');">
        <div class="notif-item-icon">${icon}</div>
        <div class="notif-item-body">
          <div class="notif-item-title">${subTypeLabel(s.type)} ${s.status === 'approved' ? 'approuvée' : 'rejetée'}</div>
          <div class="notif-item-time">${s.infraName || s.data?.name || ''} · ${formatDate(s.reviewedAt)}</div>
        </div>
      </div>`;
    }).join('');
  }
}

window.clearNotifs = function () {
  qs('#notifPanel').classList.add('hidden');
  showToast('Notifications marquées comme lues', 'info');
};

/* ─────────────────────────────────────────────
   VIEWS ROUTER
───────────────────────────────────────────── */
function renderView(view) {
  const page = qs('#page');
  page.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

  // slight delay for spinner to flash (UX)
  setTimeout(() => {
    switch (view) {
      case 'dashboard':
        currentUser.role === 'admin' ? renderAdminDashboard() : renderRespDashboard();
        break;
      case 'pending': renderPending(); break;
      case 'users': renderUsers(); break;
      case 'all_subs': renderAllSubs(); break;
      case 'infra_list': renderInfraList(); break;
      case 'submit_update': renderSubmitUpdate(); break;
      case 'submit_event': renderSubmitEvent(); break;
      case 'submit_new': renderSubmitNew(); break;
      case 'my_subs': renderMySubs(); break;
      case 'activity_log': renderActivityLog(); break;
      case 'gallery': renderGallery(); break;
      case 'agenda': renderAgenda(); break;
      case 'reports': renderReports(); break;
      case 'profile': renderProfile(); break;
      default:
        page.innerHTML = '<p style="padding:24px">Vue introuvable.</p>';
    }
  }, 80);
}

/* ─────────────────────────────────────────────
   ── ADMIN: DASHBOARD ──
───────────────────────────────────────────── */
function renderAdminDashboard() {
  const page = qs('#page');
  const subs = DB.getAll('submissions');
  const regs = DB.getAll('registrations');
  const users = DB.getAll('users');

  const pending = subs.filter(s => s.status === 'pending').length + regs.filter(r => r.status === 'pending').length;
  const approved = subs.filter(s => s.status === 'approved').length;
  const rejected = subs.filter(s => s.status === 'rejected').length;

  setTitle('Tableau de bord');
  page.innerHTML = `
    <div class="page-head">
      <div class="page-head-left">
        <h2>Bonjour, ${currentUser.name} 👋</h2>
        <p>Bienvenue sur le backoffice de Scenews</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon gold">⏳</div>
        <div>
          <div class="stat-num">${pending}</div>
          <div class="stat-lbl">En attente</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div>
          <div class="stat-num">${approved}</div>
          <div class="stat-lbl">Approuvées</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">❌</div>
        <div>
          <div class="stat-num">${rejected}</div>
          <div class="stat-lbl">Rejetées</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">👥</div>
        <div>
          <div class="stat-num">${users.filter(u => u.role === 'responsable').length}</div>
          <div class="stat-lbl">Responsables</div>
        </div>
      </div>
    </div>

    ${renderActivityChart(subs)}

    <div class="stats-advanced">
       <div class="panel">
          <div class="panel-head"><span class="panel-title">🎯 Taux de validation</span></div>
          <div class="panel-body" style="display:flex; flex-direction:column; align-items:center; padding:20px; gap:16px;">
             ${renderDonutChart(approved, pending, rejected)}
             <div style="font-size:0.8rem; color:var(--text-mid); text-align:center;">
                Ratio global des soumissions traitées par rapport aux attentes.
             </div>
          </div>
       </div>
       <div class="panel">
          <div class="panel-head"><span class="panel-title">⚡ Activité récente</span></div>
          <div class="panel-body" style="padding:16px;">
             ${renderMiniActivityLog()}
          </div>
       </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">⏳ Soumissions récentes en attente</span>
        <button class="btn-ghost btn-sm" onclick="navigate('pending')">Voir tout →</button>
      </div>
      <div class="panel-body">
        ${renderRecentPending()}
      </div>
    </div>
  `;
}

function renderDonutChart(app, pend, rej) {
  const total = app + pend + rej || 1;
  const pApp = Math.round((app / total) * 100);
  const pPend = Math.round((pend / total) * 100);
  const pRej = 100 - pApp - pPend;

  const gradient = `conic-gradient(var(--green) 0% ${pApp}%, var(--gold) ${pApp}% ${pApp + pPend}%, var(--red) ${pApp + pPend}% 100%)`;

  return `
    <div class="donut-chart" style="background:${gradient}">
       <div class="donut-label">${pApp}%</div>
    </div>
    <div style="display:flex; gap:12px; font-size:0.75rem;">
       <span style="display:flex; align-items:center; gap:4px;"><i style="width:10px; height:10px; background:var(--green); border-radius:3px;"></i> Approuvées</span>
       <span style="display:flex; align-items:center; gap:4px;"><i style="width:10px; height:10px; background:var(--gold); border-radius:3px;"></i> Attente</span>
       <span style="display:flex; align-items:center; gap:4px;"><i style="width:10px; height:10px; background:var(--red); border-radius:3px;"></i> Rejetées</span>
    </div>
  `;
}

function renderMiniActivityLog() {
  const logs = DB.getAll('activity_log').slice(0, 4);
  if (!logs.length) return '<div class="panel-empty">Aucune activité récente</div>';
  return `<div class="activity-list">
     ${logs.map(l => `
       <div class="activity-item">
          <div class="activity-icon">${l.action === 'Connexion' ? '🔑' : '📝'}</div>
          <div class="activity-content">
             <div><strong>${l.userName}</strong> · ${l.action}</div>
             <div class="activity-time">${formatDate(l.timestamp)} · ${new Date(l.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>
       </div>
     `).join('')}
  </div>`;
}

function renderActivityLog() {
  setTitle('Journal d\'activité système');
  const logs = DB.getAll('activity_log');
  qs('#page').innerHTML = `
    <div class="page-head">
      <div class="page-head-left"><h2>Journal d'activité</h2><p>Historique des 100 dernières actions effectuées.</p></div>
    </div>
    <div class="panel">
       <div class="panel-body" style="padding:16px;">
          <div class="activity-list">
             ${logs.map(l => `
               <div class="activity-item">
                  <div class="activity-icon">⚡</div>
                  <div class="activity-content">
                     <div><strong>${l.userName}</strong> (${l.role}) a effectué : <span style="color:var(--green);font-weight:600;">${l.action}</span></div>
                     <div style="font-size:0.8rem; margin:4px 0;">${l.details}</div>
                     <div class="activity-time">${formatDate(l.timestamp)} à ${new Date(l.timestamp).toLocaleTimeString('fr-FR')}</div>
                  </div>
               </div>
             `).join('')}
          </div>
       </div>
    </div>
  `;
}

function renderGallery() {
  setTitle('Photothèque culturelle');
  const subs = DB.getAll('submissions').filter(s => s.status === 'approved' && s.images && s.images.length);
  const allImgs = [];
  subs.forEach(s => {
    s.images.forEach(img => allImgs.push({ url: img, infra: s.infraName || s.data?.name, date: s.reviewedAt }));
  });

  qs('#page').innerHTML = `
    <div class="page-head">
      <div class="page-head-left"><h2>Photothèque</h2><p>${allImgs.length} photo(s) issue(s) des soumissions approuvées</p></div>
    </div>
    <div class="panel">
       <div class="panel-body" style="padding:16px;">
          ${allImgs.length ? `
            <div class="gallery-grid">
               ${allImgs.map(img => `
                 <div class="gallery-item" onclick="openImgZoom('${img.url}')">
                    <img src="${img.url}" alt="" />
                    <div class="gallery-info">
                       <strong>${img.infra}</strong><br/>
                       ${formatDate(img.date)}
                    </div>
                 </div>
               `).join('')}
            </div>
          ` : '<div class="panel-empty">Aucune image disponible. Approuvez des soumissions avec photos pour alimenter la galerie.</div>'}
       </div>
    </div>
  `;
}


function renderRecentPending() {
  const items = DB.getAll('submissions').filter(s => s.status === 'pending').slice(0, 4);
  if (!items.length) return '<div class="panel-empty">Aucune soumission en attente</div>';
  return `<div class="table-wrap m-cards"><table>
    <thead><tr><th>Type</th><th>Infrastructure</th><th>Responsable</th><th>Date</th><th>Action</th></tr></thead>
    <tbody>
      ${items.map(s => `<tr>
        <td>${subTypeLabel(s.type)}</td>
        <td class="td-name">${s.infraName || s.data?.name || '—'}</td>
        <td>${s.userName}</td>
        <td>${formatDate(s.createdAt)}</td>
        <td><button class="btn-primary btn-sm" onclick="openValModal(${s.id}, 'submission')">Réviser</button></td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="mobile-cards">
    ${items.map(s => `<div class="m-card">
      <div class="m-card-title">${s.infraName || s.data?.name || '—'}</div>
      <div class="m-card-row"><span class="m-card-label">Type</span><span>${subTypeLabel(s.type)}</span></div>
      <div class="m-card-row"><span class="m-card-label">Par</span><span>${s.userName}</span></div>
      <div class="m-card-row"><span class="m-card-label">Date</span><span>${formatDate(s.createdAt)}</span></div>
      <div class="m-card-actions"><button class="btn-primary btn-sm" onclick="openValModal(${s.id}, 'submission')">Réviser</button></div>
    </div>`).join('')}
  </div></div>`;
}

function renderRecentRegistrations() {
  const items = DB.getAll('registrations').filter(r => r.status === 'pending').slice(0, 4);
  if (!items.length) return '<div class="panel-empty">Aucune demande d\'accès en attente</div>';
  return `<div class="table-wrap m-cards"><table>
    <thead><tr><th>Nom</th><th>Email</th><th>Région</th><th>Type</th><th>Date</th><th>Action</th></tr></thead>
    <tbody>
      ${items.map(r => `<tr>
        <td class="td-name">${r.name}</td>
        <td>${r.email}</td>
        <td>${r.region}</td>
        <td><span class="tag">${r.infraType === 'existing' ? 'Existante' : 'Nouvelle'}</span></td>
        <td>${formatDate(r.createdAt)}</td>
        <td><button class="btn-primary btn-sm" onclick="openValModal(${r.id}, 'registration')">Réviser</button></td>
      </tr>`).join('')}
    </tbody>
  </table>
  <div class="mobile-cards">
    ${items.map(r => `<div class="m-card">
      <div class="m-card-title">${r.name}</div>
      <div class="m-card-row"><span class="m-card-label">Email</span><span>${r.email}</span></div>
      <div class="m-card-row"><span class="m-card-label">Région</span><span>${r.region}</span></div>
      <div class="m-card-row"><span class="m-card-label">Type</span><span class="tag">${r.infraType === 'existing' ? 'Existante' : 'Nouvelle'}</span></div>
      <div class="m-card-row"><span class="m-card-label">Date</span><span>${formatDate(r.createdAt)}</span></div>
      <div class="m-card-actions"><button class="btn-primary btn-sm" onclick="openValModal(${r.id}, 'registration')">Réviser</button></div>
    </div>`).join('')}
  </div></div>`;
}

/* ─────────────────────────────────────────────
   ── ACTIVITY CHART (pure CSS horizontal bars)
───────────────────────────────────────────── */
function renderActivityChart(subs) {
  /* Group by type and status */
  const types = [
    { key: 'update', label: 'Mises à jour', color: 'green' },
    { key: 'event', label: 'Événements', color: 'gold' },
    { key: 'new_infra', label: 'Nouvelles infras', color: 'blue' },
  ];
  const max = Math.max(1, ...types.map(t => subs.filter(s => s.type === t.key).length));

  const rows = types.map(t => {
    const all = subs.filter(s => s.type === t.key);
    const pending = all.filter(s => s.status === 'pending').length;
    const approved = all.filter(s => s.status === 'approved').length;
    const rejected = all.filter(s => s.status === 'rejected').length;
    const total = all.length;
    const pct = Math.round((total / max) * 100);
    return `<div class="chart-bar-row">
      <span class="chart-bar-label">${t.label}</span>
      <div class="chart-bar-track">
        <div class="chart-bar-fill ${t.color}" style="width:${pct}%"></div>
      </div>
      <span class="chart-bar-value">${total}</span>
    </div>`;
  }).join('');

  /* Per-region breakdown (top 5) */
  const regionMap = {};
  subs.forEach(s => {
    const r = s.region || 'AUTRE';
    regionMap[r] = (regionMap[r] || 0) + 1;
  });
  const topRegions = Object.entries(regionMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const rMax = Math.max(1, ...topRegions.map(r => r[1]));

  const regionRows = topRegions.map(([region, count]) => {
    const pct = Math.round((count / rMax) * 100);
    return `<div class="chart-bar-row">
      <span class="chart-bar-label">${region}</span>
      <div class="chart-bar-track">
        <div class="chart-bar-fill green" style="width:${pct}%"></div>
      </div>
      <span class="chart-bar-value">${count}</span>
    </div>`;
  }).join('');

  return `<div class="charts-grid">
    <div class="panel chart-panel">
      <div class="panel-head"><span class="panel-title">📊 Soumissions par type</span></div>
      <div class="panel-body" style="padding:12px 0;">
        ${rows}
      </div>
    </div>
    <div class="panel chart-panel">
      <div class="panel-head"><span class="panel-title">🗺 Top régions actives</span></div>
      <div class="panel-body" style="padding:12px 0;">
        ${regionRows || '<div class="panel-empty">Aucune donnée</div>'}
      </div>
    </div>
  </div>`;
}

/* Mobile-friendly table wrapper: generates card layout alongside table */
function mobileCards(items, renderer) {
  return `<div class="mobile-cards">${items.map(renderer).join('')}</div>`;
}

/* ─────────────────────────────────────────────
   ── ADMIN: PENDING ──
───────────────────────────────────────────── */
function renderPending() {
  setTitle('À valider');
  const subs = DB.getAll('submissions').filter(s => s.status === 'pending');
  const regs = DB.getAll('registrations').filter(r => r.status === 'pending');

  let activeTab = 'updates';

  function tabs() {
    const updateCount = subs.filter(s => s.type === 'update').length;
    const eventCount = subs.filter(s => s.type === 'event').length;
    const newCount = subs.filter(s => s.type === 'new_infra').length;
    const regCount = regs.length;
    return `<div class="vtabs" id="pendingTabs">
      <button class="vtab ${activeTab === 'updates' ? 'active' : ''}" data-ptab="updates">
        ✏️ Mises à jour <span class="vtab-count">${updateCount}</span>
      </button>
      <button class="vtab ${activeTab === 'events' ? 'active' : ''}" data-ptab="events">
        🗓 Événements <span class="vtab-count">${eventCount}</span>
      </button>
      <button class="vtab ${activeTab === 'new_infra' ? 'active' : ''}" data-ptab="new_infra">
        ➕ Nouvelles infras <span class="vtab-count">${newCount}</span>
      </button>
      <button class="vtab ${activeTab === 'registrations' ? 'active' : ''}" data-ptab="registrations">
        📝 Demandes d'accès <span class="vtab-count">${regCount}</span>
      </button>
    </div>`;
  }

  function body() {
    if (activeTab === 'registrations') return renderRegCards(regs);
    const filtered = subs.filter(s => s.type === activeTab || (activeTab === 'updates' && s.type === 'update'));
    if (activeTab === 'updates') return renderSubCards(filtered);
    if (activeTab === 'events') return renderSubCards(subs.filter(s => s.type === 'event'));
    if (activeTab === 'new_infra') return renderSubCards(subs.filter(s => s.type === 'new_infra'));
    return '';
  }

  const page = qs('#page');
  function redraw() {
    page.innerHTML = `
      <div class="page-head"><div class="page-head-left"><h2>Soumissions à valider</h2><p>Révisez, approuvez ou rejetez les soumissions des responsables.</p></div></div>
      ${tabs()}
      <div id="pendingBody">${body()}</div>
    `;
    page.querySelectorAll('[data-ptab]').forEach(btn => {
      btn.addEventListener('click', () => { activeTab = btn.dataset.ptab; redraw(); });
    });
  }

  redraw();
}

function renderSubCards(items) {
  if (!items.length) return '<div class="empty-state"><div class="empty-state-icon">🎉</div><h3>Tout est à jour</h3><p>Aucune soumission en attente dans cette catégorie.</p></div>';
  return `<div class="sub-cards">${items.map(s => {
    const name = s.infraName || s.data?.name || '—';
    const icon = s.type === 'update' ? '✏️' : s.type === 'event' ? '🗓' : '➕';
    const excerpt = s.type === 'update'
      ? (s.data?.description || '').substring(0, 120) + '…'
      : s.type === 'event'
        ? `${s.data?.title || ''} — ${formatDate(s.data?.dateStart || '')}`
        : `${s.data?.name || ''} (${s.data?.commune || ''}, ${s.data?.region || ''})`;
    return `<div class="sub-card">
      <div class="sub-card-icon">${icon}</div>
      <div class="sub-card-body">
        <div class="sub-card-title">${name}</div>
        <div class="sub-card-meta">
          ${subTypeLabel(s.type)} · Par ${s.userName} · ${formatDate(s.createdAt)}
          &nbsp;<span class="badge badge-pending">En attente</span>
        </div>
        <div class="sub-card-excerpt">${excerpt}</div>
        ${s.images && s.images.length ? `<div class="sub-card-imgs">${s.images.map(img => `<img class="sub-card-img" src="${img}" alt="" />`).join('')}</div>` : ''}
        <div class="sub-card-actions">
          <button class="btn-primary btn-sm" onclick="openValModal(${s.id}, 'submission')">Réviser →</button>
        </div>
      </div>
    </div>`;
  }).join('')}</div>`;
}

function renderRegCards(items) {
  if (!items.length) return '<div class="empty-state"><div class="empty-state-icon">🎉</div><h3>Aucune demande en attente</h3></div>';
  return `<div class="sub-cards">${items.map(r => `
    <div class="sub-card">
      <div class="sub-card-icon">📝</div>
      <div class="sub-card-body">
        <div class="sub-card-title">${r.name}</div>
        <div class="sub-card-meta">
          ${r.email} · ${r.phone} · ${r.region} · ${formatDate(r.createdAt)}
          &nbsp;<span class="badge badge-pending">En attente</span>
        </div>
        <div class="sub-card-excerpt">
          <strong>${r.infraType === 'existing' ? 'Infra existante' : 'Nouvelle infra'}</strong>
          ${r.infraName ? ': ' + r.infraName : ''}<br/>
          ${r.message}
        </div>
        <div class="sub-card-actions">
          <button class="btn-primary btn-sm" onclick="openValModal(${r.id}, 'registration')">Réviser →</button>
        </div>
      </div>
    </div>`).join('')}</div>`;
}

/* ─────────────────────────────────────────────
   ── VALIDATION MODAL ──
───────────────────────────────────────────── */
let _valCtx = null;

window.openValModal = function (id, kind) {
  _valCtx = { id, kind };
  const modal = qs('#valModal');
  const title = qs('#valTitle');
  const body = qs('#valBody');
  const foot = qs('#valFoot');

  if (kind === 'submission') {
    const s = DB.findById('submissions', id);
    if (!s) return;
    title.textContent = 'Révision — ' + subTypeLabel(s.type);

    let detailHtml = '';
    if (s.type === 'update') {
      const d = s.data;
      detailHtml = `
        <div class="val-section"><div class="val-label">Infrastructure</div><div class="val-value">${s.infraName} — ${s.region}</div></div>
        <div class="val-section"><div class="val-label">Description</div><div class="val-value">${d.description || '—'}</div></div>
        <div class="val-section"><div class="val-label">Capacité</div><div class="val-value">${d.capacity || '—'}</div></div>
        <div class="val-section"><div class="val-label">Contact</div><div class="val-value">${d.phone || '—'} &bull; ${d.email || '—'} &bull; ${d.website || '—'}</div></div>
        <div class="val-section"><div class="val-label">Horaires</div><div class="val-value">${d.openingHours || '—'}</div></div>`;
    } else if (s.type === 'event') {
      const d = s.data;
      detailHtml = `
        <div class="val-section"><div class="val-label">Infrastructure</div><div class="val-value">${s.infraName} — ${s.region}</div></div>
        <div class="val-section"><div class="val-label">Titre</div><div class="val-value">${d.title || '—'}</div></div>
        <div class="val-section"><div class="val-label">Dates</div><div class="val-value">${formatDate(d.dateStart)} → ${formatDate(d.dateEnd)}</div></div>
        <div class="val-section"><div class="val-label">Lieu</div><div class="val-value">${d.location || '—'}</div></div>
        <div class="val-section"><div class="val-label">Description</div><div class="val-value">${d.description || '—'}</div></div>`;
    } else if (s.type === 'new_infra') {
      const d = s.data;
      detailHtml = `
        <div class="val-section"><div class="val-label">Nom proposé</div><div class="val-value">${d.name || '—'}</div></div>
        <div class="val-section"><div class="val-label">Type</div><div class="val-value">${d.type || '—'}</div></div>
        <div class="val-section"><div class="val-label">Localisation</div><div class="val-value">${d.commune || '—'}, ${d.departement || '—'}, ${d.region || '—'} — ${d.milieu || '—'}</div></div>
        <div class="val-section"><div class="val-label">Coordonnées GPS</div><div class="val-value">${d.lat}, ${d.lon}</div></div>
        <div class="val-section"><div class="val-label">Description</div><div class="val-value">${d.description || '—'}</div></div>`;
    }

    const imgsHtml = s.images && s.images.length
      ? `<div class="val-section"><div class="val-label">Images</div><div class="val-images">${s.images.map(img => `<img class="val-img" src="${img}" onclick="openImgZoom('${img}')" />`).join('')}</div></div>`
      : '';

    body.innerHTML = `
      ${detailHtml}
      ${imgsHtml}
      <div class="val-section">
        <div class="val-label">Soumis par</div>
        <div class="val-value">${s.userName} · ${formatDate(s.createdAt)}</div>
      </div>
      <div class="field val-note-area">
        <label>Note administrative (facultatif)</label>
        <textarea id="valNote" rows="2" placeholder="Commentaire visible par le responsable…">${s.adminNote || ''}</textarea>
      </div>`;

    foot.innerHTML = `
      <button class="btn-ghost" onclick="closeValModal()">Annuler</button>
      <button class="btn-danger" onclick="reviewSubmission(${id}, 'rejected')">❌ Rejeter</button>
      <button class="btn-primary" onclick="reviewSubmission(${id}, 'approved')">✅ Approuver</button>`;

  } else if (kind === 'registration') {
    const r = DB.findById('registrations', id);
    if (!r) return;
    title.textContent = 'Demande d\'accès — ' + r.name;
    body.innerHTML = `
      <div class="val-section"><div class="val-label">Identité</div><div class="val-value">${r.name} &bull; ${r.email} &bull; ${r.phone}</div></div>
      <div class="val-section"><div class="val-label">Région</div><div class="val-value">${r.region}</div></div>
      <div class="val-section"><div class="val-label">Type de demande</div><div class="val-value">${r.infraType === 'existing' ? 'Gérer une infrastructure existante' : 'Enregistrer une nouvelle infrastructure'}</div></div>
      ${r.infraName ? `<div class="val-section"><div class="val-label">Infrastructure</div><div class="val-value">${r.infraName}</div></div>` : ''}
      <div class="val-section"><div class="val-label">Justification</div><div class="val-value">${r.message}</div></div>
      <div class="val-section"><div class="val-label">Date de demande</div><div class="val-value">${formatDate(r.createdAt)}</div></div>
      <div class="field val-note-area">
        <label>Note administrative</label>
        <textarea id="valNote" rows="2" placeholder="Motif de refus ou message d'accueil…"></textarea>
      </div>`;
    foot.innerHTML = `
      <button class="btn-ghost" onclick="closeValModal()">Annuler</button>
      <button class="btn-danger" onclick="reviewRegistration(${id}, 'rejected')">❌ Rejeter</button>
      <button class="btn-primary" onclick="reviewRegistration(${id}, 'approved')">✅ Approuver et créer le compte</button>`;
  }

  modal.classList.remove('hidden');
};

window.closeValModal = function () {
  qs('#valModal').classList.add('hidden');
  _valCtx = null;
};

window.reviewSubmission = function (id, status) {
  const note = (qs('#valNote') || {}).value || '';
  DB.update('submissions', id, {
    status,
    adminNote: note,
    reviewedAt: new Date().toISOString().slice(0, 10),
    reviewedBy: currentUser.name,
  });
  closeValModal();
  showToast(status === 'approved' ? 'Soumission approuvée ✅' : 'Soumission rejetée', status === 'approved' ? 'success' : 'error');
  buildSidebar();
  updateTopbar();
  renderPending();
};

window.reviewRegistration = function (id, status) {
  const reg = DB.findById('registrations', id);
  const note = (qs('#valNote') || {}).value || '';
  DB.update('registrations', id, {
    status,
    adminNote: note,
    reviewedAt: new Date().toISOString().slice(0, 10),
  });

  if (status === 'approved' && reg) {
    /* Create user account */
    const newUser = {
      id: DB.nextId('users'),
      name: reg.name, email: reg.email,
      password: generateTempPassword(),
      role: 'responsable',
      region: reg.region, phone: reg.phone,
      infraName: reg.infraName || '',
      status: 'active',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    DB.push('users', newUser);
    showToast(`Compte créé pour ${reg.name} — mot de passe: ${newUser.password}`, 'info', 6000);
  } else {
    showToast(status === 'approved' ? 'Demande approuvée' : 'Demande rejetée', status === 'approved' ? 'success' : 'error');
  }
  closeValModal();
  buildSidebar();
  updateTopbar();
  renderPending();
};

function generateTempPassword() {
  return 'tmp' + Math.random().toString(36).slice(2, 8);
}

window.openImgZoom = function (src) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 8px 32px rgba(0,0,0,.5);';
  ov.appendChild(img);
  ov.addEventListener('click', () => ov.remove());
  document.body.appendChild(ov);
};

/* ─────────────────────────────────────────────
   ── ADMIN: USERS ──
───────────────────────────────────────────── */
function renderUsers() {
  setTitle('Gestion des utilisateurs');
  const users = DB.getAll('users');

  qs('#page').innerHTML = `
    <div class="page-head">
      <div class="page-head-left"><h2>Utilisateurs</h2><p>${users.length} compte(s) enregistré(s)</p></div>
    </div>
    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">👥 Tous les comptes</span>
        <div class="tbl-search">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input id="userSearch" placeholder="Rechercher…" oninput="filterUsersTable(this.value)" />
        </div>
      </div>
      <div class="panel-body table-wrap">
        <table id="usersTable">
          <thead>
            <tr><th></th><th>Nom</th><th>Email</th><th>Rôle</th><th>Région</th><th>Statut</th><th>Créé le</th><th>Actions</th></tr>
          </thead>
          <tbody>
            ${users.map(u => userRow(u)).join('')}
          </tbody>
        </table>
      </div>
    </div>`;
}

function userRow(u) {
  const initials = u.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = u.role === 'admin' ? 'Administrateur' : 'Responsable';
  const statusBadge = u.status === 'active'
    ? '<span class="badge badge-approved">Actif</span>'
    : '<span class="badge badge-rejected">Désactivé</span>';
  const toggleLabel = u.status === 'active' ? '🔒 Désactiver' : '🔓 Réactiver';
  const isSelf = u.id === currentUser.id;
  return `<tr data-user-name="${u.name.toLowerCase()}" data-user-email="${u.email}">
    <td><div class="user-avatar-cell">${initials}</div></td>
    <td><div class="td-name">${u.name}</div><div class="td-sub">${u.infraName || ''}</div></td>
    <td>${u.email}</td>
    <td><span class="tag">${roleLabel}</span></td>
    <td>${u.region || '—'}</td>
    <td>${statusBadge}</td>
    <td>${formatDate(u.createdAt)}</td>
    <td class="td-actions">
      ${!isSelf ? `<button class="btn-ghost btn-sm" onclick="toggleUserStatus(${u.id})">${toggleLabel}</button>` : '<span style="color:var(--text-lt);font-size:.75rem">Vous</span>'}
    </td>
  </tr>`;
}

window.filterUsersTable = function (q) {
  const rows = document.querySelectorAll('#usersTable tbody tr');
  const lq = q.toLowerCase();
  rows.forEach(row => {
    const name = row.dataset.userName || '';
    const email = row.dataset.userEmail || '';
    row.style.display = (name.includes(lq) || email.includes(lq)) ? '' : 'none';
  });
};

window.toggleUserStatus = function (id) {
  const u = DB.findById('users', id);
  if (!u) return;
  const newStatus = u.status === 'active' ? 'inactive' : 'active';
  DB.update('users', id, { status: newStatus });
  showToast(newStatus === 'active' ? `${u.name} réactivé` : `${u.name} désactivé`);
  renderUsers();
};

/* ─────────────────────────────────────────────
   ── ADMIN: ALL SUBMISSIONS ──
───────────────────────────────────────────── */
function renderAllSubs() {
  setTitle('Toutes les soumissions');
  let filter = '';
  const subs = () => DB.getAll('submissions');

  function draw() {
    const items = filter ? subs().filter(s => s.status === filter) : subs();
    const html = items.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>Type</th><th>Infrastructure</th><th>Responsable</th><th>Statut</th><th>Date</th><th>Note admin</th><th>Action</th></tr></thead>
          <tbody>
            ${items.map(s => `<tr>
              <td>${subTypeLabel(s.type)}</td>
              <td class="td-name">${s.infraName || s.data?.name || '—'}</td>
              <td>${s.userName}</td>
              <td>${statusBadge(s.status)}</td>
              <td>${formatDate(s.createdAt)}</td>
              <td style="max-width:180px;font-size:.78rem;color:var(--text-mid)">${s.adminNote || '—'}</td>
              <td>${s.status === 'pending' ? `<button class="btn-primary btn-sm" onclick="openValModal(${s.id}, 'submission')">Réviser</button>` : '—'}</td>
            </tr>`).join('')}
          </tbody>
        </table></div>`
      : '<div class="panel-empty">Aucune soumission correspondante</div>';

    qs('#allSubsBody').innerHTML = html;
    qs('#allSubsFilter').value = filter;
  }

  qs('#page').innerHTML = `
    <div class="page-head"><div class="page-head-left"><h2>Toutes les soumissions</h2></div></div>
    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">📋 Historique complet</span>
        <select class="filter-select-sm" id="allSubsFilter" onchange="window._allSubsFilter(this.value)">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="approved">Approuvées</option>
          <option value="rejected">Rejetées</option>
        </select>
      </div>
      <div class="panel-body" id="allSubsBody"></div>
    </div>`;

  window._allSubsFilter = v => { filter = v; draw(); };
  draw();
}

/* ─────────────────────────────────────────────
   ── ADMIN: INFRA LIST (read-only) ──
───────────────────────────────────────────── */
function renderInfraList() {
  setTitle('Infrastructures');
  qs('#page').innerHTML = `
    <div class="page-head"><div class="page-head-left"><h2>Infrastructures culturelles</h2><p>1 139 entrées — données en lecture seule (source: JSON)</p></div></div>
    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">🏛 Liste</span>
        <div style="display:flex; gap:10px; align-items:center;">
          <button class="btn-export" onclick="exportInfrasToCSV()">📥 Exporter CSV</button>
          <div class="tbl-search">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input id="infraSearch" placeholder="Rechercher…" oninput="filterInfraTable(this.value)" />
          </div>
        </div>
      </div>
      <div class="panel-body" id="infraBody">
        <div class="page-loading"><div class="spinner"></div></div>
      </div>
    </div>`;

  fetch('../infrastructures_culturelles.json')
    .then(r => r.json())
    .then(data => {
      // Filtrage par région pour les responsables
      const filteredData = filterByRegion(data);
      window._infraData = filteredData;
      drawInfraTable(filteredData.slice(0, 80));
    })
    .catch(() => {
      qs('#infraBody').innerHTML = '<div class="panel-empty">Impossible de charger le fichier JSON.</div>';
    });
}

function drawInfraTable(items) {
  const isAdmin = currentUser.role === 'admin';
  qs('#infraBody').innerHTML = `<div class="table-wrap"><table>
    <thead><tr><th>Désignation</th><th>Type</th><th>Commune</th><th>Région</th><th>Milieu</th>${isAdmin ? '<th>Action</th>' : ''}</tr></thead>
    <tbody>
      ${items.map((i, idx) => `
        <tr class="${isAdmin ? 'editable-row' : ''}" onclick="${isAdmin ? `openInfraEdit(${idx})` : ''}">
          <td class="td-name">${i.DESIGNATION || '—'}</td>
          <td><span class="tag">${i.DESCRIPTIF || '—'}</span></td>
          <td>${i.COMMUNE || '—'}</td>
          <td>${i.REGION || '—'}</td>
          <td>${i.MILIEU || '—'}</td>
          ${isAdmin ? `<td><button class="btn-ghost btn-sm">Modifier</button></td>` : ''}
        </tr>`).join('')}
    </tbody>
  </table>
  <div style="padding:10px 16px;font-size:.78rem;color:var(--text-lt)">
    Affichage des ${items.length} enregistrements. ${isAdmin ? 'Cliquez sur une ligne pour modifier.' : ''}
  </div>
  </div>`;
}

window.exportInfrasToCSV = function () {
  const data = window._infraFiltered || window._infraData;
  if (!data) return;
  const headers = ['DESIGNATION', 'DESCRIPTIF', 'COMMUNE', 'REGION', 'MILIEU', 'LATITUDE', 'LONGITUDE'];
  const csv = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'scenews_infras_export.csv');
  link.click();
  DB.log('Export de données', `Export CSV de ${data.length} infrastructures.`);
};

window.openInfraEdit = function (idx) {
  const list = window._infraFiltered || window._infraData;
  const item = list[idx];
  if (!item) return;

  const modal = qs('#valModal');
  const title = qs('#valTitle');
  const body = qs('#valBody');
  const foot = qs('#valFoot');

  title.textContent = '✏️ Édition — ' + (item.DESIGNATION || 'Infrastructure');

  body.innerHTML = `
    <div class="fields-grid-3">
       <div class="field"><label>Désignation *</label><input type="text" id="edName" value="${item.DESIGNATION || ''}" /></div>
       <div class="field"><label>Type *</label><input type="text" id="edType" value="${item.DESCRIPTIF || ''}" /></div>
       <div class="field"><label>Milieu</label><input type="text" id="edMilieu" value="${item.MILIEU || ''}" /></div>
    </div>
    <div class="fields-grid-3">
       <div class="field"><label>Région</label><input type="text" id="edRegion" value="${item.REGION || ''}" /></div>
       <div class="field"><label>Département</label><input type="text" id="edDept" value="${item.DEPARTEMENT || ''}" /></div>
       <div class="field"><label>Commune</label><input type="text" id="edCommune" value="${item.COMMUNE || ''}" /></div>
    </div>
    <div class="fields-grid-3">
       <div class="field"><label>Latitude</label><input type="number" id="edLat" step="any" value="${item.LATITUDE || ''}" /></div>
       <div class="field"><label>Longitude</label><input type="number" id="edLon" step="any" value="${item.LONGITUDE || ''}" /></div>
    </div>
    <div class="field"><label>Description technique</label><textarea id="edDesc" rows="3">${item.OBSERVATIONS || ''}</textarea></div>
  `;

  foot.innerHTML = `
    <button class="btn-ghost" onclick="closeValModal()">Annuler</button>
    <button class="btn-primary" onclick="saveInfraEdit('${item.DESIGNATION}')">💾 Enregistrer les modifications</button>
  `;

  modal.classList.remove('hidden');
};

window.saveInfraEdit = function (oldName) {
  // En mode démo, on simule l'enregistrement en loggant l'action.
  // Dans une vraie app, on ferait un fetch POST/PUT.
  const newName = qs('#edName').value;
  DB.log('Édition Directe', `Modification de l'infrastructure "${oldName}" pour "${newName}"`);
  showToast('Modifications enregistrées (Simulation) ✅');
  closeValModal();
};


window.filterInfraTable = function (q) {
  if (!window._infraData) return;
  const lq = q.toLowerCase();
  window._infraFiltered = lq
    ? window._infraData.filter(i =>
      (i.DESIGNATION || '').toLowerCase().includes(lq) ||
      (i.COMMUNE || '').toLowerCase().includes(lq) ||
      (i.REGION || '').toLowerCase().includes(lq) ||
      (i.DESCRIPTIF || '').toLowerCase().includes(lq))
    : null;
  const displayList = window._infraFiltered || window._infraData.slice(0, 80);
  drawInfraTable(displayList.slice(0, 200));
};

/* ─────────────────────────────────────────────
   ── RESPONSABLE: DASHBOARD ──
───────────────────────────────────────────── */
function renderRespDashboard() {
  setTitle('Mon tableau de bord');
  const mySubs = DB.getAll('submissions').filter(s => s.userId === currentUser.id);
  const pending = mySubs.filter(s => s.status === 'pending').length;
  const approved = mySubs.filter(s => s.status === 'approved').length;
  const rejected = mySubs.filter(s => s.status === 'rejected').length;
  const fullUser = DB.findById('users', currentUser.id);

  qs('#page').innerHTML = `
    <div class="page-head">
      <div class="page-head-left">
        <h2>Bonjour, ${currentUser.name} 👋</h2>
        <p>${fullUser?.infraName ? 'Responsable de : ' + fullUser.infraName : 'Responsable accrédité'}</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon gold">⏳</div>
        <div><div class="stat-num">${pending}</div><div class="stat-lbl">En attente</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✅</div>
        <div><div class="stat-num">${approved}</div><div class="stat-lbl">Approuvées</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon red">❌</div>
        <div><div class="stat-num">${rejected}</div><div class="stat-lbl">Rejetées</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue">📋</div>
        <div><div class="stat-num">${mySubs.length}</div><div class="stat-lbl">Total soumis</div></div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head"><span class="panel-title">🚀 Actions rapides</span></div>
      <div class="panel-body" style="padding:20px;display:flex;flex-wrap:wrap;gap:12px;">
        <button class="btn-primary" onclick="navigate('submit_update')">✏️ Mise à jour infra</button>
        <button class="btn-primary" onclick="navigate('submit_event')">🗓 Soumettre un événement</button>
        <button class="btn-primary" onclick="navigate('submit_new')">➕ Nouvelle infrastructure</button>
        <button class="btn-ghost" onclick="navigate('my_subs')">📋 Mes soumissions</button>
      </div>
    </div>

    ${mySubs.filter(s => s.status === 'rejected' && s.adminNote).length ? `
    <div class="panel">
      <div class="panel-head"><span class="panel-title">💬 Retours de l'administrateur</span></div>
      <div class="panel-body" style="padding:16px;">
        ${mySubs.filter(s => s.status === 'rejected' && s.adminNote).slice(0, 3).map(s => `
          <div style="padding:12px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-bottom:10px;">
            <div style="font-size:.82rem;font-weight:600;">${subTypeLabel(s.type)} — ${s.infraName || s.data?.name || '—'}</div>
            <div style="font-size:.78rem;color:var(--red);margin-top:4px;">❌ Rejeté : ${s.adminNote}</div>
          </div>`).join('')}
      </div>
    </div>` : ''}
  `;
}

/* ─────────────────────────────────────────────
   ── RESPONSABLE: SUBMIT UPDATE ──
───────────────────────────────────────────── */
function renderSubmitUpdate() {
  setTitle('Mise à jour d\'infrastructure');
  const fullUser = DB.findById('users', currentUser.id);

  qs('#page').innerHTML = `
    <div class="page-head"><div class="page-head-left"><h2>Soumettre une mise à jour</h2><p>Les modifications seront examinées par l'administrateur avant publication.</p></div></div>
    <div class="form-panel">
      <div class="form-head">
        <h3>✏️ Informations à mettre à jour</h3>
        <p>Remplissez uniquement les champs que vous souhaitez modifier.</p>
      </div>
      <div class="form-body">
        <div class="field">
          <label>Infrastructure concernée *</label>
          <input type="text" id="updInfraName" value="${fullUser?.infraName || ''}" placeholder="Nom exact de l'infrastructure" required />
        </div>
        <div class="field">
          <label>Région (Verrouillée)</label>
          <input type="text" value="${currentUser.region}" readonly style="background:var(--bg); color:var(--text-lt);" />
        </div>
        <div class="field">
          <label>Description / Présentation</label>
          <textarea id="updDesc" rows="4" placeholder="Décrivez l'infrastructure, ses activités, son histoire…"></textarea>
        </div>
        <div class="fields-2col">
          <div class="field"><label>Capacité d'accueil</label><input type="text" id="updCapacity" placeholder="Ex: 300 places" /></div>
          <div class="field"><label>Horaires d'ouverture</label><input type="text" id="updHours" placeholder="Ex: Lun–Ven 9h–18h" /></div>
        </div>
        <div class="fields-3col">
          <div class="field"><label>Téléphone</label><input type="tel" id="updPhone" placeholder="+221 33 XXX XX XX" /></div>
          <div class="field"><label>Email</label><input type="email" id="updEmail" placeholder="contact@infra.sn" /></div>
          <div class="field"><label>Site web</label><input type="url" id="updWeb" placeholder="www.infra.sn" /></div>
        </div>

        <div class="field">
          <label>Photos (max 3, JPG/PNG, ≤ 2 Mo chacune)</label>
          <div class="img-upload-zone" id="updImgZone" onclick="qs('#updImgInput').click()">
            <input type="file" id="updImgInput" accept="image/*" multiple />
            <div class="img-upload-icon">📸</div>
            <p>Glissez-déposez ou cliquez pour choisir</p>
            <small>JPG, PNG — max 2 Mo par photo — max 3 photos</small>
          </div>
          <div class="img-preview-row" id="updImgPreview"></div>
        </div>

        <div id="updError" class="error-msg hidden"></div>
        <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:8px;">
          <button class="btn-ghost" onclick="navigate('dashboard')">Annuler</button>
          <button class="btn-primary" onclick="submitUpdate()">Envoyer pour validation →</button>
        </div>
      </div>
    </div>`;

  initImgUpload('updImgInput', 'updImgPreview', 'updImgZone', 3);
}

window.submitUpdate = function () {
  const infraName = qs('#updInfraName').value.trim();
  if (!infraName) { showFormError('updError', 'Veuillez indiquer le nom de l\'infrastructure.'); return; }

  const data = {
    description: qs('#updDesc').value.trim(),
    capacity: qs('#updCapacity').value.trim(),
    openingHours: qs('#updHours').value.trim(),
    phone: qs('#updPhone').value.trim(),
    email: qs('#updEmail').value.trim(),
    website: qs('#updWeb').value.trim(),
  };

  const images = getUploadedImages('updImgPreview');

  DB.push('submissions', {
    id: DB.nextId('submissions'),
    type: 'update',
    userId: currentUser.id,
    userName: currentUser.name,
    infraName,
    region: currentUser.region,
    data, images,
    status: 'pending',
    createdAt: new Date().toISOString().slice(0, 10),
    adminNote: '',
  });

  showToast('Mise à jour soumise avec succès ✅');
  buildSidebar();
  navigate('my_subs');
};

/* ─────────────────────────────────────────────
   ── RESPONSABLE: SUBMIT EVENT ──
───────────────────────────────────────────── */
function renderSubmitEvent() {
  setTitle('Soumettre un événement');
  const fullUser = DB.findById('users', currentUser.id);

  qs('#page').innerHTML = `
    <div class="page-head"><div class="page-head-left"><h2>Soumettre un événement / une date</h2><p>L'événement sera publié après validation par l'administrateur.</p></div></div>
    <div class="form-panel">
      <div class="form-head"><h3>🗓 Détails de l'événement</h3></div>
      <div class="form-body">
        <div class="field"><label>Infrastructure hôte *</label>
          <input type="text" id="evtInfraName" value="${fullUser?.infraName || ''}" placeholder="Nom de l'infrastructure" required /></div>
        <div class="field"><label>Titre de l'événement *</label>
          <input type="text" id="evtTitle" placeholder="Ex: Festival des Arts Urbains 2025" required /></div>
        <div class="fields-2col">
          <div class="field"><label>Date de début *</label><input type="date" id="evtDateStart" required /></div>
          <div class="field"><label>Date de fin *</label><input type="date" id="evtDateEnd" required /></div>
        </div>
        <div class="field"><label>Lieu précis</label>
          <input type="text" id="evtLocation" placeholder="Ex: Esplanade principale, Salle Sorano…" /></div>
        <div class="field"><label>Description *</label>
          <textarea id="evtDesc" rows="4" placeholder="Programme, artistes, thématiques, accès…" required></textarea></div>
        <div class="field">
          <label>Photos (max 3)</label>
          <div class="img-upload-zone" id="evtImgZone" onclick="qs('#evtImgInput').click()">
            <input type="file" id="evtImgInput" accept="image/*" multiple />
            <div class="img-upload-icon">📸</div>
            <p>Glissez ou cliquez pour sélectionner</p>
            <small>JPG, PNG — max 2 Mo — max 3 images</small>
          </div>
          <div class="img-preview-row" id="evtImgPreview"></div>
        </div>
        <div id="evtError" class="error-msg hidden"></div>
        <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:8px;">
          <button class="btn-ghost" onclick="navigate('dashboard')">Annuler</button>
          <button class="btn-primary" onclick="submitEvent()">Envoyer pour validation →</button>
        </div>
      </div>
    </div>`;

  initImgUpload('evtImgInput', 'evtImgPreview', 'evtImgZone', 3);
}

window.submitEvent = function () {
  const infraName = qs('#evtInfraName').value.trim();
  const title = qs('#evtTitle').value.trim();
  const dateStart = qs('#evtDateStart').value;
  const dateEnd = qs('#evtDateEnd').value;
  const description = qs('#evtDesc').value.trim();

  if (!infraName || !title || !dateStart || !dateEnd || !description) {
    showFormError('evtError', 'Veuillez remplir tous les champs obligatoires (*).');
    return;
  }
  if (dateEnd < dateStart) {
    showFormError('evtError', 'La date de fin doit être après la date de début.');
    return;
  }

  const images = getUploadedImages('evtImgPreview');

  DB.push('submissions', {
    id: DB.nextId('submissions'),
    type: 'event',
    userId: currentUser.id,
    userName: currentUser.name,
    infraName,
    region: currentUser.region,
    data: {
      title, dateStart, dateEnd,
      location: qs('#evtLocation').value.trim(),
      description,
    },
    images,
    status: 'pending',
    createdAt: new Date().toISOString().slice(0, 10),
    adminNote: '',
  });

  showToast('Événement soumis avec succès 🗓');
  buildSidebar();
  navigate('my_subs');
};

/* ─────────────────────────────────────────────
   ── RESPONSABLE: SUBMIT NEW INFRA ──
───────────────────────────────────────────── */
let _mapPicker = null;
let _mapPickerMarker = null;

function renderSubmitNew() {
  setTitle('Nouvelle infrastructure');

  qs('#page').innerHTML = `
    <div class="page-head"><div class="page-head-left"><h2>Demande d'enregistrement d'une nouvelle infrastructure</h2><p>Votre demande sera examinée et validée par l'administrateur.</p></div></div>
    <div class="form-panel">
      <div class="form-head"><h3>➕ Informations de la nouvelle infrastructure</h3></div>
      <div class="form-body">
        <div class="field"><label>Nom de l'infrastructure *</label>
          <input type="text" id="newName" placeholder="Nom officiel" required /></div>
        <div class="fields-2col">
          <div class="field"><label>Type *</label>
            <select id="newType" required>
              <option value="">— Sélectionner —</option>
              <option>Centre culturel</option><option>Centre d'animation</option>
              <option>Cinéma</option><option>Foyer des femmes</option>
              <option>Foyer des jeunes</option><option>Galerie</option>
              <option>Musée</option><option>Salle des fêtes</option>
              <option>Village artisanal</option>
            </select></div>
          <div class="field"><label>Milieu *</label>
            <select id="newMilieu" required>
              <option value="">— Sélectionner —</option>
              <option value="URBAIN">Urbain</option>
              <option value="RURAL">Rural</option>
            </select></div>
        </div>
        <div class="fields-3col">
          <div class="field">
            <label>Région (Verrouillée) *</label>
            <input type="text" id="newRegion" value="${currentUser.region}" readonly style="background:var(--bg);" />
          </div>
          <div class="field"><label>Département</label>
            <input type="text" id="newDept" placeholder="Département" /></div>
          <div class="field"><label>Commune *</label>
            <input type="text" id="newCommune" placeholder="Commune" required /></div>
        </div>
        <div class="field"><label>Description</label>
          <textarea id="newDesc" rows="3" placeholder="Activités, services, historique…"></textarea></div>

        <div class="field">
          <label>Coordonnées GPS — cliquez sur la carte pour placer le marqueur</label>
          <div class="map-picker-wrap">
            <div id="mapPicker"></div>
            <div class="map-picker-coords">
              <input type="number" id="newLat" placeholder="Latitude" step="any" readonly />
              <input type="number" id="newLon" placeholder="Longitude" step="any" readonly />
            </div>
          </div>
        </div>

        <div class="field">
          <label>Photos (max 3)</label>
          <div class="img-upload-zone" id="newImgZone" onclick="qs('#newImgInput').click()">
            <input type="file" id="newImgInput" accept="image/*" multiple />
            <div class="img-upload-icon">📸</div>
            <p>Glissez ou cliquez pour sélectionner</p>
            <small>JPG, PNG — max 2 Mo — max 3 images</small>
          </div>
          <div class="img-preview-row" id="newImgPreview"></div>
        </div>

        <div id="newError" class="error-msg hidden"></div>
        <div style="display:flex;justify-content:flex-end;gap:10px;padding-top:8px;">
          <button class="btn-ghost" onclick="navigate('dashboard')">Annuler</button>
          <button class="btn-primary" onclick="submitNewInfra()">Envoyer pour validation →</button>
        </div>
      </div>
    </div>`;

  initMapPicker();
  initImgUpload('newImgInput', 'newImgPreview', 'newImgZone', 3);
}

function initMapPicker() {
  if (_mapPicker) { _mapPicker.remove(); _mapPicker = null; _mapPickerMarker = null; }

  _mapPicker = L.map('mapPicker', {
    center: [14.6, -14.5],
    zoom: 7,
    minZoom: 7,
    maxBounds: [[12.2, -17.8], [16.8, -11.2]],
    maxBoundsViscosity: 1.0
  });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(_mapPicker);

  _mapPicker.on('click', e => {
    const { lat, lng } = e.latlng;
    qs('#newLat').value = lat.toFixed(6);
    qs('#newLon').value = lng.toFixed(6);
    if (_mapPickerMarker) _mapPickerMarker.setLatLng(e.latlng);
    else _mapPickerMarker = L.marker(e.latlng).addTo(_mapPicker);
  });
}

window.submitNewInfra = function () {
  const name = qs('#newName').value.trim();
  const type = qs('#newType').value;
  const milieu = qs('#newMilieu').value;
  const region = qs('#newRegion').value;
  const commune = qs('#newCommune').value.trim();
  const lat = parseFloat(qs('#newLat').value);
  const lon = parseFloat(qs('#newLon').value);

  if (!name || !type || !milieu || !region || !commune) {
    showFormError('newError', 'Veuillez remplir tous les champs obligatoires (*).');
    return;
  }
  if (isNaN(lat) || isNaN(lon)) {
    showFormError('newError', 'Veuillez cliquer sur la carte pour positionner l\'infrastructure.');
    return;
  }

  const images = getUploadedImages('newImgPreview');

  DB.push('submissions', {
    id: DB.nextId('submissions'),
    type: 'new_infra',
    userId: currentUser.id,
    userName: currentUser.name,
    infraName: '',
    region,
    data: {
      name, type, milieu, region,
      departement: qs('#newDept').value.trim(),
      commune, lat, lon,
      description: qs('#newDesc').value.trim(),
    },
    images,
    status: 'pending',
    createdAt: new Date().toISOString().slice(0, 10),
    adminNote: '',
  });

  if (_mapPicker) { _mapPicker.remove(); _mapPicker = null; _mapPickerMarker = null; }
  showToast('Demande de nouvelle infrastructure soumise ✅');
  buildSidebar();
  navigate('my_subs');
};

/* ─────────────────────────────────────────────
   ── RESPONSABLE: MY SUBMISSIONS ──
───────────────────────────────────────────── */
function renderMySubs() {
  setTitle('Mes soumissions');
  const items = DB.getAll('submissions').filter(s => s.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  qs('#page').innerHTML = `
    <div class="page-head"><div class="page-head-left"><h2>Mes soumissions</h2><p>${items.length} soumission(s) envoyée(s)</p></div></div>
    <div class="panel">
      <div class="panel-body" style="padding:16px;">
        ${items.length === 0
      ? `<div class="empty-state"><div class="empty-state-icon">📭</div><h3>Aucune soumission</h3><p>Vous n'avez encore rien soumis.</p></div>`
      : `<div class="sub-history-cards">${items.map(s => {
        const icon = s.type === 'update' ? '✏️' : s.type === 'event' ? '🗓' : '➕';
        const name = s.infraName || s.data?.name || '—';
        const subTitle = s.type === 'event'
          ? (s.data?.title || '')
          : s.type === 'new_infra'
            ? `${s.data?.type || ''} — ${s.data?.commune || ''}`
            : `${Object.values(s.data || {}).filter(Boolean).length} champ(s) modifié(s)`;
        return `<div class="sub-hist-card">
                <div class="shc-icon">${icon}</div>
                <div class="shc-body">
                  <div class="shc-title">${name}</div>
                  <div class="shc-meta">${subTypeLabel(s.type)} · ${formatDate(s.createdAt)} · ${statusBadge(s.status)}</div>
                  <div class="shc-meta" style="margin-top:2px">${subTitle}</div>
                  ${s.adminNote ? `<div class="shc-note">💬 Note admin: ${s.adminNote}</div>` : ''}
                </div>
              </div>`;
      }).join('')}</div>`
    }
      </div>
    </div>`;
}

/* ─────────────────────────────────────────────
   ── REGISTER MODAL ──
───────────────────────────────────────────── */
window.openRegisterModal = function () {
  qs('#registerModal').classList.remove('hidden');
};
window.closeRegisterModal = function () {
  qs('#registerModal').classList.add('hidden');
  qs('#registerForm').reset();
  qs('#rError').classList.add('hidden');
  qs('#rExistingField').classList.add('hidden');
};
window.toggleRegInfraFields = function () {
  const val = qs('#rInfraType').value;
  qs('#rExistingField').classList.toggle('hidden', val !== 'existing');
};

window.submitRegistration = function () {
  const name = qs('#rName').value.trim();
  const email = qs('#rEmail').value.trim();
  const phone = qs('#rPhone').value.trim();
  const password = qs('#rPassword').value;
  const region = qs('#rRegion').value;
  const infraType = qs('#rInfraType').value;
  const message = qs('#rMessage').value.trim();
  const errEl = qs('#rError');
  errEl.classList.add('hidden');

  if (!name || !email || !phone || !password || !region || !infraType) {
    errEl.textContent = 'Veuillez remplir tous les champs obligatoires.';
    errEl.classList.remove('hidden');
    return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Le mot de passe doit contenir au moins 6 caractères.';
    errEl.classList.remove('hidden');
    return;
  }

  const existing = DB.getAll('registrations').find(r => r.email === email);
  if (existing) {
    errEl.textContent = 'Une demande existe déjà avec cet email.';
    errEl.classList.remove('hidden');
    return;
  }

  DB.push('registrations', {
    id: DB.nextId('registrations'),
    name, email, phone, region, infraType,
    infraName: qs('#rInfraName').value.trim(),
    message,
    status: 'pending',
    createdAt: new Date().toISOString().slice(0, 10),
    _pw: password,
  });

  closeRegisterModal();
  showToast('Votre demande d\'accès a été envoyée. L\'administrateur vous contactera.', 'success', 5000);
};

/* ─────────────────────────────────────────────
   ── IMAGE UPLOAD HELPER ──
───────────────────────────────────────────── */
function initImgUpload(inputId, previewId, zoneId, maxCount) {
  const input = qs('#' + inputId);
  const preview = qs('#' + previewId);
  const zone = qs('#' + zoneId);
  if (!input) return;

  input.addEventListener('change', () => handleFiles(input.files));

  /* Drag and drop */
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  function handleFiles(files) {
    const existing = preview.querySelectorAll('.img-preview-item').length;
    const slots = maxCount - existing;
    if (slots <= 0) { showToast('Maximum ' + maxCount + ' images.', 'error'); return; }

    Array.from(files).slice(0, slots).forEach(file => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 2 * 1024 * 1024) { showToast(file.name + ' dépasse 2 Mo.', 'error'); return; }
      const reader = new FileReader();
      reader.onload = ev => {
        const item = document.createElement('div');
        item.className = 'img-preview-item';
        item.innerHTML = `<img src="${ev.target.result}" alt="" /><button class="remove-img" title="Supprimer">✕</button>`;
        item.querySelector('.remove-img').addEventListener('click', () => item.remove());
        preview.appendChild(item);
      };
      reader.readAsDataURL(file);
    });
  }
}

function getUploadedImages(previewId) {
  return [...qs('#' + previewId).querySelectorAll('img')].map(img => img.src);
}

/* ─────────────────────────────────────────────
   ── FORM HELPERS ──
───────────────────────────────────────────── */
function showFormError(id, msg) {
  const el = qs('#' + id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ─────────────────────────────────────────────
   ── UTILITIES ──
───────────────────────────────────────────── */
function subTypeLabel(type) {
  return {
    update: '✏️ Mise à jour',
    event: '🗓 Événement',
    new_infra: '➕ Nouvelle infra',
  }[type] || type;
}

function statusBadge(status) {
  const map = {
    pending: '<span class="badge badge-pending">En attente</span>',
    approved: '<span class="badge badge-approved">Approuvée</span>',
    rejected: '<span class="badge badge-rejected">Rejetée</span>',
  };
  return map[status] || status;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch (e) { return dateStr; }
}

/* ─────────────────────────────────────────────
   ── AGENDA CULTUREL ──
───────────────────────────────────────────── */
function renderAgenda() {
  setTitle('Agenda culturel');
  const events = DB.getAll('submissions').filter(s => s.type === 'event' && s.status === 'approved');
  const pending = DB.getAll('submissions').filter(s => s.type === 'event' && s.status === 'pending');

  qs('#page').innerHTML = `
    <div class="page-head">
      <div class="page-head-left"><h2>📅 Agenda culturel</h2><p>${events.length} événement(s) approuvé(s) · ${pending.length} en attente</p></div>
      ${currentUser.role === 'responsable' ? `<div class="page-head-right"><button class="btn-primary" onclick="navigate('submit_event')">+ Ajouter un événement</button></div>` : ''}
    </div>

    <div class="vtabs" id="agendaTabs">
      <button class="vtab active" data-atab="upcoming">📅 À venir</button>
      <button class="vtab" data-atab="past">📆 Passés</button>
      ${currentUser.role === 'admin' ? `<button class="vtab" data-atab="pending">⏳ En attente</button>` : ''}
    </div>

    <div id="agendaBody"></div>
  `;

  const today = new Date().toISOString().slice(0, 10);
  let activeTab = 'upcoming';

  function drawAgenda() {
    let items;
    if (activeTab === 'upcoming') items = events.filter(s => (s.data?.dateEnd || '') >= today);
    else if (activeTab === 'past') items = events.filter(s => (s.data?.dateEnd || '') < today);
    else items = pending;

    if (!items.length) {
      qs('#agendaBody').innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><h3>Aucun événement</h3></div>';
      return;
    }

    qs('#agendaBody').innerHTML = `<div class="sub-cards">${items.map(s => {
      const d = s.data || {};
      const isUpcoming = (d.dateEnd || '') >= today;
      return `<div class="sub-card">
        <div class="sub-card-icon">${isUpcoming ? '📅' : '📆'}</div>
        <div class="sub-card-body">
          <div class="sub-card-title">${d.title || '—'}</div>
          <div class="sub-card-meta">
            ${s.infraName || '—'} · ${formatDate(d.dateStart)} → ${formatDate(d.dateEnd)}
            &nbsp;${statusBadge(s.status)}
          </div>
          ${d.location ? `<div class="sub-card-excerpt">📍 ${d.location}</div>` : ''}
          ${d.description ? `<div class="sub-card-excerpt">${d.description.substring(0, 120)}…</div>` : ''}
          ${s.images?.length ? `<div class="sub-card-imgs">${s.images.map(img => `<img class="sub-card-img" src="${img}" onclick="openImgZoom('${img}')" />`).join('')}</div>` : ''}
          ${currentUser.role === 'admin' && s.status === 'pending' ? `<div class="sub-card-actions"><button class="btn-primary btn-sm" onclick="openValModal(${s.id}, 'submission')">Réviser →</button></div>` : ''}
        </div>
      </div>`;
    }).join('')}</div>`;
  }

  qs('#agendaTabs').querySelectorAll('[data-atab]').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.atab;
      qs('#agendaTabs').querySelectorAll('.vtab').forEach(b => b.classList.toggle('active', b.dataset.atab === activeTab));
      drawAgenda();
    });
  });
  drawAgenda();
}

/* ─────────────────────────────────────────────
   ── SIGNALEMENTS (Crowdsourcing) ──
───────────────────────────────────────────── */
function renderReports() {
  setTitle('Signalements du public');
  const reports = DB.getAll('reports');
  const pending = reports.filter(r => r.status === 'pending');

  qs('#page').innerHTML = `
    <div class="page-head">
      <div class="page-head-left"><h2>🚨 Signalements du public</h2><p>${pending.length} signalement(s) en attente · ${reports.length} total</p></div>
    </div>
    <div class="panel">
      <div class="panel-body" style="padding:16px;">
        ${reports.length === 0
      ? '<div class="empty-state"><div class="empty-state-icon">✅</div><h3>Aucun signalement</h3><p>Le public n\'a signalé aucune erreur pour le moment.</p></div>'
      : `<div class="activity-list">${reports.map(r => `
              <div class="activity-item">
                <div class="activity-icon">${r.status === 'pending' ? '🔴' : '✅'}</div>
                <div class="activity-content">
                  <div><strong>${r.infraName || 'Inconnue'}</strong> — ${r.type}</div>
                  <div style="font-size:0.82rem; margin:4px 0; color:var(--text-mid);">${r.message}</div>
                  <div style="display:flex; gap:12px; align-items:center; margin-top:8px;">
                    <span class="activity-time">${formatDate(r.createdAt)}</span>
                    ${statusBadge(r.status)}
                    ${r.status === 'pending' && currentUser.role === 'admin' ? `
                      <button class="btn-primary btn-sm" onclick="resolveReport(${r.id})">Marquer résolu</button>
                      <button class="btn-ghost btn-sm" onclick="openReportEditModal(${r.id})">Voir l'infra</button>
                    ` : ''}
                  </div>
                </div>
              </div>`).join('')}
            </div>`
    }
      </div>
    </div>
  `;
}

window.resolveReport = function (id) {
  DB.update('reports', id, { status: 'resolved', resolvedAt: new Date().toISOString().slice(0, 10), resolvedBy: currentUser.name });
  DB.log('Signalement résolu', `Signalement #${id} marqué comme résolu.`);
  showToast('Signalement marqué comme résolu ✅');
  renderReports();
};

window.openReportEditModal = function (id) {
  const r = DB.findById('reports', id);
  if (!r) return;
  showToast(`Infrastructure: ${r.infraName} — cliquez Infrastructures pour modifier.`, 'info', 5000);
};

/* Fonction appelable depuis le site public pour signaler une erreur */
window.publicReport = function (infraName, type, message) {
  DB.push('reports', {
    id: DB.nextId('reports'),
    infraName, type, message,
    status: 'pending',
    createdAt: new Date().toISOString().slice(0, 10),
  });
  return true;
};

/* ─────────────────────────────────────────────
   ── PROFIL UTILISATEUR ──
───────────────────────────────────────────── */
function renderProfile() {
  setTitle('Mon profil');
  const fullUser = DB.findById('users', currentUser.id);
  if (!fullUser) return;

  const initials = fullUser.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const roleLabel = fullUser.role === 'admin' ? 'Administrateur' : 'Responsable régional';

  qs('#page').innerHTML = `
    <div class="page-head"><div class="page-head-left"><h2>👤 Mon profil</h2></div></div>

    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">

      <!-- Infos personnelles -->
      <div class="form-panel">
        <div class="form-head">
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="width:56px; height:56px; background:var(--green-mid); color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight:700;">${initials}</div>
            <div><h3 style="margin:0;">${fullUser.name}</h3><div style="font-size:0.8rem; color:var(--text-lt);">${roleLabel} · ${fullUser.region}</div></div>
          </div>
        </div>
        <div class="form-body">
          <div class="field"><label>Prénom et Nom</label><input type="text" id="pName" value="${fullUser.name}" /></div>
          <div class="field"><label>Email</label><input type="email" id="pEmail" value="${fullUser.email}" /></div>
          <div class="field"><label>Téléphone</label><input type="tel" id="pPhone" value="${fullUser.phone || ''}" /></div>
          <div class="field"><label>Infrastructure gérée</label><input type="text" id="pInfra" value="${fullUser.infraName || ''}" placeholder="Nom de votre infrastructure" /></div>
          <div id="pError" class="error-msg hidden"></div>
          <div style="display:flex; justify-content:flex-end; padding-top:8px;">
            <button class="btn-primary" onclick="saveProfile()">💾 Enregistrer les modifications</button>
          </div>
        </div>
      </div>

      <!-- Changement de mot de passe -->
      <div class="form-panel">
        <div class="form-head"><h3>🔒 Changer de mot de passe</h3></div>
        <div class="form-body">
          <div class="field"><label>Mot de passe actuel *</label><input type="password" id="pwCurrent" placeholder="••••••••" /></div>
          <div class="field"><label>Nouveau mot de passe *</label><input type="password" id="pwNew" placeholder="Min. 6 caractères" /></div>
          <div class="field"><label>Confirmer le nouveau *</label><input type="password" id="pwConfirm" placeholder="Répéter le nouveau" /></div>
          <div id="pwError" class="error-msg hidden"></div>
          <div style="display:flex; justify-content:flex-end; padding-top:8px;">
            <button class="btn-primary" onclick="changePassword()">🔑 Mettre à jour le mot de passe</button>
          </div>
        </div>
      </div>

    </div>

    <!-- Mes stats -->
    <div class="panel" style="margin-top:20px;">
      <div class="panel-head"><span class="panel-title">📊 Mes statistiques de contribution</span></div>
      <div class="panel-body" style="padding:20px;">
        ${renderContribStats(fullUser)}
      </div>
    </div>
  `;
}

function renderContribStats(user) {
  const mySubs = DB.getAll('submissions').filter(s => s.userId === user.id);
  const approved = mySubs.filter(s => s.status === 'approved').length;
  const pending = mySubs.filter(s => s.status === 'pending').length;
  const rejected = mySubs.filter(s => s.status === 'rejected').length;
  const max = Math.max(1, approved, pending, rejected);

  return `<div class="chart-bar-row">
    <span class="chart-bar-label">Approuvées</span>
    <div class="chart-bar-track"><div class="chart-bar-fill green" style="width:${Math.round(approved / max * 100)}%"></div></div>
    <span class="chart-bar-value">${approved}</span>
  </div>
  <div class="chart-bar-row">
    <span class="chart-bar-label">En attente</span>
    <div class="chart-bar-track"><div class="chart-bar-fill gold" style="width:${Math.round(pending / max * 100)}%"></div></div>
    <span class="chart-bar-value">${pending}</span>
  </div>
  <div class="chart-bar-row">
    <span class="chart-bar-label">Rejetées</span>
    <div class="chart-bar-track"><div class="chart-bar-fill red" style="width:${Math.round(rejected / max * 100)}%"></div></div>
    <span class="chart-bar-value">${rejected}</span>
  </div>
  <div style="margin-top:12px; font-size:0.8rem; color:var(--text-lt);">Membre depuis le ${formatDate(user.createdAt)}</div>`;
}

window.saveProfile = function () {
  const name = qs('#pName').value.trim();
  const email = qs('#pEmail').value.trim();
  const phone = qs('#pPhone').value.trim();
  const infraName = qs('#pInfra').value.trim();

  if (!name || !email) { showFormError('pError', 'Le nom et l\'email sont obligatoires.'); return; }

  DB.update('users', currentUser.id, { name, email, phone, infraName });
  // Update session
  currentUser.name = name;
  sessionStorage.setItem('adminUser', JSON.stringify(currentUser));

  DB.log('Profil mis à jour', `${name} a modifié ses informations personnelles.`);
  showToast('Profil mis à jour avec succès ✅');
  updateTopbar();
  buildSidebar();
};

window.changePassword = function () {
  const current = qs('#pwCurrent').value;
  const newPw = qs('#pwNew').value;
  const confirm = qs('#pwConfirm').value;
  const errEl = qs('#pwError');
  errEl.classList.add('hidden');

  const fullUser = DB.findById('users', currentUser.id);
  if (fullUser.password !== current) {
    errEl.textContent = 'Le mot de passe actuel est incorrect.';
    errEl.classList.remove('hidden');
    return;
  }
  if (newPw.length < 6) {
    errEl.textContent = 'Le nouveau mot de passe doit contenir au moins 6 caractères.';
    errEl.classList.remove('hidden');
    return;
  }
  if (newPw !== confirm) {
    errEl.textContent = 'Les deux mots de passe ne correspondent pas.';
    errEl.classList.remove('hidden');
    return;
  }

  DB.update('users', currentUser.id, { password: newPw });
  DB.log('Changement de mot de passe', `${currentUser.name} a changé son mot de passe.`);
  showToast('Mot de passe mis à jour ✅');
  qs('#pwCurrent').value = '';
  qs('#pwNew').value = '';
  qs('#pwConfirm').value = '';
};

/* ─────────────────────────────────────────────
   ── INIT ──
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  seedData();
  initLoginForm();
  initPwEye();

  /* Topbar hamburger */
  const ham = qs('#topbarHam') || qs('.topbar-ham');
  if (ham) ham.addEventListener('click', openSidebar);

  /* Sidebar overlay close */
  qs('#sbOverlay')?.addEventListener('click', closeSidebar);

  if (checkAuth()) {
    showApp();
  } else {
    showLogin();
  }
});
