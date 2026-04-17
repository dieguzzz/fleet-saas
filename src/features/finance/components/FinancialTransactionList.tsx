'use client';

import { useState } from 'react';
import type { FinancialTransaction } from '@/types/database';
import NewFinancialTransactionModal from './NewFinancialTransactionModal';

const PAGE_SIZE = 20;

interface FinancialTransactionListProps {
  transactions: FinancialTransaction[];
  orgId: string;
}

function formatDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

export function FinancialTransactionList({ transactions, orgId }: FinancialTransactionListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const paginated = transactions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <div className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-semibold text-foreground">
            Transacciones Recientes
            {transactions.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">({transactions.length})</span>
            )}
          </h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            Nueva Transacción
          </button>
        </div>

        {transactions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground italic">
            No hay transacciones registradas.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="bg-muted/50 font-medium uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Categoría</th>
                    <th className="px-6 py-3">Descripción</th>
                    <th className="px-6 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginated.map((tx) => (
                    <tr key={tx.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(tx.transaction_date)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : 'bg-destructive/10 text-destructive'
                        }`}>
                          {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-foreground font-medium">{tx.category}</div>
                        {tx.subcategory && <div className="text-xs text-muted-foreground">{tx.subcategory}</div>}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={tx.description || ''}>
                        {tx.description || '-'}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${
                        tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'
                      }`}>
                        {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-6 py-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                <span>{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, transactions.length)} de {transactions.length}</span>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="px-3 py-1 rounded border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    ← Anterior
                  </button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="px-3 py-1 rounded border border-border hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <NewFinancialTransactionModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} orgId={orgId} />
    </>
  );
}
