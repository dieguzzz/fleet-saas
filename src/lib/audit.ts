'use server';

import { createClient } from '@/services/supabase/server';

type AuditAction = 'create' | 'update' | 'delete';

interface AuditParams {
  organizationId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  resourceLabel?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit(params: AuditParams): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('audit_logs').insert({
      organization_id: params.organizationId,
      user_id: user?.id ?? null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId ?? null,
      resource_label: params.resourceLabel ?? null,
      metadata: params.metadata ?? {},
    } as never);
    // No rompemos el flujo principal, pero no ocultamos el fallo en silencio.
    if (error) console.error('logAudit insert failed:', error.message);
  } catch (e) {
    console.error('logAudit threw:', e instanceof Error ? e.message : e);
  }
}
