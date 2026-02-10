import Link from 'next/link';
import { getInvoices } from '../actions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface InvoiceListProps {
  orgId: string;
  orgSlug: string;
}

export async function InvoiceList({ orgId, orgSlug }: InvoiceListProps) {
  const { data: invoices, error } = await getInvoices(orgId);

  if (error) {
    return <div className="text-destructive">Error cargando facturas: {error}</div>;
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-muted-foreground mb-4">No se encontraron facturas.</p>
        <Button asChild>
          <Link href={`/${orgSlug}/finance/invoices/new`}>
            Crear Primera Factura
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold tracking-tight">Facturas</h2>
        <Button asChild size="sm">
          <Link href={`/${orgSlug}/finance/invoices/new`}>
            Nueva Factura
          </Link>
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium">
                  <Link href={`/${orgSlug}/finance/invoices/${invoice.id}`} className="hover:underline">
                    {invoice.invoice_number}
                  </Link>
                </TableCell>
                <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                <TableCell>{invoice.customer?.name || '-'}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset
                      ${invoice.status === 'paid' ? 'bg-green-50 text-green-700 ring-green-600/20' : ''}
                      ${invoice.status === 'sent' ? 'bg-blue-50 text-blue-700 ring-blue-700/10' : ''}
                      ${invoice.status === 'overdue' ? 'bg-red-50 text-red-700 ring-red-600/10' : ''}
                      ${invoice.status === 'draft' ? 'bg-gray-50 text-gray-600 ring-gray-500/10' : ''}
                      ${invoice.status === 'cancelled' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' : ''}
                    `}
                  >
                    {invoice.status === 'paid' ? 'Pagada' :
                     invoice.status === 'sent' ? 'Enviada' :
                     invoice.status === 'overdue' ? 'Vencida' :
                     invoice.status === 'draft' ? 'Borrador' :
                     invoice.status === 'cancelled' ? 'Cancelada' : invoice.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  ${Number(invoice.total).toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/${orgSlug}/finance/invoices/${invoice.id}`}>
                      Ver
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
