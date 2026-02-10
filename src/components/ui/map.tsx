'use client';

import * as React from 'react';
import { MapContainer, TileLayer, type MapContainerProps } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Dark Mode Map Styles (CSS Overrides for Leaflet)
const mapStyles = `
  .leaflet-container {
    background: #0b0e14 !important;
  }
  .leaflet-tile-pane {
    filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
  }
  .leaflet-control-zoom-in,
  .leaflet-control-zoom-out {
    background-color: #1e293b !important;
    color: #f8fafc !important;
    border-color: #334155 !important;
  }
  .leaflet-control-attribution {
    background: rgba(15, 23, 42, 0.8) !important;
    color: #94a3b8 !important;
  }
  .leaflet-control-attribution a {
    color: #38bdf8 !important;
  }
  /* Better Popup customization for dark mode */
  .leaflet-popup-content-wrapper {
    background: #1e293b !important;
    color: #f8fafc !important;
    border: 1px solid #334155 !important;
    border-radius: 8px !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.5) !important;
  }
  .leaflet-popup-tip {
    background: #1e293b !important;
  }
`;

export interface MapProps extends MapContainerProps {
  children?: React.ReactNode;
}

export function Map({ children, className, ...props }: MapProps) {
  return (
    <>
      <style>{mapStyles}</style>
      <MapContainer 
        className={className} 
        attributionControl={true}
        {...props}
      >
        {children}
      </MapContainer>
    </>
  );
}

export function MapTileLayer() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    />
  );
}
