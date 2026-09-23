import { cn } from '@/lib/utils';

export function Badge({ children, tone = 'default', className }: { children: React.ReactNode; tone?: 'default' | 'moss' | 'gold' | 'rust'; className?: string }) {
  const tones: Record<string, string> = {
    default: 'bg-line/60 text-muted',
    moss: 'bg-moss/10 text-moss',
    gold: 'bg-gold/10 text-gold',
    rust: 'bg-rust/10 text-rust',
  };
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs', tones[tone], className)}>
      {children}
    </span>
  );
}
