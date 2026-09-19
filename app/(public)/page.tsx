import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();

  const [
    { data: profile },
    { data: currently },
    { data: focus },
    { data: learning },
    { data: moments },
    { data: projects },
    { data: projectCount },
    { data: skillCount },
    { data: momentCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*').single(),
    supabase.from('currently_items').select('*').order('position'),
    supabase.from('current_focus_items').select('*').order('position').limit(5),
    supabase.from('learning_items').select('*').order('position').limit(6),
    supabase.from('moments').select('*').eq('visibility', 'public').order('occurred_on', { ascending: false }).limit(6),
    supabase.from('projects').select('*').eq('visibility', 'public').eq('is_featured', true).order('created_at', { ascending: false }).limit(3),
    supabase.from('projects').select('id').eq('visibility', 'public'),
    supabase.from('skills').select('id').eq('visibility', 'public').eq('status', 'learning'),
    supabase.from('moments').select('id').eq('visibility', 'public'),
  ]);

  const name = profile?.full_name || 'Ayush';
  const tagline = profile?.tagline || 'Curious. Building things. Documenting the process.';

  const stats = [
    { label: 'Projects built', value: projectCount?.length ?? 0 },
    { label: 'Skills learning', value: skillCount?.length ?? 0 },
    { label: 'Moments kept', value: momentCount?.length ?? 0 },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-page px-6 pb-16 pt-20 md:pb-24 md:pt-28">
        <p className="animate-reveal text-sm text-muted">Hi, I&rsquo;m</p>
        <h1 className="animate-reveal mt-2 max-w-3xl font-display text-5xl leading-[1.05] text-ink md:text-7xl">
          {name}.
        </h1>
        <p className="animate-reveal mt-6 max-w-xl text-lg text-muted">{tagline}</p>
      </section>

      {/* Currently */}
      {currently && currently.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-page px-6 py-14">
            <h2 className="font-display text-2xl text-ink">Currently</h2>
            <div className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {currently.map((item: any) => (
                <div key={item.id} className="flex items-baseline gap-3 border-b border-line pb-3">
                  <span className="w-24 shrink-0 text-sm text-muted">{item.label}</span>
                  <span className="text-sm text-ink">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Moments */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-page px-6 py-14">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-ink">Featured moments</h2>
            <Link href="/moments" className="text-sm text-muted hover:text-ink focus-ring">View all →</Link>
          </div>

          {moments && moments.length > 0 ? (
            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
              {moments.map((m: any) => (
                <figure key={m.id} className="group relative aspect-[4/5] overflow-hidden rounded-md bg-line">
                  {m.photo_url && (
                    <Image src={m.photo_url} alt={m.caption || ''} fill sizes="33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {m.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <div className="mt-6"><EmptyState title="No public moments yet" hint="Moments marked public will appear here." /></div>
          )}
        </div>
      </section>

      {/* Current focus */}
      {focus && focus.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-page px-6 py-14">
            <h2 className="font-display text-2xl text-ink">Current focus</h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {focus.map((f: any) => (
                <Badge key={f.id} tone="moss" className="px-4 py-1.5 text-sm">{f.title}</Badge>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Things I'm learning */}
      {learning && learning.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-page px-6 py-14">
            <h2 className="font-display text-2xl text-ink">Things I&rsquo;m learning</h2>
            <ul className="mt-6 grid gap-x-8 gap-y-3 sm:grid-cols-2 md:grid-cols-3">
              {learning.map((l: any) => (
                <li key={l.id} className="text-sm text-ink">— {l.title}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Selected projects */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-page px-6 py-14">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-ink">Selected projects</h2>
            <Link href="/projects" className="text-sm text-muted hover:text-ink focus-ring">All projects →</Link>
          </div>
          {projects && projects.length > 0 ? (
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {projects.map((p: any) => (
                <Link key={p.id} href={`/projects/${p.slug}`} className="group focus-ring">
                  <div className="aspect-[4/3] overflow-hidden rounded-md bg-line">
                    {p.cover_url && (
                      <Image src={p.cover_url} alt={p.name} width={400} height={300} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                  </div>
                  <p className="mt-3 font-display text-lg text-ink">{p.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{p.description}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6"><EmptyState title="Every project starts as an idea." /></div>
          )}
        </div>
      </section>

      {/* Stats — light touch, real numbers only */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-page px-6 py-14">
          <div className="grid grid-cols-3 gap-8">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display text-4xl text-ink">{s.value}</p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-page px-6 py-24 text-center">
          <p className="font-display text-3xl italic text-ink">{profile?.closing_line || 'Still becoming.'}</p>
        </div>
      </section>
    </div>
  );
}
