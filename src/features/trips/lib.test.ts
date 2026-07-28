import { describe, it, expect } from 'vitest';
import { formatTripDate } from './lib';

describe('formatTripDate', () => {
  it('formatea una fecha ISO como dd/mm/aaaa', () => {
    expect(formatTripDate('2026-07-28')).toBe('28/07/2026');
  });

  it('ignora la parte de hora de un timestamp', () => {
    expect(formatTripDate('2026-07-28T14:30:00.000Z')).toBe('28/07/2026');
  });

  it('devuelve un guion cuando no hay fecha', () => {
    expect(formatTripDate(null)).toBe('-');
  });
});
