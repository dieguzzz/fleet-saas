'use client';

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;

  return (
    <iframe
      src={proxyUrl}
      title="Vista previa del PDF"
      className="w-full border-0"
      style={{ height: '700px' }}
    />
  );
}
