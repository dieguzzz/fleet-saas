import Link from 'next/link';
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

  // Get user's first org for the "back" link
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: membership } = await (supabase as any)
    .from('organization_members')
    .select('organization:organizations(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  const backHref = membership?.organization?.slug
    ? `/${membership.organization.slug}`
    : '/select-org';

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-purple-900 border-b border-purple-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg
                className="text-white"
                style={{ width: 22, height: 22 }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-semibold">Merlin — Super Admin</h1>
              <p className="text-purple-300 text-sm">{profile.email}</p>
            </div>
          </div>
          <Link
            href={backHref}
            className="text-purple-300 hover:text-white transition-colors text-sm"
          >
            ← Volver a la App
          </Link>
        </div>
      </header>

      {/* Admin Content */}
      <main className="p-6">{children}</main>
    </div>
  );
}
