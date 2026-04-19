import TripExpenseForm from '@/features/trips/components/TripExpenseForm';

export default async function NewTripExpensePage({
  params,
}: {
  params: Promise<{ orgSlug: string; tripId: string }>;
}) {
  const { orgSlug, tripId } = await params;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Registrar Gasto</h1>
        <p className="text-muted-foreground text-sm mt-1">Añade un nuevo gasto a este viaje.</p>
      </div>
      <TripExpenseForm orgSlug={orgSlug} tripId={tripId} />
    </div>
  );
}
