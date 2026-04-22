// ═══════════════════════════════════════════════════════
//  VIEWS/GROUPS.JS — Convenios (grupos de leads)
// ═══════════════════════════════════════════════════════

const GroupsView = {
  render() {
    Topbar.render({
      title: 'Convenios',
      actions: [{ label: 'Nuevo convenio', icon: 'plus', primary: true, action: 'new-group' }],
    });

    const groups = Store.getLeadGroups();

    document.getElementById('view-content').innerHTML = `
      <div class="view-header">
        <div class="view-header-left">
          <h1>Convenios</h1>
          <p>Cada convenio agrupa los leads que vienen por ese acuerdo. Clickea para ver el estado de cada uno.</p>
        </div>
      </div>

      ${groups.length === 0 ? `
        <div class="card">
          <div class="empty-state">
            <div class="empty-state-icon">🤝</div>
            <h3>Sin convenios aun</h3>
            <p>Crea el primer convenio (ej: Colegio Inmobiliario de Catamarca) para empezar a cargar leads.</p>
            <button class="btn btn-primary btn-sm" data-action="new-group">Crear primer convenio</button>
          </div>
        </div>
      ` : `
        <div class="project-grid">
          ${groups.map(g => {
            const stats = Store.getGroupStats(g.id);
            return `
            <div class="project-card" data-open-group="${g.id}">
              <div class="project-card-header">
                <div style="display:flex;gap:10px;flex:1;min-width:0">
                  <div class="project-color-dot" style="background:${g.color}"></div>
                  <div style="flex:1;min-width:0">
                    <div class="project-name">${g.name}</div>
                    ${g.description ? `<div class="project-desc">${g.description}</div>` : '<div class="project-desc" style="color:var(--text-4);font-style:italic">Sin descripcion</div>'}
                  </div>
                </div>
                <button class="btn btn-ghost btn-icon btn-sm" data-edit-group="${g.id}" title="Editar">${Utils.icon('edit',14)}</button>
              </div>

              <div class="project-stats">
                <div class="project-stat">
                  <div class="project-stat-val">${stats.total}</div>
                  <div class="project-stat-label">Total</div>
                </div>
                <div class="project-stat">
                  <div class="project-stat-val" style="color:var(--accent)">${stats.open}</div>
                  <div class="project-stat-label">Abiertos</div>
                </div>
                <div class="project-stat">
                  <div class="project-stat-val" style="color:var(--green)">${stats.won}</div>
                  <div class="project-stat-label">Cerrados</div>
                </div>
                <div class="project-stat">
                  <div class="project-stat-val" style="color:var(--red)">${stats.lost}</div>
                  <div class="project-stat-label">Perdidos</div>
                </div>
              </div>

              <div class="project-footer">
                <span style="font-size:12px;color:var(--text-3)">Creado ${Utils.timeAgo(g.created_at)}</span>
                <span class="section-link" style="font-size:12.5px">Ver leads →</span>
              </div>
            </div>`;
          }).join('')}
        </div>
      `}`;

    this.attachEvents();
  },

  renderDetail(groupId) {
    // Delegates to LeadsView with locked group filter
    LeadsView.render(groupId);
  },

  attachEvents() {
    const content = document.getElementById('view-content');

    // Open group -> go to /groups/:id
    content.querySelectorAll('[data-open-group]').forEach(el => {
      el.onclick = (e) => {
        if (e.target.closest('[data-edit-group]')) return; // let edit button handle
        Router.navigate('/groups/' + el.dataset.openGroup);
      };
    });

    // Edit group
    content.querySelectorAll('[data-edit-group]').forEach(el => {
      el.onclick = (e) => {
        e.stopPropagation();
        Modal.openGroup(Store.getLeadGroupById(el.dataset.editGroup));
      };
    });

    // New group buttons
    Utils.on(document.getElementById('topbar'), 'click', '[data-action="new-group"]', () => Modal.openGroup());
    Utils.on(content, 'click', '[data-action="new-group"]', () => Modal.openGroup());

    Store.on('lead_groups:changed', () => { if (window.location.hash === '#/groups') this.render(); });
  },
};
