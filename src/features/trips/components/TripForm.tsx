'use client';

import { useActionState, useRef, useState, useTransition } from 'react';
import { createTrip, saveTripLocation, incrementTripLocationUse, deleteTripLocation } from '@/features/trips/actions';
import Link from 'next/link';
import { createClient } from '@/services/supabase/client';
import { useCurrentOrg } from '@/store/tenant-store';
import dynamic from 'next/dynamic';
import type { TripLocation } from '@/types/database';

const TripMap = dynamic(() => import('./TripMap').then((mod) => mod.TripMap), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full bg-muted rounded-lg animate-pulse flex items-center justify-center text-muted-foreground">
      Cargando mapa…
    </div>
  ),
});

interface TripFormProps {
  orgSlug: string;
  vehicles: { id: string; name: string; plate_number: string }[];
  drivers: { id: string; full_name: string }[];
  savedLocations: TripLocation[];
}

interface Coords { lat: number; lng: number }

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`,
      { headers: { 'Accept-Language': 'es' } }
    );
    const json = await res.json();
    const a = json.address ?? {};
    const parts = [
      a.road || a.pedestrian || a.footway,
      a.city || a.town || a.village || a.municipality,
      a.state,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : json.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function TripForm({ orgSlug, vehicles, drivers, savedLocations: initialLocations }: TripFormProps) {
  const currentOrg = useCurrentOrg();
  const [state, formAction, isPending] = useActionState(createTrip, null);
  const [locations, setLocations] = useState<TripLocation[]>(initialLocations);

  const [originCoords, setOriginCoords] = useState<Coords | undefined>(undefined);
  const [destCoords, setDestCoords] = useState<Coords | undefined>(undefined);
  const [originName, setOriginName] = useState('');
  const [destName, setDestName] = useState('');
  const [selecting, setSelecting] = useState<'origin' | 'destination' | null>(null);
  const [geocoding, setGeocoding] = useState<'origin' | 'destination' | null>(null);
  const [isRoundTrip, setIsRoundTrip] = useState(false);

  const [startInvoiceUrl, setStartInvoiceUrl] = useState('');
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [invoiceFileName, setInvoiceFileName] = useState('');
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const [savingLocation, setSavingLocation] = useState<'origin' | 'destination' | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startSaveTransition] = useTransition();

  const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!currentOrg) { alert('No se pudo determinar la organización'); return; }
    setUploadingInvoice(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${currentOrg.id}/invoices/start-${Date.now()}.${ext}`;
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

  const handleMapClick = async (lat: number, lng: number) => {
    if (!selecting) return;
    const type = selecting;
    setSelecting(null);
    setGeocoding(type);
    const name = await reverseGeocode(lat, lng);
    setGeocoding(null);
    if (type === 'origin') {
      setOriginCoords({ lat, lng });
      setOriginName(name);
    } else {
      setDestCoords({ lat, lng });
      setDestName(name);
    }
  };

  const applyLocation = (loc: TripLocation, type: 'origin' | 'destination') => {
    if (type === 'origin') {
      setOriginCoords({ lat: loc.lat, lng: loc.lng });
      setOriginName(loc.name);
    } else {
      setDestCoords({ lat: loc.lat, lng: loc.lng });
      setDestName(loc.name);
    }
    // Increment use count in background
    startSaveTransition(() => { incrementTripLocationUse(loc.id); });
  };

  const handleSaveLocation = async (type: 'origin' | 'destination') => {
    const coords = type === 'origin' ? originCoords : destCoords;
    const name = type === 'origin' ? originName : destName;
    if (!coords || !name.trim()) return;
    setSavingLocation(type);
    const fd = new FormData();
    fd.set('orgSlug', orgSlug);
    fd.set('name', name.trim());
    fd.set('lat', String(coords.lat));
    fd.set('lng', String(coords.lng));
    const result = await saveTripLocation(null, fd);
    if (!result?.error && result?.id) {
      // Refresh optimistically usando el id REAL devuelto por la action, para que
      // incrementar/eliminar el chip funcione sin recargar.
      const existing = locations.find((l) => l.name.toLowerCase() === name.trim().toLowerCase());
      if (!existing) {
        setLocations((prev) => [
          { id: result.id!, organization_id: '', name: name.trim(), lat: coords.lat, lng: coords.lng, use_count: result.use_count ?? 1, created_at: null, updated_at: null },
          ...prev,
        ]);
      }
    }
    setSavingLocation(null);
  };

  const handleDeleteLocation = async (id: string) => {
    setDeletingId(id);
    await deleteTripLocation(id);
    setLocations((prev) => prev.filter((l) => l.id !== id));
    setDeletingId(null);
  };

  const fieldLabel = (label: string, required = false) => (
    <span className="text-sm font-medium text-foreground">
      {label}{required && ' *'}
    </span>
  );

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

        {/* Vehículo */}
        <div className="space-y-2">
          <label htmlFor="vehicle_id">{fieldLabel('Vehículo', true)}</label>
          <select id="vehicle_id" name="vehicle_id" required className="field-input">
            <option value="">Seleccionar vehículo</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.name} ({v.plate_number})</option>
            ))}
          </select>
        </div>

        {/* Conductor */}
        <div className="space-y-2">
          <label htmlFor="driver_id">{fieldLabel('Conductor', true)}</label>
          <select id="driver_id" name="driver_id" required className="field-input">
            <option value="">Seleccionar conductor</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>{d.full_name}</option>
            ))}
          </select>
        </div>

        {/* Origen */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            {fieldLabel('Origen', true)}
            <button
              type="button"
              onClick={() => setSelecting(selecting === 'origin' ? null : 'origin')}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                selecting === 'origin'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {selecting === 'origin' ? 'Seleccionando…' : 'Marcar en mapa'}
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <input
              id="origin"
              name="origin"
              type="text"
              required
              value={originName}
              onChange={(e) => setOriginName(e.target.value)}
              placeholder={geocoding === 'origin' ? 'Obteniendo nombre…' : 'Ciudad o dirección de origen'}
              className="field-input flex-1"
            />
            {originCoords && (
              <button
                type="button"
                onClick={() => handleSaveLocation('origin')}
                disabled={savingLocation === 'origin'}
                title="Guardar como ubicación recurrente"
                className="shrink-0 text-xs px-2 py-1.5 bg-muted hover:bg-accent border border-border rounded-lg transition-colors disabled:opacity-50"
              >
                {savingLocation === 'origin' ? '…' : '⭐'}
              </button>
            )}
          </div>
          {/* Chips de ubicaciones guardadas */}
          {locations.length > 0 && (
            <LocationChips
              locations={locations}
              onSelect={(loc) => applyLocation(loc, 'origin')}
              onDelete={handleDeleteLocation}
              deletingId={deletingId}
            />
          )}
        </div>

        {/* Destino */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            {fieldLabel('Destino', true)}
            <button
              type="button"
              onClick={() => setSelecting(selecting === 'destination' ? null : 'destination')}
              className={`text-xs px-2 py-0.5 rounded transition-colors ${
                selecting === 'destination'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}
            >
              {selecting === 'destination' ? 'Seleccionando…' : 'Marcar en mapa'}
            </button>
          </div>
          <div className="flex gap-2 items-center">
            <input
              id="destination"
              name="destination"
              type="text"
              required
              value={destName}
              onChange={(e) => setDestName(e.target.value)}
              placeholder={geocoding === 'destination' ? 'Obteniendo nombre…' : 'Ciudad o dirección de destino'}
              className="field-input flex-1"
            />
            {destCoords && (
              <button
                type="button"
                onClick={() => handleSaveLocation('destination')}
                disabled={savingLocation === 'destination'}
                title="Guardar como ubicación recurrente"
                className="shrink-0 text-xs px-2 py-1.5 bg-muted hover:bg-accent border border-border rounded-lg transition-colors disabled:opacity-50"
              >
                {savingLocation === 'destination' ? '…' : '⭐'}
              </button>
            )}
          </div>
          {locations.length > 0 && (
            <LocationChips
              locations={locations}
              onSelect={(loc) => applyLocation(loc, 'destination')}
              onDelete={handleDeleteLocation}
              deletingId={deletingId}
            />
          )}
        </div>

        {/* Ida y regreso */}
        <label className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3 cursor-pointer hover:bg-accent/50 transition-colors">
          <input
            type="checkbox"
            name="is_round_trip"
            checked={isRoundTrip}
            onChange={(e) => setIsRoundTrip(e.target.checked)}
            className="mt-0.5 size-4 accent-primary"
          />
          <span className="text-sm">
            <span className="font-medium text-foreground">Ida y regreso</span>
            <span className="block text-xs text-muted-foreground">
              Crea también el tramo de vuelta (destino → origen) como viaje planificado aparte.
            </span>
          </span>
        </label>

        {/* Estado */}
        <div className="space-y-2">
          <label htmlFor="status">{fieldLabel(isRoundTrip ? 'Estado (ida)' : 'Estado')}</label>
          <select id="status" name="status" className="field-input">
            <option value="planned">Planificado</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completado</option>
            <option value="cancelled">Cancelado</option>
          </select>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <label htmlFor="notes">{fieldLabel('Notas')}</label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            placeholder="Detalles adicionales del viaje…"
            className="field-input"
          />
        </div>

        {/* Factura de inicio */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Factura de Inicio <span className="text-muted-foreground font-normal">(opcional)</span>
          </p>
          <input type="hidden" name="start_invoice_url" value={startInvoiceUrl} />
          <div
            role="button"
            tabIndex={0}
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => invoiceInputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') invoiceInputRef.current?.click(); }}
          >
            {invoiceFileName ? (
              <p className="text-sm text-green-600 font-medium">{invoiceFileName}</p>
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
            {isPending ? 'Guardando…' : 'Crear Viaje'}
          </button>
        </div>
      </form>

      {/* Mapa interactivo */}
      <div className="relative rounded-xl overflow-hidden border border-border">
        <TripMap
          interactive={!!selecting}
          origin={originCoords ? { ...originCoords, label: originName || 'Origen' } : undefined}
          destination={destCoords ? { ...destCoords, label: destName || 'Destino' } : undefined}
          onMapClick={handleMapClick}
          className="h-[450px] w-full"
        />
        {selecting && (
          <div className="absolute bottom-0 left-0 right-0 p-3 text-sm text-white text-center bg-black/60 backdrop-blur-sm pointer-events-none">
            Hacé clic en el mapa para fijar el{' '}
            <strong>{selecting === 'origin' ? 'origen' : 'destino'}</strong>
          </div>
        )}
        {!selecting && !originCoords && !destCoords && (
          <div className="absolute bottom-0 left-0 right-0 p-3 text-sm text-white text-center bg-black/60 backdrop-blur-sm pointer-events-none">
            Usá &quot;Marcar en mapa&quot; para fijar origen y destino
          </div>
        )}
      </div>
    </div>
  );
}

// ── Chips de ubicaciones guardadas ──────────────────────────────────────────

function LocationChips({
  locations,
  onSelect,
  onDelete,
  deletingId,
}: {
  locations: TripLocation[];
  onSelect: (loc: TripLocation) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-0.5">
      {locations.map((loc) => (
        <div
          key={loc.id}
          className="group flex items-center gap-1 text-xs bg-muted border border-border rounded-full pl-2.5 pr-1 py-0.5 hover:border-primary/50 transition-colors"
        >
          <button
            type="button"
            onClick={() => onSelect(loc)}
            className="text-foreground hover:text-primary transition-colors max-w-[140px] truncate"
            title={loc.name}
          >
            {loc.name}
            {loc.use_count > 1 && (
              <span className="ml-1 text-muted-foreground">×{loc.use_count}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onDelete(loc.id)}
            disabled={deletingId === loc.id}
            className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 ml-0.5 disabled:opacity-50"
            title="Eliminar ubicación guardada"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
