import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80) || crypto.randomUUID().slice(0, 8);
}

export function formatDate(value: string | null | undefined, opts?: Intl.DateTimeFormatOptions) {
  if (!value) return '';
  return new Date(value + (value.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...opts,
  });
}

export function timeAgo(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 1) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export const MOOD_META: Record<string, { emoji: string; label: string }> = {
  great: { emoji: '😀', label: 'Great' },
  good: { emoji: '🙂', label: 'Good' },
  okay: { emoji: '😐', label: 'Okay' },
  low: { emoji: '😔', label: 'Low' },
  angry: { emoji: '😡', label: 'Angry' },
  tired: { emoji: '😴', label: 'Tired' },
  thoughtful: { emoji: '🤔', label: 'Thoughtful' },
  grateful: { emoji: '❤️', label: 'Grateful' },
};

export const SKILL_STATUS_LABEL: Record<string, string> = {
  exploring: 'Exploring',
  learning: 'Learning',
  comfortable: 'Comfortable',
  advanced: 'Advanced',
  want_to_improve: 'Want to improve',
};

export const PROJECT_STATUS_LABEL: Record<string, string> = {
  idea: 'Idea',
  building: 'Building',
  live: 'Live',
  completed: 'Completed',
  paused: 'Paused',
};
