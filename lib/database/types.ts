export type RoomStatus =
  | "lobby"
  | "prosecutor_turn"
  | "defendant_turn"
  | "jury_voting"
  | "verdict";

import type { CharacterId } from "@/lib/characters";

export type PlayerRole = "prosecutor" | "defendant";

export interface AvatarConfig {
  characterId: CharacterId;
  skinTone: "ivory" | "bronze" | "obsidian";
  robeColor: "midnight" | "crimson" | "gold";
  badgeStyle: "scales" | "gavel" | "seal";
  hairStyle: "slick" | "bald" | "silver";
}

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  characterId: "kai",
  skinTone: "ivory",
  robeColor: "midnight",
  badgeStyle: "scales",
  hairStyle: "slick",
};

export interface RoomPlayerRow {
  room_id: string;
  user_id: string;
  character_id: CharacterId;
  role: PlayerRole;
}

export interface RoomRow {
  id: string;
  code: string;
  status: RoomStatus;
  scenario: string;
  host_id: string | null;
}

export interface GameStateRow {
  room_id: string;
  prosecutor_text: string;
  defendant_text: string;
  guilty_votes: number;
  not_guilty_votes: number;
  verdict_json: JudgeVerdictJson | null;
}

export interface ProfileRow {
  id: string;
  username: string;
  avatar_config: AvatarConfig;
  cases_won: number;
  cases_lost: number;
}

export interface JudgeVerdictJson {
  finalVerdict: "GUILTY" | "NOT GUILTY";
  reasoning: string;
  punishment: string;
}

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: RoomRow;
        Insert: {
          id?: string;
          code: string;
          status: RoomStatus;
          scenario: string;
        };
        Update: Partial<RoomRow>;
      };
      game_state: {
        Row: GameStateRow;
        Insert: {
          room_id: string;
          prosecutor_text?: string;
          defendant_text?: string;
          guilty_votes?: number;
          not_guilty_votes?: number;
          verdict_json?: JudgeVerdictJson | null;
        };
        Update: Partial<GameStateRow>;
      };
      profiles: {
        Row: ProfileRow;
        Insert: {
          id: string;
          username: string;
          avatar_config: AvatarConfig;
          cases_won?: number;
          cases_lost?: number;
        };
        Update: Partial<ProfileRow>;
      };
      room_players: {
        Row: RoomPlayerRow;
        Insert: RoomPlayerRow;
        Update: Partial<RoomPlayerRow>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
