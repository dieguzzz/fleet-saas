'use client';

import { useState } from 'react';
import { recordStockMovement } from '@/features/inventory/actions';
import { useActionState } from 'react';

const initialState = {
  error: '',
  success: false,
};

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  itemId: string;
  itemName: string;
  currentStock: number;
}

export default function StockMovementModal({
  isOpen,
  onClose,
  orgId,
  itemId,
  itemName,
  currentStock,
}: StockMovementModalProps) {
  const [type, setType] = useState<'in' | 'out' | 'adjustment'>('in');
  
  // Wrapper for server action to include extra args
  // const recordMovementAction = recordStockMovement.bind(null, orgId, itemId, type);
  // We don't need bind anymore as we pass data via hidden fields
  
  const [state, formAction, isPending] = useActionState(recordStockMovement, initialState);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">Registrar Movimiento</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>

        <div className="mb-4">
          <p className="text-slate-400 text-sm">Ítem: <span className="text-white font-medium">{itemName}</span></p>
          <p className="text-slate-400 text-sm">Stock Actual: <span className="text-white font-medium">{currentStock}</span></p>
        </div>

        <form action={async (formData) => {
            // We need to append the state variables that are not inputs
            // Actually, we can just use hidden inputs for them
            await formAction(formData);
            if (!state.error) onClose();
        }} className="space-y-4">
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="type" value={type} />
          
          {state?.error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Tipo de Movimiento</label>
            <div className="flex gap-2 p-1 bg-slate-900 rounded-lg">
              <button
                type="button"
                onClick={() => setType('in')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  type === 'in' ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setType('out')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  type === 'out' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Salida
              </button>
              <button
                type="button"
                onClick={() => setType('adjustment')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  type === 'adjustment' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ajuste
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-300 mb-2">
              Cantidad
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              required
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-2">
              Notas / Referencia
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={2}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isPending ? 'Guardando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
