// ═══════════════════════════════════════════════════════
//  DATA.JS — Sistema NET — Datos reales
// ═══════════════════════════════════════════════════════

function d(offset) {
  const dt = new Date(); dt.setDate(dt.getDate() + offset);
  return dt.toISOString().split('T')[0];
}
function ts(hoursAgo) {
  const dt = new Date(); dt.setHours(dt.getHours() - hoursAgo);
  return dt.toISOString();
}

// ── Users ────────────────────────────────────────────
const USERS = [
  { id:'u1', name:'Miguel Benedetto',  initials:'MB', role:'lead',      color:'#0071E3', bg:'#EBF2FD', email:'miguelbenedetto22@gmail.com', password:'miguel' },
  { id:'u2', name:'Gonzalo Benedetto', initials:'GB', role:'marketing',  color:'#28C76F', bg:'#E8F9EE', email:'gonbenedetto1@gmail.com',     password:'gonzalo' },
  { id:'u3', name:'Camilo Benedetto',  initials:'CB', role:'developer', color:'#BF5AF2', bg:'#F5EAFB', email:'cbenedetto39@gmail.com',      password:'camilo' },
  { id:'u4', name:'Joaquin Benedetto', initials:'JB', role:'gvamax',    color:'#FF9F0A', bg:'#FFF3DC', email:'joanoteolvides@gmail.com',    password:'joaquin' },
];

// ── Systems ──────────────────────────────────────────
const SYSTEMS = [
  {
    id:'s1', name:'GVAMax',
    description:'CRM integral para inmobiliarias: gestion de propiedades, clientes, busquedas, alertas, portal web y estadisticas.',
    color:'#0071E3', members:['u1','u2','u3','u4'],
  },
  {
    id:'s2', name:'Sistema de Consorcios',
    description:'Administracion de consorcios: expensas, proveedores, asambleas, comunicaciones y estados de cuenta por unidad.',
    color:'#BF5AF2', members:['u1','u3'],
  },
  {
    id:'s3', name:'Sistema de Administracion',
    description:'Configuracion global, usuarios, permisos, facturacion, suscripciones y auditoria del sistema.',
    color:'#FF9F0A', members:['u1','u3'],
  },
  {
    id:'s4', name:'NET Desarrollos',
    description:'Tareas internas de la empresa: planificacion, comunicacion, marketing, procesos y mejora continua.',
    color:'#FF6B6B', members:['u1','u2','u3'],
  },
];

// ── Marketing budgets ────────────────────────────────
const MARKETING_BUDGETS = [
  { systemId:'s1', name:'GVAMax — Ads & Landing',       budget:80000,  spent:52000, period:'2026' },
  { systemId:'s2', name:'Consorcios — Branding',         budget:30000,  spent:9000,  period:'2026' },
  { systemId:'s3', name:'Admin — Comunicacion interna',   budget:15000,  spent:4500,  period:'2026' },
  { systemId:'s4', name:'NET — Marketing general',        budget:50000,  spent:31000, period:'2026' },
];

// ── Tasks ────────────────────────────────────────────
const TASKS = [];

// ── Blocks ───────────────────────────────────────────
const BLOCKS = [];

// ── Comments ─────────────────────────────────────────
const COMMENTS = {};

// ── Activity ─────────────────────────────────────────
const ACTIVITY = [];

// ── Notifications (vacias al inicio, se generan en runtime) ──
const NOTIFICATIONS = [];

// ── Helpers ──────────────────────────────────────────
function getTasksBySystem(systemId) { return TASKS.filter(t => t.systemId === systemId); }
function getSystemById(id)  { return SYSTEMS.find(s => s.id === id); }
function getUserById(id)    { return USERS.find(u => u.id === id); }
function getTaskById(id)    { return TASKS.find(t => t.id === id); }
