import type { DogBreed } from '@/components/dog/dogConstants';

export const DOG_CONFIG_KEY   = 'pt_dog_config_v1';
export const DOG_CONFIG_EVENT = 'dog-config-change';

export interface DogUserConfig {
  size:  number;
  breed: DogBreed | 'auto';
}

export const DEFAULT_DOG_CONFIG: DogUserConfig = { size: 64, breed: 'auto' };

export function readDogConfig(): DogUserConfig {
  if (typeof window === 'undefined') return DEFAULT_DOG_CONFIG;
  try {
    const raw = localStorage.getItem(DOG_CONFIG_KEY);
    return raw ? { ...DEFAULT_DOG_CONFIG, ...JSON.parse(raw) } : DEFAULT_DOG_CONFIG;
  } catch { return DEFAULT_DOG_CONFIG; }
}

export function saveDogConfig(cfg: DogUserConfig) {
  localStorage.setItem(DOG_CONFIG_KEY, JSON.stringify(cfg));
  window.dispatchEvent(new Event(DOG_CONFIG_EVENT));
}
