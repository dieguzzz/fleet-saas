'use client';

import { useEffect, useRef, useState } from 'react';

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  // Keep a ref so the blob URL stays alive until the next load or unmount
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    setStatus('loading');
    setBlobUrl(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        // Revoke previous blob if any
        if (blobRef.current) URL.revokeObjectURL(blobRef.current);
        const blob = new Blob([buffer], { type: 'application/pdf' });
        const objectUrl = URL.createObjectURL(blob);
        blobRef.current = objectUrl;
        setBlobUrl(objectUrl);
        setStatus('ready');
      })
      .catch(() => setStatus('error'));

    return () => {
      // Delay revoke so the embed has time to finish reading the blob
      const current = blobRef.current;
      if (current) {
        setTimeout(() => URL.revokeObjectURL(current), 5000);
        blobRef.current = null;
      }
    };
  }, [url]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50">
        <p className="text-sm text-slate-400">Cargando PDF...</p>
      </div>
    );
  }

  if (status === 'error' || !blobUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-slate-50 gap-3">
        <p className="text-sm text-slate-500">No se pudo mostrar el PDF.</p>
        <a href={url} download className="text-sm text-blue-600 hover:underline font-medium">
          Descargar archivo
        </a>
      </div>
    );
  }

  return (
    <object
      data={blobUrl}
      type="application/pdf"
      className="w-full"
      style={{ height: '640px' }}
    >
      {/* Fallback si el browser no soporta object/PDF */}
      <div className="flex flex-col items-center justify-center h-48 bg-slate-50 gap-3">
        <p className="text-sm text-slate-500">Tu navegador no puede mostrar PDFs inline.</p>
        <a href={url} download className="text-sm text-blue-600 hover:underline font-medium">
          Descargar archivo
        </a>
      </div>
    </object>
  );
}
