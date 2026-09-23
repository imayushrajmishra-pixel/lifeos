'use server';
import { insertRow, updateRow, deleteRow, requireUser, optionalString } from './crud-helpers';
import { DIFFICULTY_MINUTES, REVISION_INTERVAL_DAYS, nextRevisionStage } from '@/lib/study';

const paths = ['/private/study', '/private'];

export async function saveGoal(formData: FormData) {
  const id = optionalString(formData, 'id');
  const values = {
    title: String(formData.get('title') || ''),
    target_date: String(formData.get('target_date') || ''),
  };
  if (id) return updateRow('study_goals', id, values, paths);
  return insertRow('study_goals', values, paths);
}

export async function deleteGoal(id: string) {
  // Cascades to subjects/chapters via the FK's ON DELETE CASCADE in the migration.
  return deleteRow('study_goals', id, paths);
}

export async function saveSubject(formData: FormData) {
  const id = optionalString(formData, 'id');
  const goal_id = String(formData.get('goal_id') || '');
  const name = String(formData.get('name') || '');
  if (id) return updateRow('study_subjects', id, { name }, paths);

  const { supabase } = await requireUser();
  const { count } = await supabase.from('study_subjects').select('id', { count: 'exact', head: true }).eq('goal_id', goal_id);
  return insertRow('study_subjects', { goal_id, name, position: count || 0 }, paths);
}

export async function deleteSubject(id: string) {
  return deleteRow('study_subjects', id, paths);
}

export async function saveChapter(formData: FormData) {
  const id = optionalString(formData, 'id');
  const subject_id = String(formData.get('subject_id') || '');
  const difficulty = String(formData.get('difficulty') || 'medium');
  const name = String(formData.get('name') || '');
  const estimated_minutes = optionalString(formData, 'estimated_minutes')
    ? Number(formData.get('estimated_minutes'))
    : DIFFICULTY_MINUTES[difficulty] ?? 45;

  if (id) return updateRow('study_chapters', id, { name, difficulty, estimated_minutes }, paths);

  const { supabase } = await requireUser();
  const { count } = await supabase.from('study_chapters').select('id', { count: 'exact', head: true }).eq('subject_id', subject_id);
  return insertRow('study_chapters', { subject_id, name, difficulty, estimated_minutes, position: count || 0 }, paths);
}

export async function deleteChapter(id: string) {
  return deleteRow('study_chapters', id, paths);
}

export async function toggleChapterStatus(id: string, status: 'not_started' | 'in_progress' | 'completed') {
  const result = await updateRow('study_chapters', id, { status, completed_at: status === 'completed' ? new Date().toISOString() : null }, paths);

  const { supabase, user } = await requireUser();
  if (status === 'completed') {
    // Schedule Revision 1 automatically — but only if this chapter doesn't
    // already have a pending (incomplete) revision schedule, so re-marking
    // an already-completed chapter as complete doesn't stack duplicates.
    const { data: existing } = await supabase
      .from('study_revisions')
      .select('id')
      .eq('chapter_id', id)
      .is('completed_at', null)
      .limit(1);
    if (!existing || existing.length === 0) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + REVISION_INTERVAL_DAYS.revision_1);
      await supabase.from('study_revisions').insert({
        owner_id: user.id,
        chapter_id: id,
        stage: 'revision_1',
        due_date: dueDate.toISOString().slice(0, 10),
      });
    }
  } else {
    // No longer actually done — drop any revisions that haven't happened yet,
    // since scheduling a review of something not finished doesn't make sense.
    // Completed revision history is left alone.
    await supabase.from('study_revisions').delete().eq('chapter_id', id).is('completed_at', null);
  }

  const { revalidatePath } = await import('next/cache');
  paths.forEach((p) => revalidatePath(p));
  return result;
}

export async function setChapterStrength(id: string, strength: 'weak' | 'average' | 'strong') {
  return updateRow('study_chapters', id, { strength }, paths);
}

export async function toggleChapterRevision(id: string, revision_status: 'none' | 'needs_revision' | 'revised') {
  return updateRow('study_chapters', id, { revision_status }, paths);
}

