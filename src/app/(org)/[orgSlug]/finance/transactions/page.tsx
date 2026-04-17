import { Suspense } from 'react';
import { FinancialTransactionList } from '@/features/finance/components/FinancialTransactionList';
import { getFinancialTransactions } from '@/features/finance/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/ui/page-header';
import { SkeletonRow } from '@/components/ui/skeleton';

async function TransactionsListContainer({ orgId }: { orgId: string }) {
  const { data: transactions, error } = await getFinancialTransactions(orgId);

  if (error) {
    return <div className="text-red-500">Error cargando transacciones: {error}</div>;
  }

  return <FinancialTransactionList transactions={transactions || []} orgId={orgId} />;
}

export default async function TransactionsPage({
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
      <PageHeader
        title="Transacciones Financieras"
        description="Registro de ingresos y gastos de la organización."
      />
      <Suspense fallback={<div className="space-y-2">{[1,2,3,4].map(i=><SkeletonRow key={i}/>)}</div>}>
        <TransactionsListContainer orgId={org.id} />
      </Suspense>
    </div>
  );
}
