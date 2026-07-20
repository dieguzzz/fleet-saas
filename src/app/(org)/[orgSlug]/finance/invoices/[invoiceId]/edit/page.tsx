import { InvoiceForm } from '@/features/finance/components/InvoiceForm';
import { getInvoice, getInvoiceLineItems } from '@/features/finance/actions';
import { getCustomersAndSuppliers } from '@/features/contacts/actions';
import { getProducts } from '@/features/products/actions';
import { getOrganization } from '@/features/organizations/queries';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Invoice, OrgType } from '@/types/database';

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ orgSlug: string; invoiceId: string }>;
}) {
  const { orgSlug, invoiceId } = await params;

  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const headersList = await headers();
  const orgType = (headersList.get('x-org-type') as OrgType) || 'fleet';

  const [{ data: invoice }, { data: contactsRaw }] = await Promise.all([
    getInvoice(invoiceId, org.id),
    getCustomersAndSuppliers(org.id),
  ]);
  if (!invoice) notFound();

  const invoiceType = (invoice as Invoice & { invoice_type?: string }).invoice_type === 'pago' ? 'pago' : 'cobro';
  const role = invoiceType === 'cobro' ? 'customer' : 'supplier';
  const contacts = (contactsRaw ?? [])
    .flatMap(c => c.role === role ? [{ id: c.id, name: c.name, company: c.company }] : []);

  const products = orgType === 'kitchen' ? (await getProducts(org.id)).data ?? [] : [];

  // Cargar las líneas de producto existentes para que la edición no arranque vacía
  // y no las pierda al guardar (solo aplica a orgs tipo cocina).
  const lineItemsResult = orgType === 'kitchen' ? await getInvoiceLineItems(invoiceId) : null;
  const initialLineItems = lineItemsResult && 'data' in lineItemsResult
    ? (lineItemsResult.data ?? []).map((li) => ({
        product_id: li.product_id ?? null,
        description: li.description,
        quantity: li.quantity,
        unit_price: li.unit_price,
      }))
    : [];

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
        orgType={orgType}
        products={products}
        initialLineItems={initialLineItems}
      />
    </div>
  );
}
