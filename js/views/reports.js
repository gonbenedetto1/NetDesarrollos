// ═══════════════════════════════════════════════════════
//  VIEWS/REPORTS.JS — sin progreso de sistema, con marketing
// ═══════════════════════════════════════════════════════

const ReportsView = {
  render() {
    Topbar.render({ title: 'Reportes' });

    const systems   = Store.getSystems();
    const tasks     = Store.getTasks();
    const workload  = Store.getUserWorkload();
    const blocks    = Store.getBlocks();
    const marketing = Store.getMarketingBudgets();

    const totalTasks    = tasks.length;
    const doneTasks     = tasks.filter(t => t.status === 'done').length;
    const blockedTasks  = tasks.filter(t => t.status === 'blocked').length;
    const completionPct = totalTasks > 0 ? Math.round(doneTasks / totalTasks * 100) : 0;
    const totalHrsEst   = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
    const totalHrsReal  = tasks.reduce((s, t) => s + (t.actualHours || 0), 0);
    const resolvedBlocks = blocks.filter(b => b.status === 'resolved').length;

    // Per-user stats
    const users = Store.getUsers();
    const userStats = users.map(u => {
      const mine = tasks.filter(t => t.assignedTo === u.id);
      return { ...u, total: mine.length, done: mine.filter(t => t.status === 'done').length, blocked: mine.filter(t => t.status === 'blocked').length, avgProg: mine.length > 0 ? Math.round(mine.reduce((s,t) => s + t.progress, 0) / mine.length) : 0 };
    }).filter(u => u.total > 0);

    // Marketing totals
    const mktTotal = marketing.reduce((s, m) => s + m.budget, 0);
    const mktSpent = marketing.reduce((s, m) => s + m.spent, 0);
    const mktPct   = mktTotal > 0 ? Math.round(mktSpent / mktTotal * 100) : 0;

    document.getElementById('view-content').innerHTML = `
      <!-- KPIs -->
      <div class="kpi-grid" style="margin-bottom:24px">
        <div class="kpi-card">
          <div class="kpi-label">Tasa de completado</div>
          <div class="kpi-value">${completionPct}<span style="font-size:16px;font-weight:400">%</span></div>
          <div class="kpi-sub">${doneTasks} de ${totalTasks} tareas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Horas estimadas</div>
          <div class="kpi-value">${totalHrsEst}<span style="font-size:14px;font-weight:400">h</span></div>
          <div class="kpi-sub">${totalHrsReal}h registradas</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Presupuesto marketing</div>
          <div class="kpi-value" style="font-size:20px">${Utils.formatCurrency(mktSpent)}</div>
          <div class="kpi-sub ${mktPct > 90 ? 'down' : ''}">${mktPct}% de ${Utils.formatCurrency(mktTotal)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Bloqueos resueltos</div>
          <div class="kpi-value" style="color:var(--green)">${resolvedBlocks}</div>
          <div class="kpi-sub">${blocks.filter(b => b.status === 'active').length} activos ahora</div>
        </div>
      </div>

      <div class="report-grid">

        <!-- Estado de tareas por sistema -->
        <div class="card">
          <div class="section-header" style="margin-bottom:20px">
            <span class="section-title">Estado de tareas por sistema</span>
          </div>
          ${systems.map(s => {
            const counts = Store.getSystemTaskCounts(s.id);
            const total  = counts.total || 1;
            const bars = [
              { label:'Finalizada',  val:counts.done,    color:'var(--green)'  },
              { label:'En progreso', val:counts.active,  color:'var(--accent)' },
              { label:'Revisión',    val:counts.review,  color:'var(--purple)' },
              { label:'Bloqueado',   val:counts.blocked, color:'var(--red)'    },
              { label:'Pendiente',   val:counts.pending, color:'var(--gray)'   },
            ].filter(b => b.val > 0);
            return `
            <div style="margin-bottom:16px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <div style="display:flex;align-items:center;gap:7px">
                  <div style="width:8px;height:8px;border-radius:50%;background:${s.color}"></div>
                  <span style="font-size:13px;font-weight:500;color:var(--text-1)">${s.name}</span>
                </div>
                <span style="font-size:12px;color:var(--text-3)">${counts.total} tareas</span>
              </div>
              <div style="display:flex;height:14px;border-radius:7px;overflow:hidden;gap:1px">
                ${bars.map(b => `<div style="flex:${b.val};background:${b.color};min-width:3px" title="${b.label}: ${b.val}"></div>`).join('')}
              </div>
              <div style="display:flex;gap:10px;margin-top:5px;flex-wrap:wrap">
                ${bars.map(b => `<span style="font-size:10.5px;color:var(--text-3);display:flex;align-items:center;gap:3px"><span style="width:6px;height:6px;border-radius:50%;background:${b.color};display:inline-block"></span>${b.label}: ${b.val}</span>`).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>

        <!-- Tareas por miembro -->
        <div class="card">
          <div class="section-header" style="margin-bottom:20px">
            <span class="section-title">Tareas por miembro</span>
          </div>
          <div class="chart-bar-container">
            ${userStats.map(u => {
              const maxTotal = Math.max(...userStats.map(x => x.total), 1);
              return `
              <div class="chart-bar-row">
                <div class="chart-bar-label" style="display:flex;align-items:center;gap:6px">
                  ${Utils.avatarHtml(u, 'sm')} ${u.name.split(' ')[0]}
                </div>
                <div class="chart-bar-track">
                  <div class="chart-bar-fill" style="width:${Math.round(u.total / maxTotal * 100)}%;background:${u.color}"></div>
                </div>
                <span class="chart-bar-value">${u.total}</span>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Carga y rendimiento del equipo -->
        <div class="card">
          <div class="section-header" style="margin-bottom:16px">
            <span class="section-title">Carga y rendimiento del equipo</span>
          </div>
          <table class="data-table">
            <thead>
              <tr><th>Miembro</th><th>Total</th><th>Hechas</th><th>Progreso prom.</th><th>Carga</th></tr>
            </thead>
            <tbody>
              ${userStats.map(u => {
                const wl = workload.find(w => w.id === u.id) || { load: 0 };
                const loadColor = wl.load > 80 ? 'var(--red)' : wl.load > 60 ? 'var(--orange)' : 'var(--green)';
                return `
                <tr>
                  <td><div style="display:flex;align-items:center;gap:8px">${Utils.avatarHtml(u,'sm')}<span style="font-weight:500">${u.name.split(' ')[0]}</span></div></td>
                  <td style="font-weight:600">${u.total}</td>
                  <td style="color:var(--green);font-weight:500">${u.done}</td>
                  <td>
                    <div style="display:flex;align-items:center;gap:7px">
                      <div style="width:60px">${Utils.progressBar(u.avgProg, 'blue')}</div>
                      <span style="font-size:12px;color:var(--text-3)">${u.avgProg}%</span>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:7px">
                      <div style="width:50px">${Utils.progressBar(wl.load, wl.load > 80 ? 'red' : 'green')}</div>
                      <span style="font-size:12px;color:${loadColor};font-weight:500">${wl.load}%</span>
                    </div>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Bloqueos por sistema -->
        <div class="card">
          <div class="section-header" style="margin-bottom:20px">
            <span class="section-title">Bloqueos por sistema</span>
          </div>
          <div class="chart-bar-container">
            ${systems.map(s => {
              const sysBlocks   = blocks.filter(b => { const t = Store.getTaskById(b.taskId); return t?.systemId === s.id; });
              const activeB     = sysBlocks.filter(b => b.status === 'active').length;
              const resolvedB   = sysBlocks.filter(b => b.status === 'resolved').length;
              const maxB        = Math.max(...systems.map(x => blocks.filter(b => { const t2 = Store.getTaskById(b.taskId); return t2?.systemId === x.id; }).length), 1);
              return `
              <div class="chart-bar-row">
                <div class="chart-bar-label" style="display:flex;align-items:center;gap:6px">
                  <div style="width:7px;height:7px;border-radius:50%;background:${s.color}"></div>
                  ${s.name.split(' ')[0]}
                </div>
                <div class="chart-bar-track" style="position:relative">
                  <div class="chart-bar-fill" style="width:${Math.round(resolvedB/maxB*100)}%;background:var(--green)"></div>
                  ${activeB > 0 ? `<div style="position:absolute;top:0;left:${Math.round(resolvedB/maxB*100)}%;width:${Math.round(activeB/maxB*100)}%;height:100%;background:var(--red);border-radius:0 5px 5px 0"></div>` : ''}
                </div>
                <span class="chart-bar-value" style="color:${activeB>0?'var(--red)':'var(--text-3)'}">
                  ${activeB > 0 ? activeB + '⚠' : resolvedB}
                </span>
              </div>`;
            }).join('')}
          </div>
          <div style="display:flex;gap:12px;margin-top:10px">
            <span style="font-size:11px;color:var(--text-3);display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:var(--green)"></div>Resueltos</span>
            <span style="font-size:11px;color:var(--text-3);display:flex;align-items:center;gap:4px"><div style="width:8px;height:8px;border-radius:50%;background:var(--red)"></div>Activos</span>
          </div>
        </div>

      </div>

      <!-- Marketing budget section -->
      <div class="card" style="margin-top:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
          <span class="section-title">Presupuesto de Marketing</span>
          <span class="badge badge-medium">Por sistema · ${new Date().getFullYear()}</span>
          <button class="btn btn-secondary btn-xs" id="edit-budgets-btn" style="margin-left:auto">${Utils.icon('edit',13)} Editar presupuestos</button>
        </div>
        <div class="chart-bar-container">
          ${marketing.map(m => {
            const pct   = Math.min(Math.round(m.spent / m.budget * 100), 100);
            const color = pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--orange)' : 'var(--green)';
            const sys   = Store.getSystemById(m.systemId);
            return `
            <div class="chart-bar-row">
              <div class="chart-bar-label" style="width:200px;display:flex;align-items:center;gap:6px">
                ${sys ? `<div style="width:7px;height:7px;border-radius:50%;background:${sys.color}"></div>` : ''}
                ${m.name}
              </div>
              <div style="flex:1">
                <div class="chart-bar-track">
                  <div class="chart-bar-fill" style="width:${pct}%;background:${color}"></div>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:3px">
                  <span style="font-size:11px;color:var(--text-3)">${Utils.formatCurrency(m.spent)} gastado</span>
                  <span style="font-size:11px;color:var(--text-3)">de ${Utils.formatCurrency(m.budget)}</span>
                </div>
              </div>
              <span style="font-size:12.5px;font-weight:600;color:${color};width:40px;text-align:right">${pct}%</span>
            </div>`;
          }).join('')}
        </div>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--border-1);display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;color:var(--text-2)">Total marketing ${new Date().getFullYear()}</span>
          <div style="text-align:right">
            <div style="font-size:18px;font-weight:600;color:var(--text-1)">${Utils.formatCurrency(mktSpent)}</div>
            <div style="font-size:12px;color:var(--text-3)">de ${Utils.formatCurrency(mktTotal)} presupuestado</div>
          </div>
        </div>
      </div>`;

    document.getElementById('edit-budgets-btn')?.addEventListener('click', () => Modal.openBudgets());
  },
};
