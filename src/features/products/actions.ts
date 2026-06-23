'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { tryResolveOrgId } from '@/lib/org-resolver';
import { logAudit } from '@/lib/audit';
import type { Product } from '@/types/database';

export type ProductFormState = { error?: string; success?: boolean } | null;

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  description: z.string().optional(),
  category: z.string().optional(),
  sell_price: z.coerce.number().min(0, 'El precio debe ser positivo').optional(),
  cost_estimate: z.coerce.number().min(0, 'El costo debe ser positivo').optional(),
  unit: z.string().optional(),
  is_active: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
  image_url: z.string().optional().nullable(),
});

export async function getProducts(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');

  if (error) {
    console.error('Error fetching products:', error);
    return { error: error.message };
  }

  return { data: data as Product[] };
}

export async function getProduct(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return { error: error.message };
  }

  return { data: data as Product };
}

export async function createProductAction(
  prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    sell_price: formData.get('sell_price') ? Number(formData.get('sell_price')) : undefined,
    cost_estimate: formData.get('cost_estimate') ? Number(formData.get('cost_estimate')) : undefined,
    unit: (formData.get('unit') as string) || undefined,
    is_active: formData.get('is_active') ?? 'true',
    image_url: (formData.get('image_url') as string) || null,
  };

  const validated = productSchema.safeParse(raw);
  if (!validated.success) return { error: validated.error.issues[0].message };

  const { error } = await supabase.from('products').insert({
    organization_id: orgId,
    name: validated.data.name,
    description: validated.data.description || null,
    category: validated.data.category || null,
    sell_price: validated.data.sell_price ?? 0,
    cost_estimate: validated.data.cost_estimate ?? 0,
    unit: validated.data.unit || 'unidad',
    is_active: validated.data.is_active ?? true,
    image_url: validated.data.image_url || null,
  });

  if (error) {
    console.error('Error creating product:', error);
    return { error: 'Error al crear el producto' };
  }

  await logAudit({
    organizationId: orgId,
    action: 'create',
    resourceType: 'product',
    resourceLabel: validated.data.name,
  });

  revalidatePath(`/${orgSlug}/products`);
  return { success: true };
}

export async function updateProductAction(
  productId: string,
  orgSlug: string,
  prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const supabase = await createClient();

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    sell_price: formData.get('sell_price') ? Number(formData.get('sell_price')) : undefined,
    cost_estimate: formData.get('cost_estimate') ? Number(formData.get('cost_estimate')) : undefined,
    unit: (formData.get('unit') as string) || undefined,
    is_active: formData.get('is_active') ?? 'true',
    image_url: (formData.get('image_url') as string) || null,
  };

  const validated = productSchema.safeParse(raw);
  if (!validated.success) return { error: validated.error.issues[0].message };

  const { error } = await supabase
    .from('products')
    .update({
      name: validated.data.name,
      description: validated.data.description || null,
      category: validated.data.category || null,
      sell_price: validated.data.sell_price ?? 0,
      cost_estimate: validated.data.cost_estimate ?? 0,
      unit: validated.data.unit || 'unidad',
      is_active: validated.data.is_active ?? true,
      image_url: validated.data.image_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error updating product:', error);
    return { error: 'Error al actualizar el producto' };
  }

  await logAudit({
    organizationId: orgId,
    action: 'update',
    resourceType: 'product',
    resourceId: productId,
    resourceLabel: validated.data.name,
  });

  revalidatePath(`/${orgSlug}/products`);
  return { success: true };
}

export async function deleteProductAction(productId: string, orgSlug: string): Promise<{ error?: string }> {
  const supabase = await createClient();

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error deleting product:', error);
    return { error: 'Error al eliminar el producto' };
  }

  await logAudit({
    organizationId: orgId,
    action: 'delete',
    resourceType: 'product',
    resourceId: productId,
  });

  revalidatePath(`/${orgSlug}/products`);
  return {};
}
