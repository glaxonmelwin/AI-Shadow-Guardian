import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Record Audit Log ─────────────────────────────────────────
export const record = mutation({
  args: {
    action: v.string(),
    userId: v.optional(v.id("users")),
    userName: v.string(),
    details: v.string(),
    category: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      ...args,
      timestamp: Date.now(),
    });
  },
});

// ─── List Audit Logs ──────────────────────────────────────────
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(args.limit ?? 200);
  },
});

// ─── List by Category ─────────────────────────────────────────
export const listByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .order("desc")
      .collect();
  },
});

// ─── List by User ─────────────────────────────────────────────
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("auditLogs")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});
