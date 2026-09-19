import { signIn, requestPasswordReset } from '@/lib/actions/auth';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Private space',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: {
    error?: string;
    reset?: string;
    next?: string;
  };
}) {
  const next =
    searchParams.next && searchParams.next.startsWith('/')
      ? searchParams.next
      : '/private';

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="text-sm text-muted hover:text-ink focus-ring"
        >
          ← Back home
        </Link>

        <div className="mt-10">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            LifeOS
          </p>

          <h1 className="mt-3 font-display text-4xl text-ink">
            Welcome back
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted">
            Sign in to your study plan, tasks, diary, memories, and everything private to you.
          </p>
        </div>

        <form action={signIn} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Your password"
              className="mt-1.5"
            />
          </div>

          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>

        {searchParams.error && (
          <div className="mt-4 border border-rust/30 bg-rust/5 px-4 py-3 text-sm text-rust">
            {searchParams.error}
          </div>
        )}

        {searchParams.reset === 'sent' && (
          <div className="mt-4 border border-moss/30 bg-moss/5 px-4 py-3 text-sm text-moss">
            Check your email for a password reset link.
          </div>
        )}

        <div className="mt-7 border-t border-line pt-6 text-center text-sm text-muted">
          <span>Don't have an account? </span>
          <Link
            href="/signup"
            className="text-ink underline underline-offset-4 hover:opacity-60 focus-ring"
          >
            Sign up
          </Link>
        </div>

        <details className="mt-6 text-sm text-muted">
          <summary className="cursor-pointer hover:text-ink focus-ring">
            Forgot your password?
          </summary>

          <form action={requestPasswordReset} className="mt-4 space-y-3">
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <Button
              type="submit"
              variant="secondary"
              className="w-full"
            >
              Send reset link
            </Button>
          </form>
        </details>
      </div>
    </main>
  );
}