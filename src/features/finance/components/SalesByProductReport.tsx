'use client';

import { useState, useMemo } from 'react';

interface SalesRow {
  product_id: string | null;
  product_name: string;
  units_sold: number;
  total_revenue: number;
  cost_estimate: number | null;
}

interface SalesByProductReportProps {
  data: SalesRow[];
}

export default function SalesByProductReport({ data }: SalesByProductReportProps) {
  const [sortKey, setSortKey] = useState<'revenue' | 'units'>('revenue');

  const sorted = useMemo(() => {
    return [...data].sort((a, b) =>
      sortKey === 'revenue'
        ? b.total_revenue - a.total_revenue
        : b.units_sold - a.units_sold
    );
  }, [data, sortKey]);

  const totalRevenue = data.reduce((s, r) => s + r.total_revenue, 0);
  const totalUnits = data.reduce((s, r) => s + r.units_sold, 0);

  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">No hay ventas registradas con productos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline gap-6 text-sm">
        <div>
          <span className="text-muted-foreground">Ingresos totales: </span>
          <span className="font-semibold text-foreground">${totalRevenue.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Unidades: </span>
          <span className="font-semibold text-foreground">{totalUnits}</span>
        </div>
        <div className="ml-auto flex gap-1 text-xs">
          <button
            onClick={() => setSortKey('revenue')}
            className={`px-2 py-1 rounded ${sortKey === 'revenue' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Por ingreso
          </button>
          <button
            onClick={() => setSortKey('units')}
            className={`px-2 py-1 rounded ${sortKey === 'units' ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Por unidades
          </button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Producto</th>
                <th className="px-4 py-3 text-right">Unidades</th>
                <th className="px-4 py-3 text-right">Ingreso</th>
                <th className="px-4 py-3 text-right">Costo est.</th>
                <th className="px-4 py-3 text-right">Margen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((row) => {
                const margin = row.cost_estimate != null ? row.total_revenue - row.cost_estimate * row.units_sold : null;
                const marginPct = margin != null && row.total_revenue > 0 ? (margin / row.total_revenue) * 100 : null;
                return (
                  <tr key={row.product_id ?? 'none'} className="hover:bg-accent/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{row.product_name}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{row.units_sold}</td>
                    <td className="px-4 py-3 text-right font-medium text-foreground">${row.total_revenue.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {row.cost_estimate != null ? `$${(row.cost_estimate * row.units_sold).toFixed(2)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {margin != null ? (
                        <span className={margin >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}>
                          ${margin.toFixed(2)} ({marginPct!.toFixed(0)}%)
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
