-- =============================================================================
-- LIFE OS — Supabase schema
-- Run this once in the Supabase SQL editor on a fresh project.
-- After you sign up for the first time in the app, run the one-line command
-- at the very bottom of this file to make your account the owner.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- OWNERSHIP
-- This app has exactly one owner (you). Everything else is either a public
-- visitor (anon) or, one day, could be extended to multiple accounts — but by
-- default only the row in site_owner can write anything or read private data.
-- -----------------------------------------------------------------------------
create table if not exists public.site_owner (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- enforce a single row
create unique index if not exists site_owner_singleton on public.site_owner ((user_id is not null));

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.site_owner where user_id = auth.uid());
$$;

grant execute on function public.is_owner() to anon, authenticated;

create or replace function public.current_owner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_id from public.site_owner limit 1;
$$;

-- -----------------------------------------------------------------------------
-- Shared enums
-- -----------------------------------------------------------------------------
do $$ begin
  create type visibility as enum ('public', 'private', 'unlisted');
exception when duplicate_object then null; end $$;

do $$ begin
  create type skill_status as enum ('exploring', 'learning', 'comfortable', 'advanced', 'want_to_improve');
exception when duplicate_object then null; end $$;

do $$ begin
  create type project_status as enum ('idea', 'building', 'live', 'completed', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type task_priority as enum ('low', 'medium', 'high');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mood_type as enum ('great', 'good', 'okay', 'low', 'angry', 'tired', 'thoughtful', 'grateful');
exception when duplicate_object then null; end $$;

do $$ begin
  create type media_owner_type as enum ('moment', 'travel', 'diary', 'project', 'experience', 'profile');
exception when duplicate_object then null; end $$;

do $$ begin
  create type read_status as enum ('want_to_read', 'reading', 'finished');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- profiles — one row, the public-facing identity + editable homepage copy
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null default 'Your Name',
  tagline text not null default '18. Curious. Building things. Collecting experiences.',
  bio text not null default '',
  what_i_like text not null default '',
  philosophy text not null default '',
  avatar_url text,
  social_links jsonb not null default '[]'::jsonb, -- [{label, url}]
  closing_line text not null default 'Still becoming.',
  -- Lightweight music section (section 20). If SPOTIFY_CLIENT_ID/SECRET are
  -- configured, wire up a route handler to refresh `now_playing` on a cron;
  -- otherwise these are simple manually-edited fields from Settings.
  now_playing text,
  favorite_artists jsonb not null default '[]'::jsonb,
  favorite_songs jsonb not null default '[]'::jsonb,
  music_visibility visibility not null default 'public',
  updated_at timestamptz not null default now()
);

create table if not exists public.currently_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  label text not null,        -- "Learning", "Building", "Exploring", "Reading", "Working toward"
  value text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.current_focus_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.learning_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.experience_wishes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- skills & interests
-- -----------------------------------------------------------------------------
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'other', -- technology/business/creative/communication/personal/other
  description text default '',
  status skill_status not null default 'exploring',
  started_on date,
  is_interest boolean not null default false, -- true = shown under "interests" instead of skills
  visibility visibility not null default 'public',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- projects
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  name text not null,
  description text default '',
  cover_url text,
  gallery jsonb not null default '[]'::jsonb,
  start_date date,
  end_date date,
  status project_status not null default 'idea',
  tools jsonb not null default '[]'::jsonb, -- string[]
  link text,
  github_link text,
  learned text default '',
  challenges text default '',
  outcome text default '',
  is_featured boolean not null default false,
  visibility visibility not null default 'private',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- travel
-- -----------------------------------------------------------------------------
create table if not exists public.travel_places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique,
  country text not null,
  city text,
  location_name text,
  latitude double precision,
  longitude double precision,
  visited_on date,
  cover_url text,
  gallery jsonb not null default '[]'::jsonb,
  story text default '',
  notes text default '',
  experienced jsonb not null default '[]'::jsonb, -- string[]
  favorite_memory text default '',
  rating int check (rating between 1 and 5),
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);

