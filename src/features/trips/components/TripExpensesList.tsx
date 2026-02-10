import Link from 'next/link';
import { getTripExpenses } from '../actions';

interface TripExpensesListProps {
  tripId: string;
  orgId: string;
  orgSlug: string;
}

export async function TripExpensesList({ tripId, orgId, orgSlug }: TripExpensesListProps) {
  const { data: expenses, error } = await getTripExpenses(tripId);

  if (error) {
    return <div className="text-red-500">Error cargando gastos: {error}</div>;
  }

  const totalExpenses = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <h3 className="text-md font-semibold text-gray-800">Gastos del Viaje</h3>
        <Link
          href={`/${orgSlug}/trips/${tripId}/expenses/new`}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-700 transition-colors"
        >
          Agregar Gasto
        </Link>
      </div>
      
      {!expenses || expenses.length === 0 ? (
        <div className="p-6 text-center text-gray-500 text-sm">
          No hay gastos registrados para este viaje.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Categoría</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Notas</th>
                <th className="px-6 py-3 text-right">Monto</th>
                <th className="px-6 py-3 text-center">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-gray-900 capitalize">{expense.category.replace('_', ' ')}</td>
                  <td className="px-6 py-3">
                    {expense.expense_date ? new Date(expense.expense_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-3 truncate max-w-xs">{expense.notes || '-'}</td>
                  <td className="px-6 py-3 text-right font-medium">
                    ${Number(expense.amount).toFixed(2)} <span className="text-xs text-gray-400">{expense.currency}</span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {expense.receipt_url ? (
                      <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs">
                        Ver
                      </a>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold text-gray-900">
                <td colSpan={3} className="px-6 py-3 text-right">Total:</td>
                <td className="px-6 py-3 text-right">${totalExpenses.toFixed(2)}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
