import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Small shared helpers used by every domain action file. Not itself a
// 'use server' module — the exported Server Actions live in each domain file
// (lib/actions/diary.ts, projects.ts, etc.) and call these underneath.
// Authorization is never decided here: Postgres RLS is the real gate, so even
// if these helpers were called with a forged owner_id the database rejects it.

export async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, user };
}

export async function insertRow(table: string, values: Record<string, unknown>, paths: string[]) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from(table)
    .insert({ ...values, owner_id: user.id })
    .select()
    .single();
  if (error) throw error;
  paths.forEach((p) => revalidatePath(p));
  return data;
}

export async function updateRow(table: string, id: string, values: Record<string, unknown>, paths: string[]) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from(table).update(values).eq('id', id).select().single();
  if (error) throw error;
  paths.forEach((p) => revalidatePath(p));
  return data;
}

export async function deleteRow(table: string, id: string, paths: string[]) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
  paths.forEach((p) => revalidatePath(p));
}

export function jsonField(formData: FormData, key: string): string[] {
  const raw = String(formData.get(key) || '');
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function optionalString(formData: FormData, key: string): string | null {
  const v = formData.get(key);
  if (v === null || v === '') return null;
  return String(v);
}
