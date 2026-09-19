'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveBook, deleteBook } from '@/lib/actions/books';
import { Input, Textarea, Label, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Trash2, Pencil, Plus } from 'lucide-react';
import type { Book } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = { want_to_read: 'Want to read', reading: 'Reading', finished: 'Finished' };

export function BooksView({ initialBooks }: { initialBooks: Book[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Book | null | 'new'>(null);

  return (
    <div className="mt-8">
      <div className="flex justify-end"><Button onClick={() => setEditing('new')}><Plus size={14} /> Add book</Button></div>
      {editing && <BookForm book={editing === 'new' ? null : editing} onDone={() => { setEditing(null); router.refresh(); }} />}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {initialBooks.length === 0 ? (
          <div className="sm:col-span-2"><EmptyState title="Nothing added yet." /></div>
        ) : (
          initialBooks.map((b) => (
            <Card key={b.id} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-ink">{b.title}</p>
                {b.author && <p className="text-xs text-muted">{b.author}</p>}
                <Badge tone="moss" className="mt-1">{STATUS_LABEL[b.status]}</Badge>
              </div>
              <div className="flex shrink-0 gap-1">
                <button onClick={() => setEditing(b)} className="p-1 text-muted hover:text-ink focus-ring"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm('Delete?')) startTransition(async () => { await deleteBook(b.id); router.refresh(); }); }} className="p-1 text-muted hover:text-rust focus-ring"><Trash2 size={14} /></button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function BookForm({ book, onDone }: { book: Book | null; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <Card className="mt-6">
      <form action={(fd) => { if (book) fd.set('id', book.id); startTransition(async () => { await saveBook(fd); onDone(); }); }} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="title">Title</Label><Input id="title" name="title" defaultValue={book?.title} required /></div>
          <div><Label htmlFor="author">Author</Label><Input id="author" name="author" defaultValue={book?.author ?? ''} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={book?.status || 'want_to_read'}>
              <option value="want_to_read">Want to read</option><option value="reading">Reading</option><option value="finished">Finished</option>
            </Select>
          </div>
          <div><Label htmlFor="rating">Rating (1–5)</Label><Input id="rating" name="rating" type="number" min={1} max={5} defaultValue={book?.rating ?? ''} /></div>
          <div><Label htmlFor="date_read">Date read</Label><Input id="date_read" name="date_read" type="date" defaultValue={book?.date_read ?? ''} /></div>
        </div>
        <div><Label htmlFor="favorite_quote">Favorite quote</Label><Textarea id="favorite_quote" name="favorite_quote" defaultValue={book?.favorite_quote} rows={2} /></div>
        <div><Label htmlFor="notes">Notes</Label><Textarea id="notes" name="notes" defaultValue={book?.notes} rows={2} /></div>
        <div><Label htmlFor="visibility">Visibility</Label>
          <Select id="visibility" name="visibility" defaultValue={book?.visibility || 'private'}><option value="private">Private</option><option value="public">Public</option></Select>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save book'}</Button>
          <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
