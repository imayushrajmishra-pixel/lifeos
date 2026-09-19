import type { StudyGoal, StudySubject, StudyChapter, StudyRevision, StudySession, StudyTest, RevisionStage } from './types';

// All the "adaptive" behavior in the study system comes from recalculating
// this fresh every time it's called — required pace is always
// remaining-chapters ÷ days-left, so if a day is missed, days-left drops and
// required pace rises automatically. Nothing here is a black box: every
// number shown to the user is one of these fields, verbatim.
//
// buildStudyOverview's first three params (goal, subjects, chapters) are the
// original v1 signature and still work exactly as before if called that way
// — the fourth `extra` param is optional, so existing call sites compile and
// run unchanged. Passing `extra` unlocks weak-topic prioritization, revision
// scheduling, session time, and test-aware planning.

export interface SubjectProgress {
  subject: StudySubject;
  chapters: StudyChapter[];
  total: number;
  completed: number;
  remaining: number;
  percent: number;
}

export interface StudyPlanItem {
  chapter: StudyChapter;
  subjectName: string;
  minutes: number;
  kind: 'chapter' | 'revision';
  priority: 'high' | 'medium' | 'low';
  reason: string;
  revisionId?: string;
}

export interface RevisionWithChapter {
  revision: StudyRevision;
  chapter: StudyChapter;
  subjectName: string;
}

export interface SubjectPerformance {
  subjectName: string;
  subjectId: string;
  testsCount: number;
  averagePercent: number;
  lastPercent: number | null;
  trend: 'up' | 'down' | 'flat' | 'not_enough_data';
}

export interface StudyOverview {
  goal: StudyGoal;
  subjects: SubjectProgress[];
  totalChapters: number;
  completedChapters: number;
  remainingChapters: number;
  overallPercent: number;
  daysRemaining: number;
  daysSinceStart: number;
  totalPlannedDays: number;
  requiredPacePerDay: number;
  originalPacePerDay: number;
  currentPacePerDay: number;
  isBehindOriginalPace: boolean;
  estimatedHoursRemaining: number;
  todayPlan: StudyPlanItem[];
  nextChapter: { chapter: StudyChapter; subjectName: string } | null;
  chaptersNeedingRevision: { chapter: StudyChapter; subjectName: string }[];
  // --- added in migration 0003 ---
  weakChapters: { chapter: StudyChapter; subjectName: string }[];
  revisionsDueToday: RevisionWithChapter[];
  upcomingRevisions: RevisionWithChapter[];
  studyTimeTodayMinutes: number;
  studyTimeWeekMinutes: number;
  plannedMinutesToday: number;
  todayStudyBudgetMinutes: number | null;
  todayLeisureMinutes: number;
  activeSession: StudySession | null;
  upcomingTests: { test: StudyTest; subjectName: string }[];
  performanceBySubject: SubjectPerformance[];
}

export interface StudyDailyContext {
  available_minutes: number | null;
  study_minutes: number | null;
  mobile_minutes: number | null;
  tv_minutes: number | null;
  mood: string | null;
  energy: string | null;
  preferred_subject: string | null;
  notes: string | null;
}

export interface StudyOverviewExtra {
  revisions?: StudyRevision[];
  sessions?: StudySession[];
  tests?: StudyTest[];
  dailyContext?: StudyDailyContext | null;
}

