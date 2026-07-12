'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface InvoiceScannerProps {
  orgSlug: string;
}

interface ScannedData {
  ruc?: string;
  amount?: string;
  date?: string;
  description?: string;
  cufe?: string;
  dgiUrl?: string;
  docType?: string;
  raw: string;
}

type JsQRFn = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  opts?: { inversionAttempts?: 'dontInvert' | 'onlyInvert' | 'attemptBoth' | 'invertFirst' }
) => { data: string } | null;

function parseDgiUrl(url: string): ScannedData | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes('dgi-fep.mef.gob.pa')) return null;

    const cufe = parsed.searchParams.get('chFE') || '';
    if (!cufe) return null;

    const result: ScannedData = { raw: url, cufe, dgiUrl: url };

    const docTypeMatch = cufe.match(/^(FE|NC|ND)\d{2}/);
    if (docTypeMatch) {
      const prefix = docTypeMatch[0].substring(0, 2);
      result.docType = prefix === 'FE' ? 'Factura Electrónica'
        : prefix === 'NC' ? 'Nota de Crédito'
        : 'Nota de Débito';
    }

    const dateMatch = cufe.match(/(\d{4})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])/);
    if (dateMatch) {
      result.date = `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}`;
    }

    const withoutPrefix = cufe.replace(/^(FE|NC|ND)\d{2}/, '');
    const rucMatch = withoutPrefix.match(/^([\dA-Z]+-[\dA-Z]+-[\dA-Z]+)/);
    if (rucMatch) {
      result.ruc = rucMatch[1];
    }

    return result;
  } catch {
    return null;
  }
}

function parseQRData(raw: string): ScannedData {
  const dgiResult = parseDgiUrl(raw);
  if (dgiResult) return dgiResult;

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
  const [open, setOpen] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [result, setResult] = useState<ScannedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const jsQRRef = useRef<JsQRFn | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const stopCamera = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const handleDetected = useCallback((data: string) => {
    stopCamera();
    setResult(parseQRData(data));
    setError(null);
    setOpen(false);
  }, [stopCamera]);

  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const jsQR = jsQRRef.current;
    if (!video || !jsQR || !streamRef.current) return;

    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvasRef.current = canvas;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        if (code && code.data) {
          handleDetected(code.data);
          return;
        }
      }
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }, [handleDetected]);

  // Enciende la cámara mientras el modal está abierto; la apaga al cerrar/desmontar.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    (async () => {
      try {
        if (!jsQRRef.current) {
          jsQRRef.current = (await import('jsqr')).default as unknown as JsQRFn;
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          throw Object.assign(new Error('no-camera'), { name: 'NotFoundError' });
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        setInitializing(false);
        rafRef.current = requestAnimationFrame(scanLoop);
      } catch (err) {
        if (cancelled) return;
        setInitializing(false);
        const name = (err as { name?: string })?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') {
          setError('Permiso de cámara denegado. Podés subir una imagen del QR.');
        } else if (name === 'NotFoundError' || name === 'NotReadableError' || name === 'OverconstrainedError') {
          setError('No se pudo usar la cámara. Subí una imagen del QR.');
        } else {
          setError('No se pudo acceder a la cámara. Subí una imagen del QR.');
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, scanLoop, stopCamera]);

  const handleScanClick = () => {
    setResult(null);
    setError(null);
    setInitializing(true);
    setOpen(true);
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    try {
      if (!jsQRRef.current) {
        jsQRRef.current = (await import('jsqr')).default as unknown as JsQRFn;
      }
      const jsQR = jsQRRef.current;
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

      if (code && code.data) {
        stopCamera();
        setResult(parseQRData(code.data));
        setOpen(false);
      } else {
        setError('No se encontró un código QR en la imagen. Puedes crear la factura manualmente.');
      }
    } catch {
      setError('Error al procesar la imagen');
    }
  }, [stopCamera]);

  const handleUseData = () => {
    const params = new URLSearchParams({ type: 'pago' });
    if (result?.amount) params.set('amount', result.amount);
    if (result?.date) params.set('date', result.date);
    if (result?.description) params.set('description', result.description);
    if (result?.ruc) params.set('ruc', result.ruc);
    if (result?.cufe) params.set('cufe', result.cufe);
    if (result?.dgiUrl) params.set('dgi_url', result.dgiUrl);
    if (result?.raw) params.set('qr_data', result.raw);
    router.push(`/${orgSlug}/finance/invoices/new?${params.toString()}`);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <button
        onClick={handleScanClick}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 min-h-11 text-sm font-medium text-foreground hover:bg-accent transition-colors"
      >
        <svg className="size-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        Escanear QR
      </button>

      {/* Modal de escáner en vivo — superficie de cámara, negra a propósito */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm font-medium">Apuntá al QR de la factura</span>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center rounded-lg px-3 min-h-11 text-sm font-medium text-white/90 hover:bg-white/10 transition-colors"
            >
              Cerrar
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Marco guía */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="size-64 max-w-[70vw] max-h-[70vw] rounded-2xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
            </div>
            {initializing && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-white/80">
                Iniciando cámara…
              </p>
            )}
          </div>

          <div className="flex flex-col items-center gap-3 px-4 py-4">
            {error && (
              <p className="text-center text-sm text-yellow-300">{error}</p>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-white/80 underline hover:text-white"
            >
              Subir una imagen en su lugar
            </button>
          </div>
        </div>
      )}

      {/* Error fuera del modal (ej. imagen subida sin QR) */}
      {!open && error && (
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
        <div className="rounded-xl border border-border bg-card p-4 space-y-3">
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">
              {result.cufe ? 'Factura electrónica DGI detectada' : 'QR detectado'}
            </p>
            <div className="mt-2 space-y-1 text-xs text-green-700 dark:text-green-400">
              {result.docType && <p>Tipo: {result.docType}</p>}
              {result.ruc && <p>RUC emisor: {result.ruc}</p>}
              {result.amount && <p>Monto: ${result.amount}</p>}
              {result.date && <p>Fecha: {result.date}</p>}
              {result.cufe && (
                <p className="text-muted-foreground mt-1 break-all">
                  CUFE: {result.cufe.substring(0, 40)}{result.cufe.length > 40 ? '...' : ''}
                </p>
              )}
              {!result.cufe && (
                <p className="text-muted-foreground mt-1 break-all">
                  Raw: {result.raw.substring(0, 100)}{result.raw.length > 100 ? '...' : ''}
                </p>
              )}
            </div>
          </div>
          {result.dgiUrl && (
            <a
              href={result.dgiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg border border-border px-3 min-h-11 text-sm font-medium text-primary hover:bg-accent transition-colors"
            >
              <svg className="size-4" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ver en portal DGI
            </a>
          )}
          <div className="flex gap-2">
            <button
              onClick={handleUseData}
              className="flex-1 rounded-lg bg-primary px-4 min-h-11 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Crear factura con estos datos
            </button>
            <button
              onClick={() => { setResult(null); setError(null); handleScanClick(); }}
              className="rounded-lg border border-border px-4 min-h-11 text-sm font-medium text-muted-foreground hover:bg-accent"
            >
              Escanear otra
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
