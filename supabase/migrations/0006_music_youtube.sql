-- Music playback support. The URL is optional and can be a YouTube video URL.
alter table public.profiles
  add column if not exists now_playing_url text;
