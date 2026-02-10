import Link from 'next/link';
import { getInventoryItems } from '../actions';

interface InventoryListProps {
  orgId: string;
  orgSlug: string;
}

export async function InventoryList({ orgId, orgSlug }: InventoryListProps) {
  const { data: items, error } = await getInventoryItems(orgId);

  if (error) {
    return <div className="text-red-500">Error loading inventory: {error}</div>;
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-50 rounded-lg border border-dashed border-slate-300">
        <p className="text-slate-500 mb-4">No se encontraron ítems de inventario.</p>
        <Link
          href={`/${orgSlug}/inventory/items/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Agregar Primer Ítem
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-800">Inventario</h2>
        <Link
          href={`/${orgSlug}/inventory/items/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
        >
          Agregar Ítem
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium uppercase text-xs">
            <tr>
              <th className="px-6 py-3">Nombre</th>
              <th className="px-6 py-3">SKU</th>
              <th className="px-6 py-3">Categoría</th>
              <th className="px-6 py-3 text-right">Existencia</th>
              <th className="px-6 py-3 text-right">Costo Unit.</th>
              <th className="px-6 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">
                  <Link href={`/${orgSlug}/inventory/items/${item.id}`} className="hover:underline">
                    {item.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-500">{item.sku || '-'}</td>
                <td className="px-6 py-4">{item.category || '-'}</td>
                <td className="px-6 py-4 text-right">
                  <span
                    className={`font-semibold ${
                      (item.current_stock || 0) <= (item.min_stock_level || 0)
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {item.current_stock}
                  </span>{' '}
                  <span className="text-xs text-gray-400">{item.unit}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  ${Number(item.cost_per_unit || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <Link
                    href={`/${orgSlug}/inventory/items/${item.id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Detalles
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
