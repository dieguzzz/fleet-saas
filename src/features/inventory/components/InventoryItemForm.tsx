'use client';

import { useActionState } from 'react';
import { createInventoryItem } from '@/features/inventory/actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function InventoryItemForm({ orgSlug }: { orgSlug: string }) {
  const [state, formAction, isPending] = useActionState(createInventoryItem, null);

  return (
    <form action={formAction} className="form-card form-section">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      {state?.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="form-grid">
        <div>
          <label htmlFor="name" className="field-label">Nombre del Ítem *</label>
          <input id="name" name="name" type="text" required
            placeholder="Ej. Aceite Sintético 5W-30" className="field-input" />
        </div>

        <div>
          <label htmlFor="sku" className="field-label">SKU / Código</label>
          <input id="sku" name="sku" type="text" placeholder="OIL-5W30-001" className="field-input" />
        </div>

        <div>
          <label htmlFor="category" className="field-label">Categoría</label>
          <select id="category" name="category" className="field-input">
            <option value="parts">Repuestos</option>
            <option value="fluids">Fluidos</option>
            <option value="tires">Neumáticos</option>
            <option value="tools">Herramientas</option>
            <option value="consumables">Consumibles</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label htmlFor="current_stock" className="field-label">Stock Inicial *</label>
          <input id="current_stock" name="current_stock" type="number"
            min="0" defaultValue="0" required className="field-input" />
        </div>

        <div>
          <label htmlFor="min_stock_level" className="field-label">Stock Mínimo (Alerta)</label>
          <input id="min_stock_level" name="min_stock_level" type="number"
            min="0" defaultValue="5" className="field-input" />
        </div>

        <div>
          <label htmlFor="unit" className="field-label">Unidad de Medida</label>
          <input id="unit" name="unit" type="text" defaultValue="unidades"
            placeholder="unidades, litros, cajas" className="field-input" />
        </div>

        <div>
          <label htmlFor="cost_per_unit" className="field-label">Costo Unitario</label>
          <input id="cost_per_unit" name="cost_per_unit" type="number"
            min="0" step="0.01" placeholder="0.00" className="field-input" />
        </div>

        <div>
          <label htmlFor="location" className="field-label">Ubicación en Almacén</label>
          <input id="location" name="location" type="text" placeholder="Estante A-4" className="field-input" />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="description" className="field-label">Descripción</label>
          <textarea id="description" name="description" rows={2} className="field-input" />
        </div>
      </div>

      <div className="form-footer">
        <Button variant="outline" asChild>
          <Link href={`/${orgSlug}/inventory/items`}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Guardar Ítem'}
        </Button>
      </div>
    </form>
  );
}
