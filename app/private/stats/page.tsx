import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function StatsPage() {
  const supabase = createClient();

  const [
    { count: diaryCount },
    { count: momentCount },
    { count: projectCount },
    { count: completedProjectCount },
    { count: bookCount },
    { count: finishedBookCount },
    { count: movieCount },
    { count: bucketCount },
    { count: completedBucketCount },
    { data: diaryDates },
    { data: momentDates },
  ] = await Promise.all([
    supabase.from('diary_entries').select('*', { count: 'exact', head: true }),
    supabase.from('moments').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('books').select('*', { count: 'exact', head: true }),
    supabase.from('books').select('*', { count: 'exact', head: true }).eq('status', 'finished'),
    supabase.from('movies').select('*', { count: 'exact', head: true }).eq('is_watchlist', false),
    supabase.from('bucket_list').select('*', { count: 'exact', head: true }),
    supabase.from('bucket_list').select('*', { count: 'exact', head: true }).eq('is_completed', true),
    supabase.from('diary_entries').select('entry_date'),
    supabase.from('moments').select('occurred_on'),
  ]);

  const years = Array.from(
    new Set([
      ...(diaryDates || []).map((d: any) => d.entry_date.slice(0, 4)),
      ...(momentDates || []).map((m: any) => m.occurred_on.slice(0, 4)),
    ])
  ).sort((a, b) => Number(b) - Number(a));

  const stats = [
    { label: 'Projects created', value: projectCount ?? 0 },
    { label: 'Projects completed', value: completedProjectCount ?? 0 },
    { label: 'Memories saved', value: momentCount ?? 0 },
    { label: 'Diary entries', value: diaryCount ?? 0 },
    { label: 'Books read', value: finishedBookCount ?? 0 },
    { label: 'Books tracked', value: bookCount ?? 0 },
    { label: 'Movies watched', value: movieCount ?? 0 },
    { label: 'Bucket-list items completed', value: completedBucketCount ?? 0 },
    { label: 'Bucket-list items total', value: bucketCount ?? 0 },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl text-ink">Life stats</h1>
      <p className="mt-1 text-sm text-muted">Calculated straight from your data — nothing here is made up.</p>

      <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="font-display text-3xl text-ink">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-sm text-muted">
        Studying? Your syllabus progress and pace live on the <a href="/private/study" className="text-moss hover:underline focus-ring">Study</a> page.
      </p>

      {years.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-ink">Yearly recap</h2>
          <p className="mt-1 text-sm text-muted">Pick a year to see the full recap.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {years.map((y) => (
              <a key={y} href={`/private/stats/${y}`} className="rounded-md border border-line px-4 py-2 text-sm text-ink hover:bg-line/40 focus-ring">{y}</a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
