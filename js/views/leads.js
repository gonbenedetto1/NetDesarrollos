// ═══════════════════════════════════════════════════════
//  VIEWS/LEADS.JS — CRM / pipeline de oportunidades
// ═══════════════════════════════════════════════════════

const LeadsView = {
  currentView: 'kanban',   // kanban | list
  filterStatus: 'all',
  filterOwner: 'all',
  filterSystem: 'all',
  filterSource: 'all',
  searchQuery: '',

  STAGES: [
    { id:'new',         label:'Nuevo',        color:'#AEAEB2' },
    { id:'contacted',   label:'Contactado',   color:'#0071E3' },
    { id:'demo',        label:'Demo',         color:'#5AC8FA' },
    { id:'proposal',    label:'Propuesta',    color:'#BF5AF2' },
    { id:'negotiation', label:'Negociacion',  color:'#FF9F0A' },
    { id:'won',         label:'Ganado',       color:'#28C76F' },
    { id:'lost',        label:'Perdido',      color:'#FF3B30' },
  ],

  SOURCES: [
    { id:'web',       label:'Web' },
    { id:'referral',  label:'Referido' },
    { id:'event',     label:'Evento' },
    { id:'cold',      label:'Cold outreach' },
    { id:'social',    label:'Redes sociales' },
    { id:'other',     label:'Otro' },
  ],

  render() {
    Topbar.render({
      title: 'Leads',
      actions: [{ label: 'Nuevo lead', icon: 'plus', primary: true, action: 'new-lead' }],
    });

    const kpis = Store.getLeadKPIs();
    const users = Store.getUsers();
    const systems = Store.getSystems();

    document.getElementById('view-content').innerHTML = `
      <!-- KPIs compactos -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px">
        <div class="kpi-card">
          <div class="kpi-label">Pipeline total</div>
          <div class="kpi-value" style="font-size:22px">${Utils.formatCurrency(kpis.pipelineTotal)}</div>
          <div class="kpi-sub">${kpis.openCount} leads abiertos</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Pipeline ponderado</div>
          <div class="kpi-value" style="font-size:22px;color:var(--accent)">${Utils.formatCurrency(Math.round(kpis.weighted))}</div>
          <div class="kpi-sub">Valor x probabilidad</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Ganados este mes</div>
          <div class="kpi-value" style="font-size:22px;color:var(--green)">${Utils.formatCurrency(kpis.wonThisMonth)}</div>
          <div class="kpi-sub up">${kpis.wonThisMonthCount} deals cerrados</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Tasa de conversion</div>
          <div class="kpi-value" style="font-size:22px">${kpis.conversionRate}<span style="font-size:14px;font-weight:400">%</span></div>
          <div class="kpi-sub">${kpis.wonCount} ganados / ${kpis.lostCount} perdidos</div>
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
        <select class="form-select" id="lead-filter-owner" style="width:auto;padding:5px 28px 5px 12px;font-size:12.5px;border-radius:var(--r-full)">
          <option value="all">Todos los responsables</option>
          ${users.map(u => `<option value="${u.id}" ${this.filterOwner===u.id?'selected':''}>${u.name}</option>`).join('')}
        </select>
        <select class="form-select" id="lead-filter-system" style="width:auto;padding:5px 28px 5px 12px;font-size:12.5px;border-radius:var(--r-full)">
          <option value="all">Todos los sistemas</option>
          ${systems.map(s => `<option value="${s.id}" ${this.filterSystem===s.id?'selected':''}>${s.name}</option>`).join('')}
        </select>
        <select class="form-select" id="lead-filter-source" style="width:auto;padding:5px 28px 5px 12px;font-size:12.5px;border-radius:var(--r-full)">
          <option value="all">Todas las fuentes</option>
          ${this.SOURCES.map(s => `<option value="${s.id}" ${this.filterSource===s.id?'selected':''}>${s.label}</option>`).join('')}
        </select>
      </div>

      <div id="leads-content"></div>`;

    this.renderContent();
    this.attachEvents();
  },

  getFilteredLeads() {
    const filter = {};
    if (this.filterOwner !== 'all')  filter.ownerId  = this.filterOwner;
    if (this.filterSystem !== 'all') filter.systemId = this.filterSystem;
    if (this.filterSource !== 'all') filter.source   = this.filterSource;
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
          const totalValue = stageLeads.reduce((s, l) => s + Number(l.estimated_value || 0), 0);
          return `
          <div class="kanban-col" data-stage="${stage.id}">
            <div class="kanban-col-header">
              <span class="kanban-col-name">
                <div style="width:7px;height:7px;border-radius:50%;background:${stage.color}"></div>
                ${stage.label}
              </span>
              <span class="kanban-col-count">${stageLeads.length}</span>
            </div>
            ${totalValue > 0 ? `<div style="font-size:11px;color:var(--text-3);margin-bottom:8px;padding:0 2px">${Utils.formatCurrency(totalValue)}</div>` : ''}
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
    const overdue = lead.next_action_date && lead.next_action_date < new Date().toISOString().split('T')[0] && !['won','lost'].includes(lead.status);

    return `
      <div class="kanban-card ${overdue ? 'blocked' : ''}" data-open-lead="${lead.id}" style="${overdue ? 'border-left-color:var(--red)' : ''}">
        <div class="kanban-card-title">${lead.name}</div>
        ${lead.company ? `<div style="font-size:11.5px;color:var(--text-3);margin-bottom:6px">${lead.company}</div>` : ''}
        ${(lead.tags || []).length > 0 ? `<div style="margin-bottom:6px;display:flex;gap:4px;flex-wrap:wrap">${(lead.tags||[]).slice(0,3).map(t => `<span class="badge badge-medium" style="font-size:10px;padding:1px 6px">${t}</span>`).join('')}</div>` : ''}
        <div class="kanban-card-meta">
          ${system ? `<div style="display:flex;align-items:center;gap:4px"><div style="width:6px;height:6px;border-radius:50%;background:${system.color}"></div><span style="font-size:11px;color:var(--text-3)">${system.name}</span></div>` : ''}
        </div>
        <div class="kanban-card-footer">
          <span style="font-size:12px;font-weight:600;color:var(--text-1)">${Number(lead.estimated_value) > 0 ? Utils.formatCurrency(lead.estimated_value) : '—'}</span>
          <div style="display:flex;align-items:center;gap:6px">
            ${lead.probability ? `<span style="font-size:10.5px;color:var(--text-3)">${lead.probability}%</span>` : ''}
            ${owner ? Utils.avatarHtml(owner, 'sm') : ''}
          </div>
        </div>
        ${overdue ? `<div style="margin-top:6px;font-size:10.5px;color:var(--red);font-weight:500">⚠ Follow-up vencido</div>` : ''}
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
            <p>Cargá tu primer lead para empezar a hacer seguimiento.</p>
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
              <th>Etapa</th>
              <th>Sistema</th>
              <th>Valor</th>
              <th>Prob.</th>
              <th>Responsable</th>
              <th>Proxima accion</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(l => {
              const owner = l.owner_id ? Store.getUserById(l.owner_id) : null;
              const system = l.system_id ? Store.getSystemById(l.system_id) : null;
              const stage = this.STAGES.find(s => s.id === l.status);
              const overdue = l.next_action_date && l.next_action_date < new Date().toISOString().split('T')[0] && !['won','lost'].includes(l.status);
              return `
              <tr data-open-lead="${l.id}">
                <td><div style="font-weight:500">${l.name}</div></td>
                <td><span style="font-size:12.5px;color:var(--text-2)">${l.company || '—'}</span></td>
                <td>${stage ? `<span class="badge" style="background:${stage.color}20;color:${stage.color};font-weight:600">${stage.label}</span>` : '—'}</td>
                <td>${system ? `<div style="display:flex;align-items:center;gap:5px"><div style="width:6px;height:6px;border-radius:50%;background:${system.color}"></div><span style="font-size:12.5px">${system.name}</span></div>` : '—'}</td>
                <td style="font-weight:600">${Number(l.estimated_value) > 0 ? Utils.formatCurrency(l.estimated_value) : '—'}</td>
                <td><span style="font-size:12.5px;color:var(--text-2)">${l.probability}%</span></td>
                <td>${owner ? `<div style="display:flex;align-items:center;gap:5px">${Utils.avatarHtml(owner,'sm')}<span style="font-size:12.5px">${owner.name.split(' ')[0]}</span></div>` : '—'}</td>
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
    document.getElementById('lead-filter-source')?.addEventListener('change', (e) => { this.filterSource = e.target.value; this.renderContent(); this.attachContentEvents(); });

    // Topbar + empty-state action
    Utils.on(document.getElementById('topbar'), 'click', '[data-action="new-lead"]', () => Modal.openLead());
    Utils.on(content, 'click', '[data-action="new-lead"]', () => Modal.openLead());

    this.attachContentEvents();

    // Re-render on store changes
    Store.on('leads:changed', () => { if (document.querySelector('#view-content [id="leads-content"]')) this.render(); });
  },

  attachContentEvents() {
    const container = document.getElementById('leads-content');
    if (!container) return;

    container.querySelectorAll('[data-open-lead]').forEach(el => {
      el.onclick = (e) => { e.stopPropagation(); Panel.openLead(el.dataset.openLead); };
    });
    container.querySelectorAll('[data-add-lead-stage]').forEach(el => {
      el.onclick = (e) => { e.stopPropagation(); Modal.openLead({ status: el.dataset.addLeadStage }); };
    });
  },
};
