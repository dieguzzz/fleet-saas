'use client';

import { useActionState } from 'react';
import { createContact } from '../actions';
import Link from 'next/link';
import { useFormStatus } from 'react-dom';

const initialState = {
  error: '',
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
    >
      {pending ? 'Guardando...' : 'Guardar Contacto'}
    </button>
  );
}

export default function ContactForm({ orgSlug }: { orgSlug: string }) {
  const [state, formAction] = useActionState(createContact, initialState);

  return (
    <form action={formAction} className="form-card space-y-5 max-w-2xl">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      
      {state?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-slate-700">
            Nombre Completo *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Ej. Juan Pérez"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="role" className="text-sm font-medium text-slate-700">
            Rol / Tipo
          </label>
          <select
            id="role"
            name="role"
            className="field-input"
          >
            <option value="">Seleccionar rol</option>
            <option value="driver">Conductor</option>
            <option value="supplier">Proveedor</option>
            <option value="customer">Cliente</option>
            <option value="mechanic">Mecánico</option>
            <option value="other">Otro</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="company" className="text-sm font-medium text-slate-700">
            Empresa
          </label>
          <input
            id="company"
            name="company"
            type="text"
            placeholder="Ej. Transportes SA"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="juan@ejemplo.com"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-slate-700">
            Teléfono
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+1 234 567 890"
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="text-sm font-medium text-slate-700">
            Dirección
          </label>
          <input
            id="address"
            name="address"
            type="text"
            placeholder="Calle Principal 123"
            className="field-input"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="notes" className="text-sm font-medium text-slate-700">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="field-input"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_emergency"
          name="is_emergency"
          type="checkbox"
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_emergency" className="text-sm font-medium text-slate-700">
          Es contacto de emergencia
        </label>
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Link
          href={`/${orgSlug}/contacts`}
          className="px-6 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </Link>
        <SubmitButton />
      </div>
    </form>
  );
}
