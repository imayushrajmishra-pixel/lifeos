import { createClient } from '@/lib/supabase/server';
import { updateMusic } from '@/lib/actions/profile';
import { Input, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Music2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PrivateMusicPage() {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('now_playing, now_playing_url, favorite_artists, favorite_songs, music_visibility')
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-moss/10 text-moss">
            <Music2 size={19} />
          </div>
          <div>
            <h1 className="font-display text-3xl text-ink">Music</h1>
            <p className="mt-1 text-sm text-muted">Set the song and YouTube video that can stay with you while you move around LifeOS.</p>
          </div>
        </div>
      </div>

      <Card className="mt-8">
        <form action={updateMusic} className="space-y-5">
          <div>
            <Label htmlFor="now_playing">Currently listening</Label>
            <Input id="now_playing" name="now_playing" placeholder="Song — Artist" defaultValue={profile?.now_playing ?? ''} />
            <div className="mt-4"><Label htmlFor="now_playing_url">YouTube link</Label><Input id="now_playing_url" name="now_playing_url" placeholder="https://www.youtube.com/watch?v=..." defaultValue={profile?.now_playing_url ?? ''} /></div>
          </div>

          <div>
            <Label htmlFor="favorite_artists">Favorite artists</Label>
            <Input id="favorite_artists" name="favorite_artists" placeholder="Artist 1, Artist 2, Artist 3" defaultValue={profile?.favorite_artists?.join(', ')} />
          </div>

          <div>
            <Label htmlFor="favorite_songs">Favorite songs</Label>
            <Input id="favorite_songs" name="favorite_songs" placeholder="Song 1, Song 2, Song 3" defaultValue={profile?.favorite_songs?.join(', ')} />
          </div>

          <div>
            <Label htmlFor="music_visibility">Show music publicly</Label>
            <select id="music_visibility" name="music_visibility" defaultValue={profile?.music_visibility || 'public'} className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-moss/30">
              <option value="public">Yes, show on my public site</option>
              <option value="private">No, keep it private</option>
            </select>
          </div>

          <Button type="submit">Save music</Button>
        </form>
      </Card>
    </div>
  );
}
