"use client";

import { useEffect, useMemo, useState } from "react";
import type { CharacterId } from "@/lib/characters";
import type { GameStateRow, PlayerRole, RoomRow } from "@/lib/database/types";
import { parseRoomSettings } from "@/lib/room/settings";
import { fetchRoomPlayers } from "@/lib/supabase/data";
import { WaitingLobby } from "@/components/lobby/WaitingLobby";
import { Courtroom } from "@/components/courtroom/Courtroom";

interface CourtSessionProps {
  room: RoomRow;
  gameState: GameStateRow;
  userId: string;
  displayName: string;
  defaultCharacterId: CharacterId;
  onExit: () => void;
}

export function CourtSession({
  room,
  gameState,
  userId,
  displayName,
  defaultCharacterId,
  onExit,
}: CourtSessionProps) {
  const [playerRole, setPlayerRole] = useState<PlayerRole>("prosecutor");
  const [characterId, setCharacterId] =
    useState<CharacterId>(defaultCharacterId);
  const [phase, setPhase] = useState<"lobby" | "trial">(
    room.status === "lobby" ? "lobby" : "trial",
  );

  const settings = useMemo(
    () => parseRoomSettings(room.settings),
    [room.settings],
  );

  useEffect(() => {
    if (room.status === "lobby") {
      setPhase("lobby");
    } else {
      setPhase("trial");
    }
  }, [room.status]);

  useEffect(() => {
    void fetchRoomPlayers(room.id).then((players) => {
      const me = players.find((p) => p.user_id === userId);
      if (me) {
        setPlayerRole(me.role);
        setCharacterId(me.character_id);
      }
    });
  }, [room.id, userId, room.status]);

  if (phase === "lobby" || room.status === "lobby") {
    return (
      <WaitingLobby
        room={room}
        userId={userId}
        displayName={displayName}
        defaultCharacterId={defaultCharacterId}
        onExit={onExit}
        onTrialStart={() => setPhase("trial")}
      />
    );
  }

  const prosecutionCharacter = settings.prosecutorIsAi
    ? settings.prosecutorAiCharacter
    : characterId;
  const defenseCharacter = settings.defendantIsAi
    ? settings.defendantAiCharacter
    : characterId;

  const effectiveCharacter =
    playerRole === "prosecutor" ? prosecutionCharacter : defenseCharacter;

  return (
    <Courtroom
      room={room}
      gameState={gameState}
      userId={userId}
      characterId={effectiveCharacter}
      playerRole={playerRole}
      settings={settings}
      onExit={onExit}
    />
  );
}
