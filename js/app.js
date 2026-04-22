// ═══════════════════════════════════════════════════════
//  APP.JS — Router + Auth gate + Init (Supabase)
// ═══════════════════════════════════════════════════════

// Stores last topbar config so views can re-render it after mutations
const NotifPanel = { _lastConfig: {}, setLastConfig(cfg) { this._lastConfig = cfg; } };

const Router = {
  navigate(path) { window.location.hash = '#' + path; },

  resolve() {
    Modal.close();
    const hash  = window.location.hash.slice(1) || '/dashboard';
    const parts = hash.split('/').filter(Boolean);

    // Systems detail: /systems/:id
    if (parts[0] === 'systems' && parts[1]) {
      SystemsView.renderSystem(parts[1]);
      Sidebar.setActive('/systems/' + parts[1]);
      return;
    }

    // Notifications as nav item
    if (parts[0] === 'notifications') {
      Notifications.openPanel();
      Sidebar.setActive('/notifications');
      return;
    }

    const route = '/' + (parts[0] || 'dashboard');
    const handlers = {
      '/dashboard':     () => { DashboardView.render();  Sidebar.setActive('/dashboard'); },
      '/systems':       () => { SystemsView.renderList(); Sidebar.setActive('/systems'); },
      '/tasks':         () => { TasksView.render();       Sidebar.setActive('/tasks'); },
      '/leads':         () => { LeadsView.render();       Sidebar.setActive('/leads'); },
      '/blocks':        () => { BlocksView.render();      Sidebar.setActive('/blocks'); },
      '/calendar':      () => { CalendarView.render();    Sidebar.setActive('/calendar'); },
      '/reports':       () => { ReportsView.render();     Sidebar.setActive('/reports'); },
      '/help':          () => { HelpView.render();        Sidebar.setActive('/help'); },
    };

    const handler = handlers[route];
    if (handler) handler();
    else Router.navigate('/dashboard');

    const content = document.getElementById('view-content');
    if (content) content.scrollTop = 0;
  },
};

// ═══════════════════════════════════════════════════════
//  App
// ═══════════════════════════════════════════════════════

const App = {
  async init() {
    const user = Store.getCurrentUser();
    if (!user) { LoginView.render(); return; }

    // Show loading state
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('view-content').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:50vh;flex-direction:column;gap:12px">
        <div style="width:32px;height:32px;border:3px solid var(--border-2);border-top-color:var(--accent);border-radius:50%;animation:spin 0.8s linear infinite"></div>
        <span style="font-size:13px;color:var(--text-3)">Cargando datos...</span>
      </div>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>`;

    // Load all data from Supabase
    try {
      await Store.load();
    } catch (e) {
      console.error('Error loading data:', e);
    }

    Sidebar.render();
    Notifications.render();

    // Store listeners
    Store.on('blocks:changed',        () => { Sidebar.render(); Notifications.render(); });
    Store.on('systems:changed',       () => Sidebar.render());
    Store.on('leads:changed',         () => Sidebar.render());
    Store.on('notifications:changed', () => Notifications.render());
    Store.on('activity:changed',      () => {});

    window.addEventListener('hashchange', () => Router.resolve());
    Router.resolve();

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const panel = document.getElementById('panel-container');
        if (panel && !panel.classList.contains('hidden')) { Panel.close(); return; }
        Modal.close();
        Notifications.closePanel();
      }
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey && document.activeElement.tagName === 'BODY') {
        Modal.openTask();
      }
    });
  },
};

// ── Boot ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Try to restore Supabase session
  const user = await Store.restoreSession();
  if (user) {
    App.init();
  } else {
    LoginView.render();
  }

  console.log('%cSistema NET', 'font-size:16px;font-weight:bold;color:#0071E3');
  console.log('Conectado a Supabase');
});
