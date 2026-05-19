"use client";

import { useEffect } from "react";
import { useGameFlow } from "@/hooks/useGameFlow";
import { useAuthSession } from "@/hooks/useAuthSession";
import { LoadingPhase } from "@/components/onboarding/LoadingPhase";
import { AuthGate } from "@/components/onboarding/AuthGate";
import { GavelTransition } from "@/components/onboarding/GavelTransition";
import { MainTerminal } from "@/components/terminal/MainTerminal";

export function JudgementiaApp() {
  const { phase, isShaking, completeAuth, skipToMainMenu } = useGameFlow();
  const { user, isLoading: authLoading } = useAuthSession();

  useEffect(() => {
    if (!authLoading && user && phase === "auth") {
      skipToMainMenu();
    }
  }, [authLoading, user, phase, skipToMainMenu]);

  const shellClass = isShaking ? "animate-screen-shake min-h-screen" : "min-h-screen";

  if (phase === "loading" || authLoading) {
    return <LoadingPhase />;
  }

  if (phase === "gavel_transition") {
    return (
      <div className={shellClass}>
        <GavelTransition />
      </div>
    );
  }

  if (phase === "main_menu" && user) {
    return (
      <div className={shellClass}>
        <MainTerminal userId={user.id} />
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <AuthGate onAuthenticated={completeAuth} />
    </div>
  );
}
