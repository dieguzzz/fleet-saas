'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker de PDF.js vía CDN (no requiere configuración de webpack)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState(false);

  // El proxy evita problemas de CORS con Supabase storage
  const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 bg-slate-50">
        <p className="text-sm text-slate-500">No se pudo mostrar el PDF.</p>
        <a href={url} download className="text-sm text-blue-600 hover:underline font-medium">
          Descargar archivo
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-slate-100 py-4 gap-4 overflow-y-auto" style={{ maxHeight: '700px' }}>
      <Document
        file={proxyUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => setError(true)}
        loading={
          <div className="flex items-center justify-center py-10">
            <p className="text-sm text-slate-400">Cargando PDF...</p>
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i + 1}
            pageNumber={i + 1}
            width={700}
            className="shadow-md mb-2"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ))}
      </Document>
    </div>
  );
}
