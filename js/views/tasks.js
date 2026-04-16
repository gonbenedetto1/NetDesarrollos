// ═══════════════════════════════════════════════════════
//  VIEWS/TASKS.JS
// ═══════════════════════════════════════════════════════

const TasksView = {
  currentTab: 'mine',
  currentFilter: 'all',
  searchQuery: '',

  render() {
    Topbar.render({
      title: 'Tareas',
      actions: [{ label: 'Nueva tarea', icon: 'plus', primary: true, action: 'new-task' }],
    });

    const me = Store.getCurrentUser();
    const myTasks  = Store.getTasks({ assignedTo: me.id });
    const allTasks = Store.getTasks();

    const countBadge = (tasks, status) => {
      const n = status ? tasks.filter(t => t.status === status).length : tasks.length;
      return n > 0 ? `<span style="font-size:11px;background:var(--bg-input);color:var(--text-3);padding:1px 7px;border-radius:var(--r-full);margin-left:5px">${n}</span>` : '';
    };

    document.getElementById('view-content').innerHTML = `
      <div class="view-header">
        <div class="view-header-left">
          <h1>Tareas</h1>
        </div>
      </div>

      <div class="tabs">
        <button class="tab-btn ${this.currentTab === 'mine' ? 'active' : ''}" data-tab="mine">
          Mis tareas ${countBadge(myTasks)}
        </button>
        <button class="tab-btn ${this.currentTab === 'all' ? 'active' : ''}" data-tab="all">
          Todas las tareas ${countBadge(allTasks)}
        </button>
      </div>

      <div class="filter-bar">
        <input class="filter-input" id="task-search" placeholder="Buscar tarea..." value="${this.searchQuery}">
        <button class="filter-chip ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">Todas</button>
        <button class="filter-chip ${this.currentFilter === 'in_progress' ? 'active' : ''}" data-filter="in_progress">En progreso</button>
        <button class="filter-chip ${this.currentFilter === 'blocked' ? 'active' : ''}" data-filter="blocked" style="${this.currentFilter === 'blocked' ? 'background:var(--red-bg);color:var(--red-text);border-color:#FFCDD3' : 'color:var(--red);border-color:#FFCDD3'}">Bloqueadas</button>
        <button class="filter-chip ${this.currentFilter === 'review' ? 'active' : ''}" data-filter="review">En revisión</button>
        <button class="filter-chip ${this.currentFilter === 'pending' ? 'active' : ''}" data-filter="pending">Pendientes</button>
        <button class="filter-chip ${this.currentFilter === 'done' ? 'active' : ''}" data-filter="done">Finalizadas</button>
      </div>

      <div id="tasks-table-container"></div>`;

    this.renderTable();
    this.attachEvents();
  },

  getFilteredTasks() {
    const me = Store.getCurrentUser();
    let tasks = this.currentTab === 'mine'
      ? Store.getTasks({ assignedTo: me.id })
      : Store.getTasks();

    if (this.currentFilter !== 'all') {
      tasks = tasks.filter(t => t.status === this.currentFilter);
    }
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }
    return tasks;
  },

  renderTable() {
    const tasks = this.getFilteredTasks();
    const container = document.getElementById('tasks-table-container');
    if (!container) return;

    if (tasks.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">📋</div>
            <h3>Sin tareas</h3>
            <p>No hay tareas con los filtros seleccionados.</p>
            <button class="btn btn-primary btn-sm" data-action="new-task">Crear tarea</button>
          </div>
        </div>`;
      return;
    }

    // Group by status for "mine" tab
    const grouped = this.currentTab === 'mine' && this.currentFilter === 'all';

    if (grouped) {
      const statuses = ['blocked', 'in_progress', 'review', 'pending', 'done'];
      container.innerHTML = statuses.map(status => {
        const group = tasks.filter(t => t.status === status);
        if (!group.length) return '';
        return `
          <div style="margin-bottom:20px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              <div style="width:7px;height:7px;border-radius:50%;background:${Utils.statusColor(status)}"></div>
              <span style="font-size:13px;font-weight:600;color:var(--text-2)">${Utils.statusLabel(status)}</span>
              <span style="font-size:12px;color:var(--text-4)">${group.length}</span>
            </div>
            ${this.renderTaskRows(group)}
          </div>`;
      }).join('');
    } else {
      container.innerHTML = this.renderTaskRows(tasks);
    }
  },

  renderTaskRows(tasks) {
    return `
      <div class="card" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:36%">Tarea</th>
              <th>Sistema</th>
              <th>Estado</th>
              <th>Prioridad</th>
              ${this.currentTab === 'all' ? '<th>Asignado</th>' : ''}
              <th>Progreso</th>
              <th>Deadline</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => {
              const project  = Store.getSystemById(t.systemId);
              const assignee = t.assignedTo ? Store.getUserById(t.assignedTo) : null;
              const overdue  = Utils.isOverdue(t.dueDate);
              const dueSoon  = Utils.isDueSoon(t.dueDate);
              return `
              <tr data-open-task="${t.id}" style="${t.status === 'blocked' ? 'background:#FFF9F9' : ''}">
                <td>
                  <div style="display:flex;align-items:flex-start;gap:8px">
                    <div style="margin-top:3px;width:7px;height:7px;border-radius:50%;background:${Utils.statusColor(t.status)};flex-shrink:0"></div>
                    <div>
                      <div style="font-weight:500;font-size:13.5px;line-height:1.3;max-width:280px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
                      ${t.tags?.length ? `<div style="margin-top:3px">${t.tags.slice(0,2).map(tag => `<span class="badge badge-pending" style="font-size:10px;padding:1px 6px">${tag}</span>`).join(' ')}</div>` : ''}
                    </div>
                  </div>
                </td>
                <td>
                  ${project ? `<div style="display:flex;align-items:center;gap:5px"><div style="width:6px;height:6px;border-radius:50%;background:${project.color}"></div><span style="font-size:12.5px;color:var(--text-2);white-space:nowrap">${project.name}</span></div>` : '—'}
                </td>
                <td>${Utils.statusBadge(t.status)}</td>
                <td>${Utils.priorityBadge(t.priority)}</td>
                ${this.currentTab === 'all' ? `<td>${assignee ? `<div style="display:flex;align-items:center;gap:5px">${Utils.avatarHtml(assignee,'sm')}<span style="font-size:12.5px">${assignee.name.split(' ')[0]}</span></div>` : '<span style="color:var(--text-4)">—</span>'}</td>` : ''}
                <td style="min-width:110px">
                  <div style="display:flex;align-items:center;gap:7px">
                    <div style="flex:1">${Utils.progressBar(t.progress, Utils.progressColor(t.progress))}</div>
                    <span style="font-size:11px;color:var(--text-3);white-space:nowrap">${t.progress}%</span>
                  </div>
                </td>
                <td style="white-space:nowrap">
                  ${t.dueDate ? `<span style="font-size:12.5px;color:${overdue?'var(--red)':dueSoon?'var(--orange)':'var(--text-2)'};font-weight:${overdue?'600':'400'}">${Utils.formatDateShort(t.dueDate)}${overdue?' ⚠':''}</span>` : '<span style="color:var(--text-4)">—</span>'}
                </td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  attachEvents() {
    const content = document.getElementById('view-content');

    Utils.on(content, 'click', '[data-open-task]', function() {
      Panel.openTask(this.dataset.openTask);
    });

    Utils.on(content, 'click', '[data-tab]', (e) => {
      const btn = e.target.closest('[data-tab]');
      if (!btn) return;
      this.currentTab = btn.dataset.tab;
      this.render();
    });

    Utils.on(content, 'click', '[data-filter]', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (!btn) return;
      this.currentFilter = btn.dataset.filter;
      // Bloqueadas es global: cambia a la tab "Todas las tareas" asi se ven las de todo el equipo
      if (this.currentFilter === 'blocked') this.currentTab = 'all';
      this.render();
    });

    const searchInput = document.getElementById('task-search');
    if (searchInput) {
      let timeout;
      searchInput.oninput = (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.searchQuery = e.target.value;
          this.renderTable();
        }, 250);
      };
    }

    Utils.on(content, 'click', '[data-action="new-task"]', () => Modal.openTask());
    Utils.on(document.getElementById('topbar'), 'click', '[data-action="new-task"]', () => Modal.openTask());
  },
};
