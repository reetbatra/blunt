import "server-only";

import {
  createFallbackAnalysis,
  createTooShortAnalysis,
} from "@/lib/blunt/analysis";
import type { CoachPrompt, SessionAnalysis, SessionScores } from "@/lib/blunt/types";

const OPENAI_TRANSCRIBE_MODEL =
  process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-transcribe";
const OPENAI_SCORING_MODEL = process.env.OPENAI_SCORING_MODEL ?? "gpt-5.6";
const MINIMUM_RECORDING_MS = 3_000;

const SCORE_SCHEMA = {
  name: "blunt_speech_feedback",
  strict: true,
  schema: {
    type: "object",
    properties: {
      language: { type: "string", enum: ["english", "non_english"] },
      filler_count: { type: "integer", minimum: 0 },
      filler_words: {
        type: "array",
        items: { type: "string" },
      },
      framework_used: {
        anyOf: [
          { type: "string", enum: ["STAR", "PREP", "none"] },
          { type: "null" },
        ],
      },
      framework_adherence: { type: "integer", minimum: 0, maximum: 5 },
      pace_wpm: { type: "integer", minimum: 0 },
      vocabulary_level: {
        type: "string",
        enum: ["basic", "solid", "sharp"],
      },
      strongest_quote: { type: "string" },
      weakest_quote: { type: "string" },
      critique_text: { type: "string" },
    },
    required: [
      "language",
      "filler_count",
      "filler_words",
      "framework_used",
      "framework_adherence",
      "pace_wpm",
      "vocabulary_level",
      "strongest_quote",
      "weakest_quote",
      "critique_text",
    ],
    additionalProperties: false,
  },
} as const;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

async function transcribeWithOpenAI(file: File) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const formData = new FormData();
  formData.append("file", file);
  formData.append("model", OPENAI_TRANSCRIBE_MODEL);
  formData.append("response_format", "text");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`OpenAI transcription failed with ${response.status}`);
  }

  return (await response.text()).trim();
}

function parseScorePayload(payload: unknown): SessionScores & { language: string } {
  if (!payload || typeof payload !== "object") {
    throw new Error("Scoring response was not an object");
  }

  const record = payload as Record<string, unknown>;
  const fillerWords =
    Array.isArray(record.filler_words) &&
    record.filler_words.every((item) => typeof item === "string")
      ? record.filler_words
      : [];

  if (
    typeof record.language !== "string" ||
    typeof record.filler_count !== "number" ||
    typeof record.framework_adherence !== "number" ||
    typeof record.pace_wpm !== "number" ||
    typeof record.vocabulary_level !== "string" ||
    typeof record.strongest_quote !== "string" ||
    typeof record.weakest_quote !== "string" ||
    typeof record.critique_text !== "string"
  ) {
    throw new Error("Scoring response shape was invalid");
  }

  return {
    language: record.language,
    fillerCount: record.filler_count,
    fillerWords,
    frameworkUsed:
      record.framework_used === null ||
      record.framework_used === "STAR" ||
      record.framework_used === "PREP" ||
      record.framework_used === "none"
        ? record.framework_used
        : null,
    frameworkAdherence: record.framework_adherence,
    paceWpm: record.pace_wpm,
    vocabularyLevel:
      record.vocabulary_level === "sharp" ||
      record.vocabulary_level === "solid"
        ? record.vocabulary_level
        : "basic",
    strongestQuote: record.strongest_quote,
    weakestQuote: record.weakest_quote,
    critiqueText: record.critique_text,
  };
}

async function scoreWithOpenAI(args: {
  transcript: string;
  durationMs: number;
  prompt: CoachPrompt;
}) {
  const apiKey = requireEnv("OPENAI_API_KEY");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_SCORING_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are Blunt, a slightly mean but useful speech coach. Score only from the user's actual transcript. Generic advice is banned. Cite their actual words in critique_text. If the transcript is not English, set language to non_english and explain that English only is supported. Return strict JSON only.",
        },
        {
          role: "user",
          content: JSON.stringify({
            prompt: args.prompt.text,
            category: args.prompt.category,
            duration_ms: args.durationMs,
            transcript: args.transcript,
            instructions:
              "Return filler counts, framework, pace, vocabulary, a strongest quote, a weakest quote, and a direct critique with one concrete rewrite direction.",
          }),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: SCORE_SCHEMA,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI scoring failed with ${response.status}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Scoring response was empty");
  }

  return parseScorePayload(JSON.parse(content));
}

async function synthesizeVoice(text: string) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const voiceId = process.env.ELEVENLABS_VOICE_ID;
  if (!apiKey || !voiceId) {
    return null;
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID ?? "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.7,
        },
      }),
    },
  );

  if (!response.ok) {
    return null;
  }

  const bytes = await response.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");
  return `data:audio/mpeg;base64,${base64}`;
}

export async function analyzeSpeech(args: {
  file: File;
  durationMs: number;
  prompt: CoachPrompt;
  previousSessionId: string | null;
}): Promise<SessionAnalysis> {
  if (args.durationMs < MINIMUM_RECORDING_MS) {
    return createTooShortAnalysis({
      durationMs: args.durationMs,
      prompt: args.prompt,
      previousSessionId: args.previousSessionId,
    });
  }

  const transcript = await transcribeWithOpenAI(args.file);
  if (transcript.length < 8) {
    return createTooShortAnalysis({
      durationMs: args.durationMs,
      prompt: args.prompt,
      previousSessionId: args.previousSessionId,
    });
  }

  try {
    const scored = await scoreWithOpenAI({
      transcript,
      durationMs: args.durationMs,
      prompt: args.prompt,
    });
    const critiqueAudioUrl = await synthesizeVoice(scored.critiqueText).catch(
      () => null,
    );

    return {
      status: scored.language === "english" ? "scored" : "non_english",
      transcript,
      scores: {
        fillerCount: scored.fillerCount,
        fillerWords: scored.fillerWords,
        frameworkUsed: scored.frameworkUsed,
        frameworkAdherence: scored.frameworkAdherence,
        paceWpm: scored.paceWpm,
        vocabularyLevel: scored.vocabularyLevel,
        strongestQuote: scored.strongestQuote,
        weakestQuote: scored.weakestQuote,
        critiqueText: scored.critiqueText,
      },
      critiqueAudioUrl,
      durationMs: args.durationMs,
      prompt: args.prompt,
      previousSessionId: args.previousSessionId,
    };
  } catch {
    return createFallbackAnalysis({
      durationMs: args.durationMs,
      transcript,
      prompt: args.prompt,
      previousSessionId: args.previousSessionId,
    });
  }
}
