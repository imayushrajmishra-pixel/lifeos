import { signIn, requestPasswordReset } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = { title: 'Private space' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; reset?: string; next?: string };
}) {
  const next = searchParams.next && searchParams.next.startsWith('/') ? searchParams.next : '/private';

  // Already signed in? Don't make the person look at a login form —
  // send them straight where they were headed.
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect(next);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="text-sm text-muted hover:text-ink focus-ring">← Back home</Link>
        <h1 className="mt-6 font-display text-3xl text-ink">Private space</h1>
        <p className="mt-2 text-sm text-muted">Sign in to your study plan, diary, and everything only you can see.</p>

        <form action={signIn} className="mt-8 space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required autoComplete="current-password" />
          </div>
          <Button type="submit" className="w-full">Sign in</Button>
        </form>

        {searchParams.error && (
          <p className="mt-4 text-sm text-rust">{searchParams.error}</p>
        )}
        {searchParams.reset === 'sent' && (
          <p className="mt-4 text-sm text-moss">Check your email for a reset link.</p>
        )}

        <details className="mt-6 text-sm text-muted">
          <summary className="cursor-pointer focus-ring">Forgot your password?</summary>
          <form action={requestPasswordReset} className="mt-3 flex gap-2">
            <Input name="email" type="email" placeholder="you@example.com" required className="flex-1" />
            <Button type="submit" variant="secondary">Send link</Button>
          </form>
        </details>
      </div>
    </div>
  );
}
