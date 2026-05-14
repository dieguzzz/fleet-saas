'use client';

import { useState } from 'react';
import { BREEDS } from '@/components/dog/dogConstants';
import type { DogBreed } from '@/components/dog/dogConstants';
import { readDogConfig, saveDogConfig, DEFAULT_DOG_CONFIG } from '@/lib/dogConfig';

const BREED_LABELS: Record<DogBreed, string> = {
  'Dog-1-Golden-Retriever': 'Golden Retriever',
  'Dog-2-Akita':            'Akita',
  'Dog-3-Great-Dane':       'Gran Danés',
  'Dog-4-Schnauzer':        'Schnauzer',
  'Dog-5-Saint-Bernard':    'San Bernardo',
  'Dog-6-Siberian-Husky':   'Husky Siberiano',
};

function idleUrl(breed: DogBreed) {
  const cfg  = BREEDS[breed];
  const file = cfg.idleCase === 'Idle' ? 'Idle' : 'idle';
  return `/assets_dog/Pet Dogs Pack/${cfg.folder}/${cfg.prefix}${file}.png`;
}

export default function DogSettingsPanel() {
  const init = typeof window !== 'undefined' ? readDogConfig() : DEFAULT_DOG_CONFIG;
  const [breed, setBreed] = useState<DogBreed | 'auto'>(init.breed);
  const [size,  setSize]  = useState(init.size);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    saveDogConfig({ breed, size });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* Breed picker */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground">Raza</label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
          {/* Auto */}
          <button
            onClick={() => setBreed('auto')}
            className={[
              'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all',
              breed === 'auto'
                ? 'border-primary bg-primary/10 ring-2 ring-primary'
                : 'border-border bg-muted/40 hover:bg-accent',
            ].join(' ')}
          >
            <div className="w-14 h-14 flex items-center justify-center text-3xl select-none">🔀</div>
            <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">Auto</span>
          </button>

          {/* Each breed */}
          {(Object.keys(BREEDS) as DogBreed[]).map((key) => (
            <button
              key={key}
              onClick={() => setBreed(key)}
              className={[
                'flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all',
                breed === key
                  ? 'border-primary bg-primary/10 ring-2 ring-primary'
                  : 'border-border bg-muted/40 hover:bg-accent',
              ].join(' ')}
            >
              <div
                className="w-14 h-14 shrink-0"
                style={{
                  backgroundImage:     `url('${idleUrl(key)}')`,
                  backgroundSize:      'auto 56px',
                  backgroundPositionX: '0px',
                  backgroundRepeat:    'no-repeat',
                  imageRendering:      'pixelated',
                }}
              />
              <span className="text-[10px] font-medium text-muted-foreground leading-tight text-center">
                {BREED_LABELS[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Size slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">Tamaño</label>
          <span className="text-sm text-muted-foreground tabular-nums">{size} px</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Pequeño</span>
          <input
            type="range"
            min={36}
            max={72}
            step={2}
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="flex-1 accent-primary"
          />
          <span className="text-xs text-muted-foreground">Grande</span>
        </div>

        {/* Live sprite preview at selected size */}
        {breed !== 'auto' && (
          <div className="flex items-end gap-3 pt-1">
            <div
              style={{
                backgroundImage:     `url('${idleUrl(breed)}')`,
                backgroundSize:      `auto ${size}px`,
                backgroundPositionX: '0px',
                backgroundRepeat:    'no-repeat',
                imageRendering:      'pixelated',
                width:  `${size}px`,
                height: `${size}px`,
              }}
            />
            <span className="text-xs text-muted-foreground pb-1">Vista previa</span>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          {saved ? '¡Guardado! ✓' : 'Guardar cambios'}
        </button>
        <button
          onClick={() => { setBreed(DEFAULT_DOG_CONFIG.breed); setSize(DEFAULT_DOG_CONFIG.size); }}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Restablecer
        </button>
      </div>
    </div>
  );
}
