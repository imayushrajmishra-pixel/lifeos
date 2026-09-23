-- =============================================================================
-- MIGRATION 0002 — Study System
-- Adds the real study-planning feature (goals → subjects → chapters) plus an
-- optional link from tasks to a chapter. Run this AFTER supabase/schema.sql
-- on an existing project. It only adds new tables/columns — nothing from
-- schema.sql is touched or dropped, so this is safe on a project that
-- already has data.
-- =============================================================================

do $$ begin
  create type chapter_status as enum ('not_started', 'in_progress', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type revision_status as enum ('none', 'needs_revision', 'revised');
exception when duplicate_object then null; end $$;

do $$ begin
  create type chapter_difficulty as enum ('easy', 'medium', 'hard');
exception when duplicate_object then null; end $$;

-- One goal at a time is the common case, but nothing stops more than one —
-- the app treats the most recently created goal as "active".
create table if not exists public.study_goals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  target_date date not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.study_subjects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.study_goals(id) on delete cascade,
  name text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.study_chapters (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.study_subjects(id) on delete cascade,
  name text not null,
  position int not null default 0,
  difficulty chapter_difficulty not null default 'medium',
  estimated_minutes int not null default 45,
  status chapter_status not null default 'not_started',
  revision_status revision_status not null default 'none',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Optional link so a Task can represent (or point back to) a study chapter,
-- instead of duplicating a chapter as a second, separate task row.
alter table public.tasks
  add column if not exists study_chapter_id uuid references public.study_chapters(id) on delete set null;

-- -----------------------------------------------------------------------------
-- RLS — study data is always private, owner-only, same pattern as diary/tasks.
-- -----------------------------------------------------------------------------
alter table public.study_goals enable row level security;
alter table public.study_subjects enable row level security;
alter table public.study_chapters enable row level security;

create policy "owner can read own study_goals" on public.study_goals for select using (auth.uid() = owner_id and public.is_owner());
create policy "owner can write study_goals" on public.study_goals for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "owner can read own study_subjects" on public.study_subjects for select using (auth.uid() = owner_id and public.is_owner());
create policy "owner can write study_subjects" on public.study_subjects for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "owner can read own study_chapters" on public.study_chapters for select using (auth.uid() = owner_id and public.is_owner());
create policy "owner can write study_chapters" on public.study_chapters for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create index if not exists study_subjects_goal_idx on public.study_subjects (goal_id);
create index if not exists study_chapters_subject_idx on public.study_chapters (subject_id);
create index if not exists tasks_study_chapter_idx on public.tasks (study_chapter_id);
