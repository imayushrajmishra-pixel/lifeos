'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveBucketItem, deleteBucketItem, toggleBucketComplete } from '@/lib/actions/bucketlist';
import { Input, Textarea, Label, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, formatDate } from '@/lib/utils';
import { Trash2, Plus } from 'lucide-react';
import type { BucketListItem } from '@/lib/types';

const CATEGORIES = ['travel', 'experiences', 'skills', 'career', 'adventure', 'creative', 'personal'];

export function BucketListView({ initialItems }: { initialItems: BucketListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  const active = initialItems.filter((i) => !i.is_completed);
  const done = initialItems.filter((i) => i.is_completed);

  return (
    <div className="mt-8">
      <div className="flex justify-end"><Button onClick={() => setShowForm((v) => !v)}><Plus size={14} /> New goal</Button></div>

      {showForm && (
        <Card className="mt-6">
          <form action={(fd) => startTransition(async () => { await saveBucketItem(fd); setShowForm(false); router.refresh(); })} className="space-y-4">
            <div><Label htmlFor="goal">Goal</Label><Input id="goal" name="goal" required /></div>
            <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" rows={2} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><Label htmlFor="category">Category</Label>
                <Select id="category" name="category" defaultValue="personal">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
              </div>
              <div><Label htmlFor="priority">Priority</Label>
                <Select id="priority" name="priority" defaultValue="medium"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select>
              </div>
              <div><Label htmlFor="deadline">Deadline</Label><Input id="deadline" name="deadline" type="date" /></div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">Add goal</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        {active.length === 0 && done.length === 0 ? (
          <EmptyState title="What do you want to say you did?" />
        ) : (
          active.map((item) => <Row key={item.id} item={item} />)
        )}
      </div>

      {done.length > 0 && (
        <div className="mt-10">
          <p className="text-xs uppercase tracking-wide text-muted">Completed</p>
          <div className="mt-3 space-y-2">
            {done.map((item) => <Row key={item.id} item={item} />)}
          </div>
        </div>
      )}
    </div>
  );

  function Row({ item }: { item: BucketListItem }) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-3">
        <input type="checkbox" checked={item.is_completed} onChange={() => startTransition(async () => { await toggleBucketComplete(item.id, !item.is_completed); router.refresh(); })} className="h-4 w-4 accent-moss" />
        <div className="min-w-0 flex-1">
          <p className={cn('text-sm text-ink', item.is_completed && 'text-muted line-through')}>{item.goal}</p>
          <p className="text-xs text-muted">{item.category}{item.deadline ? ` · ${formatDate(item.deadline, { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}</p>
        </div>
        <Badge tone={item.priority === 'high' ? 'rust' : item.priority === 'medium' ? 'gold' : 'default'}>{item.priority}</Badge>
        <button onClick={() => { if (confirm('Delete?')) startTransition(async () => { await deleteBucketItem(item.id); router.refresh(); }); }} className="p-1 text-muted hover:text-rust focus-ring"><Trash2 size={14} /></button>
      </div>
    );
  }
}
