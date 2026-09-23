'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveProject, deleteProject } from '@/lib/actions/projects';
import { ImageUpload } from '@/components/image-upload';
import { Input, Textarea, Label, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PROJECT_STATUS_LABEL } from '@/lib/utils';
import { Trash2, Pencil, Plus } from 'lucide-react';
import type { Project } from '@/lib/types';

export function ProjectsView({ initialProjects }: { initialProjects: Project[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<Project | null | 'new'>(null);

  return (
    <div className="mt-8">
      <div className="flex justify-end"><Button onClick={() => setEditing('new')}><Plus size={14} /> New project</Button></div>

      {editing && <ProjectForm project={editing === 'new' ? null : editing} onDone={() => { setEditing(null); router.refresh(); }} />}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {initialProjects.length === 0 ? (
          <div className="sm:col-span-2"><EmptyState title="Every project starts as an idea." /></div>
        ) : (
          initialProjects.map((p) => (
            <Card key={p.id} className="flex gap-3">
              {p.cover_url && <img src={p.cover_url} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">{p.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge tone="moss">{PROJECT_STATUS_LABEL[p.status]}</Badge>
                  <Badge tone={p.visibility === 'public' ? 'moss' : 'rust'}>{p.visibility}</Badge>
                  {p.is_featured && <Badge tone="gold">Featured</Badge>}
                </div>
              </div>
              <div className="flex shrink-0 items-start gap-1">
                <button onClick={() => setEditing(p)} className="p-1 text-muted hover:text-ink focus-ring"><Pencil size={14} /></button>
                <button onClick={() => { if (confirm('Delete?')) startTransition(async () => { await deleteProject(p.id); router.refresh(); }); }} className="p-1 text-muted hover:text-rust focus-ring"><Trash2 size={14} /></button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function ProjectForm({ project, onDone }: { project: Project | null; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  return (
    <Card className="mt-6">
      <form action={(fd) => { if (project) fd.set('id', project.id); startTransition(async () => { await saveProject(fd); onDone(); }); }} className="space-y-4">
        <div><Label htmlFor="name">Name</Label><Input id="name" name="name" defaultValue={project?.name} required /></div>
        <div><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={project?.description} rows={3} /></div>
        <ImageUpload name="cover_url" defaultUrl={project?.cover_url} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="start_date">Start date</Label><Input id="start_date" name="start_date" type="date" defaultValue={project?.start_date ?? ''} /></div>
          <div><Label htmlFor="end_date">End date</Label><Input id="end_date" name="end_date" type="date" defaultValue={project?.end_date ?? ''} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="status">Status</Label>
            <Select id="status" name="status" defaultValue={project?.status || 'idea'}>
              {Object.entries(PROJECT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </div>
          <div><Label htmlFor="tools">Tools (comma separated)</Label><Input id="tools" name="tools" defaultValue={project?.tools?.join(', ')} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label htmlFor="link">Live link</Label><Input id="link" name="link" defaultValue={project?.link ?? ''} /></div>
          <div><Label htmlFor="github_link">GitHub link</Label><Input id="github_link" name="github_link" defaultValue={project?.github_link ?? ''} /></div>
        </div>
        <div><Label htmlFor="challenges">Challenges</Label><Textarea id="challenges" name="challenges" defaultValue={project?.challenges} rows={2} /></div>
        <div><Label htmlFor="learned">What I learned</Label><Textarea id="learned" name="learned" defaultValue={project?.learned} rows={2} /></div>
        <div><Label htmlFor="outcome">Outcome</Label><Textarea id="outcome" name="outcome" defaultValue={project?.outcome} rows={2} /></div>
        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-ink"><input type="checkbox" name="is_featured" defaultChecked={project?.is_featured} /> Featured</label>
          <div className="flex items-center gap-2">
            <Label htmlFor="visibility">Visibility</Label>
            <Select id="visibility" name="visibility" defaultValue={project?.visibility || 'private'} className="w-auto">
              <option value="private">Private</option>
              <option value="public">Public</option>
            </Select>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>{pending ? 'Saving…' : 'Save project'}</Button>
          <Button type="button" variant="secondary" onClick={onDone}>Cancel</Button>
        </div>
      </form>
    </Card>
  );
}
