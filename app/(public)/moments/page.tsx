import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import Image from 'next/image';

export const metadata = { title: 'Moments' };
export const revalidate = 60;

const CATEGORIES = ['all', 'travel', 'friends', 'family', 'projects', 'random', 'important'];

export default async function MomentsPage({ searchParams }: { searchParams: { category?: string } }) {
  const supabase = createClient();
  const category = searchParams.category || 'all';

  let query = supabase.from('moments').select('*').eq('visibility', 'public').order('occurred_on', { ascending: false });
  if (category !== 'all') query = query.eq('category', category);
  const { data: moments } = await query;

  return (
    <div className="mx-auto max-w-page px-6 py-20">
      <h1 className="font-display text-4xl text-ink">Moments</h1>
      <p className="mt-4 max-w-prose text-muted">A visual archive of the small and big things.</p>

      <div className="mt-8 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <a
            key={c}
            href={c === 'all' ? '/moments' : `/moments?category=${c}`}
            className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors focus-ring ${
              category === c ? 'border-ink bg-ink text-paper' : 'border-line text-muted hover:text-ink'
            }`}
          >
            {c}
          </a>
        ))}
      </div>

      {moments && moments.length > 0 ? (
        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {moments.map((m: any) => (
            <figure key={m.id} className="group relative aspect-square overflow-hidden rounded-md bg-line">
              {m.photo_url && (
                <Image src={m.photo_url} alt={m.caption || ''} fill sizes="25vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              )}
              {m.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {m.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      ) : (
        <div className="mt-10"><EmptyState title="Nothing here yet." hint="Public moments will appear in this grid." /></div>
      )}
    </div>
  );
}
