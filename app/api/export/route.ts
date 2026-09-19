import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const TABLES = [
  'diary_entries', 'moments', 'projects', 'tasks', 'books', 'movies', 'bucket_list', 'bookmarks',
  'study_goals', 'study_subjects', 'study_chapters',
] as const;

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))];
  return lines.join('\n');
}

 export async function GET(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  const format = new URL(request.url).searchParams.get('format') || 'json';

  const results: Record<string, unknown[]> = {};

  for (const table of TABLES) {
    const { data } = await supabase.from(table).select('*');
    results[table] = data || [];
  }

  if (format === 'csv') {
    const sections = TABLES
      .map((t) => `## ${t}\n${toCsv(results[t] as any[])}`)
      .join('\n\n');

    return new NextResponse(sections, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition':
          'attachment; filename="life-os-export.csv"',
      },
    });
  }

  return new NextResponse(JSON.stringify(results, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition':
        'attachment; filename="life-os-export.json"',
    },
  });
} 