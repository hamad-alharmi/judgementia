import type { EvidencePiece } from "@/lib/scenarios";

const EXHIBIT_LABELS = ["A", "B", "C"] as const;

export function exhibitLabelForIndex(index: number): string {
  return EXHIBIT_LABELS[index] ?? String(index + 1);
}

export function formatExhibitCitation(piece: EvidencePiece, index: number): string {
  const label = exhibitLabelForIndex(index);
  return `[EXHIBIT ${label}: ${piece.name} — ${piece.description}]`;
}

export function appendExhibitToArgument(
  currentDraft: string,
  citation: string,
): string {
  const trimmed = currentDraft.trim();
  if (!trimmed) {
    return citation;
  }
  if (trimmed.includes(citation)) {
    return trimmed;
  }
  return `${trimmed}\n\n${citation}`;
}

export function evidenceTypeLabel(
  type: EvidencePiece["type"],
): string {
  switch (type) {
    case "state_log":
      return "State Log";
    case "forensic_file":
      return "Forensic File";
    case "financial_trail":
      return "Financial Trail";
    default:
      return "Exhibit";
  }
}

export function implicatesLabel(
  implicates: EvidencePiece["implicates"],
): string {
  switch (implicates) {
    case "prosecution":
      return "Favors Prosecution";
    case "defense":
      return "Favors Defense";
    case "ambiguous":
      return "Ambiguous";
    default:
      return "Unknown";
  }
}
