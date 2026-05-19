import type { PlayerRole, RoomPlayerRow } from "@/lib/database/types";
import type { RoomSettings } from "@/lib/room/settings";

export function playerForRole(
  players: RoomPlayerRow[],
  role: PlayerRole,
): RoomPlayerRow | undefined {
  return players.find((p) => p.role === role);
}

export function isRoleAvailable(
  settings: RoomSettings,
  players: RoomPlayerRow[],
  role: PlayerRole,
): boolean {
  if (role === "prosecutor" && settings.prosecutorIsAi) {
    return false;
  }
  if (role === "defendant" && settings.defendantIsAi) {
    return false;
  }
  return !playerForRole(players, role);
}

export function canStartTrial(
  settings: RoomSettings,
  players: RoomPlayerRow[],
): boolean {
  const prosecutionReady =
    settings.prosecutorIsAi || Boolean(playerForRole(players, "prosecutor")?.is_ready);
  const defenseReady =
    settings.defendantIsAi || Boolean(playerForRole(players, "defendant")?.is_ready);
  return prosecutionReady && defenseReady;
}
