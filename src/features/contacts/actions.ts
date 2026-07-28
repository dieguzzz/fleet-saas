'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';
import { parseRoles } from './lib';

const contactSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  roles: z.array(z.string()).min(1, 'Elegí al menos un rol'),
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  is_emergency: z.boolean().optional(),
});

export type ContactFormState = { error?: string; success?: boolean; id?: string; name?: string };

async function resolveOrg(supabase: Awaited<ReturnType<typeof createClient>>, orgSlug: string) {
  const { data } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  return data;
}

function parseContactForm(formData: FormData) {
  return {
    name: formData.get('name') as string,
    roles: parseRoles(formData),
    company: (formData.get('company') as string) || undefined,
    phone: (formData.get('phone') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    address: (formData.get('address') as string) || undefined,
    notes: (formData.get('notes') as string) || undefined,
    is_emergency: formData.get('is_emergency') === 'on',
  };
}

export async function createContact(
  prevState: ContactFormState | null,
  formData: FormData
): Promise<ContactFormState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;
  const org = await resolveOrg(supabase, orgSlug);
  if (!org) return { error: 'Organización no encontrada' };

  const validated = contactSchema.safeParse(parseContactForm(formData));
  if (!validated.success) return { error: validated.error.issues[0].message };

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({ organization_id: org.id, ...validated.data })
    .select('id')
    .single();

  if (error) return { error: 'Error al crear el contacto' };

  await logAudit({
    organizationId: org.id,
    action: 'create',
    resourceType: 'contact',
    resourceId: contact?.id,
    resourceLabel: validated.data.name,
  });

  revalidatePath(`/${orgSlug}/contacts`);
  return { success: true, id: contact?.id, name: validated.data.name };
}

export async function updateContact(
  contactId: string,
  orgSlug: string,
  prevState: ContactFormState | null,
  formData: FormData
): Promise<ContactFormState> {
  const supabase = await createClient();
  const org = await resolveOrg(supabase, orgSlug);
  if (!org) return { error: 'Organización no encontrada' };

  const validated = contactSchema.safeParse(parseContactForm(formData));
  if (!validated.success) return { error: validated.error.issues[0].message };

  const { error } = await supabase
    .from('contacts')
    .update({ ...validated.data, updated_at: new Date().toISOString() })
    .eq('id', contactId)
    .eq('organization_id', org.id);

  if (error) return { error: 'Error al actualizar el contacto' };

  revalidatePath(`/${orgSlug}/contacts`);
  return { success: true };
}

export async function deleteContact(contactId: string, orgSlug: string): Promise<void> {
  const supabase = await createClient();
  const org = await resolveOrg(supabase, orgSlug);
  if (!org) return;

  await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('organization_id', org.id);

  revalidatePath(`/${orgSlug}/contacts`);
}

export async function getContacts(orgId: string) {
  const supabase = await createClient();
  return await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
}

export async function getCustomersAndSuppliers(orgId: string) {
  const supabase = await createClient();
  return await supabase
    .from('contacts')
    .select('id, name, roles, company, tax_id')
    .eq('organization_id', orgId)
    // overlaps = "tiene alguno de estos roles". Un contacto que es cliente Y
    // proveedor entra una sola vez y después cada página filtra el que necesita.
    .overlaps('roles', ['customer', 'supplier'])
    .order('name');
}
