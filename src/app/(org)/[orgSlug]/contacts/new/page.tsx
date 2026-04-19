import ContactForm from '@/features/contacts/components/ContactForm';

export default async function NewContactPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Registrar Nuevo Contacto</h1>
        <p className="text-muted-foreground text-sm mt-1">Agrega un cliente, proveedor o empleado al directorio.</p>
      </div>
      <ContactForm orgSlug={orgSlug} />
    </div>
  );
}
