'use client';

import { CONTACT_ROLE_LABELS } from '@/types/database';

// Los dos grupos que ya usaba el <select> de rol único, conservados para que
// la lista larga siga siendo navegable.
const GRUPOS: { titulo: string; roles: string[] }[] = [
  { titulo: 'Facturación', roles: ['customer', 'supplier'] },
  {
    titulo: 'Servicios',
    roles: ['mechanic', 'workshop', 'tow_truck', 'tire_service', 'insurance', 'driver', 'other'],
  },
];

interface ContactRolesFieldProps {
  defaultRoles?: string[];
}

/**
 * Selector de roles de un contacto. Reemplaza al <select> de rol único: un
 * contacto puede ser cliente y proveedor a la vez.
 *
 * Todos los checkboxes comparten name="roles" — el FormData los entrega como
 * entradas repetidas y parseRoles las junta.
 */
export function ContactRolesField({ defaultRoles = [] }: ContactRolesFieldProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="field-label">Roles *</legend>
      <p className="text-xs text-muted-foreground">
        Elegí todos los que correspondan. Un mismo contacto puede ser cliente y proveedor.
      </p>

      {GRUPOS.map((grupo) => (
        <div key={grupo.titulo} className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {grupo.titulo}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {grupo.roles.map((rol) => (
              <label key={rol} className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  name="roles"
                  value={rol}
                  defaultChecked={defaultRoles.includes(rol)}
                  className="size-4 accent-primary"
                />
                {CONTACT_ROLE_LABELS[rol] ?? rol}
              </label>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
