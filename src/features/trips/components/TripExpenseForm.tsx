'use client';

import { useActionState } from 'react';
import { createTripExpense } from '@/features/trips/actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const initialState = {
  error: '',
  success: false,
};

export default function TripExpenseForm({ orgSlug, tripId }: { orgSlug: string; tripId: string }) {
  const [state, formAction, isPending] = useActionState(createTripExpense, initialState);

  return (
    <form action={formAction} className="form-card form-section">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="tripId" value={tripId} />

      {state?.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="form-grid">
        <div>
          <label htmlFor="category" className="field-label">Categoría *</label>
          <select id="category" name="category" required className="field-input">
            <option value="fuel">Combustible</option>
            <option value="toll">Peaje</option>
            <option value="food">Alimentos</option>
            <option value="lodging">Hospedaje</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div>
          <label htmlFor="amount" className="field-label">Monto *</label>
          <input id="amount" name="amount" type="number" min="0" step="0.01" required className="field-input" />
        </div>

        <div>
          <label htmlFor="currency" className="field-label">Moneda</label>
          <select id="currency" name="currency" className="field-input">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="MXN">MXN</option>
          </select>
        </div>

        <div>
          <label htmlFor="expense_date" className="field-label">Fecha *</label>
          <input id="expense_date" name="expense_date" type="date" required
            defaultValue={new Date().toISOString().split('T')[0]} className="field-input" />
        </div>

        <div className="sm:col-span-2 lg:col-span-3">
          <label htmlFor="notes" className="field-label">Notas</label>
          <textarea id="notes" name="notes" rows={2} placeholder="Descripción del gasto..." className="field-input" />
        </div>
      </div>

      <div className="form-footer">
        <Button variant="outline" asChild>
          <Link href={`/${orgSlug}/trips/${tripId}`}>Cancelar</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Guardando...' : 'Registrar Gasto'}
        </Button>
      </div>
    </form>
  );
}
