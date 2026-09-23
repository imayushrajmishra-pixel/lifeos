import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { PROJECT_STATUS_LABEL, formatDate } from '@/lib/utils';

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: project } = await supabase.from('projects').select('name, description').eq('slug', params.slug).eq('visibility', 'public').single();
  if (!project) return {};
  return { title: project.name, description: project.description };
}

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: project } = await supabase.from('projects').select('*').eq('slug', params.slug).eq('visibility', 'public').single();
  if (!project) notFound();

  return (
    <article className="mx-auto max-w-page px-6 py-20">
      <div className="flex flex-wrap items-center gap-3">
        <Badge tone="moss">{PROJECT_STATUS_LABEL[project.status]}</Badge>
        {project.start_date && <span className="text-sm text-muted">{formatDate(project.start_date, { month: 'short', year: 'numeric' })}{project.end_date ? ` – ${formatDate(project.end_date, { month: 'short', year: 'numeric' })}` : ''}</span>}
      </div>
      <h1 className="mt-4 font-display text-4xl text-ink md:text-5xl">{project.name}</h1>
      <p className="mt-5 max-w-prose text-lg text-muted">{project.description}</p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        {project.link && <a href={project.link} target="_blank" className="text-moss hover:underline focus-ring">Visit →</a>}
        {project.github_link && <a href={project.github_link} target="_blank" className="text-moss hover:underline focus-ring">GitHub →</a>}
      </div>

      {project.cover_url && (
        <div className="mt-10 aspect-[16/9] overflow-hidden rounded-lg bg-line">
          <Image src={project.cover_url} alt={project.name} width={1200} height={675} className="h-full w-full object-cover" />
        </div>
      )}

      {(project.tools || []).length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {project.tools.map((t: string) => <Badge key={t}>{t}</Badge>)}
        </div>
      )}

      <div className="mt-14 grid gap-10 md:grid-cols-2">
        {project.challenges && (
          <div>
            <h2 className="font-display text-xl text-ink">Challenges</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{project.challenges}</p>
          </div>
        )}
        {project.learned && (
          <div>
            <h2 className="font-display text-xl text-ink">What I learned</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{project.learned}</p>
          </div>
        )}
      </div>

      {project.outcome && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-ink">Outcome</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{project.outcome}</p>
        </div>
      )}
    </article>
  );
}
