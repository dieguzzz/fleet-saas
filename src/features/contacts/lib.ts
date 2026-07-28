import { CONTACT_ROLE_LABELS, type Contact, type ContactRole } from '@/types/database';

/**
 * Lógica pura de roles de contacto.
 *
 * Vive fuera de actions.ts a propósito: ese archivo lleva 'use server', que
 * obliga a que todo export sea una función async. Acá van los helpers
 * sincrónicos, que además se importan desde componentes cliente.
 */

type WithRoles = Pick<Contact, 'roles'>;

export function hasRole(contact: WithRoles, role: ContactRole): boolean {
  return contact.roles.includes(role);
}

/** True si el contacto tiene al menos uno de los roles buscados. */
export function hasAnyRole(contact: WithRoles, roles: readonly string[]): boolean {
  return contact.roles.some((r) => roles.includes(r));
}

/** Etiquetas legibles de todos los roles del contacto, en el orden en que están. */
export function roleLabels(contact: WithRoles): string[] {
  return contact.roles.map((r) => CONTACT_ROLE_LABELS[r] ?? r);
}

/**
 * Lee los roles del FormData. Vienen como entradas repetidas con name="roles",
 * una por checkbox marcado. Recorta, descarta vacíos y deduplica.
 */
export function parseRoles(formData: FormData): string[] {
  const raw = formData.getAll('roles');
  const limpios = raw
    .flatMap((v) => (typeof v === 'string' ? [v.trim()] : []))
    .filter(Boolean);
  return [...new Set(limpios)];
}
