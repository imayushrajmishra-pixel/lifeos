import { createClient } from '@/lib/supabase/server';
import { DiaryView } from './diary-view';
import { AiDiarySearch } from '@/components/ai-diary-search';

export const dynamic = 'force-dynamic';

export default async function DiaryPage() {
  const supabase = createClient();
  const { data: entries } = await supabase.from('diary_entries').select('*').order('entry_date', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-ink">Diary</h1>
      <p className="mt-1 text-sm text-muted">Private by default. Only you will ever see this.</p>
      <div className="mt-6"><AiDiarySearch /></div>
      <DiaryView initialEntries={entries || []} />
    </div>
  );
}
