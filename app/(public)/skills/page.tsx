import { createClient } from '@/lib/supabase/server';
import { SKILL_STATUS_LABEL } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata = { title: 'Skills' };
export const revalidate = 60;

const CATEGORY_LABEL: Record<string, string> = {
  technology: 'Technology',
  business: 'Business',
  creative: 'Creative',
  communication: 'Communication',
  personal: 'Personal',
  other: 'Other',
};

export default async function SkillsPage() {
  const supabase = createClient();
  const { data: skills } = await supabase
    .from('skills')
    .select('*')
    .eq('visibility', 'public')
    .eq('is_interest', false)
    .order('created_at', { ascending: false });

  const byCategory = (skills || []).reduce<Record<string, any[]>>((acc, s: any) => {
    acc[s.category] = acc[s.category] || [];
    acc[s.category].push(s);
    return acc;
  }, {});
  const categories = Object.keys(byCategory);

  return (
    <div className="mx-auto max-w-page px-6 py-20">
      <h1 className="font-display text-4xl text-ink">Skills</h1>
      <p className="mt-4 max-w-prose text-muted">What I&rsquo;m exploring, learning, and getting comfortable with — honestly, not with fake percentages.</p>

      {categories.length > 0 ? (
        <div className="mt-14 space-y-14">
          {categories.map((cat) => (
            <section key={cat}>
              <h2 className="font-display text-xl text-ink">{CATEGORY_LABEL[cat] || cat}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {byCategory[cat].map((s: any) => (
                  <div key={s.id} className="border-b border-line pb-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm text-ink">{s.name}</p>
                      <Badge tone="moss">{SKILL_STATUS_LABEL[s.status]}</Badge>
                    </div>
                    {s.description && <p className="mt-1 text-xs text-muted">{s.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-14"><EmptyState title="Skills will show up here as they're added." /></div>
      )}
    </div>
  );
}
