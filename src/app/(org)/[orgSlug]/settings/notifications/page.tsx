import NotificationPreferencesForm from '@/features/notifications/components/NotificationPreferencesForm';
import { getOrganization } from '@/features/organizations/queries';
import { getNotificationPreferences } from '@/features/notifications/actions';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export default async function NotificationsSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const prefs = await getNotificationPreferences(org.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${orgSlug}/settings`}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notificaciones</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Elegí qué eventos te notifican en la app.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <NotificationPreferencesForm orgId={org.id} orgSlug={orgSlug} prefs={prefs} />
      </div>
    </div>
  );
}
