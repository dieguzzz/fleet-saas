'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Map, MapTileLayer } from '@/components/ui/map';

// Fix for default marker icon missing in Leaflet with Next.js/Webpack
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const defaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

export interface TripMapProps {
  origin?: { lat: number; lng: number; label: string };
  destination?: { lat: number; lng: number; label: string };
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}

function FitBounds({
  origin,
  destination,
}: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
}) {
  const map = useMap();
  useEffect(() => {
    const bounds = L.latLngBounds(
      [origin.lat, origin.lng],
      [destination.lat, destination.lng]
    );
    map.fitBounds(bounds, { padding: [48, 48] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);
  return null;
}

function CenterOnSingle({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 13);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1]]);
  return null;
}

function GeolocateOnMount({ skip }: { skip: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (skip || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.setView([pos.coords.latitude, pos.coords.longitude], 13);
      },
      () => { /* permiso denegado — mantiene centro por defecto */ }
    );
  }, [map, skip]);
  return null;
}

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export function TripMap({
  origin,
  destination,
  interactive = false,
  onMapClick,
  className = 'h-[400px] w-full rounded-md border',
}: TripMapProps) {
  const defaultCenter: [number, number] = [8.9833, -79.5167];
  const singleCenter: [number, number] | null = origin
    ? [origin.lat, origin.lng]
    : destination
    ? [destination.lat, destination.lng]
    : null;

  return (
    <Map
      center={singleCenter ?? defaultCenter}
      zoom={13}
      scrollWheelZoom={interactive}
      className={className}
    >
      <MapTileLayer />

      {origin && (
        <Marker position={[origin.lat, origin.lng]}>
          <Popup className="premium-popup">
            <div className="p-1">
              <strong className="text-blue-400 block mb-1 uppercase text-[10px] tracking-wider font-bold">Origen</strong>
              <span className="text-foreground font-medium">{origin.label}</span>
            </div>
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lng]}>
          <Popup className="premium-popup">
            <div className="p-1">
              <strong className="text-emerald-400 block mb-1 uppercase text-[10px] tracking-wider font-bold">Destino</strong>
              <span className="text-foreground font-medium">{destination.label}</span>
            </div>
          </Popup>
        </Marker>
      )}

      {origin && destination && (
        <Polyline
          positions={[
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          ]}
          pathOptions={{ color: '#3b82f6', weight: 3, dashArray: '8 5', opacity: 0.8 }}
        />
      )}

      {origin && destination ? (
        <FitBounds origin={origin} destination={destination} />
      ) : singleCenter ? (
        <CenterOnSingle center={singleCenter} />
      ) : (
        <GeolocateOnMount skip={false} />
      )}

      {interactive && <MapClickHandler onClick={onMapClick} />}
    </Map>
  );
}
