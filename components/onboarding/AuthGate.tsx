"use client";

import { FormEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertProfileRow } from "@/lib/supabase/data";
import { DEFAULT_AVATAR_CONFIG } from "@/lib/database/types";
import { getAuthErrorMessage, isEmailNotConfirmedError } from "@/lib/auth/errors";
import { getSiteUrl } from "@/lib/auth/site";
import { ScalesOfJustice } from "@/components/icons/ScalesOfJustice";

interface AuthGateProps {
  onAuthenticated: () => void;
}

type AuthMode = "login" | "signup";
type AuthView = "form" | "pending_email";

const ease = [0.22, 1, 0.36, 1] as const;

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [view, setView] = useState<AuthView>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const redirectTo = `${getSiteUrl()}/auth/callback`;

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError(null);
    setNotice(null);
    if (view === "pending_email") {
      setView("form");
    }
  };

  const ensureProfile = async (userId: string) => {
    await upsertProfileRow({
      id: userId,
      username: username || email.split("@")[0] || "Counsel",
      avatar_config: DEFAULT_AVATAR_CONFIG,
    });
  };

  const resendConfirmation = async () => {
    setIsResending(true);
    setError(null);
    setNotice(null);
    const supabase = createSupabaseBrowserClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setIsResending(false);
    if (resendError) {
      setError(getAuthErrorMessage(resendError));
      return;
    }
    setNotice("Confirmation link sent. Check your inbox and spam folder.");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
            emailRedirectTo: redirectTo,
          },
        });
        if (signUpError) {
          throw signUpError;
        }

        if (data.session?.user) {
          await ensureProfile(data.session.user.id);
          onAuthenticated();
          return;
        }

        if (data.user) {
          try {
            await ensureProfile(data.user.id);
          } catch {
            // Profile may be created after confirmation via trigger.
          }
          setView("pending_email");
          setNotice(
            "Account created. Confirm your email to enter the court — or run auto_confirm_email.sql in Supabase for instant access.",
          );
          return;
        }

        throw new Error("Sign up failed. Please try again.");
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        throw signInError;
      }
      if (!data.session) {
        throw new Error("No active session. Confirm your email first.");
      }
      onAuthenticated();
    } catch (caught) {
      if (isEmailNotConfirmedError(caught)) {
        setView("pending_email");
      }
      setError(getAuthErrorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease }}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(180,83,9,0.12),_transparent_55%)]"
        animate={{ opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -left-32 top-1/4 h-64 w-64 rounded-full bg-amber-600/5 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 bottom-1/4 h-72 w-72 rounded-full bg-zinc-600/10 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 25, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative w-full max-w-md"
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease, delay: 0.1 }}
      >
        <div className="absolute -inset-px rounded-sm bg-gradient-to-b from-amber-600/40 via-zinc-700/20 to-transparent opacity-80" />
        <motion.div
          className="relative border border-zinc-800/90 bg-zinc-950/90 p-8 shadow-[0_0_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md"
          layout
        >
          <header className="mb-8 border-b border-zinc-800/80 pb-5 text-center">
            <motion.div
              className="mx-auto mb-4 inline-flex text-amber-400/90"
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <ScalesOfJustice className="h-10 w-10" />
            </motion.div>
            <p className="font-mono text-[10px] uppercase tracking-[0.45em] text-amber-500/90">
              Secure Access Terminal
            </p>
            <h1 className="mt-2 font-legal text-2xl text-zinc-50">
              Judgementia Bar Admission
            </h1>
          </header>

          <AnimatePresence mode="wait">
            {view === "form" ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: mode === "login" ? -12 : 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: mode === "login" ? 12 : -12 }}
                transition={{ duration: 0.28, ease }}
              >
                <motion.div
                  className="relative mb-6 grid grid-cols-2 gap-1 rounded-sm border border-zinc-800 bg-zinc-900/80 p-1"
                  layout
                >
                  <motion.div
                    className="absolute inset-y-1 w-[calc(50%-4px)] rounded-sm bg-amber-950/80 ring-1 ring-amber-700/50"
                    initial={false}
                    animate={{ left: mode === "login" ? 4 : "calc(50% + 2px)" }}
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                  <button
                    type="button"
                    onClick={() => switchMode("login")}
                    className={`relative z-10 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${
                      mode === "login" ? "text-amber-100" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => switchMode("signup")}
                    className={`relative z-10 py-2.5 font-mono text-[10px] uppercase tracking-[0.25em] transition-colors ${
                      mode === "signup" ? "text-amber-100" : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Sign Up
                  </button>
                </motion.div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {mode === "signup" && (
                      <motion.label
                        key="username"
                        className="block overflow-hidden"
                        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                        animate={{ opacity: 1, height: "auto", marginBottom: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25, ease }}
                      >
                        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                          Counsel Username
                        </span>
                        <input
                          type="text"
                          required
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="mt-1.5 w-full border border-zinc-700/80 bg-black/60 px-3 py-2.5 text-zinc-100 outline-none transition focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30"
                        />
                      </motion.label>
                    )}
                  </AnimatePresence>

                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                      Email
                    </span>
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1.5 w-full border border-zinc-700/80 bg-black/60 px-3 py-2.5 text-zinc-100 outline-none transition focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                      Password
                    </span>
                    <input
                      type="password"
                      required
                      minLength={6}
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="mt-1.5 w-full border border-zinc-700/80 bg-black/60 px-3 py-2.5 text-zinc-100 outline-none transition focus:border-amber-600 focus:ring-1 focus:ring-amber-600/30"
                    />
                  </label>

                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.p
                        key="error"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="border border-red-900/60 bg-red-950/40 px-3 py-2.5 font-mono text-xs leading-relaxed text-red-200"
                      >
                        {error}
                      </motion.p>
                    )}
                    {notice && !error && (
                      <motion.p
                        key="notice"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="border border-amber-900/50 bg-amber-950/30 px-3 py-2.5 font-mono text-xs leading-relaxed text-amber-100/90"
                      >
                        {notice}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="relative w-full overflow-hidden border border-amber-700/80 bg-gradient-to-b from-amber-900/50 to-amber-950/80 py-3.5 font-mono text-xs uppercase tracking-[0.35em] text-amber-50 disabled:opacity-50"
                    whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
                    whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                  >
                    <motion.span
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="relative">
                      {isSubmitting
                        ? "Verifying credentials…"
                        : mode === "login"
                          ? "Enter Court"
                          : "File Admission"}
                    </span>
                  </motion.button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="pending"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, ease }}
                className="text-center"
              >
                <motion.div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center border border-amber-800/50 bg-amber-950/30"
                  animate={{ boxShadow: ["0 0 0 0 rgba(245,158,11,0)", "0 0 24px 0 rgba(245,158,11,0.15)", "0 0 0 0 rgba(245,158,11,0)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="font-mono text-2xl text-amber-400">@</span>
                </motion.div>
                <h2 className="font-legal text-xl text-zinc-100">
                  Confirm Your Email
                </h2>
                <p className="mt-3 font-mono text-xs leading-relaxed text-zinc-500">
                  We sent a secure link to{" "}
                  <span className="text-amber-200/90">{email}</span>. Open it on
                  this device to activate your bar credentials.
                </p>

                {notice && (
                  <p className="mt-4 border border-amber-900/40 bg-amber-950/20 px-3 py-2 font-mono text-[10px] text-amber-200/80">
                    {notice}
                  </p>
                )}
                {error && (
                  <p className="mt-4 border border-red-900/50 bg-red-950/30 px-3 py-2 font-mono text-[10px] text-red-300">
                    {error}
                  </p>
                )}

                <div className="mt-6 space-y-2">
                  <motion.button
                    type="button"
                    onClick={() => void resendConfirmation()}
                    disabled={isResending}
                    className="w-full border border-zinc-700 py-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-300 hover:border-amber-700 disabled:opacity-50"
                    whileTap={{ scale: 0.98 }}
                  >
                    {isResending ? "Sending…" : "Resend Confirmation"}
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => {
                      setView("form");
                      setMode("login");
                      setError(null);
                    }}
                    className="w-full py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400"
                  >
                    Back to Login
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
