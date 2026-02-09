'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/services/supabase/server';
import type { Organization } from '@/types/database';

const IMPERSONATION_COOKIE = 'impersonating_org';
const IMPERSONATION_ORG_ID_COOKIE = 'impersonating_org_id';

interface ImpersonationResult {
  success: boolean;
  error?: string;
}

/**
 * Start impersonating an organization (super admin only)
 */
export async function startImpersonation(
  organizationSlug: string
): Promise<ImpersonationResult> {
  const supabase = await createClient();

  // Verify current user is super admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single();

  if (!profile || profile.is_super_admin !== true) {
    return { success: false, error: 'Unauthorized: Super admin access required' };
  }

  // Get organization
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from('organizations')
    .select('id, slug')
    .eq('slug', organizationSlug)
    .single();

  if (!org) {
    return { success: false, error: 'Organization not found' };
  }

  // Log impersonation start
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('impersonation_logs').insert({
    super_admin_id: user.id,
    organization_id: org.id,
    ip_address: null,
    user_agent: null,
  });

  // Set impersonation cookies
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATION_COOKIE, org.slug, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 4, // 4 hours
  });
  cookieStore.set(IMPERSONATION_ORG_ID_COOKIE, org.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 4,
  });

  return { success: true };
}

/**
 * Stop impersonating (super admin only)
 */
export async function stopImpersonation(): Promise<ImpersonationResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const cookieStore = await cookies();
  const impersonatingOrgId = cookieStore.get(IMPERSONATION_ORG_ID_COOKIE)?.value;

  if (impersonatingOrgId) {
    // Update impersonation log with end time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('impersonation_logs')
      .update({ ended_at: new Date().toISOString() })
      .eq('super_admin_id', user.id)
      .eq('organization_id', impersonatingOrgId)
      .is('ended_at', null);
  }

  // Clear cookies
  cookieStore.delete(IMPERSONATION_COOKIE);
  cookieStore.delete(IMPERSONATION_ORG_ID_COOKIE);

  return { success: true };
}

/**
 * Get current impersonation status
 */
export async function getImpersonationStatus(): Promise<{
  isImpersonating: boolean;
  organization: Organization | null;
}> {
  const cookieStore = await cookies();
  const impersonatingSlug = cookieStore.get(IMPERSONATION_COOKIE)?.value;

  if (!impersonatingSlug) {
    return { isImpersonating: false, organization: null };
  }

  const supabase = await createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: org } = await (supabase as any)
    .from('organizations')
    .select('*')
    .eq('slug', impersonatingSlug)
    .single();

  return {
    isImpersonating: true,
    organization: org,
  };
}
