"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CourtBackdrop } from "@/components/courtroom/CourtBackdrop";
import { DialogueBox } from "@/components/courtroom/DialogueBox";
import type { CharacterId } from "@/lib/characters";
import { getCharacter } from "@/lib/characters";
import {
  canSubmitStatement,
  getNextStatus,
  type PlayerRole,
} from "@/lib/court/logic";
import { zoneForRoomStatus, statusLabel } from "@/lib/court/zones";
import type { GameStateRow, RoomRow } from "@/lib/database/types";
import { parseScenarioFromRoom } from "@/lib/scenarios";
import {
  fetchRoomPlayers,
  updateGameState,
  updateRoomStatus,
} from "@/lib/supabase/data";
import {
  generateAiDefendantArgument,
  generateAiProsecutorArgument,
  simulateJuryVoteSplit,
} from "@/lib/judge/automation";
import type { JudgeResponseBody } from "@/lib/judge/types";
import type { RoomSettings } from "@/lib/room/settings";

interface CourtroomProps {
  room: RoomRow;
  gameState: GameStateRow;
  userId: string;
  characterId: CharacterId;
  playerRole: PlayerRole;
  settings: RoomSettings;
  onExit: () => void;
}

export function Courtroom({
  room,
  gameState,
  userId,
  characterId,
  playerRole,
  settings,
  onExit,
}: CourtroomProps) {
  const [draft, setDraft] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opponentCharacterId, setOpponentCharacterId] =
    useState<CharacterId>("leonhard");

  const scenario = useMemo(
    () => parseScenarioFromRoom(room.scenario),
    [room.scenario],
  );
  const activeZone = zoneForRoomStatus(room.status);
  const isHost = room.host_id === userId;
  const canSubmit =
    canSubmitStatement(room.status, playerRole) &&
    !(playerRole === "prosecutor" && settings.prosecutorIsAi) &&
    !(playerRole === "defendant" && settings.defendantIsAi);

  useEffect(() => {
    void fetchRoomPlayers(room.id).then((players) => {
      const opponent = players.find((p) => p.user_id !== userId);
      if (opponent?.character_id) {
        setOpponentCharacterId(opponent.character_id as CharacterId);
      }
    });
    if (settings.prosecutorIsAi) {
      setOpponentCharacterId((prev) =>
        playerRole === "defendant" ? settings.prosecutorAiCharacter : prev,
      );
    }
    if (settings.defendantIsAi) {
      setOpponentCharacterId((prev) =>
        playerRole === "prosecutor" ? settings.defendantAiCharacter : prev,
      );
    }
  }, [room.id, userId, playerRole, settings]);

  useEffect(() => {
    const runAiTurn = async () => {
      if (isBusy) {
        return;
      }
      const ctx = { scenario: room.scenario, prosecutorText: gameState.prosecutor_text, defendantText: gameState.defendant_text };
      if (
        room.status === "prosecutor_turn" &&
        settings.prosecutorIsAi &&
        !gameState.prosecutor_text.trim()
      ) {
        setIsBusy(true);
        const text = generateAiProsecutorArgument(ctx);
        await updateGameState(room.id, { prosecutor_text: text });
        await updateRoomStatus(room.id, "defendant_turn");
        setIsBusy(false);
      } else if (
        room.status === "defendant_turn" &&
        settings.defendantIsAi &&
        !gameState.defendant_text.trim()
      ) {
        setIsBusy(true);
        const text = generateAiDefendantArgument(ctx);
        await updateGameState(room.id, { defendant_text: text });
        await updateRoomStatus(room.id, "jury_voting");
        setIsBusy(false);
      }
    };
    void runAiTurn();
  }, [
    room.status,
    room.id,
    room.scenario,
    settings.prosecutorIsAi,
    settings.defendantIsAi,
    gameState.prosecutor_text,
    gameState.defendant_text,
    isBusy,
  ]);

  useEffect(() => {
    if (room.status === "prosecutor_turn") {
      setDraft(gameState.prosecutor_text);
    } else if (room.status === "defendant_turn") {
      setDraft(gameState.defendant_text);
    } else {
      setDraft("");
    }
  }, [room.status, gameState.prosecutor_text, gameState.defendant_text]);

  const activeSpeakerCharacter =
    room.status === "prosecutor_turn"
      ? playerRole === "prosecutor"
        ? characterId
        : opponentCharacterId
      : room.status === "defendant_turn"
        ? playerRole === "defendant"
          ? characterId
          : opponentCharacterId
        : characterId;

  const submitStatement = async () => {
    if (!canSubmit || !draft.trim()) {
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      const field =
        room.status === "prosecutor_turn"
          ? "prosecutor_text"
          : "defendant_text";
      await updateGameState(room.id, { [field]: draft.trim() });
      const next = getNextStatus(room.status);
      if (next) {
        await updateRoomStatus(room.id, next);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Submit failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const runJuryAndVerdict = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const jury = simulateJuryVoteSplit(
        gameState.prosecutor_text,
        gameState.defendant_text,
      );
      await updateGameState(room.id, {
        guilty_votes: jury.guiltyVotes,
        not_guilty_votes: jury.notGuiltyVotes,
      });
      await updateRoomStatus(room.id, "verdict");

      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario: room.scenario,
          prosecutorText: gameState.prosecutor_text,
          defendantText: gameState.defendant_text,
          prosecutorRole: settings.prosecutorIsAi ? "ai" : "human",
          defendantRole: settings.defendantIsAi ? "ai" : "human",
        }),
      });

      if (!response.ok) {
        throw new Error("Chief Justice unavailable.");
      }

      const body = (await response.json()) as JudgeResponseBody;
      await updateGameState(room.id, { verdict_json: body.verdict });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verdict failed.");
    } finally {
      setIsBusy(false);
    }
  };

  const advanceFromJury = async () => {
    setIsBusy(true);
    try {
      await updateRoomStatus(room.id, "verdict");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500/80">
              Chamber {room.code} · {statusLabel(room.status)}
            </p>
            {scenario && (
              <h1 className="mt-1 font-legal text-2xl text-zinc-50">
                {scenario.title}
              </h1>
            )}
          </div>
          <button
            type="button"
            onClick={onExit}
            className="border border-zinc-700 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:border-zinc-500"
          >
            Leave Chamber
          </button>
        </header>

        <CourtBackdrop zoneId={activeZone} />

        <div className="mt-4 space-y-3">
          <AnimatePresence mode="wait">
            {room.status === "prosecutor_turn" && (
              <DialogueBox
                key="pros"
                characterId={
                  settings.prosecutorIsAi
                    ? settings.prosecutorAiCharacter
                    : playerRole === "prosecutor"
                      ? characterId
                      : opponentCharacterId
                }
                speakerLabel="Prosecution"
                text={gameState.prosecutor_text}
                isPlayer={playerRole === "prosecutor"}
                isTyping={playerRole === "prosecutor" && canSubmit}
              />
            )}
            {room.status === "defendant_turn" && (
              <DialogueBox
                key="def"
                characterId={
                  settings.defendantIsAi
                    ? settings.defendantAiCharacter
                    : playerRole === "defendant"
                      ? characterId
                      : opponentCharacterId
                }
                speakerLabel="Defense"
                text={gameState.defendant_text}
                isPlayer={playerRole === "defendant"}
                isTyping={playerRole === "defendant" && canSubmit}
              />
            )}
            {room.status === "jury_voting" && (
              <DialogueBox
                key="jury"
                characterId={activeSpeakerCharacter}
                speakerLabel="Jury Foreman"
                text={`Deliberation in progress… ${gameState.guilty_votes} guilty · ${gameState.not_guilty_votes} not guilty`}
              />
            )}
            {room.status === "verdict" && gameState.verdict_json && (
              <DialogueBox
                key="verdict"
                characterId="darius"
                speakerLabel="Chief Justice Vanguard"
                text={`${gameState.verdict_json.finalVerdict} — ${gameState.verdict_json.reasoning}`}
              />
            )}
          </AnimatePresence>

          {canSubmit && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="border border-amber-900/40 bg-black/60 p-4"
            >
              <label className="block">
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-500/80">
                  Your Statement — {getCharacter(characterId).name}
                </span>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  placeholder="Enter your legal argument…"
                  className="mt-2 w-full resize-none border border-zinc-700 bg-zinc-950 px-3 py-2 font-legal text-sm text-zinc-100 outline-none focus:border-amber-600"
                />
              </label>
              <motion.button
                type="button"
                disabled={isBusy || !draft.trim()}
                onClick={() => void submitStatement()}
                className="mt-3 w-full border border-amber-700 bg-amber-950/50 py-3 font-mono text-xs uppercase tracking-widest text-amber-100 disabled:opacity-50"
                whileTap={{ scale: 0.98 }}
              >
                {isBusy ? "Recording…" : "Submit Statement"}
              </motion.button>
            </motion.div>
          )}

          {room.status === "jury_voting" && isHost && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void advanceFromJury()}
                className="flex-1 border border-zinc-700 py-2 font-mono text-[10px] uppercase text-zinc-400"
              >
                Enter Verdict Chamber
              </button>
              <button
                type="button"
                onClick={() => void runJuryAndVerdict()}
                disabled={isBusy}
                className="flex-1 border border-amber-700 py-2 font-mono text-[10px] uppercase text-amber-100"
              >
                Summon AI Judge
              </button>
            </div>
          )}

          {error && (
            <p className="border border-red-900/50 bg-red-950/30 px-3 py-2 font-mono text-xs text-red-300">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
