import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Music2, Disc3, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { MusicPlayButton } from '@/components/music-play-button';

export const metadata = { title: 'Music' };
export const revalidate = 60;

function toYouTubeEmbed(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${parsed.pathname.slice(1).split('/')[0]}?rel=0&playsinline=1`;
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        const id = parsed.searchParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}?rel=0&playsinline=1` : null;
      }
      if (parsed.pathname.startsWith('/shorts/')) return `https://www.youtube.com/embed/${parsed.pathname.split('/')[2]}?rel=0&playsinline=1`;
      if (parsed.pathname.startsWith('/embed/')) return url;
    }
  } catch {}
  return null;
}

export default async function MusicPage() {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, now_playing, now_playing_url, favorite_artists, favorite_songs, music_visibility')
    .eq('is_public', true)
    .maybeSingle();

  const isPublic = profile?.music_visibility === 'public';
  const artists = Array.isArray(profile?.favorite_artists) ? profile.favorite_artists : [];
  const songs = Array.isArray(profile?.favorite_songs) ? profile.favorite_songs : [];
  const nowPlayingEmbed = profile?.now_playing_url ? toYouTubeEmbed(profile.now_playing_url) : null;

  return (
    <div className="mx-auto max-w-page px-6 py-14 md:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-blue-600 dark:text-blue-300">A little soundtrack</p>
        <h1 className="mt-3 font-display text-5xl leading-none tracking-tight text-ink">Music I love</h1>
        <p className="mt-5 text-lg leading-8 text-muted">Songs, artists, and something to keep me company while I study or wander around LifeOS.</p>
      </div>

      {!isPublic ? (
        <div className="mt-12 max-w-xl"><EmptyState title="Music is private right now." hint="The owner can make this section public from the private music settings." /></div>
      ) : (
        <>
          <section className="mt-10 overflow-hidden rounded-3xl border border-blue-200 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-500 p-5 text-white shadow-xl shadow-blue-900/10 md:p-7">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15"><Music2 size={25}/></div>
                <div className="min-w-0"><p className="text-xs font-medium uppercase tracking-[0.16em] text-blue-100">Now playing</p><h2 className="mt-1 truncate font-display text-2xl md:text-3xl">{profile?.now_playing || 'Nothing on repeat right now.'}</h2><p className="mt-1 text-sm text-blue-100">{profile?.full_name || 'My'}&rsquo;s current soundtrack.</p></div>
              </div>
              {profile?.now_playing_url ? <MusicPlayButton title={profile.now_playing || 'Now playing'} url={profile.now_playing_url} variant="light" /> : null}
            </div>
            {nowPlayingEmbed ? <div className="mt-6 overflow-hidden rounded-2xl bg-black/20"><div className="aspect-video"><iframe className="h-full w-full" src={nowPlayingEmbed} title={profile.now_playing || 'YouTube music'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div></div> : <p className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm text-blue-50">Add a YouTube link from the private Music page to play your current song here.</p>}
          </section>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <section className="rounded-2xl border border-line bg-surface p-6"><div className="flex items-center gap-3"><Disc3 size={18} className="text-blue-600 dark:text-blue-300"/><h2 className="font-display text-2xl text-ink">Favorite artists</h2></div>{artists.length ? <div className="mt-6 flex flex-wrap gap-2">{artists.map((artist:string)=><Badge key={artist}>{artist}</Badge>)}</div> : <p className="mt-5 text-sm text-muted">No favorite artists added yet.</p>}</section>
            <section className="rounded-2xl border border-line bg-surface p-6"><div className="flex items-center gap-3"><Music2 size={18} className="text-blue-600 dark:text-blue-300"/><h2 className="font-display text-2xl text-ink">Favorite songs</h2></div>{songs.length ? <ol className="mt-5 space-y-2">{songs.map((song:string,index:number)=><li key={song} className="flex items-center gap-3 rounded-xl border border-line px-3 py-3"><span className="w-5 shrink-0 text-xs text-muted">{String(index+1).padStart(2,'0')}</span><span className="min-w-0 flex-1 truncate text-sm text-ink">{song}</span><a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(song)}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950" aria-label={`Find ${song} on YouTube`}><ExternalLink size={15}/></a></li>)}</ol> : <p className="mt-5 text-sm text-muted">No favorite songs added yet.</p>}</section>
          </div>
        </>
      )}
      <div className="mt-12"><Link href="/" className="text-sm text-blue-600 underline decoration-blue-200 underline-offset-4 hover:text-blue-700 dark:text-blue-300">Back home →</Link></div>
    </div>
  );
}
