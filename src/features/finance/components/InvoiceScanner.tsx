'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface InvoiceScannerProps {
  orgSlug: string;
}

interface ScannedData {
  ruc?: string;
  amount?: string;
  date?: string;
  description?: string;
  raw: string;
}

function parseQRData(raw: string): ScannedData {
  const result: ScannedData = { raw };

  const lines = raw.split(/[\n|;,]/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(trimmed)) {
      result.date = trimmed;
    } else if (/^\d+\.\d{2}$/.test(trimmed) || /^\$?\d[\d,.]*$/.test(trimmed)) {
      result.amount = trimmed.replace(/[$,]/g, '');
    } else if (/^[A-Z0-9-]{5,20}$/.test(trimmed) && !result.ruc) {
      result.ruc = trimmed;
    }
  }

  return result;
}

export default function InvoiceScanner({ orgSlug }: InvoiceScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScannedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const jsQR = (await import('jsqr')).default;
      const img = new Image();
      const url = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('No se pudo cargar la imagen'));
        img.src = url;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas no disponible');

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);

      URL.revokeObjectURL(url);

      if (code) {
        const parsed = parseQRData(code.data);
        setResult(parsed);
      } else {
        setError('No se encontró un código QR en la imagen. Puedes crear la factura manualmente.');
      }
    } catch {
      setError('Error al procesar la imagen');
    } finally {
      setScanning(false);
    }
  }, []);

  const handleUseData = () => {
    const params = new URLSearchParams({ type: 'pago' });
    if (result?.amount) params.set('amount', result.amount);
    if (result?.date) params.set('date', result.date);
    if (result?.description) params.set('description', result.description);
    if (result?.raw) params.set('qr_data', result.raw);
    router.push(`/${orgSlug}/finance/invoices/new?${params.toString()}`);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent transition-colors"
      >
        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        Escanear QR
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Escanear factura (QR)</h3>
        <button
          onClick={() => { setIsOpen(false); setResult(null); setError(null); }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          className="w-full flex flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-6 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
        >
          <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">
            {scanning ? 'Escaneando...' : 'Tomar foto o seleccionar imagen'}
          </span>
          <span className="text-xs">Apunta al código QR de la factura</span>
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          <p>{error}</p>
          <button
            onClick={() => router.push(`/${orgSlug}/finance/invoices/new?type=pago`)}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            Crear factura manualmente
          </button>
        </div>
      )}

      {result && (
        <div className="space-y-3">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">QR detectado</p>
            <div className="mt-2 space-y-1 text-xs text-green-700 dark:text-green-400">
              {result.ruc && <p>RUC/RNC: {result.ruc}</p>}
              {result.amount && <p>Monto: ${result.amount}</p>}
              {result.date && <p>Fecha: {result.date}</p>}
              <p className="text-muted-foreground mt-1 break-all">Raw: {result.raw.substring(0, 100)}{result.raw.length > 100 ? '...' : ''}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUseData}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Crear factura con estos datos
            </button>
            <button
              onClick={() => { setResult(null); fileInputRef.current?.click(); }}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              Escanear otra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
