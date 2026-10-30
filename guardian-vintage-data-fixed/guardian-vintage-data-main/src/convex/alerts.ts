import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Create Alert ─────────────────────────────────────────────
export const create = mutation({
  args: {
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    employeeId: v.optional(v.id("users")),
    employeeName: v.string(),
    deviceId: v.optional(v.string()),
    eventId: v.optional(v.id("securityEvents")),
    category: v.string(),
    description: v.string(),
    assignedManager: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("alerts", {
      ...args,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

// ─── List All Alerts ──────────────────────────────────────────
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .order("desc")
      .take(args.limit ?? 100);
  },
});

// ─── List Alerts by Status ────────────────────────────────────
export const listByStatus = query({
  args: {
    status: v.union(v.literal("open"), v.literal("acknowledged"), v.literal("resolved")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("alerts")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .order("desc")
      .collect();
  },
});

// ─── Update Alert Status ──────────────────────────────────────
export const updateStatus = mutation({
  args: {
    id: v.id("alerts"),
    status: v.union(v.literal("open"), v.literal("acknowledged"), v.literal("resolved")),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status };
    if (args.resolution) updates.resolution = args.resolution;
    if (args.status === "resolved") updates.resolvedAt = Date.now();
    await ctx.db.patch(args.id, updates);
  },
});

// ─── Get Alert Stats ──────────────────────────────────────────
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.db.query("alerts").collect();
    return {
      total: alerts.length,
      open: alerts.filter((a) => a.status === "open").length,
      acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
      resolved: alerts.filter((a) => a.status === "resolved").length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      high: alerts.filter((a) => a.severity === "high").length,
    };
  },
});