function daysBetween(a: Date, b: Date) {
  const ms = b.setHours(0, 0, 0, 0) - a.setHours(0, 0, 0, 0);
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function isSameDay(iso: string, ref: Date) {
  const d = new Date(iso);
  return d.toDateString() === ref.toDateString();
}

export function buildStudyOverview(
  goal: StudyGoal,
  subjects: StudySubject[],
  chapters: StudyChapter[],
  extra: StudyOverviewExtra = {}
): StudyOverview {
const {
  revisions = [],
  sessions = [],
  tests = [],
  dailyContext = null,
} = extra;
  const today = new Date();
  const todayISO = today.toISOString().slice(0, 10);
  const target = new Date(goal.target_date + 'T00:00:00');
  const created = new Date(goal.created_at);

  const daysRemaining = Math.max(daysBetween(new Date(today), new Date(target)), 0);
  const daysSinceStart = Math.max(daysBetween(new Date(created), new Date(today)), 0);
  const totalPlannedDays = Math.max(daysBetween(new Date(created), new Date(target)), 1);

  const chapterById = new Map(chapters.map((c) => [c.id, c]));
  const subjectNameByChapterId = new Map<string, string>();

  const bySubject = new Map<string, StudyChapter[]>();
  for (const c of chapters) {
    const list = bySubject.get(c.subject_id) || [];
    list.push(c);
    bySubject.set(c.subject_id, list);
  }

  const subjectProgress: SubjectProgress[] = subjects
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((s) => {
      const list = (bySubject.get(s.id) || []).slice().sort((a, b) => a.position - b.position);
      list.forEach((c) => subjectNameByChapterId.set(c.id, s.name));
      const completed = list.filter((c) => c.status === 'completed').length;
      return {
        subject: s,
        chapters: list,
        total: list.length,
        completed,
        remaining: list.length - completed,
        percent: list.length > 0 ? Math.round((completed / list.length) * 100) : 0,
      };
    });

  const totalChapters = chapters.length;
  const completedChapters = chapters.filter((c) => c.status === 'completed').length;
  const remainingChapters = totalChapters - completedChapters;
  const overallPercent = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const requiredPacePerDay = remainingChapters / Math.max(daysRemaining, 1);
  const originalPacePerDay = totalChapters / totalPlannedDays;
  const currentPacePerDay = daysSinceStart > 0 ? completedChapters / daysSinceStart : completedChapters;
  const isBehindOriginalPace = requiredPacePerDay > originalPacePerDay * 1.15 && remainingChapters > 0;

  const estimatedHoursRemaining =
    chapters.filter((c) => c.status !== 'completed').reduce((sum, c) => sum + c.estimated_minutes, 0) / 60;

  // --- Upcoming tests (subject's own goal only) ---
  const subjectIds = new Set(subjects.map((s) => s.id));
  const relevantTests = tests.filter((t) => subjectIds.has(t.subject_id));
  const upcomingTests = relevantTests
    .filter((t) => t.test_date >= todayISO)
    .sort((a, b) => a.test_date.localeCompare(b.test_date))
    .map((t) => ({ test: t, subjectName: subjects.find((s) => s.id === t.subject_id)?.name || '' }));

  // Chapters worth prioritizing because a test is coming up within a week.
  const soonDate = new Date(today);
  soonDate.setDate(soonDate.getDate() + 7);
  const soonISO = soonDate.toISOString().slice(0, 10);
  const testPriorityChapterIds = new Set<string>();
  const testPrioritySubjectWide = new Set<string>();
  for (const t of relevantTests) {
    if (t.test_date < todayISO || t.test_date > soonISO) continue;
    if (t.chapters_covered && t.chapters_covered.length > 0) {
      const names = new Set(t.chapters_covered.map((n) => n.toLowerCase().trim()));
      for (const c of chapters) {
        if (c.subject_id === t.subject_id && names.has(c.name.toLowerCase().trim())) {
          testPriorityChapterIds.add(c.id);
        }
      }
    } else {
      testPrioritySubjectWide.add(t.subject_id);
    }
  }

// --- Today's plan: context-aware, priority-ordered ---
const rawAvailableMinutes = dailyContext?.available_minutes ?? null;
const mobileMinutes = Math.max(0, dailyContext?.mobile_minutes ?? 0);
const tvMinutes = Math.max(0, dailyContext?.tv_minutes ?? 0);

// Free time is capacity, not a study requirement.
// Leisure/preferences are reserved first.
const afterLeisureMinutes =
  rawAvailableMinutes === null
    ? null
    : Math.max(0, rawAvailableMinutes - mobileMinutes - tvMinutes);

const requestedStudyMinutes =
  dailyContext?.study_minutes !== null &&
  dailyContext?.study_minutes !== undefined
    ? Math.max(0, dailyContext.study_minutes)
    : null;

let studyBudgetMinutes =
  requestedStudyMinutes !== null
    ? requestedStudyMinutes
    : afterLeisureMinutes;

if (studyBudgetMinutes !== null && afterLeisureMinutes !== null) {
  studyBudgetMinutes = Math.min(studyBudgetMinutes, afterLeisureMinutes);
}

// Low energy / low mood means we should not fill every available minute.
const lowEnergy =
  dailyContext?.energy === 'low' ||
  dailyContext?.energy === 'tired';

const lowMood =
  dailyContext?.mood === 'low' ||
  dailyContext?.mood === 'tired';

if (studyBudgetMinutes !== null && (lowEnergy || lowMood)) {
  studyBudgetMinutes = Math.round(studyBudgetMinutes * 0.7);
}

const todayPlan: StudyPlanItem[] = [];
const addedChapterIds = new Set<string>();
let plannedMinutes = 0;

const canFitMinutes = (minutes: number) => {
  if (studyBudgetMinutes === null) return true;

  // Always allow one meaningful study item when the user has
  // some study capacity, even if the chapter is longer than the
  // remaining budget.
  if (todayPlan.length === 0) {
    return studyBudgetMinutes > 0;
  }

  return plannedMinutes + minutes <= studyBudgetMinutes;
};

const addChapterItem = (
  c: StudyChapter,
  priority: StudyPlanItem['priority'],
  reason: string
) => {
  if (addedChapterIds.has(c.id)) return;
  if (!canFitMinutes(c.estimated_minutes)) return;

  addedChapterIds.add(c.id);
  plannedMinutes += c.estimated_minutes;

  todayPlan.push({
    chapter: c,
    subjectName: subjectNameByChapterId.get(c.id) || '',
    minutes: c.estimated_minutes,
    kind: 'chapter',
    priority,
    reason,
  });
};

// Preferred subject gets a small priority boost when the user
// explicitly tells LifeOS what they feel like studying.
const preferredSubject = dailyContext?.preferred_subject
  ?.trim()
  .toLowerCase();

const preferredSubjects = preferredSubject
  ? subjectProgress.filter((sp) =>
      sp.subject.name.toLowerCase().includes(preferredSubject)
    )
  : [];

// 1. Preferred subject + weak topics.
for (const sp of preferredSubjects) {
  for (const c of sp.chapters) {
    if (c.status === 'completed' || c.strength !== 'weak') continue;

    addChapterItem(
      c,
      'high',
      'Preferred subject + weak topic'
    );
  }
}

// 2. Weak topics.
for (const sp of subjectProgress) {
  for (const c of sp.chapters) {
    if (c.status === 'completed' || c.strength !== 'weak') continue;

    addChapterItem(
      c,
      'high',
      'Weak topic — needs extra attention'
    );
  }
}

// 3. Upcoming tests.
for (const sp of subjectProgress) {
  for (const c of sp.chapters) {
    if (c.status === 'completed') continue;

    const test = relevantTests.find(
      (t) =>
        t.subject_id === sp.subject.id &&
        t.test_date >= todayISO &&
        t.test_date <= soonISO
    );

    if (
      testPriorityChapterIds.has(c.id) ||
      (test && testPrioritySubjectWide.has(sp.subject.id))
    ) {
      addChapterItem(
        c,
        'high',
        test ? `Test on ${test.test_date}` : 'Upcoming test on this subject'
      );
    }
  }
}

// 4. Fill remaining capacity across subjects.
const cursors = new Map(
  subjectProgress.map((sp) => [sp.subject.id, 0])
);

let guard = 0;

while (guard < 300) {
  guard++;

  let addedAny = false;

  for (const sp of subjectProgress) {
    const incomplete = sp.chapters.filter(
      (c) => c.status !== 'completed'
    );

    const cursor = cursors.get(sp.subject.id) || 0;

    if (cursor >= incomplete.length) continue;

    const chapter = incomplete[cursor];

    cursors.set(sp.subject.id, cursor + 1);

    const before = todayPlan.length;

    addChapterItem(
      chapter,
      'medium',
      'Next in your plan'
    );

    if (todayPlan.length > before) {
      addedAny = true;
    }

    if (
      studyBudgetMinutes !== null &&
      plannedMinutes >= studyBudgetMinutes
    ) {
      break;
    }
  }

  if (!addedAny) break;

  if (
    studyBudgetMinutes !== null &&
    plannedMinutes >= studyBudgetMinutes
  ) {
    break;
  }
}
  // Legacy manual "needs revision" flag — unchanged from before migration 0003.
  const chaptersNeedingRevision = subjectProgress.flatMap((sp) =>
    sp.chapters.filter((c) => c.revision_status === 'needs_revision').map((c) => ({ chapter: c, subjectName: sp.subject.name }))
  );
  if (chaptersNeedingRevision.length > 0 && todayPlan.length < 6) {
    const pick = chaptersNeedingRevision[0];
    if (!addedChapterIds.has(pick.chapter.id)) {
      todayPlan.push({ chapter: pick.chapter, subjectName: pick.subjectName, minutes: 30, kind: 'revision', priority: 'medium', reason: 'Flagged for revision' });
      addedChapterIds.add(pick.chapter.id);
    }
  }

  // --- New staged revision schedule (migration 0003) ---
  const revisionsDueToday: RevisionWithChapter[] = [];
  const upcomingRevisions: RevisionWithChapter[] = [];
  for (const r of revisions) {
    if (r.completed_at) continue;
    const chapter = chapterById.get(r.chapter_id);
    if (!chapter) continue;
    const entry: RevisionWithChapter = { revision: r, chapter, subjectName: subjectNameByChapterId.get(chapter.id) || '' };
    if (r.due_date <= todayISO) revisionsDueToday.push(entry);
    else upcomingRevisions.push(entry);
  }
  revisionsDueToday.sort((a, b) => a.revision.due_date.localeCompare(b.revision.due_date));
  upcomingRevisions.sort((a, b) => a.revision.due_date.localeCompare(b.revision.due_date));

  // Revisions due today always show in the plan, even past the normal cap —
  // they're time-sensitive and there are usually only one or two at once.
  for (const rc of revisionsDueToday) {
    todayPlan.push({
      chapter: rc.chapter,
      subjectName: rc.subjectName,
      minutes: 30,
      kind: 'revision',
      priority: 'high',
      reason: `${REVISION_STAGE_LABEL[rc.revision.stage]} due today`,
      revisionId: rc.revision.id,
    });
  }

  const weakChapters = subjectProgress.flatMap((sp) =>
    sp.chapters.filter((c) => c.strength === 'weak' && c.status !== 'completed').map((c) => ({ chapter: c, subjectName: sp.subject.name }))
  );

  const firstIncomplete = subjectProgress.flatMap((sp) => sp.chapters.filter((c) => c.status !== 'completed').map((c) => ({ chapter: c, subjectName: sp.subject.name })))[0];

  // --- Session time (today / this week) ---
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  let studyTimeTodayMinutes = 0;
  let studyTimeWeekMinutes = 0;
  let activeSession: StudySession | null = null;
  for (const s of sessions) {
    const started = new Date(s.started_at);
    const minutes = s.duration_minutes ?? (s.ended_at ? 0 : Math.max(0, Math.round((Date.now() - started.getTime()) / 60000)));
    if (!s.ended_at) activeSession = s;
    if (started >= weekAgo) studyTimeWeekMinutes += minutes;
    if (isSameDay(s.started_at, today)) studyTimeTodayMinutes += minutes;
  }

  const plannedMinutesToday = todayPlan.reduce((sum, i) => sum + i.minutes, 0);

  // --- Performance from completed tests ---
  const performanceBySubject: SubjectPerformance[] = subjects.map((s) => {
    const subjectTests = relevantTests
      .filter((t) => t.subject_id === s.id && t.marks_obtained !== null && t.total_marks > 0)
      .sort((a, b) => a.test_date.localeCompare(b.test_date));
    if (subjectTests.length === 0) {
      return { subjectName: s.name, subjectId: s.id, testsCount: 0, averagePercent: 0, lastPercent: null, trend: 'not_enough_data' };
    }
    const percents = subjectTests.map((t) => ((t.marks_obtained as number) / t.total_marks) * 100);
    const averagePercent = Math.round((percents.reduce((a, b) => a + b, 0) / percents.length) * 10) / 10;
    const lastPercent = Math.round(percents[percents.length - 1] * 10) / 10;
    let trend: SubjectPerformance['trend'] = 'not_enough_data';
    if (percents.length >= 2) {
      const diff = percents[percents.length - 1] - percents[percents.length - 2];
      trend = diff > 2 ? 'up' : diff < -2 ? 'down' : 'flat';
    }
    return { subjectName: s.name, subjectId: s.id, testsCount: subjectTests.length, averagePercent, lastPercent, trend };
  });

  return {
    goal,
    subjects: subjectProgress,
    totalChapters,
    completedChapters,
    remainingChapters,
    overallPercent,
    daysRemaining,
    daysSinceStart,
    totalPlannedDays,
    requiredPacePerDay,
    originalPacePerDay,
    currentPacePerDay,
    isBehindOriginalPace,
    estimatedHoursRemaining,
    todayPlan,
    nextChapter: firstIncomplete || null,
    chaptersNeedingRevision,
    weakChapters,
    revisionsDueToday,
    upcomingRevisions,
    studyTimeTodayMinutes,
    studyTimeWeekMinutes,
    todayStudyBudgetMinutes: studyBudgetMinutes,
    todayLeisureMinutes: mobileMinutes + tvMinutes,
    plannedMinutesToday,
    activeSession,
    upcomingTests,
    performanceBySubject,
  };
}

export const DIFFICULTY_MINUTES: Record<string, number> = { easy: 30, medium: 45, hard: 60 };

export const REVISION_STAGE_LABEL: Record<RevisionStage, string> = {
  revision_1: 'Revision 1',
  revision_2: 'Revision 2',
  revision_3: 'Revision 3',
  final: 'Final revision',
};

// Spaced-repetition-ish intervals. Not scientific, just sensible defaults:
// review sooner right after learning, then with increasing gaps.
export const REVISION_INTERVAL_DAYS: Record<RevisionStage, number> = {
  revision_1: 3,
  revision_2: 7,
  revision_3: 15,
  final: 30,
};

export function nextRevisionStage(stage: RevisionStage): RevisionStage | null {
  const order: RevisionStage[] = ['revision_1', 'revision_2', 'revision_3', 'final'];
  const idx = order.indexOf(stage);
  return idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
}
