'use client';

import { useState, useTransition, useActionState } from 'react';
import { useConfirm } from '@/components/ui/confirm';
import {
  addRecipeIngredientAction,
  removeRecipeIngredientAction,
  updateRecipeIngredientAction,
} from '../actions';
import type { RecipeIngredient, InventoryItem } from '@/types/database';

type InventoryOption = Pick<InventoryItem, 'id' | 'name' | 'unit' | 'cost_per_unit' | 'category'>;

interface RecipeEditorProps {
  productId: string;
  orgSlug: string;
  sellPrice: number;
  ingredients: RecipeIngredient[];
  inventoryItems: InventoryOption[];
}

function IngredientRow({
  ingredient,
  orgSlug,
}: {
  ingredient: RecipeIngredient;
  orgSlug: string;
}) {
  const item = ingredient.inventory_item;
  const unitCost = Number(item?.cost_per_unit ?? 0);
  const subtotal = unitCost * ingredient.quantity;
  const [qty, setQty] = useState(String(ingredient.quantity));
  const [removing, startRemove] = useTransition();
  const confirm = useConfirm();
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
      <td className="px-4 py-3 text-sm font-medium text-foreground">{item?.name ?? '—'}</td>
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
          <span className="text-xs text-muted-foreground">{item?.unit ?? ''}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-muted-foreground text-right">
        {unitCost > 0 ? `$${unitCost.toFixed(2)}` : '—'}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-foreground text-right">
        {subtotal > 0 ? `$${subtotal.toFixed(2)}` : '—'}
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={async () => { if (await confirm('¿Eliminar este ingrediente?')) startRemove(async () => { await removeRecipeIngredientAction(ingredient.id, orgSlug); }); }}
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
  existingIds,
}: {
  productId: string;
  orgSlug: string;
  inventoryItems: InventoryOption[];
  existingIds: Set<string>;
}) {
  const [state, formAction, pending] = useActionState(addRecipeIngredientAction, null);
  const available = inventoryItems.filter(i => !existingIds.has(i.id));

  if (available.length === 0) {
    return <p className="text-xs text-muted-foreground px-1">No hay más ítems de inventario disponibles.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="product_id" value={productId} />

      <div className="flex-1 min-w-[180px]">
        <label className="field-label">Ingrediente</label>
        <select name="inventory_item_id" required className="field-input text-sm">
          <option value="">Seleccionar...</option>
          {available.map(item => (
            <option key={item.id} value={item.id}>
              {item.name} {item.unit ? `(${item.unit})` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="w-24">
        <label className="field-label">Cantidad</label>
        <input
          type="number"
          name="quantity"
          step="0.01"
          min="0.01"
          defaultValue="1"
          required
          className="field-input text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
      >
        {pending ? '...' : '+ Agregar'}
      </button>

      {state?.error && (
        <p className="w-full text-xs text-red-500">{state.error}</p>
      )}
    </form>
  );
}

export default function RecipeEditor({
  productId,
  orgSlug,
  sellPrice,
  ingredients,
  inventoryItems,
}: RecipeEditorProps) {
  const totalCost = ingredients.reduce((sum, ing) => {
    const unitCost = Number(ing.inventory_item?.cost_per_unit ?? 0);
    return sum + unitCost * ing.quantity;
  }, 0);

  const margin = sellPrice > 0 ? sellPrice - totalCost : 0;
  const marginPct = sellPrice > 0 ? (margin / sellPrice) * 100 : 0;
  const existingIds = new Set(ingredients.map(i => i.inventory_item_id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Receta</h3>
        <span className="text-xs text-muted-foreground">{ingredients.length} ingrediente{ingredients.length !== 1 ? 's' : ''}</span>
      </div>

      {ingredients.length > 0 && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
                <tr>
                  <th className="px-4 py-2.5 text-left">Ingrediente</th>
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

      {/* Cost summary */}
      {ingredients.length > 0 && (
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm px-1">
          <div>
            <span className="text-muted-foreground">Costo: </span>
            <span className="font-semibold text-foreground">${totalCost.toFixed(2)}</span>
          </div>
          {sellPrice > 0 && (
            <>
              <div>
                <span className="text-muted-foreground">Precio venta: </span>
                <span className="font-semibold text-foreground">${sellPrice.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Margen: </span>
                <span className={`font-semibold ${margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                  ${margin.toFixed(2)} ({marginPct.toFixed(1)}%)
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {ingredients.length === 0 && (
        <div className="py-8 text-center border border-dashed border-border rounded-xl">
          <p className="text-sm text-muted-foreground">Este producto no tiene receta aún.</p>
          <p className="text-xs text-muted-foreground mt-1">Agregá ingredientes del inventario para calcular el costo real.</p>
        </div>
      )}

      <AddIngredientForm
        productId={productId}
        orgSlug={orgSlug}
        inventoryItems={inventoryItems}
        existingIds={existingIds}
      />
    </div>
  );
}
