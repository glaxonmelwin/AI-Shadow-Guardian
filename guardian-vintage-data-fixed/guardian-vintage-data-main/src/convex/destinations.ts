import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    domain: v.string(),
    category: v.string(),
    riskLevel: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    action: v.union(v.literal("allow"), v.literal("warn"), v.literal("block")),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("destinations", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("destinations").order("desc").collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("destinations"),
    name: v.optional(v.string()),
    domain: v.optional(v.string()),
    category: v.optional(v.string()),
    riskLevel: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    action: v.optional(v.union(v.literal("allow"), v.literal("warn"), v.literal("block"))),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const remove = mutation({
  args: { id: v.id("destinations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
