import { Suspense } from 'react';
import ContactList from '@/features/contacts/components/ContactList';
import { getContacts } from '@/features/contacts/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function ContactsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    notFound();
  }

  const { data: contacts } = await getContacts(org.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contactos</h1>
          <p className="text-muted-foreground">
            Directorio de clientes, proveedores y otros contactos.
          </p>
        </div>
        <Link
          href={`/${orgSlug}/contacts/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Nuevo Contacto
        </Link>
      </div>

      <Suspense fallback={<div>Cargando contactos...</div>}>
        <ContactList orgSlug={orgSlug} contacts={contacts || []} />
      </Suspense>
    </div>
  );
}
