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
const TASKS = [
  // GVAMax
  { id:'t1',  systemId:'s1', title:'Modulo de busquedas avanzadas con filtros por zona',          description:'Implementar filtros avanzados por zona, precio, tipo de propiedad y superficie. Incluir paginacion y ordenamiento en la API REST.', status:'in_progress', priority:'high',     assignedTo:'u3', createdBy:'u1', startDate:d(-5),  dueDate:d(3),   estimatedHours:16, actualHours:9,  progress:65, order:1, tags:['backend','api'] },
  { id:'t2',  systemId:'s1', title:'Landing page GVAMax — rediseno completo',                     description:'Redisenar la landing page principal de GVAMax con nuevo branding, testimonios de clientes y seccion de funcionalidades.',             status:'in_progress', priority:'high',     assignedTo:'u2', createdBy:'u1', startDate:d(-7),  dueDate:d(5),   estimatedHours:20, actualHours:12, progress:55, order:2, tags:['marketing','frontend'] },
  { id:'t3',  systemId:'s1', title:'Migracion de base de datos a PostgreSQL',                     description:'Migrar schema de MySQL a PostgreSQL. Nueva normalizacion de tablas de propiedades y ajuste de foreign keys.',                        status:'blocked',    priority:'critical', assignedTo:'u3', createdBy:'u1', startDate:d(-3),  dueDate:d(1),   estimatedHours:12, actualHours:7,  progress:40, order:3, tags:['backend','database'] },
  { id:'t4',  systemId:'s1', title:'Dashboard de estadisticas para agentes inmobiliarios',        description:'Panel con metricas: propiedades activas, visitas al portal, consultas recibidas y tasa de cierre.',                                   status:'review',     priority:'medium',   assignedTo:'u3', createdBy:'u1', startDate:d(-8),  dueDate:d(5),   estimatedHours:14, actualHours:12, progress:90, order:4, tags:['frontend','charts'] },
  { id:'t5',  systemId:'s1', title:'Integracion con portales externos (ZonaProp, Argenprop)',     description:'Sincronizacion automatica de listados con ZonaProp y Argenprop via APIs.',                                                            status:'pending',    priority:'medium',   assignedTo:'u3', createdBy:'u1', startDate:d(5),   dueDate:d(18),  estimatedHours:18, actualHours:0,  progress:0,  order:5, tags:['integration'] },
  { id:'t6',  systemId:'s1', title:'Campana de email marketing — lanzamiento nuevas features',    description:'Disenar y ejecutar campana de email a clientes actuales presentando las nuevas funcionalidades del CRM.',                              status:'done',       priority:'high',     assignedTo:'u2', createdBy:'u1', startDate:d(-15), dueDate:d(-3),  estimatedHours:10, actualHours:9,  progress:100,order:6, tags:['marketing'] },

  // Sistema de Consorcios
  { id:'t7',  systemId:'s2', title:'Modulo de expensas — vista del propietario',                  description:'Dashboard del propietario: detalle mensual, historial de pagos y descarga de liquidaciones en PDF.',                                  status:'in_progress',priority:'high',     assignedTo:'u3', createdBy:'u1', startDate:d(-7),  dueDate:d(6),   estimatedHours:20, actualHours:6,  progress:35, order:1, tags:['frontend'] },
  { id:'t8',  systemId:'s2', title:'Calculo automatico de expensas por unidad',                   description:'Motor que distribuye gastos comunes segun el coeficiente de cada unidad y genera liquidacion mensual.',                                status:'blocked',    priority:'high',     assignedTo:'u3', createdBy:'u1', startDate:d(-4),  dueDate:d(2),   estimatedHours:16, actualHours:5,  progress:30, order:2, tags:['backend','core'] },
  { id:'t9',  systemId:'s2', title:'Gestion de proveedores y contratos',                          description:'CRUD de proveedores con contratos, vencimientos, contactos e historial de servicios.',                                                status:'pending',    priority:'medium',   assignedTo:'u3', createdBy:'u1', startDate:d(8),   dueDate:d(22),  estimatedHours:12, actualHours:0,  progress:0,  order:3, tags:['frontend','backend'] },

  // Sistema de Administracion
  { id:'t10', systemId:'s3', title:'Sistema de roles y permisos',                                  description:'RBAC completo: definicion de roles, permisos por modulo y auditoria de accesos.',                                                    status:'in_progress',priority:'medium',   assignedTo:'u3', createdBy:'u1', startDate:d(-20), dueDate:d(15),  estimatedHours:18, actualHours:6,  progress:30, order:1, tags:['backend','security'] },
  { id:'t11', systemId:'s3', title:'Panel de facturacion y suscripciones',                         description:'Gestion de planes, ciclos de facturacion, metodos de pago y generacion de facturas electronicas.',                                   status:'pending',    priority:'high',     assignedTo:'u3', createdBy:'u1', startDate:d(10),  dueDate:d(30),  estimatedHours:24, actualHours:0,  progress:0,  order:2, tags:['backend','billing'] },

  // NET Desarrollos
  { id:'t12', systemId:'s4', title:'Definir roadmap Q2 2026 de productos',                        description:'Reunir al equipo, priorizar features de GVAMax y Consorcios, y armar el roadmap del trimestre.',                                      status:'review',     priority:'high',     assignedTo:'u1', createdBy:'u1', startDate:d(-10), dueDate:d(2),   estimatedHours:8,  actualHours:6,  progress:85, order:1, tags:['planificacion'] },
  { id:'t13', systemId:'s4', title:'Contenido redes sociales — plan mensual abril',               description:'Crear calendario de contenido para Instagram, LinkedIn y Twitter. Incluir copy, imagenes y horarios de publicacion.',                  status:'in_progress',priority:'medium',   assignedTo:'u2', createdBy:'u1', startDate:d(-5),  dueDate:d(8),   estimatedHours:12, actualHours:4,  progress:40, order:2, tags:['marketing','contenido'] },
  { id:'t14', systemId:'s4', title:'Documentacion tecnica de APIs de GVAMax',                     description:'Documentar todos los endpoints REST de GVAMax en formato OpenAPI/Swagger para uso interno y futuras integraciones.',                   status:'pending',    priority:'low',      assignedTo:'u3', createdBy:'u1', startDate:d(12),  dueDate:d(28),  estimatedHours:14, actualHours:0,  progress:0,  order:3, tags:['documentacion'] },
  { id:'t15', systemId:'s4', title:'Onboarding de nuevos clientes — proceso automatizado',        description:'Disenar flujo de onboarding automatico: bienvenida, configuracion inicial, tutorial interactivo y seguimiento.',                      status:'done',       priority:'high',     assignedTo:'u2', createdBy:'u1', startDate:d(-20), dueDate:d(-8),  estimatedHours:16, actualHours:18, progress:100,order:4, tags:['proceso','marketing'] },
];

