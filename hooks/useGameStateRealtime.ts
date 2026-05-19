"use client";

import { useEffect, useState } from "react";
import type { GameStateRow } from "@/lib/database/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UseGameStateRealtimeResult {
  gameState: GameStateRow | null;
  isLoading: boolean;
  error: string | null;
}

export function useGameStateRealtime(
  roomId: string | null,
): UseGameStateRealtimeResult {
  const [gameState, setGameState] = useState<GameStateRow | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(roomId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setGameState(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let active = true;

    const fetchState = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("game_state")
        .select("*")
        .eq("room_id", roomId)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message);
        setGameState(null);
      } else {
        setGameState(data);
      }
      setIsLoading(false);
    };

    void fetchState();

    const channel = supabase
      .channel(`game_state:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "game_state",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setGameState(null);
            return;
          }
          const next = payload.new as GameStateRow;
          setGameState(next);
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { gameState, isLoading, error };
}
