import {
  DEFAULT_AVATAR_CONFIG,
  type AvatarConfig,
} from "@/lib/database/types";
import type { CharacterId } from "@/lib/characters";

export function normalizeAvatarConfig(
  raw: AvatarConfig | null | undefined,
): AvatarConfig {
  if (!raw) {
    return DEFAULT_AVATAR_CONFIG;
  }
  const characterId = raw.characterId ?? DEFAULT_AVATAR_CONFIG.characterId;
  return {
    ...DEFAULT_AVATAR_CONFIG,
    ...raw,
    characterId: characterId as CharacterId,
  };
}
