'use client';

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;

  return (
    <object
      data={proxyUrl}
      type="application/pdf"
      className="w-full"
      style={{ height: '640px' }}
    >
      {/* Fallback para browsers que no renderizan PDFs inline */}
      <div className="flex flex-col items-center justify-center h-48 bg-slate-50 gap-3">
        <p className="text-sm text-slate-500">Tu navegador no puede mostrar PDFs inline.</p>
        <a href={url} download className="text-sm text-blue-600 hover:underline font-medium">
          Descargar archivo
        </a>
      </div>
    </object>
  );
}
