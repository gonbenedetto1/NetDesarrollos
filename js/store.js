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
    leads:         [],
    leadUpdates:   {},  // { leadId: [updates] }
    leadGroups:    [],
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
    const [profiles, systems, tasks, blocks, comments, activity, budgets, notifs, leads, leadUpdates, leadGroups] = await Promise.all([
      sb.from('profiles').select('*'),
      sb.from('systems').select('*').order('created_at'),
      sb.from('tasks').select('*').order('created_at'),
      sb.from('blocks').select('*').order('created_at', { ascending: false }),
      sb.from('comments').select('*').order('created_at'),
      sb.from('activity').select('*').order('created_at', { ascending: false }).limit(200),
      sb.from('budgets').select('*'),
      sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(50),
      sb.from('leads').select('*').order('created_at', { ascending: false }),
      sb.from('lead_updates').select('*').order('created_at', { ascending: false }),
      sb.from('lead_groups').select('*').order('created_at', { ascending: false }),
    ]);

    state.users    = profiles.data || [];
    state.systems  = systems.data  || [];
    state.tasks    = tasks.data    || [];
    state.blocks   = blocks.data   || [];
    state.activity = activity.data || [];
    state.budgets  = budgets.data  || [];
    state.notifications = notifs.data || [];
    state.leads    = leads.data    || [];
    state.leadGroups = leadGroups.data || [];

    // Group comments by task_id
    state.comments = {};
    (comments.data || []).forEach(c => {
      if (!state.comments[c.task_id]) state.comments[c.task_id] = [];
      state.comments[c.task_id].push(c);
    });

    // Group lead updates by lead_id
    state.leadUpdates = {};
    (leadUpdates.data || []).forEach(u => {
      if (!state.leadUpdates[u.lead_id]) state.leadUpdates[u.lead_id] = [];
      state.leadUpdates[u.lead_id].push(u);
    });
  }

  // ══════════════════════════════════════════════════════
  //  REALTIME — subscribe to changes from other users
  // ══════════════════════════════════════════════════════
  function subscribeRealtime() {
    sb.channel('db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => refreshTable('tasks'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' }, () => refreshTable('blocks'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => refreshTable('comments'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activity' }, () => refreshTable('activity'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => refreshTable('notifications'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'systems' }, () => refreshTable('systems'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budgets' }, () => refreshTable('budgets'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => refreshTable('leads'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_updates' }, () => refreshTable('lead_updates'))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_groups' }, () => refreshTable('lead_groups'))
      .subscribe();
  }

  async function refreshTable(table) {
    if (table === 'comments') {
      const { data } = await sb.from('comments').select('*').order('created_at');
      state.comments = {};
      (data || []).forEach(c => {
        if (!state.comments[c.task_id]) state.comments[c.task_id] = [];
        state.comments[c.task_id].push(c);
      });
      _addCompatToAll();
      emit('comments:changed');
    } else if (table === 'notifications') {
      const { data } = await sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(50);
      state.notifications = data || [];
      _addCompatToAll();
      emit('notifications:changed');
    } else if (table === 'activity') {
      const { data } = await sb.from('activity').select('*').order('created_at', { ascending: false }).limit(200);
      state.activity = data || [];
      _addCompatToAll();
      emit('activity:changed');
    } else if (table === 'leads') {
      const { data } = await sb.from('leads').select('*').order('created_at', { ascending: false });
      state.leads = data || [];
      _addCompatToAll();
      emit('leads:changed');
    } else if (table === 'lead_groups') {
      const { data } = await sb.from('lead_groups').select('*').order('created_at', { ascending: false });
      state.leadGroups = data || [];
      _addCompatToAll();
      emit('lead_groups:changed');
    } else if (table === 'lead_updates') {
      const { data } = await sb.from('lead_updates').select('*').order('created_at', { ascending: false });
      state.leadUpdates = {};
      (data || []).forEach(u => {
        if (!state.leadUpdates[u.lead_id]) state.leadUpdates[u.lead_id] = [];
        state.leadUpdates[u.lead_id].push(u);
      });
      _addCompatToAll();
      emit('lead_updates:changed');
    } else {
      const { data } = await sb.from(table).select('*').order('created_at');
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
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: error.message };
    // Fetch profile
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    currentUser = profile ? { ...profile, email: data.user.email } : { id: data.user.id, name: email.split('@')[0], email: data.user.email, initials: email.slice(0,2).toUpperCase(), role: 'developer', color: '#0071E3', bg: '#EBF2FD' };
    return { ok: true, user: currentUser };
  }

  async function restoreSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    currentUser = profile ? { ...profile, email: session.user.email } : null;
    return currentUser;
  }

  async function logout() {
    await sb.auth.signOut();
    currentUser = null;
  }

  // ══════════════════════════════════════════════════════
  //  SYSTEMS — read from cache, write to Supabase
  // ══════════════════════════════════════════════════════
  function getSystems() { return state.systems; }
  function getSystemById(id) { return state.systems.find(s => s.id === id); }

  async function createSystem(data) {
    const { data: s, error } = await sb.from('systems').insert({ name: data.name, description: data.description || '', color: data.color || '#0071E3', members: data.members || [currentUser?.id] }).select().single();
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
    const { data: s, error } = await sb.from('systems').update(payload).eq('id', id).select().single();
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
    const { data: t, error } = await sb.from('tasks').insert(row).select().single();
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

    const { data: t, error } = await sb.from('tasks').update(payload).eq('id', id).select().single();
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
    const { data: b, error } = await sb.from('blocks').insert({ task_id: taskId, description, reported_by: reportedBy, status: 'active', severity: 'high' }).select().single();
    if (error) { console.error(error); return null; }
    state.blocks.unshift(b);
    await updateTask(taskId, { status: 'blocked' });
    emit('blocks:changed');
    return b;
  }

  async function resolveBlock(blockId, resolvedBy, note) {
    const b = state.blocks.find(x => x.id === blockId);
    if (!b) return;
    const { error } = await sb.from('blocks').update({ status: 'resolved', resolved_by: resolvedBy, resolution_note: note, resolved_at: new Date().toISOString() }).eq('id', blockId);
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
    await sb.from('blocks').delete().eq('id', blockId);
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
    const { data: c, error } = await sb.from('comments').insert({ task_id: taskId, user_id: userId, text }).select().single();
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
    await sb.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    state.notifications.forEach(n => { if (n.user_id === userId) n.read = true; });
    emit('notifications:changed');
  }

  async function markRead(notifId) {
    await sb.from('notifications').update({ read: true }).eq('id', notifId);
    const n = state.notifications.find(x => x.id === notifId);
    if (n) n.read = true;
    emit('notifications:changed');
  }

  async function _addNotification(userId, type, taskId, text) {
    const { data: n } = await sb.from('notifications').insert({ user_id: userId, type, task_id: taskId, text }).select().single();
    if (n) state.notifications.unshift(n);
    emit('notifications:changed');
  }

  // ══════════════════════════════════════════════════════
  //  ACTIVITY
  // ══════════════════════════════════════════════════════
  function getActivity(limit = 20) { return state.activity.slice(0, limit); }

  async function _logActivity(userId, action, taskId, text) {
    const { data: a } = await sb.from('activity').insert({ user_id: userId, action, task_id: taskId, text }).select().single();
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
    await sb.from('budgets').update(payload).eq('system_id', systemId);
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
    // Leads
    state.leads.forEach(l => _toLeadCompat(l));
    // Lead updates
    Object.values(state.leadUpdates).flat().forEach(u => {
      Object.defineProperties(u, {
        leadId:    { get() { return this.lead_id; },    enumerable: false, configurable: true },
        userId:    { get() { return this.user_id; },    enumerable: false, configurable: true },
        createdAt: { get() { return this.created_at; }, enumerable: false, configurable: true },
      });
    });
  }

  function _toLeadCompat(l) {
    if (!l) return l;
    try {
      Object.defineProperties(l, {
        systemId:        { get() { return this.system_id; },        enumerable: false, configurable: true },
        groupId:         { get() { return this.group_id; },         enumerable: false, configurable: true },
        ownerId:         { get() { return this.owner_id; },         enumerable: false, configurable: true },
        nextActionDate:  { get() { return this.next_action_date; }, enumerable: false, configurable: true },
        nextAction:      { get() { return this.next_action; },      enumerable: false, configurable: true },
        lostReason:      { get() { return this.lost_reason; },      enumerable: false, configurable: true },
        createdBy:       { get() { return this.created_by; },       enumerable: false, configurable: true },
        createdAt:       { get() { return this.created_at; },       enumerable: false, configurable: true },
        updatedAt:       { get() { return this.updated_at; },       enumerable: false, configurable: true },
        wonAt:           { get() { return this.won_at; },           enumerable: false, configurable: true },
        lostAt:          { get() { return this.lost_at; },          enumerable: false, configurable: true },
      });
    } catch(e) {}
    return l;
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
  //  LEAD GROUPS (convenios)
  // ══════════════════════════════════════════════════════
  function getLeadGroups() { return state.leadGroups; }
  function getLeadGroupById(id) { return state.leadGroups.find(g => g.id === id); }

  async function createLeadGroup(data) {
    const row = {
      name:        data.name,
      description: data.description || '',
      color:       data.color || '#0071E3',
      created_by:  currentUser?.id,
    };
    const { data: g, error } = await sb.from('lead_groups').insert(row).select().single();
    if (error) { Utils.toast('Error al crear convenio: ' + error.message, 'error'); return null; }
    state.leadGroups.unshift(g);
    emit('lead_groups:changed');
    return g;
  }

  async function updateLeadGroup(id, data) {
    const { data: g, error } = await sb.from('lead_groups').update(data).eq('id', id).select().single();
    if (error) { Utils.toast('Error al actualizar: ' + error.message, 'error'); return; }
    const i = state.leadGroups.findIndex(x => x.id === id);
    if (i >= 0) state.leadGroups[i] = g;
    emit('lead_groups:changed');
    return g;
  }

  async function deleteLeadGroup(id) {
    const { error } = await sb.from('lead_groups').delete().eq('id', id);
    if (error) { Utils.toast('Error al eliminar: ' + error.message, 'error'); return; }
    state.leadGroups = state.leadGroups.filter(g => g.id !== id);
    emit('lead_groups:changed');
    emit('leads:changed'); // leads referencing this group get group_id = null
  }

  function getGroupStats(groupId) {
    const leads = state.leads.filter(l => l.group_id === groupId);
    return {
      total:  leads.length,
      open:   leads.filter(l => !['won','lost'].includes(l.status)).length,
      won:    leads.filter(l => l.status === 'won').length,
      lost:   leads.filter(l => l.status === 'lost').length,
      new:    leads.filter(l => l.status === 'new').length,
    };
  }

  // ══════════════════════════════════════════════════════
  //  LEADS
  // ══════════════════════════════════════════════════════
  const LEAD_STAGES = ['new','contacted','interested','won','lost'];

  function getLeads(filter = {}) {
    let leads = state.leads;
    if (filter.status)   leads = leads.filter(l => l.status === filter.status);
    if (filter.ownerId)  leads = leads.filter(l => l.owner_id === filter.ownerId);
    if (filter.systemId) leads = leads.filter(l => l.system_id === filter.systemId);
    if (filter.groupId)  leads = leads.filter(l => l.group_id === filter.groupId);
    if (filter.source)   leads = leads.filter(l => l.source === filter.source);
    if (filter.search) {
      const q = filter.search.toLowerCase();
      leads = leads.filter(l =>
        (l.name || '').toLowerCase().includes(q) ||
        (l.company || '').toLowerCase().includes(q) ||
        (l.email || '').toLowerCase().includes(q)
      );
    }
    return leads;
  }

  function getLeadById(id) { return state.leads.find(l => l.id === id); }
  function getLeadUpdates(leadId) { return state.leadUpdates[leadId] || []; }

  async function createLead(data) {
    const row = {
      name:             data.name,
      company:          data.company || '',
      email:            data.email || '',
      phone:            data.phone || '',
      status:           data.status || 'new',
      source:           data.source || 'other',
      system_id:        data.systemId || null,
      group_id:         data.groupId || null,
      owner_id:         data.ownerId || null,
      next_action_date: data.nextActionDate || null,
      next_action:      data.nextAction || '',
      notes:            data.notes || '',
      created_by:       currentUser?.id,
    };
    const { data: l, error } = await sb.from('leads').insert(row).select().single();
    if (error) { Utils.toast('Error al crear lead: ' + error.message, 'error'); return null; }
    const lead = _toLeadCompat(l);
    state.leads.unshift(lead);

    // Initial status_change update
    await _addLeadUpdateInternal(lead.id, currentUser?.id, 'status_change', `creo el lead (etapa: ${_leadStatusLabel(lead.status)})`);

    // Notify owner if not creator
    if (lead.owner_id && lead.owner_id !== currentUser?.id) {
      await _addNotification(lead.owner_id, 'assigned', null, `${_userName(currentUser?.id)} te asigno el lead "${lead.name}"`);
    }

    emit('leads:changed');
    return lead;
  }

  async function updateLead(id, data) {
    const old = getLeadById(id);
    if (!old) return;
    const payload = { updated_at: new Date().toISOString() };
    const keyMap = {
      systemId: 'system_id', groupId: 'group_id', ownerId: 'owner_id',
      nextActionDate: 'next_action_date', nextAction: 'next_action', lostReason: 'lost_reason',
    };
    Object.keys(data).forEach(k => {
      const dbKey = keyMap[k] || k;
      payload[dbKey] = data[k];
    });

    // Track status change
    const statusChanged = data.status && data.status !== old.status;
    if (statusChanged) {
      if (data.status === 'won')  payload.won_at  = new Date().toISOString();
      if (data.status === 'lost') payload.lost_at = new Date().toISOString();
    }

    const { data: l, error } = await sb.from('leads').update(payload).eq('id', id).select().single();
    if (error) { Utils.toast('Error al actualizar: ' + error.message, 'error'); return; }

    // Update local state
    const i = state.leads.findIndex(x => x.id === id);
    if (i >= 0) { state.leads[i] = _toLeadCompat(l); }

    // Log status change as an update entry
    if (statusChanged) {
      const text = data.status === 'won' ? `marco como CERRADO ✓`
                 : data.status === 'lost' ? `marco como PERDIDO${data.lostReason ? ' — ' + data.lostReason : ''}`
                 : `movio a etapa "${_leadStatusLabel(data.status)}"`;
      await _addLeadUpdateInternal(id, currentUser?.id, 'status_change', text);
    }

    // Notify new owner
    if (data.ownerId && data.ownerId !== old.owner_id && data.ownerId !== currentUser?.id) {
      await _addNotification(data.ownerId, 'assigned', null, `${_userName(currentUser?.id)} te asigno el lead "${old.name}"`);
    }

    emit('leads:changed');
    return state.leads[i];
  }

  async function deleteLead(id) {
    const { error } = await sb.from('leads').delete().eq('id', id);
    if (error) { Utils.toast('Error al eliminar: ' + error.message, 'error'); return; }
    state.leads = state.leads.filter(l => l.id !== id);
    delete state.leadUpdates[id];
    emit('leads:changed');
  }

  async function addLeadUpdate(leadId, type, text) {
    if (!currentUser) return;
    return _addLeadUpdateInternal(leadId, currentUser.id, type, text);
  }

  async function _addLeadUpdateInternal(leadId, userId, type, text) {
    const { data: u, error } = await sb.from('lead_updates').insert({
      lead_id: leadId, user_id: userId, type, text,
    }).select().single();
    if (error) return null;
    if (!state.leadUpdates[leadId]) state.leadUpdates[leadId] = [];
    state.leadUpdates[leadId].unshift(u);
    _addCompatToAll();
    emit('lead_updates:changed');
    return u;
  }

  function _leadStatusLabel(s) {
    return { new:'Nuevo', contacted:'Contactado', interested:'Interesado / En seguimiento', won:'Cerrado', lost:'Perdido' }[s] || s;
  }

  function _weekStart() {
    // ISO week — Monday
    const d = new Date();
    const day = d.getDay(); // 0 (Sun) .. 6 (Sat)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  function getLeadKPIs() {
    const open = state.leads.filter(l => !['won','lost'].includes(l.status));
    const won = state.leads.filter(l => l.status === 'won');
    const lost = state.leads.filter(l => l.status === 'lost');

    const now = new Date();
    const monthStartIso = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const weekStartIso = _weekStart().toISOString();

    const wonThisMonth  = won.filter(l => l.won_at && l.won_at >= monthStartIso);
    const wonThisWeek   = won.filter(l => l.won_at && l.won_at >= weekStartIso);
    const lostThisWeek  = lost.filter(l => l.lost_at && l.lost_at >= weekStartIso);
    const newThisWeek   = state.leads.filter(l => l.created_at >= weekStartIso);
    const newThisMonth  = state.leads.filter(l => l.created_at >= monthStartIso);

    // Actions (updates) this week
    const allUpdates = Object.values(state.leadUpdates).flat();
    const actionsThisWeek = allUpdates.filter(u => u.created_at >= weekStartIso && u.type !== 'status_change');

    const conversionRate = (won.length + lost.length) > 0
      ? Math.round(won.length / (won.length + lost.length) * 100) : 0;

    return {
      openCount: open.length,
      totalLeads: state.leads.length,
      wonCount: won.length,
      lostCount: lost.length,
      wonThisMonthCount: wonThisMonth.length,
      wonThisWeekCount: wonThisWeek.length,
      lostThisWeekCount: lostThisWeek.length,
      newThisMonthCount: newThisMonth.length,
      newThisWeekCount: newThisWeek.length,
      actionsThisWeekCount: actionsThisWeek.length,
      conversionRate,
    };
  }

  function getLeadFunnel() {
    return LEAD_STAGES.map(s => {
      const leads = state.leads.filter(l => l.status === s);
      return {
        status: s,
        label: _leadStatusLabel(s),
        count: leads.length,
      };
    });
  }

  function getWeeklyReport() {
    const weekStartIso = _weekStart().toISOString();
    const allUpdates = Object.values(state.leadUpdates).flat();
    const updates = allUpdates.filter(u => u.created_at >= weekStartIso);

    // Por tipo
    const byType = {};
    updates.forEach(u => { byType[u.type] = (byType[u.type] || 0) + 1; });

    // Por usuario
    const byUser = {};
    updates.forEach(u => { byUser[u.user_id] = (byUser[u.user_id] || 0) + 1; });

    // Por grupo (via lead)
    const byGroup = {};
    updates.forEach(u => {
      const lead = state.leads.find(l => l.id === u.lead_id);
      const gid = lead?.group_id || 'none';
      byGroup[gid] = (byGroup[gid] || 0) + 1;
    });

    return { updates, byType, byUser, byGroup, weekStart: _weekStart() };
  }

  function getLeadsWithOverdueFollowup() {
    const today = new Date().toISOString().split('T')[0];
    return state.leads.filter(l =>
      !['won','lost'].includes(l.status) &&
      l.next_action_date && l.next_action_date < today
    );
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
    // Leads
    getLeads, getLeadById, getLeadUpdates, createLead, updateLead, deleteLead, addLeadUpdate,
    getLeadKPIs, getLeadFunnel, getLeadsWithOverdueFollowup, getWeeklyReport,
    leadStatusLabel: _leadStatusLabel,
    // Lead groups (convenios)
    getLeadGroups, getLeadGroupById, createLeadGroup, updateLeadGroup, deleteLeadGroup, getGroupStats,
    // Users
    getUsers() { return state.users; },
    getUserById(id) { return state.users.find(u => u.id === id); },
  };
})();
