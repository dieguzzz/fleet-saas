import Link from 'next/link';
import { getInvoices } from '../actions';

interface InvoiceListProps {
  orgId: string;
}

export async function InvoiceList({ orgId }: InvoiceListProps) {
  const { data: invoices, error } = await getInvoices(orgId);

  if (error) {
    return <div className="text-red-500">Error cargando facturas: {error}</div>;
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-slate-500 mb-4">No se encontraron facturas.</p>
        <Link
          href={`/${orgId}/finance/invoices/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Crear Primera Factura
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Facturas</h2>
        <Link
          href={`/${orgId}/finance/invoices/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Nueva Factura
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Número</th>
              <th className="px-6 py-3">Fecha</th>
              <th className="px-6 py-3">Cliente</th>
              <th className="px-6 py-3">Estado</th>
              <th className="px-6 py-3 text-right">Total</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Link href={`/${orgId}/finance/invoices/${invoice.id}`} className="hover:underline">
                    {invoice.invoice_number}
                  </Link>
                </td>
                <td className="px-6 py-4">{new Date(invoice.date).toLocaleDateString()}</td>
                <td className="px-6 py-4">{invoice.customer?.name || '-'}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold
                      ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : ''}
                      ${invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' : ''}
                      ${invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : ''}
                      ${invoice.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                      ${invoice.status === 'cancelled' ? 'bg-yellow-100 text-yellow-800' : ''}
                    `}
                  >
                    {invoice.status === 'paid' ? 'Pagada' :
                     invoice.status === 'sent' ? 'Enviada' :
                     invoice.status === 'overdue' ? 'Vencida' :
                     invoice.status === 'draft' ? 'Borrador' :
                     invoice.status === 'cancelled' ? 'Cancelada' : invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  ${Number(invoice.total).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/${orgId}/finance/invoices/${invoice.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
