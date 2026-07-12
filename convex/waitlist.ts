import { v } from "convex/values";
import { internalMutation, internalQuery, mutation } from "./_generated/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const join = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
  },
  handler: async (ctx, { email, source }) => {
    const normalized = email.trim().toLowerCase();
    if (!EMAIL_RE.test(normalized) || normalized.length > 254) {
      throw new Error("Invalid email address");
    }
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();
    if (existing) {
      return { already: true as const };
    }
    await ctx.db.insert("waitlist", { email: normalized, source });
    return { already: false as const };
  },
});

// Internal-only: run via `npx convex run waitlist:list` / `waitlist:count`.
// Never expose these as public queries — they would leak the email list to
// anyone holding the deployment URL.
export const list = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("waitlist").order("desc").collect();
  },
});

// Internal-only admin cleanup: `npx convex run waitlist:remove '{"email":"..."}'`.
export const remove = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const normalized = email.trim().toLowerCase();
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();
    if (!existing) {
      return { removed: false as const };
    }
    await ctx.db.delete(existing._id);
    return { removed: true as const };
  },
});

export const count = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("waitlist").collect();
    return rows.length;
  },
});
