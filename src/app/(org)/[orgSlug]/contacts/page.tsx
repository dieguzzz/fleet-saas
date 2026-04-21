import { getContacts } from '@/features/contacts/actions';
import { getOrganization } from '@/features/organizations/queries';
import ContactsTabView from '@/features/contacts/components/ContactsTabView';
import { PageHeader } from '@/components/ui/page-header';
import { notFound } from 'next/navigation';
import type { Contact } from '@/types/database';

export default async function ContactsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const { data } = await getContacts(org.id);
  const contacts = (data as unknown as Contact[] | null) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contactos"
        description="Clientes, proveedores y servicios de tu organización."
      />
      <ContactsTabView orgSlug={orgSlug} contacts={contacts} />
    </div>
  );
}
