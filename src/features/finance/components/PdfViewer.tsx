'use client';

import { invoiceAttachmentProxyUrl } from '@/lib/attachments';

interface PdfViewerProps {
  url: string;
}

// REGLA 12: usar <object> con el proxy same-origin (Content-Type application/pdf,
// sin X-Frame-Options). NUNCA blob URL en el cliente — falla por CORS o por el
// timing de revokeObjectURL. El servidor hace el fetch y sirve desde el mismo origin.
export function PdfViewer({ url }: PdfViewerProps) {
  const proxyUrl = invoiceAttachmentProxyUrl(url);

  return (
    <object
      data={proxyUrl}
      type="application/pdf"
      className="w-full"
      style={{ height: '640px' }}
    >
      <div className="flex flex-col items-center py-10 gap-3">
        <p className="text-sm text-muted-foreground">No se pudo mostrar el PDF en el navegador.</p>
        <a href={proxyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
          Abrir en nueva pestaña
        </a>
      </div>
    </object>
  );
}
