// ═══════════════════════════════════════════════════════
//  VIEWS/LEADS.JS — Gestion de leads por convenio
// ═══════════════════════════════════════════════════════

const LeadsView = {
  currentView: 'kanban',   // kanban | list
  filterOwner: 'all',
  filterGroup: 'all',      // filtro por convenio
  filterSystem: 'all',
  searchQuery: '',
  lockedGroup: null,       // si se abre desde /groups/:id, filtra fijo

  STAGES: [
    { id:'new',        label:'Nuevo',                 color:'#5AC8FA' },
    { id:'contacted',  label:'Contactado',            color:'#0071E3' },
    { id:'interested', label:'Interesado / Seguimiento', color:'#FF9F0A' },
    { id:'won',        label:'Cerrado',               color:'#28C76F' },
    { id:'lost',       label:'Perdido',               color:'#FF3B30' },
  ],

  SOURCES: [
    { id:'web',       label:'Web' },
    { id:'referral',  label:'Referido' },
    { id:'event',     label:'Evento' },
    { id:'cold',      label:'Cold outreach' },
    { id:'social',    label:'Redes sociales' },
    { id:'other',     label:'Otro' },
  ],

  render(lockedGroup = null) {
    this.lockedGroup = lockedGroup;
    if (lockedGroup) this.filterGroup = lockedGroup;

    const group = lockedGroup ? Store.getLeadGroupById(lockedGroup) : null;

    Topbar.render({
      ...(group ? { breadcrumb: [{ label: 'Convenios', route: '/groups' }, { label: group.name }] } : { title: 'Leads' }),
      actions: [{ label: 'Nuevo lead', icon: 'plus', primary: true, action: 'new-lead' }],
    });

    const kpis = Store.getLeadKPIs();
    const users = Store.getUsers();
    const systems = Store.getSystems();
    const groups = Store.getLeadGroups();

    // If locked to a group, compute group-specific stats
    const leadsForKpis = lockedGroup ? Store.getLeads({ groupId: lockedGroup }) : Store.getLeads();
    const openCount = leadsForKpis.filter(l => !['won','lost'].includes(l.status)).length;
    const wonCount = leadsForKpis.filter(l => l.status === 'won').length;
    const lostCount = leadsForKpis.filter(l => l.status === 'lost').length;

    document.getElementById('view-content').innerHTML = `
      ${group ? `
      <div class="card" style="margin-bottom:16px;padding:16px 20px;border-left:4px solid ${group.color||'var(--accent)'}">
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:12px;height:12px;border-radius:50%;background:${group.color||'var(--accent)'};flex-shrink:0"></div>
          <div style="flex:1;min-width:0">
            <h2 style="font-size:17px;margin-bottom:2px">${group.name}</h2>
            ${group.description ? `<p style="font-size:13px;color:var(--text-3);line-height:1.4">${group.description}</p>` : ''}
          </div>
          <button class="btn btn-secondary btn-sm" id="edit-group-btn" data-edit-group="${group.id}">${Utils.icon('edit',13)} Editar convenio</button>
        </div>
      </div>` : ''}

      <!-- KPIs -->
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:20px">
        <div class="kpi-card">
          <div class="kpi-label">Leads abiertos</div>
          <div class="kpi-value" style="font-size:24px">${openCount}</div>
          <div class="kpi-sub">en seguimiento</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Nuevos esta semana</div>
          <div class="kpi-value" style="font-size:24px;color:var(--accent)">${lockedGroup ? leadsForKpis.filter(l => l.created_at >= new Date(Date.now() - 7*86400000).toISOString()).length : kpis.newThisWeekCount}</div>
          <div class="kpi-sub">cargados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Cerrados esta semana</div>
          <div class="kpi-value" style="font-size:24px;color:var(--green)">${lockedGroup ? leadsForKpis.filter(l => l.won_at && l.won_at >= new Date(Date.now() - 7*86400000).toISOString()).length : kpis.wonThisWeekCount}</div>
          <div class="kpi-sub up">👍 deals</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Perdidos esta semana</div>
          <div class="kpi-value" style="font-size:24px;color:var(--red)">${lockedGroup ? leadsForKpis.filter(l => l.lost_at && l.lost_at >= new Date(Date.now() - 7*86400000).toISOString()).length : kpis.lostThisWeekCount}</div>
          <div class="kpi-sub">descartados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Acciones esta semana</div>
          <div class="kpi-value" style="font-size:24px">${kpis.actionsThisWeekCount}</div>
          <div class="kpi-sub">registradas</div>
        </div>
      </div>

      <!-- View toggle -->
      <div class="tabs" style="margin-bottom:16px">
        <button class="tab-btn ${this.currentView === 'kanban' ? 'active' : ''}" data-view="kanban">Kanban</button>
        <button class="tab-btn ${this.currentView === 'list' ? 'active' : ''}" data-view="list">Lista</button>
      </div>

      <!-- Filters -->
      <div class="filter-bar">
        <input class="filter-input" id="lead-search" placeholder="Buscar lead..." value="${this.searchQuery}">
        ${!lockedGroup && groups.length > 0 ? `
        <select class="form-select" id="lead-filter-group" style="width:auto;padding:5px 28px 5px 12px;font-size:12.5px;border-radius:var(--r-full)">
          <option value="all">Todos los convenios</option>
          ${groups.map(g => `<option value="${g.id}" ${this.filterGroup===g.id?'selected':''}>${g.name}</option>`).join('')}
        </select>` : ''}
        <select class="form-select" id="lead-filter-owner" style="width:auto;padding:5px 28px 5px 12px;font-size:12.5px;border-radius:var(--r-full)">
          <option value="all">Todos los responsables</option>
          ${users.map(u => `<option value="${u.id}" ${this.filterOwner===u.id?'selected':''}>${u.name}</option>`).join('')}
        </select>
        <select class="form-select" id="lead-filter-system" style="width:auto;padding:5px 28px 5px 12px;font-size:12.5px;border-radius:var(--r-full)">
          <option value="all">Todos los sistemas</option>
          ${systems.map(s => `<option value="${s.id}" ${this.filterSystem===s.id?'selected':''}>${s.name}</option>`).join('')}
        </select>
      </div>

      <div id="leads-content"></div>`;

    this.renderContent();
    this.attachEvents();
  },

  getFilteredLeads() {
    const filter = {};
    if (this.filterGroup !== 'all')  filter.groupId  = this.filterGroup;
    if (this.filterOwner !== 'all')  filter.ownerId  = this.filterOwner;
    if (this.filterSystem !== 'all') filter.systemId = this.filterSystem;
    if (this.searchQuery)            filter.search   = this.searchQuery;
    return Store.getLeads(filter);
  },

  renderContent() {
    const container = document.getElementById('leads-content');
    if (!container) return;

    if (this.currentView === 'kanban') {
      this.renderKanban(container);
    } else {
      this.renderList(container);
    }
  },

  renderKanban(container) {
    const leads = this.getFilteredLeads();

    container.innerHTML = `
      <div class="kanban-board">
        ${this.STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.id);
          return `
          <div class="kanban-col" data-stage="${stage.id}">
            <div class="kanban-col-header">
              <span class="kanban-col-name">
                <div style="width:7px;height:7px;border-radius:50%;background:${stage.color}"></div>
                ${stage.label}
              </span>
              <span class="kanban-col-count">${stageLeads.length}</span>
            </div>
            <div class="kanban-cards">
              ${stageLeads.map(l => this.renderLeadCard(l)).join('')}
            </div>
            <button class="kanban-add-btn" data-add-lead-stage="${stage.id}">${Utils.icon('plus', 12)} Agregar lead</button>
          </div>`;
        }).join('')}
      </div>`;
  },

  renderLeadCard(lead) {
    const owner = lead.owner_id ? Store.getUserById(lead.owner_id) : null;
    const system = lead.system_id ? Store.getSystemById(lead.system_id) : null;
    const group = lead.group_id ? Store.getLeadGroupById(lead.group_id) : null;
    const updates = Store.getLeadUpdates(lead.id);
    const lastUpdate = updates[0];
    const overdue = lead.next_action_date && lead.next_action_date < new Date().toISOString().split('T')[0] && !['won','lost'].includes(lead.status);

    return `
      <div class="kanban-card ${overdue ? 'blocked' : ''}" data-open-lead="${lead.id}" draggable="true" data-drag-lead="${lead.id}" data-current-stage="${lead.status}" style="${overdue ? 'border-left-color:var(--red)' : ''}">
        <div class="kanban-card-title">${lead.name}</div>
        ${lead.company ? `<div style="font-size:11.5px;color:var(--text-3);margin-bottom:6px">${lead.company}</div>` : ''}
        ${group ? `<div style="margin-bottom:6px"><span class="badge" style="background:${group.color}20;color:${group.color};font-size:10.5px;padding:2px 8px">${group.name}</span></div>` : ''}
        <div class="kanban-card-meta">
          ${system ? `<div style="display:flex;align-items:center;gap:4px"><div style="width:6px;height:6px;border-radius:50%;background:${system.color}"></div><span style="font-size:11px;color:var(--text-3)">${system.name}</span></div>` : ''}
        </div>
        ${lastUpdate ? `<div style="font-size:10.5px;color:var(--text-3);margin-top:6px;padding-top:6px;border-top:1px solid var(--border-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Ult: ${Utils.timeAgo(lastUpdate.created_at)}</div>` : ''}
        <div class="kanban-card-footer">
          ${lead.next_action_date ? `<span style="font-size:11px;color:${overdue?'var(--red)':'var(--text-3)'};font-weight:${overdue?'600':'400'}">📅 ${Utils.formatDateShort(lead.next_action_date)}${overdue?' ⚠':''}</span>` : '<span></span>'}
          ${owner ? Utils.avatarHtml(owner, 'sm') : ''}
        </div>
      </div>`;
  },

  renderList(container) {
    const leads = this.getFilteredLeads();
    if (leads.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">👥</div>
            <h3>Sin leads</h3>
            <p>Cargá el primer lead para empezar a hacer seguimiento.</p>
            <button class="btn btn-primary btn-sm" data-action="new-lead">Crear lead</button>
          </div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="card" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Empresa</th>
              <th>Convenio</th>
              <th>Etapa</th>
              <th>Sistema</th>
              <th>Responsable</th>
              <th>Ultima accion</th>
              <th>Proxima accion</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(l => {
              const owner = l.owner_id ? Store.getUserById(l.owner_id) : null;
              const system = l.system_id ? Store.getSystemById(l.system_id) : null;
              const group = l.group_id ? Store.getLeadGroupById(l.group_id) : null;
              const stage = this.STAGES.find(s => s.id === l.status);
              const updates = Store.getLeadUpdates(l.id);
              const lastUpdate = updates[0];
              const overdue = l.next_action_date && l.next_action_date < new Date().toISOString().split('T')[0] && !['won','lost'].includes(l.status);
              return `
              <tr data-open-lead="${l.id}">
                <td><div style="font-weight:500">${l.name}</div></td>
                <td><span style="font-size:12.5px;color:var(--text-2)">${l.company || '—'}</span></td>
                <td>${group ? `<span class="badge" style="background:${group.color}20;color:${group.color};font-size:11px">${group.name}</span>` : '—'}</td>
                <td>${stage ? `<span class="badge" style="background:${stage.color}20;color:${stage.color};font-weight:600">${stage.label}</span>` : '—'}</td>
                <td>${system ? `<div style="display:flex;align-items:center;gap:5px"><div style="width:6px;height:6px;border-radius:50%;background:${system.color}"></div><span style="font-size:12.5px">${system.name}</span></div>` : '—'}</td>
                <td>${owner ? `<div style="display:flex;align-items:center;gap:5px">${Utils.avatarHtml(owner,'sm')}<span style="font-size:12.5px">${owner.name.split(' ')[0]}</span></div>` : '—'}</td>
                <td><span style="font-size:12px;color:var(--text-3)">${lastUpdate ? Utils.timeAgo(lastUpdate.created_at) : '—'}</span></td>
                <td>${l.next_action_date ? `<span style="font-size:12.5px;color:${overdue?'var(--red)':'var(--text-2)'};font-weight:${overdue?'600':'400'}">${Utils.formatDateShort(l.next_action_date)}${overdue ? ' ⚠':''}</span>` : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>`;
  },

  attachEvents() {
    const content = document.getElementById('view-content');

    // View toggle
    content.querySelectorAll('[data-view]').forEach(el => {
      el.onclick = () => {
        this.currentView = el.dataset.view;
        content.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === this.currentView));
        this.renderContent();
        this.attachContentEvents();
      };
    });

    // Filters
    const searchInput = document.getElementById('lead-search');
    if (searchInput) {
      let t;
      searchInput.oninput = (e) => {
        clearTimeout(t);
        t = setTimeout(() => { this.searchQuery = e.target.value; this.renderContent(); this.attachContentEvents(); }, 250);
      };
    }
    document.getElementById('lead-filter-owner')?.addEventListener('change', (e) => { this.filterOwner = e.target.value; this.renderContent(); this.attachContentEvents(); });
    document.getElementById('lead-filter-system')?.addEventListener('change', (e) => { this.filterSystem = e.target.value; this.renderContent(); this.attachContentEvents(); });
    document.getElementById('lead-filter-group')?.addEventListener('change', (e) => { this.filterGroup = e.target.value; this.renderContent(); this.attachContentEvents(); });

    // Edit group btn (on detail view)
    document.getElementById('edit-group-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      Modal.openGroup(Store.getLeadGroupById(e.currentTarget.dataset.editGroup));
    });

    // Topbar + empty-state action
    Utils.on(document.getElementById('topbar'), 'click', '[data-action="new-lead"]', () => Modal.openLead(this.lockedGroup ? { groupId: this.lockedGroup } : {}));
    Utils.on(content, 'click', '[data-action="new-lead"]', () => Modal.openLead(this.lockedGroup ? { groupId: this.lockedGroup } : {}));

    this.attachContentEvents();

    // Re-render on store changes
    Store.on('leads:changed', () => { if (document.querySelector('#view-content [id="leads-content"]')) this.render(this.lockedGroup); });
    Store.on('lead_updates:changed', () => { if (document.querySelector('#view-content [id="leads-content"]')) this.renderContent(); });
  },

  attachContentEvents() {
    const container = document.getElementById('leads-content');
    if (!container) return;

    container.querySelectorAll('[data-open-lead]').forEach(el => {
      el.onclick = (e) => { e.stopPropagation(); Panel.openLead(el.dataset.openLead); };
    });
    container.querySelectorAll('[data-add-lead-stage]').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        const prefill = { status: el.dataset.addLeadStage };
        if (this.lockedGroup) prefill.groupId = this.lockedGroup;
        Modal.openLead(prefill);
      };
    });

    // ── Drag and drop ──
    let draggedLeadId = null;
    let draggedFromStage = null;

    container.querySelectorAll('[data-drag-lead]').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        draggedLeadId = card.dataset.dragLead;
        draggedFromStage = card.dataset.currentStage;
        card.style.opacity = '0.4';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedLeadId);
      });
      card.addEventListener('dragend', () => {
        card.style.opacity = '';
        // Remove drag-over styles from all columns
        container.querySelectorAll('.kanban-col').forEach(c => {
          c.style.background = '';
          c.style.outline = '';
        });
      });
    });

    container.querySelectorAll('.kanban-col').forEach(col => {
      col.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const stage = col.dataset.stage;
        if (stage && stage !== draggedFromStage) {
          col.style.background = 'var(--accent-bg)';
          col.style.outline = '2px dashed var(--accent)';
        }
      });
      col.addEventListener('dragleave', (e) => {
        // Only clear if leaving the column entirely
        if (!col.contains(e.relatedTarget)) {
          col.style.background = '';
          col.style.outline = '';
        }
      });
      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.style.background = '';
        col.style.outline = '';
        const targetStage = col.dataset.stage;
        if (!targetStage || !draggedLeadId || targetStage === draggedFromStage) return;

        // Stages que requieren modal (perdido o ganado con extra info)
        if (targetStage === 'lost') {
          Modal.openLostReason(draggedLeadId);
        } else if (targetStage === 'won') {
          Modal.openWonConfirm(draggedLeadId);
        } else {
          await Store.updateLead(draggedLeadId, { status: targetStage });
          Utils.toast('Lead movido a ' + (this.STAGES.find(s => s.id === targetStage)?.label || targetStage), 'success');
        }
        draggedLeadId = null;
        draggedFromStage = null;
      });
    });
  },
};
