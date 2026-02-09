import TripExpenseForm from '@/features/trips/components/TripExpenseForm';

export default async function NewTripExpensePage({
  params,
}: {
  params: Promise<{ orgSlug: string; tripId: string }>;
}) {
  const { orgSlug, tripId } = await params;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Registrar Gasto</h1>
        <p className="text-slate-400">Añade un nuevo gasto a este viaje.</p>
      </div>
      
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
        <TripExpenseForm orgSlug={orgSlug} tripId={tripId} />
      </div>
    </div>
  );
}
