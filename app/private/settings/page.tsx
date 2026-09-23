import { createClient } from '@/lib/supabase/server';
import { updateProfile } from '@/lib/actions/profile';
import { updatePassword } from '@/lib/actions/auth';
import { Input, Textarea, Label } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/theme-toggle';
import { ImageUpload } from '@/components/image-upload';
import { ListManager } from '@/components/list-manager';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ searchParams }: { searchParams: { updated?: string; error?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [
    { data: profile },
    { data: currently },
    { data: focus },
    { data: learning },
    { data: wishes },
  ] = await Promise.all([
    supabase.from('profiles').select('*').single(),
    supabase.from('currently_items').select('*').order('position'),
    supabase.from('current_focus_items').select('*').order('position'),
    supabase.from('learning_items').select('*').order('position'),
    supabase.from('experience_wishes').select('*').order('position'),
  ]);

  const integrations = [
    { label: 'Interactive travel map (Mapbox)', configured: !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN },
    { label: 'AI diary search (Anthropic)', configured: !!process.env.ANTHROPIC_API_KEY },
    { label: 'Spotify', configured: !!process.env.SPOTIFY_CLIENT_ID },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-14">
      <div>
        <h1 className="font-display text-3xl text-ink">Settings</h1>
      </div>

      <section>
        <h2 className="font-display text-xl text-ink">Profile</h2>
        <Card className="mt-4">
          <form action={updateProfile} className="space-y-4">
            <ImageUpload name="avatar_url" label="Avatar" defaultUrl={profile?.avatar_url} />
            <div><Label htmlFor="full_name">Name</Label><Input id="full_name" name="full_name" defaultValue={profile?.full_name} required /></div>
            <div><Label htmlFor="tagline">Tagline</Label><Input id="tagline" name="tagline" defaultValue={profile?.tagline} /></div>
            <div><Label htmlFor="bio">Bio</Label><Textarea id="bio" name="bio" defaultValue={profile?.bio} rows={5} /></div>
            <div><Label htmlFor="what_i_like">What I like</Label><Textarea id="what_i_like" name="what_i_like" defaultValue={profile?.what_i_like} rows={2} /></div>
            <div><Label htmlFor="philosophy">Personal philosophy</Label><Textarea id="philosophy" name="philosophy" defaultValue={profile?.philosophy} rows={3} /></div>
            <div><Label htmlFor="closing_line">Homepage closing line</Label><Input id="closing_line" name="closing_line" defaultValue={profile?.closing_line} /></div>
            <input type="hidden" name="social_links" value={JSON.stringify(profile?.social_links || [])} />
            <input type="hidden" name="now_playing" value={profile?.now_playing || ''} />
            <input type="hidden" name="favorite_artists" value={profile?.favorite_artists?.join(', ') || ''} />
            <input type="hidden" name="favorite_songs" value={profile?.favorite_songs?.join(', ') || ''} />
            <input type="hidden" name="music_visibility" value={profile?.music_visibility || 'public'} />
            <Button type="submit">Save profile</Button>
          </form>
        </Card>
      </section>

      <section>
        <h2 className="font-display text-xl text-ink">Homepage content</h2>
        <div className="mt-4 space-y-8">
          <Card><ListManager table="currently_items" title="Currently" hint="Shown as label/value pairs on your homepage." items={currently || []} withLabel /></Card>
          <Card><ListManager table="current_focus_items" title="Current focus" items={focus || []} /></Card>
          <Card><ListManager table="learning_items" title="Things I'm learning" items={learning || []} /></Card>
          <Card><ListManager table="experience_wishes" title="What I want to experience" items={wishes || []} /></Card>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl text-ink">Appearance</h2>
        <Card className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted">Theme</p>
          <ThemeToggle />
        </Card>
      </section>

      <section>
        <h2 className="font-display text-xl text-ink">Account</h2>
        <Card className="mt-4 space-y-4">
          <p className="text-sm text-muted">Signed in as <span className="text-ink">{user?.email}</span></p>
          <form action={updatePassword} className="flex gap-2">
            <Input name="password" type="password" placeholder="New password" required minLength={8} className="flex-1" />
            <Button type="submit">Update</Button>
          </form>
          {searchParams.updated && <p className="text-sm text-moss">Password updated.</p>}
          {searchParams.error && <p className="text-sm text-rust">{searchParams.error}</p>}
        </Card>
      </section>

      <section>
        <h2 className="font-display text-xl text-ink">Data</h2>
        <Card className="mt-4 flex flex-wrap gap-3">
          <Button href="/api/export?format=json" variant="secondary">Export as JSON</Button>
          <Button href="/api/export?format=csv" variant="secondary">Export as CSV</Button>
        </Card>
      </section>

      <section>
        <h2 className="font-display text-xl text-ink">Integrations</h2>
        <Card className="mt-4 space-y-3">
          {integrations.map((i) => (
            <div key={i.label} className="flex items-center justify-between text-sm">
              <span className="text-ink">{i.label}</span>
              <Badge tone={i.configured ? 'moss' : 'default'}>{i.configured ? 'Configured' : 'Not configured'}</Badge>
            </div>
          ))}
          <p className="text-xs text-muted">Configure these in your deployment&rsquo;s environment variables — see .env.example.</p>
        </Card>
      </section>
    </div>
  );
}
