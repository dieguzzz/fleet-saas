'use client';

import Link from 'next/link';

interface Contact {
  id: string;
  name: string;
  role?: string | null;
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
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-slate-500 mb-4">No se encontraron contactos.</p>
        <Link
          href={`/${orgSlug}/contacts/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Agregar Primer Contacto
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">Rol</th>
              <th className="px-6 py-3">Empresa</th>
              <th className="px-6 py-3">Contacto</th>
              <th className="px-6 py-3 text-center">Emergencia</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{contact.name}</td>
                <td className="px-6 py-4 capitalize">
                  {contact.role === 'driver' ? 'Conductor' :
                   contact.role === 'supplier' ? 'Proveedor' :
                   contact.role === 'customer' ? 'Cliente' :
                   contact.role === 'mechanic' ? 'Mecánico' : contact.role || '-'}
                </td>
                <td className="px-6 py-4">{contact.company || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs">
                    {contact.email && <span>{contact.email}</span>}
                    {contact.phone && <span>{contact.phone}</span>}
                    {!contact.email && !contact.phone && <span className="text-gray-400">-</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {contact.is_emergency ? (
                    <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
                      Sí
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
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
