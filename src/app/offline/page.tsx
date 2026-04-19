export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-foreground">
      <span className="text-5xl">🚛</span>
      <h1 className="text-xl font-semibold">Sin conexión</h1>
      <p className="text-sm text-muted-foreground">Revisá tu conexión a internet e intentá de nuevo.</p>
    </div>
  );
}
