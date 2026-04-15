// ═══════════════════════════════════════════════════════
//  TOPBAR.JS — with notification bell
// ═══════════════════════════════════════════════════════

const Topbar = {
  render(config = {}) {
    const { title, breadcrumb, actions = [] } = config;
    const user   = Store.getCurrentUser();
    const unread = user ? Store.getUnreadCount(user.id) : 0;

    const titleHtml = breadcrumb
      ? `<div class="topbar-breadcrumb">
          ${breadcrumb.map((b, i) => i < breadcrumb.length - 1
            ? `<span data-route="${b.route}" style="cursor:pointer;color:var(--accent)">${b.label}</span><span class="crumb-sep">›</span>`
            : `<span class="crumb-active">${b.label}</span>`
          ).join('')}
        </div>`
      : `<span class="topbar-title">${title || ''}</span>`;

    document.getElementById('topbar').innerHTML = `
      ${titleHtml}
      <div class="topbar-spacer"></div>
      <div class="topbar-actions">
        ${actions.map(a => `
          <button class="btn ${a.primary ? 'btn-primary' : 'btn-secondary'} btn-sm" data-action="${a.action}">
            ${a.icon ? Utils.icon(a.icon, 14) : ''}
            ${a.label}
          </button>`).join('')}
        <button class="btn btn-ghost btn-icon bell-btn" id="bell-btn" title="Notificaciones">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span id="bell-badge" class="bell-badge" style="display:${unread > 0 ? 'flex' : 'none'}">${unread > 9 ? '9+' : unread}</span>
        </button>
      </div>`;

    Utils.on(document.getElementById('topbar'), 'click', '[data-route]', function() {
      Router.navigate(this.dataset.route);
    });
    document.getElementById('bell-btn')?.addEventListener('click', () => {
      Notifications.openPanel();
    });
  },
};
