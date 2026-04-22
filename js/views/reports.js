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
      </div>

      ${this.renderLeadsSection()}
      `;

    document.getElementById('edit-budgets-btn')?.addEventListener('click', () => Modal.openBudgets());
  },

  renderLeadsSection() {
    const kpis = Store.getLeadKPIs();
    const funnel = Store.getLeadFunnel();
    const leads = Store.getLeads();
    if (leads.length === 0) return '';

    const users = Store.getUsers();
    const systems = Store.getSystems();

    // Leads por source
    const sourceGroups = {};
    leads.forEach(l => {
      const s = l.source || 'other';
      if (!sourceGroups[s]) sourceGroups[s] = { count: 0, value: 0 };
      sourceGroups[s].count++;
      sourceGroups[s].value += Number(l.estimated_value || 0);
    });
    const sourceLabels = { web:'Web', referral:'Referido', event:'Evento', cold:'Cold outreach', social:'Redes sociales', other:'Otro' };

    // Por responsable
    const ownerStats = users.map(u => {
      const owned = leads.filter(l => l.owner_id === u.id);
      const won = owned.filter(l => l.status === 'won');
      const open = owned.filter(l => !['won','lost'].includes(l.status));
      return {
        ...u,
        total: owned.length,
        pipeline: open.reduce((s, l) => s + Number(l.estimated_value || 0), 0),
        wonValue: won.reduce((s, l) => s + Number(l.estimated_value || 0), 0),
        wonCount: won.length,
      };
    }).filter(u => u.total > 0);

    // Por sistema
    const sysStats = systems.map(s => {
      const sysLeads = leads.filter(l => l.system_id === s.id);
      return { ...s, count: sysLeads.length, value: sysLeads.reduce((sum, l) => sum + Number(l.estimated_value || 0), 0) };
    }).filter(s => s.count > 0);

    // Lost reasons
    const lostLeads = leads.filter(l => l.status === 'lost' && l.lost_reason);
    const reasonGroups = {};
    lostLeads.forEach(l => {
      const r = (l.lost_reason || '').split(' — ')[0] || 'Otro';
      reasonGroups[r] = (reasonGroups[r] || 0) + 1;
    });

    const maxSourceCount = Math.max(...Object.values(sourceGroups).map(g => g.count), 1);
    const maxFunnel = Math.max(...funnel.map(f => f.count), 1);

    return `
      <!-- ═════════ Ventas / Leads ═════════ -->
      <div class="card" style="margin-top:16px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
          <span class="section-title">Ventas / Leads</span>
          <span class="badge badge-medium">Pipeline ${new Date().getFullYear()}</span>
          <a class="section-link" data-route="/leads" style="margin-left:auto" onclick="Router.navigate('/leads');return false" href="#/leads">Ir a leads →</a>
        </div>

        <!-- KPIs -->
        <div class="kpi-grid" style="margin-bottom:24px;grid-template-columns:repeat(5,1fr)">
          <div class="kpi-card">
            <div class="kpi-label">Pipeline total</div>
            <div class="kpi-value" style="font-size:20px">${Utils.formatCurrency(kpis.pipelineTotal)}</div>
            <div class="kpi-sub">${kpis.openCount} leads abiertos</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Pipeline ponderado</div>
            <div class="kpi-value" style="font-size:20px;color:var(--accent)">${Utils.formatCurrency(Math.round(kpis.weighted))}</div>
            <div class="kpi-sub">valor × probabilidad</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ganados este mes</div>
            <div class="kpi-value" style="font-size:20px;color:var(--green)">${Utils.formatCurrency(kpis.wonThisMonth)}</div>
            <div class="kpi-sub up">${kpis.wonThisMonthCount} deals</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Conversion</div>
            <div class="kpi-value" style="font-size:20px">${kpis.conversionRate}<span style="font-size:13px;font-weight:400">%</span></div>
            <div class="kpi-sub">${kpis.wonCount} gan. / ${kpis.lostCount} perd.</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Cierre promedio</div>
            <div class="kpi-value" style="font-size:20px">${kpis.avgCloseDays}<span style="font-size:13px;font-weight:400">d</span></div>
            <div class="kpi-sub">dias por deal</div>
          </div>
        </div>

        <!-- Funnel -->
        <div style="margin-bottom:24px">
          <div class="section-header"><span class="section-title" style="font-size:13px">Funnel de ventas</span></div>
          <div class="chart-bar-container">
            ${funnel.map(f => {
              const stage = LeadsView.STAGES.find(s => s.id === f.status);
              return `
              <div class="chart-bar-row">
                <div class="chart-bar-label" style="display:flex;align-items:center;gap:6px;width:140px">
                  <div style="width:7px;height:7px;border-radius:50%;background:${stage?.color||'var(--text-3)'}"></div>
                  ${f.label}
                </div>
                <div class="chart-bar-track">
                  <div class="chart-bar-fill" style="width:${Math.round(f.count / maxFunnel * 100)}%;background:${stage?.color||'var(--accent)'}"></div>
                </div>
                <span class="chart-bar-value" style="width:90px">${f.count} · ${Utils.formatCurrency(f.value)}</span>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Responsables + Sources -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
          <div>
            <div class="section-header"><span class="section-title" style="font-size:13px">Pipeline por responsable</span></div>
            <div class="chart-bar-container">
              ${ownerStats.length === 0 ? '<p style="font-size:12.5px;color:var(--text-4)">Sin datos</p>' :
                ownerStats.sort((a,b) => b.pipeline - a.pipeline).map(u => {
                  const maxPipe = Math.max(...ownerStats.map(x => x.pipeline), 1);
                  return `
                  <div class="chart-bar-row">
                    <div class="chart-bar-label" style="display:flex;align-items:center;gap:6px">
                      ${Utils.avatarHtml(u,'sm')} ${u.name.split(' ')[0]}
                    </div>
                    <div class="chart-bar-track">
                      <div class="chart-bar-fill" style="width:${Math.round(u.pipeline / maxPipe * 100)}%;background:${u.color}"></div>
                    </div>
                    <span class="chart-bar-value" style="width:90px">${Utils.formatCurrency(u.pipeline)}</span>
                  </div>`;
                }).join('')}
            </div>
          </div>
          <div>
            <div class="section-header"><span class="section-title" style="font-size:13px">Leads por origen</span></div>
            <div class="chart-bar-container">
              ${Object.entries(sourceGroups).sort((a,b) => b[1].count - a[1].count).map(([src, g]) => `
                <div class="chart-bar-row">
                  <div class="chart-bar-label">${sourceLabels[src]||src}</div>
                  <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width:${Math.round(g.count / maxSourceCount * 100)}%;background:var(--accent)"></div>
                  </div>
                  <span class="chart-bar-value">${g.count}</span>
                </div>`).join('')}
            </div>
          </div>
        </div>

        <!-- Sistema + razones perdida -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          <div>
            <div class="section-header"><span class="section-title" style="font-size:13px">Interes por sistema</span></div>
            ${sysStats.length === 0 ? '<p style="font-size:12.5px;color:var(--text-4)">Sin datos</p>' : `
            <div class="chart-bar-container">
              ${sysStats.sort((a,b) => b.count - a.count).map(s => {
                const maxSys = Math.max(...sysStats.map(x => x.count), 1);
                return `
                <div class="chart-bar-row">
                  <div class="chart-bar-label" style="display:flex;align-items:center;gap:6px">
                    <div style="width:7px;height:7px;border-radius:50%;background:${s.color}"></div>
                    ${s.name}
                  </div>
                  <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width:${Math.round(s.count / maxSys * 100)}%;background:${s.color}"></div>
                  </div>
                  <span class="chart-bar-value" style="width:90px">${s.count} · ${Utils.formatCurrency(s.value)}</span>
                </div>`;
              }).join('')}
            </div>`}
          </div>
          <div>
            <div class="section-header"><span class="section-title" style="font-size:13px">Razones de leads perdidos</span></div>
            ${Object.keys(reasonGroups).length === 0 ? '<p style="font-size:12.5px;color:var(--text-4)">Aun no hay leads perdidos</p>' : `
            <div class="chart-bar-container">
              ${Object.entries(reasonGroups).sort((a,b) => b[1] - a[1]).map(([reason, count]) => {
                const maxR = Math.max(...Object.values(reasonGroups), 1);
                return `
                <div class="chart-bar-row">
                  <div class="chart-bar-label">${reason}</div>
                  <div class="chart-bar-track">
                    <div class="chart-bar-fill" style="width:${Math.round(count / maxR * 100)}%;background:var(--red)"></div>
                  </div>
                  <span class="chart-bar-value">${count}</span>
                </div>`;
              }).join('')}
            </div>`}
          </div>
        </div>
      </div>`;
  },
};
