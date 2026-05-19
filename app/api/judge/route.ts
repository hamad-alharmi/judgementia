import { NextResponse } from "next/server";
import {
  generateAiDefendantArgument,
  generateAiProsecutorArgument,
  simulateJuryVoteSplit,
} from "@/lib/judge/automation";
import type { JudgeRequestBody, JudgeResponseBody } from "@/lib/judge/types";
import {
  fallbackJudgeVerdict,
  requestJudgeVerdict,
} from "@/lib/judge/verdict";

export const dynamic = "force-dynamic";

function isLawyerRole(value: unknown): value is "human" | "ai" {
  return value === "human" || value === "ai";
}

function parseJudgeRequestBody(body: unknown): JudgeRequestBody | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const record = body as Record<string, unknown>;
  if (
    typeof record.scenario !== "string" ||
    typeof record.prosecutorText !== "string" ||
    typeof record.defendantText !== "string"
  ) {
    return null;
  }
  const prosecutorRole = record.prosecutorRole;
  const defendantRole = record.defendantRole;
  if (prosecutorRole !== undefined && !isLawyerRole(prosecutorRole)) {
    return null;
  }
  if (defendantRole !== undefined && !isLawyerRole(defendantRole)) {
    return null;
  }
  return {
    scenario: record.scenario,
    prosecutorText: record.prosecutorText,
    defendantText: record.defendantText,
    prosecutorRole: prosecutorRole ?? "human",
    defendantRole: defendantRole ?? "human",
  };
}

export async function POST(request: Request) {
  let body: JudgeRequestBody | null = null;

  try {
    const json: unknown = await request.json();
    body = parseJudgeRequestBody(json);

    if (!body) {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const automationContext = {
      scenario: body.scenario,
      prosecutorText: body.prosecutorText,
      defendantText: body.defendantText,
    };

    const prosecutorArgument =
      body.prosecutorRole === "ai"
        ? generateAiProsecutorArgument(automationContext)
        : body.prosecutorText;

    const defendantArgument =
      body.defendantRole === "ai"
        ? generateAiDefendantArgument(automationContext)
        : body.defendantText;

    const jury = simulateJuryVoteSplit(prosecutorArgument, defendantArgument);

    let verdict;
    try {
      verdict = await requestJudgeVerdict({
        scenario: body.scenario,
        prosecutorText: prosecutorArgument,
        defendantText: defendantArgument,
      });
    } catch (judgeError) {
      const detail =
        judgeError instanceof Error ? judgeError.message : "Judge API error";
      console.error("[judge] Gemini verdict failed:", detail);
      verdict = fallbackJudgeVerdict(detail);
    }

    const response: JudgeResponseBody = {
      verdict,
      prosecutorArgument,
      defendantArgument,
      jury,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Judge route failed.";
    console.error("[judge] route error:", message);

    if (body) {
      const jury = simulateJuryVoteSplit(
        body.prosecutorText,
        body.defendantText,
      );
      const response: JudgeResponseBody = {
        verdict: fallbackJudgeVerdict(message),
        prosecutorArgument: body.prosecutorText,
        defendantArgument: body.defendantText,
        jury,
      };
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
