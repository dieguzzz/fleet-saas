'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/services/supabase/client';
import { createInvoice, updateInvoice, updateInvoiceAttachmentUrl, saveInvoiceLineItems, type CreateInvoiceInput, type LineItemInput } from '../actions';
import type { Invoice, Product, OrgType } from '@/types/database';
import ContactModal from '@/features/contacts/components/ContactModal';
import InvoiceLineItems from './InvoiceLineItems';

interface ContactOption { id: string; name: string; company: string | null; tax_id?: string | null }

const EMPTY_CONTACTS: ContactOption[] = [];

interface ScannerData {
  ruc?: string;
  cufe?: string;
  dgi_url?: string;
  qr_data?: string;
  date?: string;
  amount?: string;
}

interface InitialLineItem {
  product_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
}

const EMPTY_LINE_ITEMS: InitialLineItem[] = [];

interface InvoiceFormProps {
  orgId: string;
  orgSlug: string;
  invoiceType: 'cobro' | 'pago';
  invoice?: Invoice;
  contacts?: ContactOption[];
  scannerData?: ScannerData;
  orgType?: OrgType;
  products?: Product[];
  initialLineItems?: InitialLineItem[];
}

export function InvoiceForm({ orgId, orgSlug, invoiceType, invoice, contacts: initialContacts = EMPTY_CONTACTS, scannerData, orgType = 'fleet', products = [], initialLineItems = EMPTY_LINE_ITEMS }: InvoiceFormProps) {
  const { push, refresh, back } = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtotal, setSubtotal] = useState(Number(invoice?.subtotal ?? scannerData?.amount ?? 0));
  const [tax, setTax] = useState(Number(invoice?.tax ?? 0));

  const matchedContact = scannerData?.ruc
    ? initialContacts.find(c => c.tax_id === scannerData.ruc)
    : undefined;
  const [contactId, setContactId] = useState<string>(
    matchedContact?.id
      ?? (invoiceType === 'cobro' ? (invoice?.customer_id ?? '') : (invoice?.supplier_id ?? ''))
  );
  const [contacts, setContacts] = useState<ContactOption[]>(initialContacts);
  const [rucNotFound, setRucNotFound] = useState(!!scannerData?.ruc && !matchedContact);

  const handleNewContact = useCallback((id: string, name: string) => {
    setContacts(prev => [...prev, { id, name, company: null }]);
    setContactId(id);
    setRucNotFound(false);
  }, []);
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
    // Guardar el PATH (bucket privado, se sirve por el proxy autenticado).
    const result = await updateInvoiceAttachmentUrl(invoiceId, orgId, path);
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
      customer_id: invoiceType === 'cobro' ? (contactId || null) : null,
      supplier_id: invoiceType === 'pago' ? (contactId || null) : null,
      attachment_url: existingAttachment,
      cufe: scannerData?.cufe ?? invoice?.cufe ?? null,
      dgi_url: scannerData?.dgi_url ?? invoice?.dgi_url ?? null,
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
      // Save line items for kitchen orgs
      if (orgType === 'kitchen') {
        const lineCount = Number(formData.get('line_count') ?? 0);
        const lineItems: LineItemInput[] = [];
        for (let i = 0; i < lineCount; i++) {
          const desc = formData.get(`line_description_${i}`) as string;
          if (!desc) continue;
          lineItems.push({
            product_id: (formData.get(`line_product_id_${i}`) as string) || null,
            description: desc,
            quantity: Number(formData.get(`line_quantity_${i}`)) || 1,
            unit_price: Number(formData.get(`line_unit_price_${i}`)) || 0,
            sort_order: i,
          });
        }
        // Persistir siempre (también cuando se vacían las líneas al editar):
        // saveInvoiceLineItems borra las existentes y reinserta las actuales.
        const lineResult = await saveInvoiceLineItems(invoiceId, orgId, lineItems);
        if (lineResult.error) throw new Error(lineResult.error);
      }
      if (file) await uploadFile(invoiceId);
      push(`/${orgSlug}/finance/invoices?tab=${invoiceType === 'pago' ? 'pagos' : 'cobros'}`);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error inesperado');
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm border border-destructive/20">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* LEFT — campos principales (2/3) */}
        <div className="lg:col-span-2">
          <div className="form-card form-section">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${invoiceType === 'cobro' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                {invoiceType === 'cobro' ? '↑ Cobro' : '↓ Pago'}
              </span>
              <h2 className="text-base font-semibold text-foreground">
                {isEditing ? 'Editar Factura' : `Nueva Factura de ${invoiceType === 'cobro' ? 'Cobro' : 'Pago'}`}
              </h2>
            </div>

            {scannerData?.cufe && (
              <div className="rounded-lg border border-border bg-muted/50 p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Factura electrónica DGI</p>
                <p className="text-xs text-muted-foreground font-mono break-all">
                  CUFE: {scannerData.cufe.substring(0, 50)}{scannerData.cufe.length > 50 ? '...' : ''}
                </p>
                {scannerData.dgi_url && (
                  <a
                    href={scannerData.dgi_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <svg className="size-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Ver en portal DGI
                  </a>
                )}
              </div>
            )}

            {rucNotFound && scannerData?.ruc && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                RUC escaneado: <strong>{scannerData.ruc}</strong> — no se encontró un proveedor con este RUC. Seleccioná uno manualmente o creá uno nuevo.
              </div>
            )}

            {/* Contacto (cliente o proveedor) */}
            <div>
              <label htmlFor="contact_id" className="field-label">
                {invoiceType === 'cobro' ? 'Cliente' : 'Proveedor'}
              </label>
              <div className="flex gap-2">
                <select
                  id="contact_id"
                  value={contactId}
                  onChange={e => setContactId(e.target.value)}
                  className="field-input flex-1"
                >
                  <option value="">Sin asignar</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}{c.company ? ` — ${c.company}` : ''}
                    </option>
                  ))}
                </select>
                <ContactModal
                  orgSlug={orgSlug}
                  defaultRole={invoiceType === 'cobro' ? 'customer' : 'supplier'}
                  onSuccess={handleNewContact}
                  trigger={
                    <button type="button" className="shrink-0 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors whitespace-nowrap">
                      + Nuevo
                    </button>
                  }
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div>
                <label htmlFor="invoice_number" className="field-label">Número de Factura</label>
                {isEditing ? (
                  <input
                    id="invoice_number"
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
                <label htmlFor="status" className="field-label">Estado</label>
                <select id="status" name="status" defaultValue={invoice?.status ?? 'draft'} className="field-input">
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviada</option>
                  <option value="paid">Pagada</option>
                  <option value="overdue">Vencida</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div>
                <label htmlFor="date" className="field-label">Fecha</label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  required
                  defaultValue={invoice?.date ?? scannerData?.date ?? new Date().toISOString().split('T')[0]}
                  className="field-input"
                />
              </div>
              <div>
                <label htmlFor="due_date" className="field-label">Fecha de Vencimiento</label>
                <input id="due_date" name="due_date" type="date" defaultValue={invoice?.due_date ?? ''} className="field-input" />
              </div>
            </div>

            <div>
              <label htmlFor="invoice_notes" className="field-label">Notas</label>
              <textarea
                id="invoice_notes"
                name="notes"
                rows={2}
                defaultValue={invoice?.notes ?? ''}
                className="field-input resize-none"
                placeholder="Notas opcionales..."
              />
            </div>

            {orgType === 'kitchen' && (
              <div className="pt-2">
                <InvoiceLineItems
                  products={products}
                  initialItems={initialLineItems}
                  onTotalsChange={(sub) => { setSubtotal(sub); setTax(0); }}
                />
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — importes + adjunto + botones (1/3) */}
        <div className="space-y-3">

          {/* Importes */}
          <div className="form-card space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Importes</h3>
            <div>
              <label htmlFor="subtotal" className="field-label">Subtotal ($)</label>
              <input
                id="subtotal"
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
              <label htmlFor="tax" className="field-label">Impuestos ($)</label>
              <input
                id="tax"
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
          <div className="form-card space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Adjunto <span className="font-normal text-muted-foreground">(PDF o imagen)</span>
            </h3>

            {existingAttachment && !file && (
              <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <a href={existingAttachment} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex-1 truncate">
                  Ver adjunto actual
                </a>
                <button type="button" onClick={() => setExistingAttachment(null)} className="text-muted-foreground hover:text-destructive text-xs">Quitar</button>
              </div>
            )}

            {file && (
              <div className="flex items-center gap-2 p-2.5 bg-blue-50 rounded-lg border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="size-8 rounded object-cover border border-blue-200 dark:border-blue-800 shrink-0" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-7 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )}
                <span className="text-xs text-foreground flex-1 truncate">{file.name}</span>
                <button type="button" onClick={clearFile} className="text-muted-foreground hover:text-destructive text-xs shrink-0">Quitar</button>
              </div>
            )}

            {!file && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) handleFileChange({ target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>);
                }}
                className="border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="size-6 mx-auto text-muted-foreground/30 mb-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
              onClick={() => back()}
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
