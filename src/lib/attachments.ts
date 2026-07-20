// Adjuntos de factura: se guardan como PATH del bucket privado
// `invoice-attachments` (ej. "<orgId>/invoices/<invoiceId>.pdf"). Para verlos o
// descargarlos se usa el proxy same-origin, que descarga el objeto con la sesión
// del usuario (RLS org-scoped) y lo sirve inline — así el bucket puede ser
// privado y no se filtra el archivo a cualquiera con la URL.
//
// Acepta también URLs públicas legacy (facturas viejas): el proxy extrae el path.
export function invoiceAttachmentProxyUrl(pathOrUrl: string): string {
  return `/api/pdf-proxy?path=${encodeURIComponent(pathOrUrl)}`;
}
