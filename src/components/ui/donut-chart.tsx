'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

// Paleta consistente con FinanceTrendChart (colorblind-safe).
export const DONUT_COLORS = {
  income: '#059669', // emerald-600 — ingresos / ganancia
  expense: '#e11d48', // rose-600 — gastos / costo
  neutral: '#64748b', // slate-500
};

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerTop?: string;
  centerMain?: string;
}

/**
 * Donut reutilizable (recharts). Muestra un contenido central opcional y
 * es theme-aware vía tokens. Si el total es 0 renderiza un anillo tenue.
 */
export function DonutChart({ data, size = 160, thickness = 22, centerTop, centerMain }: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const slices: DonutSlice[] = total > 0 ? data : [{ name: 'Sin datos', value: 1, color: 'var(--muted)' }];

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={slices}
            dataKey="value"
            innerRadius={size / 2 - thickness}
            outerRadius={size / 2 - 2}
            paddingAngle={total > 0 ? 2 : 0}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            {slices.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      {(centerTop || centerMain) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerTop && <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{centerTop}</span>}
          {centerMain && <span className="text-sm font-bold tabular-nums text-foreground">{centerMain}</span>}
        </div>
      )}
    </div>
  );
}

export function DonutLegend({ items }: { items: DonutSlice[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {items.map((it) => (
        <div key={it.name} className="flex items-center gap-1.5 text-xs">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: it.color }} />
          <span className="text-muted-foreground">{it.name}</span>
        </div>
      ))}
    </div>
  );
}
