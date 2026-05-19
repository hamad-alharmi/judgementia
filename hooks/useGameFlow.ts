"use client";

import { useCallback, useEffect, useState } from "react";

export type GameFlowPhase =
  | "loading"
  | "auth"
  | "gavel_transition"
  | "main_menu";

const LOADING_DURATION_MS = 2200;
const GAVEL_DURATION_MS = 900;

export interface GameFlowState {
  phase: GameFlowPhase;
  isShaking: boolean;
}

export interface GameFlowActions {
  completeAuth: () => void;
  skipToMainMenu: () => void;
}

export function useGameFlow(): GameFlowState & GameFlowActions {
  const [phase, setPhase] = useState<GameFlowPhase>("loading");
  const [isShaking, setIsShaking] = useState(false);

  useEffect(() => {
    if (phase !== "loading") {
      return;
    }
    const timer = window.setTimeout(() => {
      setPhase("auth");
    }, LOADING_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== "gavel_transition") {
      return;
    }
    setIsShaking(true);
    const shakeTimer = window.setTimeout(() => {
      setIsShaking(false);
    }, 450);
    const menuTimer = window.setTimeout(() => {
      setPhase("main_menu");
    }, GAVEL_DURATION_MS);
    return () => {
      window.clearTimeout(shakeTimer);
      window.clearTimeout(menuTimer);
    };
  }, [phase]);

  const completeAuth = useCallback(() => {
    setPhase("gavel_transition");
  }, []);

  const skipToMainMenu = useCallback(() => {
    setPhase("main_menu");
    setIsShaking(false);
  }, []);

  return {
    phase,
    isShaking,
    completeAuth,
    skipToMainMenu,
  };
}
