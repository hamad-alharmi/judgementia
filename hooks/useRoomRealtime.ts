"use client";

import { useEffect, useState } from "react";
import type { RoomRow } from "@/lib/database/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UseRoomRealtimeResult {
  room: RoomRow | null;
  isLoading: boolean;
  error: string | null;
}

export function useRoomRealtime(roomId: string | null): UseRoomRealtimeResult {
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(roomId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setRoom(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let active = true;

    const fetchRoom = async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (fetchError) {
        setError(fetchError.message);
        setRoom(null);
      } else {
        setRoom(data);
      }
      setIsLoading(false);
    };

    void fetchRoom();

    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            setRoom(null);
            return;
          }
          const next = payload.new as RoomRow;
          setRoom(next);
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [roomId]);

  return { room, isLoading, error };
}
