'use client';

import { useState, useEffect } from 'react';
import DogAnimation from './DogAnimation';
import { readDogConfig, DOG_CONFIG_EVENT } from '@/lib/dogConfig';
import type { DogUserConfig } from '@/lib/dogConfig';
import type { DogBreed } from './dogConstants';

export default function DogStrip() {
  const [dogCfg, setDogCfg] = useState<DogUserConfig | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setDogCfg(readDogConfig());
    const sync = () => setDogCfg(readDogConfig());
    window.addEventListener(DOG_CONFIG_EVENT, sync);
    return () => window.removeEventListener(DOG_CONFIG_EVENT, sync);
  }, []);

  const dogSize = dogCfg?.size ?? 53;
  const forcedBreed = (dogCfg?.breed && dogCfg.breed !== 'auto') ? dogCfg.breed as DogBreed : undefined;

  return (
    <div
      className={[
        'dog-strip',
        collapsed ? 'dog-strip--collapsed' : '',
      ].filter(Boolean).join(' ')}
    >
      <button
        className="dog-strip__toggle"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? 'Mostrar mascota' : 'Ocultar mascota'}
      >
        <span className="dog-strip__toggle-icon">
          {collapsed ? '🐾' : '▾'}
        </span>
      </button>

      <div className="dog-strip__ground" />

      <DogAnimation
        key={`strip-${dogSize}-${forcedBreed ?? 'auto'}`}
        dogSize={dogSize}
        forcedBreed={forcedBreed}
        zIndex={1}
      />
    </div>
  );
}
