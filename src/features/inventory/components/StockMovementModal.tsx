'use client';

import { useState, useActionState } from 'react';
import { recordStockMovement } from '@/features/inventory/actions';
import { Button } from '@/components/ui/button';

const initialState = { error: '', success: false };

export default function StockMovementModal({ isOpen, onClose, orgId, itemId, itemName, currentStock }: {
  isOpen: boolean;
  onClose: () => void;
  orgId: string;
  itemId: string;
  itemName: string;
  currentStock: number;
}) {
  const [type, setType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [state, formAction, isPending] = useActionState(recordStockMovement, initialState);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-foreground">Registrar Movimiento</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 transition-colors">✕</button>
        </div>

        <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
          <p className="text-muted-foreground text-sm">Ítem: <span className="text-foreground font-medium">{itemName}</span></p>
          <p className="text-muted-foreground text-sm">Stock Actual: <span className="text-foreground font-medium">{currentStock}</span></p>
        </div>

        <form action={async (formData) => {
          await formAction(formData);
          if (!state.error) onClose();
        }} className="space-y-4">
          <input type="hidden" name="orgId" value={orgId} />
          <input type="hidden" name="itemId" value={itemId} />
          <input type="hidden" name="type" value={type} />

          {state?.error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg">
              {state.error}
            </div>
          )}

          <div>
            <label className="field-label">Tipo de Movimiento</label>
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
              <button type="button" onClick={() => setType('in')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${type === 'in' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                Entrada
              </button>
              <button type="button" onClick={() => setType('out')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${type === 'out' ? 'bg-destructive text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                Salida
              </button>
              <button type="button" onClick={() => setType('adjustment')} className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${type === 'adjustment' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                Ajuste
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="quantity" className="field-label">Cantidad</label>
            <input id="quantity" name="quantity" type="number" min="1" required className="field-input" />
          </div>

          <div>
            <label htmlFor="notes" className="field-label">Notas / Referencia</label>
            <textarea id="notes" name="notes" rows={2} className="field-input" />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? 'Guardando...' : 'Confirmar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
