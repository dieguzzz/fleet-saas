'use client';

import { useEffect, useState } from 'react';
import { X, Download, Share } from 'lucide-react';

const DISMISSED_KEY = 'pwa-banner-dismissed';
const DISMISS_DAYS = 30;

function isDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const until = parseInt(raw, 10);
    return Date.now() < until;
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISSED_KEY, String(until));
  } catch {}
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

export function PwaInstallBanner() {
  const [show, setShow] = useState(false);
  const [isIosDevice, setIsIosDevice] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (isDismissed() || isInStandalone()) return;

    const ios = isIos();
    setIsIosDevice(ios);

    if (ios) {
      // iOS: mostrar instrucciones manuales
      setShow(true);
      return;
    }

    // Android / Chrome: esperar evento beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      handleClose();
    }
  };

  const handleClose = () => {
    setShow(false);
    dismiss();
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] flex items-start justify-between gap-3 bg-sidebar text-sidebar-foreground px-4 py-3 shadow-lg border-b border-border">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Icono */}
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <img src="/icon.svg" alt="Fleet" className="w-7 h-7" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-tight">Instalar Fleet SaaS</p>
          {isIosDevice ? (
            <p className="text-xs text-sidebar-foreground/70 mt-0.5 leading-snug">
              Toca{' '}
              <Share className="inline w-3.5 h-3.5 mx-0.5 align-text-bottom" />
              {' '}y luego{' '}
              <strong>&ldquo;Agregar a pantalla de inicio&rdquo;</strong>
            </p>
          ) : (
            <p className="text-xs text-sidebar-foreground/70 mt-0.5">
              Accede rápido desde tu pantalla de inicio
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {!isIosDevice && (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Instalar
          </button>
        )}
        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-sidebar-foreground/10 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
