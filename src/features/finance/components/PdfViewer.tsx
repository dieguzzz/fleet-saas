'use client';

import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  url: string;
}

export function PdfViewer({ url }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState(false);

  const proxyUrl = `/api/pdf-proxy?url=${encodeURIComponent(url)}`;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 bg-slate-50">
        <p className="text-sm text-slate-500">No se pudo mostrar el PDF.</p>
        <a href={proxyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline font-medium">
          Abrir PDF
        </a>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center bg-slate-100 py-4 gap-2 overflow-y-auto"
      style={{ maxHeight: '700px' }}
    >
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
