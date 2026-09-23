# Life OS

A personal digital life OS — part portfolio, part private diary, part memory
archive, part productivity dashboard. Built with Next.js (App Router),
TypeScript, Tailwind CSS, and Supabase (Postgres + Auth + Storage).

This is a real, working application, not a mockup. Every page reads and
writes actual database rows through Supabase, gated by real authentication
and real Row Level Security — nothing is hidden with frontend CSS alone.

---

## 1. What's here

**Public site** (no login): Home, About, Projects, Skills, Moments, Guestbook.
Every list is empty-state aware and pulls only rows marked `public`.

**Private space** (`/private`, auth required): Dashboard (Today / Study /
Life), Study — a real syllabus planner with five tabs:
- **Today**: a priority-ordered daily plan (weak topics and chapters tied to
  an upcoming test are front-loaded), revisions due today, study time so far
- **Subjects**: goals → subjects → chapters, with strength (weak/average/
  strong), difficulty, and manual revision flags
- **Sessions**: start/stop time tracking per subject, today/week totals
- **Tests**: exams with marks, auto-calculated percentage, upcoming vs completed
- **Progress**: overall + per-subject bars, pace, weak topics, test
  performance trend, upcoming staged revisions (Revision 1 → 2 → 3 → Final)

...plus Tasks, Diary (mood, tags, favorites, search, AI-powered diary
search), Moments, Skills, Projects, Bucket List, Books, Movies, Bookmarks,
Stats + yearly recap, Guestbook moderation, Settings, and "Ask LifeOS" — a
context-aware assistant fed with your real study progress, weak topics,
revisions due, session time, test performance, and tasks.

**Security model:** there is exactly one owner account. Every table's Row
Level Security policy checks `auth.uid() = owner_id AND is_owner()` for
writes, and `visibility = 'public' OR (owner + is_owner())` for reads. Diary,
tasks, and bookmarks have no public policy at all — they simply cannot be
read by anyone but the owner, at the database level, regardless of what the
frontend does.

---

## 2. Setup (from zero to running locally)

