import { createClient } from '@/lib/supabase/server';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, BookOpen, Camera, Headphones, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();
  const { data: profile } = await supabase.from('profiles').select('*').eq('is_public', true).maybeSingle();
  const ownerId = profile?.owner_id;

  const [
    { data: focus },
    { data: learning },
    { data: moments },
    { data: projects },
    { data: projectCount },
    { data: skillCount },
  ] = await Promise.all([
    ownerId ? supabase.from('current_focus_items').select('*').eq('owner_id', ownerId).order('position').limit(4) : Promise.resolve({ data: [] as any[] }),
    ownerId ? supabase.from('learning_items').select('*').eq('owner_id', ownerId).order('position').limit(5) : Promise.resolve({ data: [] as any[] }),
    ownerId ? supabase.from('moments').select('*').eq('owner_id', ownerId).eq('visibility', 'public').order('occurred_on', { ascending: false }).limit(5) : Promise.resolve({ data: [] as any[] }),
    ownerId ? supabase.from('projects').select('*').eq('owner_id', ownerId).eq('visibility', 'public').eq('is_featured', true).order('created_at', { ascending: false }).limit(3) : Promise.resolve({ data: [] as any[] }),
    ownerId ? supabase.from('projects').select('id').eq('owner_id', ownerId).eq('visibility', 'public') : Promise.resolve({ data: [] as any[] }),
    ownerId ? supabase.from('skills').select('id').eq('owner_id', ownerId).eq('visibility', 'public') : Promise.resolve({ data: [] as any[] }),
  ]);

  const name = profile?.full_name || 'Your name';
  const firstName = name.split(' ')[0];
  const tagline = profile?.tagline || 'A little space for everything I’m building, learning, listening to, and remembering.';
  const stats = [
    { value: projectCount?.length ?? 0, label: 'projects' },
    { value: skillCount?.length ?? 0, label: 'things I’m learning' },
    { value: moments?.length ?? 0, label: 'recent moments' },
  ];
  const favoriteArtists = Array.isArray(profile?.favorite_artists) ? profile.favorite_artists.slice(0, 4) : [];
  const favoriteSongs = Array.isArray(profile?.favorite_songs) ? profile.favorite_songs.slice(0, 4) : [];

  return (
    <div className="overflow-hidden bg-paper">
      <section className="relative mx-auto max-w-page px-6 pb-20 pt-10 sm:pt-14 md:pb-28 md:pt-16">
        <div className="absolute -left-40 top-10 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl dark:bg-blue-900/20" />
        <div className="absolute -right-32 top-28 h-80 w-80 rounded-full bg-sky-200/35 blur-3xl dark:bg-sky-900/15" />
        <div className="relative grid items-center gap-12 md:grid-cols-[1.2fr_.8fr] md:gap-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              A little corner of the internet
            </div>
            <h1 className="mt-6 font-display text-5xl leading-[0.95] tracking-[-0.04em] text-ink sm:text-6xl md:text-8xl">
              Hi, I’m {firstName}.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-muted md:text-xl">{tagline}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/about" className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus-ring">
                Come in <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link href="/music" className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-5 py-3 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus-ring dark:border-blue-900 dark:bg-slate-950/50 dark:text-blue-300 dark:hover:bg-blue-950/50">
                <Headphones size={16} /> My soundtrack
              </Link>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-blue-200/70 via-sky-100/40 to-transparent blur-2xl dark:from-blue-950/50" />
            <div className="relative overflow-hidden rounded-[2rem] border border-blue-200/80 bg-white/75 p-3 shadow-2xl shadow-blue-950/10 backdrop-blur dark:border-blue-900 dark:bg-slate-950/70">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.4rem] bg-blue-50 dark:bg-blue-950/50">
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={name} fill sizes="(max-width: 768px) 80vw, 360px" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 via-sky-50 to-white dark:from-blue-950 dark:via-slate-900 dark:to-slate-950">
                    <span className="font-display text-8xl italic text-blue-500/70">{firstName.slice(0, 1)}</span>
                    <span className="mt-3 text-xs uppercase tracking-[0.2em] text-blue-500/70">LifeOS</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-2 pb-1 pt-4">
                <div>
                  <p className="font-display text-lg text-ink">{name}</p>
                  <p className="mt-0.5 text-xs text-muted">building · learning · becoming</p>
                </div>
                <Sparkles size={18} className="text-blue-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative mt-16 grid grid-cols-3 gap-3 border-t border-blue-100 pt-7 dark:border-blue-950 md:max-w-2xl md:gap-8">
          {stats.map((stat) => <div key={stat.label}><p className="font-display text-3xl text-ink md:text-4xl">{stat.value}</p><p className="mt-1 text-xs text-muted md:text-sm">{stat.label}</p></div>)}
        </div>
      </section>

      <section className="border-y border-blue-100 bg-blue-50/50 dark:border-blue-950 dark:bg-blue-950/10">
        <div className="mx-auto max-w-page px-6 py-14 md:py-20">
          <div className="grid gap-5 md:grid-cols-4">
            {[
              { href: '/about', icon: BookOpen, title: 'Study', text: 'Learn, revise and keep moving.' },
              { href: '/moments', icon: Camera, title: 'Moments', text: 'Keep the little things worth remembering.' },
              { href: '/music', icon: Headphones, title: 'Music', text: 'The soundtrack that keeps me company.' },
              { href: '/about', icon: Sparkles, title: 'About me', text: 'A little more of who I am.' },
            ].map(({ href, icon: Icon, title, text }) => (
              <Link key={href} href={href} className="group rounded-2xl border border-blue-100 bg-white/80 p-5 transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-900/5 dark:border-blue-900 dark:bg-slate-950/60 dark:hover:border-blue-700">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"><Icon size={18} /></div>
                <h2 className="mt-5 font-display text-xl text-ink">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{text}</p>
                <ArrowUpRight size={15} className="mt-5 text-blue-500 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {(focus?.length || learning?.length) ? (
        <section className="mx-auto max-w-page px-6 py-16 md:py-24">
          <div className="grid gap-12 md:grid-cols-2 md:gap-20">
            {focus?.length ? <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Right now</p><h2 className="mt-2 font-display text-3xl text-ink">What matters to me</h2><div className="mt-7 flex flex-wrap gap-2.5">{focus.map((item:any)=><span key={item.id} className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">{item.title}</span>)}</div></div> : null}
            {learning?.length ? <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Always in progress</p><h2 className="mt-2 font-display text-3xl text-ink">Things I’m learning</h2><ul className="mt-7 space-y-3">{learning.map((item:any)=><li key={item.id} className="flex gap-3 border-b border-line pb-3 text-sm leading-6 text-ink"><span className="text-blue-500">•</span>{item.title}</li>)}</ul></div> : null}
          </div>
        </section>
      ) : null}

      <section className="border-t border-line">
        <div className="mx-auto max-w-page px-6 py-16 md:py-24">
          <div className="flex items-end justify-between gap-5"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">A few things I’ve made</p><h2 className="mt-2 font-display text-3xl text-ink">Projects</h2></div><Link href="/projects" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-300">See everything →</Link></div>
          {projects?.length ? <div className="mt-9 grid gap-5 md:grid-cols-3">{projects.map((project:any)=><Link key={project.id} href={`/projects/${project.slug}`} className="group overflow-hidden rounded-2xl border border-line bg-surface focus-ring"><div className="relative aspect-[4/3] overflow-hidden bg-blue-50 dark:bg-blue-950/30">{project.cover_url ? <Image src={project.cover_url} alt={project.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition duration-700 group-hover:scale-105"/> : <div className="absolute inset-0 flex items-center justify-center p-6 text-center"><span className="font-display text-2xl text-blue-500/70">{project.name}</span></div>}</div><div className="p-5"><div className="flex items-start justify-between gap-4"><h3 className="font-display text-xl text-ink">{project.name}</h3><ArrowUpRight size={16} className="mt-1 text-blue-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></div>{project.description ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{project.description}</p> : null}</div></Link>)}</div> : <div className="mt-8"><EmptyState title="Projects will live here." hint="Featured public projects will appear as they are added." /></div>}
        </div>
      </section>

      {(profile?.music_visibility === 'public') && (
        <section className="border-y border-blue-100 bg-gradient-to-br from-blue-50 via-sky-50/60 to-white dark:border-blue-950 dark:from-blue-950/40 dark:via-slate-950 dark:to-slate-950">
          <div className="mx-auto max-w-page px-6 py-16 md:py-20">
            <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
              <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Soundtrack</p><h2 className="mt-2 font-display text-3xl text-ink">Music that keeps me company.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted">{profile.now_playing ? <>Currently listening to <span className="font-medium text-ink">{profile.now_playing}</span>.</> : 'A few songs and artists I keep coming back to.'}</p>{favoriteArtists.length ? <div className="mt-5 flex flex-wrap gap-2">{favoriteArtists.map((artist:string)=><span key={artist} className="rounded-full bg-white px-3 py-1.5 text-xs text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">{artist}</span>)}</div> : null}</div>
              <Link href="/music" className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 focus-ring">Open music <ArrowUpRight size={15}/></Link>
            </div>
          </div>
        </section>
      )}

      {moments?.length ? <section className="mx-auto max-w-page px-6 py-16 md:py-24"><div className="flex items-end justify-between gap-5"><div><p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">Little pieces of life</p><h2 className="mt-2 font-display text-3xl text-ink">Recent moments</h2></div><Link href="/moments" className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-300">View all →</Link></div><div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">{moments.slice(0,4).map((moment:any)=><figure key={moment.id} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-blue-50 dark:bg-blue-950/30">{moment.photo_url ? <Image src={moment.photo_url} alt={moment.caption || ''} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover"/> : <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-xs text-muted">{moment.caption || 'A moment'}</div>}<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10"><figcaption className="line-clamp-2 text-xs text-white">{moment.caption}</figcaption></div></figure>)}</div></section> : null}

      <section className="border-t border-blue-100 bg-blue-600 dark:border-blue-950 dark:bg-blue-950">
        <div className="mx-auto max-w-page px-6 py-20 md:py-28"><div className="max-w-3xl"><p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-100">LifeOS</p><h2 className="mt-4 font-display text-4xl leading-tight text-white md:text-6xl">A place for the things that matter.</h2><p className="mt-5 max-w-2xl text-base leading-7 text-blue-100">Study, remember, create, listen, and keep growing — all in one little space.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/about" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 focus-ring">Get to know me <ArrowUpRight size={15}/></Link><Link href="/login?next=/private" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-sm font-medium text-white hover:bg-white/10 focus-ring">Enter LifeOS <ArrowDownRight size={15}/></Link></div></div></div>
      </section>
    </div>
  );
}
