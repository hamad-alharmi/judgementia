import type { PostgrestError } from "@supabase/supabase-js";

const SETUP_HINT =
  "Open Supabase → SQL Editor → paste and run supabase/RUN_THIS_FIRST.sql (see SUPABASE_SETUP.md).";

export function formatSupabaseError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Unknown database error.";
  }
  const pg = error as PostgrestError;
  const parts = [pg.message, pg.details, pg.hint].filter(Boolean);
  const combined = parts.join(" — ");

  if (
    combined.includes("schema cache") ||
    combined.includes("Could not find the table") ||
    (combined.includes("relation") && combined.includes("does not exist"))
  ) {
    return `Database tables are not set up yet. ${SETUP_HINT}`;
  }

  if (pg.code === "42501" || combined.toLowerCase().includes("row-level security")) {
    return `${combined} Re-run supabase/RUN_THIS_FIRST.sql to fix permissions.`;
  }

  return combined || "Database request failed.";
}
