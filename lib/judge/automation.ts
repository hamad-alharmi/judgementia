import type { AutomationContext, JuryVoteResult } from "@/lib/judge/types";

const PROSECUTOR_OPENERS = [
  "Your Honor, the evidentiary chain is unbroken and the defendant's conduct satisfies every element of the charged offense.",
  "The record establishes deliberate action, not negligence — the timeline alone condemns the accused.",
] as const;

const DEFENSE_OPENERS = [
  "The prosecution's narrative collapses under scrutiny — reasonable doubt is not a courtesy, it is a constitutional mandate.",
  "Motive has been substituted for proof; the State has failed to isolate the defendant from alternative perpetrators.",
] as const;

function hashText(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function generateAiProsecutorArgument(
  context: AutomationContext,
): string {
  const opener =
    PROSECUTOR_OPENERS[hashText(context.scenario) % PROSECUTOR_OPENERS.length] ??
    PROSECUTOR_OPENERS[0];
  return `${opener} The scenario dossier (${context.scenario.slice(0, 120)}…) compels conviction: forensic alignment, custodial control, and premeditated concealment converge without innocent explanation.`;
}

export function generateAiDefendantArgument(
  context: AutomationContext,
): string {
  const opener =
    DEFENSE_OPENERS[hashText(context.defendantText) % DEFENSE_OPENERS.length] ??
    DEFENSE_OPENERS[0];
  return `${opener} Chain-of-custody gaps and prosecutorial overreach infect every exhibit; acquittal is the only verdict consistent with due process.`;
}

export function simulateJuryVoteSplit(
  prosecutorText: string,
  defendantText: string,
): JuryVoteResult {
  const prosecutionWeight =
    prosecutorText.trim().length +
    (prosecutorText.match(/\b(evidence|proof|guilty|liability)\b/gi)?.length ??
      0) *
      12;
  const defenseWeight =
    defendantText.trim().length +
    (defendantText.match(/\b(doubt|innocent|constitutional|acquit)\b/gi)
      ?.length ?? 0) *
      12;

  const total = prosecutionWeight + defenseWeight || 1;
  const guiltyProbability = prosecutionWeight / total;

  let guiltyVotes = 0;
  let notGuiltyVotes = 0;

  for (let juror = 0; juror < 5; juror += 1) {
    const jurorBias =
      (hashText(`${prosecutorText}:${defendantText}:${juror}`) % 100) / 100;
    if (jurorBias < guiltyProbability) {
      guiltyVotes += 1;
    } else {
      notGuiltyVotes += 1;
    }
  }

  const deliberationNote =
    guiltyVotes >= 3
      ? "Majority finds prosecution rhetoric and evidentiary framing persuasive beyond reasonable doubt."
      : "Majority credits defense counter-narrative and identifies fatal reasonable doubt in State theory.";

  return { guiltyVotes, notGuiltyVotes, deliberationNote };
}
