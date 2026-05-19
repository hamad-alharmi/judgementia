"use client";

import { useCallback, useEffect, useState } from "react";
import type { RoomPlayerRow } from "@/lib/database/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchRoomPlayers } from "@/lib/supabase/data";

export interface UseRoomPlayersRealtimeResult {
  players: RoomPlayerRow[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useRoomPlayersRealtime(
  roomId: string | null,
): UseRoomPlayersRealtimeResult {
  const [players, setPlayers] = useState<RoomPlayerRow[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(roomId));
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!roomId) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const rows = await fetchRoomPlayers(roomId);
      setPlayers(rows);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to load players.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      setPlayers([]);
      setIsLoading(false);
      return;
    }

    void refresh();

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`room_players:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "room_players",
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          void refresh();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [roomId, refresh]);

  return { players, isLoading, error, refresh };
}
