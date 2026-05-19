"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CourtSession } from "@/components/courtroom/CourtSession";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useGameStateRealtime } from "@/hooks/useGameStateRealtime";
import { useRoomRealtime } from "@/hooks/useRoomRealtime";
import { normalizeAvatarConfig } from "@/lib/avatar";
import type { CharacterId } from "@/lib/characters";
import type { RoomRow } from "@/lib/database/types";
import { fetchProfile, fetchRoomByCode } from "@/lib/supabase/data";

export default function TrialRoomPage() {
  const params = useParams();
  const router = useRouter();
  const code =
    typeof params.code === "string" ? params.code.trim().toUpperCase() : "";

  const { user, isLoading: authLoading } = useAuthSession();
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [displayName, setDisplayName] = useState("Counsel");
  const [defaultCharacterId, setDefaultCharacterId] =
    useState<CharacterId>("kai");
  const [loadError, setLoadError] = useState<string | null>(null);

  const { room: liveRoom } = useRoomRealtime(room?.id ?? null);
  const { gameState } = useGameStateRealtime(room?.id ?? null);
  const activeRoom = liveRoom ?? room;

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!user) {
      router.replace("/");
      return;
    }
    if (!code) {
      setLoadError("Invalid chamber code.");
      return;
    }

    void (async () => {
      try {
        const [fetchedRoom, profile] = await Promise.all([
          fetchRoomByCode(code),
          fetchProfile(user.id),
        ]);
        if (!fetchedRoom) {
          setLoadError("Chamber not found.");
          return;
        }
        setRoom(fetchedRoom);
        if (profile) {
          setDisplayName(profile.username);
          setDefaultCharacterId(
            normalizeAvatarConfig(profile.avatar_config).characterId,
          );
        }
      } catch (caught) {
        setLoadError(
          caught instanceof Error ? caught.message : "Failed to load chamber.",
        );
      }
    })();
  }, [authLoading, user, code, router]);

  if (authLoading || (!room && !loadError)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Loading chamber…
        </p>
      </div>
    );
  }

  if (loadError || !user || !activeRoom || !gameState) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4">
        <p className="font-sans text-sm text-red-300">
          {loadError ?? "Chamber unavailable."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="border border-zinc-700 px-4 py-2 font-mono text-[10px] uppercase text-zinc-400"
        >
          Return to Terminal
        </button>
      </div>
    );
  }

  return (
    <CourtSession
      room={activeRoom}
      gameState={gameState}
      userId={user.id}
      displayName={displayName}
      defaultCharacterId={defaultCharacterId}
      onExit={() => router.push("/")}
    />
  );
}
