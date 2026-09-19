'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const social_links = String(formData.get('social_links') || '[]');
  const splitList = (key: string) => String(formData.get(key) || '').split(',').map((s) => s.trim()).filter(Boolean);

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: String(formData.get('full_name') || ''),
      tagline: String(formData.get('tagline') || ''),
      bio: String(formData.get('bio') || ''),
      what_i_like: String(formData.get('what_i_like') || ''),
      philosophy: String(formData.get('philosophy') || ''),
      closing_line: String(formData.get('closing_line') || ''),
      now_playing: String(formData.get('now_playing') || '') || null,
      favorite_artists: splitList('favorite_artists'),
      favorite_songs: splitList('favorite_songs'),
      music_visibility: String(formData.get('music_visibility') || 'public'),
      social_links: JSON.parse(social_links || '[]'),
      updated_at: new Date().toISOString(),
    })
    .eq('owner_id', user.id);

  if (error) throw error;
  revalidatePath('/', 'layout');
  revalidatePath('/private/settings');
}

type ListTable = 'currently_items' | 'current_focus_items' | 'learning_items' | 'experience_wishes';

export async function addListItem(table: ListTable, fields: Record<string, string>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from(table).insert({ ...fields, owner_id: user.id });
  if (error) throw error;
  revalidatePath('/', 'layout');
}

export async function removeListItem(table: ListTable, id: string) {
  const supabase = createClient();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/', 'layout');
}
