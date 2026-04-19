import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center">
        <div className="text-6xl mb-6">🚫</div>
        <h1 className="text-3xl font-bold text-foreground mb-4">
          Acceso No Autorizado
        </h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          No tienes permisos para acceder a esta página.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Ir al Inicio
          </Link>
          <Link
            href="/login"
            className="border border-border hover:border-muted-foreground text-muted-foreground hover:text-foreground px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
