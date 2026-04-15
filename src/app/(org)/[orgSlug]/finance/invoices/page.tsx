import { Suspense } from 'react';
import Link from 'next/link';
import { InvoiceList } from '@/features/finance/components/InvoiceList';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

export default async function InvoicesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { orgSlug } = await params;
  const { tab } = await searchParams;
  const activeTab = tab === 'pagos' ? 'pagos' : 'cobros';

  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-slate-800">Facturas</h1>
          <p className="text-sm text-slate-500 mt-1">Gestiona tus cobros y pagos</p>
        </div>
        <Link
          href={`/${orgSlug}/finance/invoices/new?type=${activeTab === 'pagos' ? 'pago' : 'cobro'}`}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva {activeTab === 'pagos' ? 'Factura de Pago' : 'Factura de Cobro'}
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1 -mb-px">
          <Link
            href={`/${orgSlug}/finance/invoices?tab=cobros`}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'cobros'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
              </svg>
              Cobros
            </span>
          </Link>
          <Link
            href={`/${orgSlug}/finance/invoices?tab=pagos`}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pagos'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
              </svg>
              Pagos
            </span>
          </Link>
        </nav>
      </div>

      {/* List */}
      <Suspense fallback={<InvoiceListSkeleton />}>
        <InvoiceList orgId={org.id} orgSlug={org.slug} type={activeTab === 'pagos' ? 'pago' : 'cobro'} />
      </Suspense>
    </div>
  );
}

function InvoiceListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}
