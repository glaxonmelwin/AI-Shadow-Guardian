import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Create Incident ──────────────────────────────────────────
export const create = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    employeeId: v.optional(v.id("users")),
    employeeName: v.string(),
    deviceId: v.optional(v.string()),
    eventId: v.optional(v.id("securityEvents")),
    alertId: v.optional(v.id("alerts")),
    assignedManager: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("incidents", {
      ...args,
      status: "open",
      notes: [],
      createdAt: now,
      updatedAt: now,
    });
  },
});

// ─── List Incidents ───────────────────────────────────────────
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("incidents")
      .order("desc")
      .take(args.limit ?? 100);
  },
});

// ─── Update Incident Status ───────────────────────────────────
export const updateStatus = mutation({
  args: {
    id: v.id("incidents"),
    status: v.union(v.literal("open"), v.literal("investigating"), v.literal("resolved"), v.literal("false_positive")),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { status: args.status, updatedAt: Date.now() };
    if (args.status === "resolved" || args.status === "false_positive") {
      updates.resolvedAt = Date.now();
    }
    await ctx.db.patch(args.id, updates);
  },
});

// ─── Add Note to Incident ─────────────────────────────────────
export const addNote = mutation({
  args: {
    id: v.id("incidents"),
    content: v.string(),
    author: v.string(),
  },
  handler: async (ctx, args) => {
    const incident = await ctx.db.get(args.id);
    if (incident) {
      const notes = [
        ...incident.notes,
        { content: args.content, author: args.author, timestamp: Date.now() },
      ];
      await ctx.db.patch(args.id, { notes, updatedAt: Date.now() });
    }
  },
});

// ─── Get Incident Stats ───────────────────────────────────────
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const incidents = await ctx.db.query("incidents").collect();
    return {
      total: incidents.length,
      open: incidents.filter((i) => i.status === "open").length,
      investigating: incidents.filter((i) => i.status === "investigating").length,
      resolved: incidents.filter((i) => i.status === "resolved").length,
      falsePositive: incidents.filter((i) => i.status === "false_positive").length,
      critical: incidents.filter((i) => i.severity === "critical").length,
      high: incidents.filter((i) => i.severity === "high").length,
    };
  },
});
