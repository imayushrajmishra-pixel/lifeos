'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveMoment, deleteMoment } from '@/lib/actions/moments';
import { ImageUpload } from '@/components/image-upload';
import { Input, Textarea, Label, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn, formatDate } from '@/lib/utils';
import { Trash2, Pencil, Plus } from 'lucide-react';
import type { Moment } from '@/lib/types';

const CATEGORIES = ['travel', 'friends', 'family', 'projects', 'random', 'important'];

export function MemoriesView({ initialMoments }: { initialMoments: Moment[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [layout, setLayout] = useState<'grid' | 'timeline'>('grid');
  const [category, setCategory] = useState('all');
  const [editing, setEditing] = useState<Moment | null | 'new'>(null);

  const filtered = useMemo(
    () => initialMoments.filter((m) => category === 'all' || m.category === category),
    [initialMoments, category]
  );

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="flex gap-1 rounded-full border border-line p-0.5">
            {(['grid', 'timeline'] as const).map((l) => (
              <button key={l} onClick={() => setLayout(l)} className={cn('rounded-full px-3 py-1.5 text-xs capitalize transition-colors focus-ring', layout === l ? 'bg-ink text-paper' : 'text-muted')}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <Button onClick={() => setEditing('new')}><Plus size={14} /> New memory</Button>
      </div>

      {editing && <MomentForm moment={editing === 'new' ? null : editing} onDone={() => { setEditing(null); router.refresh(); }} />}

      {filtered.length === 0 ? (
        <div className="mt-8"><EmptyState title="No memories yet." hint="Add your first one above." /></div>
      ) : layout === 'grid' ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((m) => (
            <div key={m.id} className="group relative aspect-square overflow-hidden rounded-md bg-line">
              {m.photo_url && <img src={m.photo_url} alt={m.caption} className="h-full w-full object-cover" />}
              <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-2 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setEditing(m)} className="rounded bg-white/90 p-1 text-ink focus-ring"><Pencil size={12} /></button>
                  <button onClick={() => { if (confirm('Delete?')) startTransition(async () => { await deleteMoment(m.id); router.refresh(); }); }} className="rounded bg-white/90 p-1 text-rust focus-ring"><Trash2 size={12} /></button>
                </div>
                <p className="text-xs text-white">{m.caption}</p>
              </div>
              {m.visibility === 'private' && <Badge className="absolute left-2 top-2" tone="rust">Private</Badge>}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {filtered.map((m) => (
            <Card key={m.id} className="flex items-center gap-4">
              {m.photo_url && <img src={m.photo_url} alt="" className="h-14 w-14 shrink-0 rounded-md object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">{formatDate(m.occurred_on, { month: 'short', day: 'numeric', year: 'numeric' })} · {m.category}</p>
                <p className="truncate text-sm text-ink">{m.caption}</p>
              </div>
              <Badge tone={m.visibility === 'public' ? 'moss' : 'rust'}>{m.visibility}</Badge>
              <button onClick={() => setEditing(m)} className="p-1 text-muted hover:text-ink focus-ring"><Pencil size={14} /></button>
              <button onClick={() => { if (confirm('Delete?')) startTransition(async () => { await deleteMoment(m.id); router.refresh(); }); }} className="p-1 text-muted hover:text-rust focus-ring"><Trash2 size={14} /></button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function MomentForm({ moment, onDone }: { moment: Moment | null; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <Card className="mt-6">
      <form
        action={(formData) => { if (moment) formData.set('id', moment.id); startTransition(async () => { await saveMoment(formData); onDone(); }); }}
        className="space-y-4"
      >
        <ImageUpload name="photo_url" defaultUrl={moment?.photo_url} />
        <div>
          <Label htmlFor="caption">Caption</Label>
          <Textarea id="caption" name="caption" defaultValue={moment?.caption} rows={2} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="occurred_on">Date</Label>
            <Input id="occurred_on" name="occurred_on" type="date" defaultValue={moment?.occurred_on || new Date().toISOString().slice(0, 10)} required />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={moment?.location ?? ''} />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select id="category" name="category" defaultValue={moment?.category || 'random'}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="people">People / tags</Label>
          <Input id="people" name="people" defaultValue={moment?.people ?? ''} placeholder="Friends, family..." />
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" name="is_featured" defaultChecked={moment?.is_featured} /> Featured
          </label>
          <div className="flex items-center gap-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select id="visibility" name="visibility" defaultValue={moment?.visibility || 'private'} className="w-auto">
              <option value="private">Private</option>
              <option value="public">Public</option>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save memory'}</Button>
          <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
