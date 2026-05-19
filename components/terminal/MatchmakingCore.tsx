"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { CharacterId } from "@/lib/characters";
import { generateRoomCode } from "@/lib/rooms";
import { formatScenarioForRoom, pickRandomScenario } from "@/lib/scenarios";
import { DEFAULT_ROOM_SETTINGS } from "@/lib/room/settings";
import {
  createRoomRow,
  ensureGameStateRow,
  fetchOpenLobbyRoom,
  fetchRoomByCode,
} from "@/lib/supabase/data";
import { CreateRoomPanel } from "@/components/lobby/CreateRoomPanel";

interface MatchmakingCoreProps {
  userId: string;
  defaultCharacterId: CharacterId;
  displayName: string;
  onRoomJoined: (roomId: string) => void;
}

export function MatchmakingCore({
  userId,
  defaultCharacterId,
  displayName,
  onRoomJoined,
}: MatchmakingCoreProps) {
  const [mode, setMode] = useState<"menu" | "create">("menu");
  const [joinCode, setJoinCode] = useState("");
  const [queueStatus, setQueueStatus] = useState<
    "idle" | "searching" | "matched"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const joinRoom = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const normalized = joinCode.trim().toUpperCase();
      const room = await fetchRoomByCode(normalized);
      if (!room) {
        setError("Chamber not found. Check the 4-letter code.");
        return;
      }
      if (room.status !== "lobby") {
        setError("This trial has already started.");
        return;
      }
      onRoomJoined(room.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to join chamber.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const enterQueue = async () => {
    setQueueStatus("searching");
    setError(null);
    try {
      const openRoom = await fetchOpenLobbyRoom();
      if (openRoom) {
        setQueueStatus("matched");
        onRoomJoined(openRoom.id);
        return;
      }

      const room = await createRoomRow({
        code: generateRoomCode(),
        status: "lobby",
        scenario: formatScenarioForRoom(pickRandomScenario()),
        host_id: userId,
        settings: { ...DEFAULT_ROOM_SETTINGS, isPublic: true },
      });
      await ensureGameStateRow(room.id);
      setQueueStatus("matched");
      onRoomJoined(room.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Queue failed.");
      setQueueStatus("idle");
    }
  };

  return (
    <section className="border border-zinc-800 bg-zinc-950/60 p-5">
      <AnimatePresence mode="wait">
        {mode === "create" ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <CreateRoomPanel
              userId={userId}
              defaultCharacterId={defaultCharacterId}
              displayName={displayName}
              onCreated={onRoomJoined}
              onCancel={() => setMode("menu")}
            />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <h2 className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500/90">
              Matchmaking Core
            </h2>
            <p className="mt-2 font-legal text-sm text-zinc-500">
              Customize a chamber, invite counsel with a code, or enter the public
              docket queue.
            </p>

            <motion.div className="mt-5 space-y-4" layout>
              <motion.button
                type="button"
                onClick={() => setMode("create")}
                className="w-full border border-amber-700/70 bg-gradient-to-r from-amber-950/50 to-zinc-950 py-4 font-mono text-xs uppercase tracking-[0.25em] text-amber-100"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                Fabricate Custom Chamber
              </motion.button>

              <div className="border border-zinc-800 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  Join by Code
                </p>
                <input
                  type="text"
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="mt-3 w-full border border-zinc-700 bg-black px-3 py-3 text-center font-mono text-xl tracking-[0.45em] text-zinc-100 outline-none focus:border-amber-600"
                />
                <button
                  type="button"
                  onClick={() => void joinRoom()}
                  disabled={isBusy || joinCode.length <= 3}
                  className="mt-3 w-full border border-zinc-600 py-2.5 font-mono text-xs uppercase tracking-widest text-zinc-200 hover:border-amber-700 disabled:opacity-50"
                >
                  Enter Waiting Lobby
                </button>
              </div>

              <div className="border border-zinc-800 p-4">
                <button
                  type="button"
                  onClick={() => void enterQueue()}
                  disabled={queueStatus === "searching"}
                  className="w-full border border-zinc-600 py-2.5 font-mono text-xs uppercase tracking-widest text-zinc-200 hover:border-amber-700 disabled:opacity-50"
                >
                  {queueStatus === "searching"
                    ? "Scanning Public Docket…"
                    : "Enter Public Queue"}
                </button>
              </div>
            </motion.div>

            {error && (
              <p className="mt-4 border border-red-900/50 bg-red-950/20 px-3 py-2 font-mono text-xs leading-relaxed text-red-300">
                {error}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
