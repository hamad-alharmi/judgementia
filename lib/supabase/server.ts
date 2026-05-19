import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getPublicSupabaseAnonKey,
  getPublicSupabaseUrl,
} from "@/lib/env/public";

export function createSupabaseServerClient(): SupabaseClient {
  return createClient(getPublicSupabaseUrl(), getPublicSupabaseAnonKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
