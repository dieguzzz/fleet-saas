// Adjuntos en buckets privados: se guardan como PATH (ej. "<orgId>/.../archivo.ext")
// y se ven/descargan por el proxy same-origin /api/pdf-proxy, que descarga el
// objeto con la sesión del usuario (RLS org-scoped) y lo sirve inline. Así los
// buckets pueden ser privados sin filtrar el archivo a cualquiera con la URL.
// Acepta también URLs públicas legacy (el proxy extrae el path).

export function storageProxyUrl(bucket: string, pathOrUrl: string): string {
  return `/api/pdf-proxy?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(pathOrUrl)}`;
}

// Wrapper para el bucket de facturas (default histórico del proxy).
export function invoiceAttachmentProxyUrl(pathOrUrl: string): string {
  return storageProxyUrl('invoice-attachments', pathOrUrl);
}
