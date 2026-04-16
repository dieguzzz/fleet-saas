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

export function InvoiceAttachment({ invoiceId, orgId, currentUrl, onUploaded }: InvoiceAttachmentProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10 MB
    if (file.size > maxSize) {
      setError('El archivo no puede superar 10 MB.');
      return;
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      setError('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF.');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `${orgId}/invoices/${invoiceId}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('invoice-attachments')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('invoice-attachments')
        .getPublicUrl(path);

      const publicUrl = data.publicUrl;

      // Persist via server action (avoids client-side DB type issues)
      const result = await updateInvoiceAttachmentUrl(invoiceId, orgId, publicUrl);
      if (result?.error) throw new Error(result.error);

      if (file.type.startsWith('image/')) {
        setPreview(publicUrl);
      } else {
        setPreview(null);
      }
      onUploaded(publicUrl);
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

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Adjunto de factura (foto o PDF)</p>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        {uploading ? (
          <p className="text-sm text-gray-500">Subiendo...</p>
        ) : (
          <p className="text-sm text-gray-500">
            Arrastra aquí o <span className="text-blue-600 underline">selecciona un archivo</span>
            <br />
            <span className="text-xs text-gray-400">JPG, PNG, WEBP o PDF — máx. 10 MB</span>
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}

      {preview && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Vista previa del adjunto"
            className="max-h-48 rounded border border-gray-200 object-contain"
          />
        </div>
      )}

      {!preview && currentUrl && (
        <p className="text-xs text-slate-400 italic">El adjunto se muestra en la sección inferior.</p>
      )}
    </div>
  );
}