create table if not exists public.travel_wishlist (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  place text not null,
  country text,
  reason text default '',
  priority task_priority not null default 'medium',
  image_url text,
  visited boolean not null default false,
  latitude double precision,
  longitude double precision,
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- moments (memory archive)
-- -----------------------------------------------------------------------------
create table if not exists public.moments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  photo_url text,
  video_url text,
  caption text default '',
  occurred_on date not null default current_date,
  location text,
  people text,
  category text not null default 'random', -- travel/friends/family/projects/random/important
  is_featured boolean not null default false,
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- timeline / life journey
-- -----------------------------------------------------------------------------
create table if not exists public.timeline_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  occurred_on date not null default current_date,
  title text not null,
  description text default '',
  image_url text,
  location text,
  category text default 'general',
  related_project_id uuid references public.projects(id) on delete set null,
  related_travel_id uuid references public.travel_places(id) on delete set null,
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- experiences
-- -----------------------------------------------------------------------------
create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  occurred_on date not null default current_date,
  location text,
  description text default '',
  photos jsonb not null default '[]'::jsonb,
  what_happened text default '',
  what_i_learned text default '',
  rating int check (rating between 1 and 5),
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- tasks
-- -----------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  notes text default '',
  due_date date,
  priority task_priority not null default 'medium',
  category text default 'general',
  is_recurring boolean not null default false,
  recurrence_rule text, -- e.g. 'daily','weekly'
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- diary
-- -----------------------------------------------------------------------------
create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '',
  entry_date date not null default current_date,
  content text not null default '',
  mood mood_type,
  tags jsonb not null default '[]'::jsonb,
  photos jsonb not null default '[]'::jsonb,
  location text,
  is_favorite boolean not null default false,
  visibility visibility not null default 'private', -- diary defaults private and almost never changes
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- media (generic, used for private/protected storage bookkeeping)
-- -----------------------------------------------------------------------------
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  owner_type media_owner_type not null,
  owner_record_id uuid,
  storage_path text not null,
  bucket text not null default 'private-media',
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- books / movies / bucket list / bookmarks
-- -----------------------------------------------------------------------------
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text,
  cover_url text,
  rating int check (rating between 1 and 5),
  date_read date,
  notes text default '',
  favorite_quote text default '',
  status read_status not null default 'want_to_read',
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  poster_url text,
  year int,
  rating int check (rating between 1 and 5),
  date_watched date,
  review text default '',
  is_favorite boolean not null default false,
  genre text,
  is_watchlist boolean not null default false,
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);

create table if not exists public.bucket_list (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  goal text not null,
  category text not null default 'personal',
  description text default '',
  priority task_priority not null default 'medium',
  deadline date,
  is_completed boolean not null default false,
  completed_on date,
  photo_url text,
  notes text default '',
  visibility visibility not null default 'private',
  created_at timestamptz not null default now()
);

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  description text default '',
  category text default 'personal',
  tags jsonb not null default '[]'::jsonb,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- guestbook (public write, owner-moderated)
