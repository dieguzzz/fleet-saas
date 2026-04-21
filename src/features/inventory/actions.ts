'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import { z } from 'zod';
import type { InventoryItem, InventoryMovementType } from '@/types/database';

export type InventoryItemFormState = { error?: string; success?: boolean; id?: string };

const itemSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  category: z.string().min(1, 'La categoría es obligatoria'),
  sku: z.string().optional(),
  current_stock: z.coerce.number().min(0).optional(),
  min_stock_level: z.coerce.number().min(0).optional(),
  unit: z.string().optional(),
  cost_per_unit: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  description: z.string().optional(),
});

async function resolveOrg(supabase: Awaited<ReturnType<typeof createClient>>, orgSlug: string) {
  const { data } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  return data;
}

function parseItemForm(formData: FormData) {
  return {
    name: formData.get('name') as string,
    category: formData.get('category') as string,
    sku: (formData.get('sku') as string) || undefined,
    current_stock: formData.get('current_stock') ? Number(formData.get('current_stock')) : undefined,
    min_stock_level: formData.get('min_stock_level') ? Number(formData.get('min_stock_level')) : undefined,
    unit: (formData.get('unit') as string) || undefined,
    cost_per_unit: formData.get('cost_per_unit') ? Number(formData.get('cost_per_unit')) : undefined,
    location: (formData.get('location') as string) || undefined,
    description: (formData.get('description') as string) || undefined,
  };
}

export async function createInventoryItemAction(
  prevState: InventoryItemFormState,
  formData: FormData
): Promise<InventoryItemFormState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;
  const org = await resolveOrg(supabase, orgSlug);
  if (!org) return { error: 'Organización no encontrada' };

  const validated = itemSchema.safeParse(parseItemForm(formData));
  if (!validated.success) return { error: validated.error.issues[0].message };

  const { data: item, error } = await supabase
    .from('inventory_items')
    .insert({ organization_id: org.id, ...validated.data })
    .select('id')
    .single();

  if (error) return { error: 'Error al crear el ítem' };

  revalidatePath(`/${orgSlug}/inventory/items`);
  return { success: true, id: item?.id };
}

export async function updateInventoryItemAction(
  itemId: string,
  orgSlug: string,
  prevState: InventoryItemFormState,
  formData: FormData
): Promise<InventoryItemFormState> {
  const supabase = await createClient();
  const org = await resolveOrg(supabase, orgSlug);
  if (!org) return { error: 'Organización no encontrada' };

  const validated = itemSchema.safeParse(parseItemForm(formData));
  if (!validated.success) return { error: validated.error.issues[0].message };

  const { current_stock: _, ...updateData } = validated.data;
  const { error } = await supabase
    .from('inventory_items')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .eq('organization_id', org.id);

  if (error) return { error: 'Error al actualizar el ítem' };

  revalidatePath(`/${orgSlug}/inventory/items`);
  return { success: true };
}

export async function deleteInventoryItemAction(itemId: string, orgSlug: string): Promise<void> {
  const supabase = await createClient();
  const org = await resolveOrg(supabase, orgSlug);
  if (!org) return;

  await supabase.from('inventory_items').delete().eq('id', itemId).eq('organization_id', org.id);
  revalidatePath(`/${orgSlug}/inventory/items`);
}

export async function getInventoryItems(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, supplier:contacts(name)')
    .eq('organization_id', orgId)
    .order('name');

  if (error) {
    console.error('Error fetching inventory:', error);
    return { error: error.message };
  }

  return { data: data as InventoryItem[] };
}

export async function getInventoryItem(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inventory_items')
    .select('*, supplier:contacts(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching inventory item:', error);
    return { error: error.message };
  }

  return { data: data as InventoryItem };
}

export async function createInventoryItem(
  prevState: unknown,
  formData: FormData
) {
  const supabase = await createClient();

  const orgSlug = formData.get('orgSlug') as string;

  if (!orgSlug) {
    return { error: 'Organization Slug is missing', success: false };
  }

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (orgError || !org) {
    return { error: 'Organization not found', success: false };
  }

  const orgId = org.id;

  const item = {
    name: formData.get('name') as string,
    sku: formData.get('sku') as string,
    category: formData.get('category') as string,
    location: formData.get('location') as string,
    min_stock_level: Number(formData.get('min_stock_level')),
    unit: formData.get('unit') as string,
    cost_per_unit: Number(formData.get('cost_per_unit')),
    description: formData.get('description') as string,
    current_stock: Number(formData.get('current_stock')),
  };

  const { error } = await supabase
    .from('inventory_items')
    .insert({
      ...item,
      organization_id: orgId,
    });

  if (error) {
    console.error('Error creating inventory item:', error);
    return { error: error.message, success: false };
  }

  revalidatePath(`/${orgSlug}/inventory/items`);
  redirect(`/${orgSlug}/inventory/items`);
}

export async function updateInventoryItem(
  id: string,
  orgId: string,
  item: Partial<Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'current_stock'>>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inventory_items')
    .update(item)
    .eq('id', id)
    .eq('organization_id', orgId)
    .select()
    .single();

  if (error) {
    console.error('Error updating inventory item:', error);
    return { error: error.message };
  }

  revalidatePath('/[orgSlug]/inventory/items', 'page');
  return { data: data as InventoryItem };
}

export async function deleteInventoryItem(id: string, orgId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error deleting inventory item:', error);
    return { error: error.message };
  }

  revalidatePath('/[orgSlug]/inventory/items', 'page');
  return { success: true };
}

export async function recordStockMovement(
  prevState: unknown,
  formData: FormData
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const orgId = formData.get('orgId') as string;
  const itemId = formData.get('itemId') as string;
  const type = formData.get('type') as InventoryMovementType;
  const quantity = Number(formData.get('quantity'));
  const notes = formData.get('notes') as string;

  if (!orgId || !itemId || !type || !quantity) {
    return { error: 'Missing required fields', success: false };
  }

  const { data: item, error: fetchError } = await supabase
    .from('inventory_items')
    .select('current_stock')
    .eq('id', itemId)
    .single();

  if (fetchError || !item) {
    return { error: 'Item not found', success: false };
  }

  const previousStock = item.current_stock || 0;
  let newStock = previousStock;

  if (type === 'in') {
    newStock += quantity;
  } else if (type === 'out') {
    newStock -= quantity;
  } else if (type === 'adjustment') {
    newStock = quantity;
  }

  const { error: movementError } = await supabase
    .from('inventory_movements')
    .insert({
      organization_id: orgId,
      item_id: itemId,
      type,
      quantity,
      previous_stock: previousStock,
      new_stock: newStock,
      notes,
      performed_by: user?.id,
    });

  if (movementError) {
    console.error('Error recording movement:', movementError);
    return { error: movementError.message, success: false };
  }

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ current_stock: newStock })
    .eq('id', itemId);

  if (updateError) {
    return { error: 'Failed to update stock level', success: false };
  }

  revalidatePath('/[orgSlug]/inventory/items', 'page');
  return { success: true, newStock };
}
