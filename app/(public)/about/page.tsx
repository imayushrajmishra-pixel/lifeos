import { createClient } from '@/lib/supabase/server';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import Link from 'next/link';

export const metadata = { title: 'About' };
export const revalidate = 60;

export default async function AboutPage() {
  const supabase = createClient();
  const [{ data: profile }, { data: interests }, { data: learning }, { data: wishes }] = await Promise.all([
    supabase.from('profiles').select('*').single(),
    supabase.from('skills').select('*').eq('visibility', 'public').eq('is_interest', true),
    supabase.from('learning_items').select('*').order('position'),
    supabase.from('experience_wishes').select('*').order('position'),
  ]);

  return (
    <div className="mx-auto max-w-page px-6 py-20">
      <h1 className="font-display text-4xl text-ink">Who I am</h1>
      <p className="mt-6 max-w-prose whitespace-pre-line text-lg leading-relaxed text-muted">
        {profile?.bio || "This section hasn't been written yet."}
      </p>

      {interests && interests.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-ink">What I like</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {interests.map((i: any) => (
              <Badge key={i.id}>{i.name}</Badge>
            ))}
          </div>
        </section>
      )}

      <section className="mt-16">
        <h2 className="font-display text-2xl text-ink">What I&rsquo;m learning</h2>
        {learning && learning.length > 0 ? (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {learning.map((l: any) => (
              <li key={l.id} className="text-sm text-ink">— {l.title}</li>
            ))}
          </ul>
        ) : (
          <div className="mt-5"><EmptyState title="Nothing listed yet." /></div>
        )}
      </section>

      <section className="mt-16">
        <Link href="/skills" className="text-sm text-moss hover:underline focus-ring">See everything I&rsquo;m learning and building skill in →</Link>
      </section>

      {wishes && wishes.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-ink">What I want to experience</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {wishes.map((w: any) => (
              <li key={w.id} className="text-sm text-ink">— {w.title}</li>
            ))}
          </ul>
        </section>
      )}

      {profile?.music_visibility === 'public' && (profile?.favorite_artists?.length > 0 || profile?.now_playing) && (
        <section className="mt-16">
          <h2 className="font-display text-2xl text-ink">Music</h2>
          {profile.now_playing && <p className="mt-4 text-sm text-muted">Currently: <span className="text-ink">{profile.now_playing}</span></p>}
          {profile.favorite_artists?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.favorite_artists.map((a: string) => <Badge key={a}>{a}</Badge>)}
            </div>
          )}
        </section>
      )}

      {profile?.philosophy && (
        <section className="mt-16 border-t border-line pt-16">
          <h2 className="font-display text-2xl text-ink">Personal philosophy</h2>
          <p className="mt-5 max-w-prose whitespace-pre-line text-lg italic leading-relaxed text-muted">{profile.philosophy}</p>
        </section>
      )}
    </div>
  );
}
