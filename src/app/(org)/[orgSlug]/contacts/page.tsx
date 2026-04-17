import { Suspense } from 'react';
import ContactList from '@/features/contacts/components/ContactList';
import { getContacts } from '@/features/contacts/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonRow } from '@/components/ui/skeleton';

export default async function ContactsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const { data: contacts } = await getContacts(org.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contactos"
        description="Directorio de clientes, proveedores y otros contactos."
        action={
          <Link href={`/${orgSlug}/contacts/new`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            + Nuevo Contacto
          </Link>
        }
      />
      <Suspense fallback={<div className="space-y-2">{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</div>}>
        <ContactList orgSlug={orgSlug} contacts={contacts || []} />
      </Suspense>
    </div>
  );
}
