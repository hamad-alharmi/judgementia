"use client";

import { motion } from "framer-motion";
import {
  COURT_ZONES,
  type CourtZoneId,
} from "@/lib/court/zones";

interface CourtBackdropProps {
  zoneId: CourtZoneId;
}

export function CourtBackdrop({ zoneId }: CourtBackdropProps) {
  const zone = COURT_ZONES[zoneId];

  return (
    <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden border border-zinc-800 bg-black">
      <motion.div
        key={zoneId}
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: "url(/court/zones-grid.png)",
          backgroundSize: "200% 200%",
          backgroundPosition: zone.backgroundPosition,
        }}
        initial={{ opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.div
        className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      />
      <motion.div
        key={`label-${zoneId}`}
        className="absolute left-4 top-4 border border-amber-800/40 bg-black/60 px-3 py-1.5 backdrop-blur-sm"
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15 }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-400">
          {zone.label} Chamber
        </p>
      </motion.div>
    </div>
  );
}
