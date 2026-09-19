import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { ModerationButtons } from './moderation-buttons';

export const dynamic = 'force-dynamic';

export default async function GuestbookAdminPage() {
  const supabase = createClient();
  const { data: messages } = await supabase.from('guestbook').select('*').order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-ink">Guestbook</h1>
      <p className="mt-1 text-sm text-muted">Approve, hide, or delete visitor messages.</p>

      <div className="mt-8 space-y-3">
        {messages && messages.length > 0 ? (
          messages.map((m: any) => (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="whitespace-pre-line text-sm text-ink">{m.message}</p>
                  <p className="mt-2 text-xs text-muted">{m.name} · {formatDate(m.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                <Badge tone={m.status === 'approved' ? 'moss' : m.status === 'hidden' ? 'rust' : 'gold'}>{m.status}</Badge>
              </div>
              <ModerationButtons id={m.id} status={m.status} />
            </Card>
          ))
        ) : (
          <EmptyState title="No messages yet." />
        )}
      </div>
    </div>
  );
}
