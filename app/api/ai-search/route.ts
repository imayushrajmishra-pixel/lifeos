import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// AI-powered diary search. Only ever reads the signed-in owner's own diary
// entries (RLS makes this true even if the query below were ever wrong) and
// sends only what's needed to answer the question — never anyone else's data,
// because there is only ever one owner in this app.
export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: isOwner } = await supabase.rpc('is_owner');
  if (!isOwner) return NextResponse.json({ error: 'Not authorized' }, { status: 403 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI search isn\'t configured yet. Add ANTHROPIC_API_KEY to your environment to enable it.' },
      { status: 501 }
    );
  }

  const { question } = await request.json();
  if (!question || typeof question !== 'string') {
    return NextResponse.json({ error: 'A question is required' }, { status: 400 });
  }

  const { data: entries } = await supabase
    .from('diary_entries')
    .select('entry_date, title, content, mood, tags')
    .order('entry_date', { ascending: false })
    .limit(400);

  const corpus = (entries || [])
    .map((e: any) => `[${e.entry_date}]${e.title ? ` ${e.title}` : ''}${e.mood ? ` (mood: ${e.mood})` : ''}\n${e.content}`)
    .join('\n---\n')
    .slice(0, 180_000); // keep well within context limits

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system:
        "You answer questions about the user's own private diary entries, which are provided below. " +
        'Answer only from the entries given — never invent dates or events. Quote sparingly and keep the tone warm, ' +
        'like a thoughtful friend who has read their journal, not a search engine.',
      messages: [
        { role: 'user', content: `Diary entries:\n${corpus}\n\nQuestion: ${question}` },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: 'AI search request failed', detail }, { status: 502 });
  }

  const data = await response.json();
  const text = data.content?.map((c: any) => c.text || '').join('\n') || '';
  return NextResponse.json({ answer: text });
}
