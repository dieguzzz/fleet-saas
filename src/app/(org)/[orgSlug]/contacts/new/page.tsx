import ContactForm from '@/features/contacts/components/ContactForm';

export default async function NewContactPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Registrar Nuevo Contacto</h1>
        <p className="text-slate-500">Agrega un cliente, proveedor o empleado al directorio.</p>
      </div>
      
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <ContactForm orgSlug={orgSlug} />
      </div>
    </div>
  );
}
