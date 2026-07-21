'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createFuelRecord, type FuelFormState } from '@/features/fuel/actions';
import { Button } from '@/components/ui/button';
import { createClient } from '@/services/supabase/client';
import { useCurrentOrg } from '@/store/tenant-store';

interface Vehicle { id: string; name: string; plate_number: string | null; }
interface Employee { id: string; full_name: string; }

export default function NewFuelRecordModal({ orgSlug, vehicles, employees }: {
  orgSlug: string;
  vehicles: Vehicle[];
  employees: Employee[];
}) {
  const currentOrg = useCurrentOrg();
  const [open, setOpen] = useState(false);
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [hasSubsidy, setHasSubsidy] = useState(false);
  const [subsidyAmount, setSubsidyAmount] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(
    async (prev: FuelFormState | null, fd: FormData) => createFuelRecord(prev ?? {}, fd),
    null
  );

  const total = liters && pricePerLiter ? (parseFloat(liters) * parseFloat(pricePerLiter)).toFixed(2) : '';
  const netCost = total && hasSubsidy && subsidyAmount ? (parseFloat(total) - parseFloat(subsidyAmount)) : null;

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentOrg) { alert('No se pudo determinar la organización'); return; }
    setUploadingInvoice(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${currentOrg.id}/fuel-invoices/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('trip-documents').upload(path, file, { upsert: true });
      if (error) throw error;
      // Guardar el PATH (bucket privado, se sirve por el proxy autenticado).
      setInvoiceUrl(path);
      setInvoiceFileName(file.name);
    } catch {
      alert('Error subiendo la factura');
    } finally {
      setUploadingInvoice(false);
    }
  };

  const resetForm = () => {
    setLiters('');
    setPricePerLiter('');
    setHasSubsidy(false);
    setSubsidyAmount('');
    setInvoiceUrl('');
    setInvoiceFileName('');
  };

  useEffect(() => {
    if (state?.success) {
      setOpen(false);
      resetForm();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.success]);

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

              {state?.error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-destructive text-sm">{state?.error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="fuel_date" className="field-label">Fecha *</label>
                  <input id="fuel_date" name="fuel_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="field-input" />
                </div>
                <div>
                  <label htmlFor="fuel_type" className="field-label">Tipo *</label>
                  <select id="fuel_type" name="fuel_type" required className="field-input">
                    <option value="diesel">Diesel</option>
                    <option value="gasoline">Gasolina</option>
                    <option value="gasoil">Gasoil</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="vehicle_id" className="field-label">Vehículo</label>
                <select id="vehicle_id" name="vehicle_id" className="field-input">
                  <option value="">Sin vehículo</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name}{v.plate_number ? ` (${v.plate_number})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="employee_id" className="field-label">Conductor / Empleado</label>
                <select id="employee_id" name="employee_id" className="field-input">
                  <option value="">Sin asignar</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="liters" className="field-label">Litros *</label>
                  <input id="liters" name="liters" type="number" step="0.01" min="0.01" required value={liters} onChange={e => setLiters(e.target.value)} className="field-input" placeholder="0.00" />
                </div>
                <div>
                  <label htmlFor="price_per_liter" className="field-label">Precio/litro *</label>
                  <input id="price_per_liter" name="price_per_liter" type="number" step="0.001" min="0.001" required value={pricePerLiter} onChange={e => setPricePerLiter(e.target.value)} className="field-input" placeholder="0.000" />
                </div>
              </div>

              {total.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-2 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-primary font-medium">Total calculado</span>
                    <span className={`text-lg font-bold text-primary ${netCost !== null ? 'line-through opacity-60' : ''}`}>
                      ${parseFloat(total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  {netCost !== null && (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Subsidio</span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          −${parseFloat(subsidyAmount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center border-t border-primary/20 pt-1">
                        <span className="text-sm font-semibold text-primary">Neto</span>
                        <span className={`text-lg font-bold ${netCost < 0 ? 'text-destructive' : 'text-primary'}`}>
                          {netCost < 0 ? '-' : ''}${Math.abs(netCost).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {netCost < 0 && (
                        <p className="text-xs text-destructive pt-1">El subsidio no puede superar el total.</p>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  id="has_subsidy"
                  type="checkbox"
                  checked={hasSubsidy}
                  onChange={e => {
                    setHasSubsidy(e.target.checked);
                    if (!e.target.checked) setSubsidyAmount('');
                  }}
                  className="h-4 w-4 rounded border-border"
                />
                <label htmlFor="has_subsidy" className="text-sm text-foreground font-medium select-none cursor-pointer">
                  ¿Tiene subsidio?
                </label>
              </div>

              {hasSubsidy ? (
                <div>
                  <label htmlFor="subsidy_amount" className="field-label">Monto del subsidio *</label>
                  <input
                    id="subsidy_amount"
                    name="subsidy_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={subsidyAmount}
                    onChange={e => setSubsidyAmount(e.target.value)}
                    className="field-input"
                    placeholder="5000.00"
                  />
                </div>
              ) : (
                <input type="hidden" name="subsidy_amount" value="" />
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="station" className="field-label">Estación de servicio</label>
                  <input id="station" name="station" type="text" className="field-input" placeholder="YPF, Shell..." />
                </div>
                <div>
                  <label htmlFor="odometer" className="field-label">Odómetro (km)</label>
                  <input id="odometer" name="odometer" type="number" min="0" className="field-input" placeholder="120000" />
                </div>
              </div>

              <div>
                <label htmlFor="fuel_notes" className="field-label">Notas</label>
                <textarea id="fuel_notes" name="notes" rows={2} className="field-input" placeholder="Observaciones..." />
              </div>

              {/* Factura (opcional) */}
              <div>
                <p className="field-label">
                  Factura <span className="text-muted-foreground font-normal">(opcional)</span>
                </p>
                <input type="hidden" name="invoice_url" value={invoiceUrl} />
                <div
                  role="button"
                  tabIndex={0}
                  className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => invoiceInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') invoiceInputRef.current?.click(); }}
                >
                  {invoiceFileName ? (
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">{invoiceFileName}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {uploadingInvoice ? 'Subiendo…' : 'Clic para adjuntar factura (PDF, imagen)'}
                    </p>
                  )}
                </div>
                <input
                  ref={invoiceInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleInvoiceUpload}
                  disabled={uploadingInvoice}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }} className="flex-1">Cancelar</Button>
                <Button type="submit" disabled={isPending || !total || (netCost !== null && netCost < 0)} className="flex-1">
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
