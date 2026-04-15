'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/services/supabase/client';
import { createInvoice, updateInvoice, updateInvoiceAttachmentUrl, type CreateInvoiceInput } from '../actions';
import type { Invoice } from '@/types/database';

interface InvoiceFormProps {
  orgId: string;
  orgSlug: string;
  nextInvoiceNumber?: string;
  invoiceType: 'cobro' | 'pago';
  invoice?: Invoice;
}

export function InvoiceForm({ orgId, orgSlug, nextInvoiceNumber, invoiceType, invoice }: InvoiceFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState(invoice?.subtotal ?? 0);
  const [tax, setTax] = useState(invoice?.tax ?? 0);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [existingAttachment, setExistingAttachment] = useState<string | null>(invoice?.attachment_url ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!invoice;
  const total = Number(subtotal) + Number(tax);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    const maxSize = 10 * 1024 * 1024;
    if (f.size > maxSize) { setError('El archivo no puede superar 10 MB.'); return; }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) { setError('Solo JPG, PNG, WEBP o PDF.'); return; }

    setError(null);
    setFile(f);
    if (f.type.startsWith('image/')) {
      setFilePreview(URL.createObjectURL(f));
    } else {
      setFilePreview(null);
    }
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
      subtotal: Number(formData.get('subtotal') || 0),
      tax: Number(formData.get('tax') || 0),
      total: Number(formData.get('subtotal') || 0) + Number(formData.get('tax') || 0),
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

      if (file) {
        await uploadFile(invoiceId);
      }

      router.push(`/${orgSlug}/finance/invoices?tab=${invoiceType === 'pago' ? 'pagos' : 'cobros'}`);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="bg-white p-4 lg:p-6 rounded-xl shadow-sm border border-slate-200 space-y-5 max-w-2xl">
      <div className="flex items-center gap-3">
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${invoiceType === 'cobro' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
          {invoiceType === 'cobro' ? '↑ Cobro' : '↓ Pago'}
        </div>
        <h2 className="text-lg font-semibold text-slate-800">
          {isEditing ? 'Editar Factura' : `Nueva Factura de ${invoiceType === 'cobro' ? 'Cobro' : 'Pago'}`}
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">{error}</div>
      )}

      {/* Número y estado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Número de Factura</label>
          <input
            name="invoice_number"
            type="text"
            required
            defaultValue={invoice?.invoice_number ?? nextInvoiceNumber}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {!isEditing && <p className="mt-1 text-xs text-slate-400">Generado automáticamente</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
          <select
            name="status"
            defaultValue={invoice?.status ?? 'draft'}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="draft">Borrador</option>
            <option value="sent">Enviada</option>
            <option value="paid">Pagada</option>
            <option value="overdue">Vencida</option>
            <option value="cancelled">Cancelada</option>
          </select>
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
          <input
            name="date"
            type="date"
            required
            defaultValue={invoice?.date ?? new Date().toISOString().split('T')[0]}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento</label>
          <input
            name="due_date"
            type="date"
            defaultValue={invoice?.due_date ?? ''}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Montos con total automático */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Subtotal ($)</label>
          <input
            name="subtotal"
            type="number"
            min="0"
            step="0.01"
            value={subtotal}
            onChange={(e) => setSubtotal(Number(e.target.value))}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Impuestos ($)</label>
          <input
            name="tax"
            type="number"
            min="0"
            step="0.01"
            value={tax}
            onChange={(e) => setTax(Number(e.target.value))}
            className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Total ($)</label>
          <div className="block w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
            ${total.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Notas */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
        <textarea
          name="notes"
          rows={2}
          defaultValue={invoice?.notes ?? ''}
          className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Notas opcionales..."
        />
      </div>

      {/* Adjunto */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Adjunto <span className="text-slate-400 font-normal">(PDF o imagen)</span>
        </label>

        {/* Adjunto existente */}
        {existingAttachment && !file && (
          <div className="mb-2 flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <a href={existingAttachment} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline flex-1 truncate">
              Ver adjunto actual
            </a>
            <button
              type="button"
              onClick={() => setExistingAttachment(null)}
              className="text-slate-400 hover:text-red-500 transition-colors text-xs"
            >
              Quitar
            </button>
          </div>
        )}

        {/* Preview del nuevo archivo seleccionado */}
        {file && (
          <div className="mb-2 flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            {filePreview ? (
              <img src={filePreview} alt="Preview" className="w-10 h-10 rounded object-cover border border-blue-200" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
            <span className="text-sm text-slate-700 flex-1 truncate">{file.name}</span>
            <button type="button" onClick={clearFile} className="text-slate-400 hover:text-red-500 transition-colors text-xs">
              Quitar
            </button>
          </div>
        )}

        {/* Zona de upload */}
        {!file && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) {
                const syntheticEvent = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>;
                handleFileChange(syntheticEvent);
              }
            }}
            className="border-2 border-dashed border-slate-300 rounded-lg p-5 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mx-auto text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm text-slate-500">
              Arrastrá o <span className="text-blue-600 underline">seleccioná un archivo</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP o PDF — máx. 10 MB</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* Botones */}
      <div className="flex items-center justify-between pt-2 gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading
            ? (isEditing ? 'Guardando...' : 'Creando...')
            : (isEditing ? 'Guardar Cambios' : 'Crear Factura')}
        </button>
      </div>
    </form>
  );
}
