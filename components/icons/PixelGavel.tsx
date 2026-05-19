export function PixelGavel({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="currentColor"
      aria-hidden
      shapeRendering="crispEdges"
    >
      <rect x="28" y="4" width="6" height="14" />
      <rect x="22" y="10" width="18" height="6" />
      <rect x="20" y="16" width="22" height="8" />
      <rect x="10" y="22" width="28" height="4" transform="rotate(-35 24 24)" />
      <rect x="6" y="30" width="10" height="4" transform="rotate(-35 11 32)" />
      <rect x="4" y="36" width="28" height="4" />
      <rect x="2" y="40" width="32" height="6" />
    </svg>
  );
}
