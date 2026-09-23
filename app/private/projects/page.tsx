import { createClient } from '@/lib/supabase/server';
import { ProjectsView } from './projects-view';

export const dynamic = 'force-dynamic';

export default async function ProjectsAdminPage() {
  const supabase = createClient();
  const { data: projects } = await supabase.from('projects').select('*').order('updated_at', { ascending: false });
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl text-ink">Projects</h1>
      <p className="mt-1 text-sm text-muted">Ideas, builds, and everything in between.</p>
      <ProjectsView initialProjects={projects || []} />
    </div>
  );
}
