export type CharacterId = "kai" | "leonhard" | "scarlett" | "darius";

export interface CounselCharacter {
  id: CharacterId;
  name: string;
  title: string;
  quote: string;
  /** Horizontal slice index on roster sprite sheet (0–3) */
  rosterIndex: number;
}

export const COUNSEL_CHARACTERS: readonly CounselCharacter[] = [
  {
    id: "kai",
    name: "Kai Ashford",
    title: "Criminal Defense Attorney",
    quote: "Truth is a weapon. I just aim it.",
    rosterIndex: 0,
  },
  {
    id: "leonhard",
    name: "Leonhard Voss",
    title: "Corporate Litigation Attorney",
    quote: "In the labyrinth of law, I find the truth others hide.",
    rosterIndex: 1,
  },
  {
    id: "scarlett",
    name: "Scarlett Raines",
    title: "Appellate Attorney",
    quote: "Every verdict can be overturned. Especially the wrong ones.",
    rosterIndex: 2,
  },
  {
    id: "darius",
    name: "Darius Caelen",
    title: "International Law Attorney",
    quote: "Justice knows no borders. Neither do I.",
    rosterIndex: 3,
  },
] as const;

export const DEFAULT_CHARACTER_ID: CharacterId = "kai";

const FALLBACK_CHARACTER: CounselCharacter =
  COUNSEL_CHARACTERS[0] ?? {
    id: "kai",
    name: "Kai Ashford",
    title: "Criminal Defense Attorney",
    quote: "Truth is a weapon. I just aim it.",
    rosterIndex: 0,
  };

export function getCharacter(id: CharacterId): CounselCharacter {
  const found = COUNSEL_CHARACTERS.find((c) => c.id === id);
  return found ?? FALLBACK_CHARACTER;
}

export function rosterBackgroundPosition(index: number): string {
  const percent = index * (100 / 3);
  return `${percent}% center`;
}
