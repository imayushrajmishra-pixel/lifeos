-- ============================================================================
-- MIGRATION 0005 — Multi-user LifeOS
--
-- Private data belongs to the authenticated user:
--     auth.uid() = owner_id
--
-- site_owner / is_owner() are no longer used as the private-space gate.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Profiles
-- ----------------------------------------------------------------------------

alter table public.profiles
  add column if not exists is_public boolean not null default false;

create unique index if not exists profiles_owner_id_unique
  on public.profiles (owner_id);

create unique index if not exists profiles_single_public
  on public.profiles ((is_public))
  where is_public = true;


-- Existing profile remains the public website profile.
update public.profiles
set is_public = true
where owner_id = (
  select user_id
  from public.site_owner
  limit 1
);


-- Remove the old placeholder tagline from the existing profile.
update public.profiles
set tagline = 'Curious. Building things. Documenting the process.'
where tagline = '18. Curious. Building things. Collecting experiences.';


-- ----------------------------------------------------------------------------
-- 2. Helper: which profile powers the public website?
-- ----------------------------------------------------------------------------

create or replace function public.public_profile_owner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select owner_id
  from public.profiles
  where is_public = true
  order by updated_at desc
  limit 1;
$$;

grant execute on function public.public_profile_owner_id()
to anon, authenticated;


-- ----------------------------------------------------------------------------
-- 3. Automatically create a profile for every new Supabase user
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  display_name text;
begin
  display_name :=
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), '');

  if display_name is null then
    display_name :=
      nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;

  insert into public.profiles (
    owner_id,
    full_name,
    tagline,
    is_public
  )
  values (
    new.id,
    coalesce(display_name, 'You'),
    'Curious. Building things. Documenting the process.',
    false
  )
  on conflict (owner_id) do nothing;

  return new;
end;
$$;


drop trigger if exists on_auth_user_created_profile
on auth.users;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();


-- ----------------------------------------------------------------------------
-- 4. Drop old single-owner policies
-- ----------------------------------------------------------------------------

do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'currently_items',
        'current_focus_items',
        'learning_items',
        'experience_wishes',
        'skills',
        'projects',
        'travel_places',
        'travel_wishlist',
        'moments',
        'timeline_entries',
        'experiences',
        'tasks',
        'diary_entries',
        'media',
        'books',
        'movies',
        'bucket_list',
        'bookmarks',
        'guestbook',
        'study_goals',
        'study_subjects',
        'study_chapters',
        'study_revisions',
        'study_sessions',
        'study_tests',
        'study_daily_context'
      )
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );
  end loop;
end $$;


-- ----------------------------------------------------------------------------
-- 5. Profiles
-- ----------------------------------------------------------------------------

create policy "profiles public profile is readable"
on public.profiles
for select
using (
  is_public = true
  or auth.uid() = owner_id
);

create policy "users can manage own profile"
on public.profiles
for all
using (
  auth.uid() = owner_id
)
with check (
  auth.uid() = owner_id
);


-- ----------------------------------------------------------------------------
-- 6. Public identity content
-- ----------------------------------------------------------------------------

create policy "public can read public currently items"
on public.currently_items
for select
using (
  owner_id = public.public_profile_owner_id()
  or auth.uid() = owner_id
);

create policy "users can manage own currently items"
on public.currently_items
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "public can read public focus items"
on public.current_focus_items
for select
using (
  owner_id = public.public_profile_owner_id()
  or auth.uid() = owner_id
);

create policy "users can manage own focus items"
on public.current_focus_items
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "public can read public learning items"
on public.learning_items
for select
using (
  owner_id = public.public_profile_owner_id()
  or auth.uid() = owner_id
);

create policy "users can manage own learning items"
on public.learning_items
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "public can read public experience wishes"
on public.experience_wishes
for select
using (
  owner_id = public.public_profile_owner_id()
  or auth.uid() = owner_id
);

create policy "users can manage own experience wishes"
on public.experience_wishes
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


-- ----------------------------------------------------------------------------
-- 7. Visibility-based public content
-- ----------------------------------------------------------------------------

