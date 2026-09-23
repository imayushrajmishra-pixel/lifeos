'use client';

import { Play } from 'lucide-react';
import { useMusicPlayer } from './music-player-provider';

export function MusicPlayButton({ title, url, variant = 'dark' }: { title: string; url: string; variant?: 'dark' | 'light' }) {
  const { play } = useMusicPlayer();
  return (
    <button
      type="button"
      onClick={() => play(title, url)}
      className={variant === 'light'
        ? 'inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-50 focus-ring'
        : 'inline-flex shrink-0 items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 focus-ring'}
    >
      <Play size={15} fill="currentColor" /> Play here
    </button>
  );
}
