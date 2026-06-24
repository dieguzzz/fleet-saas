export function MalaInfluenciaLogo({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="46" fill="#0E0D0C" stroke="#C1262B" strokeWidth="4" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#B8862F" strokeWidth="1.5" />
      <text x="50" y="44" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="18" fill="#ECE6D6">MALA</text>
      <text x="50" y="60" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="11" fill="#C1262B">INFLUENCIA</text>
      <text x="50" y="74" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" letterSpacing="4" fill="#B8862F">★ ★ ★</text>
    </svg>
  );
}
