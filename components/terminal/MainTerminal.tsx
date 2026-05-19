"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { CharacterId } from "@/lib/characters";
import type { AvatarConfig, PlayerRole } from "@/lib/database/types";
import { normalizeAvatarConfig } from "@/lib/avatar";
import { useProfileRealtime } from "@/hooks/useProfileRealtime";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { useGameStateRealtime } from "@/hooks/useGameStateRealtime";
import { updateProfileAvatar } from "@/lib/supabase/data";
import { CharacterSelect } from "@/components/terminal/CharacterSelect";
import { ProfileStats } from "@/components/terminal/ProfileStats";
import { MatchmakingCore } from "@/components/terminal/MatchmakingCore";
import { Courtroom } from "@/components/courtroom/Courtroom";

interface MainTerminalProps {
  userId: string;
}

export function MainTerminal({ userId }: MainTerminalProps) {
  const { profile, isLoading, refresh } = useProfileRealtime(userId);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(
    normalizeAvatarConfig(undefined),
  );
  const [playerRole, setPlayerRole] = useState<PlayerRole>("prosecutor");
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [inCourtroom, setInCourtroom] = useState(false);

  useEffect(() => {
    if (profile?.avatar_config) {
      setAvatarConfig(normalizeAvatarConfig(profile.avatar_config));
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

  const saveCharacter = async (next: AvatarConfig) => {
    setAvatarConfig(next);
    setIsSaving(true);
    await updateProfileAvatar(userId, next);
    await refresh();
    setIsSaving(false);
  };

  if (inCourtroom && room && gameState) {
    return (
      <Courtroom
        room={room}
        gameState={gameState}
        userId={userId}
        characterId={avatarConfig.characterId}
        playerRole={playerRole}
        onExit={() => {
          setInCourtroom(false);
          setActiveRoomId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 px-4 py-10 text-zinc-100">
      <motion.div className="mx-auto max-w-6xl" layout>
        <header className="mb-10 border-b border-zinc-800 pb-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500/80">
            Judgementia — Main Terminal
          </p>
          <h1 className="mt-2 font-legal text-3xl text-zinc-50">
            Supreme Litigation Command
          </h1>
        </header>

        <motion.div
          className="mb-6 border border-zinc-800 bg-zinc-950/60 p-5"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500/90">
            Trial Role
          </h2>
          <div className="mt-3 flex gap-2">
            {(["prosecutor", "defendant"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setPlayerRole(role)}
                className={
                  playerRole === role
                    ? "flex-1 border border-amber-600 bg-amber-950/40 py-2.5 font-mono text-[10px] uppercase tracking-widest text-amber-100"
                    : "flex-1 border border-zinc-800 py-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 hover:border-zinc-600"
                }
              >
                {role}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-2">
          <CharacterSelect
            selectedId={avatarConfig.characterId}
            onSelect={(id: CharacterId) => {
              const next = { ...avatarConfig, characterId: id };
              void saveCharacter(next);
            }}
          />
          <ProfileStats
            profile={profile}
            isLoading={isLoading}
            judgeFavorability={judgeFavorability}
          />
          <motion.div className="lg:col-span-2" layout>
            <MatchmakingCore
              userId={userId}
              characterId={avatarConfig.characterId}
              playerRole={playerRole}
              onRoomJoined={(id) => {
                setActiveRoomId(id);
                setInCourtroom(true);
              }}
            />
          </motion.div>
        </div>

        {isSaving ? (
          <p className="mt-4 text-center font-mono text-[10px] text-zinc-600">
            Saving counsel dossier…
          </p>
        ) : null}

        {room && !inCourtroom ? (
          <motion.aside
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 border border-amber-900/40 bg-amber-950/10 p-5"
          >
            <p className="font-mono text-[10px] uppercase text-amber-500/90">
              Active chamber {room.code}
            </p>
            <button
              type="button"
              onClick={() => setInCourtroom(true)}
              className="mt-3 border border-amber-700 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-amber-100"
            >
              Re-enter Courtroom
            </button>
          </motion.aside>
        ) : null}
      </motion.div>
    </div>
  );
}
