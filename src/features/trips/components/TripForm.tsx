'use client';

import { useActionState } from 'react';
import { createTrip } from '@/features/trips/actions';
import Link from 'next/link';
import { createClient } from '@/services/supabase/client';

import dynamic from 'next/dynamic';
import { useState, useRef } from 'react';

const TripMap = dynamic(() => import('./TripMap').then((mod) => mod.TripMap), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-muted rounded-lg animate-pulse flex items-center justify-center text-muted-foreground">Cargando mapa...</div>,
});

const initialState = {
  error: '',
  success: false,
};

// We need to fetch vehicles and drivers to populate the dropdowns.
// Since this is a client component, we should pass them as props.
interface TripFormProps {
  orgSlug: string;
  vehicles: { id: string; name: string; plate_number: string }[];
  drivers: { id: string; full_name: string }[];
}

export default function TripForm({ orgSlug, vehicles, drivers }: TripFormProps) {
  const [state, formAction, isPending] = useActionState(createTrip, initialState);
  
  const [originCoords, setOriginCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [destCoords, setDestCoords] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [selecting, setSelecting] = useState<'origin' | 'destination' | null>(null);
  const [startInvoiceUrl, setStartInvoiceUrl] = useState<string>('');
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [invoiceFileName, setInvoiceFileName] = useState<string>('');
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingInvoice(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `invoices/start-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('trip-documents').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('trip-documents').getPublicUrl(path);
      setStartInvoiceUrl(data.publicUrl);
      setInvoiceFileName(file.name);
    } catch {
      alert('Error subiendo la factura');
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleMapClick = (type: 'origin' | 'destination', lat: number, lng: number) => {
    if (selecting === 'origin') {
      setOriginCoords({ lat, lng });
      setSelecting(null);
      // Optional: Reverse geocoding here to set text input
    } else if (selecting === 'destination') {
      setDestCoords({ lat, lng });
      setSelecting(null);
    }
  };

  // Override the component's onLocationSelect to use our state logic (wrapper needed if component doesn't handle mode)
  // Actually TripMap calls onLocationSelect with the clicked coords.
  // But TripMap needs to know IF it should react. 
  // We can pass `interactive={!!selecting}`? 
  // My TripMap implementation: `onLocationSelect` is called if provided?
  // Let's check TripMap again. It uses `useMapEvents`? No, I implemented `MapUpdater` but not click events.
  // I need to update TripMap to handle clicks if I want that.
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="orgSlug" value={orgSlug} />
        <input type="hidden" name="origin_coords" value={originCoords ? JSON.stringify(originCoords) : ''} />
        <input type="hidden" name="destination_coords" value={destCoords ? JSON.stringify(destCoords) : ''} />
        
        {state?.error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {/* Form fields ... */}
        {/* Skipping unchanged parts for brevity in this prompt, but I need to replace the whole file or huge chunk to be safe */}
        {/* I'll use the original content and wrap it. */}
        
        <div className="space-y-2">
          <label htmlFor="vehicle_id" className="text-sm font-medium text-foreground">
            Vehículo *
          </label>
          <select
            id="vehicle_id"
            name="vehicle_id"
            required
            className="field-input"
          >
            <option value="">Seleccionar vehículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} ({v.plate_number})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="driver_id" className="text-sm font-medium text-foreground">
            Conductor *
          </label>
          <select
            id="driver_id"
            name="driver_id"
            required
            className="field-input"
          >
            <option value="">Seleccionar conductor</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="origin" className="text-sm font-medium text-foreground flex justify-between">
            <span>Origen *</span>
            <button 
              type="button"
              onClick={() => setSelecting(selecting === 'origin' ? null : 'origin')}
              className={`text-xs px-2 py-0.5 rounded ${selecting === 'origin' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {selecting === 'origin' ? 'Seleccionando en mapa...' : 'Seleccionar en mapa'}
            </button>
          </label>
          <div className="flex gap-2">
             <input
              id="origin"
              name="origin"
              type="text"
              required
              placeholder="Ciudad o Dirección de Origen"
              className="field-input"
            />
            {originCoords && <div className="text-green-500 flex items-center" title="Coordenadas establecidas">📍</div>}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="destination" className="text-sm font-medium text-foreground flex justify-between">
             <span>Destino *</span>
             <button 
              type="button"
              onClick={() => setSelecting(selecting === 'destination' ? null : 'destination')}
              className={`text-xs px-2 py-0.5 rounded ${selecting === 'destination' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {selecting === 'destination' ? 'Seleccionando en mapa...' : 'Seleccionar en mapa'}
            </button>
          </label>
           <div className="flex gap-2">
            <input
              id="destination"
              name="destination"
              type="text"
              required
              placeholder="Ciudad o Dirección de Destino"
              className="field-input"
            />
             {destCoords && <div className="text-green-500 flex items-center" title="Coordenadas establecidas">📍</div>}
           </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-foreground">
            Estado
          </label>
          <select
            id="status"
            name="status"
            className="field-input"
          >
            <option value="planned">Planificado</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium text-foreground">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Detalles adicionales del viaje..."
            className="field-input"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Factura de Inicio <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <input type="hidden" name="start_invoice_url" value={startInvoiceUrl} />
          <div
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => invoiceInputRef.current?.click()}
          >
            {invoiceFileName ? (
              <p className="text-sm text-green-600 font-medium">{invoiceFileName}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {uploadingInvoice ? 'Subiendo...' : 'Clic para adjuntar factura (PDF, imagen)'}
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

        <div className="form-footer">
          <Link
            href={`/${orgSlug}/trips`}
            className="px-4 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-accent transition-colors text-sm"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
          >
            {isPending ? 'Guardando...' : 'Crear Viaje'}
          </button>
        </div>
      </form>

      <div className="relative rounded-xl overflow-hidden border border-border">
         <TripMap
            interactive={!!selecting}
            origin={originCoords ? { ...originCoords, label: 'Origen Seleccionado' } : undefined}
            destination={destCoords ? { ...destCoords, label: 'Destino Seleccionado' } : undefined}
            onMapClick={(lat, lng) => {
              if (selecting) handleMapClick(selecting, lat, lng);
            }}
            className="h-[450px] w-full"
         />
         {!selecting && !originCoords && !destCoords && (
             <div className="absolute bottom-0 left-0 right-0 p-3 text-sm text-white text-center bg-black/60 backdrop-blur-sm">
                 Seleccioná &quot;Origen&quot; o &quot;Destino&quot; arriba y hacé clic en el mapa para fijar la ubicación.
             </div>
         )}
      </div>
    </div>
  );
}
