"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  COUNSEL_CHARACTERS,
  type CharacterId,
} from "@/lib/characters";
import {
  CRIME_SCENARIOS,
  formatScenarioForRoom,
  pickRandomScenario,
} from "@/lib/scenarios";
import {
  DEFAULT_ROOM_SETTINGS,
  type RoomSettings,
} from "@/lib/room/settings";
import { generateRoomCode } from "@/lib/rooms";
import {
  createRoomRow,
  ensureGameStateRow,
  upsertRoomPlayer,
} from "@/lib/supabase/data";

type RoomSettingsPatch = Partial<RoomSettings>;

interface CreateRoomPanelProps {
  userId: string;
  defaultCharacterId: CharacterId;
  displayName: string;
  onCreated: (roomId: string) => void;
  onCancel: () => void;
}

export function CreateRoomPanel({
  userId,
  defaultCharacterId,
  displayName,
  onCreated,
  onCancel,
}: CreateRoomPanelProps) {
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_ROOM_SETTINGS);
  const [scenarioId, setScenarioId] = useState<string>("random");
  const [hostRole, setHostRole] = useState<"prosecutor" | "defendant">(
    "prosecutor",
  );
  const [hostCharacter, setHostCharacter] =
    useState<CharacterId>(defaultCharacterId);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchSettings = (patch: RoomSettingsPatch) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const createChamber = async () => {
    setIsBusy(true);
    setError(null);
    try {
      const scenario =
        scenarioId === "random"
          ? pickRandomScenario()
          : CRIME_SCENARIOS.find((s) => s.id === scenarioId) ??
            pickRandomScenario();

      const hostCannotTakeRole =
        (hostRole === "prosecutor" && settings.prosecutorIsAi) ||
        (hostRole === "defendant" && settings.defendantIsAi);

      if (hostCannotTakeRole) {
        setError("You marked that role as AI. Choose another role or disable AI for it.");
        setIsBusy(false);
        return;
      }

      const room = await createRoomRow({
        code: generateRoomCode(),
        status: "lobby",
        scenario: formatScenarioForRoom(scenario),
        host_id: userId,
        settings,
      });

      await ensureGameStateRow(room.id);
      await upsertRoomPlayer({
        room_id: room.id,
        user_id: userId,
        character_id: hostCharacter,
        role: hostRole,
        is_ready: true,
        display_name: displayName,
      });

      onCreated(room.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to create chamber.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-amber-900/40 bg-gradient-to-b from-zinc-900/90 to-zinc-950 p-6 shadow-[0_0_60px_-20px_rgba(245,158,11,0.25)]"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-amber-500">
        Chamber Fabrication
      </p>
      <h2 className="mt-2 font-legal text-2xl text-zinc-50">
        Customize Your Courtroom
      </h2>

      <motion.div className="mt-6 space-y-5">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Chamber Name
          </span>
          <input
            value={settings.chamberName}
            onChange={(e) => patchSettings({ chamberName: e.target.value })}
            className="mt-1.5 w-full border border-zinc-700 bg-black/60 px-3 py-2.5 font-legal text-zinc-100 outline-none focus:border-amber-600"
          />
        </label>

        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Case Docket
          </span>
          <select
            value={scenarioId}
            onChange={(e) => setScenarioId(e.target.value)}
            className="mt-1.5 w-full border border-zinc-700 bg-black/60 px-3 py-2.5 font-mono text-xs text-zinc-200 outline-none focus:border-amber-600"
          >
            <option value="random">Random high-stakes case</option>
            {CRIME_SCENARIOS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <RoleAiToggle
            label="Prosecution"
            isAi={settings.prosecutorIsAi}
            characterId={settings.prosecutorAiCharacter}
            onAiChange={(prosecutorIsAi) => patchSettings({ prosecutorIsAi })}
            onCharacterChange={(prosecutorAiCharacter) =>
              patchSettings({ prosecutorAiCharacter })
            }
          />
          <RoleAiToggle
            label="Defense"
            isAi={settings.defendantIsAi}
            characterId={settings.defendantAiCharacter}
            onAiChange={(defendantIsAi) => patchSettings({ defendantIsAi })}
            onCharacterChange={(defendantAiCharacter) =>
              patchSettings({ defendantAiCharacter })
            }
          />
        </div>

        <label className="flex items-center gap-3 border border-zinc-800 bg-black/40 px-3 py-2">
          <input
            type="checkbox"
            checked={settings.isPublic}
            onChange={(e) => patchSettings({ isPublic: e.target.checked })}
            className="accent-amber-600"
          />
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
            List in public matchmaking queue
          </span>
        </label>

        <div className="border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
            Your Counsel & Role
          </p>
          <div className="mt-3 flex gap-2">
            {(["prosecutor", "defendant"] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setHostRole(role)}
                disabled={
                  (role === "prosecutor" && settings.prosecutorIsAi) ||
                  (role === "defendant" && settings.defendantIsAi)
                }
                className={
                  hostRole === role
                    ? "flex-1 border border-amber-600 bg-amber-950/50 py-2 font-mono text-[10px] uppercase text-amber-100"
                    : "flex-1 border border-zinc-800 py-2 font-mono text-[10px] uppercase text-zinc-500 disabled:opacity-40"
                }
              >
                {role}
              </button>
            ))}
          </div>
          <select
            value={hostCharacter}
            onChange={(e) => setHostCharacter(e.target.value as CharacterId)}
            className="mt-3 w-full border border-zinc-700 bg-black px-3 py-2 font-mono text-xs text-zinc-200"
          >
            {COUNSEL_CHARACTERS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </motion.div>

      {error && (
        <p className="mt-4 border border-red-900/50 bg-red-950/30 px-3 py-2 font-mono text-xs text-red-300">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 border border-zinc-700 py-3 font-mono text-[10px] uppercase tracking-widest text-zinc-400"
        >
          Cancel
        </button>
        <motion.button
          type="button"
          disabled={isBusy}
          onClick={() => void createChamber()}
          className="flex-[2] border border-amber-700 bg-amber-950/50 py-3 font-mono text-xs uppercase tracking-widest text-amber-100 disabled:opacity-50"
          whileTap={{ scale: 0.98 }}
        >
          {isBusy ? "Forging Chamber…" : "Open Waiting Lobby"}
        </motion.button>
      </div>
    </motion.section>
  );
}

interface RoleAiToggleProps {
  label: string;
  isAi: boolean;
  characterId: CharacterId;
  onAiChange: (value: boolean) => void;
  onCharacterChange: (id: CharacterId) => void;
}

function RoleAiToggle({
  label,
  isAi,
  characterId,
  onAiChange,
  onCharacterChange,
}: RoleAiToggleProps) {
  return (
    <div
      className={`border p-3 transition ${
        isAi ? "border-amber-700/60 bg-amber-950/20" : "border-zinc-800 bg-black/30"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400">
          {label}
        </span>
        <button
          type="button"
          onClick={() => onAiChange(!isAi)}
          className={`px-2 py-1 font-mono text-[9px] uppercase ${
            isAi
              ? "bg-amber-600 text-black"
              : "bg-zinc-800 text-zinc-400"
          }`}
        >
          {isAi ? "AI Counsel" : "Human"}
        </button>
      </div>
      {isAi && (
        <select
          value={characterId}
          onChange={(e) => onCharacterChange(e.target.value as CharacterId)}
          className="mt-2 w-full border border-zinc-700 bg-black px-2 py-1.5 font-mono text-[10px] text-zinc-300"
        >
          {COUNSEL_CHARACTERS.map((c) => (
            <option key={c.id} value={c.id}>
              AI: {c.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
