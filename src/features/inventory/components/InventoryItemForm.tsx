'use client';

import { useActionState, useState } from 'react';
import { createInventoryItem } from '@/features/inventory/actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { INVENTORY_CATEGORY_LABELS, type InventoryCategory, type OrgType } from '@/types/database';

const FLEET_CATEGORIES: InventoryCategory[] = ['parts', 'fluids', 'tires', 'tools', 'consumables', 'other'];
const KITCHEN_CATEGORIES: InventoryCategory[] = ['ingredients', 'meats', 'produce', 'spices', 'packaging', 'other'];

export default function InventoryItemForm({ orgSlug, orgType = 'fleet' }: { orgSlug: string; orgType?: OrgType }) {
  const [state, formAction, isPending] = useActionState(createInventoryItem, null);
  const [pkgPrice, setPkgPrice] = useState('');
  const [pkgQty, setPkgQty] = useState('');
  const [costManual, setCostManual] = useState('');
  const derivedCost = orgType === 'kitchen' && Number(pkgPrice) > 0 && Number(pkgQty) > 0 ? Number(pkgPrice) / Number(pkgQty) : null;
  const costValue = derivedCost !== null ? derivedCost.toFixed(4) : costManual;

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
            placeholder={orgType === 'kitchen' ? 'Ej. Harina de trigo' : 'Ej. Aceite Sintético 5W-30'} className="field-input" />
        </div>

        <div>
          <label htmlFor="sku" className="field-label">SKU / Código</label>
          <input id="sku" name="sku" type="text" placeholder={orgType === 'kitchen' ? 'HAR-001' : 'OIL-5W30-001'} className="field-input" />
        </div>

        <div>
          <label htmlFor="category" className="field-label">Categoría</label>
          <select id="category" name="category" className="field-input">
            {(orgType === 'kitchen' ? KITCHEN_CATEGORIES : FLEET_CATEGORIES).map(cat => (
              <option key={cat} value={cat}>{INVENTORY_CATEGORY_LABELS[cat]}</option>
            ))}
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
            placeholder={orgType === 'kitchen' ? 'kg, litros, unidades' : 'unidades, litros, cajas'} className="field-input" />
        </div>

        {orgType === 'kitchen' && (
          <>
            <div>
              <label htmlFor="package_price" className="field-label">Precio por paquete</label>
              <input id="package_price" name="package_price" type="number" min="0" step="0.01"
                value={pkgPrice} onChange={(e) => setPkgPrice(e.target.value)} placeholder="0.00" className="field-input" />
            </div>
            <div>
              <label htmlFor="package_quantity" className="field-label">Cantidad por paquete</label>
              <input id="package_quantity" name="package_quantity" type="number" min="0" step="0.01"
                value={pkgQty} onChange={(e) => setPkgQty(e.target.value)} placeholder="Ej. 2270" className="field-input" />
            </div>
          </>
        )}

        <div>
          <label htmlFor="cost_per_unit" className="field-label">
            Costo Unitario{derivedCost !== null ? ' (calculado)' : ''}
          </label>
          <input id="cost_per_unit" name="cost_per_unit" type="number"
            min="0" step="0.0001" value={costValue} onChange={(e) => setCostManual(e.target.value)}
            readOnly={derivedCost !== null} placeholder="0.00" className="field-input" />
          {derivedCost !== null && (
            <p className="mt-1 text-xs text-muted-foreground">
              {Number(pkgPrice).toFixed(2)} ÷ {Number(pkgQty)} = <span className="font-medium text-foreground">${derivedCost.toFixed(4)}</span> por unidad
            </p>
          )}
        </div>

        <div>
          <label htmlFor="location" className="field-label">Ubicación en Almacén</label>
          <input id="location" name="location" type="text" placeholder={orgType === 'kitchen' ? 'Refrigerador 2' : 'Estante A-4'} className="field-input" />
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
