'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { addListItem, removeListItem } from '@/lib/actions/profile';
import { Input, Label } from './ui/input';
import { Button } from './ui/button';
import { Trash2 } from 'lucide-react';

type Table = 'currently_items' | 'current_focus_items' | 'learning_items' | 'experience_wishes';

export function ListManager({
  table,
  title,
  hint,
  items,
  withLabel = false,
}: {
  table: Table;
  title: string;
  hint?: string;
  items: any[];
  withLabel?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <p className="text-sm text-ink">{title}</p>
      {hint && <p className="text-xs text-muted">{hint}</p>}
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm">
            <span className="flex-1 text-ink">{withLabel ? `${item.label}: ${item.value}` : item.title}</span>
            <button
              onClick={() => startTransition(async () => { await removeListItem(table, item.id); router.refresh(); })}
              className="p-1 text-muted hover:text-rust focus-ring"
            >
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
      <form
        action={(fd) => {
          const fields = withLabel
            ? { label: String(fd.get('label') || ''), value: String(fd.get('value') || ''), position: items.length }
            : { title: String(fd.get('title') || ''), position: items.length };
          startTransition(async () => { await addListItem(table, fields as any); router.refresh(); });
        }}
        className="mt-3 flex gap-2"
      >
        {withLabel ? (
          <>
            <Input name="label" placeholder="Label (e.g. Learning)" required className="w-32" />
            <Input name="value" placeholder="Value" required className="flex-1" />
          </>
        ) : (
          <Input name="title" placeholder="Add an item" required className="flex-1" />
        )}
        <Button type="submit" disabled={pending}>Add</Button>
      </form>
    </div>
  );
}
