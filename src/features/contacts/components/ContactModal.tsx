'use client';

import { useActionState, useEffect, useState } from 'react';
import { createContact, updateContact, type ContactFormState } from '../actions';
import { Button } from '@/components/ui/button';
import { CONTACT_ROLE_LABELS, SERVICE_ROLES, type Contact } from '@/types/database';

const ALL_ROLES = ['customer', 'supplier', ...SERVICE_ROLES] as const;

interface ContactModalProps {
  orgSlug: string;
  contact?: Contact;
  defaultRole?: string;
  trigger?: React.ReactNode;
  onSuccess?: (id: string, name: string) => void;
}

export default function ContactModal({ orgSlug, contact, defaultRole, trigger, onSuccess }: ContactModalProps) {
  const [open, setOpen] = useState(false);

  const action = contact
    ? updateContact.bind(null, contact.id, orgSlug)
    : createContact;

  const [state, formAction, isPending] = useActionState(
    async (prev: ContactFormState, fd: FormData) => action(prev, fd),
    {}
  );

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      if (onSuccess && state.id && state.name) onSuccess(state.id, state.name);
    }
  }, [state.success, state.id, state.name, onSuccess]);

  const isService = (role: string) => SERVICE_ROLES.includes(role as never);

  return (
    <>
      <span onClick={() => setOpen(true)} className="cursor-pointer">
        {trigger ?? (
          <Button size="sm" variant="outline">+ Nuevo Contacto</Button>
        )}
      </span>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                {contact ? 'Editar contacto' : 'Nuevo contacto'}
              </h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold">×</button>
            </div>

            <form action={formAction} className="p-6 space-y-4">
              <input type="hidden" name="orgSlug" value={orgSlug} />

              {state.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm">{state.error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="field-label">Nombre *</label>
                  <input name="name" type="text" required defaultValue={contact?.name ?? ''} placeholder="Juan García / Taller Norte" className="field-input" />
                </div>

                <div className="col-span-2">
                  <label className="field-label">Tipo *</label>
                  <select name="role" required defaultValue={contact?.role ?? defaultRole ?? ''} className="field-input">
                    <option value="">Seleccionar tipo</option>
                    <optgroup label="Facturación">
                      <option value="customer">Cliente</option>
                      <option value="supplier">Proveedor</option>
                    </optgroup>
                    <optgroup label="Servicios">
                      <option value="mechanic">Mecánico</option>
                      <option value="workshop">Taller</option>
                      <option value="tow_truck">Grúa</option>
                      <option value="tire_service">Gomería</option>
                      <option value="insurance">Seguro</option>
                      <option value="other">Otro</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="field-label">Empresa</label>
                  <input name="company" type="text" defaultValue={contact?.company ?? ''} placeholder="Empresa SA" className="field-input" />
                </div>

                <div>
                  <label className="field-label">Teléfono</label>
                  <input name="phone" type="tel" defaultValue={contact?.phone ?? ''} placeholder="+54 9 11 1234-5678" className="field-input" />
                </div>

                <div>
                  <label className="field-label">Email</label>
                  <input name="email" type="email" defaultValue={contact?.email ?? ''} placeholder="contacto@empresa.com" className="field-input" />
                </div>

                <div>
                  <label className="field-label">Dirección / Zona</label>
                  <input name="address" type="text" defaultValue={contact?.address ?? ''} placeholder="Av. Corrientes 1234" className="field-input" />
                </div>

                <div className="col-span-2">
                  <label className="field-label">Notas</label>
                  <textarea name="notes" rows={2} defaultValue={contact?.notes ?? ''} className="field-input" placeholder="Especialidad, horarios, observaciones..." />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input id="is_emergency_modal" name="is_emergency" type="checkbox"
                  defaultChecked={contact?.is_emergency ?? false}
                  className="w-4 h-4 rounded border-input accent-destructive" />
                <label htmlFor="is_emergency_modal" className="text-sm text-foreground">
                  Contacto de emergencia <span className="text-muted-foreground">(disponible 24hs)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? 'Guardando...' : contact ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
