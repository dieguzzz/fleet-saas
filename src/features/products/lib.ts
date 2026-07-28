/**
 * Lógica pura del módulo de productos.
 *
 * Vive fuera de actions.ts a propósito: ese archivo lleva la directiva
 * 'use server', que obliga a que todo export sea una función async. Acá van los
 * helpers sincrónicos, que además se importan desde componentes cliente.
 */

/** Lo mínimo que hace falta para costear una porción. `numeric` de Postgres
 *  llega como string, así que se aceptan las dos formas. */
interface Costeable {
  cost_estimate: number | string | null;
  portions: number | string | null;
}

/**
 * Costo de UNA porción a partir del costo total de la receta.
 *
 * `products.cost_estimate` guarda el costo de la receta entera — es el snapshot
 * que persiste `recomputeAndPersistCost` con el total de `computeBreakdown`. Para
 * compararlo contra `sell_price`, que es por porción, hay que dividirlo primero.
 *
 * Las porciones se fuerzan a un mínimo de 1, igual que en `computeBreakdown`, así
 * un producto sin porciones cargadas no divide por cero ni se va a infinito.
 */
export function costPerPortion(product: Costeable): number {
  const total = Number(product.cost_estimate ?? 0);
  if (!Number.isFinite(total)) return 0;

  const portions = Math.max(Number(product.portions ?? 1) || 1, 1);
  return total / portions;
}
