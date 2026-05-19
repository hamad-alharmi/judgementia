"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertProfileRow } from "@/lib/supabase/data";
import { DEFAULT_AVATAR_CONFIG } from "@/lib/database/types";

interface AuthGateProps {
  onAuthenticated: () => void;
}

export function AuthGate({ onAuthenticated }: AuthGateProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createSupabaseBrowserClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { username },
          },
        });
        if (signUpError) {
          throw signUpError;
        }
        if (data.user) {
          await upsertProfileRow({
            id: data.user.id,
            username: username || email.split("@")[0] || "Counsel",
            avatar_config: DEFAULT_AVATAR_CONFIG,
          });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) {
          throw signInError;
        }
      }
      onAuthenticated();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Authentication failed.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-900/80 p-8 shadow-2xl">
        <header className="mb-8 border-b border-zinc-800 pb-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500/80">
            Secure Access Terminal
          </p>
          <h1 className="mt-2 font-legal text-2xl text-zinc-100">
            Judgementia Bar Admission
          </h1>
        </header>

        <div className="mb-6 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 border py-2 font-mono text-xs uppercase tracking-widest ${
              mode === "login"
                ? "border-amber-600 bg-amber-950/40 text-amber-200"
                : "border-zinc-700 text-zinc-500"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 border py-2 font-mono text-xs uppercase tracking-widest ${
              mode === "signup"
                ? "border-amber-600 bg-amber-950/40 text-amber-200"
                : "border-zinc-700 text-zinc-500"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Counsel Username
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-amber-600"
              />
            </label>
          )}
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              Email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-amber-600"
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-amber-600"
            />
          </label>

          {error && (
            <p className="border border-red-900/60 bg-red-950/30 px-3 py-2 font-mono text-xs text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full border border-amber-700 bg-amber-950/50 py-3 font-mono text-xs uppercase tracking-[0.3em] text-amber-100 transition hover:bg-amber-900/60 disabled:opacity-50"
          >
            {isSubmitting ? "Verifying…" : "Enter Court"}
          </button>
        </form>
      </div>
    </div>
  );
}
