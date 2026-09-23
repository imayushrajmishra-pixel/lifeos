// Seeds tasteful, clearly-fake demo content so you can evaluate the UI.
// Safe to run once after schema.sql + after you've created your account and
// run the site_owner insert from the schema file's bottom comment.
//
// Usage:
//   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... npm run seed
//
// Everything inserted here has an obvious "(demo)" marker so you can find and
// delete it in one pass before you actually start using the site.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ownerEmail = process.env.OWNER_EMAIL!;

if (!url || !serviceKey || !ownerEmail) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and OWNER_EMAIL first.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  const { data: users, error: userErr } = await supabase.auth.admin.listUsers();
  if (userErr) throw userErr;
  const owner = users.users.find((u) => u.email === ownerEmail);
  if (!owner) {
    console.error(`No user with email ${ownerEmail} found. Sign up in the app first.`);
    process.exit(1);
  }
  const owner_id = owner.id;

  await supabase.from('projects').insert({
    owner_id,
    slug: 'demo-personal-site',
    name: '(demo) Personal life OS',
    description: 'A placeholder project so you can see how the Projects page looks. Delete me.',
    status: 'building',
    tools: ['Next.js', 'Supabase', 'Tailwind'],
    visibility: 'public',
    is_featured: true,
  });

  await supabase.from('moments').insert({
    owner_id,
    caption: '(demo) A placeholder moment — delete me',
    occurred_on: new Date().toISOString().slice(0, 10),
    category: 'random',
    visibility: 'public',
    is_featured: true,
  });

  console.log('Seeded demo content. Look for "(demo)" markers and delete them once you\'re ready to go live.');
}

main();
