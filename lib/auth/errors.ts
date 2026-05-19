import type { AuthError } from "@supabase/supabase-js";

export function getAuthErrorMessage(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Authentication failed.";
  }

  const authError = error as AuthError;
  const code = authError.code ?? "";
  const message = authError.message ?? "Authentication failed.";

  if (code === "email_not_confirmed" || message.toLowerCase().includes("not confirmed")) {
    return "Your email is not confirmed yet. Use the resend button below or check your inbox.";
  }

  if (code === "user_already_registered") {
    return "An account with this email already exists. Try logging in.";
  }

  if (code === "invalid_credentials") {
    return "Invalid email or password.";
  }

  return message;
}

export function isEmailNotConfirmedError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const authError = error as AuthError;
  return (
    authError.code === "email_not_confirmed" ||
    (authError.message ?? "").toLowerCase().includes("not confirmed")
  );
}
