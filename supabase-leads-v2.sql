-- ═══════════════════════════════════════════════════════
--  LEADS v2 — Agregar grupos (convenios) y simplificar
--  Ejecutar en Supabase SQL Editor DESPUES de supabase-leads.sql
-- ═══════════════════════════════════════════════════════

-- 1. Nueva tabla de grupos / convenios
create table if not exists lead_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  color text default '#0071E3',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 2. RLS
alter table lead_groups enable row level security;
drop policy if exists "Team all" on lead_groups;
create policy "Team all" on lead_groups for all to authenticated using (true) with check (true);

-- 3. Realtime
alter publication supabase_realtime add table lead_groups;

-- 4. Agregar group_id a leads y quitar campos no usados
alter table leads add column if not exists group_id uuid references lead_groups(id) on delete set null;
alter table leads drop column if exists estimated_value;
alter table leads drop column if exists probability;
alter table leads drop column if exists tags;

-- 5. Indice
create index if not exists idx_leads_group on leads(group_id);
