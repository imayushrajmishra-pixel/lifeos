'use client';

import { useRef, useState, useTransition } from 'react';
import { uploadMedia } from '@/lib/actions/media';
import { Label } from './ui/input';
import { ImagePlus } from 'lucide-react';

// A drop-in file input that uploads immediately to Supabase Storage and
// stores the resulting URL in a hidden input under `name`, so it posts along
// with the rest of the surrounding <form> without any extra wiring.
export function ImageUpload({
  name,
  label = 'Photo',
  defaultUrl,
  bucket = 'public-media',
}: {
  name: string;
  label?: string;
  defaultUrl?: string | null;
  bucket?: 'public-media' | 'private-media';
}) {
  const [url, setUrl] = useState(defaultUrl || '');
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <Label>{label}</Label>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-3">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="h-16 w-16 rounded-md object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-line text-muted">
            <ImagePlus size={18} />
          </div>
        )}
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.set('file', file);
              startTransition(async () => {
                try {
                  setError('');
                  const res = await uploadMedia(fd, bucket);
                  setUrl(res.url);
                } catch (err: any) {
                  setError(err.message || 'Upload failed');
                }
              });
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={pending}
            className="rounded-md border border-line px-3 py-1.5 text-xs text-ink hover:bg-line/40 focus-ring"
          >
            {pending ? 'Uploading…' : url ? 'Replace' : 'Upload'}
          </button>
          {error && <p className="mt-1 text-xs text-rust">{error}</p>}
        </div>
      </div>
    </div>
  );
}
