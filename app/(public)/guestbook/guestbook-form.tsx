'use client';

import { useRef, useState, useTransition } from 'react';
import { leaveGuestbookMessage } from '@/lib/actions/guestbook';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function GuestbookForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  return (
    <form
      ref={formRef}
      action={(formData) => {
        startTransition(async () => {
          try {
            await leaveGuestbookMessage(formData);
            setStatus('sent');
            formRef.current?.reset();
          } catch {
            setStatus('error');
          }
        });
      }}
      className="space-y-4"
    >
      {/* honeypot field — real visitors never see or fill this */}
      <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required maxLength={80} />
      </div>
      <div>
        <Label htmlFor="link">Website or social link (optional)</Label>
        <Input id="link" name="link" type="url" placeholder="https://" />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" required maxLength={1000} rows={4} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? 'Sending…' : 'Sign the guestbook'}</Button>

      {status === 'sent' && <p className="text-sm text-moss">Thanks — your message is awaiting a quick review before it appears.</p>}
      {status === 'error' && <p className="text-sm text-rust">Something went wrong. Please try again.</p>}
    </form>
  );
}
