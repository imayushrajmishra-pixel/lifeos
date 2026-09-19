'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveSkill, deleteSkill } from '@/lib/actions/skills';
import { Input, Label, Select, Textarea } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { SKILL_STATUS_LABEL } from '@/lib/utils';
import { Trash2, Plus } from 'lucide-react';
import type { Skill } from '@/lib/types';

const CATEGORIES = ['technology', 'business', 'creative', 'communication', 'personal', 'other'];

export function SkillsManager({ initialSkills }: { initialSkills: Skill[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">Shown on your About page.</p>
        <Button onClick={() => setShowForm((v) => !v)}><Plus size={14} /> Add</Button>
      </div>

      {showForm && (
        <form
          action={(fd) => startTransition(async () => { await saveSkill(fd); setShowForm(false); router.refresh(); })}
          className="mt-4 space-y-3 rounded-md border border-line p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
            <div><Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue="other">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select>
            </div>
          </div>
          <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" rows={2} /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue="exploring">
                {Object.entries(SKILL_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            <div><Label htmlFor="started_on">Started</Label><Input id="started_on" name="started_on" type="date" /></div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="is_interest" /> This is an interest, not a skill</label>
            <div className="flex items-center gap-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select id="visibility" name="visibility" defaultValue="public" className="w-auto"><option value="public">Public</option><option value="private">Private</option></Select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2">
        {initialSkills.map((s) => (
          <div key={s.id} className="flex items-center gap-3 rounded-md border border-line px-3 py-2 text-sm">
            <span className="flex-1 text-ink">{s.name}</span>
            <Badge tone="moss">{s.is_interest ? 'Interest' : SKILL_STATUS_LABEL[s.status]}</Badge>
            <Badge tone={s.visibility === 'public' ? 'moss' : 'rust'}>{s.visibility}</Badge>
            <button onClick={() => { if (confirm('Delete?')) startTransition(async () => { await deleteSkill(s.id); router.refresh(); }); }} className="p-1 text-muted hover:text-rust focus-ring"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
