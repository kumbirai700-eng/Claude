-- ============================================================================
--  THE CREATIVE CENTRE — Supabase schema
--  Run this in the Supabase SQL editor (or via `supabase db push`).
--  Gives you real accounts, profiles, spaces, gear, jobs, connections, posts.
-- ============================================================================

-- 1) PROFILES (one row per auth user) -----------------------------------------
create table if not exists profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  name         text not null,
  kind         text not null default 'creator',         -- creator | brand | host
  city         text,
  area         text,
  lat          double precision,
  lng          double precision,
  roles        text[] default '{}',
  rate         text,
  exp          int default 0,
  bio          text,
  tags         text[] default '{}',
  gear         text[] default '{}',
  verified     boolean default false,
  rating       numeric default 5.0,
  jobs         int default 0,
  socials      jsonb default '{}'::jsonb,               -- {ig,tt,x,li}
  followers    jsonb default '{}'::jsonb,               -- {ig,tt,x}
  created_at   timestamptz default now()
);

-- 2) CONNECTIONS (the follow graph) -------------------------------------------
create table if not exists connections (
  follower_id  uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at   timestamptz default now(),
  primary key (follower_id, following_id)
);

-- 3) SPACES -------------------------------------------------------------------
create table if not exists spaces (
  id         uuid primary key default gen_random_uuid(),
  host_id    uuid references profiles(id) on delete cascade,
  name       text not null, type text, city text, area text,
  lat double precision, lng double precision,
  rate text, day_rate text, capacity text, size text,
  amenities text[] default '{}', instant boolean default false,
  image_url text, created_at timestamptz default now()
);

-- 4) GEAR ---------------------------------------------------------------------
create table if not exists gear (
  id        uuid primary key default gen_random_uuid(),
  owner_id  uuid references profiles(id) on delete cascade,
  brand text, model text, category text, city text, area text,
  rate text, deposit text, image_url text, created_at timestamptz default now()
);

-- 5) JOBS (brand briefs) ------------------------------------------------------
create table if not exists jobs (
  id        uuid primary key default gen_random_uuid(),
  brand_id  uuid references profiles(id) on delete set null,
  brand text, title text, city text, roles text[] default '{}',
  date date, budget text, usage text, brief text,
  created_at timestamptz default now()
);

-- 6) POSTS (The Scene / blog) -------------------------------------------------
create table if not exists posts (
  id       uuid primary key default gen_random_uuid(),
  title text, category text, author text, excerpt text, body text,
  image_url text, read_min int default 5, published_at timestamptz default now()
);

-- ============================================================================
--  ROW-LEVEL SECURITY
-- ============================================================================
alter table profiles    enable row level security;
alter table connections enable row level security;
alter table spaces      enable row level security;
alter table gear        enable row level security;
alter table jobs        enable row level security;
alter table posts       enable row level security;

-- profiles: anyone can read; you can only write your own
create policy "profiles read"        on profiles for select using (true);
create policy "profiles write own"   on profiles for insert with check (auth.uid() = id);
create policy "profiles update own"   on profiles for update using (auth.uid() = id);

-- connections: anyone reads counts; you manage only your own follows
create policy "conn read"   on connections for select using (true);
create policy "conn follow" on connections for insert with check (auth.uid() = follower_id);
create policy "conn unfollow" on connections for delete using (auth.uid() = follower_id);

-- listings: public read; owner writes
create policy "spaces read" on spaces for select using (true);
create policy "spaces own"  on spaces for all using (auth.uid() = host_id) with check (auth.uid() = host_id);
create policy "gear read"   on gear for select using (true);
create policy "gear own"    on gear for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "jobs read"   on jobs for select using (true);
create policy "jobs own"    on jobs for all using (auth.uid() = brand_id) with check (auth.uid() = brand_id);
create policy "posts read"  on posts for select using (true);

-- connection counts view (handy for profile pages)
create or replace view connection_counts as
  select following_id as profile_id, count(*)::int as connections
  from connections group by following_id;

-- auto-create a profile row when a user signs up
create or replace function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, name, kind)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
                  coalesce(new.raw_user_meta_data->>'kind','creator'));
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
--  V1 EXPANSION — reviews, availability, waitlist, saves, compare, enquiries,
--  verification, support, featured (admin-ready architecture)
-- ============================================================================

-- profiles gains credibility + responsiveness + availability columns
alter table profiles add column if not exists verify        jsonb default '{}'::jsonb;   -- {id,email,portfolio}
alter table profiles add column if not exists response_time text;
alter table profiles add column if not exists response_rate int default 0;
alter table profiles add column if not exists repeat_pct    int default 0;
alter table profiles add column if not exists availability  text default 'now';          -- now | limited | booked
alter table profiles add column if not exists avail_days    jsonb default '{}'::jsonb;    -- {weekdays,weekends,evenings}
alter table profiles add column if not exists featured      boolean default false;        -- admin: feature a profile

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) on delete cascade,
  author_id  uuid references profiles(id) on delete set null,
  author_name text, author_role text, stars int check (stars between 1 and 5),
  text text, created_at timestamptz default now()
);

-- portfolio items carry project context
create table if not exists portfolio_items (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references profiles(id) on delete cascade,
  image_url text, project_name text, client text, role text, location text, year int,
  sort int default 0
);

create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  name text, phone text, email text, city text, occupation text, created_at timestamptz default now()
);

-- user-generated saved collections
create table if not exists saved_lists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  name text not null, created_at timestamptz default now()
);
create table if not exists saved_items (
  list_id uuid references saved_lists(id) on delete cascade,
  item_type text, item_id text, created_at timestamptz default now(),
  primary key (list_id, item_type, item_id)
);

create table if not exists comparisons (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade,
  creator_ids text[] default '{}', created_at timestamptz default now()
);

create table if not exists enquiries (
  id uuid primary key default gen_random_uuid(),
  from_id uuid references profiles(id) on delete set null,
  to_id   uuid references profiles(id) on delete cascade,
  project text, location text, date date, budget text, description text,
  team text[] default '{}', status text default 'new', created_at timestamptz default now()
);

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete set null,
  subject text, body text, status text default 'open', created_at timestamptz default now()
);

alter table reviews enable row level security;
alter table waitlist enable row level security;
alter table saved_lists enable row level security;
alter table saved_items enable row level security;
alter table comparisons enable row level security;
alter table enquiries enable row level security;
alter table support_tickets enable row level security;
alter table portfolio_items enable row level security;

create policy "reviews read"   on reviews for select using (true);
create policy "reviews write"  on reviews for insert with check (auth.uid() is not null);
create policy "waitlist insert" on waitlist for insert with check (true);
create policy "portfolio read" on portfolio_items for select using (true);
create policy "portfolio own"  on portfolio_items for all using (auth.uid() = creator_id) with check (auth.uid() = creator_id);
create policy "saves own"   on saved_lists for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "saveitems own" on saved_items for all using (exists(select 1 from saved_lists l where l.id = list_id and l.owner_id = auth.uid()));
create policy "cmp own"     on comparisons for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "enq parties" on enquiries for select using (auth.uid() = from_id or auth.uid() = to_id);
create policy "enq create"  on enquiries for insert with check (auth.uid() is not null);
create policy "tickets own" on support_tickets for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
