'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  saveSubject, deleteSubject, saveChapter, deleteChapter,
  toggleChapterStatus, toggleChapterRevision, addChaptersBulk, setChapterStrength,
  completeRevision, startStudySession, stopStudySession, deleteStudySession,
  saveTest, deleteTest,
} from '@/lib/actions/study';
import { Input, Select, Textarea, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { GoalForm } from './goal-form';
import { cn, formatDate } from '@/lib/utils';
import { REVISION_STAGE_LABEL } from '@/lib/study';
import { Trash2, Plus, CheckCircle2, Circle, RotateCcw, Play, Square, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { StudyGoal, StudySubject, StudyTest, StudySession, ChapterStrength } from '@/lib/types';
import type { StudyOverview } from '@/lib/study';

type Tab = 'today' | 'subjects' | 'sessions' | 'tests' | 'progress';

function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cn('h-2 overflow-hidden rounded-full bg-line', className)}>
      <div className="h-full rounded-full bg-moss transition-all" style={{ width: `${Math.min(100, Math.max(0, percent))}%` }} />
    </div>
  );
}

function StrengthDot({ strength }: { strength: ChapterStrength }) {
  const color = strength === 'weak' ? 'bg-rust' : strength === 'strong' ? 'bg-moss' : 'bg-gold';
  return <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', color)} title={strength} />;
}

export function StudyView({
  goal,
  overview,
  subjects,
  tests,
  sessions,
}: {
  goal: StudyGoal;
  overview: StudyOverview;
  subjects: StudySubject[];
  tests: StudyTest[];
  sessions: StudySession[];
}) {
  const [tab, setTab] = useState<Tab>('today');
  const [editingGoal, setEditingGoal] = useState(false);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'subjects', label: 'Subjects' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'tests', label: 'Tests' },
    { key: 'progress', label: 'Progress' },
  ];

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-full border border-line p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn('shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs transition-colors focus-ring', tab === t.key ? 'bg-ink text-paper' : 'text-muted hover:text-ink')}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setEditingGoal((v) => !v)} className="text-xs text-muted hover:text-ink focus-ring">
          Edit goal
        </button>
      </div>

      {editingGoal && <div className="mt-4"><GoalForm goal={goal} onDone={() => setEditingGoal(false)} /></div>}

      {tab === 'today' && <TodayTab overview={overview} goalTitle={goal.title} />}
      {tab === 'subjects' && <SubjectsTab goal={goal} overview={overview} />}
      {tab === 'sessions' && <SessionsTab overview={overview} subjects={subjects} sessions={sessions} />}
      {tab === 'tests' && <TestsTab subjects={subjects} tests={tests} />}
      {tab === 'progress' && <ProgressTab overview={overview} />}
    </div>
  );
}

