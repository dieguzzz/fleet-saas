import { InvoiceForm } from '@/features/finance/components/InvoiceForm';
import { getInvoice } from '@/features/finance/actions';
import { getCustomersAndSuppliers } from '@/features/contacts/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import type { Invoice } from '@/types/database';

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ orgSlug: string; invoiceId: string }>;
}) {
  const { orgSlug, invoiceId } = await params;

  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const [{ data: invoice }, { data: contactsRaw }] = await Promise.all([
    getInvoice(invoiceId, org.id),
    getCustomersAndSuppliers(org.id),
  ]);
  if (!invoice) notFound();

  const invoiceType = (invoice as Invoice & { invoice_type?: string }).invoice_type === 'pago' ? 'pago' : 'cobro';
  const role = invoiceType === 'cobro' ? 'customer' : 'supplier';
  const contacts = (contactsRaw ?? [])
    .filter(c => c.role === role)
    .map(c => ({ id: c.id, name: c.name, company: c.company }));

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-foreground">
        Editar Factura {invoice.invoice_number}
      </h1>
      <InvoiceForm
        orgId={org.id}
        orgSlug={orgSlug}
        invoiceType={invoiceType as 'cobro' | 'pago'}
        invoice={invoice as Invoice}
        contacts={contacts}
      />
    </div>
  );
}
