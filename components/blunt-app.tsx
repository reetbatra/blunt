"use client";

import Link from "next/link";
import {
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react";
import { trackEvent } from "@/lib/analytics";
import { getFrameworkRecommendation } from "@/lib/blunt/frameworks";
import type {
  AnonymousProgress,
  CoachPrompt,
  PromptCategory,
  StoredSession,
} from "@/lib/blunt/types";

const CATEGORIES: Array<{ value: PromptCategory; label: string; blurb: string }> = [
  {
    value: "interview",
    label: "Interview prep",
    blurb: "Stop sounding like a hostage reading LinkedIn.",
  },
  {
    value: "impromptu",
    label: "Impromptu",
    blurb: "No prep, no hiding, no mercy.",
  },
  {
    value: "hot-take",
    label: "Hot take",
    blurb: "Pick a fight and make it coherent.",
  },
  {
    value: "eli5",
    label: "ELI5",
    blurb: "Explain it simply without baby talk sludge.",
  },
  {
    value: "pitch",
    label: "Pitch",
    blurb: "Sell the idea before the room checks out.",
  },
];

const ANONYMOUS_ID_KEY = "blunt-anonymous-id";

function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function formatDuration(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatLastActive(timestamp: number | null) {
  if (!timestamp) {
    return "No reps yet";
  }

  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(1, Math.round(diffMs / 60_000));
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
}

function createAnonymousId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `blunt-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function getStoredAnonymousId() {
  if (typeof window === "undefined") {
    return null;
  }

  const existing = window.localStorage.getItem(ANONYMOUS_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = createAnonymousId();
  window.localStorage.setItem(ANONYMOUS_ID_KEY, next);
  return next;
}

function formatDelta(current: number, previous: number, inverse?: boolean) {
  const diff = current - previous;
  if (diff === 0) {
    return "No change";
  }

  const improved = inverse ? diff > 0 : diff < 0;
  const prefix = improved ? "Better by" : "Worse by";
  return `${prefix} ${Math.abs(diff)}`;
}

function highlightFillers(text: string, fillers: string[]) {
  if (!text || fillers.length === 0) {
    return text;
  }

  const escaped = fillers
    .filter(Boolean)
    .map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  if (escaped.length === 0) {
    return text;
  }

  const expression = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(expression);

  return parts.map((part, index) => {
    const match = fillers.some((item) => item.toLowerCase() === part.toLowerCase());
    return match ? (
      <mark
        key={`${part}-${index}`}
        className="bg-accent/15 px-1 text-accent underline decoration-wavy underline-offset-4"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
}

function SessionCard({
  title,
  session,
  accent,
}: {
  title: string;
  session: StoredSession;
  accent?: boolean;
}) {
  return (
    <div
      className={classNames(
        "border p-5 sm:p-6",
        accent ? "border-accent bg-accent/[0.06]" : "border-line bg-foreground/[0.02]",
      )}
    >
      <div className="flex items-center justify-between gap-4 border-b border-line pb-3 font-mono text-xs uppercase tracking-[0.24em] text-muted">
        <span>{title}</span>
        <span>{formatDuration(session.durationMs)}</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Metric label="Fillers" value={String(session.scores.fillerCount)} />
        <Metric label="Pace" value={`${session.scores.paceWpm} WPM`} />
        <Metric
          label="Structure"
          value={session.scores.frameworkUsed ?? "none"}
        />
        <Metric label="Vocabulary" value={session.scores.vocabularyLevel} />
      </div>
      <div className="mt-5">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          Transcript
        </p>
        <div className="mt-2 border border-line bg-background/70 p-4 font-mono text-sm leading-7 text-foreground/90">
          {highlightFillers(session.transcript || "No transcript saved.", session.scores.fillerWords)}
        </div>
      </div>
      <div className="mt-5">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
          Critique
        </p>
        <p className="mt-2 text-base leading-7 text-foreground/90">
          {session.scores.critiqueText}
        </p>
      </div>
      {session.critiqueAudioUrl ? (
        <audio className="mt-5 w-full" controls src={session.critiqueAudioUrl}>
          Your browser does not support audio playback.
        </audio>
      ) : null}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="border border-line p-3">
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.24em] text-muted">
        {label}
      </p>
      <p className="mt-2 font-display text-2xl uppercase tracking-tight">{value}</p>
      {detail ? <p className="mt-2 text-sm text-foreground/70">{detail}</p> : null}
    </div>
  );
}

function FrameworkCoach({
  prompt,
  detectedFramework,
}: {
  prompt: CoachPrompt;
  detectedFramework: StoredSession["scores"]["frameworkUsed"];
}) {
  const framework = getFrameworkRecommendation(prompt, detectedFramework);

  return (
    <div className="border border-line bg-foreground/[0.03] p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
        Next take framework
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="font-display text-3xl uppercase tracking-tight">
          {framework.name}
        </span>
        <span className="border border-line px-3 py-2 font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {framework.shortLabel}
        </span>
      </div>
      <p className="mt-4 leading-7 text-foreground/80">{framework.why}</p>
      <div className="mt-6 grid gap-3">
        {framework.steps.map((step) => (
          <div key={step} className="border border-line p-3">
            <p className="text-sm leading-6 text-foreground/85">{step}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 border border-accent/50 bg-accent/[0.06] p-4">
        <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
          Example opener
        </p>
        <p className="mt-3 text-base leading-7 text-foreground/90">
          {framework.exampleOpener}
        </p>
      </div>
      <p className="mt-5 text-sm leading-6 text-foreground/70">
        {framework.isAlreadyUsingIt
          ? "You are already circling the right framework. Clean up the wording and land each step harder."
          : framework.fallbackWhenMissing}
      </p>
    </div>
  );
}

export function BluntApp() {
  const [anonymousId] = useState<string | null>(() => getStoredAnonymousId());
  const [category, setCategory] = useState<PromptCategory>("interview");
  const [prompt, setPrompt] = useState<CoachPrompt | null>(null);
  const [promptLoading, setPromptLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(60_000);
  const [isRecording, setIsRecording] = useState(false);
  const [recordMode, setRecordMode] = useState<"first" | "redo">("first");
  const [firstSession, setFirstSession] = useState<StoredSession | null>(null);
  const [latestSession, setLatestSession] = useState<StoredSession | null>(null);
  const [redoSession, setRedoSession] = useState<StoredSession | null>(null);
  const [history, setHistory] = useState<StoredSession[]>([]);
  const [progress, setProgress] = useState<AnonymousProgress>({
    scoredTakes: 0,
    completedLoops: 0,
    lastActiveAt: null,
  });
  const [historyLoading, setHistoryLoading] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const pendingModeRef = useRef<"first" | "redo">("first");

  useEffect(() => {
    return () => {
      cleanupRecorder();
    };
  }, []);

  useEffect(() => {
    if (!anonymousId) {
      return;
    }

    void loadHistory(anonymousId);
  }, [anonymousId]);

  useEffect(() => {
    if (!latestSession?.critiqueAudioUrl) {
      return;
    }

    const audio = new Audio(latestSession.critiqueAudioUrl);
    void audio.play().catch(() => undefined);
    return () => {
      audio.pause();
    };
  }, [latestSession?.critiqueAudioUrl]);

  function cleanupRecorder() {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    recorderRef.current = null;
    chunksRef.current = [];
    setIsRecording(false);
  }

  async function loadHistory(id: string) {
    setHistoryLoading(true);
    try {
      const response = await fetch(
        `/api/session/history?anonymousId=${encodeURIComponent(id)}`,
      );
      const json = (await response.json()) as {
        sessions?: StoredSession[];
        progress?: AnonymousProgress;
      };
      if (!response.ok) {
        throw new Error("Couldn't load history");
      }

      startTransition(() => {
        setHistory(json.sessions ?? []);
        setProgress(
          json.progress ?? {
            scoredTakes: 0,
            completedLoops: 0,
            lastActiveAt: null,
          },
        );
      });
    } catch {
      // History is helpful, not critical to the loop.
    } finally {
      setHistoryLoading(false);
    }
  }

  async function fetchPrompt(nextCategory = category) {
    setPromptLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ category: nextCategory }),
      });
      const json = (await response.json()) as {
        error?: string;
        prompt?: CoachPrompt;
      };
      if (!response.ok || !json.prompt) {
        throw new Error(json.error ?? "Couldn't get a prompt");
      }

      startTransition(() => {
        setPrompt(json.prompt ?? null);
        setFirstSession(null);
        setRedoSession(null);
        setLatestSession(null);
        setRecordMode("first");
        setTimeLeftMs(60_000);
      });
      trackEvent("prompt_spun", { category: nextCategory });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Couldn't spin up a prompt. Try again.",
      );
    } finally {
      setPromptLoading(false);
    }
  }

  async function startRecording(mode: "first" | "redo") {
    if (!prompt) {
      setError("Pick a prompt first. Recording into the void is not the product.");
      return;
    }

    if (
      mode === "redo" &&
      (!firstSession || firstSession.prompt.id !== prompt.id || firstSession.status !== "scored")
    ) {
      setError("You do not get a redo before the first real take exists.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setError("This browser does not support mic recording. Use a modern one.");
      return;
    }

    setBusy(false);
    setError(null);
    setLatestSession(null);
    setRecordMode(mode);
    pendingModeRef.current = mode;
    trackEvent(mode === "first" ? "first_take_started" : "redo_started", {
      category: prompt.category,
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : undefined,
      });

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      setTimeLeftMs(60_000);
      setIsRecording(true);

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      });

      recorder.addEventListener("stop", () => {
        const durationMs = Date.now() - startedAtRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        cleanupRecorder();
        void submitRecording(blob, durationMs, pendingModeRef.current);
      });

      recorder.start();
      tickRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startedAtRef.current;
        const remaining = Math.max(0, 60_000 - elapsed);
        setTimeLeftMs(remaining);
      }, 150);
      timeoutRef.current = window.setTimeout(() => {
        stopRecording();
      }, 60_000);
    } catch {
      cleanupRecorder();
      setError("Mic access got blocked. Blunt cannot roast silence.");
    }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  }

  async function submitRecording(
    blob: Blob,
    durationMs: number,
    mode: "first" | "redo",
  ) {
    if (!prompt) {
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      const extension = blob.type.includes("mp4") ? "mp4" : "webm";
      formData.append(
        "audio",
        new File([blob], `blunt-recording.${extension}`, {
          type: blob.type || "audio/webm",
        }),
      );
      formData.append("prompt", JSON.stringify(prompt));
      formData.append("durationMs", String(durationMs));
      if (anonymousId) {
        formData.append("anonymousId", anonymousId);
      }
      if (mode === "redo" && firstSession) {
        formData.append("previousSessionId", firstSession.id);
      }

      const response = await fetch("/api/session", {
        method: "POST",
        body: formData,
      });
      const json = (await response.json()) as {
        error?: string;
        session?: StoredSession;
      };

      if (!response.ok || !json.session) {
        throw new Error(json.error ?? "Couldn't score that take");
      }

      startTransition(() => {
        setLatestSession(json.session ?? null);
        if (mode === "first" && json.session?.status === "scored") {
          setFirstSession(json.session);
          setRedoSession(null);
        }
        if (mode === "redo" && json.session?.status === "scored") {
          setRedoSession(json.session);
        }
      });
      if (json.session?.status === "scored") {
        trackEvent(mode === "first" ? "first_take_scored" : "redo_completed", {
          category: prompt.category,
          framework: json.session.scores.frameworkUsed ?? "none",
          filler_count: json.session.scores.fillerCount,
        });
        if (mode === "redo") {
          trackEvent("full_loop_completed", {
            category: prompt.category,
            first_framework: firstSession?.scores.frameworkUsed ?? "none",
            second_framework: json.session.scores.frameworkUsed ?? "none",
          });
        }
      }
      if (anonymousId) {
        void loadHistory(anonymousId);
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Couldn't score that recording. Try again.",
      );
    } finally {
      setBusy(false);
      setTimeLeftMs(60_000);
    }
  }

  const comparisonReady = Boolean(firstSession && redoSession);
  const canRedo =
    Boolean(firstSession) &&
    firstSession?.status === "scored" &&
    firstSession.prompt.id === prompt?.id;
  const frameworkPrompt = prompt ?? latestSession?.prompt ?? firstSession?.prompt ?? null;
  const detectedFramework =
    latestSession?.scores.frameworkUsed ?? firstSession?.scores.frameworkUsed ?? "none";

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#24150e,transparent_36%),linear-gradient(180deg,#0a0a0a_0%,#0e0d0b_100%)] text-foreground">
      <header className="border-b border-line px-6 py-6 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="font-display text-2xl uppercase tracking-tight"
            >
              Blunt<span className="text-accent">.</span>
            </Link>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.24em] text-muted">
              English only. Good. One less variable.
            </p>
          </div>
          <Link
            href="/"
            className="border border-line px-4 py-3 font-mono text-xs uppercase tracking-[0.24em] text-muted transition-colors hover:border-accent hover:text-foreground"
          >
            Back to landing
          </Link>
        </div>
      </header>

      <main className="px-6 py-10 sm:px-10 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <section className="border border-line bg-foreground/[0.03] p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              The loop
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.5rem,8vw,5.5rem)] uppercase leading-[0.9] tracking-tight">
              Talk.
              <br />
              Get roasted.
              <br />
              Say it better.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-foreground/85">
              No dashboard graveyard. One prompt, one take, one very specific critique,
              then the same prompt again while the advice is still fresh.
            </p>

            <div className="mt-10">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Pick a category
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {CATEGORIES.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCategory(item.value)}
                    className={classNames(
                      "cursor-pointer border p-4 text-left transition-colors",
                      category === item.value
                        ? "border-accent bg-accent/[0.08]"
                        : "border-line hover:border-accent/60",
                    )}
                  >
                    <p className="font-display text-xl uppercase tracking-tight">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-foreground/70">
                      {item.blurb}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-10 border border-line bg-background/60 p-5 sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                    Current prompt
                  </p>
                  <p className="mt-3 text-xl leading-8 text-foreground">
                    {prompt?.text ?? "Spin one up. The empty state will not save you."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchPrompt()}
                  disabled={promptLoading || busy || isRecording}
                  className="cursor-pointer bg-accent px-5 py-4 font-mono text-sm font-bold uppercase tracking-[0.22em] text-background transition-colors hover:bg-foreground disabled:cursor-wait disabled:opacity-60"
                >
                  {promptLoading ? "Spinning..." : prompt ? "New prompt" : "Spin prompt"}
                </button>
              </div>

              <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_auto_auto]">
                <div className="border border-line p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                    Timer
                  </p>
                  <p className="mt-2 font-display text-5xl uppercase tracking-tight text-accent">
                    {formatDuration(timeLeftMs)}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground/70">
                    You get 60 seconds. If you need longer than that, the answer is probably bloated.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void startRecording("first")}
                  disabled={busy || isRecording || promptLoading || !prompt}
                  className="cursor-pointer border border-line px-6 py-4 font-mono text-sm uppercase tracking-[0.22em] transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRecording && recordMode === "first" ? "Recording..." : "First take"}
                </button>
                <button
                  type="button"
                  onClick={() => void startRecording("redo")}
                  disabled={busy || isRecording || !canRedo}
                  className="cursor-pointer border border-accent px-6 py-4 font-mono text-sm uppercase tracking-[0.22em] text-accent transition-colors hover:bg-accent hover:text-background disabled:cursor-not-allowed disabled:border-line disabled:text-muted disabled:opacity-50"
                >
                  {isRecording && recordMode === "redo" ? "Recording..." : "Record again"}
                </button>
              </div>

              {isRecording ? (
                <div className="mt-4 border border-accent bg-accent/[0.07] px-4 py-3 font-mono text-sm uppercase tracking-[0.18em] text-accent">
                  Talk now. Manual stop works too, but rambling until the timer kills you is very on-brand.
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="cursor-pointer bg-foreground px-5 py-3 font-mono text-sm font-bold uppercase tracking-[0.18em] text-background"
                  >
                    Stop recording
                  </button>
                ) : null}
                {busy ? (
                  <span className="border border-line px-4 py-3 font-mono text-sm uppercase tracking-[0.18em] text-muted">
                    Transcribing, scoring, and trying not to babysit ElevenLabs...
                  </span>
                ) : null}
              </div>

              {error ? (
                <p className="mt-5 border border-accent px-4 py-3 text-sm leading-6 text-accent">
                  {error}
                </p>
              ) : null}
            </div>
          </section>

          <section className="grid gap-6">
            {frameworkPrompt ? (
              <FrameworkCoach
                prompt={frameworkPrompt}
                detectedFramework={detectedFramework}
              />
            ) : null}

            <div className="border border-line bg-foreground/[0.03] p-6 sm:p-8">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                What Blunt cares about
              </p>
              <div className="mt-5 grid gap-3">
                <Metric
                  label="Specificity"
                  value="Quoted words"
                  detail="If the critique cannot point at what you literally said, it is fluff."
                />
                <Metric
                  label="Loop"
                  value="Same prompt twice"
                  detail="No fake progress. The redo stays on the exact same question."
                />
                <Metric
                  label="Failure mode"
                  value="Never hangs"
                  detail="Short clips and voice failures still return useful feedback."
                />
              </div>
            </div>

            <div className="border border-line bg-foreground/[0.03] p-6 sm:p-8">
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Your reps
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Metric
                  label="Scored takes"
                  value={String(progress.scoredTakes)}
                  detail="Real takes that landed a score."
                />
                <Metric
                  label="Full loops"
                  value={String(progress.completedLoops)}
                  detail="Meaningful actions: critique plus redo."
                />
                <Metric
                  label="Last active"
                  value={formatLastActive(progress.lastActiveAt)}
                  detail="Anonymous by default. Still remembers your reps."
                />
              </div>
            </div>

            {latestSession ? (
              <SessionCard
                title={
                  latestSession.status === "scored"
                    ? latestSession.previousSessionId
                      ? "Latest re-record"
                      : "Latest critique"
                    : "Latest attempt"
                }
                session={latestSession}
                accent
              />
            ) : (
              <div className="border border-dashed border-line p-6 sm:p-8">
                <p className="font-display text-3xl uppercase tracking-tight">
                  No take yet
                </p>
                <p className="mt-3 leading-7 text-foreground/75">
                  Pick a prompt, hit the mic, and give Blunt something real to judge.
                </p>
              </div>
            )}
          </section>
        </div>

        {comparisonReady && firstSession && redoSession ? (
          <section className="mx-auto mt-10 max-w-6xl border border-line bg-foreground/[0.03] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
                  Before / after
                </p>
                <h2 className="mt-3 font-display text-4xl uppercase tracking-tight sm:text-5xl">
                  Same prompt. Cleaner answer.
                </h2>
              </div>
              <button
                type="button"
                onClick={() => void fetchPrompt(category)}
                disabled={busy || isRecording}
                className="cursor-pointer border border-line px-5 py-4 font-mono text-sm uppercase tracking-[0.22em] transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
              >
                Run another round
              </button>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Metric
                label="Fillers"
                value={`${firstSession.scores.fillerCount} → ${redoSession.scores.fillerCount}`}
                detail={formatDelta(
                  redoSession.scores.fillerCount,
                  firstSession.scores.fillerCount,
                )}
              />
              <Metric
                label="Pace"
                value={`${firstSession.scores.paceWpm} → ${redoSession.scores.paceWpm} WPM`}
                detail={formatDelta(
                  Math.abs(redoSession.scores.paceWpm - 145),
                  Math.abs(firstSession.scores.paceWpm - 145),
                )}
              />
              <Metric
                label="Structure"
                value={`${firstSession.scores.frameworkUsed ?? "none"} → ${redoSession.scores.frameworkUsed ?? "none"}`}
                detail={`Adherence ${firstSession.scores.frameworkAdherence} → ${redoSession.scores.frameworkAdherence}`}
              />
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-2">
              <SessionCard title="Before" session={firstSession} />
              <SessionCard title="After" session={redoSession} accent />
            </div>
          </section>
        ) : null}

        <section className="mx-auto mt-10 max-w-6xl border border-line bg-foreground/[0.03] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
                Session history
              </p>
              <h2 className="mt-3 font-display text-4xl uppercase tracking-tight sm:text-5xl">
                Your recent reps
              </h2>
            </div>
            {historyLoading ? (
              <span className="font-mono text-xs uppercase tracking-[0.24em] text-muted">
                Loading...
              </span>
            ) : null}
          </div>

          {history.length > 0 ? (
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {history.map((session) => (
                <SessionCard
                  key={session.id}
                  title={
                    session.previousSessionId ? "Re-record" : session.prompt.label
                  }
                  session={session}
                  accent={session.id === latestSession?.id}
                />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-line p-6">
              <p className="font-display text-3xl uppercase tracking-tight">
                No history yet
              </p>
              <p className="mt-3 leading-7 text-foreground/75">
                Finish a scored take and Blunt will keep your last reps around so you
                can see whether the filler is actually dying.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