function TodayTab({ overview, goalTitle }: { overview: StudyOverview; goalTitle: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const totalMinutes = overview.todayPlan.reduce((sum, i) => sum + i.minutes, 0);

  return (
    <div className="mt-6 space-y-6">
      {overview.isBehindOriginalPace && overview.remainingChapters > 0 && (
        <Card className="border-gold/30 bg-gold/5">
          <p className="text-sm text-ink">
            You have <strong>{overview.remainingChapters}</strong> chapters left and <strong>{overview.daysRemaining}</strong> days remaining.
            I&rsquo;ve adjusted today&rsquo;s plan to about <strong>{overview.requiredPacePerDay.toFixed(1)}</strong> chapters/day to keep {goalTitle.toLowerCase()} realistic.
          </p>
        </Card>
      )}

      {overview.remainingChapters === 0 && overview.totalChapters > 0 ? (
        <Card className="border-moss/30 bg-moss/5">
          <p className="text-sm text-ink">Every chapter is marked complete. Nothing left to plan for today — check the Progress tab for anything due for revision.</p>
        </Card>
      ) : overview.todayPlan.length === 0 ? (
        <EmptyState title="Add subjects and chapters to get a daily plan." hint="Head to the Subjects tab to set up your syllabus." />
      ) : (
        <Card>
          <div className="flex items-baseline justify-between">
            <p className="font-display text-lg text-ink">Today</p>
            <p className="text-xs text-muted">{Math.round(totalMinutes / 60 * 10) / 10} hrs planned</p>
          </div>
          <div className="mt-4 space-y-3">
            {overview.todayPlan.map((item) => (
              <div key={`${item.kind}-${item.chapter.id}-${item.revisionId || ''}`} className="flex items-center gap-3 rounded-md border border-line px-3 py-2.5">
                {item.kind === 'chapter' ? (
                  <button
                    onClick={() => startTransition(async () => {
                      await toggleChapterStatus(item.chapter.id, item.chapter.status === 'completed' ? 'not_started' : 'completed');
                      router.refresh();
                    })}
                    className="shrink-0 text-moss focus-ring"
                    aria-label="Toggle complete"
                  >
                    {item.chapter.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-muted" />}
                  </button>
                ) : item.revisionId ? (
                  <button
                    onClick={() => startTransition(async () => { await completeRevision(item.revisionId!); router.refresh(); })}
                    className="shrink-0 text-gold focus-ring"
                    aria-label="Mark revision complete"
                  >
                    <RotateCcw size={16} />
                  </button>
                ) : (
                  <RotateCcw size={16} className="shrink-0 text-gold" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">{item.subjectName} · {item.reason}</p>
                  <p className={cn('text-sm text-ink', item.chapter.status === 'completed' && 'text-muted line-through')}>{item.chapter.name}</p>
                </div>
                {item.priority === 'high' && <Badge tone="rust" className="shrink-0">priority</Badge>}
                <span className="shrink-0 text-xs text-muted">{item.minutes} min</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><p className="font-display text-2xl text-ink">{overview.remainingChapters}</p><p className="mt-1 text-xs text-muted">Chapters left</p></Card>
        <Card><p className="font-display text-2xl text-ink">{overview.daysRemaining}</p><p className="mt-1 text-xs text-muted">Days remaining</p></Card>
        <Card><p className="font-display text-2xl text-ink">{overview.requiredPacePerDay.toFixed(2)}</p><p className="mt-1 text-xs text-muted">Chapters/day needed</p></Card>
        <Card><p className="font-display text-2xl text-ink">{Math.round(overview.studyTimeTodayMinutes / 6) / 10}h</p><p className="mt-1 text-xs text-muted">Studied today</p></Card>
      </div>

      {overview.upcomingTests.length > 0 && (
        <Card>
          <p className="font-display text-lg text-ink">Upcoming tests</p>
          <div className="mt-3 space-y-2">
            {overview.upcomingTests.slice(0, 4).map(({ test, subjectName }) => (
              <div key={test.id} className="flex items-center justify-between text-sm">
                <span className="text-ink">{test.name} <span className="text-muted">· {subjectName}</span></span>
                <span className="text-muted">{formatDate(test.test_date, { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function SubjectsTab({ goal, overview }: { goal: StudyGoal; overview: StudyOverview }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showAddSubject, setShowAddSubject] = useState(false);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowAddSubject((v) => !v)}><Plus size={14} /> Add subject</Button>
      </div>

      {showAddSubject && (
        <Card>
          <form
            action={(fd) => { fd.set('goal_id', goal.id); startTransition(async () => { await saveSubject(fd); setShowAddSubject(false); router.refresh(); }); }}
            className="flex gap-2"
          >
            <Input name="name" placeholder="Subject name (e.g. Maths)" required className="flex-1" />
            <Button type="submit">Add</Button>
          </form>
        </Card>
      )}

      {overview.subjects.length === 0 ? (
        <EmptyState title="No subjects yet." hint="Add your first subject above." />
      ) : (
        overview.subjects.map((sp) => (
          <SubjectBlock key={sp.subject.id} subjectId={sp.subject.id} name={sp.subject.name} chapters={sp.chapters} />
        ))
      )}
    </div>
  );
}

function SubjectBlock({
  subjectId,
  name,
  chapters,
}: {
  subjectId: string;
  name: string;
  chapters: StudyOverview['subjects'][number]['chapters'];
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showBulk, setShowBulk] = useState(false);
  const [showAddOne, setShowAddOne] = useState(false);
  const completed = chapters.filter((c) => c.status === 'completed').length;

  const cycleStrength = (current: ChapterStrength): ChapterStrength =>
    current === 'weak' ? 'average' : current === 'average' ? 'strong' : 'weak';

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-lg text-ink">{name}</p>
          <p className="text-xs text-muted">{completed}/{chapters.length} chapters</p>
        </div>
        <button
          onClick={() => { if (confirm(`Delete ${name} and all its chapters?`)) startTransition(async () => { await deleteSubject(subjectId); router.refresh(); }); }}
          className="p-1 text-muted hover:text-rust focus-ring"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="mt-4 space-y-1.5">
        {chapters.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-2.5 rounded-md px-2 py-1.5 hover:bg-line/30">
            <button
              onClick={() => startTransition(async () => { await toggleChapterStatus(c.id, c.status === 'completed' ? 'not_started' : 'completed'); router.refresh(); })}
              className="shrink-0 text-moss focus-ring"
              aria-label="Toggle complete"
            >
              {c.status === 'completed' ? <CheckCircle2 size={16} /> : <Circle size={16} className="text-muted" />}
            </button>
            <span className={cn('min-w-0 flex-1 text-sm text-ink', c.status === 'completed' && 'text-muted line-through')}>{c.name}</span>
            <button
              onClick={() => startTransition(async () => { await setChapterStrength(c.id, cycleStrength(c.strength)); router.refresh(); })}
              className="flex shrink-0 items-center gap-1 rounded-full border border-line px-2 py-0.5 text-xs text-muted hover:text-ink focus-ring"
              title="Click to cycle: weak → average → strong"
            >
              <StrengthDot strength={c.strength} /> {c.strength}
            </button>
            <Badge>{c.difficulty}</Badge>
            <button
              onClick={() => startTransition(async () => {
                await toggleChapterRevision(c.id, c.revision_status === 'needs_revision' ? 'none' : 'needs_revision');
                router.refresh();
              })}
              className={cn('rounded-full p-1 focus-ring', c.revision_status === 'needs_revision' ? 'text-gold' : 'text-muted hover:text-gold')}
              title="Flag for revision"
            >
              <RotateCcw size={13} />
            </button>
            <button onClick={() => startTransition(async () => { await deleteChapter(c.id); router.refresh(); })} className="p-1 text-muted hover:text-rust focus-ring">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setShowAddOne((v) => !v)}>+ One chapter</Button>
        <Button variant="secondary" onClick={() => setShowBulk((v) => !v)}>+ Paste a list</Button>
      </div>

      {showAddOne && (
        <form
          action={(fd) => { fd.set('subject_id', subjectId); startTransition(async () => { await saveChapter(fd); setShowAddOne(false); router.refresh(); }); }}
          className="mt-3 flex flex-wrap gap-2"
        >
          <Input name="name" placeholder="Chapter name" required className="flex-1" />
          <Select name="difficulty" defaultValue="medium" className="w-auto">
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          <Button type="submit">Add</Button>
        </form>
      )}

      {showBulk && (
        <BulkAddForm subjectId={subjectId} onDone={() => { setShowBulk(false); router.refresh(); }} />
      )}
    </Card>
  );
}

function BulkAddForm({ subjectId, onDone }: { subjectId: string; onDone: () => void }) {
  const [text, setText] = useState('');
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={'One chapter per line, e.g.\nReal Numbers\nPolynomials\nPair of Linear Equations'}
      />
      <Button className="mt-2" disabled={pending} onClick={() => startTransition(async () => { await addChaptersBulk(subjectId, text); onDone(); })}>
        {pending ? 'Adding…' : 'Add all'}
      </Button>
    </div>
  );
}

function SessionsTab({ overview, subjects, sessions }: { overview: StudyOverview; subjects: StudySubject[]; sessions: StudySession[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [subjectId, setSubjectId] = useState('');

  const active = overview.activeSession;
  const recent = sessions.filter((s) => s.ended_at).slice(0, 15);

  return (
    <div className="mt-6 space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card><p className="font-display text-2xl text-ink">{Math.round(overview.studyTimeTodayMinutes / 6) / 10}h</p><p className="mt-1 text-xs text-muted">Today</p></Card>
        <Card><p className="font-display text-2xl text-ink">{Math.round(overview.studyTimeWeekMinutes / 6) / 10}h</p><p className="mt-1 text-xs text-muted">This week</p></Card>
      </div>

      <Card>
        {active ? (
          <div>
            <p className="text-xs text-muted">Session running since {new Date(active.started_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</p>
            <p className="mt-1 font-display text-lg text-ink">
              {subjects.find((s) => s.id === active.subject_id)?.name || 'General study'}
            </p>
            <Button
              className="mt-3"
              variant="secondary"
              disabled={pending}
              onClick={() => startTransition(async () => { await stopStudySession(active.id); router.refresh(); })}
            >
              <Square size={14} /> Stop session
            </Button>
          </div>
        ) : (
          <div>
            <p className="font-display text-lg text-ink">Start a session</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="w-auto">
                <option value="">No specific subject</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
              <Button
                disabled={pending}
                onClick={() => startTransition(async () => { await startStudySession(subjectId || null, null); router.refresh(); })}
              >
                <Play size={14} /> Start
              </Button>
            </div>
          </div>
        )}
      </Card>

      <div>
        <p className="font-display text-lg text-ink">Recent sessions</p>
        {recent.length === 0 ? (
          <div className="mt-3"><EmptyState title="No sessions logged yet." hint="Start one above — even a rough log beats guessing." /></div>
        ) : (
          <div className="mt-3 space-y-2">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
                <span className="text-ink">
                  {subjects.find((sub) => sub.id === s.subject_id)?.name || 'General study'}
                  <span className="ml-2 text-xs text-muted">{formatDate(s.started_at, { month: 'short', day: 'numeric' })}</span>
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-muted">{s.duration_minutes} min</span>
                  <button onClick={() => startTransition(async () => { await deleteStudySession(s.id); router.refresh(); })} className="p-1 text-muted hover:text-rust focus-ring">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TestsTab({ subjects, tests }: { subjects: StudySubject[]; tests: StudyTest[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StudyTest | null>(null);

  const upcoming = tests.filter((t) => t.marks_obtained === null).sort((a, b) => a.test_date.localeCompare(b.test_date));
  const completed = tests.filter((t) => t.marks_obtained !== null).sort((a, b) => b.test_date.localeCompare(a.test_date));

  return (
    <div className="mt-6 space-y-8">
      <div className="flex justify-end">
        <Button onClick={() => { setEditing(null); setShowForm((v) => !v); }}><Plus size={14} /> Add test</Button>
      </div>

      {(showForm || editing) && (
        <TestForm
          subjects={subjects}
          test={editing}
          onDone={() => { setShowForm(false); setEditing(null); router.refresh(); }}
        />
      )}

      <div>
        <p className="font-display text-lg text-ink">Upcoming</p>
        {upcoming.length === 0 ? (
          <div className="mt-3"><EmptyState title="No upcoming tests." /></div>
        ) : (
          <div className="mt-3 space-y-2">
            {upcoming.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2.5 text-sm">
                <div>
                  <p className="text-ink">{t.name}</p>
                  <p className="text-xs text-muted">{subjects.find((s) => s.id === t.subject_id)?.name} · {formatDate(t.test_date, { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setEditing(t); setShowForm(false); }} className="text-xs text-muted hover:text-ink focus-ring">Edit</button>
                  <button onClick={() => startTransition(async () => { await deleteTest(t.id); router.refresh(); })} className="p-1 text-muted hover:text-rust focus-ring"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="font-display text-lg text-ink">Completed</p>
        {completed.length === 0 ? (
          <div className="mt-3"><EmptyState title="No completed tests yet." hint="Add marks once a test is taken to see your percentage." /></div>
        ) : (
          <div className="mt-3 space-y-2">
            {completed.map((t) => {
              const pct = Math.round(((t.marks_obtained as number) / t.total_marks) * 1000) / 10;
              return (
                <div key={t.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2.5 text-sm">
                  <div>
                    <p className="text-ink">{t.name}</p>
                    <p className="text-xs text-muted">{subjects.find((s) => s.id === t.subject_id)?.name} · {formatDate(t.test_date, { month: 'short', day: 'numeric' })} · {t.marks_obtained}/{t.total_marks}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={pct >= 75 ? 'moss' : pct >= 50 ? 'gold' : 'rust'}>{pct}%</Badge>
                    <button onClick={() => { setEditing(t); setShowForm(false); }} className="text-xs text-muted hover:text-ink focus-ring">Edit</button>
                    <button onClick={() => startTransition(async () => { await deleteTest(t.id); router.refresh(); })} className="p-1 text-muted hover:text-rust focus-ring"><Trash2 size={13} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TestForm({ subjects, test, onDone }: { subjects: StudySubject[]; test: StudyTest | null; onDone: () => void }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <form
        action={(fd) => { if (test) fd.set('id', test.id); startTransition(async () => { await saveTest(fd); onDone(); }); }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="subject_id">Subject</Label>
            <Select id="subject_id" name="subject_id" defaultValue={test?.subject_id} required>
              <option value="" disabled>Choose a subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="name">Test name</Label>
            <Input id="name" name="name" defaultValue={test?.name} placeholder="Unit Test 2" required />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="test_date">Date</Label>
            <Input id="test_date" name="test_date" type="date" defaultValue={test?.test_date} required />
          </div>
          <div>
            <Label htmlFor="total_marks">Total marks</Label>
            <Input id="total_marks" name="total_marks" type="number" min={1} defaultValue={test?.total_marks} required />
          </div>
          <div>
            <Label htmlFor="marks_obtained">Marks obtained</Label>
            <Input id="marks_obtained" name="marks_obtained" type="number" min={0} defaultValue={test?.marks_obtained ?? ''} placeholder="Leave blank if not taken yet" />
          </div>
        </div>
        <div>
          <Label htmlFor="chapters_covered">Chapters covered (comma separated, optional)</Label>
          <Input id="chapters_covered" name="chapters_covered" defaultValue={test?.chapters_covered?.join(', ')} />
        </div>
        <div>
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={test?.notes} rows={2} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save test'}</Button>
          <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}

function ProgressTab({ overview }: { overview: StudyOverview }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <div className="mt-6 space-y-8">
      <Card>
        <div className="flex items-baseline justify-between">
          <p className="font-display text-lg text-ink">Overall progress</p>
          <p className="font-display text-2xl text-ink">{overview.overallPercent}%</p>
        </div>
        <ProgressBar percent={overview.overallPercent} className="mt-4" />
      </Card>

      <div>
        <p className="font-display text-lg text-ink">By subject</p>
        <div className="mt-4 space-y-4">
          {overview.subjects.map((sp) => (
            <div key={sp.subject.id}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-ink">{sp.subject.name}</span>
                <span className="text-muted">{sp.percent}% · {sp.completed}/{sp.total}</span>
              </div>
              <ProgressBar percent={sp.percent} className="mt-1.5" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card><p className="font-display text-2xl text-ink">{overview.completedChapters}</p><p className="mt-1 text-xs text-muted">Chapters completed</p></Card>
        <Card><p className="font-display text-2xl text-ink">{overview.remainingChapters}</p><p className="mt-1 text-xs text-muted">Chapters remaining</p></Card>
        <Card><p className="font-display text-2xl text-ink">{overview.estimatedHoursRemaining.toFixed(1)}h</p><p className="mt-1 text-xs text-muted">Estimated time left</p></Card>
        <Card><p className="font-display text-2xl text-ink">{overview.currentPacePerDay.toFixed(2)}</p><p className="mt-1 text-xs text-muted">Current pace / day</p></Card>
        <Card><p className="font-display text-2xl text-ink">{overview.requiredPacePerDay.toFixed(2)}</p><p className="mt-1 text-xs text-muted">Required pace / day</p></Card>
        <Card><p className="font-display text-2xl text-ink">{formatDate(overview.goal.target_date, { month: 'short', day: 'numeric' })}</p><p className="mt-1 text-xs text-muted">Target date</p></Card>
      </div>

      {overview.weakChapters.length > 0 && (
        <div>
          <p className="font-display text-lg text-ink">Weak topics</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {overview.weakChapters.map(({ chapter, subjectName }) => (
              <Badge key={chapter.id} tone="rust">{chapter.name} <span className="ml-1 opacity-70">· {subjectName}</span></Badge>
            ))}
          </div>
        </div>
      )}

      {overview.performanceBySubject.some((p) => p.testsCount > 0) && (
        <div>
          <p className="font-display text-lg text-ink">Performance</p>
          <div className="mt-3 space-y-2">
            {overview.performanceBySubject.filter((p) => p.testsCount > 0).map((p) => (
              <div key={p.subjectId} className="flex items-center justify-between rounded-md border border-line px-3 py-2.5 text-sm">
                <span className="text-ink">{p.subjectName} <span className="text-xs text-muted">· {p.testsCount} test{p.testsCount !== 1 ? 's' : ''}</span></span>
                <div className="flex items-center gap-2">
                  {p.trend === 'up' && <TrendingUp size={14} className="text-moss" />}
                  {p.trend === 'down' && <TrendingDown size={14} className="text-rust" />}
                  {p.trend === 'flat' && <Minus size={14} className="text-muted" />}
                  <span className="text-ink">{p.averagePercent}% avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {overview.upcomingRevisions.length > 0 && (
        <div>
          <p className="font-display text-lg text-ink">Upcoming revisions</p>
          <div className="mt-3 space-y-2">
            {overview.upcomingRevisions.slice(0, 8).map(({ revision, chapter, subjectName }) => (
              <div key={revision.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
                <span className="text-ink">{chapter.name} <span className="text-muted">· {subjectName}</span></span>
                <span className="text-xs text-muted">{REVISION_STAGE_LABEL[revision.stage]} · {formatDate(revision.due_date, { month: 'short', day: 'numeric' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {overview.chaptersNeedingRevision.length > 0 && (
        <div>
          <p className="font-display text-lg text-ink">Flagged for revision</p>
          <div className="mt-3 space-y-2">
            {overview.chaptersNeedingRevision.map(({ chapter, subjectName }) => (
              <div key={chapter.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2 text-sm">
                <span className="text-ink">{chapter.name} <span className="text-muted">· {subjectName}</span></span>
                <button
                  onClick={() => startTransition(async () => { await toggleChapterRevision(chapter.id, 'revised'); router.refresh(); })}
                  className="text-xs text-moss hover:underline focus-ring"
                >
                  Mark revised
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
