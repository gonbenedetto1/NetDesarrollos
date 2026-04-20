-- ═══════════════════════════════════════════════════════
--  SEED DATA — Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. PROFILES (usar los IDs reales de auth.users)
INSERT INTO profiles (id, name, initials, role, color, bg) VALUES
  ('02034d1e-5fb9-404d-bacd-7095270c4083', 'Miguel Benedetto',  'MB', 'lead',      '#0071E3', '#EBF2FD'),
  ('a4a05b48-adc9-4108-92bb-4edd365a8970', 'Gonzalo Benedetto', 'GB', 'marketing', '#28C76F', '#E8F9EE'),
  ('3bfcaacf-59c1-4ed4-9858-ced5e82e4b26', 'Camilo Benedetto',  'CB', 'developer', '#BF5AF2', '#F5EAFB'),
  ('58503614-a5ee-4c12-9e2a-2f1e11518485', 'Joaquin Benedetto', 'JB', 'gvamax',    '#FF9F0A', '#FFF3DC')
ON CONFLICT (id) DO NOTHING;

-- 2. SYSTEMS
INSERT INTO systems (name, description, color, members) VALUES
  ('GVAMax', 'CRM integral para inmobiliarias: gestion de propiedades, clientes, busquedas, alertas, portal web y estadisticas.', '#0071E3',
   ARRAY['02034d1e-5fb9-404d-bacd-7095270c4083','a4a05b48-adc9-4108-92bb-4edd365a8970','3bfcaacf-59c1-4ed4-9858-ced5e82e4b26','58503614-a5ee-4c12-9e2a-2f1e11518485']::uuid[]),
  ('Sistema de Consorcios', 'Administracion de consorcios: expensas, proveedores, asambleas, comunicaciones y estados de cuenta por unidad.', '#BF5AF2',
   ARRAY['02034d1e-5fb9-404d-bacd-7095270c4083','3bfcaacf-59c1-4ed4-9858-ced5e82e4b26']::uuid[]),
  ('Sistema de Administracion', 'Configuracion global, usuarios, permisos, facturacion, suscripciones y auditoria del sistema.', '#FF9F0A',
   ARRAY['02034d1e-5fb9-404d-bacd-7095270c4083','3bfcaacf-59c1-4ed4-9858-ced5e82e4b26']::uuid[]),
  ('NET Desarrollos', 'Tareas internas de la empresa: planificacion, comunicacion, marketing, procesos y mejora continua.', '#FF6B6B',
   ARRAY['02034d1e-5fb9-404d-bacd-7095270c4083','a4a05b48-adc9-4108-92bb-4edd365a8970','3bfcaacf-59c1-4ed4-9858-ced5e82e4b26']::uuid[]);

-- 3. BUDGETS
INSERT INTO budgets (system_id, name, budget, spent, period)
SELECT id, name || ' — Marketing', 50000, 0, '2026' FROM systems;
