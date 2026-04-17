'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/services/supabase/client';
import { createInvoice, updateInvoice, updateInvoiceAttachmentUrl, type CreateInvoiceInput } from '../actions';
import type { Invoice } from '@/types/database';

interface InvoiceFormProps {
  orgId: string;
  orgSlug: string;
  invoiceType: 'cobro' | 'pago';
  invoice?: Invoice;
}

export function InvoiceForm({ orgId, orgSlug, invoiceType, invoice }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState(Number(invoice?.subtotal ?? 0));
  const [tax, setTax] = useState(Number(invoice?.tax ?? 0));
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<string | null>(invoice?.attachment_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!invoice;
  const total = subtotal + tax;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError('El archivo no puede superar 10 MB.'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) { setError('Solo JPG, PNG, WEBP o PDF.'); return; }
    setError(null);
    setFile(f);
    setFilePreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
  }

  function clearFile() {
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadFile(invoiceId: string): Promise<void> {
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${orgId}/invoices/${invoiceId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('invoice-attachments')
      .upload(path, file, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = supabase.storage.from('invoice-attachments').getPublicUrl(path);
    const result = await updateInvoiceAttachmentUrl(invoiceId, orgId, data.publicUrl);
    if (result?.error) throw new Error(result.error);
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const invoiceData: CreateInvoiceInput = {
      invoice_number: formData.get('invoice_number') as string,
      invoice_type: invoiceType,
      date: formData.get('date') as string,
      due_date: (formData.get('due_date') as string) || null,
      status: (formData.get('status') as Invoice['status']) || 'draft',
      subtotal,
      tax,
      total,
      items: invoice?.items ?? [],
      notes: (formData.get('notes') as string) || null,
      customer_id: null,
      supplier_id: null,
      attachment_url: existingAttachment,
    };
    try {
      let invoiceId: string;
      if (isEditing) {
        const result = await updateInvoice(invoice.id, orgId, invoiceData);
        if (result.error) throw new Error(result.error);
        invoiceId = invoice.id;
      } else {
        const result = await createInvoice(orgId, invoiceData);
        if (result.error) throw new Error(result.error);
        invoiceId = result.data!.id;
      }
      if (file) await uploadFile(invoiceId);
      router.push(`/${orgSlug}/finance/invoices?tab=${invoiceType === 'pago' ? 'pagos' : 'cobros'}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT — campos principales (2/3) */}
        <div className="lg:col-span-2">
          <div className="form-card space-y-5">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${invoiceType === 'cobro' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                {invoiceType === 'cobro' ? '↑ Cobro' : '↓ Pago'}
              </span>
              <h2 className="text-base font-semibold text-foreground">
                {isEditing ? 'Editar Factura' : `Nueva Factura de ${invoiceType === 'cobro' ? 'Cobro' : 'Pago'}`}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Número de Factura</label>
                {isEditing ? (
                  <input
                    name="invoice_number"
                    type="text"
                    required
                    defaultValue={invoice?.invoice_number}
                    className="field-input"
                  />
                ) : (
                  <div className="field-input bg-muted text-muted-foreground cursor-not-allowed select-none">
                    Se generará automáticamente
                  </div>
                )}
              </div>
              <div>
                <label className="field-label">Estado</label>
                <select name="status" defaultValue={invoice?.status ?? 'draft'} className="field-input">
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada</option>
                  <option value="paid">Pagada</option>
                  <option value="overdue">Vencida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label">Fecha</label>
                <input
                  name="date"
                  type="date"
                  required
                  defaultValue={invoice?.date ?? new Date().toISOString().split('T')[0]}
                  className="field-input"
                />
              </div>
              <div>
                <label className="field-label">Fecha de Vencimiento</label>
                <input name="due_date" type="date" defaultValue={invoice?.due_date ?? ''} className="field-input" />
              </div>
            </div>

            <div>
              <label className="field-label">Notas</label>
              <textarea
                name="notes"
                rows={4}
                defaultValue={invoice?.notes ?? ''}
                className="field-input resize-none"
                placeholder="Notas opcionales..."
              />
            </div>
          </div>
        </div>

        {/* RIGHT — importes + adjunto + botones (1/3) */}
        <div className="space-y-4">

          {/* Importes */}
          <div className="form-card space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Importes</h3>
            <div>
              <label className="field-label">Subtotal ($)</label>
              <input
                name="subtotal"
                type="number"
                min="0"
                step="0.01"
                value={subtotal}
                onChange={(e) => setSubtotal(Number(e.target.value))}
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">Impuestos ($)</label>
              <input
                name="tax"
                type="number"
                min="0"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                className="field-input"
              />
            </div>
            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-foreground">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* Adjunto */}
          <div className="form-card space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Adjunto <span className="font-normal text-muted-foreground">(PDF o imagen)</span>
            </h3>

            {existingAttachment && !file && (
              <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <a href={existingAttachment} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex-1 truncate">
                  Ver adjunto actual
                </a>
                <button type="button" onClick={() => setExistingAttachment(null)} className="text-muted-foreground hover:text-destructive text-xs">Quitar</button>
              </div>
            )}

            {file && (
              <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="w-8 h-8 rounded object-cover border border-blue-200 shrink-0" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="text-xs text-foreground flex-1 truncate">{file.name}</span>
                <button type="button" onClick={clearFile} className="text-muted-foreground hover:text-destructive text-xs shrink-0">Quitar</button>
              </div>
            )}

            {!file && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileChange({ target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>);
                }}
                className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-auto text-muted-foreground/30 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <p className="text-xs text-muted-foreground">Arrastrá o <span className="text-primary underline">seleccioná</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">JPG, PNG, WEBP o PDF · máx. 10 MB</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileChange} />
          </div>

          {/* Botones */}
          <div className="flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar Cambios' : 'Crear Factura')}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full px-5 py-2.5 border border-border text-muted-foreground rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
