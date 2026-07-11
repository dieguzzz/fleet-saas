// Utilidades de formato compartidas.

/**
 * Formatea un monto como moneda compacta (ej. $1.2M, $45.3k, $980).
 * Usado en tarjetas KPI y widgets donde el espacio es limitado.
 */
export function formatCurrencyCompact(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}k`;
  return `${sign}$${abs.toFixed(0)}`;
}

/**
 * Formatea un monto como moneda completa con separadores de miles (ej. $1,234.50).
 */
export function formatCurrency(n: number): string {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Calcula la variación porcentual de `current` respecto a `previous`.
 * Retorna null cuando no se puede calcular una variación significativa
 * (mes anterior en cero): en ese caso el consumidor debe mostrar "—" o "nuevo".
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}
