import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    userId: v.optional(v.id("users")),
    promptId: v.string(),
    promptCategory: v.string(),
    promptLabel: v.string(),
    promptText: v.string(),
    transcript: v.string(),
    durationMs: v.number(),
    status: v.string(),
    fillerCount: v.number(),
    fillerWords: v.array(v.string()),
    frameworkUsed: v.optional(
      v.union(v.literal("STAR"), v.literal("PREP"), v.literal("none")),
    ),
    frameworkAdherence: v.number(),
    paceWpm: v.number(),
    vocabularyLevel: v.string(),
    critiqueText: v.string(),
    critiqueAudioUrl: v.optional(v.string()),
    strongestQuote: v.string(),
    weakestQuote: v.string(),
    previousSessionId: v.optional(v.id("sessions")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sessions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getById = query({
  args: {
    id: v.id("sessions"),
  },
  handler: async (ctx, { id }) => {
    const session = await ctx.db.get(id);
    if (!session) {
      return null;
    }

    return {
      id: session._id,
      createdAt: session.createdAt,
      prompt: {
        id: session.promptId,
        category: session.promptCategory,
        label: session.promptLabel,
        text: session.promptText,
      },
      transcript: session.transcript,
      durationMs: session.durationMs,
      status: session.status,
      critiqueAudioUrl: session.critiqueAudioUrl ?? null,
      previousSessionId: session.previousSessionId ?? null,
      scores: {
        fillerCount: session.fillerCount,
        fillerWords: session.fillerWords,
        frameworkUsed: session.frameworkUsed ?? null,
        frameworkAdherence: session.frameworkAdherence,
        paceWpm: session.paceWpm,
        vocabularyLevel: session.vocabularyLevel,
        critiqueText: session.critiqueText,
        strongestQuote: session.strongestQuote,
        weakestQuote: session.weakestQuote,
      },
    };
  },
});
