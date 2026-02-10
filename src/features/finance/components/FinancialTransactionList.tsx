'use client';

import { useState } from 'react';
import type { FinancialTransaction } from '@/types/database';
import NewFinancialTransactionModal from './NewFinancialTransactionModal';

interface FinancialTransactionListProps {
  transactions: FinancialTransaction[];
  orgId: string;
}

export function FinancialTransactionList({ transactions, orgId }: FinancialTransactionListProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Transacciones Recientes</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Nueva Transacción
          </button>
        </div>
        
        {(!transactions || transactions.length === 0) ? (
          <div className="p-8 text-center text-slate-500 italic">
            No hay transacciones registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Fecha</th>
                  <th className="px-6 py-3">Tipo</th>
                  <th className="px-6 py-3">Categoría</th>
                  <th className="px-6 py-3">Descripción</th>
                  <th className="px-6 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(tx.transaction_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${tx.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {tx.type === 'income' ? 'Ingreso' : 'Gasto'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{tx.category}</div>
                      {tx.subcategory && <div className="text-xs text-gray-400">{tx.subcategory}</div>}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={tx.description || ''}>
                      {tx.description || '-'}
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewFinancialTransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        orgId={orgId} 
      />
    </>
  );
}
