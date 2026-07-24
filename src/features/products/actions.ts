'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { tryResolveOrgId } from '@/lib/org-resolver';
import { logAudit } from '@/lib/audit';
import type { Product, RecipeIngredient, InventoryItem } from '@/types/database';

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
  // Costeo de recetas (kitchen)
  portions: z.coerce.number().positive('Las porciones deben ser mayores a 0').optional(),
  labor_cost: z.coerce.number().min(0).optional(),
  packaging_cost: z.coerce.number().min(0).optional(),
  other_costs: z.coerce.number().min(0).optional(),
  target_margin: z.coerce.number().min(0).max(99.9, 'El margen debe ser menor a 100%').optional(),
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
    is_active: formData.get('is_active') ?? 'false',
    image_url: (formData.get('image_url') as string) || null,
    portions: formData.get('portions') ? Number(formData.get('portions')) : undefined,
    labor_cost: formData.get('labor_cost') ? Number(formData.get('labor_cost')) : undefined,
    packaging_cost: formData.get('packaging_cost') ? Number(formData.get('packaging_cost')) : undefined,
    other_costs: formData.get('other_costs') ? Number(formData.get('other_costs')) : undefined,
    target_margin: formData.get('target_margin') ? Number(formData.get('target_margin')) : undefined,
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
    portions: validated.data.portions ?? 1,
    labor_cost: validated.data.labor_cost ?? 0,
    packaging_cost: validated.data.packaging_cost ?? 0,
    other_costs: validated.data.other_costs ?? 0,
    target_margin: validated.data.target_margin ?? 0,
  });

  if (error) {
    console.error('Error creating product:', error);
    // Exponer la causa real (RLS, constraint, etc.) en vez de un genérico opaco.
    return { error: `No se pudo crear el producto: ${error.message}` };
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

  const isKitchenForm = formData.get('portions') !== null || formData.get('target_margin') !== null;

  const raw = {
    name: formData.get('name') as string,
    description: (formData.get('description') as string) || undefined,
    category: (formData.get('category') as string) || undefined,
    sell_price: formData.get('sell_price') ? Number(formData.get('sell_price')) : undefined,
    cost_estimate: formData.get('cost_estimate') ? Number(formData.get('cost_estimate')) : undefined,
    unit: (formData.get('unit') as string) || undefined,
    is_active: formData.get('is_active') ?? 'false',
    image_url: (formData.get('image_url') as string) || null,
    portions: formData.get('portions') ? Number(formData.get('portions')) : undefined,
    labor_cost: formData.get('labor_cost') ? Number(formData.get('labor_cost')) : undefined,
    packaging_cost: formData.get('packaging_cost') ? Number(formData.get('packaging_cost')) : undefined,
    other_costs: formData.get('other_costs') ? Number(formData.get('other_costs')) : undefined,
    target_margin: formData.get('target_margin') ? Number(formData.get('target_margin')) : undefined,
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
      ...(isKitchenForm ? {
        portions: validated.data.portions ?? 1,
        labor_cost: validated.data.labor_cost ?? 0,
        packaging_cost: validated.data.packaging_cost ?? 0,
        other_costs: validated.data.other_costs ?? 0,
        target_margin: validated.data.target_margin ?? 0,
      } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error updating product:', error);
    return { error: 'Error al actualizar el producto' };
  }

  // Para recetas (kitchen), el costo se deriva de ingredientes + sub-recetas +
  // mano de obra/embalaje/otros. Se persiste en cost_estimate como snapshot.
  if (isKitchenForm) {
    await recomputeAndPersistCost(supabase, orgId, productId);
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

// Recipe Ingredients

export async function getRecipeIngredients(productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('recipe_ingredients')
    .select('*, inventory_item:inventory_items(id, name, unit, cost_per_unit, current_stock), sub_recipe:products!recipe_ingredients_sub_recipe_product_id_fkey(id, name, unit, sell_price, cost_estimate, portions)')
    .eq('product_id', productId)
    .order('created_at');

  if (error) {
    console.error('Error fetching recipe ingredients:', error);
    return { error: error.message };
  }

  return { data: data as unknown as RecipeIngredient[] };
}

export async function getInventoryItemsForRecipe(orgId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('inventory_items')
    .select('id, name, unit, cost_per_unit, category')
    .eq('organization_id', orgId)
    .order('name');

  if (error) return { error: error.message };
  return { data: data as unknown as Pick<InventoryItem, 'id' | 'name' | 'unit' | 'cost_per_unit' | 'category'>[] };
}

/** Productos que pueden usarse como sub-receta de `productId` (activos, excluye el propio). */
export async function getSubRecipeOptionsForRecipe(orgId: string, productId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('products')
    .select('id, name, unit, portions')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .neq('id', productId)
    .order('name');

  if (error) return { error: error.message };
  return { data: (data ?? []) as Pick<Product, 'id' | 'name' | 'unit' | 'portions'>[] };
}

// --- Costeo recursivo de recetas -------------------------------------------

export interface RecipeCostBreakdown {
  ingredientsCost: number;
  subRecipesCost: number;
  packagingCost: number;
  laborCost: number;
  otherCosts: number;
  totalCost: number;
  portions: number;
  costPerPortion: number;
}

const EMPTY_BREAKDOWN: RecipeCostBreakdown = {
  ingredientsCost: 0, subRecipesCost: 0, packagingCost: 0, laborCost: 0,
  otherCosts: 0, totalCost: 0, portions: 1, costPerPortion: 0,
};

/**
 * Costo total y por porción de una receta, sumando ingredientes de inventario,
 * sub-recetas (recursivo, costo por porción × cantidad), embalaje, mano de obra
 * y otros costos. `visited` + `depth` cortan ciclos que la DB no bloquea (el
 * check de auto-referencia solo cubre el nivel directo).
 */
async function computeBreakdown(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  productId: string,
  visited: Set<string>,
  depth: number,
): Promise<RecipeCostBreakdown> {
  if (depth > 6 || visited.has(productId)) return EMPTY_BREAKDOWN;
  visited.add(productId);

  const [{ data: product }, { data: ings }] = await Promise.all([
    supabase
      .from('products')
      .select('portions, labor_cost, packaging_cost, other_costs')
      .eq('id', productId)
      .eq('organization_id', orgId)
      .single(),
    supabase
      .from('recipe_ingredients')
      .select('quantity, inventory_item_id, sub_recipe_product_id, inventory_item:inventory_items(cost_per_unit)')
      .eq('product_id', productId)
      .eq('organization_id', orgId),
  ]);

  if (!product) return EMPTY_BREAKDOWN;

  let ingredientsCost = 0;
  let subRecipesCost = 0;

  for (const ing of (ings ?? []) as unknown as Array<{
    quantity: number;
    inventory_item_id: string | null;
    sub_recipe_product_id: string | null;
    inventory_item?: { cost_per_unit: number | null } | null;
  }>) {
    const qty = Number(ing.quantity) || 0;
    if (ing.inventory_item_id) {
      ingredientsCost += Number(ing.inventory_item?.cost_per_unit ?? 0) * qty;
    } else if (ing.sub_recipe_product_id) {
      const sub = await computeBreakdown(supabase, orgId, ing.sub_recipe_product_id, new Set(visited), depth + 1);
      subRecipesCost += sub.costPerPortion * qty;
    }
  }

  const laborCost = Number(product.labor_cost ?? 0);
  const packagingCost = Number(product.packaging_cost ?? 0);
  const otherCosts = Number(product.other_costs ?? 0);
  const portions = Math.max(Number(product.portions ?? 1) || 1, 1);
  const totalCost = ingredientsCost + subRecipesCost + packagingCost + laborCost + otherCosts;

  return {
    ingredientsCost, subRecipesCost, packagingCost, laborCost, otherCosts,
    totalCost, portions, costPerPortion: totalCost / portions,
  };
}

/** Desglose de costo de una receta (para el editor y la comparación). */
export async function computeRecipeCost(orgId: string, productId: string): Promise<RecipeCostBreakdown> {
  const supabase = await createClient();
  return computeBreakdown(supabase, orgId, productId, new Set(), 0);
}

/** Recalcula el costo de la receta y lo persiste en products.cost_estimate. */
async function recomputeAndPersistCost(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  productId: string,
) {
  const b = await computeBreakdown(supabase, orgId, productId, new Set(), 0);
  await supabase
    .from('products')
    .update({ cost_estimate: b.totalCost })
    .eq('id', productId)
    .eq('organization_id', orgId);
}

/** ¿`targetId` está dentro del árbol de sub-recetas de `rootId`? (para detectar ciclos). */
async function isDescendant(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
  rootId: string,
  targetId: string,
  visited: Set<string> = new Set(),
  depth = 0,
): Promise<boolean> {
  if (depth > 6 || visited.has(rootId)) return false;
  visited.add(rootId);
  const { data: children } = await supabase
    .from('recipe_ingredients')
    .select('sub_recipe_product_id')
    .eq('product_id', rootId)
    .eq('organization_id', orgId)
    .not('sub_recipe_product_id', 'is', null);
  for (const c of children ?? []) {
    const childId = c.sub_recipe_product_id as string | null;
    if (!childId) continue;
    if (childId === targetId) return true;
    if (await isDescendant(supabase, orgId, childId, targetId, visited, depth + 1)) return true;
  }
  return false;
}

/** Productos con su costo calculado (para la comparación de precios). */
export async function getProductsWithCost(orgId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name');

  if (error) return { error: error.message };

  const products = (data ?? []) as Product[];
  const withCost = await Promise.all(
    products.map(async (p) => ({
      product: p,
      cost: await computeBreakdown(supabase, orgId, p.id, new Set(), 0),
    }))
  );
  return { data: withCost };
}

const recipeIngredientSchema = z.object({
  product_id: z.string().uuid(),
  inventory_item_id: z.string().uuid().optional(),
  sub_recipe_product_id: z.string().uuid().optional(),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  notes: z.string().optional(),
}).refine(
  (d) => !!d.inventory_item_id !== !!d.sub_recipe_product_id,
  { message: 'Elegí un ingrediente de inventario o una sub-receta' }
);

export async function addRecipeIngredientAction(
  prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  const orgId = await tryResolveOrgId(supabase, orgSlug);
  if (!orgId) return { error: 'Organización no encontrada' };

  const validated = recipeIngredientSchema.safeParse({
    product_id: formData.get('product_id'),
    inventory_item_id: (formData.get('inventory_item_id') as string) || undefined,
    sub_recipe_product_id: (formData.get('sub_recipe_product_id') as string) || undefined,
    quantity: formData.get('quantity'),
    notes: (formData.get('notes') as string) || undefined,
  });

  if (!validated.success) return { error: validated.error.issues[0].message };
  const { product_id, inventory_item_id, sub_recipe_product_id, quantity, notes } = validated.data;

  // Anti-ciclo: no permitir agregar como sub-receta un producto que ya tiene a
  // este producto dentro de su propio árbol de sub-recetas.
  if (sub_recipe_product_id) {
    if (sub_recipe_product_id === product_id) {
      return { error: 'Una receta no puede ser sub-receta de sí misma' };
    }
    if (await isDescendant(supabase, orgId, sub_recipe_product_id, product_id)) {
      return { error: 'Esa sub-receta generaría un ciclo (ya contiene a esta receta)' };
    }
  }

  const { error } = await supabase.from('recipe_ingredients').insert({
    organization_id: orgId,
    product_id,
    inventory_item_id: inventory_item_id ?? null,
    sub_recipe_product_id: sub_recipe_product_id ?? null,
    quantity,
    notes: notes ?? null,
  });

  if (error) {
    if (error.code === '23505') return { error: 'Este ítem ya está en la receta' };
    console.error('Error adding recipe ingredient:', error);
    return { error: 'Error al agregar ingrediente' };
  }

  await recomputeAndPersistCost(supabase, orgId, product_id);
  revalidatePath(`/${orgSlug}/products`);
  return { success: true };
}

export async function removeRecipeIngredientAction(ingredientId: string, orgSlug: string) {
  const supabase = await createClient();

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) return { error: 'Organización no encontrada' };

  const { data: row } = await supabase
    .from('recipe_ingredients')
    .select('product_id')
    .eq('id', ingredientId)
    .eq('organization_id', org.id)
    .single();

  const { error } = await supabase
    .from('recipe_ingredients')
    .delete()
    .eq('id', ingredientId)
    .eq('organization_id', org.id);

  if (error) {
    console.error('Error removing recipe ingredient:', error);
    return { error: 'Error al eliminar ingrediente' };
  }

  if (row?.product_id) await recomputeAndPersistCost(supabase, org.id, row.product_id);
  revalidatePath(`/${orgSlug}/products`);
  return { success: true };
}

export async function updateRecipeIngredientAction(
  ingredientId: string,
  quantity: number,
  orgSlug: string
) {
  const supabase = await createClient();

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) return { error: 'Organización no encontrada' };

  const { data: row, error } = await supabase
    .from('recipe_ingredients')
    .update({ quantity })
    .eq('id', ingredientId)
    .eq('organization_id', org.id)
    .select('product_id')
    .single();

  if (error) {
    console.error('Error updating recipe ingredient:', error);
    return { error: 'Error al actualizar ingrediente' };
  }

  if (row?.product_id) await recomputeAndPersistCost(supabase, org.id, row.product_id);
  revalidatePath(`/${orgSlug}/products`);
  return { success: true };
}
