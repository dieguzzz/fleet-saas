'use client';

import { useActionState } from 'react';
import { createContact } from '../actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';

const initialState = { error: '', success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} >
      {pending ? 'Guardando...' : 'Guardar Contacto'}
    </Button>
  );
}

export default function ContactForm({ orgSlug }: { orgSlug: string }) {
  const [state, formAction] = useActionState(createContact, initialState);

  return (
    <form action={formAction} className="form-card space-y-5">
      <input type="hidden" name="orgSlug" value={orgSlug} />

      {state?.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="field-label">Nombre Completo *</label>
          <input id="name" name="name" type="text" required placeholder="Ej. Juan Pérez" className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="field-label">Rol / Tipo</label>
          <select id="role" name="role" className="field-input">
            <option value="">Seleccionar rol</option>
            <option value="driver">Conductor</option>
            <option value="supplier">Proveedor</option>
            <option value="customer">Cliente</option>
            <option value="mechanic">Mecánico</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="company" className="field-label">Empresa</label>
          <input id="company" name="company" type="text" placeholder="Ej. Transportes SA" className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="field-label">Email</label>
          <input id="email" name="email" type="email" placeholder="juan@ejemplo.com" className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="field-label">Teléfono</label>
          <input id="phone" name="phone" type="tel" placeholder="+1 234 567 890" className="field-input" />
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="field-label">Dirección</label>
          <input id="address" name="address" type="text" placeholder="Calle Principal 123" className="field-input" />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="field-label">Notas</label>
        <textarea id="notes" name="notes" rows={3} className="field-input" />
      </div>

      <div className="flex items-center gap-2">
        <input id="is_emergency" name="is_emergency" type="checkbox"
          className="w-4 h-4 text-blue-600 border-input rounded focus:ring-blue-500" />
        <label htmlFor="is_emergency" className="text-sm font-medium text-foreground">
          Es contacto de emergencia
        </label>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Button variant="outline" asChild>
          <Link href={`/${orgSlug}/contacts`}>Cancelar</Link>
        </Button>
        <SubmitButton />
      </div>
    </form>
  );
}
