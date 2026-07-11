import Link from 'next/link';
import { getDashboardFinanceKPIs } from '@/features/finance/actions';
import { SectionCard } from '@/components/ui/section-card';
import { KpiCard } from './KpiCard';
import { FinanceTrendChart } from './FinanceTrendChart';
import { formatCurrencyCompact } from '@/lib/format';

interface BalanceCardProps {
  title: string;
  href: string;
  pending: number;
  overdue: number;
  flowLabel: string; // "Cobrado este mes" / "Pagado este mes"
  flowValue: number;
  flowPrev: number;
}

function BalanceCard({ title, href, pending, overdue, flowLabel, flowValue, flowPrev }: BalanceCardProps) {
  const flowDelta = flowValue - flowPrev;
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <span className="text-xs text-muted-foreground">Ver facturas →</span>
      </div>

      <div>
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {formatCurrencyCompact(pending)}
        </span>
        <span className="ml-2 text-xs text-muted-foreground">pendiente</span>
      </div>

      <div className="flex items-center gap-2">
        {overdue > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            {formatCurrencyCompact(overdue)} vencido
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            Sin vencidos
          </span>
        )}
      </div>

      <div className="border-t border-border pt-2 text-xs text-muted-foreground">
        <span className="text-foreground font-medium tabular-nums">{formatCurrencyCompact(flowValue)}</span>{' '}
        {flowLabel}
        {flowPrev > 0 && (
          <span className="ml-1 tabular-nums">
            ({flowDelta >= 0 ? '+' : '−'}
            {formatCurrencyCompact(Math.abs(flowDelta))} vs mes ant.)
          </span>
        )}
      </div>
    </Link>
  );
}

export async function FinanceOverview({ orgId, orgSlug }: { orgId: string; orgSlug: string }) {
  const kpis = await getDashboardFinanceKPIs(orgId);
  const netCurrent = kpis.monthIncome - kpis.monthExpense;
  const netPrevious = kpis.prevMonthIncome - kpis.prevMonthExpense;

  return (
    <div className="space-y-4">
      {/* Fila de KPIs con comparación vs mes anterior */}
      <SectionCard>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <KpiCard label="Ingresos del mes" value={kpis.monthIncome} previous={kpis.prevMonthIncome} />
          <KpiCard label="Gastos del mes" value={kpis.monthExpense} previous={kpis.prevMonthExpense} invertDelta />
          <KpiCard label="Balance neto" value={netCurrent} previous={netPrevious} />
        </div>
      </SectionCard>

      {/* Estado de cobros y pagos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BalanceCard
          title="Por cobrar"
          href={`/${orgSlug}/finance/invoices?tab=cobros`}
          pending={kpis.receivables.pending}
          overdue={kpis.receivables.overdue}
          flowLabel="cobrado este mes"
          flowValue={kpis.monthIncome}
          flowPrev={kpis.prevMonthIncome}
        />
        <BalanceCard
          title="Por pagar"
          href={`/${orgSlug}/finance/invoices?tab=pagos`}
          pending={kpis.payables.pending}
          overdue={kpis.payables.overdue}
          flowLabel="pagado este mes"
          flowValue={kpis.monthExpense}
          flowPrev={kpis.prevMonthExpense}
        />
      </div>

      {/* Tendencia de 6 meses */}
      <SectionCard
        title="Ingresos vs Gastos (6 meses)"
        action={
          <Link
            href={`/${orgSlug}/finance/transactions`}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Ver transacciones
          </Link>
        }
      >
        <FinanceTrendChart trend={kpis.trend} />
      </SectionCard>
    </div>
  );
}
