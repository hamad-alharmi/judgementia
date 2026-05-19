"use client";

import type { ProfileRow } from "@/lib/database/types";

interface ProfileStatsProps {
  profile: ProfileRow | null;
  isLoading: boolean;
  judgeFavorability: number;
}

export function ProfileStats({
  profile,
  isLoading,
  judgeFavorability,
}: ProfileStatsProps) {
  const totalCases =
    (profile?.cases_won ?? 0) + (profile?.cases_lost ?? 0);
  const convictions = profile?.cases_won ?? 0;
  const acquittals = profile?.cases_lost ?? 0;

  return (
    <section className="border border-zinc-800 bg-zinc-950/60 p-5">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500/90">
        Profile Stats Block
      </h2>
      {isLoading ? (
        <p className="mt-4 font-mono text-xs text-zinc-600">Loading dossier…</p>
      ) : (
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <StatItem label="Total Cases Tried" value={totalCases} />
          <StatItem label="Convictions Secured" value={convictions} />
          <StatItem label="Acquittals" value={acquittals} />
          <StatItem
            label="AI Judge Favorability"
            value={`${judgeFavorability}%`}
          />
        </dl>
      )}
      {profile && (
        <p className="mt-4 border-t border-zinc-800 pt-3 font-legal text-sm text-zinc-400">
          Counsel <span className="text-zinc-200">{profile.username}</span>
        </p>
      )}
    </section>
  );
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-zinc-800/80 bg-black/40 px-3 py-3">
      <dt className="font-mono text-[9px] uppercase tracking-widest text-zinc-600">
        {label}
      </dt>
      <dd className="mt-1 font-legal text-xl text-zinc-100">{value}</dd>
    </div>
  );
}
