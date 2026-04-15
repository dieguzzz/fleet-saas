import TripExpenseForm from '@/features/trips/components/TripExpenseForm';

export default async function NewTripExpensePage({
  params,
}: {
  params: Promise<{ orgSlug: string; tripId: string }>;
}) {
  const { orgSlug, tripId } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-800">Registrar Gasto</h1>
        <p className="text-slate-500 text-sm mt-1">Añade un nuevo gasto a este viaje.</p>
      </div>
      <TripExpenseForm orgSlug={orgSlug} tripId={tripId} />
    </div>
  );
}
