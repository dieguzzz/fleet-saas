'use client';

import { useActionState } from 'react';
import { createTripExpense } from '@/features/trips/actions';
import Link from 'next/link';

const initialState = {
  error: '',
  success: false,
};

export default function TripExpenseForm({ orgSlug, tripId }: { orgSlug: string; tripId: string }) {
  const [state, formAction, isPending] = useActionState(createTripExpense, initialState);

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="tripId" value={tripId} />
      
      {state?.error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="category" className="text-sm font-medium text-slate-300">
            Categoría *
          </label>
          <select
            id="category"
            name="category"
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="fuel">Combustible</option>
            <option value="toll">Peaje</option>
            <option value="food">Alimentos</option>
            <option value="lodging">Hospedaje</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium text-slate-300">
            Monto *
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="0"
            step="0.01"
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="currency" className="text-sm font-medium text-slate-300">
            Moneda
          </label>
          <select
            id="currency"
            name="currency"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="MXN">MXN</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="expense_date" className="text-sm font-medium text-slate-300">
            Fecha *
          </label>
          <input
            id="expense_date"
            name="expense_date"
            type="date"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium text-slate-300">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Descripción del gasto..."
          className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Link
          href={`/${orgSlug}/trips/${tripId}`}
          className="px-6 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Registrar Gasto'}
        </button>
      </div>
    </form>
  );
}
