'use client';

import { useState, useTransition, useActionState } from 'react';
import {
  addRecipeIngredientAction,
  removeRecipeIngredientAction,
  updateRecipeIngredientAction,
  type RecipeCostBreakdown,
} from '../actions';
import type { RecipeIngredient, InventoryItem, Product } from '@/types/database';
import { costPerPortion } from '@/features/products/lib';

type InventoryOption = Pick<InventoryItem, 'id' | 'name' | 'unit' | 'cost_per_unit' | 'category'>;
type SubRecipeOption = Pick<Product, 'id' | 'name' | 'unit' | 'portions'>;

interface RecipeEditorProps {
  productId: string;
  orgSlug: string;
  sellPrice: number;
  targetMargin: number;
  breakdown: RecipeCostBreakdown;
  ingredients: RecipeIngredient[];
  inventoryItems: InventoryOption[];
  subRecipeOptions: SubRecipeOption[];
}

function money(n: number, digits = 2) {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: digits, maximumFractionDigits: digits })}`;
}

function IngredientRow({ ingredient, orgSlug }: { ingredient: RecipeIngredient; orgSlug: string }) {
  const isSub = !!ingredient.sub_recipe_product_id;
  const name = isSub ? (ingredient.sub_recipe?.name ?? '—') : (ingredient.inventory_item?.name ?? '—');
  const unit = isSub ? 'porción' : (ingredient.inventory_item?.unit ?? '');
  const unitCost = isSub
    ? (ingredient.sub_recipe ? costPerPortion(ingredient.sub_recipe as Product) : 0)
    : Number(ingredient.inventory_item?.cost_per_unit ?? 0);
  const subtotal = unitCost * ingredient.quantity;

  const [qty, setQty] = useState(String(ingredient.quantity));
  const [removing, startRemove] = useTransition();
  const [updating, startUpdate] = useTransition();

  function handleBlur() {
    const parsed = parseFloat(qty);
    if (isNaN(parsed) || parsed <= 0 || parsed === ingredient.quantity) {
      setQty(String(ingredient.quantity));
      return;
    }
    startUpdate(async () => { await updateRecipeIngredientAction(ingredient.id, parsed, orgSlug); });
  }

  return (
    <tr className="hover:bg-accent/30 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-foreground">
        <span className="inline-flex items-center gap-2">
          {name}
          {isSub && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">Sub-receta</span>
          )}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={qty}
            onChange={e => setQty(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
            disabled={updating}
            className="field-input w-20 text-right text-sm"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground text-right">
        {unitCost > 0 ? money(unitCost, 4) : '—'}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-foreground text-right">
        {subtotal > 0 ? money(subtotal) : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={() => { if (confirm('¿Eliminar este ítem de la receta?')) startRemove(async () => { await removeRecipeIngredientAction(ingredient.id, orgSlug); }); }}
          disabled={removing}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <svg className="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

function AddIngredientForm({
  productId,
  orgSlug,
  inventoryItems,
  subRecipeOptions,
  existingInventoryIds,
  existingSubRecipeIds,
}: {
  productId: string;
  orgSlug: string;
  inventoryItems: InventoryOption[];
  subRecipeOptions: SubRecipeOption[];
  existingInventoryIds: Set<string>;
  existingSubRecipeIds: Set<string>;
}) {
  const [state, formAction, pending] = useActionState(addRecipeIngredientAction, null);
  const [mode, setMode] = useState<'inventory' | 'subrecipe'>('inventory');

  const availableItems = inventoryItems.filter(i => !existingInventoryIds.has(i.id));
  const availableSubs = subRecipeOptions.filter(s => !existingSubRecipeIds.has(s.id));

  return (
    <form action={formAction} className="space-y-2 rounded-xl border border-dashed border-border p-3">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="product_id" value={productId} />

      <div className="flex gap-1.5">
        {(['inventory', 'subrecipe'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
              mode === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {m === 'inventory' ? 'Ingrediente' : 'Sub-receta'}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        {mode === 'inventory' ? (
          <div className="flex-1 min-w-[180px]">
            <label className="field-label">Ingrediente de inventario</label>
            {availableItems.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1 py-2">No hay más ítems de inventario disponibles.</p>
            ) : (
              <select name="inventory_item_id" required className="field-input text-sm">
                <option value="">Seleccionar...</option>
                {availableItems.map(item => (
                  <option key={item.id} value={item.id}>{item.name} {item.unit ? `(${item.unit})` : ''}</option>
                ))}
              </select>
            )}
          </div>
        ) : (
          <div className="flex-1 min-w-[180px]">
            <label className="field-label">Sub-receta</label>
            {availableSubs.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1 py-2">No hay otras recetas para usar como sub-receta.</p>
            ) : (
              <select name="sub_recipe_product_id" required className="field-input text-sm">
                <option value="">Seleccionar...</option>
                {availableSubs.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="w-24">
          <label className="field-label">{mode === 'subrecipe' ? 'Porciones' : 'Cantidad'}</label>
          <input type="number" name="quantity" step="0.01" min="0.01" defaultValue="1" required className="field-input text-sm" />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {pending ? '...' : '+ Agregar'}
        </button>
      </div>

      {state?.error && <p className="text-xs text-red-500">{state.error}</p>}
    </form>
  );
}

function BreakdownRow({ label, value }: { label: string; value: number }) {
  if (value <= 0) return null;
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground tabular-nums">{money(value)}</span>
    </div>
  );
}

export default function RecipeEditor({
  productId,
  orgSlug,
  sellPrice,
  targetMargin,
  breakdown,
  ingredients,
  inventoryItems,
  subRecipeOptions,
}: RecipeEditorProps) {
  const existingInventoryIds = new Set(
    ingredients.map(i => i.inventory_item_id).filter((id): id is string => id !== null)
  );
  const existingSubRecipeIds = new Set(
    ingredients.map(i => i.sub_recipe_product_id).filter((id): id is string => id !== null)
  );

  // Simulador de precio: margen deseado (editable) y unidades a vender.
  const [margin, setMargin] = useState(String(targetMargin || 40));
  const [units, setUnits] = useState('10');

  const costPerPortion = breakdown.costPerPortion;
  const marginPct = Math.min(Math.max(Number(margin) || 0, 0), 99.9);
  const suggestedPrice = marginPct < 100 ? costPerPortion / (1 - marginPct / 100) : 0;
  const profitPerUnit = suggestedPrice - costPerPortion;
  const unitsNum = Math.max(Number(units) || 0, 0);
  const estRevenue = suggestedPrice * unitsNum;
  const estProfit = profitPerUnit * unitsNum;

  // Margen real al precio de venta actual del producto.
  const currentMarginPct = sellPrice > 0 ? ((sellPrice - costPerPortion) / sellPrice) * 100 : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Ingredientes y sub-recetas</h3>
        <span className="text-xs text-muted-foreground">{ingredients.length} ítem{ingredients.length !== 1 ? 's' : ''}</span>
      </div>

      {ingredients.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Ítem</th>
                  <th className="px-4 py-2.5 text-left">Cantidad</th>
                  <th className="px-4 py-2.5 text-right">Costo unitario</th>
                  <th className="px-4 py-2.5 text-right">Subtotal</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ingredients.map(ing => (
                  <IngredientRow key={ing.id} ingredient={ing} orgSlug={orgSlug} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {ingredients.length === 0 && (
        <div className="py-8 text-center border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">Esta receta no tiene ingredientes aún.</p>
          <p className="text-xs text-muted-foreground mt-1">Agregá ingredientes del inventario o sub-recetas para calcular el costo real.</p>
        </div>
      )}

      <AddIngredientForm
        productId={productId}
        orgSlug={orgSlug}
        inventoryItems={inventoryItems}
        subRecipeOptions={subRecipeOptions}
        existingInventoryIds={existingInventoryIds}
        existingSubRecipeIds={existingSubRecipeIds}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Desglose de costos */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Desglose de costos</h4>
          <BreakdownRow label="Ingredientes" value={breakdown.ingredientsCost} />
          <BreakdownRow label="Sub-recetas" value={breakdown.subRecipesCost} />
          <BreakdownRow label="Embalaje" value={breakdown.packagingCost} />
          <BreakdownRow label="Mano de obra" value={breakdown.laborCost} />
          <BreakdownRow label="Otros costos" value={breakdown.otherCosts} />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm">
            <span className="font-semibold text-foreground">Costo total por receta</span>
            <span className="font-bold text-foreground tabular-nums">{money(breakdown.totalCost)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Costo por porción ({breakdown.portions} porc.)</span>
            <span className="font-semibold text-foreground tabular-nums">{money(costPerPortion)}</span>
          </div>
        </div>

        {/* Precio de venta sugerido + simulador */}
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <h4 className="text-xs font-semibold uppercase text-muted-foreground">Precio de venta</h4>

          <div>
            <label className="field-label">Margen de ganancia deseado (%)</label>
            <input
              type="number" min="0" max="99" step="1"
              value={margin}
              onChange={e => setMargin(e.target.value)}
              className="field-input text-sm"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Precio de venta sugerido</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{money(suggestedPrice)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Ganancia por porción</span>
            <span className="font-semibold text-foreground tabular-nums">{money(profitPerUnit)}</span>
          </div>

          {sellPrice > 0 && (
            <div className="flex items-center justify-between border-t border-border pt-2 text-xs text-muted-foreground">
              <span>Precio actual {money(sellPrice)} → margen</span>
              <span className={`font-semibold ${currentMarginPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {currentMarginPct.toFixed(1)}%
              </span>
            </div>
          )}

          <div className="border-t border-border pt-3">
            <label className="field-label">Simulador — unidades a vender</label>
            <input
              type="number" min="0" step="1"
              value={units}
              onChange={e => setUnits(e.target.value)}
              className="field-input text-sm"
            />
            <div className="mt-2 grid grid-cols-2 gap-2 text-center">
              <div className="rounded-lg bg-muted p-2">
                <p className="text-[11px] text-muted-foreground">Ingresos aprox.</p>
                <p className="text-sm font-bold text-foreground tabular-nums">{money(estRevenue)}</p>
              </div>
              <div className="rounded-lg bg-muted p-2">
                <p className="text-[11px] text-muted-foreground">Ganancia aprox.</p>
                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{money(estProfit)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
