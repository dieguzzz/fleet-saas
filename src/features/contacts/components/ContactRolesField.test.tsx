import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContactRolesField } from './ContactRolesField';

describe('ContactRolesField', () => {
  it('emite un checkbox llamado roles por cada rol conocido', () => {
    const { container } = render(<ContactRolesField />);
    const checkboxes = container.querySelectorAll('input[type="checkbox"][name="roles"]');
    expect(checkboxes).toHaveLength(9);
  });

  it('cada checkbox lleva su rol como value', () => {
    const { container } = render(<ContactRolesField />);
    const values = [...container.querySelectorAll('input[name="roles"]')].map((el) =>
      (el as HTMLInputElement).value
    );
    expect(values).toContain('customer');
    expect(values).toContain('supplier');
    expect(values).toContain('driver');
  });

  it('muestra las etiquetas en castellano', () => {
    render(<ContactRolesField />);
    expect(screen.getByLabelText('Cliente')).toBeInTheDocument();
    expect(screen.getByLabelText('Proveedor')).toBeInTheDocument();
    expect(screen.getByLabelText('Gomería')).toBeInTheDocument();
  });

  it('arranca sin nada marcado cuando no recibe defaults', () => {
    const { container } = render(<ContactRolesField />);
    const marcados = [...container.querySelectorAll('input[name="roles"]')].filter(
      (el) => (el as HTMLInputElement).defaultChecked
    );
    expect(marcados).toHaveLength(0);
  });

  it('premarca los roles que recibe', () => {
    const { container } = render(<ContactRolesField defaultRoles={['customer', 'supplier']} />);
    const marcados = [...container.querySelectorAll('input[name="roles"]')]
      .filter((el) => (el as HTMLInputElement).defaultChecked)
      .map((el) => (el as HTMLInputElement).value);
    expect(marcados).toEqual(['customer', 'supplier']);
  });

  it('separa los roles comerciales de los de servicio', () => {
    render(<ContactRolesField />);
    expect(screen.getByText('Facturación')).toBeInTheDocument();
    expect(screen.getByText('Servicios')).toBeInTheDocument();
  });

  it('todos los checkboxes son required cuando no hay defaultRoles', () => {
    const { container } = render(<ContactRolesField />);
    const checkboxes = [...container.querySelectorAll('input[type="checkbox"][name="roles"]')] as HTMLInputElement[];
    expect(checkboxes.every(cb => cb.required)).toBe(true);
  });

  it('ningún checkbox es required cuando hay defaultRoles', () => {
    const { container } = render(<ContactRolesField defaultRoles={['customer']} />);
    const checkboxes = [...container.querySelectorAll('input[type="checkbox"][name="roles"]')] as HTMLInputElement[];
    expect(checkboxes.every(cb => !cb.required)).toBe(true);
  });

  it('después de marcar un checkbox, ninguno es required', () => {
    const { container } = render(<ContactRolesField />);
    const checkboxes = [...container.querySelectorAll('input[type="checkbox"][name="roles"]')] as HTMLInputElement[];

    // Inicialmente todos required
    expect(checkboxes.every(cb => cb.required)).toBe(true);

    // Click en el primer checkbox
    fireEvent.click(checkboxes[0]);

    // Después del click, ninguno required
    expect(checkboxes.every(cb => !cb.required)).toBe(true);
  });

  it('después de desmarcar el único checkbox marcado, todos son required nuevamente', () => {
    const { container } = render(<ContactRolesField />);
    const checkboxes = [...container.querySelectorAll('input[type="checkbox"][name="roles"]')] as HTMLInputElement[];

    // Click en el primer checkbox para marcarlo
    fireEvent.click(checkboxes[0]);
    expect(checkboxes.every(cb => !cb.required)).toBe(true);

    // Click nuevamente para desmarcarlo
    fireEvent.click(checkboxes[0]);

    // Vuelven a ser required
    expect(checkboxes.every(cb => cb.required)).toBe(true);
  });
});
