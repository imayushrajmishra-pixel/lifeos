import Link from 'next/link';

export function Footer({ name }: { name: string }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-page px-6 py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-display text-lg italic text-ink">{name}</p>
            <p className="mt-1 text-sm text-muted">Building. Learning. Exploring.</p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <Link href="/about" className="hover:text-ink focus-ring">About</Link>
            <Link href="/projects" className="hover:text-ink focus-ring">Projects</Link>
            <Link href="/skills" className="hover:text-ink focus-ring">Skills</Link>
            <Link href="/moments" className="hover:text-ink focus-ring">Moments</Link>
            <Link href="/guestbook" className="hover:text-ink focus-ring">Guestbook</Link>
            <Link href="/login?next=/private" className="hover:text-ink focus-ring">Private space →</Link>
          </nav>
        </div>
        <p className="mt-10 text-xs text-muted">© {new Date().getFullYear()} {name}</p>
      </div>
    </footer>
  );
}
