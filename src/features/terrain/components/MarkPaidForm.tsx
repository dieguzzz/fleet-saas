'use client';

import React, { useActionState, useEffect, useRef, useState } from 'react';
import { createClient } from '@/services/supabase/client';
import { markPaymentPaid, updatePaymentReceiptUrl, type MarkPaidFormState } from '@/features/terrain/actions';
import type { LandPayment, LandTenant } from '@/types/database';

interface MarkPaidFormProps {
  payment: LandPayment & { tenant?: Pick<LandTenant, 'id' | 'name' | 'equipment_description' | 'phone'> };
  orgSlug: string;
  orgId: string;
  onClose: () => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function MarkPaidForm({ payment, orgSlug, orgId, onClose }: MarkPaidFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: MarkPaidFormState, formData: FormData) => markPaymentPaid(_prev, formData),
    null
  );

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(payment.receipt_url);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (state?.success && state.paymentId) {
      onClose();
    }
  }, [state, onClose]);

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

  async function handleFileUpload(file: File) {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) { setUploadError('El archivo no puede superar 10 MB.'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) { setUploadError('Solo se permiten JPG, PNG, WEBP o PDF.'); return; }

    setUploadError(null);
    setUploading(true);

    try {
      const supabase = createClient();
      const isPdf = file.type === 'application/pdf';
      const ext = isPdf ? 'pdf' : 'jpg';
      const processedFile = isPdf ? file : await compressImage(file);
      const path = `${orgId}/receipts/${payment.id}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('terrain-receipts')
        .upload(path, processedFile, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data } = supabase.storage.from('terrain-receipts').getPublicUrl(path);
      await updatePaymentReceiptUrl(payment.id, orgSlug, data.publicUrl);
      setReceiptUrl(data.publicUrl);
      setReceiptFileName(file.name);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError('Error al subir el comprobante. Intenta nuevamente.');
    } finally {
      setUploading(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/60">
          <div>
            <h3 className="font-semibold text-slate-100 text-base">Registrar pago</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {payment.tenant?.name} — {MONTH_NAMES[(payment.period_month - 1)]} {payment.period_year}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form action={formAction} className="p-6 space-y-4">
          <input type="hidden" name="paymentId" value={payment.id} />
          <input type="hidden" name="orgSlug" value={orgSlug} />

          {state?.error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {state.error}
            </div>
          )}

          <div className="bg-slate-800/50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-slate-400">Monto a cobrar</span>
            <span className="font-semibold text-slate-100">{formatCurrency(payment.amount)}</span>
          </div>

          <div className="space-y-1.5">
            <label className="field-label">Monto recibido <span className="text-red-400">*</span></label>
            <input
              name="paid_amount"
              type="number"
              min="0"
              step="0.01"
              required
              defaultValue={payment.paid_amount ?? payment.amount}
              className="field-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="field-label">Fecha de pago <span className="text-red-400">*</span></label>
            <input
              name="paid_date"
              type="date"
              required
              defaultValue={payment.paid_date ?? today}
              className="field-input"
            />
          </div>

          <div className="space-y-1.5">
            <label className="field-label">Método de pago <span className="text-red-400">*</span></label>
            <select name="payment_method" required defaultValue={payment.payment_method ?? 'cash'} className="field-input">
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
              <option value="check">Cheque</option>
              <option value="card">Tarjeta</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="field-label">Notas</label>
            <input
              name="notes"
              type="text"
              defaultValue={payment.notes ?? ''}
              placeholder="Observaciones..."
              className="field-input"
            />
          </div>

          {/* Comprobante */}
          <div className="space-y-1.5">
            <label className="field-label">Comprobante (opcional)</label>
            {receiptUrl ? (
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <a href={receiptUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-emerald-400 truncate hover:underline">
                    {receiptFileName ?? 'Comprobante subido'}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-slate-400 hover:text-slate-200 shrink-0 ml-2"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-slate-600 hover:border-blue-500 rounded-lg text-sm text-slate-400 hover:text-blue-400 transition-colors"
              >
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Subir comprobante (JPG, PNG, PDF)
                  </>
                )}
              </button>
            )}
            {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
                e.target.value = '';
              }}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending || uploading}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isPending ? 'Guardando...' : 'Confirmar pago'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
