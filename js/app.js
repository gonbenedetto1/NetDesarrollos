// ═══════════════════════════════════════════════════════
//  APP.JS — Router + Auth gate + Init
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
      // Stay on current view (just open panel)
      return;
    }

    const route = '/' + (parts[0] || 'dashboard');
    const handlers = {
      '/dashboard':     () => { DashboardView.render();  Sidebar.setActive('/dashboard'); },
      '/systems':       () => { SystemsView.renderList(); Sidebar.setActive('/systems'); },
      '/tasks':         () => { TasksView.render();       Sidebar.setActive('/tasks'); },
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
  init() {
    const user = Store.getCurrentUser();
    if (!user) { LoginView.render(); return; }

    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    Sidebar.render();
    Notifications.render();

    // Store listeners
    Store.on('blocks:changed',        () => { Sidebar.render(); Notifications.render(); });
    Store.on('systems:changed',       () => Sidebar.render());
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
document.addEventListener('DOMContentLoaded', () => {
  // Auto-reset: when demo tasks exist (t1..t15), clear storage so the app starts empty
  try {
    const saved = localStorage.getItem('snet_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      const hasDemoTasks = parsed.tasks && parsed.tasks.some(t => /^t([1-9]|1[0-5])$/.test(t.id));
      if (hasDemoTasks) {
        localStorage.removeItem('snet_v2');
        // Keep auth so user stays logged in
      }
    }
  } catch(e) {}

  const user = Store.getCurrentUser();
  if (user) {
    App.init();
  } else {
    LoginView.render();
  }

  // Dev helper
  window._reset = () => { Store.resetToDefaults(); Store.logout(); location.reload(); };
  console.log('%cSistema NET', 'font-size:16px;font-weight:bold;color:#0071E3');
  console.log('Login con email. Contrasenas: nombre en minusculas (miguel, gonzalo, camilo)');
  console.log('_reset() para limpiar todo');
});
