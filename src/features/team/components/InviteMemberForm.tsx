'use client';

import { useActionState } from 'react';
import { inviteMember } from '../actions';
import { useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="sm">
      {pending ? 'Enviando...' : 'Invitar'}
    </Button>
  );
}

const initialState = { error: '', success: false };

export default function InviteMemberForm({ orgSlug }: { orgSlug: string }) {
  const [state, formAction] = useActionState(inviteMember, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success && formRef.current) {
      formRef.current.reset();
    }
  }, [state.success]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col sm:flex-row gap-4 items-start sm:items-end bg-muted/40 p-4 rounded-lg border border-border">
      <input type="hidden" name="orgSlug" value={orgSlug} />

      <div className="flex-1 w-full sm:w-auto space-y-1">
        <label htmlFor="email" className="text-xs font-medium text-muted-foreground uppercase">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="colaborador@ejemplo.com"
          className="field-input"
        />
      </div>

      <div className="w-full sm:w-40 space-y-1">
        <label htmlFor="role" className="text-xs font-medium text-muted-foreground uppercase">Rol</label>
        <select id="role" name="role" className="field-input">
          <option value="viewer">Observador</option>
          <option value="collaborator">Colaborador</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="w-full sm:w-auto">
        <SubmitButton />
      </div>

      {state?.error && (
        <p className="text-destructive text-sm mt-2 sm:mt-0 self-center">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-emerald-600 dark:text-emerald-400 text-sm mt-2 sm:mt-0 self-center">¡Invitación enviada!</p>
      )}
    </form>
  );
}
