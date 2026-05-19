"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/lib/env/public";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(
      getPublicSupabaseUrl(),
      getPublicSupabaseAnonKey(),
    );
  }
  return browserClient;
}
