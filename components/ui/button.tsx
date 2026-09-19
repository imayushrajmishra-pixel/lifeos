import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const styles: Record<Variant, string> = {
  primary: 'bg-ink text-paper hover:opacity-90 dark:bg-ink dark:text-paper',
  secondary: 'border border-line text-ink hover:bg-surface',
  ghost: 'text-muted hover:text-ink',
  danger: 'text-rust hover:bg-rust/10',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
}

export function Button({ variant = 'primary', className, href, children, ...props }: Props) {
  const cls = cn(
    'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition-colors focus-ring',
    styles[variant],
    className
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