// ── Blocks ───────────────────────────────────────────
const BLOCKS = [
  { id:'b1', taskId:'t3',  reportedBy:'u3', resolvedBy:null, description:'Error NULL constraint en foreign key al ejecutar ALTER TABLE propiedades. El rollback se completo pero la migracion no puede continuar sin resolver la dependencia con la tabla contactos.', resolutionNote:null, status:'active',   severity:'critical', createdAt:ts(5),   resolvedAt:null },
  { id:'b2', taskId:'t8',  reportedBy:'u3', resolvedBy:null, description:'El motor distribuye correctamente pero el coeficiente de las unidades de planta baja no esta definido en la tabla unidades. Necesito que alguien complete esos registros.',                   resolutionNote:null, status:'active',   severity:'high',     createdAt:ts(1),   resolvedAt:null },
  { id:'b3', taskId:'t1',  reportedBy:'u3', resolvedBy:'u1', description:'API de geolocalización de zonas requiere API key de Google Maps que no teniamos configurada.',                                                                                                resolutionNote:'Se agrego la API key de Google Maps al .env de produccion.', status:'resolved', severity:'high', createdAt:ts(48), resolvedAt:ts(44) },
];

// ── Comments ─────────────────────────────────────────
const COMMENTS = {
  't3':  [
    { id:'c1', userId:'u3', text:'Ejecute la migracion en staging y falla: ERROR 23502 - null value in column "contacto_id". El problema esta en los registros legacy sin contacto asociado.', createdAt:ts(5.2) },
    { id:'c2', userId:'u1', text:'@Camilo cuantos registros legacy son? Si son pocos los limpiamos manualmente.', createdAt:ts(4.5) },
    { id:'c3', userId:'u3', text:'Son 847. Demasiados para manual. Voy a hacer un script de limpieza pero necesito validar que hacer con los que no tienen contacto.', createdAt:ts(4.1) },
    { id:'c4', userId:'u1', text:'Usar contacto generico ID=0. Ya lo agregue a la tabla. Cuando tengas el script lo revisamos juntos.', createdAt:ts(3.8) },
  ],
  't8': [
    { id:'c5', userId:'u3', text:'El calculo de coeficientes funciona bien para pisos superiores, pero planta baja no tiene coeficiente cargado en la base.', createdAt:ts(1.5) },
    { id:'c6', userId:'u1', text:'@Camilo hable con el administrador del consorcio de prueba, manana nos pasan los coeficientes faltantes.', createdAt:ts(0.8) },
  ],
  't4': [
    { id:'c7', userId:'u3', text:'Dashboard listo con Chart.js. Graficos de barras para propiedades activas y linea temporal para consultas. Listo para revision.', createdAt:ts(6) },
    { id:'c8', userId:'u1', text:'@Camilo se ve muy bien. Revisalo en mobile tambien, ahi suelen romper los charts.', createdAt:ts(5) },
  ],
  't12': [
    { id:'c9', userId:'u1', text:'Armé un borrador del roadmap. Prioridades: completar migracion PostgreSQL, lanzar modulo expensas y cerrar integracion portales.', createdAt:ts(12) },
    { id:'c10', userId:'u2', text:'Desde marketing, seria clave tener la integracion con ZonaProp antes de junio para la campana de verano.', createdAt:ts(10) },
    { id:'c11', userId:'u3', text:'De acuerdo. La migracion a PostgreSQL es bloqueante para varias features. Propongo priorizarla.', createdAt:ts(8) },
  ],
};

