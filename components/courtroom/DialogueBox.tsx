"use client";

import { motion } from "framer-motion";
import {
  getCharacter,
  rosterBackgroundPosition,
  type CharacterId,
} from "@/lib/characters";

interface DialogueBoxProps {
  characterId: CharacterId;
  speakerLabel: string;
  text: string;
  isPlayer?: boolean;
  isTyping?: boolean;
}

export function DialogueBox({
  characterId,
  speakerLabel,
  text,
  isPlayer = false,
  isTyping = false,
}: DialogueBoxProps) {
  const character = getCharacter(characterId);

  return (
    <motion.div
      className={`flex gap-4 border p-4 ${
        isPlayer
          ? "border-amber-700/50 bg-amber-950/20"
          : "border-zinc-800 bg-zinc-950/80"
      }`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="h-28 w-20 shrink-0 overflow-hidden border border-zinc-700 bg-zinc-900 bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url(/characters/roster.png)",
          backgroundSize: "400% 100%",
          backgroundPosition: rosterBackgroundPosition(character.rosterIndex),
        }}
        animate={isTyping ? { scale: [1, 1.02, 1] } : { scale: 1 }}
        transition={{ duration: 1.2, repeat: isTyping ? Infinity : 0 }}
      />
      <motion.div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500/90">
          {speakerLabel}
        </p>
        <p className="font-legal text-xs text-zinc-500">{character.name}</p>
        <motion.p
          key={text}
          className="mt-2 font-sans text-sm leading-relaxed text-zinc-100"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {text || (
            <span className="italic text-zinc-600">Awaiting statement…</span>
          )}
        </motion.p>
        {!text && (
          <p className="mt-2 font-mono text-[10px] text-zinc-600">
            &ldquo;{character.quote}&rdquo;
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
