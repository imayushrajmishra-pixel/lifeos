-- =============================================================================
-- MIGRATION 0003 — Study System: weak topics, staged revisions, time
-- tracking, tests/exams.
-- Additive only — nothing from schema.sql or 0002_study_system.sql is
-- touched, dropped, or renamed. Safe to run on a project that already has
-- study data from 0002.
-- =============================================================================

do $$ begin
  create type chapter_strength as enum ('weak', 'average', 'strong');
exception when duplicate_object then null; end $$;

do $$ begin
  create type revision_stage as enum ('revision_1', 'revision_2', 'revision_3', 'final');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- Weak topics: one column on the existing chapters table. Defaults to
-- 'average' so nothing already in study_chapters needs backfilling.
-- -----------------------------------------------------------------------------
alter table public.study_chapters
  add column if not exists strength chapter_strength not null default 'average';

-- -----------------------------------------------------------------------------
-- Revision schedule: separate from the simple `revision_status` flag that
-- already exists on study_chapters (that flag stays as-is — a quick manual
-- "needs a look" marker). This table is the real spaced-repetition schedule:
-- completing a chapter schedules Revision 1, completing that schedules
-- Revision 2, and so on through Final. lib/actions/study.ts drives the
-- create-next-stage logic; this table just stores the resulting rows.
-- -----------------------------------------------------------------------------
create table if not exists public.study_revisions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  chapter_id uuid not null references public.study_chapters(id) on delete cascade,
  stage revision_stage not null,
  due_date date not null,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Study sessions: real elapsed time, not planned time. ended_at/duration_minutes
-- are null while a session is running.
-- -----------------------------------------------------------------------------
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid references public.study_subjects(id) on delete set null,
  chapter_id uuid references public.study_chapters(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes int,
  notes text default '',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Tests & exams. chapters_covered is a plain jsonb array of chapter names
-- (not ids) so a test can reference chapters even loosely by topic without
-- forcing a rigid join — matches how "syllabus/chapters covered" was asked
-- for as free-form coverage rather than a strict FK list.
-- -----------------------------------------------------------------------------
create table if not exists public.study_tests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.study_subjects(id) on delete cascade,
  name text not null,
  test_date date not null,
  chapters_covered jsonb not null default '[]'::jsonb,
  total_marks numeric not null,
  marks_obtained numeric,
  notes text default '',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- RLS — same owner-only pattern as every other study table. No public policy
-- on any of these; study data is never visible to anyone but the owner.
-- -----------------------------------------------------------------------------
alter table public.study_revisions enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_tests enable row level security;

create policy "owner can read own study_revisions" on public.study_revisions for select using (auth.uid() = owner_id and public.is_owner());
create policy "owner can write study_revisions" on public.study_revisions for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "owner can read own study_sessions" on public.study_sessions for select using (auth.uid() = owner_id and public.is_owner());
create policy "owner can write study_sessions" on public.study_sessions for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create policy "owner can read own study_tests" on public.study_tests for select using (auth.uid() = owner_id and public.is_owner());
create policy "owner can write study_tests" on public.study_tests for all
  using (auth.uid() = owner_id and public.is_owner()) with check (auth.uid() = owner_id and public.is_owner());

create index if not exists study_revisions_chapter_idx on public.study_revisions (chapter_id);
create index if not exists study_revisions_due_idx on public.study_revisions (due_date);
create index if not exists study_sessions_owner_started_idx on public.study_sessions (owner_id, started_at);
create index if not exists study_tests_subject_idx on public.study_tests (subject_id);
create index if not exists study_tests_date_idx on public.study_tests (test_date);
