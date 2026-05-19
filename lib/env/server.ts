import "server-only";

function requireServerEnv(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getGeminiApiKey(): string {
  return requireServerEnv("GEMINI_API_KEY", process.env.GEMINI_API_KEY);
}
