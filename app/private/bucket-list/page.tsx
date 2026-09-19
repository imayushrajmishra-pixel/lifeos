import { createClient } from '@/lib/supabase/server';
import { BucketListView } from './bucket-list-view';

export const dynamic = 'force-dynamic';

export default async function BucketListPage() {
  const supabase = createClient();
  const { data: items } = await supabase.from('bucket_list').select('*').order('is_completed').order('deadline', { ascending: true, nullsFirst: false });
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-ink">Bucket list</h1>
      <p className="mt-1 text-sm text-muted">The things you want to say you did.</p>
      <BucketListView initialItems={items || []} />
    </div>
  );
}
