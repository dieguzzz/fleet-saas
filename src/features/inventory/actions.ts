'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/services/supabase/server';
import type { InventoryItem, InventoryMovementType } from '@/types/database';

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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createInventoryItem(
  prevState: unknown,
  formData: FormData
) {
  const supabase = await createClient();

  // Extract orgSlug from hidden field
  const orgSlug = formData.get('orgSlug') as string;

  if (!orgSlug) {
    return { error: 'Organization Slug is missing', success: false };
  }

  // Resolve slug to ID
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

  if (!orgId) {
    return { error: 'Organization ID is missing', success: false };
  }

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

  revalidatePath(`/org/${orgId}/inventory/items`);
  // Redirect handled by client or component logic?
  // Let's return success and let the component redirect or reset.
  // Actually, server actions can redirect.
  // But for useActionState, redirecting is fine.
  
  // We need to import redirect
  const { redirect } = await import('next/navigation');
  redirect(`/${orgId}/inventory/items`);
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

  revalidatePath(`/org/${orgId}/inventory/items`);
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

  revalidatePath(`/org/${orgId}/inventory/items`);
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

  // 1. Get current stock
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

  // 2. Record movement
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

  // 3. Update item stock (if trigger is not enabled, or just to be safe/explicit if trigger is complex)
  // Since we have a trigger in the SQL plan, we might rely on it, but manual update ensures sync return.
  // The SQL trigger `update_inventory_stock` was defined in the plan.
  // Let's rely on the trigger for atomicity if it was created.
  // However, I created `update_inventory_stock` trigger function but did I attach it?
  // Checking `database-schema-expansion.sql`... yes I did.
  // Actually, wait. I commented "NOTE: This simple trigger might conflict..." so maybe I should check if I enabled it.
  // I did include `CREATE OR REPLACE FUNCTION ...` but I did NOT include `CREATE TRIGGER ...` for `inventory_movements` in the applied SQL.
  // I only included triggers for `updated_at`.
  // So I MUST manually update the stock here.

  const { error: updateError } = await supabase
    .from('inventory_items')
    .update({ current_stock: newStock })
    .eq('id', itemId);

  if (updateError) {
     return { error: 'Failed to update stock level', success: false };
  }

  revalidatePath(`/org/${orgId}/inventory/items`);
  return { success: true, newStock };
}
