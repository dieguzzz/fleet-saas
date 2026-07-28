import { describe, it, expect } from 'vitest';
import { costPerPortion } from './lib';

describe('costPerPortion', () => {
  it('divide el costo total de la receta por sus porciones', () => {
    expect(costPerPortion({ cost_estimate: 18.34, portions: 4 })).toBeCloseTo(4.585, 4);
  });

  it('con una sola porción devuelve el costo total', () => {
    expect(costPerPortion({ cost_estimate: 12.5, portions: 1 })).toBe(12.5);
  });

  it('trata las porciones nulas como una sola', () => {
    expect(costPerPortion({ cost_estimate: 9, portions: null })).toBe(9);
  });

  it('trata cero porciones como una sola, sin dividir por cero', () => {
    expect(costPerPortion({ cost_estimate: 9, portions: 0 })).toBe(9);
  });

  it('trata porciones negativas como una sola', () => {
    expect(costPerPortion({ cost_estimate: 9, portions: -4 })).toBe(9);
  });

  it('devuelve cero cuando el costo todavía no se calculó', () => {
    expect(costPerPortion({ cost_estimate: null, portions: 4 })).toBe(0);
  });

  it('acepta los numeric de Postgres, que llegan como string', () => {
    expect(costPerPortion({ cost_estimate: '18.34', portions: '4' })).toBeCloseTo(4.585, 4);
  });

  it('el cero es un costo válido, no ausencia de dato', () => {
    expect(costPerPortion({ cost_estimate: 0, portions: 4 })).toBe(0);
  });
});
