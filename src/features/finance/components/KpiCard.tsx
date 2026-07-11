import { formatCurrencyCompact, percentChange } from '@/lib/format';

interface KpiCardProps {
  label: string;
  value: number;
  /** Valor del mes anterior para calcular la variación MoM. */
  previous: number;
  /**
   * Cuando true, un aumento es "malo" (se pinta en rojo) y una baja "buena".
   * Útil para gastos, donde subir no es positivo.
   */
  invertDelta?: boolean;
}

/**
 * Tarjeta KPI con valor destacado y badge de variación vs mes anterior.
 * Presentacional (server component), solo tokens semánticos + pares dark.
 */
export function KpiCard({ label, value, previous, invertDelta = false }: KpiCardProps) {
  const pct = percentChange(value, previous);
  const isUp = pct !== null && pct > 0;
  const isDown = pct !== null && pct < 0;
  // "Bueno" = subió cuando no está invertido, o bajó cuando sí lo está.
  const isGood = pct === null || pct === 0 ? null : invertDelta ? isDown : isUp;

  const badgeClass =
    isGood === null
      ? 'bg-muted text-muted-foreground'
      : isGood
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl font-bold text-foreground tabular-nums">
        {formatCurrencyCompact(value)}
      </span>
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${badgeClass}`}
        >
          {pct === null ? (
            '—'
          ) : (
            <>
              <span aria-hidden>{isUp ? '▲' : isDown ? '▼' : '='}</span>
              {Math.abs(pct).toFixed(0)}%
            </>
          )}
        </span>
        <span className="text-xs text-muted-foreground">vs mes anterior</span>
      </div>
    </div>
  );
}
