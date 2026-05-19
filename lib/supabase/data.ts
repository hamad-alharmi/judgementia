import type { CharacterId } from "@/lib/characters";
import type {
  AvatarConfig,
  GameStateRow,
  PlayerRole,
  ProfileRow,
  RoomPlayerRow,
  RoomRow,
  RoomStatus,
} from "@/lib/database/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatSupabaseError } from "@/lib/supabase/errors";

export async function upsertProfileRow(input: {
  id: string;
  username: string;
  avatar_config: AvatarConfig;
}): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("profiles").upsert([input]);
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function updateProfileAvatar(
  userId: string,
  avatar_config: AvatarConfig,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_config })
    .eq("id", userId);
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function fetchProfile(
  userId: string,
): Promise<ProfileRow | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
  return data as ProfileRow | null;
}

export async function fetchRoom(roomId: string): Promise<RoomRow | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .maybeSingle();
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
  return data as RoomRow | null;
}

export async function fetchRoomByCode(code: string): Promise<RoomRow | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .maybeSingle();
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
  return data as RoomRow | null;
}

export async function createRoomRow(input: {
  code: string;
  status: RoomStatus;
  scenario: string;
  host_id: string;
}): Promise<RoomRow> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("rooms")
    .insert([
      {
        code: input.code,
        status: input.status,
        scenario: input.scenario,
        host_id: input.host_id,
      },
    ])
    .select("*")
    .single();
  if (error || !data) {
    throw new Error(formatSupabaseError(error));
  }
  return data as RoomRow;
}

export async function ensureGameStateRow(roomId: string): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("game_state").upsert(
    [
      {
        room_id: roomId,
        prosecutor_text: "",
        defendant_text: "",
        guilty_votes: 0,
        not_guilty_votes: 0,
        verdict_json: null,
      },
    ],
    { onConflict: "room_id" },
  );
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("rooms")
    .update({ status })
    .eq("id", roomId);
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function updateGameState(
  roomId: string,
  patch: Partial<
    Pick<
      GameStateRow,
      | "prosecutor_text"
      | "defendant_text"
      | "guilty_votes"
      | "not_guilty_votes"
      | "verdict_json"
    >
  >,
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase
    .from("game_state")
    .update(patch)
    .eq("room_id", roomId);
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function upsertRoomPlayer(input: {
  room_id: string;
  user_id: string;
  character_id: CharacterId;
  role: PlayerRole;
}): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("room_players").upsert([input], {
    onConflict: "room_id,user_id",
  });
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
}

export async function fetchRoomPlayers(
  roomId: string,
): Promise<RoomPlayerRow[]> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("room_players")
    .select("*")
    .eq("room_id", roomId);
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
  return (data ?? []) as RoomPlayerRow[];
}

export async function fetchOpenLobbyRoom(): Promise<RoomRow | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("status", "lobby")
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
  return data as RoomRow | null;
}

export async function fetchGameState(
  roomId: string,
): Promise<GameStateRow | null> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("game_state")
    .select("*")
    .eq("room_id", roomId)
    .maybeSingle();
  if (error) {
    throw new Error(formatSupabaseError(error));
  }
  return data as GameStateRow | null;
}

/** @deprecated use ensureGameStateRow */
export async function createGameStateRow(
  input: Omit<GameStateRow, "verdict_json"> & {
    verdict_json?: GameStateRow["verdict_json"];
  },
): Promise<void> {
  await ensureGameStateRow(input.room_id);
}
