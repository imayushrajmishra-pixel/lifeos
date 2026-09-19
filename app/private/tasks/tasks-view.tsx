'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveTask, deleteTask, toggleTask } from '@/lib/actions/tasks';
import { Input, Textarea, Label, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate, cn } from '@/lib/utils';
import { Trash2, Plus } from 'lucide-react';
import type { Task } from '@/lib/types';

type View = 'today' | 'upcoming' | 'all' | 'completed';

export function TasksView({ initialTasks }: { initialTasks: Task[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [view, setView] = useState<View>('today');
  const [showForm, setShowForm] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return initialTasks.filter((t) => {
      if (view === 'completed') return t.is_completed;
      if (t.is_completed) return false;
      if (view === 'today') return t.due_date === today;
      if (view === 'upcoming') return !t.due_date || t.due_date > today;
      return true;
    });
  }, [initialTasks, view, today]);

  const views: { key: View; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-full border border-line p-0.5">
          {views.map((v) => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={cn('rounded-full px-3 py-1.5 text-xs transition-colors focus-ring', view === v.key ? 'bg-ink text-paper' : 'text-muted hover:text-ink')}
            >
              {v.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowForm((v) => !v)}><Plus size={14} /> New task</Button>
      </div>

      {showForm && (
        <Card className="mt-6">
          <form
            action={(formData) => startTransition(async () => { await saveTask(formData); setShowForm(false); router.refresh(); })}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="title">Task</Label>
              <Input id="title" name="title" required />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="due_date">Due date</Label>
                <Input id="due_date" name="due_date" type="date" />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select id="priority" name="priority" defaultValue="medium">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input id="category" name="category" placeholder="general" />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink">
              <input type="checkbox" name="is_recurring" /> Recurring
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Add task'}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        {filtered.length === 0 ? (
          <EmptyState title="Nothing here." hint="Add a task to get started." />
        ) : (
          filtered.map((t) => (
            <div key={t.id} className="flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-3">
              <input
                type="checkbox"
                checked={t.is_completed}
                onChange={() => startTransition(async () => { await toggleTask(t.id, !t.is_completed); router.refresh(); })}
                className="h-4 w-4 accent-moss"
              />
              <div className="min-w-0 flex-1">
                <p className={cn('text-sm text-ink', t.is_completed && 'text-muted line-through')}>{t.title}</p>
                <p className="text-xs text-muted">
                  {t.due_date && formatDate(t.due_date, { month: 'short', day: 'numeric' })}
                  {t.due_date && ' · '}
                  <span className={cn(t.priority === 'high' && 'text-rust', t.priority === 'medium' && 'text-gold')}>{t.priority}</span>
                  {t.category ? ` · ${t.category}` : ''}
                </p>
              </div>
              <button
                onClick={() => startTransition(async () => { await deleteTask(t.id); router.refresh(); })}
                className="p-1 text-muted hover:text-rust focus-ring"
                aria-label="Delete task"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
