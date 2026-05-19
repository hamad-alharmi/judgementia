import { GoogleGenAI } from "@google/genai";
import type { JudgeVerdictJson } from "@/lib/database/types";
import { getGeminiApiKey } from "@/lib/env/server";

const JUDGE_PERSONA =
  "You are Chief Justice Vanguard, a cold, highly analytical, and strictly professional Supreme Court Judge. You value legal logic, technical protocol, and flawless rhetoric above all else. Review the evidence, isolate systemic flaws in the arguments, and deliver an intellectually brutal legal decree.";

const MODEL_ID = "gemini-2.0-flash";

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

function isJudgeVerdict(value: unknown): value is JudgeVerdictJson {
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

export async function requestJudgeVerdict(params: {
  scenario: string;
  prosecutorText: string;
  defendantText: string;
}): Promise<JudgeVerdictJson> {
  const client = getClient();

  const prompt = `${JUDGE_PERSONA}

Review this trial record and respond with ONLY a single minified JSON object (no markdown, no prose outside JSON) matching exactly:
{"finalVerdict":"GUILTY"|"NOT GUILTY","reasoning":"string","punishment":"string"}

SCENARIO:
${params.scenario}

PROSECUTION:
${params.prosecutorText}

DEFENSE:
${params.defendantText}`;

  const response = await client.models.generateContent({
    model: MODEL_ID,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty judge response.");
  }

  const parsed: unknown = JSON.parse(extractJsonBlock(text));
  if (!isJudgeVerdict(parsed)) {
    throw new Error("Gemini judge response failed schema validation.");
  }

  return parsed;
}
