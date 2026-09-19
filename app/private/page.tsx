import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { formatDate, MOOD_META } from '@/lib/utils';
import { buildStudyOverview } from '@/lib/study';
import { AskLifeOS } from '@/components/ask-lifeos';
import { TodayEngine } from '@/components/today-engine';

import {
  BookOpen,
  CheckSquare,
  Image as ImageIcon,
  Award,
  FolderKanban,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);
  const monthDay = today.slice(5);

  const [
    { data: profile },
    { data: goal },
    { data: tasks },
    { data: todayDiary },
    { data: onThisDay },
    { data: diaryCount },
    { data: momentCount },
    { data: projectCount },
    { data: skillCount },
    { data: taskCount },
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name')
      .single(),

    supabase
      .from('study_goals')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from('tasks')
      .select('*')
      .eq('is_completed', false)
      .order('priority', { ascending: false })
      .order('due_date', {
        ascending: true,
        nullsFirst: false,
      })
      .limit(20),

    supabase
      .from('diary_entries')
      .select('*')
      .eq('entry_date', today)
      .maybeSingle(),

    supabase
      .from('diary_entries')
      .select('*')
      .neq('entry_date', today)
      .ilike('entry_date', `%-${monthDay}`)
      .order('entry_date', { ascending: false }),

    supabase
      .from('diary_entries')
      .select('id'),

    supabase
      .from('moments')
      .select('id'),

    supabase
      .from('projects')
      .select('id'),

    supabase
      .from('skills')
      .select('id'),

    supabase
      .from('tasks')
      .select('id')
      .eq('is_completed', false),
  ]);

  let overview: any = null;
  let dailyContext: any = null;

  if (goal) {
    const { data: subjects } = await supabase
      .from('study_subjects')
      .select('*')
      .eq('goal_id', goal.id)
      .order('position');

    const subjectIds = (subjects || []).map(
      (s: any) => s.id
    );

    const { data: chapters } = subjectIds.length
      ? await supabase
          .from('study_chapters')
          .select('*')
          .in('subject_id', subjectIds)
          .order('position')
      : { data: [] };

    const chapterIds = (chapters || []).map(
      (c: any) => c.id
    );

    const [
      { data: revisions },
      { data: sessions },
      { data: tests },
      { data: todayContext },
    ] = await Promise.all([
      chapterIds.length
        ? supabase
            .from('study_revisions')
            .select('*')
            .in('chapter_id', chapterIds)
        : Promise.resolve({
            data: [] as any[],
          }),

      supabase
        .from('study_sessions')
        .select('*')
        .order('started_at', {
          ascending: false,
        })
        .limit(200),

      subjectIds.length
        ? supabase
            .from('study_tests')
            .select('*')
            .in('subject_id', subjectIds)
        : Promise.resolve({
            data: [] as any[],
          }),

      supabase
        .from('study_daily_context')
        .select('*')
        .eq('goal_id', goal.id)
        .eq('date', today)
        .maybeSingle(),
    ]);

    dailyContext = todayContext || null;

    overview = buildStudyOverview(
      goal,
      subjects || [],
      chapters || [],
      {
        revisions: revisions || [],
        sessions: sessions || [],
        tests: tests || [],
        dailyContext,
      }
    );
  }

  const firstName = (
    profile?.full_name || 'there'
  ).split(' ')[0];

  const hour = new Date().getHours();

  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 18
        ? 'Good afternoon'
        : 'Good evening';

  const contextLine = overview
    ? overview.remainingChapters === 0 &&
      overview.totalChapters > 0
      ? `${overview.goal.title} is done. Everything's marked complete.`
      : overview.isBehindOriginalPace
        ? `${overview.remainingChapters} chapters left, ${overview.daysRemaining} days to go — here's today's adjusted plan.`
        : `${overview.remainingChapters} chapters left, ${overview.daysRemaining} days to go — right on pace.`
    : 'Set a study goal to get a real daily plan, or just get on with today.';

  return (
    <div className="mx-auto max-w-5xl">
      {/* HEADER */}

      <div>
        <h1 className="font-display text-3xl text-ink">
          {greeting}, {firstName}.
        </h1>

        <p className="mt-1 text-sm text-muted">
          {contextLine}
        </p>
      </div>

      {/* TODAY ENGINE */}

      <section className="mt-10">
        <TodayEngine
          studyItems={
            overview?.todayPlan?.map((item: any) => ({
              chapterId: item.chapter.id,
              subjectName: item.subjectName,
              chapterName: item.chapter.name,
              minutes: item.minutes,
              priority: item.priority,
              kind: item.kind,
              reason: item.reason,
            })) || []
          }
          tasks={(tasks || []).map((task: any) => ({
            id: task.id,
            title: task.title,
            priority: task.priority,
            due_date: task.due_date,
            category: task.category,
          }))}
          dailyContext={dailyContext}
          today={today}
        />
      </section>

      {/* QUICK NOTE + AI */}

      <section className="mt-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <p className="font-display text-lg text-ink">
              Quick note
            </p>

            {todayDiary ? (
              <div className="mt-3">
                <p className="line-clamp-2 text-sm text-muted">
                  {todayDiary.content}
                </p>

                {todayDiary.mood && (
                  <p className="mt-2 text-sm">
                    {MOOD_META[todayDiary.mood]?.emoji}{' '}
                    {MOOD_META[todayDiary.mood]?.label}
                  </p>
                )}
              </div>
            ) : (
              <div className="mt-3">
                <p className="text-sm text-muted">
                  Nothing written yet today.
                </p>

                <Button
                  href="/private/diary"
                  variant="secondary"
                  className="mt-3"
                >
                  Write today&apos;s entry
                </Button>
              </div>
            )}
          </Card>

          <div className="flex flex-col justify-center">
            <AskLifeOS />
          </div>
        </div>
      </section>

      {/* ON THIS DAY */}

      {onThisDay && onThisDay.length > 0 && (
        <Card className="mt-4 border-gold/30 bg-gold/5">
          <p className="text-sm text-ink">
            <span className="text-muted">
              On this day,{' '}
              {new Date().getFullYear() -
                Number(
                  onThisDay[0].entry_date.slice(0, 4)
                )}{' '}
              year(s) ago:{' '}
            </span>

            {onThisDay[0].title ||
              onThisDay[0].content.slice(0, 100)}
          </p>
        </Card>
      )}

      {/* STUDY */}

      {overview && (
        <section className="mt-10">
          <p className="text-xs uppercase tracking-wide text-muted">
            Study
          </p>

          <Card className="mt-3">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-display text-xl text-ink">
                  {overview.goal.title}
                </p>

                <p className="mt-1 text-sm text-muted">
                  {overview.overallPercent}% complete · next up:{' '}
                  {overview.nextChapter
                    ? overview.nextChapter.chapter.name
                    : 'nothing left'}
                </p>
              </div>

              <div className="flex gap-6 text-right">
                <div>
                  <p className="font-display text-2xl text-ink">
                    {overview.daysRemaining}
                  </p>

                  <p className="text-xs text-muted">
                    days left
                  </p>
                </div>

                <div>
                  <p className="font-display text-2xl text-ink">
                    {overview.remainingChapters}
                  </p>

                  <p className="text-xs text-muted">
                    chapters left
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-moss transition-all"
                style={{
                  width: `${overview.overallPercent}%`,
                }}
              />
            </div>

            {(
              overview.revisionsDueToday.length > 0 ||
              overview.weakChapters.length > 0 ||
              overview.studyTimeTodayMinutes > 0
            ) && (
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
                {overview.studyTimeTodayMinutes > 0 && (
                  <span>
                    {Math.round(
                      overview.studyTimeTodayMinutes / 6
                    ) / 10}
                    h studied today
                  </span>
                )}

                {overview.revisionsDueToday.length > 0 && (
                  <span className="text-gold">
                    {overview.revisionsDueToday.length}{' '}
                    revision
                    {overview.revisionsDueToday.length !== 1
                      ? 's'
                      : ''}{' '}
                    due today
                  </span>
                )}

                {overview.weakChapters.length > 0 && (
                  <span className="text-rust">
                    {overview.weakChapters.length} weak topic
                    {overview.weakChapters.length !== 1
                      ? 's'
                      : ''}
                  </span>
                )}

                {overview.upcomingTests.length > 0 && (
                  <span>
                    next test{' '}
                    {formatDate(
                      overview.upcomingTests[0].test.test_date,
                      {
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </span>
                )}
              </div>
            )}

            <Button
              href="/private/study"
              variant="secondary"
              className="mt-4"
            >
              Open Study
            </Button>
          </Card>
        </section>
      )}

      {/* LIFE */}

      <section className="mt-10">
        <p className="text-xs uppercase tracking-wide text-muted">
          Life
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {[
            {
              href: '/private/tasks',
              label: 'Tasks',
              icon: CheckSquare,
              count: taskCount?.length ?? 0,
            },
            {
              href: '/private/diary',
              label: 'Diary',
              icon: BookOpen,
              count: diaryCount?.length ?? 0,
            },
            {
              href: '/private/memories',
              label: 'Moments',
              icon: ImageIcon,
              count: momentCount?.length ?? 0,
            },
            {
              href: '/private/skills',
              label: 'Skills',
              icon: Award,
              count: skillCount?.length ?? 0,
            },
            {
              href: '/private/projects',
              label: 'Projects',
              icon: FolderKanban,
              count: projectCount?.length ?? 0,
            },
          ].map(
            ({
              href,
              label,
              icon: Icon,
              count,
            }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg border border-line bg-surface px-4 py-4 transition-colors hover:bg-line/30 focus-ring"
              >
                <Icon
                  size={16}
                  className="text-muted"
                />

                <p className="mt-3 text-sm text-ink">
                  {label}
                </p>

                <p className="text-xs text-muted">
                  {count}
                </p>
              </Link>
            )
          )}
        </div>
      </section>
    </div>
  );
}