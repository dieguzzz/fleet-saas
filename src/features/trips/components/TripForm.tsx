'use client';

import { useActionState } from 'react';
import { createTrip } from '@/features/trips/actions';
import Link from 'next/link';

import dynamic from 'next/dynamic';
import { useState } from 'react';

const TripMap = dynamic(() => import('./TripMap').then((mod) => mod.TripMap), {
  ssr: false,
  loading: () => <div className="h-[300px] w-full bg-slate-800 rounded-lg animate-pulse flex items-center justify-center text-slate-500">Cargando mapa...</div>,
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
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="orgSlug" value={orgSlug} />
        <input type="hidden" name="origin_coords" value={originCoords ? JSON.stringify(originCoords) : ''} />
        <input type="hidden" name="destination_coords" value={destCoords ? JSON.stringify(destCoords) : ''} />
        
        {state?.error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            {state.error}
          </div>
        )}

        {/* Form fields ... */}
        {/* Skipping unchanged parts for brevity in this prompt, but I need to replace the whole file or huge chunk to be safe */}
        {/* I'll use the original content and wrap it. */}
        
        <div className="space-y-2">
          <label htmlFor="vehicle_id" className="text-sm font-medium text-slate-300">
            Vehículo *
          </label>
          <select
            id="vehicle_id"
            name="vehicle_id"
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label htmlFor="driver_id" className="text-sm font-medium text-slate-300">
            Conductor *
          </label>
          <select
            id="driver_id"
            name="driver_id"
            required
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label htmlFor="origin" className="text-sm font-medium text-slate-300 flex justify-between">
            <span>Origen *</span>
            <button 
              type="button"
              onClick={() => setSelecting(selecting === 'origin' ? null : 'origin')}
              className={`text-xs px-2 py-0.5 rounded ${selecting === 'origin' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
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
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {originCoords && <div className="text-green-500 flex items-center" title="Coordenadas establecidas">📍</div>}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="destination" className="text-sm font-medium text-slate-300 flex justify-between">
             <span>Destino *</span>
             <button 
              type="button"
              onClick={() => setSelecting(selecting === 'destination' ? null : 'destination')}
              className={`text-xs px-2 py-0.5 rounded ${selecting === 'destination' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
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
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
             {destCoords && <div className="text-green-500 flex items-center" title="Coordenadas establecidas">📍</div>}
           </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium text-slate-300">
            Estado
          </label>
          <select
            id="status"
            name="status"
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="planned">Planificado</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium text-slate-300">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Detalles adicionales del viaje..."
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-4 pt-4">
          <Link
            href={`/${orgSlug}/trips`}
            className="px-6 py-2 border border-slate-600 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? 'Guardando...' : 'Crear Viaje'}
          </button>
        </div>
      </form>

      <div className="h-full min-h-[400px] bg-slate-900 rounded-xl overflow-hidden border border-slate-700">
         <TripMap 
            interactive={!!selecting}
            origin={originCoords ? { ...originCoords, label: 'Origen Seleccionado' } : undefined}
            destination={destCoords ? { ...destCoords, label: 'Destino Seleccionado' } : undefined}
            onMapClick={(lat, lng) => {
              if (selecting) handleMapClick(selecting, lat, lng);
            }}
            className="h-full w-full"
         />
         {!selecting && !originCoords && !destCoords && (
             <div className="p-4 text-sm text-slate-400 text-center">
                 Selecciona &quot;Origen&quot; o &quot;Destino&quot; arriba y haz clic en el mapa para establecer la ubicación.
             </div>
         )}
      </div>
    </div>
  );
}
