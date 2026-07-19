-- ===========================================================================
-- Eta platform — initial schema
-- Pi Network innovation hub. Zero financial transactions.
--
-- Security model:
--   * Reads  -> public anon key, guarded by the RLS policies below.
--   * Writes -> Supabase Edge Functions using the service role, AFTER they
--               verify the caller's Pi access token. No table grants client
--               INSERT/UPDATE/DELETE except analytics_events (write-only).
-- ===========================================================================

create extension if not exists pgcrypto;

-- --------------------------------------------------------------------------
-- profiles : one row per Pi Network account
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key default gen_random_uuid(),
  pi_uid      text unique not null,
  username    text not null,
  avatar_url  text,
  bio         text,
  role        text not null default 'user' check (role in ('user','admin','founder')),
  verified    boolean not null default false,
  created_at  timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- projects : innovations submitted to the platform
-- --------------------------------------------------------------------------
create table if not exists public.projects (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid references public.profiles(id) on delete set null,
  author_name      text not null default 'Anonymous',
  author_avatar    text,
  name             text not null,
  name_ar          text,
  description      text,
  description_ar   text,
  field            text not null default 'Clean Energy',
  stage            text not null default 'Research'
                     check (stage in ('Research','Pilot Testing','Field Testing','Production')),
  classification   text not null default 'Undocumented'
                     check (classification in ('Official','Safe','Experimental','Undocumented')),
  status           text not null default 'pending'
                     check (status in ('pending','approved','rejected')),
  impact           int not null default 50,
  sustainability   int not null default 50,
  carbon           numeric not null default 0,   -- kg CO2 saved (stored positive)
  water_saved      numeric not null default 0,   -- litres
  energy_generated numeric not null default 0,   -- kWh
  video_url        text,
  has_documents    boolean not null default false,
  verified         boolean not null default false,
  likes            int not null default 0,
  views            int not null default 0,
  created_at       timestamptz not null default now()
);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_owner_idx on public.projects(owner_id);
create index if not exists projects_field_idx on public.projects(field);

-- --------------------------------------------------------------------------
-- likes & follows
-- --------------------------------------------------------------------------
create table if not exists public.project_likes (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index if not exists project_likes_user_idx on public.project_likes(user_id);

create table if not exists public.project_follows (
  project_id  uuid not null references public.projects(id) on delete cascade,
  follower_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (project_id, follower_id)
);
create index if not exists project_follows_follower_idx on public.project_follows(follower_id);

-- --------------------------------------------------------------------------
-- teams
-- --------------------------------------------------------------------------
create table if not exists public.teams (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  name       text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.team_members (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role    text not null default 'member' check (role in ('lead','member')),
  online  boolean not null default false,
  primary key (team_id, user_id)
);
create index if not exists team_members_user_idx on public.team_members(user_id);

create table if not exists public.team_documents (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid not null references public.teams(id) on delete cascade,
  name       text not null,
  file_url   text,
  size       text,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- analytics (immutable) & admin activity log
-- --------------------------------------------------------------------------
create table if not exists public.analytics_events (
  id         uuid primary key default gen_random_uuid(),
  event_type text not null,
  pi_uid     text,
  session_id text,
  details    jsonb not null default '{}'::jsonb,
  referrer   text,
  created_at timestamptz not null default now()
);
create index if not exists analytics_events_type_idx on public.analytics_events(event_type);
create index if not exists analytics_events_created_idx on public.analytics_events(created_at desc);

create table if not exists public.activity_logs (
  id         uuid primary key default gen_random_uuid(),
  action     text not null,
  actor      text not null default 'system',
  details    jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_logs_created_idx on public.activity_logs(created_at desc);

-- --------------------------------------------------------------------------
-- platform_settings : single row of founder-controlled toggles
-- --------------------------------------------------------------------------
create table if not exists public.platform_settings (
  id                    int primary key default 1 check (id = 1),
  founder_pi_uid        text,
  ai_monitor            boolean not null default true,
  ai_assistant          boolean not null default true,
  ai_operator           boolean not null default false,
  ai_analytics_core     boolean not null default false,
  live_streaming_enabled boolean not null default false,
  updated_at            timestamptz not null default now()
);
insert into public.platform_settings (id) values (1) on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- Public view counter (safe for anonymous callers)
-- --------------------------------------------------------------------------
create or replace function public.increment_project_view(p_project_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.projects set views = views + 1
  where id = p_project_id and status = 'approved';
$$;

-- ===========================================================================
-- Row Level Security
-- ===========================================================================
alter table public.profiles           enable row level security;
alter table public.projects           enable row level security;
alter table public.project_likes      enable row level security;
alter table public.project_follows    enable row level security;
alter table public.teams              enable row level security;
alter table public.team_members       enable row level security;
alter table public.team_documents     enable row level security;
alter table public.analytics_events   enable row level security;
alter table public.activity_logs      enable row level security;
alter table public.platform_settings  enable row level security;

-- Public, read-only surfaces --------------------------------------------------
create policy "profiles readable"        on public.profiles          for select using (true);
create policy "approved projects readable" on public.projects        for select using (status = 'approved');
create policy "likes readable"           on public.project_likes     for select using (true);
create policy "follows readable"         on public.project_follows   for select using (true);
create policy "teams readable"           on public.teams             for select using (true);
create policy "team members readable"    on public.team_members      for select using (true);
create policy "team docs readable"       on public.team_documents    for select using (true);
create policy "settings readable"        on public.platform_settings for select using (true);

-- Analytics: anonymous inserts allowed, nobody can read via the anon key ------
create policy "analytics insert" on public.analytics_events
  for insert to anon, authenticated with check (true);

-- Everything else (all writes, activity_logs reads) is performed only by the
-- service role inside Edge Functions, which bypasses RLS. No further policies
-- are granted, so the anon key cannot write to protected tables.

-- ===========================================================================
-- Grants for the view-counter RPC
-- ===========================================================================
grant execute on function public.increment_project_view(uuid) to anon, authenticated;
