import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';

export default async function YearRecapPage({ params }: { params: { year: string } }) {
  const supabase = createClient();
  const year = params.year;
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;

  const [
    { data: diary },
    { count: momentCount },
    { count: projectCount },
    { count: bookCount },
    { count: movieCount },
    { data: favoriteMoments },
  ] = await Promise.all([
    supabase.from('diary_entries').select('*').gte('entry_date', start).lte('entry_date', end).order('entry_date'),
    supabase.from('moments').select('*', { count: 'exact', head: true }).gte('occurred_on', start).lte('occurred_on', end),
    supabase.from('projects').select('*', { count: 'exact', head: true }).gte('created_at', start).lte('created_at', end),
    supabase.from('books').select('*', { count: 'exact', head: true }).gte('date_read', start).lte('date_read', end),
    supabase.from('movies').select('*', { count: 'exact', head: true }).gte('date_watched', start).lte('date_watched', end),
    supabase.from('moments').select('*').eq('is_featured', true).gte('occurred_on', start).lte('occurred_on', end).limit(6),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <a href="/private/stats" className="text-sm text-muted hover:text-ink focus-ring">← All years</a>
      <h1 className="mt-3 font-display text-4xl italic text-ink">{year}</h1>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
        {[
          { label: 'Diary entries', value: diary?.length ?? 0 },
          { label: 'Memories', value: momentCount ?? 0 },
          { label: 'Projects', value: projectCount ?? 0 },
          { label: 'Books read', value: bookCount ?? 0 },
          { label: 'Movies watched', value: movieCount ?? 0 },
        ].map((s) => (
          <Card key={s.label}><p className="font-display text-3xl text-ink">{s.value}</p><p className="mt-1 text-xs text-muted">{s.label}</p></Card>
        ))}
      </div>

      {favoriteMoments && favoriteMoments.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-ink">Favorite moments</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {favoriteMoments.map((m: any) => (
              <div key={m.id} className="aspect-square overflow-hidden rounded-md bg-line">
                {m.photo_url && <img src={m.photo_url} alt="" className="h-full w-full object-cover" />}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-xl text-ink">Diary highlights</h2>
        {diary && diary.length > 0 ? (
          <ol className="mt-4 space-y-6 border-l border-line pl-6">
            {diary.map((d: any) => (
              <li key={d.id} className="relative">
                <span className="absolute -left-[27px] top-1.5 h-2 w-2 rounded-full bg-moss" />
                <p className="text-xs text-muted">{formatDate(d.entry_date, { month: 'long', day: 'numeric' })}</p>
                <p className="mt-1 font-display text-lg text-ink">{d.title || 'Untitled entry'}</p>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-4"><EmptyState title="No diary entries logged for this year." /></div>
        )}
      </div>
    </div>
  );
}
