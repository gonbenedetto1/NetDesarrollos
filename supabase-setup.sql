-- ═══════════════════════════════════════════════════════
--  SETUP SQL — Sistema NET → Supabase
--  Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════

-- 1. TABLAS ───────────────────────────────────────────

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  initials text not null,
  role text not null default 'developer',
  color text not null default '#0071E3',
  bg text not null default '#EBF2FD',
  created_at timestamptz default now()
);

-- Systems
create table if not exists systems (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text default '',
  color text not null default '#0071E3',
  members uuid[] default '{}',
  created_at timestamptz default now()
);

-- Tasks
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  system_id uuid references systems(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null default 'pending',
  priority text not null default 'medium',
  assigned_to uuid references profiles(id),
  created_by uuid references profiles(id),
  start_date date,
  due_date date,
  estimated_hours numeric default 0,
  actual_hours numeric default 0,
  progress integer default 0,
  sort_order integer default 0,
  tags text[] default '{}',
  attachments jsonb default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Blocks
create table if not exists blocks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  description text not null,
  reported_by uuid references profiles(id),
  resolved_by uuid references profiles(id),
  resolution_note text,
  status text not null default 'active',
  severity text not null default 'high',
  created_at timestamptz default now(),
  resolved_at timestamptz
);

-- Comments
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  user_id uuid references profiles(id),
  text text not null,
  created_at timestamptz default now()
);

-- Activity log
create table if not exists activity (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  action text not null,
  task_id uuid,
  text text not null,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id),
  type text not null,
  task_id uuid,
  text text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- Marketing budgets
create table if not exists budgets (
  id uuid default gen_random_uuid() primary key,
  system_id uuid references systems(id) on delete cascade,
  name text not null,
  budget numeric default 0,
  spent numeric default 0,
  period text default '2026'
);

-- 2. RLS (Row Level Security) ────────────────────────
-- Equipo interno: todos leen/escriben todo (excepto notifs que son por usuario)

alter table profiles enable row level security;
alter table systems enable row level security;
alter table tasks enable row level security;
alter table blocks enable row level security;
alter table comments enable row level security;
alter table activity enable row level security;
alter table notifications enable row level security;
alter table budgets enable row level security;

-- Profiles
create policy "profiles_select" on profiles for select to authenticated using (true);
create policy "profiles_update" on profiles for update to authenticated using (id = auth.uid());

-- Systems
create policy "systems_all" on systems for all to authenticated using (true);

-- Tasks
create policy "tasks_all" on tasks for all to authenticated using (true);

-- Blocks
create policy "blocks_all" on blocks for all to authenticated using (true);

-- Comments
create policy "comments_all" on comments for all to authenticated using (true);

-- Activity
create policy "activity_all" on activity for all to authenticated using (true);

-- Notifications (solo tus propias)
create policy "notifs_select" on notifications for select to authenticated using (user_id = auth.uid());
create policy "notifs_insert" on notifications for insert to authenticated with check (true);
create policy "notifs_update" on notifications for update to authenticated using (user_id = auth.uid());

-- Budgets
create policy "budgets_all" on budgets for all to authenticated using (true);

-- 3. REALTIME ────────────────────────────────────────
alter publication supabase_realtime add table tasks, blocks, comments, activity, notifications, systems, budgets;

-- 4. TRIGGER: auto-crear profile al registrar usuario ─
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, initials, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'initials', upper(left(split_part(new.email, '@', 1), 2))),
    coalesce(new.raw_user_meta_data->>'role', 'developer')
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
