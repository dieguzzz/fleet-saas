'use client';

import { useTransition } from 'react';
import { useConfirm } from '@/components/ui/confirm';
import { deleteTripExpense } from '../actions';

export function TripExpenseDeleteButton({ id, orgId, tripId }: { id: string; orgId: string; tripId: string }) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  async function handleDelete() {
    if (!(await confirm('¿Eliminar este gasto? Esta acción no se puede deshacer.'))) return;
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
