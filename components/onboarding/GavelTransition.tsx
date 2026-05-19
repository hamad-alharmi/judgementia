import { PixelGavel } from "@/components/icons/PixelGavel";

export function GavelTransition() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="animate-gavel-slam text-amber-400">
        <PixelGavel className="h-40 w-40 drop-shadow-[0_0_24px_rgba(251,191,36,0.35)]" />
      </div>
      <p className="absolute bottom-16 font-mono text-xs uppercase tracking-[0.5em] text-zinc-600">
        Order in the court
      </p>
    </div>
  );
}
