'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function signIn(formData: FormData) {
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  // Where to send the user after a successful sign-in. Set by the login page
  // from ?next=, which the middleware attaches whenever it bounces someone
  // from a protected route. Only ever a same-site path — never an absolute
  // URL — so this can't be used to redirect off-site.
  const rawNext = String(formData.get('next') || '/private');
  const next = rawNext.startsWith('/') ? rawNext : '/private';

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(error.message)}`);
  }
  redirect(next);
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get('email') || '');
  const supabase = createClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/callback?next=/private/settings`,
  });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect('/login?reset=sent');
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get('password') || '');
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    redirect(`/private/settings?error=${encodeURIComponent(error.message)}`);
  }
  redirect('/private/settings?updated=1');
}
export async function signUp(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    redirect('/signup?error=Email%20and%20password%20are%20required');
  }

  if (password.length < 6) {
    redirect('/signup?error=Password%20must%20be%20at%20least%206%20characters');
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect('/signup?success=check-email');
}