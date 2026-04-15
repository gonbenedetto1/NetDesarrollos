// ═══════════════════════════════════════════════════════
//  NOTIFICATIONS.JS
// ═══════════════════════════════════════════════════════

const Notifications = {
  _lastCount: -1,

  render() {
    const user = Store.getCurrentUser();
    if (!user) return;
    const unread = Store.getUnreadCount(user.id);

    // Show toast alert if a new notification arrived
    if (this._lastCount >= 0 && unread > this._lastCount) {
      const notifs = Store.getNotifications(user.id);
      const newest = notifs.find(n => !n.read);
      if (newest) this._showAlert(newest);
    }
    this._lastCount = unread;
    this.updateBadges(unread);
  },

  _showAlert(notif) {
    const icon = notif.type === 'mention' ? '💬' : '📋';
    const el = document.createElement('div');
    el.style.cssText = [
      'position:fixed', 'bottom:24px', 'right:24px', 'z-index:999',
      'background:var(--text-1)', 'color:white',
      'padding:14px 16px', 'border-radius:14px',
      'box-shadow:0 8px 28px rgba(0,0,0,0.2)',
      'font-size:13px', 'max-width:300px', 'line-height:1.4',
      'display:flex', 'gap:10px', 'align-items:flex-start',
      'cursor:pointer', 'animation:toastIn 0.25s ease',
    ].join(';');
    el.innerHTML = `
      <span style="font-size:20px;flex-shrink:0;margin-top:1px">${icon}</span>
      <div>
        <div style="font-weight:600;margin-bottom:3px;font-size:13px">Nueva notificación</div>
        <div style="opacity:0.8;font-size:12px">${notif.text}</div>
      </div>
      <button style="margin-left:8px;background:rgba(255,255,255,0.15);border:none;color:white;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0" id="notif-dismiss">✕</button>`;
    el.querySelector('#notif-dismiss').onclick = (e) => { e.stopPropagation(); el.remove(); };
    el.onclick = () => { el.remove(); this.openPanel(); };
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0'; el.style.transition = 'opacity 0.4s';
      setTimeout(() => el.remove(), 400);
    }, 6000);
  },

  updateBadges(count) {
    const bell = document.getElementById('bell-badge');
    if (bell) {
      bell.textContent = count > 9 ? '9+' : count;
      bell.style.display = count > 0 ? 'flex' : 'none';
    }
    const sb = document.getElementById('sidebar-notif-count');
    if (sb) {
      sb.textContent = count;
      sb.style.display = count > 0 ? 'flex' : 'none';
    }
  },

  openPanel() {
    const user = Store.getCurrentUser();
    if (!user) return;
    const panel   = document.getElementById('notif-panel');
    const overlay = document.getElementById('notif-overlay');
    const notifs  = Store.getNotifications(user.id);

    panel.innerHTML = `
      <div class="notif-header">
        <span class="notif-title">Notificaciones</span>
        ${notifs.some(n => !n.read)
          ? `<button class="btn btn-ghost btn-xs" id="notif-mark-all">Marcar leídas</button>`
          : `<span style="font-size:12px;color:var(--text-4)">Todo leído</span>`}
      </div>
      <div class="notif-list">
        ${notifs.length === 0
          ? `<div class="notif-empty">Sin notificaciones por ahora</div>`
          : notifs.map(n => `
            <div class="notif-item ${!n.read ? 'unread' : ''}" data-notif-id="${n.id}" data-task-id="${n.taskId}">
              <div class="notif-dot ${n.read ? 'hidden-dot' : ''}"></div>
              <div class="notif-body">
                <div class="notif-text">${n.text}</div>
                <div class="notif-time">${Utils.timeAgo(n.createdAt)}</div>
              </div>
              <span style="font-size:18px;opacity:0.5">${n.type === 'assigned' ? '📋' : '💬'}</span>
            </div>`).join('')}
      </div>`;

    panel.classList.remove('hidden');
    overlay.classList.remove('hidden');
    overlay.onclick = () => this.closePanel();

    document.getElementById('notif-mark-all')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Store.markAllRead(user.id);
      this._lastCount = 0;
      this.openPanel();
      this.updateBadges(0);
    });

    panel.querySelectorAll('[data-notif-id]').forEach(el => {
      el.addEventListener('click', () => {
        Store.markRead(el.dataset.notifId);
        this.closePanel();
        if (el.dataset.taskId) Panel.openTask(el.dataset.taskId);
        this.render();
      });
    });
  },

  closePanel() {
    document.getElementById('notif-panel').classList.add('hidden');
    document.getElementById('notif-overlay').classList.add('hidden');
  },
};
