'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import type { Profile } from '@/types/database';

export async function signUp(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function loginAmd(prevState: unknown, formData: FormData) {
  const password = formData.get('password') as string;
  if (password !== 'tata01') return { error: 'Contraseña incorrecta' };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: 'amd@amdlogistics.app',
    password: 'tata01',
  });

  if (error) return { error: error.message };

  revalidatePath('/', 'layout');
  redirect('/amd');
}

export async function login(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirectTo') as string | null;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');

  if (redirectTo) {
    redirect(redirectTo);
  }

  // Get user's first organization
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: membership } = await (supabase as any)
      .from('organization_members')
      .select('organization:organizations(slug)')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    if (membership?.organization?.slug) {
      redirect(`/${membership.organization.slug}`);
    }
  }

  redirect('/onboarding');
}

export async function forgotPassword(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email') as string;
  if (!email) return { error: 'Ingresá tu email.' };

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function resetPassword(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const password = formData.get('password') as string;
  const confirm = formData.get('confirm') as string;

  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateProfile(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const fullName = formData.get('fullName') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirm = formData.get('confirm') as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  if (newPassword) {
    if (newPassword.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' };
    if (newPassword !== confirm) return { error: 'Las contraseñas no coinciden.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
  }

  if (fullName) {
    const { error } = await supabase.from('profiles').update({ full_name: fullName } as never).eq('id', user.id);
    if (error) return { error: error.message };
  }

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function getUserOrganizations() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberships } = await (supabase as any)
    .from('organization_members')
    .select(`
      role,
      organization:organizations(*)
    `)
    .eq('user_id', user.id);

  return (
    memberships?.map((m: { organization: Record<string, unknown>; role: string }) => ({
      ...m.organization,
      role: m.role,
    })) || []
  );
}
