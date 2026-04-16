'use client';

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const viewerUrl = `https://docs.google.com/gviewer?url=${encodeURIComponent(url)}&embedded=true`;

  return (
    <iframe
      src={viewerUrl}
      title="Vista previa del PDF"
      className="w-full border-0"
      style={{ height: '700px' }}
    />
  );
}
