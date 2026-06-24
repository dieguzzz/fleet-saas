'use client';

import { Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Org {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export default function SelectOrgClient({ orgs }: { orgs: Org[] }) {
  const { push } = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">¿A qué empresa ingresás?</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Tu cuenta tiene acceso a varias empresas.
          </p>
        </div>

        <div className="space-y-3">
          {orgs.map((org) => (
            <button
              key={org.id}
              onClick={() => push(`/${org.slug}`)}
              className="w-full flex items-center gap-4 bg-card border border-border rounded-xl p-4 hover:bg-accent transition-colors text-left"
            >
              <div className="size-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
                <Building2 className="size-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{org.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{org.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
