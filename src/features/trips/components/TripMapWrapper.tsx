'use client';

import dynamic from 'next/dynamic';
import { type TripMapProps } from './TripMap';

const TripMap = dynamic(() => import('./TripMap').then((mod) => mod.TripMap), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-muted rounded-lg animate-pulse flex items-center justify-center text-muted-foreground">Cargando mapa...</div>,
});

export function TripMapWrapper(props: TripMapProps) {
  return <TripMap {...props} />;
}
