import ProfileForm from '@/features/profile/components/ProfileForm';
import { createClient } from '@/services/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/login');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi perfil</h1>
        <p className="text-muted-foreground mt-0.5">Administrá tu información personal y contraseña.</p>
      </div>
      <ProfileForm profile={profile} />
    </div>
  );
}
