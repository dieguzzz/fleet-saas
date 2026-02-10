'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
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
  const defaultCenter: [number, number] = [19.4326, -99.1332]; // CDMX default
  const center = origin
    ? [origin.lat, origin.lng]
    : destination
    ? [destination.lat, destination.lng]
    : defaultCenter;

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`${className} bg-slate-100 animate-pulse flex items-center justify-center text-slate-400`}>
        Cargando mapa...
      </div>
    );
  }

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={13}
      scrollWheelZoom={interactive}
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {origin && (
        <Marker position={[origin.lat, origin.lng]}>
          <Popup>
            <strong>Origen:</strong> {origin.label}
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker position={[destination.lat, destination.lng]}>
          <Popup>
            <strong>Destino:</strong> {destination.label}
          </Popup>
        </Marker>
      )}

      <MapUpdater center={center as [number, number]} />
      {interactive && <MapClickHandler onClick={onMapClick} />}
    </MapContainer>
  );
}
