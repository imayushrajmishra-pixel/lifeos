'use client';

import Link from 'next/link';
import { BookOpen, CheckSquare, Clock3, ArrowRight } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TodayStudyItem = {
  chapterId: string;
  subjectName: string;
  chapterName: string;
  minutes: number;
  priority: 'high' | 'medium' | 'low';
  kind: 'chapter' | 'revision';
  reason: string;
};

type TodayTask = {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  due_date: string | null;
  category?: string | null;
};

type DailyContext = {
  available_minutes: number | null;
  study_minutes: number | null;
  mobile_minutes: number | null;
  tv_minutes: number | null;
  mood: string | null;
  energy: string | null;
  preferred_subject: string | null;
  notes: string | null;
};

type TodayItem =
  | {
      type: 'study';
      id: string;
      title: string;
      subtitle: string;
      minutes: number;
      priority: 'high' | 'medium' | 'low';
      reason: string;
    }
  | {
      type: 'task';
      id: string;
      title: string;
      subtitle: string;
      priority: 'high' | 'medium' | 'low';
      due_date: string | null;
    };

function priorityRank(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high') return 3;
  if (priority === 'medium') return 2;
  return 1;
}

function taskUrgency(task: TodayTask, today: string) {
  if (task.due_date && task.due_date < today) return 100;
  if (task.due_date === today) return 90;
  if (task.priority === 'high') return 80;
  if (task.priority === 'medium') return 50;
  return 20;
}

function studyUrgency(item: TodayStudyItem) {
  if (item.priority === 'high') return 75;
  if (item.priority === 'medium') return 45;
  return 20;
}

