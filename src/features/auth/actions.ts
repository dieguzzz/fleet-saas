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
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/onboarding');
}

export async function getAmdSetupState(): Promise<{ needsSetup: boolean; email: string | null }> {
  const supabase = await createClient();
  // AMD = sistema de acceso especial con usuario fijo (single-tenant dentro de la org).
  // is_amd_setup / setup_amd_user son RPCs SECURITY DEFINER definidas en la DB.
  // El cast a unknown + Record es necesario porque la RPC no está en los tipos autogenerados.
  const { data } = await (supabase.rpc as unknown as (fn: string) => Promise<{ data: Record<string, unknown> | null }>)('is_amd_setup');
  return {
    needsSetup: (data?.needsSetup as boolean) ?? true,
    email: (data?.email as string) ?? null,
  };
}

export async function setupAmd(prevState: unknown, formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;
  const confirm = formData.get('confirm') as string;

  if (!email || !email.includes('@')) return { error: 'Email invalido' };
  if (!password || password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres' };
  if (password !== confirm) return { error: 'Las contraseñas no coinciden' };

  const supabase = await createClient();
  const { data, error } = await (supabase.rpc as unknown as (fn: string, args: Record<string, string>) => Promise<{ data: Record<string, unknown> | null; error: unknown }>) ('setup_amd_user', {
    p_email: email,
    p_password: password,
  });

  if (error) return { error: error instanceof Error ? error.message : String(error) };
  if (data?.error) return { error: String(data.error) };

  // Sign in con las nuevas credenciales
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: signInError.message };

  revalidatePath('/', 'layout');
  redirect('/amd');
}

export async function loginAmd(prevState: unknown, formData: FormData) {
  const password = formData.get('password') as string;
  if (!password) return { error: 'Ingresá tu contraseña' };

  const supabase = await createClient();
  const { data: state } = await (supabase.rpc as unknown as (fn: string) => Promise<{ data: Record<string, unknown> | null }>)('is_amd_setup');
  const email = state?.email as string | undefined;
  if (!email) return { error: 'Usuario AMD no configurado' };

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: 'Contraseña incorrecta' };

  revalidatePath('/', 'layout');
  redirect('/amd');
}

export async function sendAmdPasswordReset() {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(
    process.env.AMD_AUTH_EMAIL!,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/auth/callback?next=/reset-password`,
    }
  );
  if (error) return { error: error.message };
  return { success: true };
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: memberships } = await supabase
      .from('organization_members')
      .select('organization:organizations(slug)')
      .eq('user_id', user.id);

    const slugs = (memberships ?? []).flatMap((m: any) => {
      const org = Array.isArray(m.organization) ? m.organization[0] : m.organization;
      return org?.slug ? [org.slug] : [];
    }) as string[];

    if (slugs.length === 1) {
      redirect(`/${slugs[0]}`);
    } else if (slugs.length > 1) {
      redirect('/select-org');
    }
  }

  redirect('/onboarding');
}

export async function forgotPassword(prevState: unknown, formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) return { error: 'Ingresá tu email.' };
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/api/auth/callback?next=/reset-password`,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function resetPassword(prevState: unknown, formData: FormData) {
  const password = formData.get('password') as string;
  const confirm = formData.get('confirm') as string;

  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres.' };
  if (password !== confirm) return { error: 'Las contraseñas no coinciden.' };
  const supabase = await createClient();

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

export async function getOrgSetupState(orgSlug: string): Promise<{ exists: boolean; name: string | null; needsSetup: boolean }> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', orgSlug)
    .single();

  if (!org) return { exists: false, name: null, needsSetup: true };

  const { count } = await supabase
    .from('organization_members')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', org.id);

  return { exists: true, name: org.name, needsSetup: (count ?? 0) === 0 };
}

export async function signUpAndJoinOrg(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('fullName') as string;
  const orgSlug = formData.get('orgSlug') as string;
  const confirm = formData.get('confirm') as string;

  if (!email || !password || !fullName || !orgSlug) return { error: 'Faltan campos requeridos' };
  if (password.length < 8) return { error: 'La contraseña debe tener al menos 8 caracteres' };
  if (password !== confirm) return { error: 'Las contraseñas no coinciden' };

  const { error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (signUpError) return { error: signUpError.message };

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: signInError.message };

  const { data: joinResult } = await supabase.rpc('join_org' as never, { p_org_slug: orgSlug } as never);
  const result = joinResult as unknown as { error?: string; slug?: string } | null;
  if (result?.error) return { error: result.error };

  revalidatePath('/', 'layout');
  redirect(`/${orgSlug}`);
}

export async function loginAndJoinOrg(prevState: unknown, formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const orgSlug = formData.get('orgSlug') as string;

  if (!email || !password || !orgSlug) return { error: 'Faltan campos requeridos' };

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return { error: signInError.message };

  const { data: joinResult } = await supabase.rpc('join_org' as never, { p_org_slug: orgSlug } as never);
  const result = joinResult as unknown as { error?: string; slug?: string } | null;
  if (result?.error) return { error: result.error };

  revalidatePath('/', 'layout');
  redirect(`/${orgSlug}`);
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as unknown as Profile | null;
}

export async function getUserOrganizations() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('role, organization:organizations(*)')
    .eq('user_id', user.id);

  return (
    memberships?.map((m: { organization: Record<string, unknown>; role: string }) => ({
      ...m.organization,
      role: m.role,
    })) || []
  );
}
