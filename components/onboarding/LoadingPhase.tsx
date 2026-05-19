import { ScalesOfJustice } from "@/components/icons/ScalesOfJustice";

export function LoadingPhase() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950">
      <div className="animate-scales-tilt text-white">
        <ScalesOfJustice className="h-24 w-24" />
      </div>
      <p className="mt-8 font-mono text-xs uppercase tracking-[0.4em] text-zinc-500">
        Judgementia
      </p>
      <p className="mt-2 font-legal text-sm text-zinc-600">
        Initializing judicial terminal…
      </p>
    </div>
  );
}
