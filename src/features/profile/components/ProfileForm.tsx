'use client';

import { useRef, useState, useActionState } from 'react';
import Image from 'next/image';
import { useFormStatus } from 'react-dom';
import { createClient } from '@/services/supabase/client';
import { updateProfile, changePassword } from '../actions';
import type { Profile } from '@/types/database';
import { Button } from '@/components/ui/button';

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

interface Props {
  profile: Profile;
}

export default function ProfileForm({ profile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [profileState, profileAction] = useActionState(updateProfile, null);
  const [passwordState, passwordAction] = useActionState(changePassword, null);

  const displayAvatar = avatarPreview ?? profile.avatar_url;
  const initials = (profile.full_name || profile.email).charAt(0).toUpperCase();

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('La imagen no puede superar 2 MB');
      return;
    }

    setAvatarError(null);
    setAvatarUploading(true);

    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.id}/avatar.${ext}`;
      const supabase = createClient();

      const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarPreview(url);
      setPendingAvatarUrl(url);
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setAvatarUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile info */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-5">Información personal</h2>
        <form action={profileAction} className="space-y-5">
          {pendingAvatarUrl && <input type="hidden" name="avatar_url" value={pendingAvatarUrl} />}

          {profileState?.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {profileState.error}
            </div>
          )}
          {profileState?.success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
              Perfil actualizado correctamente.
            </div>
          )}

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative size-16 rounded-full overflow-hidden border border-border bg-muted shrink-0">
              {displayAvatar ? (
                <Image src={displayAvatar} alt="Avatar" fill sizes="64px" className="object-cover" unoptimized />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-2xl text-white">
                  {initials}
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <svg className="size-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={avatarUploading}
                className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card hover:bg-accent transition-colors text-foreground disabled:opacity-50"
              >
                Cambiar foto
              </button>
              {avatarError && <p className="text-xs text-destructive mt-1">{avatarError}</p>}
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG o WebP. Máx 2 MB.</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>

          {/* Full name */}
          <div>
            <label htmlFor="full_name" className="field-label">Nombre completo</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              defaultValue={profile.full_name ?? ''}
              className="field-input sm:max-w-sm"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="profile_email" className="field-label">Email</label>
            <input
              id="profile_email"
              type="email"
              value={profile.email}
              readOnly
              disabled
              className="field-input sm:max-w-sm opacity-60 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">El email no se puede cambiar desde aquí.</p>
          </div>

          <div className="pt-1">
            <SubmitButton label="Guardar cambios" pendingLabel="Guardando..." />
          </div>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-1">Cambiar contraseña</h2>
        <p className="text-sm text-muted-foreground mb-5">Elegí una contraseña de al menos 8 caracteres.</p>
        <form action={passwordAction} className="space-y-4">
          {passwordState?.error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              {passwordState.error}
            </div>
          )}
          {passwordState?.success && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
              {passwordState.message}
            </div>
          )}

          <div>
            <label htmlFor="password" className="field-label">Nueva contraseña</label>
            <input id="password" name="password" type="password" required minLength={8} className="field-input sm:max-w-sm" />
          </div>
          <div>
            <label htmlFor="confirm" className="field-label">Confirmar contraseña</label>
            <input id="confirm" name="confirm" type="password" required minLength={8} className="field-input sm:max-w-sm" />
          </div>
          <div className="pt-1">
            <SubmitButton label="Cambiar contraseña" pendingLabel="Actualizando..." />
          </div>
        </form>
      </div>
    </div>
  );
}
