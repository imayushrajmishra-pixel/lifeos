import { createClient } from '@/lib/supabase/server';
import { MemoriesView } from './memories-view';

export const dynamic = 'force-dynamic';

export default async function MemoriesPage() {
  const supabase = createClient();
  const { data: moments } = await supabase.from('moments').select('*').order('occurred_on', { ascending: false });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl text-ink">Memories</h1>
      <p className="mt-1 text-sm text-muted">Your visual archive. Toggle each one public or private.</p>
      <MemoriesView initialMoments={moments || []} />
    </div>
  );
}
