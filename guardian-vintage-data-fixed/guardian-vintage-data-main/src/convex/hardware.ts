import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Initialize Hardware State ─────────────────────────────────
export const init = mutation({
  args: {
    deviceId: v.string(),
    serialPort: v.optional(v.string()),
    firmwareVersion: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("hardwareState")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("hardwareState", {
      deviceId: args.deviceId,
      state: "connected",
      tamperDetected: false,
      lastHeartbeat: Date.now(),
      policyVersion: 1,
      lockdownActive: false,
      serialPort: args.serialPort,
      firmwareVersion: args.firmwareVersion ?? "1.0.0",
    });
  },
});

// ─── Update Heartbeat ─────────────────────────────────────────
export const heartbeat = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const hw = await ctx.db
      .query("hardwareState")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    if (hw) {
      await ctx.db.patch(hw._id, { lastHeartbeat: Date.now(), state: "connected" });
    }
  },
});

// ─── Set State ────────────────────────────────────────────────
export const setState = mutation({
  args: {
    deviceId: v.string(),
    state: v.union(
      v.literal("connected"), v.literal("protected"), v.literal("warning"),
      v.literal("lockdown"), v.literal("disconnected"), v.literal("tampered"),
    ),
  },
  handler: async (ctx, args) => {
    const hw = await ctx.db
      .query("hardwareState")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    if (hw) {
      const updates: Record<string, unknown> = { state: args.state, lastHeartbeat: Date.now() };
      if (args.state === "tampered") updates.tamperDetected = true;
      if (args.state === "lockdown") updates.lockdownActive = true;
      await ctx.db.patch(hw._id, updates);
    }
  },
});

// ─── Trigger Lockdown ─────────────────────────────────────────
export const triggerLockdown = mutation({
  args: {
    deviceId: v.string(),
    triggeredBy: v.id("users"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const hw = await ctx.db
      .query("hardwareState")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    if (hw) {
      await ctx.db.patch(hw._id, {
        state: "lockdown",
        lockdownActive: true,
        lockdownTriggeredBy: args.triggeredBy,
        lockdownReason: args.reason,
        lockdownTime: Date.now(),
      });
    }
    // Also update device status
    const device = await ctx.db
      .query("devices")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    if (device) {
      await ctx.db.patch(device._id, { status: "lockdown", hardwareState: "lockdown" });
    }
  },
});

// ─── Release Lockdown ─────────────────────────────────────────
export const releaseLockdown = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const hw = await ctx.db
      .query("hardwareState")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    if (hw) {
      await ctx.db.patch(hw._id, {
        state: "protected",
        lockdownActive: false,
        lockdownTriggeredBy: undefined,
        lockdownReason: undefined,
        lockdownTime: undefined,
      });
    }
    const device = await ctx.db
      .query("devices")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    if (device) {
      await ctx.db.patch(device._id, { status: "protected", hardwareState: "protected" });
    }
  },
});

// ─── Get All Hardware States ───────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("hardwareState").collect();
  },
});

// ─── Get Hardware by Device ────────────────────────────────────
export const getByDevice = query({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("hardwareState")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
  },
});

// ─── Simulate Tamper ──────────────────────────────────────────
export const simulateTamper = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const hw = await ctx.db
      .query("hardwareState")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    if (hw) {
      await ctx.db.patch(hw._id, {
        state: "tampered",
        tamperDetected: true,
        lastHeartbeat: Date.now(),
      });
    }
  },
});
