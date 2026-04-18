import InvoiceDetail from '@/features/finance/components/InvoiceDetail';
import { getInvoice } from '@/features/finance/actions';
import { createClient } from '@/services/supabase/server';
import { notFound } from 'next/navigation';

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ orgSlug: string; invoiceId: string }>;
}) {
  const { orgSlug, invoiceId } = await params;

  const supabase = await createClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!org) notFound();
  const orgId = (org as unknown as { id: string }).id;

  const { data: invoice } = await getInvoice(invoiceId, orgId);

  if (!invoice) {
    notFound();
  }

  return <InvoiceDetail orgSlug={orgSlug} invoice={invoice as any} />;
}
