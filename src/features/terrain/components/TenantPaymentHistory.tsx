'use client';

import type { LandPayment } from '@/types/database';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const METHOD_LABELS: Record<string, string> = { cash: 'Efectivo', transfer: 'Transferencia', check: 'Cheque', card: 'Tarjeta' };

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

function formatDate(d: string) {
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'paid') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Pagado</span>;
  if (status === 'overdue') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">Vencido</span>;
  return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">Pendiente</span>;
}

export function TenantPaymentHistory({ payments }: { payments: LandPayment[] }) {
  if (payments.length === 0) {
    return <div className="text-center py-8 text-muted-foreground text-sm">No hay cobros registrados para este inquilino.</div>;
  }

  const totalPagado = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.paid_amount ?? p.amount), 0);
  const totalPendiente = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/50 border border-border rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Total pagado</p>
          <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPagado)}</p>
        </div>
        <div className="bg-muted/50 border border-border rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Pendiente</p>
          <p className="font-semibold text-yellow-600 dark:text-yellow-400">{formatCurrency(totalPendiente)}</p>
        </div>
        <div className="bg-muted/50 border border-border rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Cobros</p>
          <p className="font-semibold text-foreground">{payments.length}</p>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Periodo</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Vencimiento</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Monto</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Fecha pago</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Método</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Comprobante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{MONTH_NAMES[p.period_month - 1]} {p.period_year}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(p.due_date)}</td>
                <td className="px-4 py-3 text-foreground">
                  <div>{formatCurrency(p.amount)}</div>
                  {p.status === 'paid' && p.paid_amount !== null && p.paid_amount !== p.amount && (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">Recibido: {formatCurrency(p.paid_amount)}</div>
                  )}
                </td>
                <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                <td className="px-4 py-3 text-muted-foreground">{p.paid_date ? formatDate(p.paid_date) : '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.payment_method ? METHOD_LABELS[p.payment_method] : '—'}</td>
                <td className="px-4 py-3">
                  {p.receipt_url ? (
                    <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">Ver</a>
                  ) : <span className="text-muted-foreground/30">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {payments.map((p) => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium text-foreground">{MONTH_NAMES[p.period_month - 1]} {p.period_year}</p>
              <StatusBadge status={p.status} />
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">Monto</span>
              <span className="text-foreground text-right">{formatCurrency(p.amount)}</span>
              <span className="text-muted-foreground">Vence</span>
              <span className="text-muted-foreground text-right">{formatDate(p.due_date)}</span>
              {p.status === 'paid' && (
                <>
                  <span className="text-muted-foreground">Pagó el</span>
                  <span className="text-muted-foreground text-right">{formatDate(p.paid_date!)}</span>
                  {p.payment_method && (
                    <>
                      <span className="text-muted-foreground">Método</span>
                      <span className="text-muted-foreground text-right">{METHOD_LABELS[p.payment_method]}</span>
                    </>
                  )}
                  {p.paid_amount !== null && p.paid_amount !== p.amount && (
                    <>
                      <span className="text-muted-foreground">Recibido</span>
                      <span className="text-emerald-600 dark:text-emerald-400 text-right">{formatCurrency(p.paid_amount)}</span>
                    </>
                  )}
                </>
              )}
            </div>
            {p.receipt_url && (
              <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-primary hover:underline pt-1 border-t border-border">
                Ver comprobante
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
