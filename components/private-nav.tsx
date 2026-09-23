'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { signOut } from '@/lib/actions/auth';
import {
  LayoutDashboard, BookOpen, CheckSquare, Image as ImageIcon,
  GraduationCap, FolderKanban, ListChecks, Award, Library, Bookmark, BarChart3, Settings, LogOut, MessageSquare, Music2, ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const groups = [
  {
    label: 'Overview',
    items: [{ href: '/private', label: 'Dashboard', icon: LayoutDashboard, exact: true }],
  },
  {
    label: 'Study',
    items: [{ href: '/private/study', label: 'Study', icon: GraduationCap }],
  },
  {
    label: 'Life',
    items: [
      { href: '/private/tasks', label: 'Tasks', icon: CheckSquare },
      { href: '/private/diary', label: 'Diary', icon: BookOpen },
      { href: '/private/memories', label: 'Moments', icon: ImageIcon },
      { href: '/private/skills', label: 'Skills', icon: Award },
      { href: '/private/projects', label: 'Projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Collections',
    items: [
      { href: '/private/bucket-list', label: 'Bucket list', icon: ListChecks },
      { href: '/private/books', label: 'Books', icon: Library },
      { href: '/private/music', label: 'Music', icon: Music2 },
      { href: '/private/bookmarks', label: 'Bookmarks', icon: Bookmark },
    ],
  },
  {
    label: 'Account',
    items: [
      { href: '/private/stats', label: 'Stats', icon: BarChart3 },
      { href: '/private/guestbook', label: 'Guestbook', icon: MessageSquare },
      { href: '/private/settings', label: 'Settings', icon: Settings },
    ],
  },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-xs uppercase tracking-wide text-muted/70">{group.label}</p>
          <div className="mt-1.5 space-y-0.5">
            {group.items.map(({ href, label, icon: Icon, exact }: any) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors focus-ring',
                    active ? 'bg-ink text-paper' : 'text-muted hover:bg-line/50 hover:text-ink'
                  )}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function PrivateNav({ name }: { name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-line px-4 py-8 md:block">
        <div className="px-3">
          <p className="font-display text-lg italic text-ink">{name}</p>
          <p className="text-xs text-muted">Private space</p>
        </div>
        <div className="mt-8">
          <NavLinks />
        </div>
        <div className="mt-8 space-y-3 px-3">
          <Link href="/" className="flex items-center gap-1.5 text-xs text-muted hover:text-ink focus-ring">
            <ExternalLink size={13} /> View public site
          </Link>
          <div className="flex items-center justify-between">
          <ThemeToggle />
          <form action={signOut}>
            <button className="flex items-center gap-1.5 text-xs text-muted hover:text-ink focus-ring">
              <LogOut size={13} /> Sign out
            </button>
          </form>
          </div>
        </div>
      </aside>

      <header className="flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
        <p className="font-display text-lg italic text-ink">{name}</p>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="focus-ring">
          <Menu size={20} />
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 bg-paper md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="font-display text-lg italic text-ink">{name}</p>
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="focus-ring">
              <X size={20} />
            </button>
          </div>
          <div className="px-4">
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
          <div className="mt-8 space-y-4 px-7">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-1.5 text-sm text-muted hover:text-ink focus-ring">
              <ExternalLink size={14} /> View public site
            </Link>
            <div className="flex items-center justify-between">
            <ThemeToggle />
            <form action={signOut}>
              <button className="flex items-center gap-1.5 text-xs text-muted hover:text-ink focus-ring">
                <LogOut size={13} /> Sign out
              </button>
            </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
