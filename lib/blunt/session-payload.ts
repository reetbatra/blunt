import { isPromptCategory } from "@/lib/blunt/prompts";
import type { CoachPrompt } from "@/lib/blunt/types";

export function parsePromptPayload(payload: unknown): CoachPrompt | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.category !== "string" ||
    typeof record.label !== "string" ||
    typeof record.text !== "string"
  ) {
    return null;
  }

  if (!isPromptCategory(record.category)) {
    return null;
  }

  return {
    id: record.id,
    category: record.category,
    label: record.label,
    text: record.text,
  };
}
