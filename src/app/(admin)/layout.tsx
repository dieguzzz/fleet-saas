import { createClient } from '@/services/supabase/server';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('is_super_admin, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile?.is_super_admin) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Admin Header */}
      <header className="bg-purple-900 border-b border-purple-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">⚡</span>
            </div>
            <div>
              <h1 className="text-white font-semibold">Super Admin Panel</h1>
              <p className="text-purple-300 text-sm">{profile.email}</p>
            </div>
          </div>
          <a
            href="/"
            className="text-purple-300 hover:text-white transition-colors text-sm"
          >
            ← Volver a la App
          </a>
        </div>
      </header>

      {/* Admin Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
