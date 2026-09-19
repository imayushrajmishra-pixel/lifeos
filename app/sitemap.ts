import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const supabase = createClient();

  const staticRoutes = ['', '/about', '/projects', '/skills', '/moments', '/guestbook'].map((p) => ({
    url: `${site}${p}`,
    lastModified: new Date(),
  }));

  const { data: projects } = await supabase.from('projects').select('slug').eq('visibility', 'public');
  const projectRoutes = (projects || []).map((p: any) => ({ url: `${site}/projects/${p.slug}`, lastModified: new Date() }));

  return [...staticRoutes, ...projectRoutes];
}
