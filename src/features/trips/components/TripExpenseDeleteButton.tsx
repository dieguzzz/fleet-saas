'use client';

import { useTransition } from 'react';
import { deleteTripExpense } from '../actions';

export function TripExpenseDeleteButton({ id, orgId, tripId }: { id: string; orgId: string; tripId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm('¿Eliminar este gasto? Esta acción no se puede deshacer.')) return;
    startTransition(() => { deleteTripExpense(id, orgId, tripId); });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs text-destructive hover:text-destructive/80 font-medium disabled:opacity-50"
    >
      Eliminar
    </button>
  );
}
