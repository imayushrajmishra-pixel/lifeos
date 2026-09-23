import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PrivateNav } from '@/components/private-nav';


export const metadata = { robots: { index: false, follow: false } };

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Every authenticated user gets their own private LifeOS.
  // Their profile is identified by owner_id = auth.uid().
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('owner_id', user.id)
    .maybeSingle();

  return (
    <div className="flex min-h-screen">
      <PrivateNav name={profile?.full_name || 'You'} />
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">
        {children}
      </main>
    </div>
  );
} 