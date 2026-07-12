import { describe, expect, it } from "vitest";
import { getFrameworkRecommendation } from "@/lib/blunt/frameworks";
import type { CoachPrompt } from "@/lib/blunt/types";

describe("framework recommendations", () => {
  it("recommends STAR for interview prompts", () => {
    const prompt: CoachPrompt = {
      id: "interview-1",
      category: "interview",
      label: "Interview prep",
      text: "Tell me about a time you shipped under pressure.",
    };

    const result = getFrameworkRecommendation(prompt, "none");
    expect(result.name).toBe("STAR");
    expect(result.steps).toHaveLength(4);
  });

  it("marks when the detected framework already matches the recommendation", () => {
    const prompt: CoachPrompt = {
      id: "pitch-1",
      category: "pitch",
      label: "Pitch",
      text: "Pitch a product.",
    };

    const result = getFrameworkRecommendation(prompt, "PREP");
    expect(result.isAlreadyUsingIt).toBe(true);
  });
});
