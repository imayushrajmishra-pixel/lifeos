'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { moderateGuestbook, deleteGuestbookMessage } from '@/lib/actions/guestbook';
import { Button } from '@/components/ui/button';

export function ModerationButtons({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex gap-2">
      {status !== 'approved' && (
        <Button variant="secondary" onClick={() => startTransition(async () => { await moderateGuestbook(id, 'approved'); router.refresh(); })}>Approve</Button>
      )}
      {status !== 'hidden' && (
        <Button variant="secondary" onClick={() => startTransition(async () => { await moderateGuestbook(id, 'hidden'); router.refresh(); })}>Hide</Button>
      )}
      <Button variant="danger" onClick={() => { if (confirm('Delete permanently?')) startTransition(async () => { await deleteGuestbookMessage(id); router.refresh(); }); }}>Delete</Button>
    </div>
  );
}
