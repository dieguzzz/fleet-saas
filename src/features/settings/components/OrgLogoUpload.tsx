'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { createClient } from '@/services/supabase/client';
import { updateOrgLogo } from '../actions';

interface OrgLogoUploadProps {
  orgId: string;
  orgSlug: string;
  orgName: string;
  currentLogoUrl: string | null;
}

export default function OrgLogoUpload({ orgId, orgSlug, orgName, currentLogoUrl }: OrgLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const displayUrl = preview ?? currentLogoUrl;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('El archivo no puede superar 2 MB');
      return;
    }

    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const path = `${orgId}/logo.${ext}`;
      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from('org-logos')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('org-logos').getPublicUrl(path);
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      startTransition(async () => {
        const result = await updateOrgLogo(orgSlug, publicUrl);
        if (result.error) {
          setError(result.error);
        } else {
          setPreview(publicUrl);
          setSuccess(true);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateOrgLogo(orgSlug, null);
      if (result.error) {
        setError(result.error);
      } else {
        setPreview(null);
        setSuccess(true);
      }
    });
  }

  const isLoading = uploading || isPending;

  return (
    <div className="space-y-3">
      <p className="field-label">Logo de la Organización</p>
      <div className="flex items-center gap-4">
        <div className="relative size-16 rounded-2xl overflow-hidden border border-border bg-muted shrink-0">
          {displayUrl ? (
            <Image
              src={displayUrl}
              alt="Logo"
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-2xl text-white">
              {orgName.charAt(0).toUpperCase()}
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <svg className="size-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card hover:bg-accent transition-colors text-foreground disabled:opacity-50"
            >
              {displayUrl ? 'Cambiar logo' : 'Subir logo'}
            </button>
            {displayUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors text-muted-foreground disabled:opacity-50"
              >
                Eliminar
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG, JPG, WebP o SVG. Máx 2 MB.</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">Logo actualizado correctamente.</p>
      )}
    </div>
  );
}
