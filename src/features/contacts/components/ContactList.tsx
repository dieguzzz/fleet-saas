'use client';

import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';
import { roleLabels } from '@/features/contacts/lib';
import type { ContactRole } from '@/types/database';

interface Contact {
  id: string;
  name: string;
  roles: ContactRole[];
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  is_emergency?: boolean | null;
}

interface ContactListProps {
  orgSlug: string;
  contacts: Contact[];
}

export default function ContactList({ orgSlug, contacts }: ContactListProps) {
  if (contacts.length === 0) {
    return (
      <EmptyState
        icon="👤"
        title="Sin contactos"
        description="No se encontraron contactos."
        action={<Link href={`/${orgSlug}/contacts/new`} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">Agregar Primer Contacto</Link>}
      />
    );
  }

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="bg-muted/50 text-muted-foreground font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Rol</th>
              <th className="px-6 py-3">Empresa</th>
              <th className="px-6 py-3">Contacto</th>
              <th className="px-6 py-3 text-center">Emergencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{contact.name}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {roleLabels(contact).map((label) => (
                      <span
                        key={label}
                        className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                      >
                        {label}
                      </span>
                    ))}
                    {contact.roles.length === 0 && <span className="text-muted-foreground">-</span>}
                  </div>
                </td>
                <td className="px-6 py-4">{contact.company || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.phone && <span>{contact.phone}</span>}
                    {!contact.email && !contact.phone && <span className="text-muted-foreground/50">-</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {contact.is_emergency ? (
                    <span className="bg-destructive/10 text-destructive text-xs px-2 py-1 rounded-full font-medium">Sí</span>
                  ) : (
                    <span className="text-muted-foreground/30">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
