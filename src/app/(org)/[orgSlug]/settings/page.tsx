import OrganizationSettingsForm from '@/features/settings/components/OrganizationSettingsForm';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground mt-0.5">
          Administra la configuración general de tu organización.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <OrganizationSettingsForm orgSlug={orgSlug} orgName={org.name} />
      </div>
    </div>
  );
}
