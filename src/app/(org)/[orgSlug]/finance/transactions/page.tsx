import { Suspense } from 'react';
import { FinancialTransactionList } from '@/features/finance/components/FinancialTransactionList';
import { getFinancialTransactions } from '@/features/finance/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transacciones Financieras</h1>
          <p className="text-muted-foreground">Registro de ingresos y gastos de la organización.</p>
        </div>
      </div>

      <Suspense fallback={<div>Cargando transacciones...</div>}>
        <TransactionsListContainer orgId={org.id} />
      </Suspense>
    </div>
  );
}