create policy "read visible skills"
on public.skills
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own skills"
on public.skills
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "read visible projects"
on public.projects
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own projects"
on public.projects
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "read visible travel places"
on public.travel_places
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own travel places"
on public.travel_places
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "read visible travel wishlist"
on public.travel_wishlist
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own travel wishlist"
on public.travel_wishlist
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "read visible moments"
on public.moments
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own moments"
on public.moments
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "read visible timeline"
on public.timeline_entries
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own timeline"
on public.timeline_entries
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "read visible experiences"
on public.experiences
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own experiences"
on public.experiences
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


-- ----------------------------------------------------------------------------
-- 8. Always-private personal data
-- ----------------------------------------------------------------------------

create policy "users can read own tasks"
on public.tasks
for select
using (auth.uid() = owner_id);

create policy "users can manage own tasks"
on public.tasks
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "users can read own diary"
on public.diary_entries
for select
using (auth.uid() = owner_id);

create policy "users can manage own diary"
on public.diary_entries
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "users can read own bookmarks"
on public.bookmarks
for select
using (auth.uid() = owner_id);

create policy "users can manage own bookmarks"
on public.bookmarks
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "read visible media"
on public.media
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own media"
on public.media
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "read visible books"
on public.books
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own books"
on public.books
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "read visible movies"
on public.movies
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own movies"
on public.movies
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "read visible bucket list"
on public.bucket_list
for select
using (
  (visibility = 'public' and owner_id = public.public_profile_owner_id())
  or auth.uid() = owner_id
);

create policy "users can manage own bucket list"
on public.bucket_list
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


-- ----------------------------------------------------------------------------
-- 9. Study system
-- ----------------------------------------------------------------------------

create policy "users can read own study goals"
on public.study_goals
for select
using (auth.uid() = owner_id);

create policy "users can manage own study goals"
on public.study_goals
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "users can read own study subjects"
on public.study_subjects
for select
using (auth.uid() = owner_id);

create policy "users can manage own study subjects"
on public.study_subjects
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "users can read own study chapters"
on public.study_chapters
for select
using (auth.uid() = owner_id);

create policy "users can manage own study chapters"
on public.study_chapters
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "users can read own study revisions"
on public.study_revisions
for select
using (auth.uid() = owner_id);

create policy "users can manage own study revisions"
on public.study_revisions
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "users can read own study sessions"
on public.study_sessions
for select
using (auth.uid() = owner_id);

create policy "users can manage own study sessions"
on public.study_sessions
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


create policy "users can read own study tests"
on public.study_tests
for select
using (auth.uid() = owner_id);

create policy "users can manage own study tests"
on public.study_tests
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);


-- study_daily_context does not have owner_id.
-- Ownership is inherited through study_goals.goal_id -> study_goals.owner_id.

create policy "users can read own daily context"
on public.study_daily_context
for select
using (
  exists (
    select 1
    from public.study_goals
    where study_goals.id = study_daily_context.goal_id
      and study_goals.owner_id = auth.uid()
  )
);

create policy "users can manage own daily context"
on public.study_daily_context
for all
using (
  exists (
    select 1
    from public.study_goals
    where study_goals.id = study_daily_context.goal_id
      and study_goals.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.study_goals
    where study_goals.id = study_daily_context.goal_id
      and study_goals.owner_id = auth.uid()
  )
);


-- ----------------------------------------------------------------------------
-- 10. Guestbook
-- ----------------------------------------------------------------------------

create policy "anyone can leave a message"
on public.guestbook
for insert
with check (status = 'pending');

create policy "anyone can read approved messages"
on public.guestbook
for select
using (status = 'approved');

create policy "public profile owner can read guestbook"
on public.guestbook
for select
using (
  auth.uid() = public.public_profile_owner_id()
);

create policy "public profile owner can moderate guestbook"
on public.guestbook
for update
using (
  auth.uid() = public.public_profile_owner_id()
)
with check (
  auth.uid() = public.public_profile_owner_id()
);

create policy "public profile owner can delete guestbook"
on public.guestbook
for delete
using (
  auth.uid() = public.public_profile_owner_id()
);


-- ============================================================================
-- STORAGE
-- ============================================================================

drop policy if exists "owner can manage public-media"
on storage.objects;

drop policy if exists "owner can manage private-media"
on storage.objects;


create policy "users can manage own public-media"
on storage.objects
for all
using (
  bucket_id = 'public-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'public-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);


create policy "users can manage own private-media"
on storage.objects
for all
using (
  bucket_id = 'private-media'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'private-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);