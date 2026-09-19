'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './theme-toggle';
import { Menu, X } from 'lucide-react';

const links = [
  { href: '/about', label: 'About' },
  { href: '/projects', label: 'Projects' },
  { href: '/skills', label: 'Skills' },
  { href: '/moments', label: 'Moments' },
];

export function PublicNav({ name }: { name: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-page items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-lg italic text-ink focus-ring" onClick={() => setOpen(false)}>
          {name}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm transition-colors focus-ring',
                pathname === l.href ? 'text-ink' : 'text-muted hover:text-ink'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <ThemeToggle />
          <Link href="/login?next=/private" className="text-sm text-muted hover:text-ink focus-ring">
            Private space →
          </Link>
        </div>

        <button className="md:hidden focus-ring" onClick={() => setOpen((v) => !v)} aria-label="Toggle menu">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-ink" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="flex items-center justify-between pt-2">
              <Link href="/login?next=/private" className="text-sm text-muted">
                Private space →
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