// --- Staged revision schedule (Revision 1 → 2 → 3 → Final) ---

export async function completeRevision(id: string) {
  const { supabase, user } = await requireUser();
  const { data: revision, error } = await supabase.from('study_revisions').select('*').eq('id', id).single();
  if (error) throw error;

  await supabase.from('study_revisions').update({ completed_at: new Date().toISOString() }).eq('id', id);

  const next = nextRevisionStage(revision.stage);
  if (next) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + REVISION_INTERVAL_DAYS[next]);
    await supabase.from('study_revisions').insert({
      owner_id: user.id,
      chapter_id: revision.chapter_id,
      stage: next,
      due_date: dueDate.toISOString().slice(0, 10),
    });
  }

  const { revalidatePath } = await import('next/cache');
  paths.forEach((p) => revalidatePath(p));
}

export async function snoozeRevision(id: string, days: number) {
  const { supabase } = await requireUser();
  const { data: revision, error } = await supabase.from('study_revisions').select('due_date').eq('id', id).single();
  if (error) throw error;
  const due = new Date(revision.due_date + 'T00:00:00');
  due.setDate(due.getDate() + days);
  return updateRow('study_revisions', id, { due_date: due.toISOString().slice(0, 10) }, paths);
}

// --- Study sessions (real elapsed time) ---

export async function startStudySession(subject_id: string | null, chapter_id: string | null) {
  return insertRow(
    'study_sessions',
    { subject_id: subject_id || null, chapter_id: chapter_id || null, started_at: new Date().toISOString() },
    paths
  );
}

export async function stopStudySession(id: string, notes?: string) {
  const { supabase } = await requireUser();
  const { data: session, error } = await supabase.from('study_sessions').select('started_at').eq('id', id).single();
  if (error) throw error;
  const started = new Date(session.started_at).getTime();
  const ended = Date.now();
  const duration_minutes = Math.max(1, Math.round((ended - started) / 60000));
  return updateRow('study_sessions', id, { ended_at: new Date(ended).toISOString(), duration_minutes, notes: notes || '' }, paths);
}

export async function deleteStudySession(id: string) {
  return deleteRow('study_sessions', id, paths);
}

// --- Tests & exams ---

export async function saveTest(formData: FormData) {
  const id = optionalString(formData, 'id');
  const marksObtainedRaw = optionalString(formData, 'marks_obtained');
  const values = {
    subject_id: String(formData.get('subject_id') || ''),
    name: String(formData.get('name') || ''),
    test_date: String(formData.get('test_date') || ''),
    total_marks: Number(formData.get('total_marks') || 0),
    marks_obtained: marksObtainedRaw ? Number(marksObtainedRaw) : null,
    chapters_covered: String(formData.get('chapters_covered') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    notes: String(formData.get('notes') || ''),
  };
  if (id) return updateRow('study_tests', id, values, paths);
  return insertRow('study_tests', values, paths);
}

export async function deleteTest(id: string) {
  return deleteRow('study_tests', id, paths);
}

// Bulk-add chapters from a newline-separated textarea, so setting up a
// subject with 12 chapters doesn't mean 12 separate form submissions.
export async function addChaptersBulk(subject_id: string, namesText: string) {
  const { supabase } = await requireUser();
  const names = namesText.split('\n').map((n) => n.trim()).filter(Boolean);
  if (names.length === 0) return;

  const { count } = await supabase.from('study_chapters').select('id', { count: 'exact', head: true }).eq('subject_id', subject_id);
  const { data: { user } } = await supabase.auth.getUser();
  const start = count || 0;
  const rows = names.map((name, i) => ({
    owner_id: user!.id,
    subject_id,
    name,
    position: start + i,
    difficulty: 'medium' as const,
    estimated_minutes: DIFFICULTY_MINUTES.medium,
  }));
  const { error } = await supabase.from('study_chapters').insert(rows);
  if (error) throw error;

  const { revalidatePath } = await import('next/cache');
  paths.forEach((p) => revalidatePath(p));
}
