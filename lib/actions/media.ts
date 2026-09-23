'use server';

import { createClient } from '@/lib/supabase/server';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']);

// Uploads a file to Supabase Storage and returns a URL to store on the record.
// `bucket` is 'public-media' (world-readable) or 'private-media' (owner-only,
// served through signed URLs generated on demand — see getSignedUrl below).
export async function uploadMedia(formData: FormData, bucket: 'public-media' | 'private-media') {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) throw new Error('No file provided');
  if (file.size > MAX_BYTES) throw new Error('File is too large (max 8MB)');
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Unsupported file type');

  const ext = file.name.split('.').pop();
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw error;

  await supabase.from('media').insert({
    owner_id: user.id,
    owner_type: 'moment',
    storage_path: path,
    bucket,
    visibility: bucket === 'public-media' ? 'public' : 'private',
  });

  if (bucket === 'public-media') {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  const { data, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (signErr) throw signErr;
  return { url: data.signedUrl, path };
}

// Re-signs a private-media path for display (signed URLs expire).
export async function getSignedUrl(path: string, bucket: 'private-media' = 'private-media') {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}
