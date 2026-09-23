import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { PROJECT_STATUS_LABEL } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export const metadata = { title: 'Projects' };
export const revalidate = 60;

export default async function ProjectsPage() {
  const supabase = createClient();
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('visibility', 'public')
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-page px-6 py-20">
      <h1 className="font-display text-4xl text-ink">Projects</h1>
      <p className="mt-4 max-w-prose text-muted">Things I&rsquo;m building, have built, or am still figuring out.</p>

      {projects && projects.length > 0 ? (
        <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2">
          {projects.map((p: any) => (
            <Link key={p.id} href={`/projects/${p.slug}`} className="group focus-ring">
              <div className="aspect-[16/10] overflow-hidden rounded-md bg-line">
                {p.cover_url && (
                  <Image src={p.cover_url} alt={p.name} width={640} height={400} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                )}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <p className="font-display text-xl text-ink">{p.name}</p>
                <Badge tone="moss">{PROJECT_STATUS_LABEL[p.status]}</Badge>
              </div>
              <p className="mt-2 line-clamp-2 max-w-prose text-sm text-muted">{p.description}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12"><EmptyState title="Every project starts as an idea." hint="Public projects will appear here once added." /></div>
      )}
    </div>
  );
}
