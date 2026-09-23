import { createClient } from '@/lib/supabase/server';
import { PublicNav } from '@/components/public-nav';
import { Footer } from '@/components/footer';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('is_public', true).maybeSingle();
  const name = profile?.full_name || 'Your name';

  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav name={name} />
      <main className="flex-1">{children}</main>
      <Footer name={name} />
    </div>
  );
}
