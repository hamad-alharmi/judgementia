import type { PlayerRole, RoomStatus } from "@/lib/database/types";

export type { PlayerRole };

export function getNextStatus(current: RoomStatus): RoomStatus | null {
  switch (current) {
    case "lobby":
      return "prosecutor_turn";
    case "prosecutor_turn":
      return "defendant_turn";
    case "defendant_turn":
      return "jury_voting";
    case "jury_voting":
      return "verdict";
    case "verdict":
      return null;
  }
}

export function canSubmitStatement(
  status: RoomStatus,
  role: PlayerRole,
): boolean {
  if (status === "prosecutor_turn" && role === "prosecutor") {
    return true;
  }
  if (status === "defendant_turn" && role === "defendant") {
    return true;
  }
  return false;
}

export function statementFieldForStatus(
  status: RoomStatus,
): "prosecutor_text" | "defendant_text" | null {
  if (status === "prosecutor_turn") {
    return "prosecutor_text";
  }
  if (status === "defendant_turn") {
    return "defendant_text";
  }
  return null;
}
