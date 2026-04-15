// ═══════════════════════════════════════════════════════
//  VIEWS/CALENDAR.JS — Gantt chart
// ═══════════════════════════════════════════════════════

const CalendarView = {
  zoom: 24,        // px per day
  offsetDays: -14, // days before today to start
  rangeWeeks: 12,  // total weeks to show
  filterSystem: 'all',

  render() {
    Topbar.render({
      title: 'Gantt',
      actions: [{ label: 'Nueva tarea', icon: 'plus', primary: true, action: 'new-task' }],
    });

    const systems = Store.getSystems();

    document.getElementById('view-content').innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:10px">
        <div style="display:flex;gap:8px;align-items:center">
          <button class="btn btn-secondary btn-sm" id="gantt-today">Hoy</button>
          <div style="display:flex;gap:4px">
            <button class="btn btn-secondary btn-sm" id="gantt-zoom-out">−</button>
            <button class="btn btn-secondary btn-sm" id="gantt-zoom-in">+</button>
          </div>
          <span style="font-size:12px;color:var(--text-3)">${this.zoom}px/dia</span>
        </div>
        <select class="form-select" id="gantt-system" style="width:auto;border-radius:var(--r-full);padding:5px 28px 5px 12px;font-size:12.5px">
          <option value="all">Todos los sistemas</option>
          ${systems.map(s => `<option value="${s.id}" ${this.filterSystem === s.id ? 'selected' : ''}>${s.name}</option>`).join('')}
        </select>
      </div>
      <div id="gantt-wrapper" style="border:1px solid var(--border-1);border-radius:var(--r-lg);background:var(--bg-card);overflow:hidden"></div>`;

    this.renderGantt();
    this.attachEvents();
  },

  renderGantt() {
    const wrapper = document.getElementById('gantt-wrapper');
    if (!wrapper) return;

    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const startDay = new Date(today); startDay.setDate(today.getDate() + this.offsetDays);
    const totalDays = this.rangeWeeks * 7;
    const endDay   = new Date(startDay); endDay.setDate(startDay.getDate() + totalDays - 1);
    const W        = this.zoom;
    const LEFT_W   = 220;
    const ROW_H    = 38;
    const HEAD_H   = 52;

    // Today's x position
    const todayX = Math.round((today - startDay) / 86400000) * W;

    // Prepare tasks
    let allTasks = Store.getTasks();
    if (this.filterSystem !== 'all') allTasks = allTasks.filter(t => t.systemId === this.filterSystem);
    allTasks = allTasks.filter(t => t.startDate || t.dueDate);

    // Group by system
    const systems = Store.getSystems();
    const grouped = systems.map(s => ({
      system: s,
      tasks: allTasks.filter(t => t.systemId === s.id),
    })).filter(g => g.tasks.length > 0);

    if (grouped.length === 0) {
      wrapper.innerHTML = `<div style="padding:48px;text-align:center;color:var(--text-3);font-size:13px">No hay tareas con fechas para mostrar.</div>`;
      return;
    }

    // Build month/week header
    let monthCells = '';
    let dayCells   = '';
    const months   = {};
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startDay); d.setDate(startDay.getDate() + i);
      const mKey = d.getFullYear() + '-' + d.getMonth();
      if (!months[mKey]) months[mKey] = { label: d.toLocaleDateString('es-AR', { month: 'short', year: 'numeric' }), start: i, count: 0 };
      months[mKey].count++;
      const isToday  = d.toDateString() === today.toDateString();
      const isMon    = d.getDay() === 1;
      const isWkend  = d.getDay() === 0 || d.getDay() === 6;
      dayCells += `<div style="width:${W}px;flex-shrink:0;text-align:center;font-size:${W >= 20 ? 10 : 0}px;color:${isToday ? 'var(--accent)' : isWkend ? 'var(--text-4)' : 'var(--text-3)'};border-left:1px solid ${isMon ? 'var(--border-2)' : 'var(--border-1)'};padding-top:4px;background:${isToday ? 'var(--accent-bg)' : isWkend ? '#FAFAFA' : 'transparent'};height:${HEAD_H / 2}px;display:flex;align-items:center;justify-content:center;font-weight:${isToday ? '700' : '400'}">
        ${W >= 20 ? d.getDate() : ''}
      </div>`;
    }
    Object.values(months).forEach(m => {
      monthCells += `<div style="width:${m.count * W}px;flex-shrink:0;padding:0 8px;font-size:11.5px;font-weight:600;color:var(--text-2);border-right:1px solid var(--border-1);display:flex;align-items:center;height:${HEAD_H / 2}px;text-transform:capitalize">${m.label}</div>`;
    });

    // Build rows
    let leftRows  = '';
    let rightRows = '';

    grouped.forEach(({ system, tasks }) => {
      // System header row
      leftRows  += `<div style="height:${ROW_H}px;display:flex;align-items:center;gap:8px;padding:0 12px;background:var(--bg-app);border-bottom:1px solid var(--border-1)">
        <div style="width:8px;height:8px;border-radius:50%;background:${system.color};flex-shrink:0"></div>
        <span style="font-size:12px;font-weight:600;color:var(--text-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${system.name}</span>
      </div>`;
      rightRows += `<div style="height:${ROW_H}px;background:var(--bg-app);border-bottom:1px solid var(--border-1);position:relative">
        ${todayX >= 0 && todayX < totalDays * W ? `<div style="position:absolute;top:0;bottom:0;left:${todayX}px;width:1px;background:var(--red);opacity:0.3;pointer-events:none"></div>` : ''}
      </div>`;

      tasks.forEach(task => {
        const start  = task.startDate ? new Date(task.startDate + 'T12:00:00') : null;
        const end    = task.dueDate   ? new Date(task.dueDate   + 'T12:00:00') : start;
        const effStart = start || end;
        const effEnd   = end || start;

        const x1 = Math.round((effStart - startDay) / 86400000) * W;
        const x2 = Math.round((effEnd   - startDay) / 86400000 + 1) * W;
        const barW = Math.max(x2 - x1, W);
        const barColor = task.status === 'blocked' ? 'var(--red)' : task.status === 'done' ? 'var(--green)' : system.color;
        const assignee = task.assignedTo ? Store.getUserById(task.assignedTo) : null;

        const labelVisible = barW >= 60;
        const isOverdue    = Utils.isOverdue(task.dueDate);

        leftRows += `
          <div style="height:${ROW_H}px;display:flex;align-items:center;gap:8px;padding:0 12px 0 24px;border-bottom:1px solid var(--border-1);cursor:pointer" data-open-task="${task.id}">
            <div style="width:6px;height:6px;border-radius:50%;background:${barColor};flex-shrink:0"></div>
            <span style="font-size:12px;color:var(--text-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">${task.title}</span>
            ${assignee ? Utils.avatarHtml(assignee, 'sm') : ''}
          </div>`;

        rightRows += `
          <div style="height:${ROW_H}px;border-bottom:1px solid var(--border-1);position:relative">
            ${todayX >= 0 && todayX < totalDays * W ? `<div style="position:absolute;top:0;bottom:0;left:${todayX}px;width:1px;background:var(--red);opacity:0.15;pointer-events:none"></div>` : ''}
            ${x1 < totalDays * W && x2 > 0 ? `
            <div class="gantt-bar"
              data-open-task="${task.id}"
              style="
                position:absolute;
                left:${Math.max(x1, 0)}px;
                width:${Math.min(barW, totalDays * W - Math.max(x1, 0))}px;
                top:8px;height:22px;
                background:${barColor};
                border-radius:5px;
                opacity:${task.status === 'done' ? 0.6 : 1};
                cursor:pointer;
                display:flex;align-items:center;padding:0 8px;
                overflow:hidden;
                transition:filter 0.15s;
                border:${isOverdue ? '2px solid var(--red)' : 'none'};
              ">
              ${labelVisible ? `<span style="font-size:10.5px;color:white;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${task.title}</span>` : ''}
            </div>` : ''}
          </div>`;
      });
    });

    // Today line in header area
    const todayHeaderLine = todayX >= 0 && todayX < totalDays * W
      ? `<div style="position:absolute;top:0;left:${LEFT_W + todayX}px;width:2px;height:${HEAD_H}px;background:var(--red);opacity:0.4;pointer-events:none;z-index:2"></div>`
      : '';

    wrapper.innerHTML = `
      <div style="position:relative">
        <!-- Header -->
        <div style="display:flex;border-bottom:2px solid var(--border-2);position:sticky;top:0;z-index:5;background:var(--bg-card)">
          ${todayHeaderLine}
          <div style="width:${LEFT_W}px;min-width:${LEFT_W}px;border-right:2px solid var(--border-2);height:${HEAD_H}px;display:flex;align-items:flex-end;padding:0 12px 8px;background:var(--bg-card);z-index:6">
            <span style="font-size:11.5px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:0.05em">Tarea</span>
          </div>
          <div id="gantt-header-scroll" style="flex:1;overflow:hidden">
            <div style="display:flex;flex-direction:column;width:${totalDays * W}px">
              <div style="display:flex;height:${HEAD_H / 2}px">${monthCells}</div>
              <div style="display:flex;height:${HEAD_H / 2}px">${dayCells}</div>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div id="gantt-body" style="display:flex;max-height:calc(100vh - 220px);overflow-y:auto">
          <!-- Left panel: names -->
          <div style="width:${LEFT_W}px;min-width:${LEFT_W}px;border-right:2px solid var(--border-2);flex-shrink:0;overflow:hidden">
            ${leftRows}
          </div>
          <!-- Right panel: bars -->
          <div id="gantt-right" style="flex:1;overflow-x:auto">
            <div style="width:${totalDays * W}px;position:relative">
              ${rightRows}
            </div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div style="padding:10px 16px;border-top:1px solid var(--border-1);display:flex;gap:16px;flex-wrap:wrap">
        ${[['En progreso','var(--accent)'],['Finalizada','var(--green)'],['Bloqueado','var(--red)'],['Pendiente','var(--text-4)']].map(([l,c]) => `<div style="display:flex;align-items:center;gap:6px"><div style="width:12px;height:8px;border-radius:3px;background:${c}"></div><span style="font-size:11.5px;color:var(--text-3)">${l}</span></div>`).join('')}
        <div style="display:flex;align-items:center;gap:6px"><div style="width:2px;height:12px;background:var(--red)"></div><span style="font-size:11.5px;color:var(--text-3)">Hoy</span></div>
      </div>`;

    // Sync horizontal scroll between header and body
    const bodyRight = document.getElementById('gantt-right');
    const headRight = document.getElementById('gantt-header-scroll');
    if (bodyRight && headRight) {
      bodyRight.onscroll = () => { headRight.scrollLeft = bodyRight.scrollLeft; };
      // Scroll to today
      setTimeout(() => {
        const scrollTo = Math.max(todayX - 100, 0);
        bodyRight.scrollLeft = scrollTo;
        headRight.scrollLeft = scrollTo;
      }, 50);
    }

    // Attach task click events
    wrapper.querySelectorAll('.gantt-bar,[data-open-task]').forEach(el => {
      el.addEventListener('click', () => Panel.openTask(el.dataset.openTask));
    });
  },

  attachEvents() {
    document.getElementById('gantt-today')?.addEventListener('click', () => {
      this.offsetDays = -14; this.renderGantt();
    });
    document.getElementById('gantt-zoom-in')?.addEventListener('click', () => {
      this.zoom = Math.min(this.zoom + 4, 40); this.renderGantt();
    });
    document.getElementById('gantt-zoom-out')?.addEventListener('click', () => {
      this.zoom = Math.max(this.zoom - 4, 8); this.renderGantt();
    });
    document.getElementById('gantt-system')?.addEventListener('change', (e) => {
      this.filterSystem = e.target.value; this.renderGantt();
    });
    Utils.on(document.getElementById('topbar'), 'click', '[data-action="new-task"]', () => Modal.openTask());
  },
};
