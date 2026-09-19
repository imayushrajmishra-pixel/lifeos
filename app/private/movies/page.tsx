import { createClient } from '@/lib/supabase/server';
import { MoviesView } from './movies-view';

export const dynamic = 'force-dynamic';

export default async function MoviesPage() {
  const supabase = createClient();
  const { data: movies } = await supabase.from('movies').select('*').order('created_at', { ascending: false });
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl text-ink">Movies</h1>
      <p className="mt-1 text-sm text-muted">Watched, and want to watch.</p>
      <MoviesView initialMovies={movies || []} />
    </div>
  );
}
