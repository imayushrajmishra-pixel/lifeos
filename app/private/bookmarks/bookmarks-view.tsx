'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveBookmark, deleteBookmark } from '@/lib/actions/bookmarks';
import { Input, Label, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Trash2, Plus, Search, Star } from 'lucide-react';
import type { Bookmark } from '@/lib/types';

const CATEGORIES = ['learning', 'business', 'inspiration', 'travel', 'tools', 'articles', 'personal'];

export function BookmarksView({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [showForm, setShowForm] = useState(false);

  const filtered = useMemo(() => initialBookmarks.filter((b) => {
    if (category !== 'all' && b.category !== category) return false;
    if (query && !`${b.title} ${b.description} ${(b.tags || []).join(' ')}`.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  }), [initialBookmarks, query, category]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
        </div>
        <Select value={category} onChange={(e) => setCategory(e.target.value)} className="w-auto">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
        <Button onClick={() => setShowForm((v) => !v)}><Plus size={14} /> Add</Button>
      </div>

      {showForm && (
        <Card className="mt-6">
          <form action={(fd) => startTransition(async () => { await saveBookmark(fd); setShowForm(false); router.refresh(); })} className="space-y-4">
            <div><Label htmlFor="url">URL</Label><Input id="url" name="url" type="url" required placeholder="https://" /></div>
            <div><Label htmlFor="title">Title</Label><Input id="title" name="title" required /></div>
            <div><Label htmlFor="description">Description</Label><Input id="description" name="description" /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="category">Category</Label><Select id="category" name="category" defaultValue="personal">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></div>
              <div><Label htmlFor="tags">Tags</Label><Input id="tags" name="tags" placeholder="comma, separated" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="is_favorite" /> Favorite</label>
            <div className="flex gap-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mt-6 space-y-2">
        {filtered.length === 0 ? (
          <EmptyState title="No bookmarks yet." />
        ) : (
          filtered.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-md border border-line bg-surface px-4 py-3">
              {b.is_favorite && <Star size={14} className="shrink-0 text-gold" fill="currentColor" />}
              <div className="min-w-0 flex-1">
                <a href={b.url} target="_blank" className="truncate text-sm text-ink hover:text-moss focus-ring">{b.title}</a>
                {b.description && <p className="truncate text-xs text-muted">{b.description}</p>}
              </div>
              <button onClick={() => { if (confirm('Delete?')) startTransition(async () => { await deleteBookmark(b.id); router.refresh(); }); }} className="p-1 text-muted hover:text-rust focus-ring"><Trash2 size={14} /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
