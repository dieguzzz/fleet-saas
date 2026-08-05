import { describe, it, expect } from 'vitest';
import { resolveAmdEmail } from './lib';

describe('resolveAmdEmail', () => {
  it('devuelve el email configurado', () => {
    expect(resolveAmdEmail({ AMD_AUTH_EMAIL: 'admin@amd.com' })).toBe('admin@amd.com');
  });

  it('normaliza espacios y mayúsculas', () => {
    expect(resolveAmdEmail({ AMD_AUTH_EMAIL: '  Admin@AMD.com \n' })).toBe('admin@amd.com');
  });

  it('devuelve null cuando la variable no está definida', () => {
    expect(resolveAmdEmail({})).toBeNull();
  });

  it('devuelve null cuando la variable está vacía', () => {
    expect(resolveAmdEmail({ AMD_AUTH_EMAIL: '   ' })).toBeNull();
  });

  it('devuelve null cuando el valor no parece un email', () => {
    expect(resolveAmdEmail({ AMD_AUTH_EMAIL: 'admin' })).toBeNull();
  });
});
