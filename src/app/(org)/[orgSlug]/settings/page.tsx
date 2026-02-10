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

  if (!org) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
          <p className="text-muted-foreground">
            Administra la configuración general de tu organización.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <OrganizationSettingsForm orgSlug={orgSlug} orgName={org.name} />
      </div>
    </div>
  );
}
