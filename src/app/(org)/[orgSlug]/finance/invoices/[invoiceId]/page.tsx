import InvoiceDetail from '@/features/finance/components/InvoiceDetail';
import { getInvoice } from '@/features/finance/actions';
import { notFound } from 'next/navigation';

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ orgSlug: string; invoiceId: string }>;
}) {
  const { orgSlug, invoiceId } = await params;
  const { data: invoice } = await getInvoice(invoiceId);

  if (!invoice) {
    notFound();
  }

  // Cast invoice to any to bypass strict type check between DB Json and component interface
  // The component handles null/empty checks safely
  return <InvoiceDetail orgSlug={orgSlug} invoice={invoice as any} />;
}
