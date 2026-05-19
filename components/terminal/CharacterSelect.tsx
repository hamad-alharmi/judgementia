"use client";

import { motion } from "framer-motion";
import {
  COUNSEL_CHARACTERS,
  rosterBackgroundPosition,
  type CharacterId,
} from "@/lib/characters";

interface CharacterSelectProps {
  selectedId: CharacterId;
  onSelect: (id: CharacterId) => void;
}

export function CharacterSelect({
  selectedId,
  onSelect,
}: CharacterSelectProps) {
  return (
    <section className="border border-zinc-800 bg-zinc-950/60 p-5">
      <h2 className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500/90">
        Counsel Selection
      </h2>
      <p className="mt-1 font-legal text-xs text-zinc-500">
        Choose your courtroom persona. This portrait appears during your
        statements.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {COUNSEL_CHARACTERS.map((character) => {
          const active = character.id === selectedId;
          return (
            <motion.button
              key={character.id}
              type="button"
              onClick={() => onSelect(character.id)}
              className={`group relative overflow-hidden border text-left transition ${
                active
                  ? "border-amber-600 ring-1 ring-amber-600/50"
                  : "border-zinc-800 hover:border-zinc-600"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <motion.div
                className="h-36 w-full bg-zinc-900 bg-cover bg-no-repeat"
                style={{
                  backgroundImage: "url(/characters/roster.png)",
                  backgroundSize: "400% 100%",
                  backgroundPosition: rosterBackgroundPosition(
                    character.rosterIndex,
                  ),
                }}
                animate={active ? { scale: 1.05 } : { scale: 1 }}
              />
              <div className="border-t border-zinc-800 bg-black/80 p-2">
                <p className="font-legal text-sm text-zinc-100">
                  {character.name}
                </p>
                <p className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                  {character.title}
                </p>
              </div>
              {active && (
                <motion.div
                  layoutId="character-glow"
                  className="pointer-events-none absolute inset-0 border-2 border-amber-500/60"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}
