import { redirect } from 'next/navigation';

/**
 * `/inventory` no tiene pantalla propia: el módulo vive en `/inventory/items`,
 * que es a donde apunta el menú. Sin esta redirección, recortar la URL o abrir
 * un enlace viejo terminaba en un 404.
 */
export default async function InventoryIndexPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  redirect(`/${orgSlug}/inventory/items`);
}
