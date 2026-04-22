-- ═══════════════════════════════════════════════════════
--  LEADS MODULE — Ejecutar en Supabase SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. Tabla leads
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text default '',
  email text default '',
  phone text default '',
  status text not null default 'new',
  source text default 'other',
  system_id uuid references systems(id) on delete set null,
  owner_id uuid references profiles(id) on delete set null,
  estimated_value numeric default 0,
  probability integer default 20,
  next_action_date date,
  next_action text default '',
  tags text[] default '{}',
  notes text default '',
  lost_reason text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  won_at timestamptz,
  lost_at timestamptz
);

-- 2. Tabla lead_updates (timeline)
create table if not exists lead_updates (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  type text not null,
  text text not null,
  created_at timestamptz default now()
);

-- 3. RLS
alter table leads enable row level security;
alter table lead_updates enable row level security;

drop policy if exists "Team all" on leads;
drop policy if exists "Team all" on lead_updates;

create policy "Team all" on leads for all to authenticated using (true) with check (true);
create policy "Team all" on lead_updates for all to authenticated using (true) with check (true);

-- 4. Realtime
alter publication supabase_realtime add table leads;
alter publication supabase_realtime add table lead_updates;

-- 5. Indices utiles
create index if not exists idx_leads_status on leads(status);
create index if not exists idx_leads_owner on leads(owner_id);
create index if not exists idx_lead_updates_lead on lead_updates(lead_id, created_at desc);
