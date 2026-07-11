'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { TrendPoint } from '@/features/finance/actions';
import { formatCurrencyCompact } from '@/lib/format';

// Paleta validada (colorblind-safe) para claro y oscuro.
const INCOME_COLOR = '#059669'; // emerald-600
const EXPENSE_COLOR = '#e11d48'; // rose-600

interface TooltipEntry {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string | number;
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium capitalize text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={String(entry.dataKey)} className="flex items-center gap-2 text-sm">
          <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-muted-foreground">{entry.name}</span>
          <span className="ml-auto font-semibold tabular-nums text-foreground">
            {formatCurrencyCompact(Number(entry.value ?? 0))}
          </span>
        </div>
      ))}
    </div>
  );
}

export function FinanceTrendChart({ trend }: { trend: TrendPoint[] }) {
  const isEmpty = trend.every((p) => p.income === 0 && p.expense === 0);

  if (isEmpty) {
    return (
      <div className="flex h-[280px] items-center justify-center text-center">
        <p className="text-sm text-muted-foreground">
          Aún no hay movimientos registrados.
          <br />
          <span className="text-xs">Registra ingresos y gastos para ver la tendencia.</span>
        </p>
      </div>
    );
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trend} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barCategoryGap="24%">
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            className="capitalize"
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={48}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={(v: number) => formatCurrencyCompact(v)}
          />
          <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.4 }} content={<ChartTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={(value) => <span className="text-muted-foreground">{value}</span>}
          />
          <Bar dataKey="income" name="Ingresos" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Gastos" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
