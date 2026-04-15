// VIEWS/DASHBOARD.JS

const DashboardView = {
  render() {
    const cfg = { title: 'Dashboard', actions: [{ label: 'Nueva tarea', icon: 'plus', primary: true, action: 'new-task' }] };
    Topbar.render(cfg); NotifPanel.setLastConfig(cfg);

    const kpis    = Store.getDashboardKPIs();
    const blocks  = Store.getBlocks('active').map(b => ({ ...b, task: Store.getTaskById(b.taskId), reporter: Store.getUserById(b.reportedBy) }));
    const tasks   = Store.getTasks().filter(t => ['in_progress','review'].includes(t.status)).slice(0, 8);
    const activity = Store.getActivity(12);
    const workload = Store.getUserWorkload();
    const user    = Store.getCurrentUser();

    const today = new Date();
    const greeting = today.getHours() < 12 ? 'Buenos días' : today.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches';
    const dateStr = today.toLocaleDateString('es-AR', { weekday:'long', day:'numeric', month:'long' });

    document.getElementById('view-content').innerHTML = `
      <div style="margin-bottom:24px">
        <h1 style="margin-bottom:2px">${greeting}, ${user.name.split(' ')[0]}</h1>
        <p style="font-size:13px;color:var(--text-3);text-transform:capitalize">${dateStr}</p>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Tareas activas</div>
          <div class="kpi-value">${kpis.active}</div>
          <div class="kpi-sub">En progreso y revisión</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Finalizadas hoy</div>
          <div class="kpi-value">${kpis.doneToday}</div>
          <div class="kpi-sub up">↑ buen ritmo</div>
        </div>
        <div class="kpi-card ${kpis.blocked > 0 ? 'danger' : ''}">
          <div class="kpi-label" style="${kpis.blocked > 0 ? 'color:var(--red)' : ''}">Bloqueadas ahora</div>
          <div class="kpi-value">${kpis.blocked}</div>
          <div class="kpi-sub ${kpis.blocked > 0 ? 'down' : ''}">${kpis.blocked > 0 ? 'Requieren atención' : 'Sin bloqueos'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">En revisión</div>
          <div class="kpi-value">${kpis.review}</div>
          <div class="kpi-sub">Esperando aprobación</div>
        </div>
      </div>

      ${blocks.length > 0 ? `
      <div class="block-alert-section">
        <div class="block-alert-header">
          <div class="block-alert-dot"></div>
          <span class="block-alert-title">Bloqueos activos — ${blocks.length} ${blocks.length===1?'tarea requiere':'tareas requieren'} atención</span>
          <a class="section-link" style="margin-left:auto" data-route="/blocks">Ver todos →</a>
        </div>
        ${blocks.map(b => {
          const sys = b.task ? Store.getSystemById(b.task.systemId) : null;
          return `
          <div class="block-item" data-open-task="${b.taskId}">
            <div class="block-severity ${b.severity}"></div>
            <div class="block-body">
              <div class="block-task">${b.task?.title||'—'}</div>
              <div class="block-desc">${b.description}</div>
              <div class="block-meta">
                ${b.severity==='critical'?'<span class="badge badge-critical" style="font-size:10.5px">Crítico</span>':'<span class="badge badge-high" style="font-size:10.5px">Alto</span>'}
                ${b.reporter?Utils.avatarHtml(b.reporter,'sm')+`<span style="font-size:12px;color:var(--text-2)">${b.reporter.name}</span>`:''}
                ${sys?`<span style="font-size:11px;color:var(--text-3)">· ${sys.name}</span>`:''}
                <span class="block-time">· ${Utils.timeAgo(b.createdAt)}</span>
              </div>
            </div>
            <div class="block-actions">
              <button class="btn btn-secondary btn-xs" data-resolve-block="${b.id}">Resolver</button>
            </div>
          </div>`;
        }).join('')}
      </div>` : ''}

      <div style="display:grid;grid-template-columns:1fr 320px;gap:16px">
        <div class="card card-sm">
          <div class="section-header">
            <span class="section-title">Tareas activas del equipo</span>
            <a class="section-link" data-route="/tasks">Ver todas →</a>
          </div>
          <div class="task-list">
            ${tasks.length === 0 ? '<div class="empty-state"><div class="empty-state-icon">✓</div><h3>Todo al día</h3></div>' :
              tasks.map(t => {
                const assignee = t.assignedTo ? Store.getUserById(t.assignedTo) : null;
                const sys = Store.getSystemById(t.systemId);
                const overdue = Utils.isOverdue(t.dueDate);
                return `
                <div class="task-row" data-open-task="${t.id}">
                  <div class="status-indicator" style="background:${Utils.statusColor(t.status)}"></div>
                  <div class="task-title-col">
                    <div class="task-title">${t.status==='blocked'?'🔴 ':''}${t.title}</div>
                    <div class="task-sub">${sys?.name||''}</div>
                  </div>
                  <div class="task-prog">${Utils.progressBar(t.progress, Utils.progressColor(t.progress))}</div>
                  <span style="font-size:11.5px;color:var(--text-3);width:26px;text-align:right">${t.progress}%</span>
                  ${assignee ? Utils.avatarHtml(assignee,'sm') : ''}
                  ${Utils.priorityBadge(t.priority)}
                  ${overdue ? '<span style="font-size:10.5px;color:var(--red);font-weight:600">Vencida</span>' : ''}
                </div>`;
              }).join('')}
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="card card-sm">
            <div class="section-header">
              <span class="section-title">Carga del equipo</span>
              <a class="section-link" data-route="/reports">Ver →</a>
            </div>
            ${workload.map(u => {
              const color = u.load > 80 ? 'var(--red)' : u.load > 60 ? 'var(--orange)' : 'var(--green)';
              return `
              <div class="workload-row">
                ${Utils.avatarHtml(u,'sm')}
                <span style="font-size:12.5px;color:var(--text-2);width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.name.split(' ')[0]}</span>
                <div class="workload-track"><div class="workload-fill" style="width:${u.load}%;background:${color}"></div></div>
                <span class="workload-pct">${u.load}%</span>
              </div>`;
            }).join('')}
          </div>

          <div class="card card-sm" style="flex:1">
            <div class="section-header"><span class="section-title">Actividad reciente</span></div>
            ${activity.map(a => {
              const u = Store.getUserById(a.userId);
              const isBlocked = a.action === 'blocked';
              const isDone    = a.action === 'done' || a.action === 'resolved';
              return `
              <div class="activity-item">
                ${u ? Utils.avatarHtml(u,'sm') : ''}
                <div class="activity-body">
                  <div class="activity-text">
                    <span class="actor">${u?.name?.split(' ')[0]||'?'}</span>
                    <span class="${isBlocked?'action-blocked':isDone?'action-done':''}"> ${a.text.replace(/^[^ ]+ /,'')}</span>
                  </div>
                  <div class="activity-time">${Utils.timeAgo(a.createdAt)}</div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>`;

    this.attachEvents();
  },

  attachEvents() {
    const c = document.getElementById('view-content');
    Utils.on(c, 'click', '[data-open-task]',      function() { Panel.openTask(this.dataset.openTask); });
    Utils.on(c, 'click', '[data-resolve-block]',  function(e) { e.stopPropagation(); Modal.openResolve(this.dataset.resolveBlock); });
    Utils.on(c, 'click', '[data-route]',          function() { Router.navigate(this.dataset.route); });
    Utils.on(document.getElementById('topbar'), 'click', '[data-action="new-task"]', () => Modal.openTask());
  },
};
