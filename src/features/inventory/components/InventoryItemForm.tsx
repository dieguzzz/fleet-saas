'use client';

import { useActionState } from 'react';
import { createInventoryItem } from '@/features/inventory/actions';
import Link from 'next/link';

const initialState = {
  error: '',
  success: false,
};

export default function InventoryItemForm({ orgSlug }: { orgSlug: string }) {
  const [state, formAction, isPending] = useActionState(createInventoryItem, initialState);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-300">
            Nombre del Ítem *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ej. Aceite Sintético 5W-30"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="sku" className="text-sm font-medium text-slate-300">
            SKU / Código
          </label>
          <input
            id="sku"
            name="sku"
            type="text"
            placeholder="OIL-5W30-001"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-slate-300">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="parts">Repuestos</option>
            <option value="fluids">Fluidos</option>
            <option value="tires">Neumáticos</option>
            <option value="tools">Herramientas</option>
            <option value="consumables">Consumibles</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium text-slate-300">
            Ubicación en Almacén
          </label>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="Estante A-4"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="current_stock" className="text-sm font-medium text-slate-300">
            Stock Inicial *
          </label>
          <input
            id="current_stock"
            name="current_stock"
            type="number"
            min="0"
            defaultValue="0"
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="min_stock_level" className="text-sm font-medium text-slate-300">
            Stock Mínimo (Alerta)
          </label>
          <input
            id="min_stock_level"
            name="min_stock_level"
            type="number"
            min="0"
            defaultValue="5"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="unit" className="text-sm font-medium text-slate-300">
            Unidad de Medida
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            defaultValue="unidades"
            placeholder="unidades, litros, cajas"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="cost_per_unit" className="text-sm font-medium text-slate-300">
            Costo Unitario
          </label>
          <input
            id="cost_per_unit"
            name="cost_per_unit"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium text-slate-300">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Link
          href={`/${orgSlug}/inventory/items`}
          className="px-6 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Guardar Ítem'}
        </button>
      </div>
    </form>
  );
}
