"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { CharacterId } from "@/lib/characters";
import type { AvatarConfig } from "@/lib/database/types";
import { normalizeAvatarConfig } from "@/lib/avatar";
import { useProfileRealtime } from "@/hooks/useProfileRealtime";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { useGameStateRealtime } from "@/hooks/useGameStateRealtime";
import { fetchRoom, updateProfileAvatar } from "@/lib/supabase/data";
import { CharacterSelect } from "@/components/terminal/CharacterSelect";
import { ProfileStats } from "@/components/terminal/ProfileStats";
import { MatchmakingCore } from "@/components/terminal/MatchmakingCore";
import { CourtSession } from "@/components/courtroom/CourtSession";

interface MainTerminalProps {
  userId: string;
}

export function MainTerminal({ userId }: MainTerminalProps) {
  const router = useRouter();
  const { profile, isLoading, refresh } = useProfileRealtime(userId);
  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(
    normalizeAvatarConfig(undefined),
  );
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [inSession, setInSession] = useState(false);

  useEffect(() => {
    if (profile?.avatar_config) {
      setAvatarConfig(normalizeAvatarConfig(profile.avatar_config));
    }
  }, [profile?.avatar_config]);

  const { room } = useRoomRealtime(activeRoomId);
  const { gameState } = useGameStateRealtime(activeRoomId);

  const displayName = profile?.username ?? "Counsel";

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

  if (inSession && room && gameState) {
    return (
      <CourtSession
        room={room}
        gameState={gameState}
        userId={userId}
        displayName={displayName}
        defaultCharacterId={avatarConfig.characterId}
        onExit={() => {
          setInSession(false);
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
          <p className="mt-2 max-w-xl font-legal text-sm text-zinc-500">
            Select your default counsel portrait, then fabricate or join a chamber.
            Roles and AI assignments are configured in the waiting lobby.
          </p>
        </header>

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
              defaultCharacterId={avatarConfig.characterId}
              displayName={displayName}
              onRoomJoined={async (id) => {
                setActiveRoomId(id);
                const joined = await fetchRoom(id);
                if (joined?.code) {
                  router.push(`/room/${joined.code}`);
                  return;
                }
                setInSession(true);
              }}
            />
          </motion.div>
        </div>

        {isSaving ? (
          <p className="mt-4 text-center font-mono text-[10px] text-zinc-600">
            Saving counsel dossier…
          </p>
        ) : null}
      </motion.div>
    </div>
  );
}
