import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('is_public', true)
    .maybeSingle();

  const ownerId = profile?.owner_id;

   const [
    { data: currently },
    { data: focus },
    { data: learning },
    { data: moments },
    { data: projects },
    { data: projectCount },
    { data: skillCount },
    { data: momentCount },
  ] = await Promise.all([
    ownerId
      ? supabase
          .from('currently_items')
          .select('*')
          .eq('owner_id', ownerId)
          .order('position')
      : Promise.resolve({ data: [] as any[] }),

    ownerId
      ? supabase
          .from('current_focus_items')
          .select('*')
          .eq('owner_id', ownerId)
          .order('position')
          .limit(5)
      : Promise.resolve({ data: [] as any[] }),

    ownerId
      ? supabase
          .from('learning_items')
          .select('*')
          .eq('owner_id', ownerId)
          .order('position')
          .limit(6)
      : Promise.resolve({ data: [] as any[] }),

    ownerId
      ? supabase
          .from('moments')
          .select('*')
          .eq('owner_id', ownerId)
          .eq('visibility', 'public')
          .order('occurred_on', { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] as any[] }),

    ownerId
      ? supabase
          .from('projects')
          .select('*')
          .eq('owner_id', ownerId)
          .eq('visibility', 'public')
          .eq('is_featured', true)
          .order('created_at', { ascending: false })
          .limit(3)
      : Promise.resolve({ data: [] as any[] }),

    ownerId
      ? supabase
          .from('projects')
          .select('id')
          .eq('owner_id', ownerId)
          .eq('visibility', 'public')
      : Promise.resolve({ data: [] as any[] }),

    ownerId
      ? supabase
          .from('skills')
          .select('id')
          .eq('owner_id', ownerId)
          .eq('visibility', 'public')
          .eq('status', 'learning')
      : Promise.resolve({ data: [] as any[] }),

    ownerId
      ? supabase
          .from('moments')
          .select('id')
          .eq('owner_id', ownerId)
          .eq('visibility', 'public')
      : Promise.resolve({ data: [] as any[] }),
  ]);

  const name = profile?.full_name || 'Ayush';

  const tagline =
    profile?.tagline ||
    'Curious. Building things. Documenting the process.';

  const stats = [
    {
      label: 'Projects built',
      value: projectCount?.length ?? 0,
    },
    {
      label: 'Skills learning',
      value: skillCount?.length ?? 0,
    },
    {
      label: 'Moments kept',
      value: momentCount?.length ?? 0,
    },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-page px-6 pb-20 pt-20 md:pb-28 md:pt-28">
        <div className="grid gap-12 md:grid-cols-[1fr_auto] md:items-end">
          <div className="max-w-3xl">
            <p className="animate-reveal text-sm text-muted">
              Hi, I&rsquo;m
            </p>

            <h1 className="animate-reveal mt-3 font-display text-5xl leading-[0.98] tracking-tight text-ink sm:text-6xl md:text-8xl">
              {name}.
            </h1>

            <p className="animate-reveal mt-7 max-w-2xl text-lg leading-8 text-muted md:text-xl">
              {tagline}
            </p>

            <div className="animate-reveal mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/projects"
                className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper transition-opacity hover:opacity-85 focus-ring"
              >
                Explore my work
              </Link>

              <Link
                href="/about"
                className="rounded-full border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:bg-line/30 focus-ring"
              >
                A little about me
              </Link>
            </div>
          </div>

          <div className="hidden md:block">
            <p className="max-w-[180px] text-right text-xs uppercase tracking-[0.18em] text-muted">
              A small corner of the internet for the things I&rsquo;m building,
              learning, and remembering.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 border-t border-line pt-7 md:mt-20">
          <div className="grid grid-cols-3 gap-5 md:max-w-2xl md:gap-12">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl text-ink md:text-4xl">
                  {stat.value}
                </p>

                <p className="mt-1.5 max-w-[120px] text-xs leading-5 text-muted md:text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Currently */}
      {currently && currently.length > 0 && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-page px-6 py-16 md:py-20">
            <div className="grid gap-8 md:grid-cols-[220px_1fr]">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted">
                  Right now
                </p>

                <h2 className="mt-2 font-display text-2xl text-ink">
                  Currently
                </h2>
              </div>

              <div className="grid gap-x-10 sm:grid-cols-2">
                {currently.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-baseline gap-4 border-b border-line py-4 first:pt-0 sm:first:pt-4"
                  >
                    <span className="w-24 shrink-0 text-xs text-muted">
                      {item.label}
                    </span>

                    <span className="text-sm leading-6 text-ink">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Moments */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-page px-6 py-16 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                From the archive
              </p>

              <h2 className="mt-2 font-display text-3xl text-ink">
                Featured moments
              </h2>
            </div>

            <Link
              href="/moments"
              className="shrink-0 text-sm text-muted transition-colors hover:text-ink focus-ring"
            >
              View all →
            </Link>
          </div>

          {moments && moments.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
              {moments.map((moment: any, index: number) => (
                <figure
                  key={moment.id}
                  className={`group relative overflow-hidden rounded-lg bg-line ${
                    index === 0
                      ? 'col-span-2 aspect-[16/10] md:col-span-2'
                      : 'aspect-[4/5]'
                  }`}
                >
                  {moment.photo_url ? (
                    <Image
                      src={moment.photo_url}
                      alt={moment.caption || ''}
                      fill
                      sizes={
                        index === 0
                          ? '(max-width: 768px) 100vw, 66vw'
                          : '(max-width: 768px) 50vw, 33vw'
                      }
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-line">
                      <span className="text-xs text-muted">
                        No photo
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 pt-12">
                    <figcaption className="text-xs leading-5 text-white">
                      {moment.caption}
                    </figcaption>
                  </div>
                </figure>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                title="No public moments yet"
                hint="Moments marked public will appear here."
              />
            </div>
          )}
        </div>
      </section>

      {/* Focus + Learning */}
      {((focus?.length ?? 0) > 0 || (learning?.length ?? 0) > 0) && (
        <section className="border-t border-line">
          <div className="mx-auto max-w-page px-6 py-16 md:py-20">
            <div className="grid gap-14 md:grid-cols-2 md:gap-20">
              {/* Current focus */}
              {focus && focus.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    What matters now
                  </p>

                  <h2 className="mt-2 font-display text-3xl text-ink">
                    Current focus
                  </h2>

                  <div className="mt-7 flex flex-wrap gap-2.5">
                    {focus.map((item: any) => (
                      <Badge
                        key={item.id}
                        tone="moss"
                        className="px-4 py-2 text-sm"
                      >
                        {item.title}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning */}
              {learning && learning.length > 0 && (
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted">
                    Always in progress
                  </p>

                  <h2 className="mt-2 font-display text-3xl text-ink">
                    Things I&rsquo;m learning
                  </h2>

                  <ul className="mt-7 space-y-3">
                    {learning.map((item: any) => (
                      <li
                        key={item.id}
                        className="border-b border-line pb-3 text-sm leading-6 text-ink"
                      >
                        <span className="mr-3 text-muted">—</span>
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Selected Projects */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-page px-6 py-16 md:py-20">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Things I&rsquo;ve made
              </p>

              <h2 className="mt-2 font-display text-3xl text-ink">
                Selected projects
              </h2>
            </div>

            <Link
              href="/projects"
              className="shrink-0 text-sm text-muted transition-colors hover:text-ink focus-ring"
            >
              All projects →
            </Link>
          </div>

          {projects && projects.length > 0 ? (
            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {projects.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.slug}`}
                  className="group focus-ring"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-line">
                    {project.cover_url ? (
                      <Image
                        src={project.cover_url}
                        alt={project.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-display text-2xl text-muted">
                          {project.name}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
                  </div>

                  <div className="mt-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-display text-xl text-ink">
                        {project.name}
                      </h3>

                      <span className="mt-1 text-sm text-muted transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </div>

                    {project.description && (
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                        {project.description}
                      </p>
                    )}
                  </div>
                 </Link>
              ))}
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState
                title="Every project starts as an idea."
                hint="Featured public projects will appear here."
              />
            </div>
          )}
        </div>
      </section>

      {/* Closing */}
      <section className="border-t border-line">
        <div className="mx-auto max-w-page px-6 py-24 text-center md:py-32">
          <p className="mx-auto max-w-2xl font-display text-3xl leading-tight italic text-ink md:text-5xl">
            {profile?.closing_line || 'Still becoming.'}
          </p>

          <div className="mt-8 flex justify-center">
            <Link
              href="/about"
              className="text-sm text-muted underline decoration-line underline-offset-4 transition-colors hover:text-ink focus-ring"
            >
              Get to know me →
            </Link>
          </div>
        </div>
      </section>
     </div>
  );
 }