function formatDueDate(date: string | null, today: string) {
  if (!date) return 'No deadline';

  if (date < today) return 'Overdue';
  if (date === today) return 'Due today';

  const d = new Date(`${date}T00:00:00`);

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function priorityDot(priority: 'high' | 'medium' | 'low') {
  return cn(
    'h-2 w-2 shrink-0 rounded-full',
    priority === 'high'
      ? 'bg-rust'
      : priority === 'medium'
        ? 'bg-gold'
        : 'bg-muted'
  );
}

export function TodayEngine({
  studyItems,
  tasks,
  dailyContext,
  today,
}: {
  studyItems: TodayStudyItem[];
  tasks: TodayTask[];
  dailyContext: DailyContext | null;
  today: string;
}) {
  /*
   * Only tasks that make sense for TODAY enter the combined engine:
   *
   * 1. overdue
   * 2. due today
   * 3. high-priority tasks without a date
   *
   * Future low/medium tasks stay in Tasks instead of cluttering Today.
   */
  const todayTasks = tasks.filter((task) => {
    if (task.due_date && task.due_date < today) return true;
    if (task.due_date === today) return true;
    if (!task.due_date && task.priority === 'high') return true;

    return false;
  });

  const study: TodayItem[] = studyItems.map((item) => ({
    type: 'study',
    id: `study-${item.chapterId}`,
    title: `${item.subjectName} — ${item.chapterName}`,
    subtitle: item.kind === 'revision' ? 'Revision' : 'Study',
    minutes: item.minutes,
    priority: item.priority,
    reason: item.reason,
  }));

  const taskItems: TodayItem[] = todayTasks.map((task) => ({
    type: 'task',
    id: `task-${task.id}`,
    title: task.title,
    subtitle: task.category || 'Task',
    priority: task.priority,
    due_date: task.due_date,
  }));

  /*
   * Combine both systems.
   *
   * Tasks get urgency from deadlines.
   * Study gets urgency from the adaptive study planner.
   *
   * This means the Today page is no longer:
   *   Study card + Tasks card
   *
   * It becomes one prioritized day.
   */
  const combined: TodayItem[] = [...study, ...taskItems].sort((a, b) => {
    const aScore =
      a.type === 'task'
        ? taskUrgency(
            {
              id: a.id,
              title: a.title,
              priority: a.priority,
              due_date: a.due_date,
            },
            today
          )
        : studyUrgency({
            chapterId: a.id,
            subjectName: '',
            chapterName: a.title,
            minutes: a.minutes,
            priority: a.priority,
            kind: 'chapter',
            reason: a.reason,
          });

    const bScore =
      b.type === 'task'
        ? taskUrgency(
            {
              id: b.id,
              title: b.title,
              priority: b.priority,
              due_date: b.due_date,
            },
            today
          )
        : studyUrgency({
            chapterId: b.id,
            subjectName: '',
            chapterName: b.title,
            minutes: b.minutes,
            priority: b.priority,
            kind: 'chapter',
            reason: b.reason,
          });

    if (aScore !== bScore) return bScore - aScore;

    if (a.type === 'study' && b.type === 'study') {
      return b.minutes - a.minutes;
    }

    return 0;
  });

  const visibleItems = combined.slice(0, 8);

  const studyMinutes = study.reduce(
    (sum, item) => sum + (item.type === 'study' ? item.minutes : 0),
    0
  );

  const urgentTasks = todayTasks.filter(
    (task) =>
      task.priority === 'high' ||
      (task.due_date && task.due_date <= today)
  ).length;

  const leisureMinutes =
    (dailyContext?.mobile_minutes || 0) +
    (dailyContext?.tv_minutes || 0);

  const hasContext = Boolean(dailyContext);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">
            Today
          </p>

          <h2 className="mt-1 font-display text-2xl text-ink">
            Your day
          </h2>

          <p className="mt-1 max-w-xl text-sm text-muted">
            Study, tasks and real-life time combined into one plan.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            href="/private/study"
            variant="secondary"
            className="text-xs"
          >
            Study
          </Button>

          <Button
            href="/private/tasks"
            variant="secondary"
            className="text-xs"
          >
            Tasks
          </Button>
        </div>
      </div>

      {/* Daily context */}
      {hasContext && (
        <div className="mt-5 flex flex-wrap gap-2">
          {dailyContext?.available_minutes !== null &&
            dailyContext?.available_minutes !== undefined && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
                <Clock3 size={12} />
                {dailyContext.available_minutes}m free
              </span>
            )}

          {dailyContext?.study_minutes !== null &&
            dailyContext?.study_minutes !== undefined && (
              <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
                {dailyContext.study_minutes}m study
              </span>
            )}

          {leisureMinutes > 0 && (
            <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
              {leisureMinutes}m mobile/TV
            </span>
          )}

          {dailyContext?.energy && (
            <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs capitalize text-muted">
              {dailyContext.energy} energy
            </span>
          )}

          {dailyContext?.mood && (
            <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs capitalize text-muted">
              {dailyContext.mood} mood
            </span>
          )}

          {dailyContext?.preferred_subject && (
            <span className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted">
              Focus: {dailyContext.preferred_subject}
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-line bg-surface px-3 py-3">
          <p className="text-lg font-medium text-ink">
            {studyMinutes}m
          </p>
          <p className="mt-0.5 text-xs text-muted">
            study planned
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface px-3 py-3">
          <p className="text-lg font-medium text-ink">
            {todayTasks.length}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            tasks today
          </p>
        </div>

        <div className="rounded-lg border border-line bg-surface px-3 py-3">
          <p className="text-lg font-medium text-ink">
            {urgentTasks}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            urgent
          </p>
        </div>
      </div>

      {/* Combined plan */}
      <div className="mt-6">
        {visibleItems.length > 0 ? (
          <div className="space-y-2">
            {visibleItems.map((item, index) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border border-line bg-surface px-3 py-3',
                  index === 0 && 'border-ink/10'
                )}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-paper text-xs text-muted">
                  {index + 1}
                </div>

                {item.type === 'study' ? (
                  <BookOpen
                    size={16}
                    className="shrink-0 text-muted"
                  />
                ) : (
                  <CheckSquare
                    size={16}
                    className="shrink-0 text-muted"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink">
                    {item.title}
                  </p>

                  <p className="mt-0.5 truncate text-xs text-muted">
                    {item.type === 'study'
                      ? item.reason
                      : `${item.subtitle} · ${formatDueDate(
                          item.due_date,
                          today
                        )}`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className={priorityDot(item.priority)} />

                  {item.type === 'study' && (
                    <span className="text-xs text-muted">
                      {item.minutes}m
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-line bg-surface px-4 py-6 text-center">
            <p className="text-sm text-ink">
              Nothing urgent for today.
            </p>

            <p className="mt-1 text-xs text-muted">
              You&apos;re caught up. Enjoy the day.
            </p>
          </div>
        )}
      </div>

      {/* Context note */}
      {dailyContext?.notes && (
        <div className="mt-4 rounded-lg border border-line bg-surface px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted">
            Today&apos;s note
          </p>

          <p className="mt-1 text-sm text-ink">
            {dailyContext.notes}
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-xs text-muted">
          {combined.length > 8
            ? `Showing 8 of ${combined.length} important items`
            : `${combined.length} items planned for today`}
        </p>

        <Link
          href="/private/tasks"
          className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-ink focus-ring"
        >
          Manage everything
          <ArrowRight size={12} />
        </Link>
      </div>
    </Card>
  );
}