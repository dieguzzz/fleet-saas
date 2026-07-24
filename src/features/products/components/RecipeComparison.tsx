'use client';

import type { Product } from '@/types/database';
import type { RecipeCostBreakdown } from '../actions';
import { DonutChart, DonutLegend, DONUT_COLORS } from '@/components/ui/donut-chart';

interface ComparisonItem {
  product: Product;
  cost: RecipeCostBreakdown;
}

function money(n: number) {
  return `$${n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function RecipeCard({ item }: { item: ComparisonItem }) {
  const sellPrice = Number(item.product.sell_price ?? 0);
  const costPerPortion = item.cost.costPerPortion;
  const profit = sellPrice - costPerPortion;
  const marginPct = sellPrice > 0 ? (profit / sellPrice) * 100 : 0;

  const slices = [
    { name: 'Costo de producción', value: Math.max(costPerPortion, 0), color: DONUT_COLORS.expense },
    { name: 'Ganancia', value: Math.max(profit, 0), color: DONUT_COLORS.income },
  ];

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2">{item.product.name}</h3>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
          marginPct >= 0
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {marginPct.toFixed(1)}%
        </span>
      </div>

      <div className="flex items-center gap-4">
        <DonutChart
          data={slices}
          size={120}
          thickness={16}
          centerTop="Margen"
          centerMain={`${marginPct.toFixed(0)}%`}
        />
        <dl className="flex-1 space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Precio de venta</dt>
            <dd className="font-semibold text-foreground tabular-nums">{money(sellPrice)}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">Costo por porción</dt>
            <dd className="font-medium text-foreground tabular-nums">{money(costPerPortion)}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-1.5">
            <dt className="text-muted-foreground">Ganancia por porción</dt>
            <dd className={`font-semibold tabular-nums ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {money(profit)}
            </dd>
          </div>
        </dl>
      </div>

      <DonutLegend items={slices} />
    </div>
  );
}

export default function RecipeComparison({ items }: { items: ComparisonItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-12 text-center">
        <p className="text-sm text-muted-foreground">No hay recetas activas para comparar.</p>
        <p className="text-xs text-muted-foreground mt-1">Crea productos con receta para ver la comparación de precios.</p>
      </div>
    );
  }

  // Orden por margen descendente para destacar las más rentables.
  const sorted = [...items].sort((a, b) => {
    const ma = Number(a.product.sell_price ?? 0) > 0 ? (Number(a.product.sell_price) - a.cost.costPerPortion) / Number(a.product.sell_price) : -Infinity;
    const mb = Number(b.product.sell_price ?? 0) > 0 ? (Number(b.product.sell_price) - b.cost.costPerPortion) / Number(b.product.sell_price) : -Infinity;
    return mb - ma;
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((item) => (
        <RecipeCard key={item.product.id} item={item} />
      ))}
    </div>
  );
}
