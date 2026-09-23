'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Music2, X, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'lifeos-music-player';

type PlayerState = {
  title: string;
  url: string;
};

type MusicPlayerContextValue = {
  player: PlayerState | null;
  play: (title: string, url: string) => void;
  clear: () => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

function getYouTubeId(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.slice(1).split('/')[0] || null;
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || null;
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || null;
    }
  } catch {
    return null;
  }
  return null;
}

export function MusicPlayerProvider({ children }: { children: React.ReactNode }) {
  const [player, setPlayer] = useState<PlayerState | null>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setPlayer(JSON.parse(saved));
    } catch {
      // Ignore malformed local state.
    }
  }, []);

  useEffect(() => {
    if (player) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(player));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, [player]);

  const value = useMemo(() => ({
    player,
    play: (title: string, url: string) => setPlayer({ title, url }),
    clear: () => setPlayer(null),
  }), [player]);

  const videoId = player ? getYouTubeId(player.url) : null;

  return (
    <MusicPlayerContext.Provider value={value}>
      {children}
      {player && videoId && (
        <div className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl overflow-hidden rounded-2xl border border-blue-200/70 bg-white/95 shadow-2xl shadow-blue-950/15 backdrop-blur dark:border-blue-900 dark:bg-slate-950/95">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
              <Music2 size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-blue-600 dark:text-blue-300">Now playing</p>
              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{player.title}</p>
            </div>
            <a href={player.url} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950" aria-label="Open on YouTube">
              <ExternalLink size={15} />
            </a>
            <button type="button" onClick={value.clear} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900" aria-label="Close music player">
              <X size={16} />
            </button>
          </div>
          <div className="aspect-video bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?rel=0&playsinline=1`}
              title={player.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (!context) throw new Error('useMusicPlayer must be used inside MusicPlayerProvider');
  return context;
}