-- -----------------------------------------------------------------------------
create table if not exists public.guestbook (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  link text,
  message text not null,
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  created_at timestamptz not null default now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- Pattern used everywhere except guestbook:
--   - anyone can SELECT rows where visibility = 'public'
--   - only the site owner can SELECT their own private/unlisted rows
--   - only the site owner can INSERT/UPDATE/DELETE, and only their own rows
-- =============================================================================

alter table public.site_owner enable row level security;
alter table public.profiles enable row level security;
alter table public.currently_items enable row level security;
alter table public.current_focus_items enable row level security;
alter table public.learning_items enable row level security;
alter table public.experience_wishes enable row level security;
alter table public.skills enable row level security;
alter table public.projects enable row level security;
alter table public.travel_places enable row level security;
alter table public.travel_wishlist enable row level security;
alter table public.moments enable row level security;
alter table public.timeline_entries enable row level security;
alter table public.experiences enable row level security;
alter table public.tasks enable row level security;
alter table public.diary_entries enable row level security;
alter table public.media enable row level security;
alter table public.books enable row level security;
alter table public.movies enable row level security;
alter table public.bucket_list enable row level security;
alter table public.bookmarks enable row level security;
alter table public.guestbook enable row level security;

-- site_owner: nobody can read/write via the client; only via SQL editor / service role.
create policy "no client access" on public.site_owner for all using (false) with check (false);

-- Reusable policy generator (written out per-table since Postgres has no loops in plain SQL here)
-- profiles: public read (always), owner write
create policy "profiles are publicly readable" on public.profiles for select using (true);
create policy "owner can write profile" on public.profiles for all
  using (auth.uid() = owner_id and public.is_owner())
  with check (auth.uid() = owner_id and public.is_owner());

-- helper macro applied by hand to each content table below
create policy "public can read public currently_items" on public.currently_items for select using (true);
create policy "owner can write currently_items" on public.currently_items for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "public can read current_focus_items" on public.current_focus_items for select using (true);
create policy "owner can write current_focus_items" on public.current_focus_items for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "public can read learning_items" on public.learning_items for select using (true);
create policy "owner can write learning_items" on public.learning_items for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "public can read experience_wishes" on public.experience_wishes for select using (true);
create policy "owner can write experience_wishes" on public.experience_wishes for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible skills" on public.skills for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write skills" on public.skills for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible projects" on public.projects for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write projects" on public.projects for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible travel_places" on public.travel_places for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write travel_places" on public.travel_places for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible travel_wishlist" on public.travel_wishlist for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write travel_wishlist" on public.travel_wishlist for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible moments" on public.moments for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write moments" on public.moments for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible timeline_entries" on public.timeline_entries for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write timeline_entries" on public.timeline_entries for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible experiences" on public.experiences for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write experiences" on public.experiences for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

-- tasks: always private, owner-only, no public policy at all
create policy "owner can read own tasks" on public.tasks for select using (auth.uid() = owner_id and public.is_owner());
create policy "owner can write tasks" on public.tasks for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

-- diary: always private, owner-only
create policy "owner can read own diary" on public.diary_entries for select using (auth.uid() = owner_id and public.is_owner());
create policy "owner can write diary" on public.diary_entries for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible media" on public.media for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write media" on public.media for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible books" on public.books for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write books" on public.books for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible movies" on public.movies for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write movies" on public.movies for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "read visible bucket_list" on public.bucket_list for select
  using (visibility = 'public' or (auth.uid() = owner_id and public.is_owner()));
create policy "owner can write bucket_list" on public.bucket_list for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

-- bookmarks: always private, owner-only
create policy "owner can read own bookmarks" on public.bookmarks for select using (auth.uid() = owner_id and public.is_owner());
create policy "owner can write bookmarks" on public.bookmarks for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

-- guestbook: anyone can insert (spam-limited at the app layer), anyone can read approved,
-- only the owner can read/update/delete everything.
create policy "anyone can leave a message" on public.guestbook for insert with check (status = 'pending');
create policy "anyone can read approved messages" on public.guestbook for select using (status = 'approved');
create policy "owner can read all guestbook" on public.guestbook for select using (public.is_owner());
create policy "owner can moderate guestbook" on public.guestbook for update
  using (public.is_owner()) with check (public.is_owner());
create policy "owner can delete guestbook" on public.guestbook for delete using (public.is_owner());

-- =============================================================================
-- STORAGE BUCKETS
-- public-media  → world-readable (moments/projects/travel photos marked public)
-- private-media → only readable via short-lived signed URLs generated server-side
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('private-media', 'private-media', false)
on conflict (id) do nothing;

create policy "public media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'public-media');

create policy "owner can manage public-media"
  on storage.objects for all
  using (bucket_id = 'public-media' and public.is_owner())
  with check (bucket_id = 'public-media' and public.is_owner());

create policy "owner can manage private-media"
  on storage.objects for all
  using (bucket_id = 'private-media' and public.is_owner())
  with check (bucket_id = 'private-media' and public.is_owner());

-- =============================================================================
-- Seed a default profile row bound to whoever becomes the owner (run after
-- the command below). Kept separate so schema.sql is safe to re-run.
-- =============================================================================

-- =============================================================================
-- AFTER YOU SIGN UP IN THE APP FOR THE FIRST TIME (Settings has no bearing on
-- this — do it once, right after your first login, from the SQL editor):
--
--   insert into public.site_owner (user_id)
--   select id from auth.users where email = 'you@example.com';
--
--   insert into public.profiles (owner_id) select user_id from public.site_owner;
--
-- From then on, only that account can write data or see private content.
-- =============================================================================