### a. Create a Supabase project
Go to [supabase.com](https://supabase.com), create a new project, and open
the SQL editor.

### b. Run the schema
Paste the entire contents of `supabase/schema.sql` into the SQL editor and
run it. This creates every table, enum, RLS policy, and the two storage
buckets (`public-media`, `private-media`).

Then run `supabase/migrations/0002_study_system.sql` and
`supabase/migrations/0003_study_advanced.sql`, in that order, the same way.
0002 adds the core Study System (goals, subjects, chapters). 0003 adds weak
topics, staged revisions, study session time tracking, and tests/exams on
top of it. Migrations are numbered and additive; run any new ones the same
way whenever you pull an update.

### c. Install dependencies
```bash
npm install
```

### d. Configure environment variables
```bash
cp .env.example .env.local
```
Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
your Supabase project's API settings, and set `OWNER_EMAIL` to the email
you'll sign up with.

### e. Create your account and become the owner
In Supabase Auth settings, either disable public sign-ups (recommended,
since this is a single-owner app) or just sign up once through `/login`
using the **password reset** flow after manually creating a user in the
Supabase Auth dashboard — either way works. Then, back in the SQL editor,
run the one-line command from the bottom of `supabase/schema.sql`:

```sql
insert into public.site_owner (user_id)
select id from auth.users where email = 'you@example.com';

insert into public.profiles (owner_id) select user_id from public.site_owner;
```

From this point on, only that account can write data or see anything
private — enforced by Postgres, not by the app.

### f. Run it
```bash
npm run dev
```
Visit `http://localhost:3000`.

### g. (Optional) seed some tasteful placeholder content
```bash
SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... OWNER_EMAIL=... npm run seed
```
Everything it adds is labeled `(demo)` so you can find and delete it in one
pass before going live (see section 43 of the original spec — this exists so
the UI isn't a blank void on first run, without ever pretending fake content
is real).

### h. Deploy
Push to GitHub, import into [Vercel](https://vercel.com), and add the same
environment variables there (plus `NEXT_PUBLIC_SITE_URL` set to your real
domain, used for metadata and password-reset redirect links).

---

## 3. Optional integrations

Everything below is fully optional. The app works completely without any of
it — these just make specific features better.

| Feature | Env var | What happens if unset |
|---|---|---|
| AI diary search | `ANTHROPIC_API_KEY` | The "Ask your diary" box stays visible and explains it isn't configured yet |
| Ask LifeOS (study/task assistant) | `ANTHROPIC_API_KEY` (same key) | The "Ask LifeOS" panel stays visible and explains it isn't configured yet |
| Spotify | `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | Music section falls back to manual entry in Settings |

To wire up real Spotify auto-sync: add a route handler that refreshes
`profiles.now_playing` on a cron (e.g. a Vercel Cron Job hitting an API
route that calls the Spotify "currently playing" endpoint and updates the
row) — the schema and Settings UI are already there waiting for it.

---

## 4. Project structure

```
app/
  (public)/            marketing/public pages — nav + footer layout
  private/              authenticated dashboard — sidebar layout, owner-gated
  login/                sign in + password reset request
  auth/callback/        Supabase auth redirect handler
  api/export/            JSON/CSV data export (owner-only)
  api/ai-search/        AI diary search (owner-only, needs ANTHROPIC_API_KEY)
lib/
  supabase/              browser / server / middleware Supabase clients
  actions/               Server Actions — all writes go through these
  types.ts               hand-written domain types (see note in the file re: generating real ones)
components/
  ui/                    small primitives (Button, Card, Input, Badge, EmptyState)
  *-view.tsx (in app/private/*) client components pairing a list + inline form
supabase/schema.sql       the base database: tables, enums, RLS, storage buckets
supabase/migrations/      additive changes on top of schema.sql, numbered in order
scripts/seed.ts           optional tasteful demo data
```

**Pattern used throughout the private area:** each section is a Server
Component page that fetches the current data, handed to a client
`*-view.tsx` component that manages local UI state (filters, which item is
being edited) and calls a Server Action (in `lib/actions/`) for every write,
then calls `router.refresh()`. Authorization is never decided in these
files — Postgres RLS is the actual gate, so this pattern is safe even if a
bug slipped into the client code.

---

## 5. Extending it

- **New content type**: add a table + RLS policies to `schema.sql` (copy an
  existing pattern), a type to `lib/types.ts`, a small actions file in
  `lib/actions/`, and a `page.tsx` + `*-view.tsx` pair under `app/private/`.
- **Full-text search across sections**: the `search_skills`-style pattern
  used for diary search (an API route reading the owner's rows) can be
  extended into a combined `/api/search` that queries several tables and
  merges results, for the "global search" described in the original spec.
- **Real generated types**: once deployed, run
  `npx supabase gen types typescript --project-id <ref> > lib/database.types.ts`
  and swap the `Database = any` placeholder in `lib/types.ts` for it.

---

## 6. Manually verifying the build

Since this environment can't run a live server, verify these yourself once
deployed (this list mirrors the acceptance checklist from the original
spec):

1. Every public nav route loads (Home, About, Projects, Skills, Moments,
   Guestbook).
2. Sign in and out at `/login` work; visiting `/private` while signed out
   redirects to `/login?next=/private`, and after signing in you land back on
   `/private`. Visiting `/login` while already signed in redirects straight
   to `/private` without showing the form.
3. Mark a moment/project/skill public vs. private, and confirm it only shows
   on the public page when public — check this **while signed out**, not
   just visually in the admin view.
4. Create, edit, and delete a row in each private section, including a
   Study goal, a subject, and a few chapters.
5. Upload an image on a Moment or Project and confirm it renders.
6. Resize the browser down to a phone width and check the private sidebar
   collapses into the mobile menu, and the public nav collapses too.
7. Toggle dark/light/system in Settings and refresh the page — it should
   persist and never flash the wrong theme on load.
8. Use the diary search box, the "Ask LifeOS" panel on the dashboard, and
   the bookmarks/global filters.
9. Confirm data persists after a full page reload (it's in Postgres, not
   local state).
10. In an incognito window (logged out), try to load `/private/diary`
    directly — it should redirect to `/login?next=/private/diary`, not
    render any diary content.
11. Confirm the public Projects page never shows a private row, even if you
    know its slug.
12. Mark a chapter complete in Study and confirm the daily plan, progress
    percentage, and dashboard "Study" card all update together.
13. Click every link and button once — there should be no dead ends,
    especially the old `/journey`, `/travel`, `/experiences` URLs (they
    should 404 cleanly, not error).
