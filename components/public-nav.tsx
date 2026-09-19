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
        <Link
          href="/"
          className="font-display text-lg italic text-ink focus-ring"
          onClick={() => setOpen(false)}
        >
          {name}
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm transition-colors focus-ring',
                pathname === link.href
                  ? 'text-ink'
                  : 'text-muted hover:text-ink'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />

          <Link
            href="/login?next=/private"
            className="rounded-full px-4 py-2 text-sm text-muted transition-colors hover:bg-line/40 hover:text-ink focus-ring"
          >
            Sign in
          </Link>

          <Link
            href="/signup"
            className="rounded-full bg-ink px-4 py-2 text-sm text-paper transition-opacity hover:opacity-85 focus-ring"
          >
            Sign up
          </Link>
        </div>

        <button
          type="button"
          className="md:hidden focus-ring"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-line px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm transition-colors',
                  pathname === link.href
                    ? 'text-ink'
                    : 'text-muted hover:text-ink'
                )}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 flex items-center gap-3 border-t border-line pt-4">
              <Link
                href="/login?next=/private"
                className="rounded-full border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-line/30"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>

              <Link
                href="/signup"
                className="rounded-full bg-ink px-4 py-2 text-sm text-paper transition-opacity hover:opacity-85"
                onClick={() => setOpen(false)}
              >
                Sign up
              </Link>

              <div className="ml-auto">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}