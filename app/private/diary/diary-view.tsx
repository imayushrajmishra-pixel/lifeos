'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveDiaryEntry, deleteDiaryEntry, toggleDiaryFavorite } from '@/lib/actions/diary';
import { Input, Textarea, Label, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { formatDate, MOOD_META } from '@/lib/utils';
import { Star, Pencil, Trash2, Search } from 'lucide-react';
import type { DiaryEntry } from '@/lib/types';

export function DiaryView({ initialEntries }: { initialEntries: DiaryEntry[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState('all');
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [editing, setEditing] = useState<DiaryEntry | null | 'new'>(null);

  const filtered = useMemo(() => {
    return initialEntries.filter((e) => {
      if (moodFilter !== 'all' && e.mood !== moodFilter) return false;
      if (favoriteOnly && !e.is_favorite) return false;
      if (query) {
        const haystack = `${e.title} ${e.content} ${(e.tags || []).join(' ')}`.toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [initialEntries, query, moodFilter, favoriteOnly]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input placeholder="Search diary…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={moodFilter} onChange={(e) => setMoodFilter(e.target.value)} className="w-auto">
          <option value="all">All moods</option>
          {Object.entries(MOOD_META).map(([key, m]) => (
            <option key={key} value={key}>{m.emoji} {m.label}</option>
          ))}
        </Select>
        <button
          onClick={() => setFavoriteOnly((v) => !v)}
          className={`rounded-md border px-3 py-2 text-sm transition-colors focus-ring ${favoriteOnly ? 'border-gold bg-gold/10 text-gold' : 'border-line text-muted'}`}
        >
          <Star size={14} className="inline -mt-0.5 mr-1" fill={favoriteOnly ? 'currentColor' : 'none'} />
          Favorites
        </button>
        <Button onClick={() => setEditing('new')}>+ New entry</Button>
      </div>

      {editing && (
        <EntryForm
          entry={editing === 'new' ? null : editing}
          onDone={() => { setEditing(null); router.refresh(); }}
        />
      )}

      <div className="mt-8 space-y-4">
        {filtered.length === 0 ? (
          <EmptyState title="Your story starts here." hint="Write your first entry — it's just for you." />
        ) : (
          filtered.map((e) => (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted">{formatDate(e.entry_date, { month: 'long', day: 'numeric', year: 'numeric' })}{e.location ? ` · ${e.location}` : ''}</p>
                  <p className="mt-1 font-display text-lg text-ink">{e.title || 'Untitled entry'}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {e.mood && <span title={MOOD_META[e.mood]?.label}>{MOOD_META[e.mood]?.emoji}</span>}
                  <button
                    onClick={() => startTransition(async () => { await toggleDiaryFavorite(e.id, !e.is_favorite); router.refresh(); })}
                    className="p-1 text-muted hover:text-gold focus-ring"
                    aria-label="Toggle favorite"
                  >
                    <Star size={15} fill={e.is_favorite ? 'currentColor' : 'none'} className={e.is_favorite ? 'text-gold' : ''} />
                  </button>
                  <button onClick={() => setEditing(e)} className="p-1 text-muted hover:text-ink focus-ring" aria-label="Edit">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this entry?')) startTransition(async () => { await deleteDiaryEntry(e.id); router.refresh(); }); }}
                    className="p-1 text-muted hover:text-rust focus-ring"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink/90">{e.content}</p>
              {e.tags && e.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {e.tags.map((t) => <Badge key={t}>{t}</Badge>)}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function EntryForm({ entry, onDone }: { entry: DiaryEntry | null; onDone: () => void }) {
  const [pending, startTransition] = useTransition();

  return (
    <Card className="mt-6">
      <form
        action={(formData) => {
          if (entry) formData.set('id', entry.id);
          startTransition(async () => { await saveDiaryEntry(formData); onDone(); });
        }}
        className="space-y-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={entry?.title} placeholder="Optional" />
          </div>
          <div>
            <Label htmlFor="entry_date">Date</Label>
            <Input id="entry_date" name="entry_date" type="date" defaultValue={entry?.entry_date || new Date().toISOString().slice(0, 10)} required />
          </div>
        </div>
        <div>
          <Label htmlFor="content">What&rsquo;s on your mind</Label>
          <Textarea id="content" name="content" defaultValue={entry?.content} rows={8} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="mood">Mood</Label>
            <Select id="mood" name="mood" defaultValue={entry?.mood || ''}>
              <option value="">None</option>
              {Object.entries(MOOD_META).map(([key, m]) => (
                <option key={key} value={key}>{m.emoji} {m.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input id="location" name="location" defaultValue={entry?.location ?? ''} />
          </div>
          <div>
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" name="tags" defaultValue={entry?.tags?.join(', ')} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="is_favorite" defaultChecked={entry?.is_favorite} /> Mark as favorite
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save entry'}</Button>
          <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
