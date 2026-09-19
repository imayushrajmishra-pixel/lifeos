import { createClient } from '@/lib/supabase/server';
import { BookmarksView } from './bookmarks-view';

export const dynamic = 'force-dynamic';

export default async function BookmarksPage() {
  const supabase = createClient();
  const { data: bookmarks } = await supabase.from('bookmarks').select('*').order('created_at', { ascending: false });
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-ink">Bookmarks</h1>
      <p className="mt-1 text-sm text-muted">Links worth keeping.</p>
      <BookmarksView initialBookmarks={bookmarks || []} />
    </div>
  );
}
