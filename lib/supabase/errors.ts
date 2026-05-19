import type { PostgrestError } from "@supabase/supabase-js";

export function formatSupabaseError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unknown database error.";
  }
  const pg = error as PostgrestError;
  const parts = [pg.message, pg.details, pg.hint].filter(Boolean);
  const combined = parts.join(" — ");
  if (combined.toLowerCase().includes("relation") && combined.includes("does not exist")) {
    return `${combined} Run supabase/SETUP_COMPLETE.sql in your Supabase SQL Editor.`;
  }
  if (pg.code === "42501" || combined.toLowerCase().includes("row-level security")) {
    return `${combined} Re-run supabase/SETUP_COMPLETE.sql to fix RLS policies.`;
  }
  return combined || "Database request failed.";
}
