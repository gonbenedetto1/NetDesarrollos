// ═══════════════════════════════════════════════════════
//  SIDEBAR.JS
// ═══════════════════════════════════════════════════════

const Sidebar = {
  render() {
    const systems     = Store.getSystems();
    const activeBlocks = Store.getBlocks('active').length;
    const user        = Store.getCurrentUser();
    if (!user) return;
    const unread      = Store.getUnreadCount(user.id);
    const current     = window.location.hash.slice(1) || '/dashboard';

    const isActive = (route) => {
      if (route === '/dashboard') return current === '/dashboard' || current === '';
      return current.startsWith(route);
    };

    const navItem = (route, iconName, label, badge, badgeClass) => {
      const badgeHtml = badge
        ? `<span class="${badgeClass || 'nav-badge'}">${badge}</span>`
        : '';
      return `
        <div class="nav-item ${isActive(route) ? 'active' : ''}" data-route="${route}">
          <span class="nav-icon">${Utils.icon(iconName)}</span>
          ${label}
          ${badgeHtml}
        </div>`;
    };

    document.getElementById('sidebar').innerHTML = `
      <div class="sidebar-logo">
        <div class="sidebar-logo-mark"><span>NET</span></div>
        <span class="sidebar-logo-text">Sistema NET</span>
      </div>

      <div class="sidebar-nav">
        <div class="sidebar-section">Principal</div>
        ${navItem('/dashboard', 'dashboard', 'Dashboard')}
        ${navItem('/systems',   'projects',  'Sistemas')}
        ${navItem('/tasks',     'tasks',     'Mis tareas')}
        ${navItem('/blocks',    'blocks',    'Bloqueos', activeBlocks > 0 ? activeBlocks : null)}
        ${navItem('/notifications', 'bell',  'Notificaciones',
            unread > 0 ? unread : null, 'sidebar-notif-badge')}
      </div>

      <div class="sidebar-nav">
        <div class="sidebar-section">Herramientas</div>
        ${navItem('/calendar', 'calendar', 'Gantt')}
        ${navItem('/reports',  'reports',  'Reportes')}
        ${navItem('/help',     'help',     'Guia de uso')}
      </div>

      <div class="sidebar-nav">
        <div class="sidebar-section">Sistemas</div>
        <div class="sidebar-projects">
          ${systems.map(s => {
            const counts = Store.getSystemTaskCounts(s.id);
            return `
              <div class="proj-nav-item ${current === '/systems/' + s.id ? 'active' : ''}" data-route="/systems/${s.id}">
                <div class="proj-dot" style="background:${s.color}"></div>
                <span class="truncate">${s.name}</span>
                ${counts.blocked > 0
                  ? `<span class="proj-nav-count" style="color:var(--red)">${counts.blocked}⚠</span>`
                  : `<span class="proj-nav-count">${counts.total}</span>`}
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="sidebar-user" id="sidebar-user-btn">
          ${Utils.avatarHtml(user, 'md')}
          <div class="sidebar-user-info">
            <div class="sidebar-user-name">${user.name}</div>
            <div class="sidebar-user-role">${{lead:'Director',marketing:'Marketing',developer:'Desarrollo',gvamax:'Encargado GVAMax'}[user.role]||user.role}</div>
          </div>
          <button class="btn btn-ghost btn-icon btn-sm" id="logout-btn" title="Cerrar sesión">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>`;

    this.attachEvents();
  },

  attachEvents() {
    const sb = document.getElementById('sidebar');
    Utils.on(sb, 'click', '[data-route]', function() { Router.navigate(this.dataset.route); });
    document.getElementById('logout-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Store.logout();
      location.reload();
    });
  },

  setActive(route) {
    Utils.qsa('.nav-item', document.getElementById('sidebar')).forEach(el => {
      const r = el.dataset.route;
      const a = r === '/dashboard'
        ? (route === '/dashboard' || route === '')
        : route.startsWith(r);
      el.classList.toggle('active', a);
    });
    Utils.qsa('.proj-nav-item', document.getElementById('sidebar')).forEach(el => {
      el.classList.toggle('active', el.dataset.route === route);
    });
  },
};
