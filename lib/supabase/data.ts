import type {
  AvatarConfig,
  GameStateRow,
  ProfileRow,
  RoomRow,
} from "@/lib/database/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export async function upsertProfileRow(input: {
  id: string;
  username: string;
  avatar_config: AvatarConfig;
}): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("profiles").upsert([input]);
  if (error) {
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
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
    throw error;
  }
  return data as RoomRow | null;
}

export async function createRoomRow(input: {
  code: string;
  status: RoomRow["status"];
  scenario: string;
}): Promise<RoomRow> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("rooms")
    .insert([input])
    .select("*")
    .single();
  if (error || !data) {
    throw error ?? new Error("Room creation failed.");
  }
  return data as RoomRow;
}

export async function createGameStateRow(
  input: Omit<GameStateRow, "verdict_json"> & {
    verdict_json?: GameStateRow["verdict_json"];
  },
): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.from("game_state").insert([input]);
  if (error) {
    throw error;
  }
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
    throw error;
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
    throw error;
  }
  return data as GameStateRow | null;
}
