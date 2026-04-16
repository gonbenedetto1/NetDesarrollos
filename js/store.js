// ═══════════════════════════════════════════════════════
//  STORE.JS — State + Auth + Notifications
// ═══════════════════════════════════════════════════════

const Store = (() => {
  const KEY      = 'snet_v2';
  const AUTH_KEY = 'snet_auth';
  let idCounter  = 1000;

  function genId(p) { return p + '_' + (++idCounter) + '_' + Date.now(); }

  function loadState() {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Backwards compat: if budgets missing, seed from defaults
        if (!parsed.budgets) parsed.budgets = JSON.parse(JSON.stringify(MARKETING_BUDGETS));
        return parsed;
      }
    } catch(e) {}
    return {
      systems:   JSON.parse(JSON.stringify(SYSTEMS)),
      tasks:     JSON.parse(JSON.stringify(TASKS)),
      blocks:    JSON.parse(JSON.stringify(BLOCKS)),
      activity:  JSON.parse(JSON.stringify(ACTIVITY)),
      comments:  JSON.parse(JSON.stringify(COMMENTS)),
      budgets:   JSON.parse(JSON.stringify(MARKETING_BUDGETS)),
      notifications: [],
    };
  }

  let state = loadState();
  const listeners = {};

  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch(e) {} }
  function on(ev, cb) { if (!listeners[ev]) listeners[ev] = []; listeners[ev].push(cb); }
  function off(ev, cb) { if (listeners[ev]) listeners[ev] = listeners[ev].filter(f => f !== cb); }
  function emit(ev, data) {
    (listeners[ev] || []).forEach(fn => fn(data));
    (listeners['*'] || []).forEach(fn => fn(ev, data));
  }

  // ── Auth ──────────────────────────────────────────
  function getCurrentUser() {
    const id = localStorage.getItem(AUTH_KEY);
    return USERS.find(u => u.id === id) || null;
  }
  function login(email, password) {
    const user = USERS.find(u => u.email === email);
    if (!user) return { ok: false, error: 'No se encontro una cuenta con ese email' };
    if (user.password !== password) return { ok: false, error: 'Contrasena incorrecta' };
    localStorage.setItem(AUTH_KEY, user.id);
    return { ok: true, user };
  }
  function logout() { localStorage.removeItem(AUTH_KEY); }

  // ── Systems ───────────────────────────────────────
  function getSystems() { return state.systems; }
  function getSystemById(id) { return state.systems.find(s => s.id === id); }
  function createSystem(data) {
    const s = { id: genId('s'), ...data };
    state.systems.push(s);
    save(); emit('systems:changed'); return s;
  }
  function updateSystem(id, data) {
    const i = state.systems.findIndex(s => s.id === id);
    if (i < 0) return;
    state.systems[i] = { ...state.systems[i], ...data };
    save(); emit('systems:changed'); return state.systems[i];
  }

  // ── Tasks ─────────────────────────────────────────
  function getTasks(filter = {}) {
    let tasks = state.tasks;
    if (filter.systemId)   tasks = tasks.filter(t => t.systemId   === filter.systemId);
    if (filter.assignedTo) tasks = tasks.filter(t => t.assignedTo === filter.assignedTo);
    if (filter.status)     tasks = tasks.filter(t => t.status     === filter.status);
    return tasks;
  }
  function getTaskById(id) { return state.tasks.find(t => t.id === id); }

  function createTask(data) {
    const t = { id: genId('t'), progress: 0, actualHours: 0, tags: [], createdAt: new Date().toISOString(), ...data };
    state.tasks.push(t);
    _logActivity(t.createdBy, 'created', t.id, `creó la tarea "${t.title}"`);
    // Notify assignee
    if (t.assignedTo && t.assignedTo !== t.createdBy) {
      _addNotification(t.assignedTo, 'assigned', t.id, `${_userName(t.createdBy)} te asignó la tarea "${t.title}"`);
    }
    save(); emit('tasks:changed'); emit('tasks:changed:' + t.systemId); return t;
  }

  function updateTask(id, data) {
    const i = state.tasks.findIndex(t => t.id === id);
    if (i < 0) return;
    const old = state.tasks[i];
    state.tasks[i] = { ...old, ...data, updatedAt: new Date().toISOString() };
    const cu = getCurrentUser();
    if (data.status && data.status !== old.status) {
      const labels = { done:'finalizó', blocked:'bloqueo', in_progress:'inició', review:'puso en revisión', pending:'devolvió a pendiente' };
      _logActivity(cu?.id || old.createdBy, data.status, id, `${labels[data.status] || 'actualizó'} "${old.title}"`);
    }
    if (data.progress !== undefined && data.progress !== old.progress) {
      _logActivity(cu?.id || old.createdBy, 'progress_updated', id, `actualizó progreso a ${data.progress}% en "${old.title}"`);
    }
    // Notify new assignee
    if (data.assignedTo && data.assignedTo !== old.assignedTo && data.assignedTo !== cu?.id) {
      _addNotification(data.assignedTo, 'assigned', id, `${cu?.name || 'Alguien'} te asignó la tarea "${old.title}"`);
    }
    save(); emit('tasks:changed'); emit('tasks:changed:' + old.systemId); emit('task:updated', id); return state.tasks[i];
  }

  // ── Blocks ────────────────────────────────────────
  function getBlocks(status) { return status ? state.blocks.filter(b => b.status === status) : state.blocks; }
  function getBlocksForTask(taskId) { return state.blocks.filter(b => b.taskId === taskId); }
  function createBlock(taskId, description, reportedBy) {
    const b = { id: genId('b'), taskId, description, reportedBy, resolvedBy: null, resolutionNote: null, status: 'active', severity: 'high', createdAt: new Date().toISOString(), resolvedAt: null };
    state.blocks.push(b);
    updateTask(taskId, { status: 'blocked' });
    save(); emit('blocks:changed'); return b;
  }
  function resolveBlock(blockId, resolvedBy, note) {
    const i = state.blocks.findIndex(b => b.id === blockId);
    if (i < 0) return;
    const b = state.blocks[i];
    state.blocks[i] = { ...b, status: 'resolved', resolvedBy, resolutionNote: note, resolvedAt: new Date().toISOString() };
    const stillBlocked = state.blocks.some(bl => bl.taskId === b.taskId && bl.status === 'active' && bl.id !== blockId);
    if (!stillBlocked) updateTask(b.taskId, { status: 'in_progress' });
    _logActivity(resolvedBy, 'resolved', b.taskId, `resolvió el bloqueo de "${getTaskById(b.taskId)?.title || ''}"`);
    save(); emit('blocks:changed');
  }
  function deleteBlock(blockId) {
    const i = state.blocks.findIndex(b => b.id === blockId);
    if (i < 0) return;
    const b = state.blocks[i];
    state.blocks.splice(i, 1);
    // If no more active blocks for this task, return it to in_progress
    const stillBlocked = state.blocks.some(bl => bl.taskId === b.taskId && bl.status === 'active');
    if (!stillBlocked && b.status === 'active') {
      const task = getTaskById(b.taskId);
      if (task && task.status === 'blocked') updateTask(b.taskId, { status: 'in_progress' });
    }
    save(); emit('blocks:changed');
  }

  // ── Comments ──────────────────────────────────────
  function getComments(taskId) { return state.comments[taskId] || []; }
  function addComment(taskId, userId, text) {
    const c = { id: genId('c'), userId, text, createdAt: new Date().toISOString() };
    if (!state.comments[taskId]) state.comments[taskId] = [];
    state.comments[taskId].push(c);
    _logActivity(userId, 'commented', taskId, `comentó en "${getTaskById(taskId)?.title || ''}"`);
    // @mention notifications
    const mentioned = _parseMentions(text);
    const senderName = _userName(userId);
    const task = getTaskById(taskId);
    mentioned.forEach(uid => {
      if (uid !== userId) {
        _addNotification(uid, 'mention', taskId, `${senderName} te mencionó en "${task?.title || 'tarea'}"`);
      }
    });
    save(); emit('comments:changed:' + taskId); return c;
  }

  // ── Notifications ─────────────────────────────────
  function getNotifications(userId) { return (state.notifications || []).filter(n => n.userId === userId).slice(0, 50); }
  function getUnreadCount(userId)   { return getNotifications(userId).filter(n => !n.read).length; }
  function markAllRead(userId) {
    (state.notifications || []).forEach(n => { if (n.userId === userId) n.read = true; });
    save(); emit('notifications:changed');
  }
  function markRead(notifId) {
    const n = (state.notifications || []).find(n => n.id === notifId);
    if (n) { n.read = true; save(); emit('notifications:changed'); }
  }
  function _addNotification(userId, type, taskId, text) {
    if (!state.notifications) state.notifications = [];
    state.notifications.unshift({ id: genId('n'), userId, type, taskId, text, read: false, createdAt: new Date().toISOString() });
    if (state.notifications.length > 200) state.notifications = state.notifications.slice(0, 200);
    emit('notifications:changed');
  }

  // ── Activity ──────────────────────────────────────
  function getActivity(limit = 20) { return (state.activity || []).slice(0, limit); }
  function _logActivity(userId, action, taskId, text) {
    if (!state.activity) state.activity = [];
    state.activity.unshift({ id: genId('a'), userId, action, taskId, text, createdAt: new Date().toISOString() });
    if (state.activity.length > 200) state.activity = state.activity.slice(0, 200);
    emit('activity:changed');
  }

  // ── Helpers ───────────────────────────────────────
  function _userName(userId) { return USERS.find(u => u.id === userId)?.name || 'Alguien'; }
  function _parseMentions(text) {
    const mentioned = [];
    USERS.forEach(u => {
      const firstName = u.name.split(' ')[0];
      if (text.includes('@' + firstName) || text.includes('@' + u.name)) mentioned.push(u.id);
    });
    return mentioned;
  }

  // ── Computed ──────────────────────────────────────
  function getSystemTaskCounts(systemId) {
    const tasks = getTasks({ systemId });
    return {
      total:   tasks.length,
      active:  tasks.filter(t => t.status === 'in_progress').length,
      done:    tasks.filter(t => t.status === 'done').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
      pending: tasks.filter(t => t.status === 'pending').length,
      review:  tasks.filter(t => t.status === 'review').length,
    };
  }
  function getDashboardKPIs() {
    const tasks = state.tasks;
    const today = new Date().toISOString().split('T')[0];
    return {
      active:    tasks.filter(t => ['in_progress','review'].includes(t.status)).length,
      doneToday: tasks.filter(t => t.status === 'done' && (t.updatedAt||'').startsWith(today)).length,
      blocked:   state.blocks.filter(b => b.status === 'active').length,
      review:    tasks.filter(t => t.status === 'review').length,
    };
  }
  function getUserWorkload() {
    return USERS.map(u => {
      const assigned = state.tasks.filter(t => t.assignedTo === u.id && !['done','cancelled'].includes(t.status));
      const hours = assigned.reduce((s, t) => s + (t.estimatedHours || 0), 0);
      return { ...u, taskCount: assigned.length, hours, load: Math.min(Math.round(hours / 40 * 100), 100) };
    });
  }
  function resetToDefaults() {
    localStorage.removeItem(KEY);
    state = loadState();
    emit('*');
  }

  return {
    on, off,
    // Auth
    getCurrentUser, login, logout,
    // Systems
    getSystems, getSystemById, createSystem, updateSystem,
    getSystemTaskCounts,
    // Tasks
    getTasks, getTaskById, createTask, updateTask,
    // Blocks
    getBlocks, getBlocksForTask, createBlock, resolveBlock, deleteBlock,
    // Comments
    getComments, addComment,
    // Notifications
    getNotifications, getUnreadCount, markAllRead, markRead,
    // Activity
    getActivity,
    // Computed
    getDashboardKPIs, getUserWorkload,
    // Misc
    resetToDefaults,
    getUsers() { return USERS; },
    getUserById(id) { return USERS.find(u => u.id === id); },
    getMarketingBudgets() { return state.budgets || []; },
    updateMarketingBudget(systemId, data) {
      if (!state.budgets) return;
      const i = state.budgets.findIndex(b => b.systemId === systemId);
      if (i < 0) return;
      state.budgets[i] = { ...state.budgets[i], ...data };
      save(); emit('budgets:changed'); return state.budgets[i];
    },
  };
})();
