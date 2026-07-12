import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextResponse } from "next/server";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { analyzeSpeech } from "@/lib/blunt/session-service";
import { parsePromptPayload } from "@/lib/blunt/session-payload";

export const runtime = "nodejs";
// Convex runtime references exist even when local generated typings lag behind
// new modules during implementation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sessionsApi = (api as Record<string, any>).sessions;

function parseDuration(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  const promptValue = formData.get("prompt");
  const durationMs = parseDuration(formData.get("durationMs"));
  const previousSessionIdValue = formData.get("previousSessionId");

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json(
      { error: "Upload a recording before asking for a score" },
      { status: 400 },
    );
  }

  let rawPrompt: unknown = null;
  if (typeof promptValue === "string") {
    try {
      rawPrompt = JSON.parse(promptValue);
    } catch {
      return NextResponse.json(
        { error: "Prompt payload is malformed" },
        { status: 400 },
      );
    }
  }

  const prompt = parsePromptPayload(rawPrompt);

  if (!prompt) {
    return NextResponse.json({ error: "Prompt payload is missing" }, { status: 400 });
  }

  if (durationMs === null) {
    return NextResponse.json(
      { error: "Recording duration is missing" },
      { status: 400 },
    );
  }

  let previousSessionId: Id<"sessions"> | undefined;
  if (typeof previousSessionIdValue === "string" && previousSessionIdValue.length > 0) {
    previousSessionId = previousSessionIdValue as Id<"sessions">;
    const previous = await fetchQuery(sessionsApi.getById, {
      id: previousSessionId,
    });
    if (!previous) {
      return NextResponse.json(
        { error: "That re-record target does not exist" },
        { status: 400 },
      );
    }

    if (previous.prompt.id !== prompt.id) {
      return NextResponse.json(
        { error: "Re-records have to stay on the same prompt" },
        { status: 400 },
      );
    }
  }

  try {
    const analysis = await analyzeSpeech({
      file: audio,
      durationMs,
      prompt,
      previousSessionId: previousSessionId ?? null,
    });

    const sessionId = await fetchMutation(sessionsApi.create, {
      promptId: prompt.id,
      promptCategory: prompt.category,
      promptLabel: prompt.label,
      promptText: prompt.text,
      transcript: analysis.transcript,
      durationMs: analysis.durationMs,
      status: analysis.status,
      fillerCount: analysis.scores.fillerCount,
      fillerWords: analysis.scores.fillerWords,
      frameworkUsed: analysis.scores.frameworkUsed ?? undefined,
      frameworkAdherence: analysis.scores.frameworkAdherence,
      paceWpm: analysis.scores.paceWpm,
      vocabularyLevel: analysis.scores.vocabularyLevel,
      critiqueText: analysis.scores.critiqueText,
      critiqueAudioUrl: analysis.critiqueAudioUrl ?? undefined,
      strongestQuote: analysis.scores.strongestQuote,
      weakestQuote: analysis.scores.weakestQuote,
      previousSessionId,
    });

    return NextResponse.json({
      session: {
        id: sessionId,
        createdAt: Date.now(),
        ...analysis,
      },
    });
  } catch (error) {
    console.error("Session analysis failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          error.message === "OPENAI_API_KEY is not configured"
            ? "OpenAI is not configured yet. Add your API key and try again."
            : "Couldn't score that recording. Try again in a second.",
      },
      { status: 500 },
    );
  }
}
