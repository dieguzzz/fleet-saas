'use client';

import { useActionState, useEffect, useState } from 'react';
import { createFuelRecord, type FuelFormState } from '@/features/fuel/actions';
import { Button } from '@/components/ui/button';

interface Vehicle { id: string; name: string; plate_number: string | null; }
interface Employee { id: string; full_name: string; }

export default function NewFuelRecordModal({ orgSlug, vehicles, employees }: {
  orgSlug: string;
  vehicles: Vehicle[];
  employees: Employee[];
}) {
  const [open, setOpen] = useState(false);
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [state, formAction, isPending] = useActionState(
    async (prev: FuelFormState, fd: FormData) => createFuelRecord(prev, fd),
    {}
  );

  const total = liters && pricePerLiter ? (parseFloat(liters) * parseFloat(pricePerLiter)).toFixed(2) : '';

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      setLiters('');
      setPricePerLiter('');
    }
  }, [state.success]);

  return (
    <>
      <Button onClick={() => setOpen(true)} className="flex items-center gap-2">
        <span>⛽</span> Cargar combustible
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-base font-semibold text-foreground">Nuevo registro de combustible</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-xl font-bold">×</button>
            </div>

            <form action={formAction} className="p-6 space-y-4">
              <input type="hidden" name="orgSlug" value={orgSlug} />
              <input type="hidden" name="total_cost" value={total} />

              {state.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm">{state.error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Fecha *</label>
                  <input name="fuel_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="field-input" />
                </div>
                <div>
                  <label className="field-label">Tipo *</label>
                  <select name="fuel_type" required className="field-input">
                    <option value="diesel">Diesel</option>
                    <option value="gasoline">Gasolina</option>
                    <option value="gasoil">Gasoil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Vehículo</label>
                <select name="vehicle_id" className="field-input">
                  <option value="">Sin vehículo</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name}{v.plate_number ? ` (${v.plate_number})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Conductor / Empleado</label>
                <select name="employee_id" className="field-input">
                  <option value="">Sin asignar</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Litros *</label>
                  <input name="liters" type="number" step="0.01" min="0.01" required value={liters} onChange={e => setLiters(e.target.value)} className="field-input" placeholder="0.00" />
                </div>
                <div>
                  <label className="field-label">Precio/litro *</label>
                  <input name="price_per_liter" type="number" step="0.001" min="0.001" required value={pricePerLiter} onChange={e => setPricePerLiter(e.target.value)} className="field-input" placeholder="0.000" />
                </div>
              </div>

              {total && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 flex justify-between items-center">
                  <span className="text-sm text-primary font-medium">Total calculado</span>
                  <span className="text-lg font-bold text-primary">${parseFloat(total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Estación de servicio</label>
                  <input name="station" type="text" className="field-input" placeholder="YPF, Shell..." />
                </div>
                <div>
                  <label className="field-label">Odómetro (km)</label>
                  <input name="odometer" type="number" min="0" className="field-input" placeholder="120000" />
                </div>
              </div>

              <div>
                <label className="field-label">Notas</label>
                <textarea name="notes" rows={2} className="field-input" placeholder="Observaciones..." />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={isPending || !total} className="flex-1">
                  {isPending ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
