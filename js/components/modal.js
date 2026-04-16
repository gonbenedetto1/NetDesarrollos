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
