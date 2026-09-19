import { createClient } from '@/lib/supabase/server';
import { buildStudyOverview } from '@/lib/study';
import { StudyView } from './study-view';
import { GoalForm } from './goal-form';
import { EmptyState } from '@/components/ui/empty-state';
import { AskLifeOS } from '@/components/ask-lifeos';

export const dynamic = 'force-dynamic';

export default async function StudyPage() {
  const supabase = createClient();

  const { data: goal } = await supabase
    .from('study_goals')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!goal) {
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="font-display text-3xl text-ink">
          Study
        </h1>

        <p className="mt-1 text-sm text-muted">
          Turn a syllabus into a plan you can actually follow.
        </p>

        <div className="mt-8">
          <EmptyState
            title="No study goal yet."
            hint="Set one below — a deadline and a subject list is all you need to start."
          />
        </div>

        <div className="mt-6">
          <GoalForm goal={null} />
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Subjects
  // ------------------------------------------------------------

  const { data: subjects } = await supabase
    .from('study_subjects')
    .select('*')
    .eq('goal_id', goal.id)
    .order('position');

  const subjectIds = (subjects || []).map(
    (s: any) => s.id
  );

  // ------------------------------------------------------------
  // Chapters
  // ------------------------------------------------------------

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

  // ------------------------------------------------------------
  // Revisions / Sessions / Tests / Daily Context
  // ------------------------------------------------------------

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: revisions },
    { data: sessions },
    { data: tests },
    { data: dailyContext },
  ] = await Promise.all([
    chapterIds.length
      ? supabase
          .from('study_revisions')
          .select('*')
          .in('chapter_id', chapterIds)
      : Promise.resolve({ data: [] as any[] }),

    supabase
      .from('study_sessions')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(200),

    subjectIds.length
      ? supabase
          .from('study_tests')
          .select('*')
          .in('subject_id', subjectIds)
          .order('test_date', { ascending: false })
      : Promise.resolve({ data: [] as any[] }),

    // Today's real-life context:
    // free time, study capacity, mobile, TV, mood, energy,
    // preferred subject, notes.
    supabase
      .from('study_daily_context')
      .select('*')
      .eq('goal_id', goal.id)
      .eq('date', today)
      .maybeSingle(),
  ]);

  // ------------------------------------------------------------
  // Build context-aware study overview
  // ------------------------------------------------------------

  const overview = buildStudyOverview(
    goal,
    subjects || [],
    chapters || [],
    {
      revisions: revisions || [],
      sessions: sessions || [],
      tests: tests || [],
      dailyContext: dailyContext || null,
    }
  );

  // ------------------------------------------------------------
  // UI
  // ------------------------------------------------------------

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl text-ink">
        Study
      </h1>

      <p className="mt-1 text-sm text-muted">
        {goal.title}
      </p>

      <StudyView
        goal={goal}
        overview={overview}
        subjects={subjects || []}
        tests={tests || []}
        sessions={sessions || []}
      />

      <div className="mt-6">
        <AskLifeOS />
      </div>
    </div>
  );
}