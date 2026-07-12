import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  waitlist: defineTable({
    email: v.string(),
    // Where the signup came from (e.g. "landing-hero", "landing-footer"),
    // so we can see which CTA converts once traffic starts.
    source: v.optional(v.string()),
  }).index("by_email", ["email"]),
});
