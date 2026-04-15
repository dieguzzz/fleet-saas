import ContactForm from '@/features/contacts/components/ContactForm';

export default async function NewContactPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Registrar Nuevo Contacto</h1>
        <p className="text-slate-500 text-sm mt-1">Agrega un cliente, proveedor o empleado al directorio.</p>
      </div>
      <ContactForm orgSlug={orgSlug} />
    </div>
  );
}
