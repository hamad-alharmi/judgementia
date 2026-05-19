import { NextResponse } from "next/server";
import {
  generateAiDefendantArgument,
  generateAiProsecutorArgument,
  simulateJuryVoteSplit,
} from "@/lib/judge/automation";
import type { JudgeRequestBody, JudgeResponseBody } from "@/lib/judge/types";
import { requestJudgeVerdict } from "@/lib/gemini";

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
  if (
    prosecutorRole !== undefined &&
    !isLawyerRole(prosecutorRole)
  ) {
    return null;
  }
  if (
    defendantRole !== undefined &&
    !isLawyerRole(defendantRole)
  ) {
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
  try {
    const json: unknown = await request.json();
    const body = parseJudgeRequestBody(json);

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

    const verdict = await requestJudgeVerdict({
      scenario: body.scenario,
      prosecutorText: prosecutorArgument,
      defendantText: defendantArgument,
    });

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
