'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/services/supabase/client';
import { markTripCompleted } from '@/features/trips/actions';
import { useRouter } from 'next/navigation';

interface Props {
  tripId: string;
  orgSlug: string;
}

export function CompleteTripButton({ tripId, orgSlug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [endInvoiceUrl, setEndInvoiceUrl] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop();
      const path = `invoices/end-${tripId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('trip-documents')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('trip-documents').getPublicUrl(path);
      setEndInvoiceUrl(data.publicUrl);
      setFileName(file.name);
    } catch {
      setError('Error subiendo la factura final');
    } finally {
      setUploading(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    setError('');
    const result = await markTripCompleted(tripId, orgSlug, endInvoiceUrl || null);
    setSaving(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm transition-colors"
      >
        Marcar como Completado
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Completar Viaje</h2>
            <p className="text-sm text-muted-foreground">
              Adjuntá la factura final del viaje antes de marcarlo como completado.
            </p>

            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-green-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {fileName ? (
                <p className="text-sm text-green-600 font-medium">{fileName}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {uploading ? 'Subiendo...' : 'Clic para adjuntar factura final (PDF, imagen)'}
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleUpload}
              disabled={uploading}
            />

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => { setOpen(false); setError(''); setFileName(''); setEndInvoiceUrl(''); }}
                className="px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:bg-accent"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={handleComplete}
                disabled={saving || uploading}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Confirmar Completado'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
