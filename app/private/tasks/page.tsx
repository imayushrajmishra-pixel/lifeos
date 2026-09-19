import { createClient } from '@/lib/supabase/server';
import { TasksView } from './tasks-view';

export const dynamic = 'force-dynamic';

export default async function TasksPage() {
  const supabase = createClient();
  const { data: tasks } = await supabase.from('tasks').select('*').order('due_date', { ascending: true, nullsFirst: false });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-ink">Tasks</h1>
      <p className="mt-1 text-sm text-muted">Keep it simple.</p>
      <TasksView initialTasks={tasks || []} />
    </div>
  );
}
