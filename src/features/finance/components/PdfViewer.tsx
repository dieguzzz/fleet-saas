'use client';

import { useState, useEffect } from 'react';

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}&t=${Date.now()}`;

    fetch(proxyUrl)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
        return r.blob();
      })
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Error al cargar el PDF'));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  if (error) {
    return (
      <div className="flex flex-col items-center py-10 gap-3">
        <p className="text-sm text-slate-500">No se pudo mostrar el PDF.</p>
        <p className="text-xs text-red-400 font-mono">{error}</p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
          Abrir en nueva pestaña
        </a>
      </div>
    );
  }

  if (!blobUrl) {
    return <div className="py-10 text-sm text-slate-400 text-center">Cargando PDF...</div>;
  }

  return (
    <iframe
      src={blobUrl}
      className="w-full"
      style={{ height: '640px', border: 'none' }}
      title="Vista previa del PDF"
    />
  );
}
