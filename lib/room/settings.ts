import type { CharacterId } from "@/lib/characters";

export interface RoomSettings {
  chamberName: string;
  prosecutorIsAi: boolean;
  defendantIsAi: boolean;
  prosecutorAiCharacter: CharacterId;
  defendantAiCharacter: CharacterId;
  isPublic: boolean;
}

export const DEFAULT_ROOM_SETTINGS: RoomSettings = {
  chamberName: "High Court Chamber",
  prosecutorIsAi: false,
  defendantIsAi: true,
  prosecutorAiCharacter: "leonhard",
  defendantAiCharacter: "kai",
  isPublic: true,
};

export function parseRoomSettings(raw: unknown): RoomSettings {
  if (typeof raw !== "object" || raw === null) {
    return DEFAULT_ROOM_SETTINGS;
  }
  const record = raw as Record<string, unknown>;
  return {
    chamberName:
      typeof record.chamberName === "string"
        ? record.chamberName
        : DEFAULT_ROOM_SETTINGS.chamberName,
    prosecutorIsAi:
      typeof record.prosecutorIsAi === "boolean"
        ? record.prosecutorIsAi
        : DEFAULT_ROOM_SETTINGS.prosecutorIsAi,
    defendantIsAi:
      typeof record.defendantIsAi === "boolean"
        ? record.defendantIsAi
        : DEFAULT_ROOM_SETTINGS.defendantIsAi,
    prosecutorAiCharacter: isCharacterId(record.prosecutorAiCharacter)
      ? record.prosecutorAiCharacter
      : DEFAULT_ROOM_SETTINGS.prosecutorAiCharacter,
    defendantAiCharacter: isCharacterId(record.defendantAiCharacter)
      ? record.defendantAiCharacter
      : DEFAULT_ROOM_SETTINGS.defendantAiCharacter,
    isPublic:
      typeof record.isPublic === "boolean"
        ? record.isPublic
        : DEFAULT_ROOM_SETTINGS.isPublic,
  };
}

function isCharacterId(value: unknown): value is CharacterId {
  return (
    value === "kai" ||
    value === "leonhard" ||
    value === "scarlett" ||
    value === "darius"
  );
}
