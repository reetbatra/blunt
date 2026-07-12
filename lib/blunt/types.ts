export const PROMPT_CATEGORIES = [
  "interview",
  "impromptu",
  "hot-take",
  "eli5",
  "pitch",
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

export const SESSION_STATUSES = [
  "scored",
  "too_short",
  "non_english",
] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const FRAMEWORKS = ["STAR", "PREP", "none"] as const;

export type FrameworkUsed = (typeof FRAMEWORKS)[number] | null;

export const VOCABULARY_LEVELS = ["basic", "solid", "sharp"] as const;

export type VocabularyLevel = (typeof VOCABULARY_LEVELS)[number];

export type CoachPrompt = {
  id: string;
  category: PromptCategory;
  label: string;
  text: string;
};

export type SessionScores = {
  fillerCount: number;
  fillerWords: string[];
  frameworkUsed: FrameworkUsed;
  frameworkAdherence: number;
  paceWpm: number;
  vocabularyLevel: VocabularyLevel;
  critiqueText: string;
  strongestQuote: string;
  weakestQuote: string;
};

export type SessionAnalysis = {
  status: SessionStatus;
  transcript: string;
  scores: SessionScores;
  critiqueAudioUrl: string | null;
  durationMs: number;
  prompt: CoachPrompt;
  previousSessionId: string | null;
};

export type StoredSession = SessionAnalysis & {
  id: string;
  createdAt: number;
  anonymousId: string | null;
};

export type AnonymousProgress = {
  scoredTakes: number;
  completedLoops: number;
  lastActiveAt: number | null;
};
