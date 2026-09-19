'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function leaveGuestbookMessage(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const message = String(formData.get('message') || '').trim();
  const link = String(formData.get('link') || '').trim();
  const honeypot = String(formData.get('company') || ''); // hidden field — bots fill it, humans don't

  if (honeypot) return { ok: true }; // silently succeed for bots, write nothing
  if (!name || !message) throw new Error('Name and message are required');
  if (message.length > 1000) throw new Error('Message is too long');

  const supabase = createClient();
  const { error } = await supabase
    .from('guestbook')
    .insert({ name, message, link: link || null, status: 'pending' });
  if (error) throw error;

  revalidatePath('/guestbook');
  return { ok: true };
}

export async function moderateGuestbook(id: string, status: 'approved' | 'hidden') {
  const supabase = createClient();
  const { error } = await supabase.from('guestbook').update({ status }).eq('id', id);
  if (error) throw error;
  revalidatePath('/guestbook');
  revalidatePath('/private/guestbook');
}

export async function deleteGuestbookMessage(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('guestbook').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/guestbook');
  revalidatePath('/private/guestbook');
}
