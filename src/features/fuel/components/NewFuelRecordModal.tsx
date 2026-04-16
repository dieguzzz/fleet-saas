'use client';

import { useActionState, useEffect, useState } from 'react';
import { createFuelRecord, type FuelFormState } from '@/features/fuel/actions';

interface Vehicle { id: string; name: string; plate_number: string | null; }
interface Employee { id: string; full_name: string; }

interface Props {
  orgSlug: string;
  vehicles: Vehicle[];
  employees: Employee[];
}

export default function NewFuelRecordModal({ orgSlug, vehicles, employees }: Props) {
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

  const field = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
      >
        <span>⛽</span> Cargar combustible
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Nuevo registro de combustible</h2>
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">×</button>
            </div>

            <form action={formAction} className="p-6 space-y-4">
              <input type="hidden" name="orgSlug" value={orgSlug} />
              <input type="hidden" name="total_cost" value={total} />

              {state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{state.error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Fecha *</label>
                  <input name="fuel_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className={field} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tipo *</label>
                  <select name="fuel_type" required className={field}>
                    <option value="diesel">Diesel</option>
                    <option value="gasoline">Nafta</option>
                    <option value="gasoil">Gasoil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Vehículo</label>
                <select name="vehicle_id" className={field}>
                  <option value="">Sin vehículo</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name}{v.plate_number ? ` (${v.plate_number})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Conductor / Empleado</label>
                <select name="employee_id" className={field}>
                  <option value="">Sin asignar</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Litros *</label>
                  <input
                    name="liters" type="number" step="0.01" min="0.01" required
                    value={liters} onChange={e => setLiters(e.target.value)}
                    className={field} placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Precio/litro *</label>
                  <input
                    name="price_per_liter" type="number" step="0.001" min="0.001" required
                    value={pricePerLiter} onChange={e => setPricePerLiter(e.target.value)}
                    className={field} placeholder="0.000"
                  />
                </div>
              </div>

              {total && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex justify-between items-center">
                  <span className="text-sm text-blue-700 font-medium">Total calculado</span>
                  <span className="text-lg font-bold text-blue-800">${parseFloat(total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Estación de servicio</label>
                  <input name="station" type="text" className={field} placeholder="YPF, Shell..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Odómetro (km)</label>
                  <input name="odometer" type="number" min="0" className={field} placeholder="120000" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Notas</label>
                <textarea name="notes" rows={2} className={field} placeholder="Observaciones..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending || !total} className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                  {isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
