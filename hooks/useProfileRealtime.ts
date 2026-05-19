"use client";

import { useEffect, useState } from "react";
import type { ProfileRow } from "@/lib/database/types";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export interface UseProfileRealtimeResult {
  profile: ProfileRow | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProfileRealtime(
  userId: string | null,
): UseProfileRealtimeResult {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!userId) {
      return;
    }
    const supabase = createSupabaseBrowserClient();
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) {
      setError(fetchError.message);
      setProfile(null);
    } else {
      setProfile(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    let active = true;

    const bootstrap = async () => {
      await refresh();
    };

    void bootstrap();

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (!active) {
            return;
          }
          if (payload.eventType === "DELETE") {
            setProfile(null);
            return;
          }
          const next = payload.new as ProfileRow;
          setProfile(next);
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh stable for userId scope
  }, [userId]);

  return { profile, isLoading, error, refresh };
}
