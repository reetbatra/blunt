import type {
  CoachPrompt,
  FrameworkUsed,
  SessionAnalysis,
  SessionScores,
  SessionStatus,
  VocabularyLevel,
} from "@/lib/blunt/types";

const FILLER_PATTERNS = [
  "um",
  "uh",
  "like",
  "you know",
  "kind of",
  "sort of",
  "basically",
  "actually",
  "literally",
  "i mean",
];

const ENGLISH_HINTS = new Set([
  "a",
  "and",
  "are",
  "because",
  "but",
  "for",
  "from",
  "have",
  "i",
  "if",
  "in",
  "is",
  "it",
  "my",
  "of",
  "on",
  "or",
  "so",
  "that",
  "the",
  "they",
  "this",
  "to",
  "we",
  "with",
  "you",
]);

function tokenize(text: string) {
  return text.toLowerCase().match(/[a-z']+/g) ?? [];
}

function splitSentences(transcript: string) {
  return transcript
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function countFillers(transcript: string) {
  const normalized = ` ${transcript.toLowerCase()} `;
  const hits = FILLER_PATTERNS.flatMap((filler) => {
    const escaped = filler.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = normalized.match(new RegExp(`\\b${escaped}\\b`, "g")) ?? [];
    return Array.from({ length: matches.length }, () => filler);
  });

  const uniqueSorted = [...new Set(hits)].sort(
    (left, right) =>
      hits.filter((item) => item === right).length -
      hits.filter((item) => item === left).length,
  );

  return {
    fillerCount: hits.length,
    fillerWords: uniqueSorted,
  };
}

function detectFramework(transcript: string): {
  frameworkUsed: FrameworkUsed;
  frameworkAdherence: number;
} {
  const lower = transcript.toLowerCase();
  const starSignals = [
    "situation",
    "task",
    "action",
    "result",
    "challenge",
    "outcome",
  ].filter((word) => lower.includes(word)).length;
  const prepSignals = [
    "my point is",
    "i think",
    "because",
    "for example",
    "so",
  ].filter((word) => lower.includes(word)).length;

  if (starSignals >= 3 && starSignals >= prepSignals) {
    return {
      frameworkUsed: "STAR",
      frameworkAdherence: Math.min(5, starSignals),
    };
  }

  if (prepSignals >= 3) {
    return {
      frameworkUsed: "PREP",
      frameworkAdherence: Math.min(5, prepSignals),
    };
  }

  return {
    frameworkUsed: "none",
    frameworkAdherence: Math.min(2, starSignals + prepSignals),
  };
}

function pickVocabularyLevel(words: string[]): VocabularyLevel {
  if (words.length === 0) {
    return "basic";
  }

  const uniqueRatio = new Set(words).size / words.length;
  const averageLength =
    words.reduce((sum, word) => sum + word.length, 0) / words.length;

  if (uniqueRatio > 0.72 && averageLength > 4.9) {
    return "sharp";
  }

  if (uniqueRatio > 0.56 && averageLength > 4.2) {
    return "solid";
  }

  return "basic";
}

function isLikelyEnglish(transcript: string) {
  const words = tokenize(transcript);
  if (words.length < 4) {
    return true;
  }

  const hintHits = words.filter((word) => ENGLISH_HINTS.has(word)).length;
  const asciiLetters = (transcript.match(/[A-Za-z]/g) ?? []).length;
  const letterLike = (transcript.match(/\p{L}/gu) ?? []).length;
  const asciiRatio = letterLike === 0 ? 1 : asciiLetters / letterLike;
  return hintHits / words.length >= 0.14 && asciiRatio >= 0.85;
}

function quoteSentence(sentences: string[], fallback: string) {
  const sentence =
    sentences.find((item) => item.length > 14) ?? sentences[0] ?? fallback;
  return sentence.replace(/^["']|["']$/g, "");
}

function buildCritique({
  prompt,
  fillerCount,
  fillerWords,
  frameworkUsed,
  paceWpm,
  weakestQuote,
}: {
  prompt: CoachPrompt;
  fillerCount: number;
  fillerWords: string[];
  frameworkUsed: FrameworkUsed;
  paceWpm: number;
  weakestQuote: string;
}) {
  const fillerLine =
    fillerCount > 0
      ? `You said ${fillerWords
          .slice(0, 2)
          .map((word) => `"${word}"`)
          .join(" and ")} enough times to make it your personality.`
      : "You managed not to stuff the answer with filler, so congrats on clearing the lowest bar.";

  const paceLine =
    paceWpm > 185
      ? `You were sprinting at ${paceWpm} words per minute, which is a great way to sound panicked instead of sharp.`
      : paceWpm < 95
        ? `You crawled in at ${paceWpm} words per minute, which made the answer drag when it should land.`
        : `Your pace at ${paceWpm} words per minute is fine, so the mess is in the structure, not the speed.`;

  const structureLine =
    frameworkUsed === "STAR"
      ? "You at least tried to use STAR. Keep the result cleaner and stop padding the middle."
      : frameworkUsed === "PREP"
        ? "You were circling a PREP answer. Lead with the point sooner and stop making me wait for it."
        : `Your answer to "${prompt.text}" still has no spine. Pick a point, back it up, and stop wandering.`;

  return `${fillerLine} ${paceLine} You said "${weakestQuote}" and that line folds in on itself. ${structureLine}`;
}

export function createFallbackAnalysis(args: {
  durationMs: number;
  transcript: string;
  prompt: CoachPrompt;
  previousSessionId: string | null;
}): SessionAnalysis {
  const transcript = args.transcript.trim();
  const words = tokenize(transcript);
  const sentences = splitSentences(transcript);
  const strongestQuote = quoteSentence(
    [...sentences].sort((left, right) => right.length - left.length),
    transcript,
  );
  const weakestQuote = quoteSentence(
    [...sentences].sort((left, right) => left.length - right.length),
    transcript,
  );
  const { fillerCount, fillerWords } = countFillers(transcript);
  const { frameworkUsed, frameworkAdherence } = detectFramework(transcript);
  const paceWpm =
    args.durationMs > 0
      ? Math.max(1, Math.round(words.length / (args.durationMs / 60_000)))
      : words.length;
  const vocabularyLevel = pickVocabularyLevel(words);

  let status: SessionStatus = "scored";
  let critiqueText = buildCritique({
    prompt: args.prompt,
    fillerCount,
    fillerWords,
    frameworkUsed,
    paceWpm,
    weakestQuote,
  });

  if (!isLikelyEnglish(transcript)) {
    status = "non_english";
    critiqueText =
      "English only for now. I am not going to fake a score on something I cannot judge cleanly. Try that prompt again in English.";
  }

  const scores: SessionScores = {
    fillerCount,
    fillerWords,
    frameworkUsed,
    frameworkAdherence,
    paceWpm,
    vocabularyLevel,
    critiqueText,
    strongestQuote,
    weakestQuote,
  };

  return {
    status,
    transcript,
    scores,
    critiqueAudioUrl: null,
    durationMs: args.durationMs,
    prompt: args.prompt,
    previousSessionId: args.previousSessionId,
  };
}

export function createTooShortAnalysis(args: {
  durationMs: number;
  prompt: CoachPrompt;
  previousSessionId: string | null;
}): SessionAnalysis {
  return {
    status: "too_short",
    transcript: "",
    scores: {
      fillerCount: 0,
      fillerWords: [],
      frameworkUsed: null,
      frameworkAdherence: 0,
      paceWpm: 0,
      vocabularyLevel: "basic",
      critiqueText:
        "Didn't catch enough to score that, try again. Three seconds of throat-clearing is not a speech.",
      strongestQuote: "",
      weakestQuote: "",
    },
    critiqueAudioUrl: null,
    durationMs: args.durationMs,
    prompt: args.prompt,
    previousSessionId: args.previousSessionId,
  };
}
