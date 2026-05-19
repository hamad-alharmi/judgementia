"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameFlow } from "@/hooks/useGameFlow";
import { useAuthSession } from "@/hooks/useAuthSession";
import { LoadingPhase } from "@/components/onboarding/LoadingPhase";
import { AuthGate } from "@/components/onboarding/AuthGate";
import { GavelTransition } from "@/components/onboarding/GavelTransition";
import { MainTerminal } from "@/components/terminal/MainTerminal";

export function JudgementiaApp() {
  const { phase, isShaking, completeAuth, skipToMainMenu } = useGameFlow();
  const { user, isLoading: authLoading } = useAuthSession();
  const [confirmedBanner, setConfirmedBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirmed") === "1") {
      setConfirmedBanner(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && phase === "auth") {
      skipToMainMenu();
    }
  }, [authLoading, user, phase, skipToMainMenu]);

  const shellClass = isShaking
    ? "animate-screen-shake min-h-screen"
    : "min-h-screen";

  const showLoading = phase === "loading" || authLoading;

  return (
    <motion.div className={shellClass} layout>
      <AnimatePresence mode="wait">
        {showLoading && (
          <motion.div
            key="loading"
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.35 }}
          >
            <LoadingPhase />
          </motion.div>
        )}

        {!showLoading && phase === "gavel_transition" && (
          <motion.div key="gavel" exit={{ opacity: 0 }}>
            <GavelTransition />
          </motion.div>
        )}

        {!showLoading && phase === "main_menu" && user && (
          <motion.div
            key="terminal"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            {confirmedBanner && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed left-0 right-0 top-4 z-50 mx-auto max-w-lg border border-amber-800/60 bg-amber-950/90 px-4 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-amber-100"
              >
                Email confirmed — welcome to the chamber
              </motion.div>
            )}
            <MainTerminal userId={user.id} />
          </motion.div>
        )}

        {!showLoading && phase !== "gavel_transition" && !(phase === "main_menu" && user) && (
          <motion.div
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            <AuthGate onAuthenticated={completeAuth} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
