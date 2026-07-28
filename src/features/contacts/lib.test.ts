import { describe, it, expect } from 'vitest';
import { hasRole, hasAnyRole, roleLabels, parseRoles } from './lib';

describe('hasRole', () => {
  it('reconoce un rol presente', () => {
    expect(hasRole({ roles: ['customer', 'supplier'] }, 'supplier')).toBe(true);
  });

  it('rechaza un rol ausente', () => {
    expect(hasRole({ roles: ['customer'] }, 'supplier')).toBe(false);
  });

  it('devuelve false con la lista vacía', () => {
    expect(hasRole({ roles: [] }, 'customer')).toBe(false);
  });
});

describe('hasAnyRole', () => {
  it('alcanza con que coincida uno', () => {
    expect(hasAnyRole({ roles: ['mechanic'] }, ['mechanic', 'workshop'])).toBe(true);
  });

  it('es false cuando no coincide ninguno', () => {
    expect(hasAnyRole({ roles: ['customer'] }, ['mechanic', 'workshop'])).toBe(false);
  });

  it('un contacto cliente y proveedor coincide con las dos categorías por separado', () => {
    const contacto = { roles: ['customer', 'supplier'] as const };
    expect(hasAnyRole({ roles: [...contacto.roles] }, ['customer'])).toBe(true);
    expect(hasAnyRole({ roles: [...contacto.roles] }, ['supplier'])).toBe(true);
  });

  it('es false cuando la lista de roles buscados está vacía', () => {
    expect(hasAnyRole({ roles: ['customer'] }, [])).toBe(false);
  });
});

describe('roleLabels', () => {
  it('traduce cada rol a su etiqueta', () => {
    expect(roleLabels({ roles: ['customer', 'supplier'] })).toEqual(['Cliente', 'Proveedor']);
  });

  it('conserva el orden en que vienen los roles', () => {
    expect(roleLabels({ roles: ['supplier', 'customer'] })).toEqual(['Proveedor', 'Cliente']);
  });

  it('devuelve una lista vacía cuando no hay roles', () => {
    expect(roleLabels({ roles: [] })).toEqual([]);
  });
});

describe('parseRoles', () => {
  function formWith(values: string[]): FormData {
    const fd = new FormData();
    for (const v of values) fd.append('roles', v);
    return fd;
  }

  it('lee todos los checkboxes marcados', () => {
    expect(parseRoles(formWith(['customer', 'supplier']))).toEqual(['customer', 'supplier']);
  });

  it('devuelve una lista vacía cuando no hay ninguno marcado', () => {
    expect(parseRoles(new FormData())).toEqual([]);
  });

  it('descarta valores vacíos y espacios', () => {
    expect(parseRoles(formWith(['customer', '', '   ']))).toEqual(['customer']);
  });

  it('deduplica', () => {
    expect(parseRoles(formWith(['customer', 'customer', 'supplier']))).toEqual(['customer', 'supplier']);
  });

  it('recorta espacios alrededor de cada valor', () => {
    expect(parseRoles(formWith([' customer ']))).toEqual(['customer']);
  });
});
