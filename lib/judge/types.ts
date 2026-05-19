import type { JudgeVerdictJson } from "@/lib/database/types";

export type LawyerRole = "human" | "ai";

export interface JudgeRequestBody {
  scenario: string;
  prosecutorText: string;
  defendantText: string;
  prosecutorRole?: LawyerRole;
  defendantRole?: LawyerRole;
}

export interface JudgeResponseBody {
  verdict: JudgeVerdictJson;
  prosecutorArgument: string;
  defendantArgument: string;
  jury: JuryVoteResult;
}

export interface JuryVoteResult {
  guiltyVotes: number;
  notGuiltyVotes: number;
  deliberationNote: string;
}

export interface AutomationContext {
  scenario: string;
  prosecutorText: string;
  defendantText: string;
}
