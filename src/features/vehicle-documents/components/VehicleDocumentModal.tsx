'use client';

import { useActionState, useEffect, useState } from 'react';
import { createVehicleDocument, updateVehicleDocument, type DocumentFormState } from '../actions';
import { Button } from '@/components/ui/button';
import { VEHICLE_DOCUMENT_LABELS, type VehicleDocument, type VehicleDocumentType } from '@/types/database';

interface VehicleDocumentModalProps {
  orgSlug: string;
  vehicles: { id: string; name: string; plate_number: string | null }[];
  defaultVehicleId?: string;
  document?: VehicleDocument;
  trigger?: React.ReactNode;
}

const DOC_TYPES: VehicleDocumentType[] = ['insurance', 'vtv', 'registration', 'other'];

export default function VehicleDocumentModal({
  orgSlug,
  vehicles,
  defaultVehicleId,
  document,
  trigger,
}: VehicleDocumentModalProps) {
  const [open, setOpen] = useState(false);
  const [docType, setDocType] = useState<VehicleDocumentType>(document?.document_type ?? 'insurance');

  const action = document
    ? updateVehicleDocument.bind(null, document.id, orgSlug)
    : createVehicleDocument;

  const [state, formAction, isPending] = useActionState(
    async (prev: DocumentFormState, fd: FormData) => action(prev, fd),
    {}
  );

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  const defaultLabel = VEHICLE_DOCUMENT_LABELS[docType];

  return (
    <>
      <span onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button size="sm" variant="outline">+ Agregar documento</Button>
        )}
      </span>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">
                {document ? 'Editar documento' : 'Nuevo documento'}
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

              <div>
                <label className="field-label">Vehículo *</label>
                <select name="vehicle_id" required defaultValue={document?.vehicle_id ?? defaultVehicleId ?? ''} className="field-input">
                  <option value="">Seleccionar vehículo</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name}{v.plate_number ? ` (${v.plate_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Tipo de documento *</label>
                <select
                  name="document_type"
                  required
                  value={docType}
                  onChange={e => setDocType(e.target.value as VehicleDocumentType)}
                  className="field-input"
                >
                  {DOC_TYPES.map(t => (
                    <option key={t} value={t}>{VEHICLE_DOCUMENT_LABELS[t]}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Nombre / Descripción *</label>
                <input
                  name="label"
                  type="text"
                  required
                  defaultValue={document?.label ?? defaultLabel}
                  key={docType}
                  placeholder={defaultLabel}
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Fecha de vencimiento *</label>
                <input
                  name="expiry_date"
                  type="date"
                  required
                  defaultValue={document?.expiry_date ?? ''}
                  className="field-input"
                />
              </div>

              <div>
                <label className="field-label">Notas</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={document?.notes ?? ''}
                  className="field-input"
                  placeholder="Compañía aseguradora, número de póliza..."
                />
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending} className="flex-1">
                  {isPending ? 'Guardando...' : document ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
