'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveMovie, deleteMovie } from '@/lib/actions/movies';
import { Input, Textarea, Label, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { Trash2, Pencil, Plus } from 'lucide-react';
import type { Movie } from '@/lib/types';

export function MoviesView({ initialMovies }: { initialMovies: Movie[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<'watched' | 'watchlist'>('watched');
  const [editing, setEditing] = useState<Movie | null | 'new'>(null);

  const filtered = useMemo(() => initialMovies.filter((m) => (tab === 'watchlist' ? m.is_watchlist : !m.is_watchlist)), [initialMovies, tab]);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-full border border-line p-0.5">
          {(['watched', 'watchlist'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={cn('rounded-full px-3 py-1.5 text-xs capitalize focus-ring', tab === t ? 'bg-ink text-paper' : 'text-muted')}>{t}</button>
          ))}
        </div>
        <Button onClick={() => setEditing('new')}><Plus size={14} /> Add movie</Button>
      </div>

      {editing && <MovieForm movie={editing === 'new' ? null : editing} defaultWatchlist={tab === 'watchlist'} onDone={() => { setEditing(null); router.refresh(); }} />}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <div className="sm:col-span-2"><EmptyState title="Nothing here yet." /></div>
        ) : (
          filtered.map((m) => (
            <Card key={m.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink">{m.title}{m.year ? ` (${m.year})` : ''}</p>
                {m.genre && <p className="text-xs text-muted">{m.genre}</p>}
                {m.is_favorite && <Badge tone="gold" className="mt-1">Favorite</Badge>}
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => setEditing(m)} className="p-1 text-muted hover:text-ink focus-ring"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm('Delete?')) startTransition(async () => { await deleteMovie(m.id); router.refresh(); }); }} className="p-1 text-muted hover:text-rust focus-ring"><Trash2 size={14} /></button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function MovieForm({ movie, defaultWatchlist, onDone }: { movie: Movie | null; defaultWatchlist: boolean; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <Card className="mt-6">
      <form action={(fd) => { if (movie) fd.set('id', movie.id); startTransition(async () => { await saveMovie(fd); onDone(); }); }} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="title">Title</Label><Input id="title" name="title" defaultValue={movie?.title} required /></div>
          <div><Label htmlFor="year">Year</Label><Input id="year" name="year" type="number" defaultValue={movie?.year ?? ''} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="genre">Genre</Label><Input id="genre" name="genre" defaultValue={movie?.genre ?? ''} /></div>
          <div><Label htmlFor="rating">Rating (1–5)</Label><Input id="rating" name="rating" type="number" min={1} max={5} defaultValue={movie?.rating ?? ''} /></div>
        </div>
        <div><Label htmlFor="date_watched">Date watched</Label><Input id="date_watched" name="date_watched" type="date" defaultValue={movie?.date_watched ?? ''} /></div>
        <div><Label htmlFor="review">Review</Label><Textarea id="review" name="review" defaultValue={movie?.review} rows={2} /></div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="is_favorite" defaultChecked={movie?.is_favorite} /> Favorite</label>
          <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="is_watchlist" defaultChecked={movie?.is_watchlist ?? defaultWatchlist} /> On watchlist</label>
        </div>
        <div><Label htmlFor="visibility">Visibility</Label>
          <Select id="visibility" name="visibility" defaultValue={movie?.visibility || 'private'}><option value="private">Private</option><option value="public">Public</option></Select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save movie'}</Button>
          <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