// ── Activity ─────────────────────────────────────────
const ACTIVITY = [
  { id:'a1',  userId:'u3', action:'blocked',          taskId:'t3',  text:'marco como BLOQUEADA "Migracion de base de datos"',               createdAt:ts(5)  },
  { id:'a2',  userId:'u3', action:'blocked',          taskId:'t8',  text:'marco como BLOQUEADA "Calculo automatico de expensas"',            createdAt:ts(1)  },
  { id:'a3',  userId:'u3', action:'progress_updated', taskId:'t7',  text:'actualizo progreso a 35% en "Modulo de expensas"',               createdAt:ts(3)  },
  { id:'a4',  userId:'u3', action:'progress_updated', taskId:'t4',  text:'actualizo progreso a 90% en "Dashboard de estadisticas"',         createdAt:ts(4)  },
  { id:'a5',  userId:'u2', action:'progress_updated', taskId:'t2',  text:'actualizo progreso a 55% en "Landing page GVAMax"',              createdAt:ts(6)  },
  { id:'a6',  userId:'u1', action:'commented',        taskId:'t3',  text:'respondio en "Migracion de base de datos"',                       createdAt:ts(3.8) },
  { id:'a7',  userId:'u3', action:'commented',        taskId:'t4',  text:'comento en "Dashboard de estadisticas"',                          createdAt:ts(6)  },
  { id:'a8',  userId:'u2', action:'done',             taskId:'t6',  text:'finalizo "Campana de email marketing"',                           createdAt:ts(8)  },
  { id:'a9',  userId:'u2', action:'done',             taskId:'t15', text:'finalizo "Onboarding de nuevos clientes"',                        createdAt:ts(18) },
  { id:'a10', userId:'u1', action:'created',          taskId:'t14', text:'creo "Documentacion tecnica de APIs"',                            createdAt:ts(24) },
  { id:'a11', userId:'u2', action:'progress_updated', taskId:'t13', text:'actualizo progreso a 40% en "Contenido redes sociales"',          createdAt:ts(7)  },
  { id:'a12', userId:'u1', action:'status_changed',   taskId:'t12', text:'puso en revision "Definir roadmap Q2 2026"',                      createdAt:ts(10) },
];

// ── Notifications (vacias al inicio, se generan en runtime) ──
const NOTIFICATIONS = [];

// ── Helpers ──────────────────────────────────────────
function getTasksBySystem(systemId) { return TASKS.filter(t => t.systemId === systemId); }
function getSystemById(id)  { return SYSTEMS.find(s => s.id === id); }
function getUserById(id)    { return USERS.find(u => u.id === id); }
function getTaskById(id)    { return TASKS.find(t => t.id === id); }
