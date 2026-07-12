import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  waitlist: defineTable({
    email: v.string(),
    // Where the signup came from (e.g. "landing-hero", "landing-footer"),
    // so we can see which CTA converts once traffic starts.
    source: v.optional(v.string()),
  }).index("by_email", ["email"]),
  users: defineTable({
    email: v.string(),
    isPaid: v.boolean(),
    freeSessionsUsed: v.number(),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
  sessions: defineTable({
    userId: v.optional(v.id("users")),
    anonymousId: v.optional(v.string()),
    promptId: v.string(),
    promptCategory: v.string(),
    promptLabel: v.string(),
    promptText: v.string(),
    transcript: v.string(),
    durationMs: v.number(),
    status: v.string(),
    fillerCount: v.number(),
    fillerWords: v.array(v.string()),
    frameworkUsed: v.optional(v.union(v.literal("STAR"), v.literal("PREP"), v.literal("none"))),
    frameworkAdherence: v.number(),
    paceWpm: v.number(),
    vocabularyLevel: v.string(),
    critiqueText: v.string(),
    critiqueAudioUrl: v.optional(v.string()),
    strongestQuote: v.string(),
    weakestQuote: v.string(),
    previousSessionId: v.optional(v.id("sessions")),
    createdAt: v.number(),
  })
    .index("by_anonymous_id", ["anonymousId"])
    .index("by_previous_session_id", ["previousSessionId"])
    .index("by_created_at", ["createdAt"]),
});
