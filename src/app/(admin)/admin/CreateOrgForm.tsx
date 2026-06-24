'use client';

import { useActionState } from 'react';
import { createOrganizationAsAdmin, type CreateOrgAdminState } from '@/features/organizations/actions';

export function CreateOrgForm() {
  const [state, formAction, isPending] = useActionState<CreateOrgAdminState, FormData>(
    createOrganizationAsAdmin,
    null
  );

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Crear Organización</h2>

      {state?.success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
          Organización creada exitosamente.
        </div>
      )}

      {state?.error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label htmlFor="admin-org-name" className="block text-xs font-medium text-muted-foreground mb-1">
            Nombre
          </label>
          <input
            id="admin-org-name"
            name="name"
            type="text"
            required
            placeholder="Mi Empresa"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="w-[140px]">
          <label htmlFor="admin-org-slug" className="block text-xs font-medium text-muted-foreground mb-1">
            Slug
          </label>
          <input
            id="admin-org-slug"
            name="slug"
            type="text"
            placeholder="mi-empresa"
            pattern="[a-z0-9\-]+"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <div className="w-[120px]">
          <label htmlFor="admin-org-type" className="block text-xs font-medium text-muted-foreground mb-1">
            Tipo
          </label>
          <select
            id="admin-org-type"
            name="org_type"
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="fleet">Flota</option>
            <option value="kitchen">Cocina</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPending ? 'Creando…' : 'Crear'}
        </button>
      </form>
    </div>
  );
}
