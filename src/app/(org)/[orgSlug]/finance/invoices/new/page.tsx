import { InvoiceForm } from '@/features/finance/components/InvoiceForm';
import { getOrganization } from '@/features/organizations/queries';
import { getCustomersAndSuppliers } from '@/features/contacts/actions';
import { getProducts } from '@/features/products/actions';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { OrgType } from '@/types/database';

function dgiDateToISO(d?: string): string | undefined {
  if (!d) return undefined;
  const [day, month, year] = d.split('/');
  if (day && month && year) return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  return undefined;
}

export default async function NewInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{
    type?: string;
    amount?: string;
    date?: string;
    ruc?: string;
    cufe?: string;
    dgi_url?: string;
    qr_data?: string;
  }>;
}) {
  const { orgSlug } = await params;
  const { type, amount, date, ruc, cufe, dgi_url, qr_data } = await searchParams;
  const invoiceType = type === 'pago' ? 'pago' : 'cobro';

  const org = await getOrganization(orgSlug);
  if (!org) notFound();

  const headersList = await headers();
  const orgType = (headersList.get('x-org-type') as OrgType) || 'fleet';

  const { data: contactsRaw } = await getCustomersAndSuppliers(org.id);
  const role = invoiceType === 'cobro' ? 'customer' : 'supplier';
  const contacts = (contactsRaw ?? [])
    .flatMap(c => c.role === role ? [{ id: c.id, name: c.name, company: c.company, tax_id: c.tax_id ?? null }] : []);

  const products = orgType === 'kitchen' ? (await getProducts(org.id)).data ?? [] : [];

  const scannerData = (ruc || cufe || dgi_url) ? {
    ruc,
    cufe,
    dgi_url,
    qr_data,
    date: dgiDateToISO(date) ?? date,
    amount,
  } : undefined;

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-foreground">
        Nueva Factura de {invoiceType === 'cobro' ? 'Cobro' : 'Pago'}
      </h1>
      <InvoiceForm
        orgId={org.id}
        orgSlug={orgSlug}
        invoiceType={invoiceType as 'cobro' | 'pago'}
        contacts={contacts}
        scannerData={scannerData}
        orgType={orgType}
        products={products}
      />
    </div>
  );
}
