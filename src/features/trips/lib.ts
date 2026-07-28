/**
 * Lógica pura del módulo de viajes.
 *
 * Vive fuera de actions.ts a propósito: ese archivo lleva la directiva
 * 'use server', que obliga a que todo export sea una función async. Acá van
 * los helpers sincrónicos, que además pueden importarse desde componentes
 * cliente y testearse sin levantar nada.
 */

/** Formatea una fecha ISO como dd/mm/aaaa. Nunca usar toLocaleDateString: el
 *  locale difiere entre server y browser y rompe la hidratación. */
export function formatTripDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}
