import { createClient } from '@/lib/supabase/server';
import { BooksView } from './books-view';

export const dynamic = 'force-dynamic';

export default async function BooksPage() {
  const supabase = createClient();
  const { data: books } = await supabase.from('books').select('*').order('created_at', { ascending: false });
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-ink">Books</h1>
      <p className="mt-1 text-sm text-muted">What you&rsquo;ve read, are reading, and want to.</p>
      <BooksView initialBooks={books || []} />
    </div>
  );
}
