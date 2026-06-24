import Link from 'next/link';

export function MerlinIcon({ size = 48 }: { size?: number }) {
  return (
    <div
      className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
      style={{ width: size, height: size }}
    >
      <svg
        className="text-white"
        style={{ width: size * 0.57, height: size * 0.57 }}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  );
}

export function MerlinLogoLink({ size = 48 }: { size?: number }) {
  return (
    <Link href="/" className="inline-flex flex-col items-center gap-2">
      <MerlinIcon size={size} />
      <span className="text-foreground font-bold text-xl tracking-tight">Merlin</span>
    </Link>
  );
}
