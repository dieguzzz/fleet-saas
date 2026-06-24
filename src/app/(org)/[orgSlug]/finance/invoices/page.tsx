import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { headers } from 'next/headers';
import { InvoiceList } from '@/features/finance/components/InvoiceList';
import { getSalesByProduct } from '@/features/finance/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonRow } from '@/components/ui/skeleton';
import InvoiceScanner from '@/features/finance/components/InvoiceScanner';
import SalesByProductReport from '@/features/finance/components/SalesByProductReport';
import type { OrgType } from '@/types/database';

export const metadata: Metadata = { title: 'Facturas — Merlin' };

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { orgSlug } = await params;
  const { tab } = await searchParams;

  const headersList = await headers();
  const orgType = (headersList.get('x-org-type') as OrgType) || 'fleet';

  const validTabs = orgType === 'kitchen' ? ['cobros', 'pagos', 'productos'] : ['cobros', 'pagos'];
  const activeTab = validTabs.includes(tab ?? '') ? (tab as string) : 'cobros';

  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Facturas"
        description="Gestiona tus cobros y pagos"
        action={
          <div className="flex items-center gap-2">
            <InvoiceScanner orgSlug={orgSlug} />
            <Link
              href={`/${orgSlug}/finance/invoices/new?type=${activeTab === 'pagos' ? 'pago' : 'cobro'}`}
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva {activeTab === 'pagos' ? 'Factura de Pago' : 'Factura de Cobro'}
            </Link>
          </div>
        }
      />

      <div className="border-b border-border">
        <nav className="flex gap-1 -mb-px">
          <Link
            href={`/${orgSlug}/finance/invoices?tab=cobros`}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cobros'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Cobros
            </span>
          </Link>
          <Link
            href={`/${orgSlug}/finance/invoices?tab=pagos`}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pagos'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
              Pagos
            </span>
          </Link>
          {orgType === 'kitchen' && (
            <Link
              href={`/${orgSlug}/finance/invoices?tab=productos`}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'productos'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Ventas por Producto
              </span>
            </Link>
          )}
        </nav>
      </div>

      {activeTab === 'productos' ? (
        <Suspense fallback={<div className="space-y-2">{[1,2,3].map(i=><SkeletonRow key={i}/>)}</div>}>
          <SalesByProductSection orgId={org.id} />
        </Suspense>
      ) : (
        <Suspense fallback={<div className="space-y-2">{[1,2,3].map(i=><SkeletonRow key={i}/>)}</div>}>
          <InvoiceList orgId={org.id} orgSlug={org.slug} type={activeTab === 'pagos' ? 'pago' : 'cobro'} />
        </Suspense>
      )}
    </div>
  );
}

async function SalesByProductSection({ orgId }: { orgId: string }) {
  const { data } = await getSalesByProduct(orgId);
  return <SalesByProductReport data={data ?? []} />;
}
