// ═══════════════════════════════════════════════════════
//  VIEWS/PROJECTS.JS
// ═══════════════════════════════════════════════════════

const ProjectsView = {
  currentView: 'list', // 'list' | 'kanban'

  renderList() {
    Topbar.render({
      title: 'Proyectos',
      actions: [{ label: 'Nuevo proyecto', icon: 'plus', primary: true, action: 'new-project' }],
    });

    const projects = Store.getProjects();
    const users    = Store.getUsers();

    const projectCards = projects.map(p => {
      const progress = Store.getProjectProgress(p.id);
      const counts   = Store.getProjectTaskCounts(p.id);
      const members  = (p.members || []).map(id => Store.getUserById(id)).filter(Boolean);
      const budgetPct = p.budget > 0 ? Math.round((p.budgetSpent / p.budget) * 100) : 0;
      const isOverBudget = budgetPct > 90;

      return `
      <div class="project-card" data-open-project="${p.id}">
        <div class="project-card-header">
          <div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <div class="project-color-dot" style="background:${p.color}"></div>
              <span class="badge ${Utils.statusClass(p.status)}">${Utils.statusLabel(p.status)}</span>
            </div>
            <div class="project-name">${p.name}</div>
          </div>
          <button class="btn btn-ghost btn-icon btn-sm" data-edit-project="${p.id}" style="flex-shrink:0">
            ${Utils.icon('more', 16)}
          </button>
        </div>

        <p class="project-desc">${p.description}</p>

        <div class="project-stats">
          <div class="project-stat">
            <div class="project-stat-val">${counts.total}</div>
            <div class="project-stat-label">Total</div>
          </div>
          <div class="project-stat">
            <div class="project-stat-val" style="color:var(--accent)">${counts.active}</div>
            <div class="project-stat-label">Activas</div>
          </div>
          <div class="project-stat">
            <div class="project-stat-val" style="color:var(--green)">${counts.done}</div>
            <div class="project-stat-label">Hechas</div>
          </div>
          ${counts.blocked > 0 ? `
          <div class="project-stat">
            <div class="project-stat-val" style="color:var(--red)">${counts.blocked}</div>
            <div class="project-stat-label">Bloqueadas</div>
          </div>` : ''}
        </div>

        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px">
            <span style="font-size:12px;color:var(--text-3)">Progreso general</span>
            <span style="font-size:12px;font-weight:600;color:var(--text-1)">${progress}%</span>
          </div>
          ${Utils.progressBar(progress, progress === 100 ? 'green' : 'blue')}
        </div>

        ${p.budget ? `
        <div style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px">
            <span style="font-size:12px;color:var(--text-3)">Presupuesto</span>
            <span style="font-size:12px;color:${isOverBudget?'var(--red)':'var(--text-2)'}">
              ${Utils.formatCurrency(p.budgetSpent)} / ${Utils.formatCurrency(p.budget)}
            </span>
          </div>
          ${Utils.progressBar(Math.min(budgetPct, 100), isOverBudget ? 'red' : budgetPct > 70 ? 'orange' : 'blue')}
        </div>` : ''}

        <div class="project-footer">
          <div style="display:flex;gap:-4px">
            ${members.map((u, i) => `<div style="margin-left:${i>0?'-6px':'0'}">${Utils.avatarHtml(u, 'sm')}</div>`).join('')}
            ${members.length ? `<span style="font-size:11.5px;color:var(--text-3);margin-left:6px">${members.length} miembro${members.length!==1?'s':''}</span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:4px">
            ${p.targetDate ? `<span style="font-size:11.5px;color:${Utils.isOverdue(p.targetDate)?'var(--red)':'var(--text-3)'}">${Utils.formatDateShort(p.targetDate)}</span>` : ''}
          </div>
        </div>
      </div>`;
    });

    document.getElementById('view-content').innerHTML = `
      <div class="view-header">
        <div class="view-header-left">
          <h1>Proyectos</h1>
          <p>${projects.filter(p => p.status === 'active').length} activos · ${projects.length} total</p>
        </div>
      </div>

      <div class="filter-bar" style="margin-bottom:20px">
        <button class="filter-chip active" data-filter="all">Todos</button>
        <button class="filter-chip" data-filter="active">Activos</button>
        <button class="filter-chip" data-filter="paused">Pausados</button>
      </div>

      <div class="project-grid" id="projects-grid">
        ${projectCards.join('')}
      </div>`;

    this.attachListEvents();
  },

  renderProject(projectId) {
    const project = Store.getProjectById(projectId);
    if (!project) { Router.navigate('/projects'); return; }

    Topbar.render({
      breadcrumb: [
        { label: 'Proyectos', route: '/projects' },
        { label: project.name },
      ],
      actions: [
        { label: 'Nueva tarea', icon: 'plus', primary: true, action: 'new-task' },
      ],
    });

    const progress = Store.getProjectProgress(projectId);
    const counts   = Store.getProjectTaskCounts(projectId);
    const budgetPct = project.budget > 0 ? Math.round((project.budgetSpent / project.budget) * 100) : 0;

    document.getElementById('view-content').innerHTML = `
      <!-- Project header -->
      <div class="card" style="margin-bottom:20px">
        <div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:16px">
          <div style="width:44px;height:44px;border-radius:12px;background:${project.color}20;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <div style="width:16px;height:16px;border-radius:50%;background:${project.color}"></div>
          </div>
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
              <h2 style="font-size:18px">${project.name}</h2>
              <span class="badge ${Utils.statusClass(project.status)}">${Utils.statusLabel(project.status)}</span>
            </div>
            <p style="font-size:13.5px;color:var(--text-2)">${project.description}</p>
          </div>
          <button class="btn btn-secondary btn-sm" data-edit-project="${project.id}">${Utils.icon('edit', 14)} Editar</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:16px">
          ${[
            ['Total', counts.total, 'var(--text-1)'],
            ['En progreso', counts.active, 'var(--accent)'],
            ['En revisión', counts.review, 'var(--purple)'],
            ['Finalizadas', counts.done, 'var(--green)'],
            ['Bloqueadas', counts.blocked, 'var(--red)'],
          ].map(([lbl, val, color]) => `
            <div style="text-align:center;padding:10px;background:var(--bg-app);border-radius:var(--r-md)">
              <div style="font-size:20px;font-weight:600;color:${color};font-family:var(--font-display)">${val}</div>
              <div style="font-size:11px;color:var(--text-3);text-transform:uppercase;letter-spacing:0.04em;margin-top:2px">${lbl}</div>
            </div>`).join('')}
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
              <span style="font-size:12px;color:var(--text-3)">Progreso</span>
              <span style="font-size:12px;font-weight:600">${progress}%</span>
            </div>
            ${Utils.progressBar(progress, progress === 100 ? 'green' : 'blue')}
          </div>
          ${project.budget ? `
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:5px">
              <span style="font-size:12px;color:var(--text-3)">Presupuesto usado</span>
              <span style="font-size:12px;font-weight:600">${budgetPct}%</span>
            </div>
            ${Utils.progressBar(Math.min(budgetPct, 100), budgetPct > 90 ? 'red' : budgetPct > 70 ? 'orange' : 'blue')}
          </div>` : ''}
        </div>

        ${project.strategyNotes ? `
        <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border-1)">
          <div style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px">Notas estratégicas</div>
          <p style="font-size:13px;color:var(--text-2);line-height:1.5">${project.strategyNotes}</p>
        </div>` : ''}
      </div>

      <!-- View toggle -->
      <div class="tabs" style="margin-bottom:16px">
        <button class="tab-btn ${this.currentView==='kanban'?'active':''}" data-view="kanban">Kanban</button>
        <button class="tab-btn ${this.currentView==='list'?'active':''}" data-view="list">Lista</button>
      </div>

      <!-- Task view -->
      <div id="task-view-container"></div>`;

    this.renderTaskView(projectId);
    this.attachProjectEvents(projectId);
  },

  renderTaskView(projectId) {
    const container = document.getElementById('task-view-container');
    if (!container) return;

    if (this.currentView === 'kanban') {
      this.renderKanban(projectId, container);
    } else {
      this.renderTaskList(projectId, container);
    }
  },

  renderKanban(projectId, container) {
    const columns = [
      { id: 'pending',     label: 'Pendiente',     color: 'var(--s-pending)' },
      { id: 'in_progress', label: 'En progreso',   color: 'var(--s-progress)' },
      { id: 'review',      label: 'En revisión',   color: 'var(--s-review)' },
      { id: 'blocked',     label: 'Bloqueado',     color: 'var(--s-blocked)' },
      { id: 'done',        label: 'Finalizada',    color: 'var(--s-done)' },
    ];

    const allTasks = Store.getTasks({ projectId });

    container.innerHTML = `
      <div class="kanban-board">
        ${columns.map(col => {
          const tasks = allTasks.filter(t => t.status === col.id).sort((a,b) => a.order - b.order);
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
            ${col.id !== 'done' && col.id !== 'cancelled' ? `
            <button class="kanban-add-btn" data-add-col="${col.id}">
              ${Utils.icon('plus', 13)} Agregar
            </button>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  },

  renderKanbanCard(task) {
    const assignee = task.assignedTo ? Store.getUserById(task.assignedTo) : null;
    const overdue  = Utils.isOverdue(task.dueDate);
    const dueSoon  = Utils.isDueSoon(task.dueDate);
    const isBlocked = task.status === 'blocked';

    return `
    <div class="kanban-card ${isBlocked ? 'blocked' : ''}" data-open-task="${task.id}">
      <div class="kanban-card-title">${task.title}</div>
      <div class="kanban-card-meta">
        ${Utils.priorityBadge(task.priority)}
        ${task.tags?.slice(0,1).map(tag => `<span class="badge badge-pending" style="font-size:10px">${tag}</span>`).join('') || ''}
      </div>
      ${task.progress > 0 ? `
      <div style="margin-top:10px">
        ${Utils.progressBar(task.progress, Utils.progressColor(task.progress))}
        <span style="font-size:10.5px;color:var(--text-4);margin-top:2px;display:block">${task.progress}%</span>
      </div>` : ''}
      <div class="kanban-card-footer">
        <div style="display:flex;align-items:center;gap:5px">
          ${task.dueDate ? `<span style="font-size:11px;color:${overdue?'var(--red)':dueSoon?'var(--orange)':'var(--text-4)'}">${Utils.formatDateShort(task.dueDate)}</span>` : ''}
        </div>
        ${assignee ? Utils.avatarHtml(assignee, 'sm') : '<div style="width:22px"></div>'}
      </div>
    </div>`;
  },

  renderTaskList(projectId, container) {
    const tasks = Store.getTasks({ projectId });

    container.innerHTML = `
      <div class="card" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Tarea</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>Asignado a</th>
              <th>Progreso</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => {
              const assignee = t.assignedTo ? Store.getUserById(t.assignedTo) : null;
              const overdue  = Utils.isOverdue(t.dueDate);
              return `
              <tr data-open-task="${t.id}">
                <td style="max-width:260px">
                  <div style="font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
                </td>
                <td>${Utils.statusBadge(t.status)}</td>
                <td>${Utils.priorityBadge(t.priority)}</td>
                <td>
                  ${assignee ? `<div style="display:flex;align-items:center;gap:6px">${Utils.avatarHtml(assignee,'sm')}<span style="font-size:13px">${assignee.name.split(' ')[0]}</span></div>` : '<span style="color:var(--text-4)">—</span>'}
                </td>
                <td style="min-width:100px">
                  <div style="display:flex;align-items:center;gap:8px">
                    <div style="flex:1">${Utils.progressBar(t.progress, Utils.progressColor(t.progress))}</div>
                    <span style="font-size:11.5px;color:var(--text-3);white-space:nowrap">${t.progress}%</span>
                  </div>
                </td>
                <td style="color:${overdue?'var(--red)':'var(--text-2)'};white-space:nowrap">
                  ${Utils.formatDateShort(t.dueDate)}${overdue?' ⚠':''}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  attachListEvents() {
    const content = document.getElementById('view-content');
    Utils.on(content, 'click', '[data-open-project]', function() {
      Router.navigate('/projects/' + this.dataset.openProject);
    });
    Utils.on(content, 'click', '[data-edit-project]', function(e) {
      e.stopPropagation();
      const p = Store.getProjectById(this.dataset.editProject);
      Modal.openProject(p);
    });
    Utils.on(content, 'click', '[data-filter]', function() {
      Utils.qsa('[data-filter]').forEach(el => el.classList.remove('active'));
      this.classList.add('active');
      const f = this.dataset.filter;
      const grid = document.getElementById('projects-grid');
      Utils.qsa('.project-card', grid).forEach(el => {
        el.style.display = (f === 'all') ? '' : 'none';
      });
      if (f !== 'all') {
        const ps = Store.getProjects(f);
        ps.forEach(p => {
          const el = Utils.qs(`[data-open-project="${p.id}"]`, grid);
          if (el) el.style.display = '';
        });
      }
    });
    Utils.on(document.getElementById('topbar'), 'click', '[data-action="new-project"]', () => Modal.openProject());
  },

  attachProjectEvents(projectId) {
    const content = document.getElementById('view-content');
    Utils.on(content, 'click', '[data-open-task]', function() { Panel.openTask(this.dataset.openTask); });
    Utils.on(content, 'click', '[data-view]', function() {
      ProjectsView.currentView = this.dataset.view;
      Utils.qsa('.tab-btn').forEach(el => el.classList.toggle('active', el.dataset.view === ProjectsView.currentView));
      ProjectsView.renderTaskView(projectId);
      ProjectsView.attachProjectEvents(projectId);
    });
    Utils.on(content, 'click', '[data-add-col]', function() {
      Modal.openTask({ projectId, status: this.dataset.addCol });
    });
    Utils.on(content, 'click', '[data-edit-project]', function() {
      Modal.openProject(Store.getProjectById(this.dataset.editProject));
    });
    Utils.on(document.getElementById('topbar'), 'click', '[data-action="new-task"]', () => Modal.openTask({ projectId }));
    Store.on('tasks:changed:' + projectId, () => {
      const container = document.getElementById('task-view-container');
      if (container) {
        if (ProjectsView.currentView === 'kanban') ProjectsView.renderKanban(projectId, container);
        else ProjectsView.renderTaskList(projectId, container);
        ProjectsView.attachProjectEvents(projectId);
      }
    });
  },
};
