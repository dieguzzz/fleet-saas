'use client';

import { useEffect, useState } from 'react';

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;

    async function fetchPdf() {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('fetch failed');
        const buffer = await res.arrayBuffer();
        const blob = new Blob([buffer], { type: 'application/pdf' });
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchPdf();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-sm text-slate-400">Cargando PDF...</p>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-40 bg-slate-50 rounded-lg border border-slate-200 gap-3">
        <p className="text-sm text-slate-500">No se pudo mostrar el PDF en el navegador.</p>
        <a
          href={url}
          download
          className="text-sm text-blue-600 hover:underline"
        >
          Descargar PDF
        </a>
      </div>
    );
  }

  return (
    <embed
      src={blobUrl}
      type="application/pdf"
      className="w-full rounded-b-lg"
      style={{ height: '600px' }}
    />
  );
}
