"use client";

import type { AvatarConfig } from "@/lib/database/types";

interface AvatarCustomizerProps {
  config: AvatarConfig;
  onChange: (config: AvatarConfig) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

type AvatarKey = keyof AvatarConfig;

const OPTIONS: Record<AvatarKey, readonly AvatarConfig[AvatarKey][]> = {
  skinTone: ["ivory", "bronze", "obsidian"],
  robeColor: ["midnight", "crimson", "gold"],
  badgeStyle: ["scales", "gavel", "seal"],
  hairStyle: ["slick", "bald", "silver"],
} as const;

const LABELS: Record<AvatarKey, string> = {
  skinTone: "Skin Tone",
  robeColor: "Robe Color",
  badgeStyle: "Badge",
  hairStyle: "Hair",
};

export function AvatarCustomizer({
  config,
  onChange,
  onSave,
  isSaving,
}: AvatarCustomizerProps) {
  const cycle = (key: AvatarKey) => {
    const list = OPTIONS[key];
    const currentIndex = list.indexOf(config[key]);
    const nextIndex = (currentIndex + 1) % list.length;
    const nextValue = list[nextIndex];
    if (nextValue === undefined) {
      return;
    }
    onChange({ ...config, [key]: nextValue });
  };

  return (
    <section className="border border-zinc-800 bg-zinc-950/60 p-5">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500/90">
        Avatar Customizer Matrix
      </h2>
      <div className="mt-4 flex items-end gap-4" aria-label="Avatar preview">
        <div
          className="relative h-28 w-20 border-2 border-zinc-700"
          style={{
            background:
              config.skinTone === "ivory"
                ? "#e7e5e4"
                : config.skinTone === "bronze"
                  ? "#a8a29e"
                  : "#44403c",
          }}
        >
          <div
            className="absolute bottom-0 left-0 right-0 h-16"
            style={{
              background:
                config.robeColor === "midnight"
                  ? "#18181b"
                  : config.robeColor === "crimson"
                    ? "#7f1d1d"
                    : "#854d0e",
            }}
          />
          <div className="absolute -top-1 left-1/2 h-3 w-8 -translate-x-1/2 bg-zinc-800" />
        </div>
        <ul className="flex-1 space-y-2">
          {(Object.keys(OPTIONS) as AvatarKey[]).map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => cycle(key)}
                className="flex w-full items-center justify-between border border-zinc-800 px-3 py-2 text-left font-mono text-xs text-zinc-300 hover:border-amber-800"
              >
                <span className="text-zinc-500">{LABELS[key]}</span>
                <span className="uppercase text-amber-200/90">
                  {config[key]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        onClick={() => void onSave()}
        disabled={isSaving}
        className="mt-4 w-full border border-zinc-700 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300 hover:border-amber-700 disabled:opacity-50"
      >
        {isSaving ? "Saving Dossier…" : "Commit Avatar"}
      </button>
    </section>
  );
}
