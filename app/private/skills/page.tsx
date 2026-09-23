import { createClient } from '@/lib/supabase/server';
import { SkillsManager } from '@/components/skills-manager';

export const dynamic = 'force-dynamic';

export default async function PrivateSkillsPage() {
  const supabase = createClient();
  const { data: skills } = await supabase.from('skills').select('*').order('created_at', { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-ink">Skills</h1>
      <p className="mt-1 text-sm text-muted">What you&rsquo;re exploring, learning, and getting good at. Shown publicly on /skills unless marked private.</p>
      <div className="mt-8"><SkillsManager initialSkills={skills || []} /></div>
    </div>
  );
}
