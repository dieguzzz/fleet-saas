'use server';

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resuelve el ID de una organización a partir de su slug.
 * Lanza error si no se encuentra — usar en server actions donde el slug viene del form.
 */
export async function resolveOrgId(
  supabase: SupabaseClient,
  orgSlug: string
): Promise<string> {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!data) throw new Error('Organización no encontrada');
  return data.id;
}

/**
 * Versión que retorna null en lugar de lanzar — útil cuando el módulo
 * necesita manejar el error explícitamente.
 */
export async function tryResolveOrgId(
  supabase: SupabaseClient,
  orgSlug: string
): Promise<string | null> {
  const { data } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  return data?.id ?? null;
}
