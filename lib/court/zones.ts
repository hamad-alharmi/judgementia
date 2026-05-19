import type { RoomStatus } from "@/lib/database/types";

export type CourtZoneId = "judge" | "jury" | "defense" | "prosecution";

export interface CourtZoneMeta {
  id: CourtZoneId;
  label: string;
  /** background-position for 2×2 zones-grid.png */
  backgroundPosition: string;
}

export const COURT_ZONES: Record<CourtZoneId, CourtZoneMeta> = {
  judge: {
    id: "judge",
    label: "Judge",
    backgroundPosition: "0% 0%",
  },
  jury: {
    id: "jury",
    label: "Jury",
    backgroundPosition: "100% 0%",
  },
  defense: {
    id: "defense",
    label: "Defense",
    backgroundPosition: "0% 100%",
  },
  prosecution: {
    id: "prosecution",
    label: "Prosecution",
    backgroundPosition: "100% 100%",
  },
};

export function zoneForRoomStatus(status: RoomStatus): CourtZoneId {
  switch (status) {
    case "prosecutor_turn":
      return "prosecution";
    case "defendant_turn":
      return "defense";
    case "jury_voting":
      return "jury";
    case "verdict":
    case "lobby":
    default:
      return "judge";
  }
}

export function statusLabel(status: RoomStatus): string {
  switch (status) {
    case "lobby":
      return "Chamber Assembly";
    case "prosecutor_turn":
      return "Prosecution Statement";
    case "defendant_turn":
      return "Defense Statement";
    case "jury_voting":
      return "Jury Deliberation";
    case "verdict":
      return "Final Verdict";
  }
}
