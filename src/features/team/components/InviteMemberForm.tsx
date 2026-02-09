'use client';

import { useActionState } from 'react';
import { inviteMember } from '../actions';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
    >
      {pending ? 'Enviando...' : 'Invitar'}
    </button>
  );
}

const initialState = {
  error: '',
  success: false,
};

export default function InviteMemberForm({ orgSlug }: { orgSlug: string }) {
  const [state, formAction] = useActionState(inviteMember, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
      <input type="hidden" name="orgSlug" value={orgSlug} />
      
      <div className="flex-1 w-full sm:w-auto space-y-1">
        <label htmlFor="email" className="text-xs font-medium text-slate-500 uppercase">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="colaborador@ejemplo.com"
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      <div className="w-full sm:w-40 space-y-1">
        <label htmlFor="role" className="text-xs font-medium text-slate-500 uppercase">Rol</label>
        <select
          id="role"
          name="role"
          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        >
          <option value="viewer">Observador</option>
          <option value="collaborator">Colaborador</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <SubmitButton />
      </div>

      {state?.error && (
        <div className="text-red-500 text-sm mt-2 sm:mt-0 self-center">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="text-green-600 text-sm mt-2 sm:mt-0 self-center">
          ¡Invitación enviada!
        </div>
      )}
    </form>
  );
}
