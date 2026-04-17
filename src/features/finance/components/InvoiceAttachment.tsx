'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/services/supabase/client';
import { updateInvoiceAttachmentUrl } from '../actions';

interface InvoiceAttachmentProps {
  invoiceId: string;
  orgId: string;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
}

function isPdf(url: string) {
  return url.toLowerCase().includes('.pdf');
}

export function InvoiceAttachment({ invoiceId, orgId, currentUrl, onUploaded }: InvoiceAttachmentProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  async function compressImage(file: File): Promise<File> {
    const MAX_PX = 1920;
    const QUALITY = 0.82;
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, MAX_PX / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
          'image/jpeg',
          QUALITY
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  async function handleFile(file: File) {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) { setError('El archivo no puede superar 10 MB.'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) { setError('Solo se permiten JPG, PNG, WEBP o PDF.'); return; }

    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();

      // Comprimir imágenes antes de subir (fotos de celular pueden ser 5-8 MB)
      const fileToUpload = file.type.startsWith('image/') ? await compressImage(file) : file;
      const ext = file.type.startsWith('image/') ? 'jpg' : (file.name.split('.').pop() ?? 'pdf');
      const path = `${orgId}/invoices/${invoiceId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('invoice-attachments')
        .upload(path, fileToUpload, { upsert: true });

      if (uploadError) throw new Error(uploadError.message);

      const { data } = supabase.storage.from('invoice-attachments').getPublicUrl(path);

      const result = await updateInvoiceAttachmentUrl(invoiceId, orgId, data.publicUrl);
      if (result?.error) throw new Error(result.error);

      setUploadedFileName(file.name);
      onUploaded(data.publicUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al subir el archivo.');
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const hasAttachment = !!currentUrl;
  const justUploaded = !!uploadedFileName;

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">
        {hasAttachment ? 'Reemplazar adjunto' : 'Adjuntar archivo'}{' '}
        <span className="font-normal text-muted-foreground">(PDF o imagen)</span>
      </p>

      {/* Estado actual del adjunto */}
      {hasAttachment && !justUploaded && (
        <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border text-xs text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
          <span>{isPdf(currentUrl) ? 'PDF adjunto' : 'Imagen adjunta'} — se muestra abajo</span>
        </div>
      )}

      {/* Confirmación de subida exitosa */}
      {justUploaded && (
        <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-lg border border-green-200 text-xs text-green-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Archivo subido: <strong>{uploadedFileName}</strong></span>
        </div>
      )}

      {/* Zona de carga */}
      <div className="flex gap-2">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          {uploading ? (
            <p className="text-sm text-muted-foreground">Subiendo...</p>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-auto text-muted-foreground/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm text-muted-foreground">
                Arrastrá o <span className="text-blue-600 underline">seleccioná archivo</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP o PDF — máx. 10 MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleChange}
          />
        </div>

        {/* Botón cámara — visible principalmente en móvil */}
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          className="flex flex-col items-center justify-center gap-1 px-4 py-4 border-2 border-dashed border-border rounded-lg text-muted-foreground hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors disabled:opacity-50"
          title="Tomar foto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-xs">Foto</span>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleChange}
          />
        </button>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
