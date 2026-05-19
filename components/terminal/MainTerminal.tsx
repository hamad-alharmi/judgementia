"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_AVATAR_CONFIG,
  type AvatarConfig,
} from "@/lib/database/types";
import { useProfileRealtime } from "@/hooks/useProfileRealtime";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { useGameStateRealtime } from "@/hooks/useGameStateRealtime";
import { updateProfileAvatar } from "@/lib/supabase/data";
import { AvatarCustomizer } from "@/components/terminal/AvatarCustomizer";
import { ProfileStats } from "@/components/terminal/ProfileStats";
import { MatchmakingCore } from "@/components/terminal/MatchmakingCore";
import { parseScenarioFromRoom } from "@/lib/scenarios";

interface MainTerminalProps {
  userId: string;
}

export function MainTerminal({ userId }: MainTerminalProps) {
  const { profile, isLoading, refresh } = useProfileRealtime(userId);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(
    profile?.avatar_config ?? DEFAULT_AVATAR_CONFIG,
  );
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  useEffect(() => {
    if (profile?.avatar_config) {
      setAvatarConfig(profile.avatar_config);
    }
  }, [profile?.avatar_config]);

  const { room } = useRoomRealtime(activeRoomId);
  const { gameState } = useGameStateRealtime(activeRoomId);

  const judgeFavorability = useMemo(() => {
    const won = profile?.cases_won ?? 0;
    const lost = profile?.cases_lost ?? 0;
    const total = won + lost;
    if (total === 0) {
      return 50;
    }
    return Math.round((won / total) * 100);
  }, [profile?.cases_won, profile?.cases_lost]);

  const activeScenario = room ? parseScenarioFromRoom(room.scenario) : null;

  const saveAvatar = async () => {
    setIsSavingAvatar(true);
    await updateProfileAvatar(userId, avatarConfig);
    await refresh();
    setIsSavingAvatar(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 border-b border-zinc-800 pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500/80">
            Judgementia — Main Terminal
          </p>
          <h1 className="mt-2 font-legal text-3xl text-zinc-50">
            Supreme Litigation Command
          </h1>
          <p className="mt-2 max-w-2xl font-legal text-sm text-zinc-500">
            Configure counsel identity, review performance metrics, and deploy
            into synchronized multiplayer chambers.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-2">
          <AvatarCustomizer
            config={avatarConfig}
            onChange={setAvatarConfig}
            onSave={saveAvatar}
            isSaving={isSavingAvatar}
          />
          <ProfileStats
            profile={profile}
            isLoading={isLoading}
            judgeFavorability={judgeFavorability}
          />
          <div className="lg:col-span-2">
            <MatchmakingCore
              userId={userId}
              onRoomJoined={setActiveRoomId}
            />
          </div>
        </div>

        {room && (
          <aside className="mt-8 border border-amber-900/40 bg-amber-950/10 p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500/90">
              Active Chamber — {room.code} · {room.status}
            </p>
            {activeScenario && (
              <h3 className="mt-2 font-legal text-lg text-zinc-100">
                {activeScenario.title}
              </h3>
            )}
            {gameState && (
              <p className="mt-2 font-mono text-xs text-zinc-500">
                Jury tally: {gameState.guilty_votes} guilty /{" "}
                {gameState.not_guilty_votes} not guilty
              </p>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
