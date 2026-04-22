// MODAL.JS — Modal system & side panel

const Modal = {
  open(html) {
    const overlay = document.getElementById('modal-overlay');
    const container = document.getElementById('modal-container');
    container.innerHTML = html;
    overlay.classList.remove('hidden');
    container.classList.remove('hidden');
    overlay.onclick = () => this.close();
    setTimeout(() => { const inp = container.querySelector('input,textarea,select'); if(inp) inp.focus(); }, 80);
  },

  close() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('modal-container').classList.add('hidden');
  },

  // ── Task modal ───────────────────────────
  openTask(prefill = {}) {
    const systems = Store.getSystems();
    const users   = Store.getUsers();
    const isEdit  = !!prefill.id;
    this.open(`
      <div class="modal-header">
        <span class="modal-title">${isEdit ? 'Editar tarea' : 'Nueva tarea'}</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Título *</label>
          <input class="form-input" id="t-title" placeholder="Ej: Implementar autenticación JWT" value="${prefill.title||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea class="form-textarea" id="t-desc">${prefill.description||''}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Sistema *</label>
            <select class="form-select" id="t-system">
              <option value="">Seleccionar...</option>
              ${systems.map(s=>`<option value="${s.id}" ${prefill.systemId===s.id?'selected':''}>${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Asignar a</label>
            <select class="form-select" id="t-assigned">
              <option value="">Sin asignar</option>
              ${users.map(u=>`<option value="${u.id}" ${prefill.assignedTo===u.id?'selected':''}>${u.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row" style="margin-top:16px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Prioridad</label>
            <select class="form-select" id="t-priority">
              ${['critical','high','medium','low'].map(p=>`<option value="${p}" ${(prefill.priority||'medium')===p?'selected':''}>${Utils.priorityLabel(p)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Estado</label>
            <select class="form-select" id="t-status">
              ${['pending','in_progress','review','done'].map(s=>`<option value="${s}" ${(prefill.status||'pending')===s?'selected':''}>${Utils.statusLabel(s)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row" style="margin-top:16px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Fecha inicio</label>
            <input class="form-input" type="date" id="t-start" value="${prefill.startDate||''}">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Deadline</label>
            <input class="form-input" type="date" id="t-due" value="${prefill.dueDate||''}">
          </div>
        </div>
        <div class="form-row" style="margin-top:16px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Horas estimadas</label>
            <input class="form-input" type="number" id="t-hours" placeholder="8" value="${prefill.estimatedHours||''}">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">% Progreso</label>
            <input class="form-input" type="number" id="t-progress" min="0" max="100" value="${prefill.progress||0}">
          </div>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Adjuntos</label>
          <div id="t-attach-zone" style="border:2px dashed var(--border-2);border-radius:var(--r-md);padding:16px;text-align:center;cursor:pointer;transition:border-color 0.15s,background 0.15s">
            <input type="file" id="t-files" multiple accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip" style="display:none">
            <div style="font-size:13px;color:var(--text-3)">Arrastra archivos o <span style="color:var(--accent);font-weight:500">hace clic para seleccionar</span></div>
            <div style="font-size:11px;color:var(--text-4);margin-top:4px">Imagenes, PDF, documentos — max 2MB por archivo, hasta 5 archivos</div>
          </div>
          <div id="t-attach-preview" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px"></div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="mc-save">${isEdit?'Guardar cambios':'Crear tarea'}</button>
      </div>`);

    // Attachments state
    let pendingAttachments = (prefill.attachments || []).slice();
    const MAX_FILES = 5;
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB

    function renderPreviews() {
      const container = document.getElementById('t-attach-preview');
      if (!container) return;
      container.innerHTML = pendingAttachments.map((a, i) => {
        const isImg = a.type && a.type.startsWith('image/');
        return `<div style="position:relative;border:1px solid var(--border-1);border-radius:var(--r-md);overflow:hidden;display:flex;align-items:center;gap:8px;padding:${isImg ? '0' : '8px 12px'};background:var(--bg-input)">
          ${isImg
            ? `<img src="${a.dataUrl}" style="width:64px;height:64px;object-fit:cover">`
            : `<span style="font-size:12px;color:var(--text-2);max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.name}</span>`}
          <button class="attach-remove" data-remove-idx="${i}" style="position:absolute;top:2px;right:2px;width:18px;height:18px;border-radius:50%;background:var(--red);color:white;border:none;font-size:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1">✕</button>
        </div>`;
      }).join('');
      container.querySelectorAll('[data-remove-idx]').forEach(btn => {
        btn.onclick = (e) => { e.stopPropagation(); pendingAttachments.splice(parseInt(btn.dataset.removeIdx), 1); renderPreviews(); };
      });
    }

    function handleFiles(files) {
      Array.from(files).forEach(file => {
        if (pendingAttachments.length >= MAX_FILES) { Utils.toast('Maximo ' + MAX_FILES + ' archivos', 'error'); return; }
        if (file.size > MAX_SIZE) { Utils.toast(file.name + ' supera 2MB', 'error'); return; }
        const reader = new FileReader();
        reader.onload = () => {
          pendingAttachments.push({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
          renderPreviews();
        };
        reader.readAsDataURL(file);
      });
    }

    const fileInput = document.getElementById('t-files');
    const dropZone = document.getElementById('t-attach-zone');
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = () => { if (fileInput.files.length) handleFiles(fileInput.files); fileInput.value = ''; };
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent)'; dropZone.style.background = 'var(--accent-bg)'; };
    dropZone.ondragleave = () => { dropZone.style.borderColor = 'var(--border-2)'; dropZone.style.background = ''; };
    dropZone.ondrop = (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--border-2)'; dropZone.style.background = ''; if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files); };
    renderPreviews();

    document.getElementById('mc-close').onclick  = () => this.close();
    document.getElementById('mc-cancel').onclick = () => this.close();
    document.getElementById('mc-save').onclick   = () => {
      const title = document.getElementById('t-title').value.trim();
      if (!title) { Utils.toast('El titulo es obligatorio','error'); return; }
      const systemId = document.getElementById('t-system').value;
      if (!systemId) { Utils.toast('Selecciona un sistema','error'); return; }
      const data = {
        title, systemId,
        description:    document.getElementById('t-desc').value,
        assignedTo:     document.getElementById('t-assigned').value || null,
        priority:       document.getElementById('t-priority').value,
        status:         document.getElementById('t-status').value,
        startDate:      document.getElementById('t-start').value || null,
        dueDate:        document.getElementById('t-due').value || null,
        estimatedHours: parseFloat(document.getElementById('t-hours').value) || 0,
        progress:       parseInt(document.getElementById('t-progress').value) || 0,
        createdBy:      Store.getCurrentUser().id,
        attachments:    pendingAttachments,
      };
      if (isEdit) { Store.updateTask(prefill.id, data); Utils.toast('Tarea actualizada'); }
      else { Store.createTask(data); Utils.toast('Tarea creada','success'); }
      this.close();
    };
  },

  // ── System modal ─────────────────────────
  openSystem(prefill = {}) {
    const users  = Store.getUsers();
    const isEdit = !!prefill.id;
    const colors = ['#0071E3','#28C76F','#BF5AF2','#FF9F0A','#FF3B30','#FF6B6B','#1AC8DB'];
    this.open(`
      <div class="modal-header">
        <span class="modal-title">${isEdit?'Editar sistema':'Nuevo sistema'}</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Nombre *</label>
          <input class="form-input" id="s-name" placeholder="Ej: CRM Inmobiliario" value="${prefill.name||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <textarea class="form-textarea" id="s-desc">${prefill.description||''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <div style="display:flex;gap:8px;margin-top:4px">
            ${colors.map(c=>`<div class="color-pick" data-color="${c}" style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:3px solid ${(prefill.color||'#0071E3')===c?'var(--text-1)':'transparent'};transition:border-color 0.15s"></div>`).join('')}
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Estado</label>
            <select class="form-select" id="s-status">
              <option value="active" ${(prefill.status||'active')==='active'?'selected':''}>Activo</option>
              <option value="maintenance" ${prefill.status==='maintenance'?'selected':''}>Mantenimiento</option>
              <option value="inactive" ${prefill.status==='inactive'?'selected':''}>Inactivo</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Miembros</label>
            <select class="form-select" id="s-lead">
              ${users.map(u=>`<option value="${u.id}" ${(prefill.members||[]).includes(u.id)?'selected':''}>${u.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Notas estratégicas</label>
          <textarea class="form-textarea" id="s-strategy">${prefill.strategyNotes||''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="mc-save">${isEdit?'Guardar':'Crear sistema'}</button>
      </div>`);

    let selectedColor = prefill.color || '#0071E3';
    Utils.on(document.getElementById('modal-container'), 'click', '.color-pick', function() {
      selectedColor = this.dataset.color;
      Utils.qsa('.color-pick').forEach(el => el.style.borderColor = 'transparent');
      this.style.borderColor = 'var(--text-1)';
    });
    document.getElementById('mc-close').onclick  = () => this.close();
    document.getElementById('mc-cancel').onclick = () => this.close();
    document.getElementById('mc-save').onclick   = () => {
      const name = document.getElementById('s-name').value.trim();
      if (!name) { Utils.toast('El nombre es obligatorio','error'); return; }
      const data = { name, description: document.getElementById('s-desc').value, color: selectedColor, status: document.getElementById('s-status').value, members: [Store.getCurrentUser().id], strategyNotes: document.getElementById('s-strategy').value };
      if (isEdit) { Store.updateSystem(prefill.id, data); Utils.toast('Sistema actualizado'); }
      else { Store.createSystem(data); Utils.toast('Sistema creado','success'); }
      this.close();
    };
  },

  // ── Block modal ──────────────────────────
  openBlock(taskId) {
    const task = Store.getTaskById(taskId);
    this.open(`
      <div class="modal-header">
        <span class="modal-title">Marcar como bloqueada</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--red-bg);border-radius:var(--r-md);padding:12px;margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;color:var(--red-text);margin-bottom:3px">${task?.title||''}</div>
          <div style="font-size:12px;color:var(--red-text);opacity:0.8">Esta tarea quedara marcada como bloqueada.</div>
        </div>
        <div class="form-group">
          <label class="form-label">¿Cuál es el problema? *</label>
          <textarea class="form-textarea" id="block-desc" placeholder="Qué ocurre, qué intentaste, qué necesitás para desbloquearlo..." style="min-height:120px"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-danger btn-sm" id="mc-confirm">Marcar como bloqueada</button>
      </div>`);
    document.getElementById('mc-close').onclick   = () => this.close();
    document.getElementById('mc-cancel').onclick  = () => this.close();
    document.getElementById('mc-confirm').onclick = () => {
      const desc = document.getElementById('block-desc').value.trim();
      if (!desc) { Utils.toast('Describí el bloqueo','error'); return; }
      Store.createBlock(taskId, desc, Store.getCurrentUser().id);
      Utils.toast('Tarea marcada como bloqueada','error');
      this.close(); Panel.close(); Sidebar.render();
    };
  },

  // ── Resolve modal ────────────────────────
  openResolve(blockId) {
    this.open(`
      <div class="modal-header">
        <span class="modal-title">Resolver bloqueo</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Nota de resolución</label>
          <textarea class="form-textarea" id="resolve-note" placeholder="¿Cómo se resolvió? ¿Qué cambió?..." style="min-height:100px"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-sm" id="mc-confirm" style="background:var(--green);color:white">Marcar como resuelto</button>
      </div>`);
    document.getElementById('mc-close').onclick   = () => this.close();
    document.getElementById('mc-cancel').onclick  = () => this.close();
    document.getElementById('mc-confirm').onclick = () => {
      Store.resolveBlock(blockId, Store.getCurrentUser().id, document.getElementById('resolve-note').value);
      Utils.toast('Bloqueo resuelto','success');
      this.close(); Sidebar.render();
    };
  },

  // ── Budgets modal ────────────────────────
  openBudgets() {
    const budgets = Store.getMarketingBudgets();
    this.open(`
      <div class="modal-header">
        <span class="modal-title">Editar presupuestos de marketing</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <p style="font-size:12.5px;color:var(--text-3);margin-bottom:16px">Actualiza el presupuesto total y el monto gastado por cada sistema.</p>
        ${budgets.map(b => {
          const sys = Store.getSystemById(b.systemId);
          return `
          <div style="padding:12px;background:var(--bg-input);border-radius:var(--r-md);margin-bottom:10px" data-budget-row="${b.systemId}">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              ${sys ? `<div style="width:8px;height:8px;border-radius:50%;background:${sys.color}"></div>` : ''}
              <span style="font-size:13px;font-weight:600;color:var(--text-1)">${b.name}</span>
            </div>
            <div class="form-row">
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" style="font-size:11.5px">Presupuesto total</label>
                <input class="form-input budget-input" data-field="budget" type="number" min="0" value="${b.budget}">
              </div>
              <div class="form-group" style="margin-bottom:0">
                <label class="form-label" style="font-size:11.5px">Gastado</label>
                <input class="form-input budget-input" data-field="spent" type="number" min="0" value="${b.spent}">
              </div>
            </div>
          </div>`;
        }).join('')}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="mc-save">Guardar cambios</button>
      </div>`);

    document.getElementById('mc-close').onclick  = () => this.close();
    document.getElementById('mc-cancel').onclick = () => this.close();
    document.getElementById('mc-save').onclick   = () => {
      document.querySelectorAll('[data-budget-row]').forEach(row => {
        const systemId = row.dataset.budgetRow;
        const budget = parseFloat(row.querySelector('[data-field="budget"]').value) || 0;
        const spent  = parseFloat(row.querySelector('[data-field="spent"]').value)  || 0;
        Store.updateMarketingBudget(systemId, { budget, spent });
      });
      Utils.toast('Presupuestos actualizados', 'success');
      this.close();
      if (typeof ReportsView !== 'undefined') ReportsView.render();
    };
  },

  // ── Complete task modal ──────────────────
  openCompleteTask(taskId) {
    const task = Store.getTaskById(taskId);
    if (!task) return;
    const suggested = task.actualHours || task.estimatedHours || 0;
    this.open(`
      <div class="modal-header">
        <span class="modal-title">Finalizar tarea</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--green-bg);border-radius:var(--r-md);padding:12px;margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;color:var(--green-text);margin-bottom:3px">${task.title}</div>
          <div style="font-size:12px;color:var(--green-text);opacity:0.8">La tarea quedara marcada como finalizada.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Horas reales aproximadas</label>
          <input class="form-input" type="number" id="complete-hours" min="0" step="0.5" value="${suggested}" placeholder="Ej: 8">
          <div class="form-hint" style="margin-top:4px">Cuanto tiempo te llevo la tarea en total. Estimacion original: ${task.estimatedHours || 0}h.</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-sm" id="mc-confirm" style="background:var(--green);color:white">Finalizar</button>
      </div>`);

    document.getElementById('mc-close').onclick   = () => this.close();
    document.getElementById('mc-cancel').onclick  = () => this.close();
    document.getElementById('mc-confirm').onclick = () => {
      const hours = parseFloat(document.getElementById('complete-hours').value) || 0;
      Store.updateTask(taskId, { status: 'done', progress: 100, actualHours: hours });
      Utils.toast('Tarea finalizada', 'success');
      this.close();
      Panel.openTask(taskId);
    };
    setTimeout(() => { const inp = document.getElementById('complete-hours'); if (inp) inp.select(); }, 100);
  },

  // ── Lead modal (create/edit) ──────────────
  openLead(prefill = {}) {
    const systems = Store.getSystems();
    const users   = Store.getUsers();
    const groups  = Store.getLeadGroups();
    const isEdit  = !!prefill.id;
    const stages  = LeadsView.STAGES;
    const sources = LeadsView.SOURCES;
    const currentGroupId = prefill.groupId || prefill.group_id || '';

    this.open(`
      <div class="modal-header">
        <span class="modal-title">${isEdit ? 'Editar lead' : 'Nuevo lead'}</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Nombre del contacto *</label>
            <input class="form-input" id="l-name" placeholder="Juan Perez" value="${prefill.name||''}">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Empresa / Inmobiliaria</label>
            <input class="form-input" id="l-company" placeholder="Inmobiliaria XYZ" value="${prefill.company||''}">
          </div>
        </div>
        <div class="form-row" style="margin-top:16px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Email</label>
            <input class="form-input" type="email" id="l-email" value="${prefill.email||''}">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Telefono</label>
            <input class="form-input" id="l-phone" value="${prefill.phone||''}">
          </div>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Convenio / Grupo</label>
          <select class="form-select" id="l-group">
            <option value="">Sin convenio</option>
            ${groups.map(g => `<option value="${g.id}" ${currentGroupId===g.id?'selected':''}>${g.name}</option>`).join('')}
          </select>
          ${groups.length === 0 ? `<div class="form-hint" style="margin-top:4px">Todavia no hay convenios. <a href="#/groups" style="color:var(--accent)">Crear convenio →</a></div>` : ''}
        </div>
        <div class="form-row" style="margin-top:16px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Sistema de interes</label>
            <select class="form-select" id="l-system">
              <option value="">Sin definir</option>
              ${systems.map(s => `<option value="${s.id}" ${prefill.systemId===s.id||prefill.system_id===s.id?'selected':''}>${s.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Responsable</label>
            <select class="form-select" id="l-owner">
              <option value="">Sin asignar</option>
              ${users.map(u => `<option value="${u.id}" ${prefill.ownerId===u.id||prefill.owner_id===u.id?'selected':''}>${u.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row" style="margin-top:16px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Etapa</label>
            <select class="form-select" id="l-status">
              ${stages.map(s => `<option value="${s.id}" ${(prefill.status||'new')===s.id?'selected':''}>${s.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Origen</label>
            <select class="form-select" id="l-source">
              ${sources.map(s => `<option value="${s.id}" ${(prefill.source||'other')===s.id?'selected':''}>${s.label}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row" style="margin-top:16px">
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Proxima accion (fecha)</label>
            <input class="form-input" type="date" id="l-next-date" value="${prefill.next_action_date||prefill.nextActionDate||''}">
          </div>
          <div class="form-group" style="margin-bottom:0">
            <label class="form-label">Descripcion de la accion</label>
            <input class="form-input" id="l-next-text" placeholder="Llamar para seguimiento..." value="${prefill.next_action||prefill.nextAction||''}">
          </div>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Notas</label>
          <textarea class="form-textarea" id="l-notes" placeholder="Contexto, detalles, historia del lead...">${prefill.notes||''}</textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="mc-save">${isEdit?'Guardar cambios':'Crear lead'}</button>
      </div>`);

    document.getElementById('mc-close').onclick  = () => this.close();
    document.getElementById('mc-cancel').onclick = () => this.close();
    document.getElementById('mc-save').onclick   = async () => {
      const name = document.getElementById('l-name').value.trim();
      if (!name) { Utils.toast('El nombre es obligatorio','error'); return; }

      const data = {
        name,
        company:         document.getElementById('l-company').value,
        email:           document.getElementById('l-email').value,
        phone:           document.getElementById('l-phone').value,
        groupId:         document.getElementById('l-group').value || null,
        systemId:        document.getElementById('l-system').value || null,
        ownerId:         document.getElementById('l-owner').value || null,
        status:          document.getElementById('l-status').value,
        source:          document.getElementById('l-source').value,
        nextActionDate:  document.getElementById('l-next-date').value || null,
        nextAction:      document.getElementById('l-next-text').value,
        notes:           document.getElementById('l-notes').value,
      };

      if (isEdit) { await Store.updateLead(prefill.id, data); Utils.toast('Lead actualizado'); }
      else        { const res = await Store.createLead(data); if (!res) return; Utils.toast('Lead creado','success'); }
      this.close();
      if (isEdit) Panel.openLead(prefill.id);
    };
  },

  // ── Group modal (create/edit) ─────────────
  openGroup(prefill = {}) {
    const isEdit = !!prefill.id;
    const colors = ['#0071E3','#28C76F','#BF5AF2','#FF9F0A','#FF3B30','#FF6B6B','#1AC8DB','#FF9500'];
    this.open(`
      <div class="modal-header">
        <span class="modal-title">${isEdit?'Editar convenio':'Nuevo convenio'}</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Nombre del convenio *</label>
          <input class="form-input" id="g-name" placeholder="Ej: Colegio Inmobiliario de Catamarca" value="${prefill.name||''}">
        </div>
        <div class="form-group">
          <label class="form-label">Descripcion</label>
          <textarea class="form-textarea" id="g-desc" placeholder="Detalles del convenio, responsables externos, condiciones...">${prefill.description||''}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <div style="display:flex;gap:8px;margin-top:4px">
            ${colors.map(c => `<div class="color-pick" data-color="${c}" style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:3px solid ${(prefill.color||'#0071E3')===c?'var(--text-1)':'transparent'};transition:border-color 0.15s"></div>`).join('')}
          </div>
        </div>
      </div>
      <div class="modal-footer">
        ${isEdit ? `<button class="btn btn-ghost btn-sm" id="mc-delete" style="color:var(--red);margin-right:auto">Eliminar</button>` : ''}
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="mc-save">${isEdit?'Guardar':'Crear convenio'}</button>
      </div>`);

    let selectedColor = prefill.color || '#0071E3';
    document.querySelectorAll('.color-pick').forEach(el => {
      el.onclick = () => {
        selectedColor = el.dataset.color;
        document.querySelectorAll('.color-pick').forEach(x => x.style.borderColor = 'transparent');
        el.style.borderColor = 'var(--text-1)';
      };
    });

    document.getElementById('mc-close').onclick  = () => this.close();
    document.getElementById('mc-cancel').onclick = () => this.close();
    document.getElementById('mc-save').onclick   = async () => {
      const name = document.getElementById('g-name').value.trim();
      if (!name) { Utils.toast('El nombre es obligatorio','error'); return; }
      const data = {
        name,
        description: document.getElementById('g-desc').value,
        color: selectedColor,
      };
      if (isEdit) { await Store.updateLeadGroup(prefill.id, data); Utils.toast('Convenio actualizado'); }
      else        { const res = await Store.createLeadGroup(data); if (!res) return; Utils.toast('Convenio creado','success'); }
      this.close();
    };
    const delBtn = document.getElementById('mc-delete');
    if (delBtn) {
      delBtn.onclick = async () => {
        const stats = Store.getGroupStats(prefill.id);
        if (!confirm(`Eliminar el convenio "${prefill.name}"? ${stats.total > 0 ? `Los ${stats.total} leads asociados quedan sin convenio (no se eliminan).` : ''}`)) return;
        await Store.deleteLeadGroup(prefill.id);
        Utils.toast('Convenio eliminado','success');
        this.close();
        if (window.location.hash.startsWith('#/groups/')) Router.navigate('/groups');
      };
    }
  },

  // ── Lead update (interaccion) ────────────
  openLeadUpdate(leadId) {
    const lead = Store.getLeadById(leadId);
    const types = [
      { id:'call',     label:'📞 Llamada' },
      { id:'meeting',  label:'🤝 Reunion' },
      { id:'email',    label:'✉️ Email enviado' },
      { id:'demo',     label:'🖥️ Demo realizada' },
      { id:'proposal', label:'📄 Propuesta enviada' },
      { id:'note',     label:'📝 Nota' },
    ];
    this.open(`
      <div class="modal-header">
        <span class="modal-title">Agregar interaccion</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--bg-input);border-radius:var(--r-md);padding:12px;margin-bottom:16px">
          <div style="font-size:13px;font-weight:600">${lead?.name||''}</div>
          <div style="font-size:12px;color:var(--text-3)">${lead?.company||''}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Tipo de interaccion</label>
          <select class="form-select" id="u-type">
            ${types.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Descripcion *</label>
          <textarea class="form-textarea" id="u-text" placeholder="Que paso, que se hablo, proximos pasos..." style="min-height:120px"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-primary btn-sm" id="mc-save">Guardar</button>
      </div>`);

    document.getElementById('mc-close').onclick  = () => this.close();
    document.getElementById('mc-cancel').onclick = () => this.close();
    document.getElementById('mc-save').onclick   = async () => {
      const text = document.getElementById('u-text').value.trim();
      if (!text) { Utils.toast('Describí la interaccion','error'); return; }
      const type = document.getElementById('u-type').value;
      await Store.addLeadUpdate(leadId, type, text);
      Utils.toast('Interaccion registrada','success');
      this.close();
      Panel.openLead(leadId);
    };
  },

  // ── Lost reason ──────────────────────────
  openLostReason(leadId) {
    const reasons = ['Competencia', 'Precio', 'Timing', 'No-fit', 'Sin respuesta', 'Otro'];
    this.open(`
      <div class="modal-header">
        <span class="modal-title">Marcar como perdido</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--red-bg);border-radius:var(--r-md);padding:12px;margin-bottom:16px">
          <div style="font-size:12px;color:var(--red-text)">Queremos entender por que. Eso nos ayuda a mejorar.</div>
        </div>
        <div class="form-group">
          <label class="form-label">Razon *</label>
          <select class="form-select" id="lost-reason-select">
            ${reasons.map(r => `<option value="${r}">${r}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Detalles (opcional)</label>
          <textarea class="form-textarea" id="lost-note" placeholder="Informacion adicional..." style="min-height:80px"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-danger btn-sm" id="mc-save">Marcar como perdido</button>
      </div>`);

    document.getElementById('mc-close').onclick  = () => this.close();
    document.getElementById('mc-cancel').onclick = () => this.close();
    document.getElementById('mc-save').onclick   = async () => {
      const reason = document.getElementById('lost-reason-select').value;
      const note   = document.getElementById('lost-note').value.trim();
      const fullReason = note ? `${reason} — ${note}` : reason;
      await Store.updateLead(leadId, { status: 'lost', lostReason: fullReason });
      Utils.toast('Lead marcado como perdido','error');
      this.close();
      Panel.openLead(leadId);
    };
  },

  // ── Won confirm ──────────────────────────
  openWonConfirm(leadId) {
    const lead = Store.getLeadById(leadId);
    this.open(`
      <div class="modal-header">
        <span class="modal-title">🎉 Marcar como cerrado</span>
        <button class="modal-close" id="mc-close">${Utils.icon('close',14)}</button>
      </div>
      <div class="modal-body">
        <div style="background:var(--green-bg);border-radius:var(--r-md);padding:12px;margin-bottom:16px">
          <div style="font-size:13px;font-weight:600;color:var(--green-text)">${lead?.name||''}</div>
          <div style="font-size:12px;color:var(--green-text);opacity:0.8">${lead?.company||''}</div>
        </div>
        <div class="form-group">
          <label class="form-label">Nota de cierre (opcional)</label>
          <textarea class="form-textarea" id="won-note" placeholder="Como se concreto, que producto, detalles..." style="min-height:80px"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary btn-sm" id="mc-cancel">Cancelar</button>
        <button class="btn btn-sm" id="mc-save" style="background:var(--green);color:white">Confirmar cierre</button>
      </div>`);

    document.getElementById('mc-close').onclick  = () => this.close();
    document.getElementById('mc-cancel').onclick = () => this.close();
    document.getElementById('mc-save').onclick   = async () => {
      const note = document.getElementById('won-note').value.trim();
      await Store.updateLead(leadId, { status: 'won' });
      if (note) await Store.addLeadUpdate(leadId, 'note', 'Cierre: ' + note);
      Utils.toast('¡Cerrado! 🎉','success');
      this.close();
      Panel.openLead(leadId);
    };
  },
};

// ══════════════════════════════════════════════
//  PANEL — Right-side task detail
// ══════════════════════════════════════════════
const Panel = {
  open(html) {
    const overlay = document.getElementById('panel-overlay');
    const container = document.getElementById('panel-container');
    container.innerHTML = html;
    overlay.classList.remove('hidden');
    container.classList.remove('hidden');
    requestAnimationFrame(() => container.classList.add('open'));
    overlay.onclick = () => this.close();
  },

  close() {
    const c = document.getElementById('panel-container');
    c.classList.remove('open');
    setTimeout(() => {
      document.getElementById('panel-overlay').classList.add('hidden');
      c.classList.add('hidden');
    }, 260);
  },

  openTask(taskId) {
    const task    = Store.getTaskById(taskId);
    if (!task) return;
    const system   = Store.getSystemById(task.systemId);
    const assignee = task.assignedTo ? Store.getUserById(task.assignedTo) : null;
    const creator  = task.createdBy  ? Store.getUserById(task.createdBy)  : null;
    const blocks   = Store.getBlocksForTask(taskId);
    const activeBlock = blocks.find(b => b.status === 'active');
    const comments = Store.getComments(taskId);
    const overdue  = Utils.isOverdue(task.dueDate);
    const dueSoon  = Utils.isDueSoon(task.dueDate);

    this.open(`
      <div class="panel-header">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            ${Utils.statusBadge(task.status)}
            ${Utils.priorityBadge(task.priority)}
          </div>
          <h3 style="font-size:15px;font-weight:600;line-height:1.35">${task.title}</h3>
          <div style="font-size:12px;color:var(--text-3);margin-top:3px">${system?.name||''}</div>
        </div>
        <button class="btn btn-ghost btn-icon" id="panel-close">${Utils.icon('close')}</button>
      </div>

      <div class="panel-body">
        ${activeBlock ? `
        <div style="background:var(--red-bg);border:1px solid #FFCDD3;border-radius:var(--r-md);padding:14px;margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <div style="width:7px;height:7px;border-radius:50%;background:var(--red)"></div>
            <span style="font-size:12.5px;font-weight:600;color:var(--red-text)">Bloqueo activo</span>
            <span style="font-size:11px;color:var(--red-text);opacity:0.7;margin-left:auto">${Utils.timeAgo(activeBlock.createdAt)}</span>
          </div>
          <p style="font-size:13px;color:var(--red-text);line-height:1.45;margin-bottom:10px">${activeBlock.description}</p>
          <button class="btn btn-sm" style="background:var(--red);color:white" data-resolve-block="${activeBlock.id}">
            ${Utils.icon('check',13)} Resolver bloqueo
          </button>
        </div>` : ''}

        <div class="panel-section">
          <div class="panel-section-title">Detalles</div>
          <div class="detail-row">
            <span class="detail-label">Asignado a</span>
            <div class="detail-value" style="display:flex;align-items:center;gap:7px">
              ${assignee ? `${Utils.avatarHtml(assignee,'sm')}<span>${assignee.name}</span>` : '<span style="color:var(--text-4)">Sin asignar</span>'}
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Creado por</span>
            <div class="detail-value" style="display:flex;align-items:center;gap:7px">
              ${creator ? `${Utils.avatarHtml(creator,'sm')}<span>${creator.name}</span>` : '—'}
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Inicio</span>
            <span class="detail-value">${Utils.formatDate(task.startDate)}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Deadline</span>
            <span class="detail-value" style="color:${overdue?'var(--red)':dueSoon?'var(--orange)':'inherit'}">
              ${Utils.formatDate(task.dueDate)} ${overdue?'· <strong>Vencida</strong>':dueSoon?'· Pronto':''}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Horas</span>
            <span class="detail-value">${task.actualHours}h / ${task.estimatedHours}h estimadas</span>
          </div>
        </div>

        <div class="panel-section">
          <div class="panel-section-title">Progreso — ${task.progress}%</div>
          <input type="range" class="form-range" id="prog-slider" min="0" max="100" value="${task.progress}" style="margin-bottom:8px">
          ${Utils.progressBar(task.progress, Utils.progressColor(task.progress))}
        </div>

        ${task.description ? `
        <div class="panel-section">
          <div class="panel-section-title">Descripcion</div>
          <p style="font-size:13px;color:var(--text-2);line-height:1.55">${task.description}</p>
        </div>` : ''}

        ${task.attachments && task.attachments.length > 0 ? `
        <div class="panel-section">
          <div class="panel-section-title">Adjuntos (${task.attachments.length})</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${task.attachments.map(a => {
              const isImg = a.type && a.type.startsWith('image/');
              return isImg
                ? `<a href="${a.dataUrl}" target="_blank" style="display:block;width:80px;height:80px;border-radius:var(--r-md);overflow:hidden;border:1px solid var(--border-1)"><img src="${a.dataUrl}" style="width:100%;height:100%;object-fit:cover"></a>`
                : `<a href="${a.dataUrl}" download="${a.name}" style="display:flex;align-items:center;gap:6px;padding:8px 12px;border:1px solid var(--border-1);border-radius:var(--r-md);background:var(--bg-input);font-size:12px;color:var(--text-2);text-decoration:none;max-width:180px"><span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${a.name}</span><span style="font-size:10px;color:var(--text-4);flex-shrink:0">${Math.round(a.size/1024)}KB</span></a>`;
            }).join('')}
          </div>
        </div>` : ''}

        <div class="panel-section">
          <div class="panel-section-title">Acciones</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${task.status !== 'in_progress' && task.status !== 'blocked' ? `<button class="btn btn-secondary btn-xs" data-set-status="in_progress">Iniciar</button>` : ''}
            ${task.status === 'in_progress' ? `<button class="btn btn-secondary btn-xs" data-set-status="review">Poner en revisión</button>` : ''}
            ${task.status !== 'done' ? `<button class="btn btn-xs" style="background:var(--green);color:white" data-set-status="done">Finalizar</button>` : ''}
            ${task.status !== 'blocked' ? `<button class="btn btn-xs" style="background:var(--red-bg);color:var(--red-text)" data-open-block="${task.id}">Marcar bloqueada</button>` : ''}
            <button class="btn btn-secondary btn-xs" data-edit-task="${task.id}">Editar</button>
          </div>
        </div>

        <div class="panel-section">
          <div class="panel-section-title">Comentarios (${comments.length})</div>
          <div id="comments-list">
            ${comments.length === 0 ? '<p style="font-size:13px;color:var(--text-4)">Sin comentarios aún.</p>' :
              comments.map(c => {
                const u = Store.getUserById(c.userId);
                return `<div class="comment-item">
                  ${Utils.avatarHtml(u,'sm')}
                  <div class="comment-body">
                    <div><span class="comment-author">${u?.name||'?'}</span><span class="comment-date">${Utils.timeAgo(c.createdAt)}</span></div>
                    <div class="comment-text">${c.text.replace(/@([A-ZÁÉÍÓÚa-záéíóú]+)/g,'<strong style="color:var(--accent)">@$1</strong>')}</div>
                  </div>
                </div>`;
              }).join('')}
          </div>
          <div class="comment-input-row">
            ${Utils.avatarHtml(Store.getCurrentUser(),'sm')}
            <input class="form-input" id="comment-input" placeholder="Agregar comentario... (@Nombre para mencionar)" style="flex:1">
            <button class="btn btn-primary btn-xs" id="comment-send">${Utils.icon('send',13)}</button>
          </div>
        </div>
      </div>`);

    document.getElementById('panel-close').onclick = () => this.close();

    // Progress
    const slider = document.getElementById('prog-slider');
    if (slider) {
      let timeout;
      slider.oninput = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const val = parseInt(slider.value);
          if (val === 100 && task.status !== 'done') {
            // Reset visual to current task progress while the dialog decides
            slider.value = task.progress;
            Modal.openCompleteTask(taskId);
          } else {
            Store.updateTask(taskId, { progress: val });
          }
        }, 400);
      };
    }

    const cont = document.getElementById('panel-container');
    // Assign onclick directly on elements (not delegation) to avoid duplicate listeners
    // when the same panel is opened multiple times. innerHTML was just replaced, so these
    // elements are fresh — no old handlers remain.
    cont.querySelectorAll('[data-set-status]').forEach(el => {
      el.onclick = () => {
        if (el.dataset.setStatus === 'done') { Modal.openCompleteTask(taskId); return; }
        Store.updateTask(taskId, { status: el.dataset.setStatus });
        Panel.openTask(taskId);
      };
    });
    cont.querySelectorAll('[data-open-block]').forEach(el => {
      el.onclick = () => Modal.openBlock(el.dataset.openBlock);
    });
    cont.querySelectorAll('[data-resolve-block]').forEach(el => {
      el.onclick = () => Modal.openResolve(el.dataset.resolveBlock);
    });
    cont.querySelectorAll('[data-edit-task]').forEach(el => {
      el.onclick = () => Modal.openTask(Store.getTaskById(el.dataset.editTask));
    });

    const send = document.getElementById('comment-send');
    const inp  = document.getElementById('comment-input');
    if (send && inp) {
      const doSend = () => {
        const text = inp.value.trim(); if (!text) return;
        Store.addComment(taskId, Store.getCurrentUser().id, text);
        inp.value = '';
        Topbar.render(NotifPanel._lastConfig || {});
        Sidebar.render();
        Panel.openTask(taskId);
      };
      send.onclick = doSend;
      inp.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } };
    }
  },

  openLead(leadId) {
    const lead = Store.getLeadById(leadId);
    if (!lead) return;

    const owner   = lead.owner_id  ? Store.getUserById(lead.owner_id)  : null;
    const system  = lead.system_id ? Store.getSystemById(lead.system_id) : null;
    const group   = lead.group_id  ? Store.getLeadGroupById(lead.group_id) : null;
    const creator = lead.created_by ? Store.getUserById(lead.created_by) : null;
    const updates = Store.getLeadUpdates(leadId);
    const stage   = LeadsView.STAGES.find(s => s.id === lead.status);
    const sourceLabel = (LeadsView.SOURCES.find(s => s.id === lead.source) || { label: lead.source }).label;
    const today = new Date().toISOString().split('T')[0];
    const overdue = lead.next_action_date && lead.next_action_date < today && !['won','lost'].includes(lead.status);

    const updateIcon = {
      call:'📞', meeting:'🤝', email:'✉️', demo:'🖥️', proposal:'📄', note:'📝', status_change:'🔄',
    };

    // Suggest next stage
    const stageOrder = ['new','contacted','interested','won'];
    const currentIdx = stageOrder.indexOf(lead.status);
    const nextStageId = currentIdx >= 0 && currentIdx < stageOrder.length - 1 ? stageOrder[currentIdx + 1] : null;
    const nextStageLabel = nextStageId ? Store.leadStatusLabel(nextStageId) : null;

    this.open(`
      <div class="panel-header">
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap">
            ${stage ? `<span class="badge" style="background:${stage.color}20;color:${stage.color};font-weight:600">${stage.label}</span>` : ''}
            ${group ? `<span class="badge" style="background:${group.color}20;color:${group.color};font-size:11px">${group.name}</span>` : ''}
          </div>
          <h3 style="font-size:15px;font-weight:600;line-height:1.35">${lead.name}</h3>
          ${lead.company ? `<div style="font-size:12.5px;color:var(--text-3);margin-top:2px">${lead.company}</div>` : ''}
        </div>
        <button class="btn btn-ghost btn-icon" id="panel-close">${Utils.icon('close')}</button>
      </div>

      <div class="panel-body">
        ${overdue ? `
        <div style="background:var(--red-bg);border:1px solid #FFCDD3;border-radius:var(--r-md);padding:12px;margin-bottom:20px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <div style="width:7px;height:7px;border-radius:50%;background:var(--red)"></div>
            <span style="font-size:12.5px;font-weight:600;color:var(--red-text)">Follow-up vencido</span>
          </div>
          <p style="font-size:13px;color:var(--red-text);line-height:1.4">${lead.next_action || 'Accion pendiente'} · ${Utils.formatDate(lead.next_action_date)}</p>
        </div>` : ''}

        <!-- Contacto -->
        <div class="panel-section">
          <div class="panel-section-title">Contacto</div>
          <div class="detail-row">
            <span class="detail-label">Email</span>
            <div class="detail-value">${lead.email ? `<a href="mailto:${lead.email}" style="color:var(--accent)">${lead.email}</a>` : '<span style="color:var(--text-4)">—</span>'}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Telefono</span>
            <div class="detail-value">${lead.phone ? `<a href="tel:${lead.phone}" style="color:var(--accent)">${lead.phone}</a>` : '<span style="color:var(--text-4)">—</span>'}</div>
          </div>
        </div>

        <!-- Responsable y origen -->
        <div class="panel-section">
          <div class="panel-section-title">Datos</div>
          ${group ? `
          <div class="detail-row">
            <span class="detail-label">Convenio</span>
            <div class="detail-value"><span class="badge" style="background:${group.color}20;color:${group.color}">${group.name}</span></div>
          </div>` : ''}
          <div class="detail-row">
            <span class="detail-label">Sistema</span>
            <div class="detail-value">${system ? `<div style="display:flex;align-items:center;gap:6px"><div style="width:7px;height:7px;border-radius:50%;background:${system.color}"></div><span>${system.name}</span></div>` : '<span style="color:var(--text-4)">—</span>'}</div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Responsable</span>
            <div class="detail-value" style="display:flex;align-items:center;gap:7px">
              ${owner ? `${Utils.avatarHtml(owner,'sm')}<span>${owner.name}</span>` : '<span style="color:var(--text-4)">Sin asignar</span>'}
            </div>
          </div>
          <div class="detail-row">
            <span class="detail-label">Origen</span>
            <span class="detail-value">${sourceLabel}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Creado</span>
            <span class="detail-value">${Utils.timeAgo(lead.created_at)}${creator ? ` por ${creator.name.split(' ')[0]}`:''}</span>
          </div>
        </div>

        <!-- Proxima accion -->
        <div class="panel-section">
          <div class="panel-section-title">Proxima accion</div>
          ${lead.next_action_date || lead.next_action ? `
            <div style="padding:10px 12px;background:${overdue?'var(--red-bg)':'var(--bg-input)'};border-radius:var(--r-md)">
              ${lead.next_action_date ? `<div style="font-size:13px;font-weight:600;color:${overdue?'var(--red-text)':'var(--text-1)'};margin-bottom:2px">${Utils.formatDate(lead.next_action_date)}${overdue?' · Vencida':''}</div>` : ''}
              ${lead.next_action ? `<div style="font-size:12.5px;color:${overdue?'var(--red-text)':'var(--text-2)'}">${lead.next_action}</div>` : ''}
            </div>
          ` : '<p style="font-size:13px;color:var(--text-4)">Sin accion programada. Usa el boton Editar para agregar.</p>'}
        </div>

        ${lead.notes ? `
        <div class="panel-section">
          <div class="panel-section-title">Notas</div>
          <p style="font-size:13px;color:var(--text-2);line-height:1.55;white-space:pre-wrap">${lead.notes}</p>
        </div>` : ''}

        ${lead.status === 'lost' && lead.lost_reason ? `
        <div class="panel-section">
          <div class="panel-section-title">Razon de perdida</div>
          <div style="padding:10px 12px;background:var(--red-bg);border-radius:var(--r-md);font-size:13px;color:var(--red-text)">${lead.lost_reason}</div>
        </div>` : ''}

        <!-- Timeline de interacciones (excluye comentarios internos) -->
        <div class="panel-section">
          <div class="panel-section-title" style="display:flex;justify-content:space-between;align-items:center">
            <span>Interacciones (${updates.filter(u => u.type !== 'comment').length})</span>
            <button class="btn btn-primary btn-xs" data-add-update="${lead.id}">${Utils.icon('plus',12)} Agregar</button>
          </div>
          ${updates.filter(u => u.type !== 'comment').length === 0 ? '<p style="font-size:13px;color:var(--text-4)">Aun no hay interacciones. Agregá la primera para llevar registro.</p>' :
            `<div style="display:flex;flex-direction:column;gap:10px">${updates.filter(u => u.type !== 'comment').map(u => {
              const usr = Store.getUserById(u.user_id);
              return `<div style="display:flex;gap:10px;padding:10px;background:var(--bg-input);border-radius:var(--r-md)">
                <div style="font-size:18px;flex-shrink:0;line-height:1">${updateIcon[u.type]||'•'}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:12.5px;color:var(--text-1);line-height:1.45">${u.text}</div>
                  <div style="font-size:11px;color:var(--text-4);margin-top:3px">${usr ? usr.name.split(' ')[0] : '?'} · ${Utils.timeAgo(u.created_at)}</div>
                </div>
              </div>`;
            }).join('')}</div>`}
        </div>

        <!-- Acciones -->
        <div class="panel-section">
          <div class="panel-section-title">Acciones</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${nextStageId ? `<button class="btn btn-primary btn-xs" data-lead-stage="${nextStageId}">→ ${nextStageLabel}</button>` : ''}
            ${!['won','lost'].includes(lead.status) ? `<button class="btn btn-xs" style="background:var(--green);color:white" data-lead-won="${lead.id}">🎉 Cerrar</button>` : ''}
            ${!['won','lost'].includes(lead.status) ? `<button class="btn btn-xs" style="background:var(--red-bg);color:var(--red-text)" data-lead-lost="${lead.id}">Perdido</button>` : ''}
            <button class="btn btn-secondary btn-xs" data-edit-lead="${lead.id}">${Utils.icon('edit',12)} Editar</button>
            <button class="btn btn-ghost btn-xs" data-delete-lead="${lead.id}" style="color:var(--text-3)">Eliminar</button>
          </div>
        </div>

        <!-- Comentarios internos del equipo -->
        <div class="panel-section">
          <div class="panel-section-title">Comentarios internos (${updates.filter(u => u.type === 'comment').length})</div>
          ${updates.filter(u => u.type === 'comment').length === 0 ? '<p style="font-size:13px;color:var(--text-4);margin-bottom:12px">Sin comentarios. Agrega uno para coordinar con el equipo (usá @Nombre para mencionar).</p>' :
            `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">${updates.filter(u => u.type === 'comment').map(u => {
              const usr = Store.getUserById(u.user_id);
              return `<div class="comment-item">
                ${usr ? Utils.avatarHtml(usr,'sm') : ''}
                <div class="comment-body">
                  <div>
                    <span class="comment-author">${usr ? usr.name.split(' ')[0] : '?'}</span>
                    <span class="comment-date">${Utils.timeAgo(u.created_at)}</span>
                  </div>
                  <div class="comment-text">${u.text.replace(/@([A-ZÁÉÍÓÚa-záéíóú]+)/g,'<strong style="color:var(--accent)">@$1</strong>')}</div>
                </div>
              </div>`;
            }).join('')}</div>`}
          <div class="comment-input-row">
            ${Utils.avatarHtml(Store.getCurrentUser(),'sm')}
            <input class="form-input" id="lead-comment-input" placeholder="Escribí un comentario... (@Nombre para mencionar)" style="flex:1">
            <button class="btn btn-primary btn-xs" id="lead-comment-send">${Utils.icon('send',13)}</button>
          </div>
        </div>
      </div>`);

    document.getElementById('panel-close').onclick = () => this.close();

    const cont = document.getElementById('panel-container');
    cont.querySelectorAll('[data-add-update]').forEach(el => {
      el.onclick = () => Modal.openLeadUpdate(el.dataset.addUpdate || leadId);
    });
    cont.querySelectorAll('[data-lead-stage]').forEach(el => {
      el.onclick = async () => {
        await Store.updateLead(leadId, { status: el.dataset.leadStage });
        Panel.openLead(leadId);
      };
    });
    cont.querySelectorAll('[data-lead-won]').forEach(el => {
      el.onclick = () => Modal.openWonConfirm(el.dataset.leadWon);
    });
    cont.querySelectorAll('[data-lead-lost]').forEach(el => {
      el.onclick = () => Modal.openLostReason(el.dataset.leadLost);
    });
    cont.querySelectorAll('[data-edit-lead]').forEach(el => {
      el.onclick = () => Modal.openLead(Store.getLeadById(el.dataset.editLead));
    });
    cont.querySelectorAll('[data-delete-lead]').forEach(el => {
      el.onclick = async () => {
        if (!confirm(`Eliminar el lead "${lead.name}"? Esta accion no se puede deshacer.`)) return;
        await Store.deleteLead(el.dataset.deleteLead);
        Utils.toast('Lead eliminado','success');
        Panel.close();
      };
    });

    // Comentarios internos
    const commentSend = document.getElementById('lead-comment-send');
    const commentInput = document.getElementById('lead-comment-input');
    if (commentSend && commentInput) {
      const sendComment = async () => {
        const text = commentInput.value.trim();
        if (!text) return;
        commentInput.value = '';
        await Store.addLeadUpdate(leadId, 'comment', text);
        Panel.openLead(leadId);
      };
      commentSend.onclick = sendComment;
      commentInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } };
    }
  },
};

// ── Additional: openSystem ────────────────────────────
Modal.openSystem = function(prefill = {}) {
  const isEdit = !!prefill.id;
  const colors = ['#0071E3','#28C76F','#BF5AF2','#FF9F0A','#FF3B30'];
  this.open(`
    <div class="modal-header">
      <span class="modal-title">${isEdit ? 'Editar sistema' : 'Nuevo sistema'}</span>
      <button class="modal-close" id="modal-close-btn">${Utils.icon('close', 14)}</button>
    </div>
    <div class="modal-body">
      <div class="form-group">
        <label class="form-label">Nombre *</label>
        <input class="form-input" id="s-name" value="${prefill.name || ''}" placeholder="Ej: CRM Inmobiliario">
      </div>
      <div class="form-group">
        <label class="form-label">Descripción</label>
        <textarea class="form-textarea" id="s-desc">${prefill.description || ''}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Color</label>
        <div style="display:flex;gap:8px;margin-top:4px">
          ${colors.map(c => `<div class="color-pick" data-color="${c}" style="width:28px;height:28px;border-radius:50%;background:${c};cursor:pointer;border:3px solid ${(prefill.color||'#0071E3')===c?'var(--text-1)':'transparent'}"></div>`).join('')}
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary btn-sm" id="modal-cancel-btn">Cancelar</button>
      <button class="btn btn-primary btn-sm" id="modal-save-sys">${isEdit ? 'Guardar' : 'Crear sistema'}</button>
    </div>`);

  let selectedColor = prefill.color || '#0071E3';
  Utils.on(document.getElementById('modal-container'), 'click', '.color-pick', function() {
    selectedColor = this.dataset.color;
    Utils.qsa('.color-pick').forEach(el => el.style.borderColor = 'transparent');
    this.style.borderColor = 'var(--text-1)';
  });
  document.getElementById('modal-close-btn').onclick  = () => this.close();
  document.getElementById('modal-cancel-btn').onclick = () => this.close();
  document.getElementById('modal-save-sys').onclick   = () => {
    const name = document.getElementById('s-name').value.trim();
    if (!name) { Utils.toast('El nombre es obligatorio', 'error'); return; }
    const data = { name, description: document.getElementById('s-desc').value, color: selectedColor, members: [Store.getCurrentUser().id] };
    if (isEdit) { Store.updateSystem(prefill.id, data); Utils.toast('Sistema actualizado'); }
    else { Store.createSystem(data); Utils.toast('Sistema creado', 'success'); }
    this.close();
  };
};
