// ═══════════════════════════════════════════════════════
//  VIEWS/BLOCKS.JS
// ═══════════════════════════════════════════════════════

const BlocksView = {
  currentTab: 'active',

  render() {
    Topbar.render({ title: 'Bloqueos' });

    const allBlocks  = Store.getBlocks();
    const active     = allBlocks.filter(b => b.status === 'active');
    const resolved   = allBlocks.filter(b => b.status === 'resolved');

    // Metrics
    const avgResolveHrs = resolved.length > 0
      ? Math.round(resolved.reduce((sum, b) => {
          if (!b.createdAt || !b.resolvedAt) return sum;
          return sum + (new Date(b.resolvedAt) - new Date(b.createdAt)) / 3600000;
        }, 0) / resolved.length)
      : 0;

    const criticalCount = active.filter(b => b.severity === 'critical').length;

    document.getElementById('view-content').innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid" style="grid-template-columns:repeat(4,1fr);margin-bottom:24px">
        <div class="kpi-card ${active.length > 0 ? 'danger' : ''}">
          <div class="kpi-label" style="${active.length>0?'color:var(--red)':''}">Activos ahora</div>
          <div class="kpi-value">${active.length}</div>
          <div class="kpi-sub ${active.length>0?'down':''}">${active.length>0?'Requieren atención':'Sin bloqueos activos'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Críticos</div>
          <div class="kpi-value" style="color:${criticalCount>0?'var(--red)':'var(--text-1)'}">${criticalCount}</div>
          <div class="kpi-sub">Prioridad máxima</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Resueltos</div>
          <div class="kpi-value" style="color:var(--green)">${resolved.length}</div>
          <div class="kpi-sub up">Total histórico</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tiempo promedio</div>
          <div class="kpi-value">${avgResolveHrs}<span style="font-size:16px;font-weight:400">h</span></div>
          <div class="kpi-sub">Para resolver</div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-btn ${this.currentTab === 'active' ? 'active' : ''}" data-tab="active">
          Activos <span style="font-size:11px;background:${active.length>0?'var(--red)':'var(--bg-input)'};color:${active.length>0?'white':'var(--text-3)'};padding:1px 7px;border-radius:var(--r-full);margin-left:4px">${active.length}</span>
        </button>
        <button class="tab-btn ${this.currentTab === 'history' ? 'active' : ''}" data-tab="history">
          Historial <span style="font-size:11px;background:var(--bg-input);color:var(--text-3);padding:1px 7px;border-radius:var(--r-full);margin-left:4px">${resolved.length}</span>
        </button>
      </div>

      <div id="blocks-content"></div>`;

    this.renderContent();
    this.attachEvents();
  },

  renderContent() {
    const container = document.getElementById('blocks-content');
    if (!container) return;

    const allBlocks = Store.getBlocks();

    if (this.currentTab === 'active') {
      const active = allBlocks.filter(b => b.status === 'active');

      if (active.length === 0) {
        container.innerHTML = `
          <div class="card">
            <div class="empty-state">
              <div class="empty-state-icon" style="font-size:48px">✅</div>
              <h3>Sin bloqueos activos</h3>
              <p>El equipo está trabajando sin impedimentos.</p>
            </div>
          </div>`;
        return;
      }

      container.innerHTML = active.map(b => {
        const task     = Store.getTaskById(b.taskId);
        const reporter = Store.getUserById(b.reportedBy);
        const project  = task ? Store.getSystemById(task.systemId) : null;
        const elapsed  = b.createdAt ? Math.round((Date.now() - new Date(b.createdAt)) / 3600000) : 0;

        return `
        <div class="card" style="margin-bottom:12px;border-left:4px solid ${b.severity==='critical'?'var(--red)':'var(--orange)'};padding-left:18px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:12px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
                <span class="badge ${b.severity==='critical'?'badge-critical':'badge-high'}">${b.severity==='critical'?'Crítico':'Alta'}</span>
                ${project ? `<div style="display:flex;align-items:center;gap:4px"><div style="width:6px;height:6px;border-radius:50%;background:${project.color}"></div><span style="font-size:12px;color:var(--text-3)">${project.name}</span></div>` : ''}
                <span style="font-size:11.5px;color:var(--text-4)">· ${elapsed}h activo</span>
              </div>
              <div style="font-size:14.5px;font-weight:600;color:var(--text-1);margin-bottom:6px;cursor:pointer" data-open-task="${b.taskId}">
                ${task?.title || '—'} →
              </div>
              <p style="font-size:13.5px;color:var(--text-2);line-height:1.5;margin-bottom:10px">${b.description}</p>
              <div style="display:flex;align-items:center;gap:10px">
                ${reporter ? `<div style="display:flex;align-items:center;gap:6px">${Utils.avatarHtml(reporter,'sm')}<span style="font-size:12.5px;color:var(--text-2)">Reportado por <strong>${reporter.name}</strong></span></div>` : ''}
                <span style="font-size:12px;color:var(--text-4)">${Utils.timeAgo(b.createdAt)}</span>
              </div>
            </div>
            <div style="display:flex;gap:8px;flex-shrink:0">
              <button class="btn btn-secondary btn-sm" data-open-task="${b.taskId}">Ver tarea</button>
              <button class="btn btn-sm" style="background:var(--green);color:white" data-resolve-block="${b.id}">
                ${Utils.icon('check', 13)} Resolver
              </button>
            </div>
          </div>
        </div>`;
      }).join('');

    } else {
      // History
      const resolved = allBlocks.filter(b => b.status === 'resolved');

      if (resolved.length === 0) {
        container.innerHTML = `<div class="card"><div class="empty-state"><div class="empty-state-icon">📂</div><h3>Sin historial</h3><p>Aún no hay bloqueos resueltos.</p></div></div>`;
        return;
      }

      container.innerHTML = `
        <div class="card" style="padding:0;overflow:hidden">
          <table class="data-table">
            <thead>
              <tr>
                <th>Tarea</th>
                <th>Proyecto</th>
                <th>Severidad</th>
                <th>Reportado por</th>
                <th>Resuelto por</th>
                <th>Duración</th>
                <th>Nota de resolución</th>
              </tr>
            </thead>
            <tbody>
              ${resolved.map(b => {
                const task      = Store.getTaskById(b.taskId);
                const reporter  = Store.getUserById(b.reportedBy);
                const resolver  = b.resolvedBy ? Store.getUserById(b.resolvedBy) : null;
                const project   = task ? Store.getSystemById(task.systemId) : null;
                const duration  = (b.createdAt && b.resolvedAt)
                  ? Math.round((new Date(b.resolvedAt) - new Date(b.createdAt)) / 3600000) + 'h'
                  : '—';
                return `
                <tr data-open-task="${b.taskId}">
                  <td style="max-width:200px">
                    <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${task?.title || '—'}</div>
                  </td>
                  <td>
                    ${project ? `<div style="display:flex;align-items:center;gap:5px"><div style="width:6px;height:6px;border-radius:50%;background:${project.color}"></div><span style="font-size:12.5px">${project.name}</span></div>` : '—'}
                  </td>
                  <td><span class="badge ${b.severity==='critical'?'badge-critical':b.severity==='high'?'badge-high':'badge-medium'}">${b.severity}</span></td>
                  <td>${reporter ? `<div style="display:flex;align-items:center;gap:5px">${Utils.avatarHtml(reporter,'sm')}<span style="font-size:12.5px">${reporter.name.split(' ')[0]}</span></div>` : '—'}</td>
                  <td>${resolver ? `<div style="display:flex;align-items:center;gap:5px">${Utils.avatarHtml(resolver,'sm')}<span style="font-size:12.5px">${resolver.name.split(' ')[0]}</span></div>` : '—'}</td>
                  <td style="font-size:12.5px;color:var(--text-2)">${duration}</td>
                  <td style="max-width:220px">
                    <span style="font-size:12.5px;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block">${b.resolutionNote || '—'}</span>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`;
    }
  },

  attachEvents() {
    const content = document.getElementById('view-content');

    Utils.on(content, 'click', '[data-tab]', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      this.currentTab = btn.dataset.tab;
      Utils.qsa('.tab-btn', content).forEach(el => el.classList.toggle('active', el.dataset.tab === this.currentTab));
      this.renderContent();
      this.attachContentEvents();
    });

    this.attachContentEvents();
  },

  attachContentEvents() {
    const container = document.getElementById('blocks-content');
    if (!container) return;

    Utils.on(container, 'click', '[data-open-task]', function() {
      Panel.openTask(this.dataset.openTask);
    });
    Utils.on(container, 'click', '[data-resolve-block]', function(e) {
      e.stopPropagation();
      Modal.openResolve(this.dataset.resolveBlock);
    });
  },
};
