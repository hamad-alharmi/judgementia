"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  evidenceTypeLabel,
  formatExhibitCitation,
  implicatesLabel,
} from "@/lib/evidence";
import type { EvidencePiece } from "@/lib/scenarios";

interface EvidenceVaultProps {
  evidence: readonly EvidencePiece[];
  canPresent: boolean;
  onPresentEvidence: (citation: string) => void;
}

export function EvidenceVault({
  evidence,
  canPresent,
  onPresentEvidence,
}: EvidenceVaultProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    evidence[0]?.id ?? null,
  );

  return (
    <aside className="flex h-full min-h-[32rem] flex-col border border-zinc-800 bg-zinc-950/90">
      <div className="border-b border-zinc-800 bg-black/50 px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-amber-500">
          Evidence Vault
        </p>
        <p className="mt-1 font-sans text-xs text-zinc-500">
          Classified exhibits for active docket. Expand to review; present during
          your turn.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {evidence.length === 0 ? (
          <p className="border border-dashed border-zinc-800 px-3 py-6 text-center font-sans text-xs text-zinc-600">
            No exhibits cataloged for this case file.
          </p>
        ) : (
          evidence.map((piece, index) => {
            const isOpen = expandedId === piece.id;
            const citation = formatExhibitCitation(piece, index);

            return (
              <motion.div
                key={piece.id}
                layout
                className={`overflow-hidden border transition-colors ${
                  isOpen
                    ? "border-amber-700/50 bg-amber-950/10"
                    : "border-zinc-800 bg-black/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(isOpen ? null : piece.id)
                  }
                  className="w-full px-3 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-amber-600/90">
                        Exhibit {String.fromCharCode(65 + index)} ·{" "}
                        {evidenceTypeLabel(piece.type)}
                      </p>
                      <p className="mt-1 font-sans text-sm font-medium text-zinc-100">
                        {piece.name}
                      </p>
                    </div>
                    <span className="font-mono text-[9px] text-zinc-600">
                      {isOpen ? "−" : "+"}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-[9px] uppercase text-zinc-500">
                    {implicatesLabel(piece.implicates)}
                  </p>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-zinc-800/80 px-3 pb-3 pt-2">
                        <p className="font-sans text-xs leading-relaxed text-zinc-400">
                          {piece.description}
                        </p>
                        {canPresent && (
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onPresentEvidence(citation)}
                            className="mt-3 w-full border border-amber-700/80 bg-amber-950/40 py-2 font-mono text-[10px] uppercase tracking-widest text-amber-100 hover:bg-amber-900/30"
                          >
                            Present Evidence
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </aside>
  );
}
