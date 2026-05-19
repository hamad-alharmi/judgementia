"use client";

import { motion } from "framer-motion";
import { PixelGavel } from "@/components/icons/PixelGavel";

export function GavelTransition() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        initial={{ y: "-130%", rotate: -18, scale: 1.1 }}
        animate={{
          y: [null, "8%", "0%"],
          rotate: [-18, 6, 0],
          scale: [1.1, 1.02, 1],
        }}
        transition={{
          duration: 0.55,
          times: [0, 0.72, 1],
          ease: [0.36, 0.07, 0.19, 0.97],
        }}
        className="text-amber-400"
      >
        <PixelGavel className="h-40 w-40 drop-shadow-[0_0_32px_rgba(251,191,36,0.45)]" />
      </motion.div>

      <motion.p
        className="absolute bottom-16 font-mono text-xs uppercase tracking-[0.55em] text-zinc-600"
        initial={{ opacity: 0, letterSpacing: "0.2em" }}
        animate={{ opacity: 1, letterSpacing: "0.55em" }}
        transition={{ delay: 0.35, duration: 0.45 }}
      >
        Order in the court
      </motion.p>

      <motion.div
        className="pointer-events-none absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.12, 0] }}
        transition={{ delay: 0.38, duration: 0.15 }}
      />
    </motion.div>
  );
}
