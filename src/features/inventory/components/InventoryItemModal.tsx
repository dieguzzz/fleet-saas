'use client';

import { useActionState, useEffect, useState } from 'react';
import {
  createInventoryItemAction,
  updateInventoryItemAction,
  type InventoryItemFormState,
} from '../actions';
import { Button } from '@/components/ui/button';
import { INVENTORY_CATEGORY_LABELS, type InventoryItem } from '@/types/database';

const CATEGORIES = Object.entries(INVENTORY_CATEGORY_LABELS) as [string, string][];

interface InventoryItemModalProps {
  orgSlug: string;
  item?: InventoryItem;
  defaultCategory?: string;
  trigger?: React.ReactNode;
}

export default function InventoryItemModal({ orgSlug, item, defaultCategory, trigger }: InventoryItemModalProps) {
  const [open, setOpen] = useState(false);

  const action = item
    ? updateInventoryItemAction.bind(null, item.id, orgSlug)
    : createInventoryItemAction;

  const [state, formAction, isPending] = useActionState(
    async (prev: InventoryItemFormState, fd: FormData) => action(prev, fd),
    {}
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? (
          <Button size="sm" variant="outline">+ Nuevo Ítem</Button>
        )}
      </span>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                {item ? 'Editar ítem' : 'Nuevo ítem de inventario'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold">×</button>
            </div>

            <form action={formAction} className="p-6 space-y-4">
              <input type="hidden" name="orgSlug" value={orgSlug} />

              {state.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm">{state.error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="field-label">Nombre *</label>
                  <input name="name" type="text" required defaultValue={item?.name ?? ''} placeholder="Aceite Sintético 5W-30" className="field-input" />
                </div>

                <div>
                  <label className="field-label">Categoría *</label>
                  <select name="category" required defaultValue={item?.category ?? defaultCategory ?? 'parts'} className="field-input">
                    {CATEGORIES.map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="field-label">SKU / Código</label>
                  <input name="sku" type="text" defaultValue={item?.sku ?? ''} placeholder="OIL-001" className="field-input" />
                </div>

                {!item && (
                  <div>
                    <label className="field-label">Stock Inicial</label>
                    <input name="current_stock" type="number" min="0" defaultValue="0" className="field-input" />
                  </div>
                )}

                <div>
                  <label className="field-label">Stock Mínimo</label>
                  <input name="min_stock_level" type="number" min="0" defaultValue={item?.min_stock_level ?? 5} className="field-input" />
                </div>

                <div>
                  <label className="field-label">Unidad</label>
                  <input name="unit" type="text" defaultValue={item?.unit ?? 'unidades'} placeholder="unidades, litros..." className="field-input" />
                </div>

                <div>
                  <label className="field-label">Costo unitario</label>
                  <input name="cost_per_unit" type="number" min="0" step="0.01" defaultValue={item?.cost_per_unit ?? ''} placeholder="0.00" className="field-input" />
                </div>

                <div>
                  <label className="field-label">Ubicación</label>
                  <input name="location" type="text" defaultValue={item?.location ?? ''} placeholder="Estante A-4" className="field-input" />
                </div>

                <div className="col-span-2">
                  <label className="field-label">Descripción</label>
                  <textarea name="description" rows={2} defaultValue={item?.description ?? ''} className="field-input" />
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? 'Guardando...' : item ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
