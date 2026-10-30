import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Create Policy ────────────────────────────────────────────
export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    policyCode: v.string(),
    classification: v.string(),
    destination: v.string(),
    application: v.optional(v.string()),
    riskThreshold: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    action: v.union(v.literal("allow"), v.literal("warn"), v.literal("block")),
    enabled: v.boolean(),
    createdBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const policyId = await ctx.db.insert("policies", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
    return policyId;
  },
});

// ─── Update Policy ────────────────────────────────────────────
export const update = mutation({
  args: {
    id: v.id("policies"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    classification: v.optional(v.string()),
    destination: v.optional(v.string()),
    application: v.optional(v.string()),
    riskThreshold: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    action: v.optional(v.union(v.literal("allow"), v.literal("warn"), v.literal("block"))),
    enabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, { ...updates, updatedAt: Date.now() });
  },
});

// ─── Delete Policy ────────────────────────────────────────────
export const remove = mutation({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// ─── Get All Policies ─────────────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("policies").order("desc").collect();
  },
});

// ─── Get Enabled Policies ─────────────────────────────────────
export const listEnabled = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("policies")
      .withIndex("by_enabled", (q) => q.eq("enabled", true))
      .collect();
  },
});

// ─── Get Policy by ID ─────────────────────────────────────────
export const get = query({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Toggle Policy ────────────────────────────────────────────
export const toggle = mutation({
  args: { id: v.id("policies") },
  handler: async (ctx, args) => {
    const policy = await ctx.db.get(args.id);
    if (policy) {
      await ctx.db.patch(args.id, { enabled: !policy.enabled, updatedAt: Date.now() });
    }
  },
});
