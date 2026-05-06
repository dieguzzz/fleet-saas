'use client';

import { useState, useActionState } from 'react';
import { createFinancialTransaction } from '@/features/finance/actions';
import { Button } from '@/components/ui/button';

export default function NewFinancialTransactionModal({
  isOpen,
  onClose,
  orgId,
}: {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
}) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [state, formAction, isPending] = useActionState(createFinancialTransaction, null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-foreground">Registrar Transacción</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">✕</button>
        </div>

        <form action={async (formData) => {
          await formAction(formData);
          if (!state?.error) onClose();
        }} className="space-y-4">
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="type" value={type} />

          {state?.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {state.error}
            </div>
          )}

          <div className="flex gap-2 p-1 bg-muted rounded-lg">
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === 'income' ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Ingreso
            </button>
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                type === 'expense' ? 'bg-destructive text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Gasto
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="amount" className="field-label">Monto *</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-muted-foreground">$</span>
                <input id="amount" name="amount" type="number" step="0.01" min="0" required placeholder="0.00" className="field-input pl-7" />
              </div>
            </div>
            <div>
              <label htmlFor="transaction_date" className="field-label">Fecha *</label>
              <input id="transaction_date" name="transaction_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="field-input" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="field-label">Categoría *</label>
              <input id="category" name="category" type="text" required placeholder="Ej. Ventas, Mantenimiento" className="field-input" />
            </div>
            <div>
              <label htmlFor="subcategory" className="field-label">Subcategoría</label>
              <input id="subcategory" name="subcategory" type="text" placeholder="Ej. Mensualidad" className="field-input" />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="field-label">Descripción</label>
            <textarea id="description" name="description" rows={3} placeholder="Detalles adicionales..." className="field-input" />
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
