"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CourtBackdrop } from "@/components/courtroom/CourtBackdrop";
import {
  COUNSEL_CHARACTERS,
  getCharacter,
  rosterBackgroundPosition,
  type CharacterId,
} from "@/lib/characters";
import { canStartTrial, isRoleAvailable, playerForRole } from "@/lib/court/lobby";
import type { PlayerRole, RoomPlayerRow, RoomRow } from "@/lib/database/types";
import { useRoomPlayersRealtime } from "@/hooks/useRoomPlayersRealtime";
import { parseScenarioFromRoom } from "@/lib/scenarios";
import {
  DEFAULT_ROOM_SETTINGS,
  parseRoomSettings,
  type RoomSettings,
} from "@/lib/room/settings";
import {
  updateRoomSettings,
  updateRoomStatus,
  upsertRoomPlayer,
} from "@/lib/supabase/data";

type RoomSettingsPatch = Partial<RoomSettings>;

interface WaitingLobbyProps {
  room: RoomRow;
  userId: string;
  displayName: string;
  defaultCharacterId: CharacterId;
  onExit: () => void;
  onTrialStart: () => void;
}

export function WaitingLobby({
  room,
  userId,
  displayName,
  defaultCharacterId,
  onExit,
  onTrialStart,
}: WaitingLobbyProps) {
  const isHost = room.host_id === userId;
  const { players, refresh } = useRoomPlayersRealtime(room.id);
  const [settings, setSettings] = useState<RoomSettings>(() =>
    parseRoomSettings(room.settings),
  );
  const [selectedRole, setSelectedRole] = useState<PlayerRole | null>(null);
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterId>(defaultCharacterId);
  const [isReady, setIsReady] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = players.find((p) => p.user_id === userId);
  const scenario = useMemo(
    () => parseScenarioFromRoom(room.scenario),
    [room.scenario],
  );

  useEffect(() => {
    setSettings(parseRoomSettings(room.settings));
  }, [room.settings]);

  useEffect(() => {
    if (me) {
      setSelectedRole(me.role);
      setSelectedCharacter(me.character_id);
      setIsReady(me.is_ready);
    }
  }, [me]);

  const claimRole = async (role: PlayerRole) => {
    if (!isRoleAvailable(settings, players, role)) {
      setError("That role is controlled by AI or already taken.");
      return;
    }
    setError(null);
    setSelectedRole(role);
    await upsertRoomPlayer({
      room_id: room.id,
      user_id: userId,
      character_id: selectedCharacter,
      role,
      is_ready: false,
      display_name: displayName,
    });
    await refresh();
  };

  const confirmLoadout = async () => {
    if (!selectedRole) {
      setError("Select prosecution or defense first.");
      return;
    }
    setIsBusy(true);
    setError(null);
    try {
      await upsertRoomPlayer({
        room_id: room.id,
        user_id: userId,
        character_id: selectedCharacter,
        role: selectedRole,
        is_ready: isReady,
        display_name: displayName,
      });
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save loadout.");
    } finally {
      setIsBusy(false);
    }
  };

  const toggleReady = async () => {
    if (!selectedRole && !me) {
      setError("Claim a role before readying up.");
      return;
    }
    const nextReady = !isReady;
    setIsReady(nextReady);
    const role = selectedRole ?? me?.role;
    if (!role) {
      return;
    }
    await upsertRoomPlayer({
      room_id: room.id,
      user_id: userId,
      character_id: selectedCharacter,
      role,
      is_ready: nextReady,
      display_name: displayName,
    });
    await refresh();
  };

  const patchSettings = async (patch: RoomSettingsPatch) => {
    if (!isHost) {
      return;
    }
    const next = { ...settings, ...patch };
    setSettings(next);
    await updateRoomSettings(room.id, next);
  };

  const startTrial = async () => {
    if (!canStartTrial(settings, players)) {
      setError("Both sides must be ready â€” assign AI or ready up human counsel.");
      return;
    }
    setIsBusy(true);
    try {
      await updateRoomStatus(room.id, "prosecutor_turn");
      onTrialStart();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start trial.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-zinc-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mx-auto max-w-5xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500/90">
              Waiting Lobby
            </p>
            <h1 className="mt-1 font-legal text-3xl text-zinc-50">
              {settings.chamberName}
            </h1>
            {scenario && (
              <p className="mt-2 font-legal text-sm text-zinc-500">
                {scenario.title} â€” {scenario.charge}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase text-zinc-600">
              Chamber Code
            </p>
            <motion.p
              className="font-mono text-4xl tracking-[0.45em] text-amber-300"
              animate={{ scale: [1, 1.03, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {room.code}
            </motion.p>
          </div>
        </header>

        <CourtBackdrop zoneId="judge" />

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <RoleSlot
            role="prosecutor"
            label="Prosecution"
            settings={settings}
            occupant={playerForRole(players, "prosecutor")}
            isHost={isHost}
            isMe={me?.role === "prosecutor"}
            onToggleAi={(value) => void patchSettings({ prosecutorIsAi: value })}
            onAiCharacterChange={(id) =>
              void patchSettings({ prosecutorAiCharacter: id })
            }
            onClaim={() => void claimRole("prosecutor")}
          />
          <RoleSlot
            role="defendant"
            label="Defense"
            settings={settings}
            occupant={playerForRole(players, "defendant")}
            isHost={isHost}
            isMe={me?.role === "defendant"}
            onToggleAi={(value) => void patchSettings({ defendantIsAi: value })}
            onAiCharacterChange={(id) =>
              void patchSettings({ defendantAiCharacter: id })
            }
            onClaim={() => void claimRole("defendant")}
          />
        </div>

        <motion.div
          layout
          className="mt-6 border border-zinc-800 bg-zinc-950/80 p-5"
        >
          <h2 className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500/80">
            Your Loadout
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-[120px_1fr]">
            <div
              className="h-32 border border-zinc-700 bg-cover bg-no-repeat"
              style={{
                backgroundImage: "url(/characters/roster.png)",
                backgroundSize: "400% 100%",
                backgroundPosition: rosterBackgroundPosition(
                  getCharacter(selectedCharacter).rosterIndex,
                ),
              }}
            />
            <div>
              <p className="font-mono text-[10px] uppercase text-zinc-500">
                Counsel
              </p>
              <select
                value={selectedCharacter}
                onChange={(e) =>
                  setSelectedCharacter(e.target.value as CharacterId)
                }
                className="mt-1 w-full border border-zinc-700 bg-black px-3 py-2 font-mono text-xs text-zinc-200"
              >
                {COUNSEL_CHARACTERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-3 font-mono text-[10px] uppercase text-zinc-500">
                Role: {selectedRole ?? "unassigned"}
              </p>
              <motion.div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void confirmLoadout()}
                  disabled={isBusy}
                  className="border border-zinc-600 px-4 py-2 font-mono text-[10px] uppercase text-zinc-300"
                >
                  Save Loadout
                </button>
                <motion.button
                  type="button"
                  onClick={() => void toggleReady()}
                  className={`px-4 py-2 font-mono text-[10px] uppercase ${
                    isReady
                      ? "border border-emerald-700 bg-emerald-950/40 text-emerald-200"
                      : "border border-amber-700 text-amber-200"
                  }`}
                  whileTap={{ scale: 0.97 }}
                >
                  {isReady ? "Ready âœ“" : "Mark Ready"}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </motion.div>

        <motion.div className="mt-4 border border-zinc-800 p-4" layout>
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Counsel Present ({players.length})
          </p>
          <ul className="mt-3 space-y-2">
            <AnimatePresence>
              {players.map((p) => (
                <motion.li
                  key={p.user_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-between border border-zinc-800/80 bg-black/40 px-3 py-2"
                >
                  <span className="font-legal text-sm text-zinc-200">
                    {p.display_name ?? "Counsel"}{" "}
                    <span className="text-zinc-600">
                      Â· {getCharacter(p.character_id).name}
                    </span>
                  </span>
                  <span className="font-mono text-[10px] uppercase text-amber-500/80">
                    {p.role}
                    {p.is_ready ? " Â· ready" : ""}
                  </span>
                </motion.li>
              ))}
            </AnimatePresence>
            {settings.prosecutorIsAi && (
              <li className="border border-amber-900/30 bg-amber-950/10 px-3 py-2 font-mono text-[10px] uppercase text-amber-300/80">
                AI Prosecution â€” {getCharacter(settings.prosecutorAiCharacter).name}
              </li>
            )}
            {settings.defendantIsAi && (
              <li className="border border-amber-900/30 bg-amber-950/10 px-3 py-2 font-mono text-[10px] uppercase text-amber-300/80">
                AI Defense â€” {getCharacter(settings.defendantAiCharacter).name}
              </li>
            )}
          </ul>
        </motion.div>

        {error && (
          <p className="mt-4 border border-red-900/50 bg-red-950/30 px-3 py-2 font-mono text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onExit}
            className="border border-zinc-700 px-5 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500"
          >
            Leave Lobby
          </button>
          {isHost && (
            <motion.button
              type="button"
              disabled={isBusy || !canStartTrial(settings, players)}
              onClick={() => void startTrial()}
              className="flex-1 border border-amber-600 bg-amber-950/40 py-3 font-mono text-xs uppercase tracking-[0.3em] text-amber-100 disabled:opacity-40"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              Commence Trial
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface RoleSlotProps {
  role: PlayerRole;
  label: string;
  settings: RoomSettings;
  occupant?: RoomPlayerRow;
  isHost: boolean;
  isMe: boolean;
  onToggleAi: (value: boolean) => void;
  onAiCharacterChange: (id: CharacterId) => void;
  onClaim: () => void;
}

function RoleSlot({
  role,
  label,
  settings,
  occupant,
  isHost,
  isMe,
  onToggleAi,
  onAiCharacterChange,
  onClaim,
}: RoleSlotProps) {
  const isAi =
    role === "prosecutor" ? settings.prosecutorIsAi : settings.defendantIsAi;
  const aiCharacter =
    role === "prosecutor"
      ? settings.prosecutorAiCharacter
      : settings.defendantAiCharacter;

  return (
    <motion.div
      layout
      className={`border p-4 ${
        isMe
          ? "border-amber-600/60 bg-amber-950/15"
          : "border-zinc-800 bg-black/30"
      }`}
    >
      <motion.div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-500">
          {label}
        </span>
        {isHost && (
          <button
            type="button"
            onClick={() => onToggleAi(!isAi)}
            className={`px-2 py-0.5 font-mono text-[9px] uppercase ${
              isAi ? "bg-amber-600 text-black" : "bg-zinc-800 text-zinc-500"
            }`}
          >
            {isAi ? "AI Counsel" : "Human"}
          </button>
        )}
      </motion.div>

      {isAi ? (
        <motion.div className="mt-4 space-y-3" layout>
          <motion.div className="flex items-center gap-3" layout>
            <motion.div
              className="h-20 w-14 shrink-0 border border-amber-800/40 bg-cover bg-no-repeat"
              layout
              style={{
                backgroundImage: "url(/characters/roster.png)",
                backgroundSize: "400% 100%",
                backgroundPosition: rosterBackgroundPosition(
                  getCharacter(aiCharacter).rosterIndex,
                ),
              }}
            />
            <motion.div className="min-w-0 flex-1">
              <p className="font-legal text-sm text-amber-200/90">
                {getCharacter(aiCharacter).name}
              </p>
              <p className="font-mono text-[9px] uppercase text-zinc-600">
                Automated Counsel
              </p>
            </motion.div>
          </motion.div>
          {isHost && (
            <select
              value={aiCharacter}
              onChange={(e) =>
                onAiCharacterChange(e.target.value as CharacterId)
              }
              className="w-full border border-zinc-700 bg-black px-2 py-2 font-mono text-[10px] text-zinc-300 outline-none focus:border-amber-600"
            >
              {COUNSEL_CHARACTERS.map((c) => (
                <option key={c.id} value={c.id}>
                  AI: {c.name}
                </option>
              ))}
            </select>
          )}
        </motion.div>
      ) : occupant ? (
        <div className="mt-4">
          <p className="font-legal text-sm text-zinc-100">
            {occupant.display_name ?? "Counsel"}
          </p>
          <p className="font-mono text-[10px] text-zinc-500">
            {getCharacter(occupant.character_id).name}
            {occupant.is_ready ? " · READY" : " · not ready"}
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={onClaim}
          className="mt-4 w-full border border-dashed border-zinc-600 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:border-amber-700 hover:text-amber-200"
        >
          Claim {label}
        </button>
      )}
    </motion.div>
  );
}
