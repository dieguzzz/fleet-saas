import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Sin `globals: true` (convención del repo), @testing-library/react no puede
// auto-detectar `afterEach` global y su auto-cleanup nunca se registra. Sin
// esto, los renders de un `it()` quedan en el DOM compartido y ensucian las
// aserciones de los siguientes tests del mismo archivo.
afterEach(() => {
  cleanup();
});
