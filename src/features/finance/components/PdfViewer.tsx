'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker copiado a /public para que Turbopack lo resuelva correctamente
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-center bg-slate-100 py-4 gap-2 overflow-y-auto" style={{ maxHeight: '700px' }}>
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => setError(err.message)}
        loading={
          <div className="py-10 text-sm text-slate-400">Cargando PDF...</div>
        }
        error={
          <div className="flex flex-col items-center py-10 gap-3">
            <p className="text-sm text-slate-500">No se pudo mostrar el PDF.</p>
            {error && <p className="text-xs text-red-400 font-mono">{error}</p>}
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
              Abrir en nueva pestaña
            </a>
          </div>
        }
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i + 1}
            pageNumber={i + 1}
            width={680}
            className="shadow mb-2"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ))}
      </Document>
    </div>
  );
}
