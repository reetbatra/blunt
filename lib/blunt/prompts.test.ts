import { describe, expect, it } from "vitest";
import { getPrompt, isPromptCategory } from "@/lib/blunt/prompts";

describe("prompts", () => {
  it("returns stable prompts for the same seed", () => {
    const first = getPrompt("pitch", 9);
    const second = getPrompt("pitch", 9);

    expect(first).toEqual(second);
  });

  it("guards valid categories", () => {
    expect(isPromptCategory("eli5")).toBe(true);
    expect(isPromptCategory("whatever")).toBe(false);
  });
});
