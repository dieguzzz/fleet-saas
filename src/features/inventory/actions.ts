'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/services/supabase/server';
import type { InventoryItem, InventoryMovement, InventoryMovementType } from '@/types/database';

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
  orgId: string,
  item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at' | 'supplier' | 'current_stock'>
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inventory_items')
    .insert({
      ...item,
      organization_id: orgId,
      current_stock: 0, // Initial stock is 0, must be adjusted via movement
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating inventory item:', error);
    return { error: error.message };
  }

  revalidatePath(`/org/${orgId}/inventory/items`);
  return { data: data as InventoryItem };
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
  orgId: string,
  itemId: string,
  type: InventoryMovementType,
  quantity: number,
  notes?: string
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. Get current stock
  const { data: item, error: fetchError } = await supabase
    .from('inventory_items')
    .select('current_stock')
    .eq('id', itemId)
    .single();

  if (fetchError || !item) {
    return { error: 'Item not found' };
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
    return { error: movementError.message };
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
     return { error: 'Failed to update stock level' };
  }

  revalidatePath(`/org/${orgId}/inventory/items`);
  return { success: true, newStock };
}
