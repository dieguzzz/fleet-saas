'use client';

import { useState } from 'react';
import type { TrendPoint } from '@/features/finance/actions';
import { DonutChart, DonutLegend, DONUT_COLORS } from '@/components/ui/donut-chart';
import { formatCurrencyCompact } from '@/lib/format';

/**
 * Panel mensual de donuts para orgs kitchen: ingresos vs gastos y margen de
 * ganancias del mes elegido. Reusa la serie de 6 meses de
 * getDashboardFinanceKPIs (sin queries nuevas) con un selector de mes.
 */
export function FinanceDonuts({ trend }: { trend: TrendPoint[] }) {
  const [idx, setIdx] = useState(Math.max(trend.length - 1, 0));
  const point = trend[idx];

  if (!point) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sin datos para mostrar.</p>;
  }

  const income = point.income;
  const expense = point.expense;
  const net = income - expense;
  const marginPct = income > 0 ? (net / income) * 100 : 0;

  const flowSlices = [
    { name: 'Ingresos', value: Math.max(income, 0), color: DONUT_COLORS.income },
    { name: 'Gastos', value: Math.max(expense, 0), color: DONUT_COLORS.expense },
  ];
  const marginSlices = [
    { name: 'Ganancia', value: Math.max(net, 0), color: DONUT_COLORS.income },
    { name: 'Gastos', value: Math.max(expense, 0), color: DONUT_COLORS.expense },
  ];

  const [year] = point.month.split('-');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-foreground capitalize">{point.label} {year}</span>
        <select
          value={idx}
          onChange={(e) => setIdx(Number(e.target.value))}
          className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="Mes"
        >
          {trend.map((p, i) => {
            const [y] = p.month.split('-');
            return <option key={p.month} value={i} className="capitalize">{p.label} {y}</option>;
          })}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ingresos vs Gastos</p>
          <DonutChart
            data={flowSlices}
            centerTop="Balance"
            centerMain={formatCurrencyCompact(net)}
          />
          <DonutLegend items={flowSlices} />
        </div>

        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Margen de ganancias</p>
          <DonutChart
            data={marginSlices}
            centerTop="Margen"
            centerMain={`${marginPct.toFixed(1)}%`}
          />
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">Ingresos <span className="font-medium text-foreground">{formatCurrencyCompact(income)}</span></span>
            <span className="text-muted-foreground">Ganancia <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrencyCompact(net)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
