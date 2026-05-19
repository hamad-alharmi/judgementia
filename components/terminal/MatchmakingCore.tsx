"use client";

import { useState } from "react";
import { generateRoomCode } from "@/lib/rooms";
import { formatScenarioForRoom, pickRandomScenario } from "@/lib/scenarios";
import {
  createGameStateRow,
  createRoomRow,
  fetchOpenLobbyRoom,
  fetchRoomByCode,
} from "@/lib/supabase/data";

interface MatchmakingCoreProps {
  userId: string;
  onRoomJoined: (roomId: string) => void;
}

export function MatchmakingCore({
  userId,
  onRoomJoined,
}: MatchmakingCoreProps) {
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [queueStatus, setQueueStatus] = useState<
    "idle" | "searching" | "matched"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const bootstrapGameState = async (roomId: string) => {
    await createGameStateRow({
      room_id: roomId,
      prosecutor_text: "",
      defendant_text: "",
      guilty_votes: 0,
      not_guilty_votes: 0,
      verdict_json: null,
    });
  };

  const createRoom = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const code = generateRoomCode();
      const scenario = pickRandomScenario();
      const room = await createRoomRow({
        code,
        status: "lobby",
        scenario: formatScenarioForRoom(scenario),
      });
      await bootstrapGameState(room.id);
      setCreatedCode(code);
      onRoomJoined(room.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to create room.",
      );
    } finally {
      setIsBusy(false);
    }
  };

  const joinRoom = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const normalized = joinCode.trim().toUpperCase();
      const room = await fetchRoomByCode(normalized);
      if (!room) {
        setError("Room not found.");
        return;
      }
      onRoomJoined(room.id);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Failed to join room.",
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

      const code = generateRoomCode();
      const scenario = pickRandomScenario();
      const room = await createRoomRow({
        code,
        status: "lobby",
        scenario: formatScenarioForRoom(scenario),
      });
      await bootstrapGameState(room.id);
      setQueueStatus("matched");
      onRoomJoined(room.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Queue failed.");
      setQueueStatus("idle");
    }
  };

  return (
    <section className="border border-zinc-800 bg-zinc-950/60 p-5">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500/90">
        Matchmaking Core
      </h2>
      <p className="mt-1 font-mono text-[10px] text-zinc-600">
        Operator ID: {userId.slice(0, 8)}…
      </p>

      <div className="mt-4 space-y-4">
        <div className="border border-zinc-800 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Create Custom Room
          </p>
          <button
            type="button"
            onClick={() => void createRoom()}
            disabled={isBusy}
            className="mt-3 w-full border border-amber-800/60 bg-amber-950/30 py-2 font-mono text-xs uppercase tracking-widest text-amber-100 hover:bg-amber-950/50 disabled:opacity-50"
          >
            Generate 4-Letter Code
          </button>
          {createdCode && (
            <p className="mt-3 text-center font-mono text-2xl tracking-[0.5em] text-amber-300">
              {createdCode}
            </p>
          )}
        </div>

        <div className="border border-zinc-800 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Join Custom Room
          </p>
          <input
            type="text"
            maxLength={4}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            className="mt-3 w-full border border-zinc-700 bg-black px-3 py-2 text-center font-mono text-lg tracking-[0.4em] text-zinc-100 outline-none focus:border-amber-700"
          />
          <button
            type="button"
            onClick={() => void joinRoom()}
            disabled={isBusy || joinCode.length < 4}
            className="mt-3 w-full border border-zinc-700 py-2 font-mono text-xs uppercase tracking-widest text-zinc-300 hover:border-amber-700 disabled:opacity-50"
          >
            Enter Chamber
          </button>
        </div>

        <div className="border border-zinc-800 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Online Multiplayer Pool
          </p>
          <button
            type="button"
            onClick={() => void enterQueue()}
            disabled={queueStatus === "searching"}
            className="mt-3 w-full border border-zinc-600 py-2 font-mono text-xs uppercase tracking-widest text-zinc-200 hover:border-amber-700 disabled:opacity-50"
          >
            {queueStatus === "searching"
              ? "Scanning Docket…"
              : queueStatus === "matched"
                ? "Matched — Proceed"
                : "Enter Public Queue"}
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-4 border border-red-900/50 bg-red-950/20 px-3 py-2 font-mono text-xs text-red-300">
          {error}
        </p>
      )}
    </section>
  );
}
