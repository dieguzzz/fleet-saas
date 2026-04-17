'use client';

import type { LandPayment } from '@/types/database';

interface TenantPaymentHistoryProps {
  payments: LandPayment[];
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const METHOD_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  check: 'Cheque',
  card: 'Tarjeta',
};

export function TenantPaymentHistory({ payments }: TenantPaymentHistoryProps) {
  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  function formatDate(dateStr: string) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  const statusBadge = (status: string) => {
    if (status === 'paid') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400">Pagado</span>;
    if (status === 'overdue') return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-400">Vencido</span>;
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-400">Pendiente</span>;
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 text-sm">
        No hay cobros registrados para este inquilino.
      </div>
    );
  }

  const totalPagado = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.paid_amount ?? p.amount), 0);
  const totalPendiente = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Total pagado</p>
          <p className="font-semibold text-emerald-400">{formatCurrency(totalPagado)}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Pendiente</p>
          <p className="font-semibold text-amber-400">{formatCurrency(totalPendiente)}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Cobros</p>
          <p className="font-semibold text-slate-200">{payments.length}</p>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-700/50">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700/50 bg-slate-800/50">
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Periodo</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Vencimiento</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Monto</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Estado</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Fecha pago</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Método</th>
              <th className="text-left px-4 py-3 text-slate-400 font-medium">Comprobante</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-200">
                  {MONTH_NAMES[p.period_month - 1]} {p.period_year}
                </td>
                <td className="px-4 py-3 text-slate-400">{formatDate(p.due_date)}</td>
                <td className="px-4 py-3 text-slate-200">
                  <div>{formatCurrency(p.amount)}</div>
                  {p.status === 'paid' && p.paid_amount !== null && p.paid_amount !== p.amount && (
                    <div className="text-xs text-emerald-400">Recibido: {formatCurrency(p.paid_amount)}</div>
                  )}
                </td>
                <td className="px-4 py-3">{statusBadge(p.status)}</td>
                <td className="px-4 py-3 text-slate-400">
                  {p.paid_date ? formatDate(p.paid_date) : '—'}
                </td>
                <td className="px-4 py-3 text-slate-400">
                  {p.payment_method ? METHOD_LABELS[p.payment_method] : '—'}
                </td>
                <td className="px-4 py-3">
                  {p.receipt_url ? (
                    <a
                      href={p.receipt_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline"
                    >
                      Ver
                    </a>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {payments.map((p) => (
          <div key={p.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium text-slate-200">{MONTH_NAMES[p.period_month - 1]} {p.period_year}</p>
              {statusBadge(p.status)}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-slate-400">Monto</span>
              <span className="text-slate-200 text-right">{formatCurrency(p.amount)}</span>
              <span className="text-slate-400">Vence</span>
              <span className="text-slate-300 text-right">{formatDate(p.due_date)}</span>
              {p.status === 'paid' && (
                <>
                  <span className="text-slate-400">Pagó el</span>
                  <span className="text-slate-300 text-right">{formatDate(p.paid_date!)}</span>
                  {p.payment_method && (
                    <>
                      <span className="text-slate-400">Método</span>
                      <span className="text-slate-300 text-right">{METHOD_LABELS[p.payment_method]}</span>
                    </>
                  )}
                  {p.paid_amount !== null && p.paid_amount !== p.amount && (
                    <>
                      <span className="text-slate-400">Recibido</span>
                      <span className="text-emerald-400 text-right">{formatCurrency(p.paid_amount)}</span>
                    </>
                  )}
                </>
              )}
            </div>
            {p.receipt_url && (
              <a
                href={p.receipt_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-center text-xs text-blue-400 hover:underline pt-1 border-t border-slate-700/40"
              >
                Ver comprobante
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
