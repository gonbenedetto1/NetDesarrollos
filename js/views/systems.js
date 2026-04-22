// ═══════════════════════════════════════════════════════
//  VIEWS/SYSTEMS.JS — Sistemas (permanentes, sin progreso global)
// ═══════════════════════════════════════════════════════

const SystemsView = {
  currentView: 'kanban',

  renderList() {
    Topbar.render({
      title: 'Sistemas',
      actions: [{ label: 'Nueva tarea', icon: 'plus', primary: true, action: 'new-task' }],
    });

    const systems = Store.getSystems();

    document.getElementById('view-content').innerHTML = `
      <div class="view-header">
        <div class="view-header-left">
          <h1>Sistemas</h1>
          <p>${systems.length} sistemas activos</p>
        </div>
      </div>

      <div class="project-grid">
        ${systems.map(s => this.renderSystemCard(s)).join('')}
      </div>`;

    this.attachListEvents();
  },

  renderSystemCard(s) {
    const counts  = Store.getSystemTaskCounts(s.id);
    const members = (s.members || []).map(id => Store.getUserById(id)).filter(Boolean);

    return `
      <div class="project-card" data-open-system="${s.id}">
        <div class="project-card-header">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <div class="project-color-dot" style="background:${s.color}"></div>
              <span style="font-size:12.5px;font-weight:500;color:var(--text-2)">${s.name}</span>
            </div>
          </div>
          <button class="btn btn-ghost btn-icon btn-sm" data-edit-system="${s.id}">${Utils.icon('more', 16)}</button>
        </div>
        <p class="project-desc">${s.description}</p>

        <div style="display:flex;gap:12px;margin:14px 0;flex-wrap:wrap">
          ${[
            ['Total',       counts.total,   'var(--text-1)'],
            ['En progreso', counts.active,  'var(--accent)'],
            ['En revisión', counts.review,  'var(--purple)'],
            ['Finalizadas', counts.done,    'var(--green)'],
            ...(counts.blocked > 0 ? [['Bloqueadas', counts.blocked, 'var(--red)']] : []),
          ].map(([lbl, val, color]) => `
            <div style="text-align:center">
              <div style="font-size:18px;font-weight:600;color:${color};font-family:var(--font-display)">${val}</div>
              <div style="font-size:10.5px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em">${lbl}</div>
            </div>`).join('')}
        </div>

        <div class="project-footer">
          <div style="display:flex">
            ${members.map((u, i) => `<div style="margin-left:${i > 0 ? '-6px' : '0'}">${Utils.avatarHtml(u, 'sm')}</div>`).join('')}
            ${members.length ? `<span style="font-size:11.5px;color:var(--text-3);margin-left:8px">${members.length} miembro${members.length !== 1 ? 's' : ''}</span>` : ''}
          </div>
          ${counts.blocked > 0 ? `<span style="font-size:11.5px;color:var(--red);font-weight:500">⚠ ${counts.blocked} bloqueada${counts.blocked !== 1 ? 's' : ''}</span>` : ''}
        </div>
      </div>`;
  },

  renderSystem(systemId) {
    const system = Store.getSystemById(systemId);
    if (!system) { Router.navigate('/systems'); return; }

    Topbar.render({
      breadcrumb: [
        { label: 'Sistemas', route: '/systems' },
        { label: system.name },
      ],
      actions: [{ label: 'Nueva tarea', icon: 'plus', primary: true, action: 'new-task' }],
    });

    const counts  = Store.getSystemTaskCounts(systemId);
    const members = (system.members || []).map(id => Store.getUserById(id)).filter(Boolean);

    document.getElementById('view-content').innerHTML = `
      <!-- System header -->
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px">
          <div style="width:44px;height:44px;border-radius:12px;background:${system.color}20;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <div style="width:16px;height:16px;border-radius:50%;background:${system.color}"></div>
          </div>
          <div style="flex:1;min-width:0">
            <h2 style="margin-bottom:4px">${system.name}</h2>
            <p style="font-size:13.5px;color:var(--text-2)">${system.description}</p>
          </div>
          <button class="btn btn-secondary btn-sm" data-edit-system="${system.id}">${Utils.icon('edit', 14)} Editar</button>
        </div>

        <!-- Task counts (no progress bar — los sistemas son permanentes) -->
        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px">
          ${[
            ['Total',       counts.total,   'var(--text-1)'],
            ['En progreso', counts.active,  'var(--accent)'],
            ['En revisión', counts.review,  'var(--purple)'],
            ['Finalizadas', counts.done,    'var(--green)'],
            ['Bloqueadas',  counts.blocked, 'var(--red)'],
          ].map(([lbl, val, color]) => `
            <div style="text-align:center;padding:10px;background:var(--bg-app);border-radius:var(--r-md)">
              <div style="font-size:22px;font-weight:600;color:${color};font-family:var(--font-display)">${val}</div>
              <div style="font-size:10.5px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-top:2px">${lbl}</div>
            </div>`).join('')}
        </div>

        <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-1)">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <span style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em">Equipo (${members.length})</span>
            <button class="btn btn-ghost btn-xs" id="edit-members-btn">${Utils.icon('edit',13)} Editar</button>
          </div>
          <div id="members-display" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
            ${members.map(u => `<div style="display:flex;align-items:center;gap:6px;padding:4px 10px 4px 4px;background:var(--bg-input);border-radius:var(--r-full)">${Utils.avatarHtml(u,'sm')}<span style="font-size:12px;color:var(--text-2)">${u.name.split(' ')[0]}</span></div>`).join('')}
          </div>
          <div id="members-editor" class="hidden" style="margin-top:8px">
            ${Store.getUsers().map(u => {
              const isMember = (system.members || []).includes(u.id);
              return `<label style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:var(--r-md);cursor:pointer;transition:background 0.12s" onmouseover="this.style.background='var(--bg-hover)'" onmouseout="this.style.background=''">
                <input type="checkbox" class="member-check" value="${u.id}" ${isMember ? 'checked' : ''} style="accent-color:var(--accent);width:16px;height:16px">
                ${Utils.avatarHtml(u,'sm')}
                <span style="font-size:13px;color:var(--text-1)">${u.name}</span>
                <span style="font-size:11px;color:var(--text-4);margin-left:auto">${{lead:'Director',marketing:'Marketing',developer:'Desarrollo',gvamax:'Enc. GVAMax',convenios:'Enc. Convenios'}[u.role]||u.role}</span>
              </label>`;
            }).join('')}
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn btn-primary btn-xs" id="save-members-btn">Guardar</button>
              <button class="btn btn-secondary btn-xs" id="cancel-members-btn">Cancelar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- View toggle -->
      <div class="tabs" style="margin-bottom:16px">
        <button class="tab-btn ${this.currentView === 'kanban' ? 'active' : ''}" data-view="kanban">Kanban</button>
        <button class="tab-btn ${this.currentView === 'list'   ? 'active' : ''}" data-view="list">Lista</button>
      </div>

      <div id="task-view-container"></div>`;

    this.renderTaskView(systemId);
    this.attachSystemEvents(systemId);
  },

  renderTaskView(systemId) {
    const container = document.getElementById('task-view-container');
    if (!container) return;
    if (this.currentView === 'kanban') this.renderKanban(systemId, container);
    else this.renderTaskList(systemId, container);
  },

  renderKanban(systemId, container) {
    const columns = [
      { id:'pending',     label:'Pendiente',   color:'var(--s-pending)'  },
      { id:'in_progress', label:'En progreso', color:'var(--s-progress)' },
      { id:'review',      label:'En revisión', color:'var(--s-review)'   },
      { id:'blocked',     label:'Bloqueado',   color:'var(--s-blocked)'  },
      { id:'done',        label:'Finalizada',  color:'var(--s-done)'     },
    ];
    const allTasks = Store.getTasks({ systemId });
    container.innerHTML = `
      <div class="kanban-board">
        ${columns.map(col => {
          const tasks = allTasks.filter(t => t.status === col.id);
          return `
          <div class="kanban-col" data-col="${col.id}">
            <div class="kanban-col-header">
              <span class="kanban-col-name">
                <div style="width:7px;height:7px;border-radius:50%;background:${col.color}"></div>
                ${col.label}
              </span>
              <span class="kanban-col-count">${tasks.length}</span>
            </div>
            <div class="kanban-cards">
              ${tasks.map(t => this.renderKanbanCard(t)).join('')}
            </div>
            ${col.id !== 'done' ? `<button class="kanban-add-btn" data-add-col="${col.id}">${Utils.icon('plus', 13)} Agregar</button>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  },

  renderKanbanCard(task) {
    const assignee  = task.assignedTo ? Store.getUserById(task.assignedTo) : null;
    const overdue   = Utils.isOverdue(task.dueDate);
    const isBlocked = task.status === 'blocked';
    return `
      <div class="kanban-card ${isBlocked ? 'blocked' : ''}" data-open-task="${task.id}">
        <div class="kanban-card-title">${task.title}</div>
        <div class="kanban-card-meta">
          ${Utils.priorityBadge(task.priority)}
          ${task.tags?.slice(0,1).map(t => `<span class="badge badge-pending" style="font-size:10px">${t}</span>`).join('') || ''}
        </div>
        ${task.progress > 0 ? `
        <div style="margin-top:8px">
          ${Utils.progressBar(task.progress, Utils.progressColor(task.progress))}
          <span style="font-size:10.5px;color:var(--text-4);display:block;margin-top:2px">${task.progress}%</span>
        </div>` : ''}
        <div class="kanban-card-footer">
          ${task.dueDate ? `<span style="font-size:11px;color:${overdue ? 'var(--red)' : 'var(--text-4)'}">${Utils.formatDateShort(task.dueDate)}</span>` : '<div></div>'}
          ${assignee ? Utils.avatarHtml(assignee, 'sm') : ''}
        </div>
      </div>`;
  },

  renderTaskList(systemId, container) {
    const tasks = Store.getTasks({ systemId });
    container.innerHTML = `
      <div class="card" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead><tr><th>Tarea</th><th>Estado</th><th>Prioridad</th><th>Asignado</th><th>Progreso</th><th>Deadline</th></tr></thead>
          <tbody>
            ${tasks.map(t => {
              const assignee = t.assignedTo ? Store.getUserById(t.assignedTo) : null;
              const overdue  = Utils.isOverdue(t.dueDate);
              return `
              <tr data-open-task="${t.id}">
                <td style="max-width:260px;font-weight:500">${t.title}</td>
                <td>${Utils.statusBadge(t.status)}</td>
                <td>${Utils.priorityBadge(t.priority)}</td>
                <td>${assignee ? `<div style="display:flex;align-items:center;gap:6px">${Utils.avatarHtml(assignee,'sm')}<span>${assignee.name.split(' ')[0]}</span></div>` : '—'}</td>
                <td style="min-width:100px">
                  <div style="display:flex;align-items:center;gap:7px">
                    <div style="flex:1">${Utils.progressBar(t.progress, Utils.progressColor(t.progress))}</div>
                    <span style="font-size:11px;color:var(--text-3)">${t.progress}%</span>
                  </div>
                </td>
                <td style="color:${overdue ? 'var(--red)' : 'var(--text-2)'}">${Utils.formatDateShort(t.dueDate)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  attachListEvents() {
    const content = document.getElementById('view-content');
    Utils.on(content, 'click', '[data-open-system]', function() { Router.navigate('/systems/' + this.dataset.openSystem); });
    Utils.on(content, 'click', '[data-edit-system]', function(e) {
      e.stopPropagation();
      Modal.openSystem(Store.getSystemById(this.dataset.editSystem));
    });
    Utils.on(document.getElementById('topbar'), 'click', '[data-action="new-task"]', () => Modal.openTask());
  },

  attachSystemEvents(systemId) {
    const content = document.getElementById('view-content');
    Utils.on(content, 'click', '[data-open-task]',   function() { Panel.openTask(this.dataset.openTask); });
    Utils.on(content, 'click', '[data-add-col]',     function() { Modal.openTask({ systemId, status: this.dataset.addCol }); });
    Utils.on(content, 'click', '[data-edit-system]', function() { Modal.openSystem(Store.getSystemById(this.dataset.editSystem)); });
    Utils.on(content, 'click', '[data-view]', function() {
      SystemsView.currentView = this.dataset.view;
      Utils.qsa('.tab-btn').forEach(el => el.classList.toggle('active', el.dataset.view === SystemsView.currentView));
      SystemsView.renderTaskView(systemId);
      SystemsView.attachSystemEvents(systemId);
    });
    // Members editor
    document.getElementById('edit-members-btn')?.addEventListener('click', () => {
      document.getElementById('members-display').classList.add('hidden');
      document.getElementById('members-editor').classList.remove('hidden');
      document.getElementById('edit-members-btn').classList.add('hidden');
    });
    document.getElementById('cancel-members-btn')?.addEventListener('click', () => {
      document.getElementById('members-display').classList.remove('hidden');
      document.getElementById('members-editor').classList.add('hidden');
      document.getElementById('edit-members-btn').classList.remove('hidden');
    });
    document.getElementById('save-members-btn')?.addEventListener('click', () => {
      const checked = [...document.querySelectorAll('.member-check:checked')].map(c => c.value);
      if (checked.length === 0) { Utils.toast('Selecciona al menos un miembro', 'error'); return; }
      Store.updateSystem(systemId, { members: checked });
      Utils.toast('Equipo actualizado', 'success');
      SystemsView.renderSystem(systemId);
    });

    Utils.on(document.getElementById('topbar'), 'click', '[data-action="new-task"]', () => Modal.openTask({ systemId }));
    Store.on('tasks:changed:' + systemId, () => {
      const c = document.getElementById('task-view-container');
      if (!c) return;
      if (SystemsView.currentView === 'kanban') SystemsView.renderKanban(systemId, c);
      else SystemsView.renderTaskList(systemId, c);
      SystemsView.attachSystemEvents(systemId);
    });
  },
};
