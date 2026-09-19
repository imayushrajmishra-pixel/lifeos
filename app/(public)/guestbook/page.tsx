import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDate } from '@/lib/utils';
import { GuestbookForm } from './guestbook-form';

export const metadata = { title: 'Guestbook' };
export const revalidate = 30;

export default async function GuestbookPage() {
  const supabase = createClient();
  const { data: messages } = await supabase
    .from('guestbook')
    .select('*')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-page px-6 py-20">
      <h1 className="font-display text-4xl text-ink">Guestbook</h1>
      <p className="mt-4 max-w-prose text-muted">Leave a note — I read every one.</p>

      <div className="mt-10 max-w-lg">
        <GuestbookForm />
      </div>

      <div className="mt-16 border-t border-line pt-12">
        {messages && messages.length > 0 ? (
          <ul className="space-y-8">
            {messages.map((m: any) => (
              <li key={m.id} className="border-b border-line pb-8">
                <p className="whitespace-pre-line text-ink">{m.message}</p>
                <p className="mt-3 text-xs text-muted">
                  {m.link ? (
                    <a href={m.link} target="_blank" className="hover:text-ink focus-ring">{m.name}</a>
                  ) : (
                    m.name
                  )}
                  {' · '}{formatDate(m.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No messages yet." hint="Be the first to sign the guestbook." />
        )}
      </div>
    </div>
  );
}
