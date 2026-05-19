import { GoogleGenAI } from "@google/genai";
import type { JudgeVerdictJson } from "@/lib/database/types";
import { getGeminiApiKey } from "@/lib/env/server";

const JUDGE_MODEL = "gemini-2.5-flash";

const JUDGE_VERDICT_SCHEMA = {
  type: "object",
  properties: {
    finalVerdict: {
      type: "string",
      enum: ["GUILTY", "NOT GUILTY"],
    },
    reasoning: { type: "string" },
    punishment: { type: "string" },
  },
  required: ["finalVerdict", "reasoning", "punishment"],
} as const;

const JUDGE_PERSONA = `You are Chief Justice Vanguard, a cold, highly analytical Supreme Court Judge.
You value legal logic, technical protocol, and flawless rhetoric.
Any argument lines formatted as [EXHIBIT X: Title — Description] are sworn trial exhibits.
You MUST explicitly weigh each exhibit in your reasoning—state whether each exhibit supports prosecution, defense, or is ambiguous, and how it affects the outcome.
Respond ONLY with valid JSON matching the required schema.`;

let genaiClient: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!genaiClient) {
    genaiClient = new GoogleGenAI({ apiKey: getGeminiApiKey() });
  }
  return genaiClient;
}

function extractJsonBlock(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }
  const braceStart = raw.indexOf("{");
  const braceEnd = raw.lastIndexOf("}");
  if (braceStart >= 0 && braceEnd > braceStart) {
    return raw.slice(braceStart, braceEnd + 1);
  }
  return raw.trim();
}

export function isJudgeVerdict(value: unknown): value is JudgeVerdictJson {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    (record.finalVerdict === "GUILTY" ||
      record.finalVerdict === "NOT GUILTY") &&
    typeof record.reasoning === "string" &&
    typeof record.punishment === "string"
  );
}

export function parseJudgeVerdict(raw: string): JudgeVerdictJson {
  const parsed: unknown = JSON.parse(extractJsonBlock(raw));
  if (!isJudgeVerdict(parsed)) {
    throw new Error("Judge response failed schema validation.");
  }
  return parsed;
}

export function fallbackJudgeVerdict(reason: string): JudgeVerdictJson {
  return {
    finalVerdict: "NOT GUILTY",
    reasoning: `The court could not render an automated verdict (${reason}). A mistrial is declared; the record is preserved for appellate review.`,
    punishment: "None — mistrial pending human review",
  };
}

export async function requestJudgeVerdict(params: {
  scenario: string;
  prosecutorText: string;
  defendantText: string;
}): Promise<JudgeVerdictJson> {
  const client = getClient();

  const prompt = `${JUDGE_PERSONA}

CASE FILE:
${params.scenario}

PROSECUTION CLOSING (may include [EXHIBIT ...] markers):
${params.prosecutorText || "(No prosecution statement on record.)"}

DEFENSE CLOSING (may include [EXHIBIT ...] markers):
${params.defendantText || "(No defense statement on record.)"}

Return JSON: {"finalVerdict":"GUILTY"|"NOT GUILTY","reasoning":"string","punishment":"string"}`;

  const response = await client.models.generateContent({
    model: JUDGE_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: JUDGE_VERDICT_SCHEMA,
      temperature: 0.35,
    },
  });

  const text = response.text;
  if (!text?.trim()) {
    throw new Error("Gemini returned an empty judge response.");
  }

  return parseJudgeVerdict(text);
}
