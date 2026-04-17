import Link from 'next/link';
import { getTripExpenses } from '../actions';

function formatDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-');
  return `${day}/${m}/${y}`;
}

export async function TripExpensesList({ tripId, orgId, orgSlug }: { tripId: string; orgId: string; orgSlug: string }) {
  const { data: expenses, error } = await getTripExpenses(tripId);

  if (error) {
    return <div className="text-destructive text-sm">Error cargando gastos: {error}</div>;
  }

  const totalExpenses = expenses?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mt-6">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <h3 className="text-base font-semibold text-foreground">Gastos del Viaje</h3>
        <Link
          href={`/${orgSlug}/trips/${tripId}/expenses/new`}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs hover:bg-primary/90 transition-colors"
        >
          Agregar Gasto
        </Link>
      </div>

      {!expenses || expenses.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground text-sm">
          No hay gastos registrados para este viaje.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-muted-foreground">
            <thead className="bg-muted/50 font-medium uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Categoría</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Notas</th>
                <th className="px-6 py-3 text-right">Monto</th>
                <th className="px-6 py-3 text-center">Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-6 py-3 font-medium text-foreground capitalize">{expense.category.replace('_', ' ')}</td>
                  <td className="px-6 py-3">{expense.expense_date ? formatDate(expense.expense_date) : '-'}</td>
                  <td className="px-6 py-3 truncate max-w-xs">{expense.notes || '-'}</td>
                  <td className="px-6 py-3 text-right font-medium text-foreground">
                    ${Number(expense.amount).toFixed(2)} <span className="text-xs text-muted-foreground">{expense.currency}</span>
                  </td>
                  <td className="px-6 py-3 text-center">
                    {expense.receipt_url ? (
                      <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs">Ver</a>
                    ) : (
                      <span className="text-muted-foreground/30">-</span>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-muted/30 font-semibold text-foreground">
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
