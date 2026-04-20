// ═══════════════════════════════════════════════════════
//  STORE.JS — Supabase-backed state with local cache
//  Reads are synchronous (from cache). Writes go to
//  Supabase then update the cache. Realtime subscriptions
//  keep the cache fresh when other users make changes.
// ═══════════════════════════════════════════════════════

const Store = (() => {
  // ── Local cache ─────────────────────────────────────
  let state = {
    users:         [],
    systems:       [],
    tasks:         [],
    blocks:        [],
    comments:      {},  // { taskId: [comments] }
    activity:      [],
    notifications: [],
    budgets:       [],
  };
  let currentUser = null; // { id, name, initials, role, color, bg, email }

  // ── Event system ────────────────────────────────────
  const listeners = {};
  function on(ev, cb)  { if (!listeners[ev]) listeners[ev] = []; listeners[ev].push(cb); }
  function off(ev, cb) { if (listeners[ev]) listeners[ev] = listeners[ev].filter(f => f !== cb); }
  function emit(ev, data) {
    (listeners[ev] || []).forEach(fn => fn(data));
    (listeners['*'] || []).forEach(fn => fn(ev, data));
  }

  // ══════════════════════════════════════════════════════
  //  LOAD — fetch everything from Supabase into cache
  // ══════════════════════════════════════════════════════
  async function loadFromSupabase() {
    const [profiles, systems, tasks, blocks, comments, activity, budgets, notifs] = await Promise.all([
      supabase.from('profiles').select('*'),
      supabase.from('systems').select('*').order('created_at'),
      supabase.from('tasks').select('*').order('created_at'),
      supabase.from('blocks').select('*').order('created_at', { ascending: false }),
      supabase.from('comments').select('*').order('created_at'),
      supabase.from('activity').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('budgets').select('*'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    state.users    = profiles.data || [];
    state.systems  = systems.data  || [];
    state.tasks    = tasks.data    || [];
    state.blocks   = blocks.data   || [];
    state.activity = activity.data || [];
    state.budgets  = budgets.data  || [];
    state.notifications = notifs.data || [];

    // Group comments by task_id
    state.comments = {};
    (comments.data || []).forEach(c => {
      if (!state.comments[c.task_id]) state.comments[c.task_id] = [];
      state.comments[c.task_id].push(c);
    });
  }

  // ══════════════════════════════════════════════════════
  //  REALTIME — subscribe to changes from other users
  // ══════════════════════════════════════════════════════
  function subscribeRealtime() {
    supabase.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => refreshTable('tasks'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' }, () => refreshTable('blocks'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => refreshTable('comments'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity' }, () => refreshTable('activity'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => refreshTable('notifications'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'systems' }, () => refreshTable('systems'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => refreshTable('budgets'))
      .subscribe();
  }

  async function refreshTable(table) {
    if (table === 'comments') {
      const { data } = await supabase.from('comments').select('*').order('created_at');
      state.comments = {};
      (data || []).forEach(c => {
        if (!state.comments[c.task_id]) state.comments[c.task_id] = [];
        state.comments[c.task_id].push(c);
      });
      _addCompatToAll();
      emit('comments:changed');
    } else if (table === 'notifications') {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
      state.notifications = data || [];
      _addCompatToAll();
      emit('notifications:changed');
    } else if (table === 'activity') {
      const { data } = await supabase.from('activity').select('*').order('created_at', { ascending: false }).limit(200);
      state.activity = data || [];
      _addCompatToAll();
      emit('activity:changed');
    } else {
      const { data } = await supabase.from(table).select('*').order('created_at');
      state[table] = data || [];
      _addCompatToAll();
      emit(table + ':changed');
    }
  }

  // ══════════════════════════════════════════════════════
  //  AUTH
  // ══════════════════════════════════════════════════════
  function getCurrentUser() { return currentUser; }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    // Fetch profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
    currentUser = profile ? { ...profile, email: data.user.email } : { id: data.user.id, name: email.split('@')[0], email: data.user.email, initials: email.slice(0,2).toUpperCase(), role: 'developer', color: '#0071E3', bg: '#EBF2FD' };
    return { ok: true, user: currentUser };
  }

  async function restoreSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    currentUser = profile ? { ...profile, email: session.user.email } : null;
    return currentUser;
  }

  async function logout() {
    await supabase.auth.signOut();
    currentUser = null;
  }

  // ══════════════════════════════════════════════════════
  //  SYSTEMS — read from cache, write to Supabase
  // ══════════════════════════════════════════════════════
  function getSystems() { return state.systems; }
  function getSystemById(id) { return state.systems.find(s => s.id === id); }

  async function createSystem(data) {
    const { data: s, error } = await supabase.from('systems').insert({ name: data.name, description: data.description || '', color: data.color || '#0071E3', members: data.members || [currentUser?.id] }).select().single();
    if (error) { console.error(error); return null; }
    state.systems.push(s);
    emit('systems:changed');
    return s;
  }

  async function updateSystem(id, data) {
    const payload = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.color !== undefined) payload.color = data.color;
    if (data.members !== undefined) payload.members = data.members;
    const { data: s, error } = await supabase.from('systems').update(payload).eq('id', id).select().single();
    if (error) { console.error(error); return null; }
    const i = state.systems.findIndex(x => x.id === id);
    if (i >= 0) state.systems[i] = s;
    emit('systems:changed');
    return s;
  }

  // ══════════════════════════════════════════════════════
  //  TASKS
  // ══════════════════════════════════════════════════════
  function getTasks(filter = {}) {
    let tasks = state.tasks;
    if (filter.systemId)   tasks = tasks.filter(t => t.system_id === filter.systemId);
    if (filter.assignedTo) tasks = tasks.filter(t => t.assigned_to === filter.assignedTo);
    if (filter.status)     tasks = tasks.filter(t => t.status === filter.status);
    return tasks;
  }
  function getTaskById(id) { return state.tasks.find(t => t.id === id); }

  async function createTask(data) {
    const row = {
      system_id: data.systemId,
      title: data.title,
      description: data.description || '',
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      assigned_to: data.assignedTo || null,
      created_by: data.createdBy || currentUser?.id,
      start_date: data.startDate || null,
      due_date: data.dueDate || null,
      estimated_hours: data.estimatedHours || 0,
      actual_hours: data.actualHours || 0,
      progress: data.progress || 0,
      tags: data.tags || [],
      attachments: data.attachments || [],
    };
    const { data: t, error } = await supabase.from('tasks').insert(row).select().single();
    if (error) { console.error(error); return null; }
    state.tasks.push(t);

    // Activity
    await _logActivity(row.created_by, 'created', t.id, `creo la tarea "${t.title}"`);

    // Notify assignee
    if (t.assigned_to && t.assigned_to !== t.created_by) {
      await _addNotification(t.assigned_to, 'assigned', t.id, `${_userName(t.created_by)} te asigno la tarea "${t.title}"`);
    }

    emit('tasks:changed');
    emit('tasks:changed:' + t.system_id);
    return _toTaskCompat(t);
  }

  async function updateTask(id, data) {
    const old = getTaskById(id);
    if (!old) return;

    const payload = { updated_at: new Date().toISOString() };
    if (data.title !== undefined)          payload.title = data.title;
    if (data.description !== undefined)    payload.description = data.description;
    if (data.systemId !== undefined)        payload.system_id = data.systemId;
    if (data.status !== undefined)          payload.status = data.status;
    if (data.priority !== undefined)        payload.priority = data.priority;
    if (data.assignedTo !== undefined)      payload.assigned_to = data.assignedTo;
    if (data.startDate !== undefined)       payload.start_date = data.startDate;
    if (data.dueDate !== undefined)         payload.due_date = data.dueDate;
    if (data.estimatedHours !== undefined)  payload.estimated_hours = data.estimatedHours;
    if (data.actualHours !== undefined)     payload.actual_hours = data.actualHours;
    if (data.progress !== undefined)        payload.progress = data.progress;
    if (data.tags !== undefined)            payload.tags = data.tags;
    if (data.attachments !== undefined)     payload.attachments = data.attachments;

    const { data: t, error } = await supabase.from('tasks').update(payload).eq('id', id).select().single();
    if (error) { console.error(error); return null; }

    const i = state.tasks.findIndex(x => x.id === id);
    if (i >= 0) state.tasks[i] = t;

    // Activity logs
    if (data.status && data.status !== old.status) {
      const labels = { done:'finalizo', blocked:'bloqueo', in_progress:'inicio', review:'puso en revision', pending:'devolvio a pendiente' };
      await _logActivity(currentUser?.id || old.created_by, data.status, id, `${labels[data.status] || 'actualizo'} "${old.title}"`);
    }
    if (data.progress !== undefined && data.progress !== old.progress) {
      await _logActivity(currentUser?.id || old.created_by, 'progress_updated', id, `actualizo progreso a ${data.progress}% en "${old.title}"`);
    }
    // Notify new assignee
    if (data.assignedTo && data.assignedTo !== old.assigned_to && data.assignedTo !== currentUser?.id) {
      await _addNotification(data.assignedTo, 'assigned', id, `${currentUser?.name || 'Alguien'} te asigno la tarea "${old.title}"`);
    }

    emit('tasks:changed');
    emit('tasks:changed:' + old.system_id);
    emit('task:updated', id);
    return _toTaskCompat(t);
  }

  // ══════════════════════════════════════════════════════
  //  BLOCKS
  // ══════════════════════════════════════════════════════
  function getBlocks(status) { return status ? state.blocks.filter(b => b.status === status) : state.blocks; }
  function getBlocksForTask(taskId) { return state.blocks.filter(b => b.task_id === taskId); }

  async function createBlock(taskId, description, reportedBy) {
    const { data: b, error } = await supabase.from('blocks').insert({ task_id: taskId, description, reported_by: reportedBy, status: 'active', severity: 'high' }).select().single();
    if (error) { console.error(error); return null; }
    state.blocks.unshift(b);
    await updateTask(taskId, { status: 'blocked' });
    emit('blocks:changed');
    return b;
  }

  async function resolveBlock(blockId, resolvedBy, note) {
    const b = state.blocks.find(x => x.id === blockId);
    if (!b) return;
    const { error } = await supabase.from('blocks').update({ status: 'resolved', resolved_by: resolvedBy, resolution_note: note, resolved_at: new Date().toISOString() }).eq('id', blockId);
    if (error) { console.error(error); return; }

    const i = state.blocks.findIndex(x => x.id === blockId);
    if (i >= 0) state.blocks[i] = { ...b, status: 'resolved', resolved_by: resolvedBy, resolution_note: note, resolved_at: new Date().toISOString() };

    const stillBlocked = state.blocks.some(bl => bl.task_id === b.task_id && bl.status === 'active' && bl.id !== blockId);
    if (!stillBlocked) await updateTask(b.task_id, { status: 'in_progress' });
    await _logActivity(resolvedBy, 'resolved', b.task_id, `resolvio el bloqueo de "${getTaskById(b.task_id)?.title || ''}"`);
    emit('blocks:changed');
  }

  async function deleteBlock(blockId) {
    const b = state.blocks.find(x => x.id === blockId);
    if (!b) return;
    await supabase.from('blocks').delete().eq('id', blockId);
    state.blocks = state.blocks.filter(x => x.id !== blockId);
    const stillBlocked = state.blocks.some(bl => bl.task_id === b.task_id && bl.status === 'active');
    if (!stillBlocked && b.status === 'active') {
      const task = getTaskById(b.task_id);
      if (task && task.status === 'blocked') await updateTask(b.task_id, { status: 'in_progress' });
    }
    emit('blocks:changed');
  }

  // ══════════════════════════════════════════════════════
  //  COMMENTS
  // ══════════════════════════════════════════════════════
  function getComments(taskId) { return state.comments[taskId] || []; }

  async function addComment(taskId, userId, text) {
    const { data: c, error } = await supabase.from('comments').insert({ task_id: taskId, user_id: userId, text }).select().single();
    if (error) { console.error(error); return null; }
    if (!state.comments[taskId]) state.comments[taskId] = [];
    state.comments[taskId].push(c);

    await _logActivity(userId, 'commented', taskId, `comento en "${getTaskById(taskId)?.title || ''}"`);

    // @mention notifications
    const mentioned = _parseMentions(text);
    const senderName = _userName(userId);
    const task = getTaskById(taskId);
    for (const uid of mentioned) {
      if (uid !== userId) {
        await _addNotification(uid, 'mention', taskId, `${senderName} te menciono en "${task?.title || 'tarea'}"`);
      }
    }

    emit('comments:changed:' + taskId);
    return c;
  }

  // ══════════════════════════════════════════════════════
  //  NOTIFICATIONS
  // ══════════════════════════════════════════════════════
  function getNotifications(userId) { return state.notifications.filter(n => n.user_id === (userId || currentUser?.id)).slice(0, 50); }
  function getUnreadCount(userId)   { return getNotifications(userId).filter(n => !n.read).length; }

  async function markAllRead(userId) {
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    state.notifications.forEach(n => { if (n.user_id === userId) n.read = true; });
    emit('notifications:changed');
  }

  async function markRead(notifId) {
    await supabase.from('notifications').update({ read: true }).eq('id', notifId);
    const n = state.notifications.find(x => x.id === notifId);
    if (n) n.read = true;
    emit('notifications:changed');
  }

  async function _addNotification(userId, type, taskId, text) {
    const { data: n } = await supabase.from('notifications').insert({ user_id: userId, type, task_id: taskId, text }).select().single();
    if (n) state.notifications.unshift(n);
    emit('notifications:changed');
  }

  // ══════════════════════════════════════════════════════
  //  ACTIVITY
  // ══════════════════════════════════════════════════════
  function getActivity(limit = 20) { return state.activity.slice(0, limit); }

  async function _logActivity(userId, action, taskId, text) {
    const { data: a } = await supabase.from('activity').insert({ user_id: userId, action, task_id: taskId, text }).select().single();
    if (a) state.activity.unshift(a);
    emit('activity:changed');
  }

  // ══════════════════════════════════════════════════════
  //  BUDGETS
  // ══════════════════════════════════════════════════════
  function getMarketingBudgets() { return state.budgets; }

  async function updateMarketingBudget(systemId, data) {
    const b = state.budgets.find(x => x.system_id === systemId);
    if (!b) return;
    const payload = {};
    if (data.budget !== undefined) payload.budget = data.budget;
    if (data.spent !== undefined)  payload.spent = data.spent;
    await supabase.from('budgets').update(payload).eq('system_id', systemId);
    Object.assign(b, payload);
    emit('budgets:changed');
    return b;
  }

  // ══════════════════════════════════════════════════════
  //  COMPUTED
  // ══════════════════════════════════════════════════════
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
      doneToday: tasks.filter(t => t.status === 'done' && (t.updated_at||'').startsWith(today)).length,
      blocked:   state.blocks.filter(b => b.status === 'active').length,
      review:    tasks.filter(t => t.status === 'review').length,
    };
  }

  function getUserWorkload() {
    return state.users.map(u => {
      const assigned = state.tasks.filter(t => t.assigned_to === u.id && !['done','cancelled'].includes(t.status));
      const hours = assigned.reduce((s, t) => s + (t.estimated_hours || 0), 0);
      return { ...u, taskCount: assigned.length, hours, load: Math.min(Math.round(hours / 40 * 100), 100) };
    });
  }

  // ══════════════════════════════════════════════════════
  //  HELPERS — field name compatibility layer
  //  Views use old camelCase names (systemId, assignedTo)
  //  Supabase uses snake_case (system_id, assigned_to)
  //  These getters let views read with either convention.
  // ══════════════════════════════════════════════════════
  function _toTaskCompat(t) {
    if (!t) return t;
    // Create compatibility getters so views can use either naming
    Object.defineProperties(t, {
      systemId:       { get() { return this.system_id; },       enumerable: false },
      assignedTo:     { get() { return this.assigned_to; },     enumerable: false },
      createdBy:      { get() { return this.created_by; },      enumerable: false },
      startDate:      { get() { return this.start_date; },      enumerable: false },
      dueDate:        { get() { return this.due_date; },        enumerable: false },
      estimatedHours: { get() { return this.estimated_hours; }, enumerable: false },
      actualHours:    { get() { return this.actual_hours; },    enumerable: false },
      sortOrder:      { get() { return this.sort_order; },      enumerable: false },
    });
    return t;
  }

  function _addCompatToAll() {
    state.tasks.forEach(t => _toTaskCompat(t));
    state.blocks.forEach(b => {
      Object.defineProperties(b, {
        taskId:     { get() { return this.task_id; },     enumerable: false },
        reportedBy: { get() { return this.reported_by; }, enumerable: false },
        resolvedBy: { get() { return this.resolved_by; }, enumerable: false },
        resolutionNote: { get() { return this.resolution_note; }, enumerable: false },
        createdAt:  { get() { return this.created_at; },  enumerable: false },
        resolvedAt: { get() { return this.resolved_at; }, enumerable: false },
      });
    });
    // Comments
    Object.values(state.comments).flat().forEach(c => {
      Object.defineProperties(c, {
        userId:    { get() { return this.user_id; },    enumerable: false },
        createdAt: { get() { return this.created_at; }, enumerable: false },
      });
    });
    // Activity & Notifications
    state.activity.forEach(a => {
      Object.defineProperties(a, {
        userId:    { get() { return this.user_id; },    enumerable: false },
        taskId:    { get() { return this.task_id; },    enumerable: false },
        createdAt: { get() { return this.created_at; }, enumerable: false },
      });
    });
    state.notifications.forEach(n => {
      Object.defineProperties(n, {
        userId:    { get() { return this.user_id; },    enumerable: false },
        taskId:    { get() { return this.task_id; },    enumerable: false },
        createdAt: { get() { return this.created_at; }, enumerable: false },
      });
    });
    // Budgets
    state.budgets.forEach(b => {
      Object.defineProperty(b, 'systemId', { get() { return this.system_id; }, enumerable: false });
    });
  }

  function _userName(userId) {
    return state.users.find(u => u.id === userId)?.name || 'Alguien';
  }

  function _parseMentions(text) {
    const mentioned = [];
    state.users.forEach(u => {
      const firstName = u.name.split(' ')[0];
      if (text.includes('@' + firstName) || text.includes('@' + u.name)) mentioned.push(u.id);
    });
    return mentioned;
  }

  // ══════════════════════════════════════════════════════
  //  PUBLIC API
  // ══════════════════════════════════════════════════════
  return {
    on, off,
    // Boot
    async load() {
      await loadFromSupabase();
      _addCompatToAll();
      subscribeRealtime();
    },
    // Auth
    getCurrentUser, login, logout, restoreSession,
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
    // Budgets
    getMarketingBudgets, updateMarketingBudget,
    // Users
    getUsers() { return state.users; },
    getUserById(id) { return state.users.find(u => u.id === id); },
  };
})();
