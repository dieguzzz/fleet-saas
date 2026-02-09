'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  role: z.string().optional(), // Customer, Supplier, Driver, etc.
  company: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
  is_emergency: z.boolean().optional(),
});

export type CreateContactState = {
  error?: string;
  success?: boolean;
};

export async function createContact(prevState: CreateContactState, formData: FormData): Promise<CreateContactState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single();

  if (!org) {
    return { error: 'Organización no encontrada' };
  }

  const rawData = {
    name: formData.get('name'),
    role: formData.get('role'),
    company: formData.get('company'),
    phone: formData.get('phone'),
    email: formData.get('email'),
    address: formData.get('address'),
    notes: formData.get('notes'),
    is_emergency: formData.get('is_emergency') === 'on',
  };

  const validatedFields = contactSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: 'Datos inválidos' };
  }

  const { error } = await supabase.from('contacts').insert({
    organization_id: org.id,
    ...validatedFields.data,
  });

  if (error) {
    console.error('Error creating contact:', error);
    return { error: 'Error al crear contacto' };
  }

  revalidatePath(`/${orgSlug}/contacts`);
  redirect(`/${orgSlug}/contacts`);
}

export async function getContacts(orgId: string) {
  const supabase = await createClient();

  return await supabase
    .from('contacts')
    .select('*')
    .eq('organization_id', orgId)
    .order('name');
}
