'use client';

import { useState, useTransition } from 'react';
import { generateMonthlyPayments, markPaymentPending } from '@/features/terrain/actions';
import { MarkPaidForm } from './MarkPaidForm';
import type { LandPayment, LandTenant } from '@/types/database';
import Link from 'next/link';
import { StaggerList, StaggerItem } from '@/components/ui/motion';

type PaymentWithTenant = LandPayment & {
  tenant?: Pick<LandTenant, 'id' | 'name' | 'equipment_description' | 'phone'>;
};

interface MonthlyPaymentsProps {
  payments: PaymentWithTenant[];
  orgSlug: string;
  orgId: string;
  year: number;
  month: number;
  hasActiveTenants: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const statusBadge = (status: string) => {
  if (status === 'paid')
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Pagado</span>;
  if (status === 'overdue')
    return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">Vencido</span>;
  return <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Pendiente</span>;
};

const methodLabel: Record<string, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  check: 'Cheque',
  card: 'Tarjeta',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

export function MonthlyPayments({ payments, orgSlug, orgId, year, month, hasActiveTenants }: MonthlyPaymentsProps) {
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithTenant | null>(null);
  const [generating, startGenerating] = useTransition();
  const [reverting, startReverting] = useTransition();
  const [generateResult, setGenerateResult] = useState<string | null>(null);

  function handleGenerate() {
    startGenerating(async () => {
      const result = await generateMonthlyPayments(orgSlug, year, month);
      if ('error' in result) {
        setGenerateResult(result.error ?? 'Error desconocido');
      } else {
        setGenerateResult(result.count === 0 ? 'No hay inquilinos activos para generar cobros.' : `Se generaron ${result.count} cobros.`);
      }
    });
  }

  function handleRevertPaid(paymentId: string) {
    if (!confirm('¿Revertir este pago a pendiente?')) return;
    startReverting(() => markPaymentPending(paymentId, orgSlug));
  }

  const totalCobrado = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.paid_amount ?? p.amount), 0);
  const totalPendiente = payments.filter(p => p.status !== 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-muted-foreground">Cobrado: <span className="text-foreground font-medium">{formatCurrency(totalCobrado)}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">Pendiente: <span className="text-foreground font-medium">{formatCurrency(totalPendiente)}</span></span>
          </div>
        </div>
        {hasActiveTenants && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground rounded-lg text-sm font-medium transition-colors"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Generar cobros de {MONTH_NAMES[month - 1]} {year}
              </>
            )}
          </button>
        )}
      </div>

      {generateResult && (
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400">
          {generateResult}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <p className="text-sm">No hay cobros generados para {MONTH_NAMES[month - 1]} {year}.</p>
          {hasActiveTenants && (
            <p className="text-xs mt-1">Usa el botón &quot;Generar cobros&quot; para crear los registros del mes.</p>
          )}
          {!hasActiveTenants && (
            <p className="text-xs mt-1">No hay inquilinos activos. <Link href={`/${orgSlug}/terreno/new`} className="text-blue-600 hover:underline dark:text-blue-400">Agrega uno</Link>.</p>
          )}
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Inquilino</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Equipo</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Monto</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Vencimiento</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                  <th className="text-left px-4 py-3 text-muted-foreground font-medium">Pagó</th>
                  <th className="text-right px-4 py-3 text-muted-foreground font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{p.tenant?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{p.tenant?.equipment_description ?? '—'}</td>
                    <td className="px-4 py-3 text-foreground">
                      <div>{formatCurrency(p.amount)}</div>
                      {p.status === 'paid' && p.paid_amount !== null && p.paid_amount !== p.amount && (
                        <div className="text-xs text-emerald-600 dark:text-emerald-400">Recibido: {formatCurrency(p.paid_amount)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(p.due_date)}</td>
                    <td className="px-4 py-3">{statusBadge(p.status)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {p.status === 'paid' ? (
                        <div>
                          <div>{formatDate(p.paid_date!)}</div>
                          <div className="text-muted-foreground/60">{p.payment_method ? methodLabel[p.payment_method] : ''}</div>
                          {p.receipt_url && (
                            <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
                              Ver comprobante
                            </a>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {p.status !== 'paid' ? (
                          <button
                            onClick={() => setSelectedPayment(p)}
                            className="px-3 py-1.5 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-lg transition-colors"
                          >
                            Marcar pagado
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRevertPaid(p.id)}
                            disabled={reverting}
                            className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
                          >
                            Revertir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <StaggerList className="md:hidden space-y-3">
            {payments.map((p) => (
              <StaggerItem key={p.id}>
                <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-foreground">{p.tenant?.name ?? '—'}</p>
                      {p.tenant?.equipment_description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.tenant.equipment_description}</p>
                      )}
                    </div>
                    {statusBadge(p.status)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Monto</span>
                    <span className="font-medium text-foreground">{formatCurrency(p.amount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Vence</span>
                    <span className="text-foreground">{formatDate(p.due_date)}</span>
                  </div>
                  {p.status === 'paid' && (
                    <div className="space-y-1 text-sm border-t border-border pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pagó el</span>
                        <span className="text-foreground">{formatDate(p.paid_date!)}</span>
                      </div>
                      {p.payment_method && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Método</span>
                          <span className="text-foreground">{methodLabel[p.payment_method]}</span>
                        </div>
                      )}
                      {p.receipt_url && (
                        <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" className="block text-center text-xs text-blue-600 hover:underline dark:text-blue-400 pt-1">
                          Ver comprobante
                        </a>
                      )}
                    </div>
                  )}
                  <div className="pt-1">
                    {p.status !== 'paid' ? (
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="w-full py-2 text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400 rounded-lg transition-colors"
                      >
                        Marcar como pagado
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRevertPaid(p.id)}
                        disabled={reverting}
                        className="w-full py-2 text-xs bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors"
                      >
                        Revertir a pendiente
                      </button>
                    )}
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        </>
      )}

      {selectedPayment && (
        <MarkPaidForm
          payment={selectedPayment}
          orgSlug={orgSlug}
          orgId={orgId}
          onClose={() => setSelectedPayment(null)}
        />
      )}
    </div>
  );
}
