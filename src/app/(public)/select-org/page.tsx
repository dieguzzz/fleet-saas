import { redirect } from 'next/navigation';
import { createClient } from '@/services/supabase/server';
import SelectOrgClient from './SelectOrgClient';

export default async function SelectOrgPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('role, organization:organizations(id, name, slug)')
    .eq('user_id', user.id);

  const orgs = (memberships ?? [])
    .map((m: { role: string; organization: { id: string; name: string; slug: string } | null }) =>
      m.organization ? { ...m.organization, role: m.role } : null
    )
    .filter(Boolean) as { id: string; name: string; slug: string; role: string }[];

  if (orgs.length === 0) redirect('/onboarding');
  if (orgs.length === 1) redirect(`/${orgs[0].slug}`);

  return <SelectOrgClient orgs={orgs} />;
}
