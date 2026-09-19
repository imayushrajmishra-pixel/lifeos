import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PrivateNav } from '@/components/private-nav';
import { signOut } from '@/lib/actions/auth';

export const metadata = { robots: { index: false, follow: false } };

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Being signed in isn't enough — only the single designated owner account
  // may see or write private content. Every table's RLS policy enforces this
  // independently; this check just gives a clear message instead of a blank
  // dashboard if a non-owner account somehow signs in.
  const { data: isOwner } = await supabase.rpc('is_owner');

  if (!isOwner) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <div>
          <p className="font-display text-2xl text-ink">This account isn&rsquo;t authorized</p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            {user.email} is signed in, but only the designated owner account can access the private space.
          </p>
          <form action={signOut} className="mt-6">
            <button className="text-sm text-moss hover:underline focus-ring">Sign out</button>
          </form>
        </div>
      </div>
    );
  }

  const { data: profile } = await supabase.from('profiles').select('full_name').single();

  return (
    <div className="flex min-h-screen">
      <PrivateNav name={profile?.full_name || 'You'} />
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
