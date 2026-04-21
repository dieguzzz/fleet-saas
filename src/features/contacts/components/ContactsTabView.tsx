'use client';

import { useState, useMemo, useTransition } from 'react';
import { deleteContact } from '../actions';
import ContactModal from './ContactModal';
import {
  CONTACT_ROLE_LABELS,
  SERVICE_ROLES,
  SERVICE_ROLE_COLORS,
  type Contact,
} from '@/types/database';

type Tab = 'clientes' | 'proveedores' | 'servicios';

const TAB_CONFIG: { id: Tab; label: string; roles: string[] }[] = [
  { id: 'clientes', label: 'Clientes', roles: ['customer'] },
  { id: 'proveedores', label: 'Proveedores', roles: ['supplier'] },
  { id: 'servicios', label: 'Servicios', roles: [...SERVICE_ROLES, 'driver'] },
];

function getDefaultRole(tab: Tab): string {
  if (tab === 'clientes') return 'customer';
  if (tab === 'proveedores') return 'supplier';
  return 'mechanic';
}

function highlight(text: string, query: string) {
  if (!query) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-amber-200 dark:bg-amber-800/60 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

function DeleteButton({ contactId, orgSlug }: { contactId: string; orgSlug: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => { if (confirm('¿Eliminar este contacto?')) startTransition(() => deleteContact(contactId, orgSlug)); }}
      disabled={isPending}
      className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
  );
}

function ContactsTable({ contacts, orgSlug, search }: { contacts: Contact[]; orgSlug: string; search: string }) {
  if (contacts.length === 0) {
    return <p className="text-center py-10 text-sm text-muted-foreground">Sin contactos en esta categoría.</p>;
  }
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">Teléfono</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {contacts.map(c => (
              <tr key={c.id} className="hover:bg-accent/30 transition-colors">
                <td className="px-4 py-3 font-medium text-foreground">{highlight(c.name, search)}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.company ? highlight(c.company, search) : '—'}</td>
                <td className="px-4 py-3">
                  {c.phone
                    ? <a href={`tel:${c.phone}`} className="text-blue-600 hover:underline">{c.phone}</a>
                    : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{c.email || '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <ContactModal orgSlug={orgSlug} contact={c} trigger={
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    } />
                    <DeleteButton contactId={c.id} orgSlug={orgSlug} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServicioCard({ contact, orgSlug, search }: { contact: Contact; orgSlug: string; search: string }) {
  const roleColor = SERVICE_ROLE_COLORS[contact.role ?? 'other'] ?? SERVICE_ROLE_COLORS.other;
  const roleLabel = CONTACT_ROLE_LABELS[contact.role ?? 'other'] ?? contact.role ?? 'Otro';

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${roleColor}`}>{roleLabel}</span>
          {contact.is_emergency && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
              Emergencia 24hs
            </span>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <ContactModal orgSlug={orgSlug} contact={contact} trigger={
            <button className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          } />
          <DeleteButton contactId={contact.id} orgSlug={orgSlug} />
        </div>
      </div>

      <div>
        <p className="font-semibold text-foreground">{highlight(contact.name, search)}</p>
        {contact.company && <p className="text-xs text-muted-foreground">{highlight(contact.company, search)}</p>}
      </div>

      {contact.phone && (
        <a href={`tel:${contact.phone}`}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-sm">{contact.phone}</span>
        </a>
      )}

      {contact.address && (
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {contact.address}
        </p>
      )}

      {contact.notes && (
        <p className="text-xs text-muted-foreground line-clamp-2">{contact.notes}</p>
      )}
    </div>
  );
}

function ServiciosGrid({ contacts, orgSlug, search }: { contacts: Contact[]; orgSlug: string; search: string }) {
  if (contacts.length === 0) {
    return <p className="text-center py-10 text-sm text-muted-foreground">Sin servicios registrados.</p>;
  }
  const sorted = [...contacts].sort((a, b) => {
    if (a.is_emergency && !b.is_emergency) return -1;
    if (!a.is_emergency && b.is_emergency) return 1;
    return a.name.localeCompare(b.name);
  });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sorted.map(c => <ServicioCard key={c.id} contact={c} orgSlug={orgSlug} search={search} />)}
    </div>
  );
}

export default function ContactsTabView({ orgSlug, contacts }: { orgSlug: string; contacts: Contact[] }) {
  const [activeTab, setActiveTab] = useState<Tab>('clientes');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const tabConfig = TAB_CONFIG.find(t => t.id === activeTab)!;
    const byTab = contacts.filter(c => tabConfig.roles.includes(c.role ?? 'other'));
    if (!search.trim()) return byTab;
    const q = search.toLowerCase();
    return byTab.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.company ?? '').toLowerCase().includes(q) ||
      (c.phone ?? '').includes(q) ||
      (c.email ?? '').toLowerCase().includes(q)
    );
  }, [contacts, activeTab, search]);

  const counts = useMemo(() =>
    Object.fromEntries(TAB_CONFIG.map(t => [t.id, contacts.filter(c => t.roles.includes(c.role ?? 'other')).length])),
  [contacts]);

  return (
    <div className="space-y-4">
      {/* Header: tabs + search + nuevo */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
          {TAB_CONFIG.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
              {counts[tab.id] > 0 && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-muted text-muted-foreground' : 'bg-muted/60 text-muted-foreground'
                }`}>{counts[tab.id]}</span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-1">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="field-input pl-9"
            />
          </div>

          <ContactModal
            orgSlug={orgSlug}
            defaultRole={getDefaultRole(activeTab)}
            trigger={
              <button className="shrink-0 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                + Nuevo
              </button>
            }
          />
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'servicios'
        ? <ServiciosGrid contacts={filtered} orgSlug={orgSlug} search={search} />
        : <ContactsTable contacts={filtered} orgSlug={orgSlug} search={search} />
      }
    </div>
  );
}
