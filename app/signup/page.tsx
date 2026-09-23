import { signUp } from '@/lib/actions/auth';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata = {
  title: 'Create account',
};

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="text-sm text-muted hover:text-ink focus-ring"
        >
          ← Back to sign in
        </Link>

        <h1 className="mt-6 font-display text-3xl text-ink">
          Create account
        </h1>

        <p className="mt-2 text-sm text-muted">
          Create your LifeOS account to access your private space.
        </p>

        {searchParams.success === 'check-email' ? (
          <div className="mt-8">
            <p className="text-sm text-moss">
              Account created. Check your email to confirm your account, then
              come back and sign in.
            </p>

            <Link
              href="/login"
              className="mt-6 inline-block text-sm text-ink underline underline-offset-4"
            >
              Go to sign in →
            </Link>
          </div>
        ) : (
          <form action={signUp} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            <Button type="submit" className="w-full">
              Create account
            </Button>
          </form>
        )}

        {searchParams.error && (
          <p className="mt-4 text-sm text-rust">
            {searchParams.error}
          </p>
        )}

        {searchParams.success !== 'check-email' && (
          <p className="mt-6 text-sm text-muted">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-ink underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}