"use client";

import { motion } from "framer-motion";
import { ScalesOfJustice } from "@/components/icons/ScalesOfJustice";

const ease = [0.22, 1, 0.36, 1] as const;

export function LoadingPhase() {
  return (
    <motion.div
      className="flex min-h-screen flex-col items-center justify-center bg-zinc-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        className="text-white"
        animate={{ rotate: [-8, 8, -8] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <ScalesOfJustice className="h-24 w-24 drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]" />
      </motion.div>

      <motion.p
        className="mt-8 font-mono text-xs uppercase tracking-[0.45em] text-zinc-500"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease }}
      >
        Judgementia
      </motion.p>
      <motion.p
        className="mt-2 font-legal text-sm text-zinc-600"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        Initializing judicial terminal…
      </motion.p>

      <motion.div
        className="mt-10 h-px w-48 overflow-hidden bg-zinc-800"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div
          className="h-full bg-amber-600/80"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease }}
        />
      </motion.div>
    </motion.div>
  );
}
