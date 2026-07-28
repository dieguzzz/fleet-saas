import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ContactsTabView from './ContactsTabView';
import type { Contact } from '@/types/database';

function makeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 'c1',
    organization_id: 'org-1',
    name: 'Contacto Uno',
    roles: ['customer'],
    company: null,
    phone: null,
    email: null,
    address: null,
    notes: null,
    tax_id: null,
    is_emergency: null,
    metadata: null,
    created_at: null,
    updated_at: null,
    ...overrides,
  };
}

describe('ContactsTabView', () => {
  it('muestra en Clientes a los que tienen ese rol', () => {
    render(<ContactsTabView orgSlug="amd" contacts={[makeContact({ name: 'Ana' })]} />);
    expect(screen.getByText('Ana')).toBeInTheDocument();
  });

  it('cuenta al contacto cliente-y-proveedor en las dos pestañas', () => {
    const contacts = [
      makeContact({ id: 'a', name: 'Ambos', roles: ['customer', 'supplier'] }),
      makeContact({ id: 'b', name: 'Solo cliente', roles: ['customer'] }),
    ];
    render(<ContactsTabView orgSlug="amd" contacts={contacts} />);
    // Clientes: Ambos + Solo cliente = 2. Proveedores: Ambos = 1.
    expect(screen.getByRole('button', { name: /Clientes/ }).textContent).toContain('2');
    expect(screen.getByRole('button', { name: /Proveedores/ }).textContent).toContain('1');
  });

  it('no muestra en Clientes a un contacto que solo es proveedor', () => {
    const contacts = [makeContact({ id: 'p', name: 'Solo proveedor', roles: ['supplier'] })];
    render(<ContactsTabView orgSlug="amd" contacts={contacts} />);
    expect(screen.queryByText('Solo proveedor')).toBeNull();
  });

  it('un contacto sin roles no aparece en ninguna pestaña', () => {
    const contacts = [makeContact({ id: 'v', name: 'Sin roles', roles: [] })];
    render(<ContactsTabView orgSlug="amd" contacts={contacts} />);
    expect(screen.queryByText('Sin roles')).toBeNull();
  });
});
