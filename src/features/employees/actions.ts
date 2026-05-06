'use server';

import { createClient } from '@/services/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { logAudit } from '@/lib/audit';

const employeeSchema = z.object({
  full_name: z.string().min(1, 'El nombre es obligatorio'),
  position: z.string().optional(),
  document_number: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  license_number: z.string().optional(),
  license_expiry: z.string().optional(),
  hire_date: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).default('active'),
  notes: z.string().optional(),
});

export type EmployeeFormState = { error?: string; success?: boolean };

export async function createEmployee(prevState: EmployeeFormState | null, formData: FormData): Promise<EmployeeFormState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (!org) return { error: 'Organización no encontrada' };

  const validated = employeeSchema.safeParse({
    full_name: formData.get('full_name'),
    position: formData.get('position') || undefined,
    document_number: formData.get('document_number') || undefined,
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    license_number: formData.get('license_number') || undefined,
    license_expiry: formData.get('license_expiry') || undefined,
    hire_date: formData.get('hire_date') || undefined,
    status: formData.get('status') || 'active',
    notes: formData.get('notes') || undefined,
  });

  if (!validated.success) return { error: validated.error.issues[0].message };

  const { data: employee, error } = await supabase.from('employees').insert({
    organization_id: org.id,
    ...validated.data,
    license_expiry: validated.data.license_expiry || null,
    hire_date: validated.data.hire_date || null,
  }).select('id').single();

  if (error) {
    console.error('Error creating employee:', error);
    return { error: 'Error al crear empleado' };
  }

  await logAudit({ organizationId: org.id, action: 'create', resourceType: 'employee', resourceId: employee?.id, resourceLabel: validated.data.full_name });

  revalidatePath(`/${orgSlug}/employees`);
  redirect(`/${orgSlug}/employees`);
}

export async function updateEmployee(prevState: EmployeeFormState | null, formData: FormData): Promise<EmployeeFormState> {
  const supabase = await createClient();
  const orgSlug = formData.get('orgSlug') as string;
  const employeeId = formData.get('employeeId') as string;

  const validated = employeeSchema.safeParse({
    full_name: formData.get('full_name'),
    position: formData.get('position') || undefined,
    document_number: formData.get('document_number') || undefined,
    phone: formData.get('phone') || undefined,
    email: formData.get('email') || undefined,
    license_number: formData.get('license_number') || undefined,
    license_expiry: formData.get('license_expiry') || undefined,
    hire_date: formData.get('hire_date') || undefined,
    status: formData.get('status') || 'active',
    notes: formData.get('notes') || undefined,
  });

  if (!validated.success) return { error: validated.error.issues[0].message };

  const { error } = await supabase.from('employees').update({
    ...validated.data,
    license_expiry: validated.data.license_expiry || null,
    hire_date: validated.data.hire_date || null,
    updated_at: new Date().toISOString(),
  }).eq('id', employeeId);

  if (error) {
    console.error('Error updating employee:', error);
    return { error: 'Error al actualizar empleado' };
  }

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single();
  if (org) await logAudit({ organizationId: org.id, action: 'update', resourceType: 'employee', resourceId: employeeId, resourceLabel: validated.data.full_name });

  revalidatePath(`/${orgSlug}/employees`);
  redirect(`/${orgSlug}/employees`);
}

export async function deleteEmployee(employeeId: string, orgSlug: string) {
  const supabase = await createClient();
  const { data: emp } = await supabase.from('employees').select('full_name, organization_id').eq('id', employeeId).single();
  const { error } = await supabase.from('employees').delete().eq('id', employeeId);
  if (error) throw new Error('Error al eliminar empleado');
  if (emp) await logAudit({ organizationId: emp.organization_id, action: 'delete', resourceType: 'employee', resourceId: employeeId, resourceLabel: emp.full_name });
  revalidatePath(`/${orgSlug}/employees`);
}

export async function getEmployees(orgId: string) {
  const supabase = await createClient();
  return await supabase
    .from('employees')
    .select('*')
    .eq('organization_id', orgId)
    .order('full_name');
}
