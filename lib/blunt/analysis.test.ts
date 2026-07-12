import { describe, expect, it } from "vitest";
import { createFallbackAnalysis, createTooShortAnalysis } from "@/lib/blunt/analysis";
import type { CoachPrompt } from "@/lib/blunt/types";

const prompt: CoachPrompt = {
  id: "interview-test",
  category: "interview",
  label: "Interview prep",
  text: "Tell me about a time you shipped under pressure.",
};

describe("createFallbackAnalysis", () => {
  it("counts fillers and cites the speaker's own words", () => {
    const result = createFallbackAnalysis({
      durationMs: 20_000,
      transcript:
        "Um, like, I basically took over the launch and, you know, kept the team moving. I basically fixed the timeline.",
      prompt,
      previousSessionId: null,
    });

    expect(result.status).toBe("scored");
    expect(result.scores.fillerCount).toBeGreaterThanOrEqual(4);
    expect(result.scores.fillerWords).toContain("basically");
    expect(result.scores.critiqueText).toContain('You said "');
  });

  it("marks non-english transcripts explicitly", () => {
    const result = createFallbackAnalysis({
      durationMs: 12_000,
      transcript: "Hola amigo gracias por venir conmigo esta noche",
      prompt,
      previousSessionId: null,
    });

    expect(result.status).toBe("non_english");
    expect(result.scores.critiqueText).toContain("English only");
  });
});

describe("createTooShortAnalysis", () => {
  it("returns the short-recording guardrail copy", () => {
    const result = createTooShortAnalysis({
      durationMs: 1_900,
      prompt,
      previousSessionId: null,
    });

    expect(result.status).toBe("too_short");
    expect(result.scores.critiqueText).toContain("Didn't catch enough");
  });
});
