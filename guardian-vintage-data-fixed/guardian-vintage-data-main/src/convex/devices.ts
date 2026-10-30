import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
// ─── Register + Enroll Device Atomically ─────────────────────
export const registerAndEnroll = mutation({
  args: {
    deviceId: v.string(),
    token: v.string(),
    employeeName: v.string(),
    deviceName: v.string(),
    os: v.string(),
    agentVersion: v.string(),
    hardwareId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Validate the enrollment token BEFORE creating a device.
    const enrollmentToken = await ctx.db
      .query("enrollmentTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (
      !enrollmentToken ||
      enrollmentToken.used ||
      enrollmentToken.expiresAt < Date.now()
    ) {
      throw new Error("Invalid or expired enrollment token");
    }

    // Find an existing device with this hardware/device ID.
    const existing = await ctx.db
      .query("devices")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();

    let deviceId;

    if (existing) {
      await ctx.db.patch(existing._id, {
        employeeId: enrollmentToken.employeeId,
        employeeName: args.employeeName,
        deviceName: args.deviceName,
        os: args.os,
        agentVersion: args.agentVersion,
        hardwareId: args.hardwareId,
        enrollmentDate: existing.enrollmentDate,
        lastHeartbeat: Date.now(),
        status: "online",
        protectionStatus: "active",
        isEnrolled: true,
      });

      deviceId = existing._id;
    } else {
      deviceId = await ctx.db.insert("devices", {
        deviceId: args.deviceId,
        employeeId: enrollmentToken.employeeId,
        employeeName: args.employeeName,
        deviceName: args.deviceName,
        os: args.os,
        agentVersion: args.agentVersion,
        hardwareId: args.hardwareId,
        enrollmentDate: Date.now(),
        lastHeartbeat: Date.now(),
        status: "online",
        protectionStatus: "active",
        hardwareState: "disconnected",
        isEnrolled: true,
      });
    }

    // Consume the token only after the device was successfully linked.
    await ctx.db.patch(enrollmentToken._id, {
      used: true,
    });

    return deviceId;
  },
});
// ─── Create Device ────────────────────────────────────────────
export const create = mutation({
  args: {
    deviceId: v.string(),
    employeeId: v.optional(v.id("users")),
    employeeName: v.string(),
    deviceName: v.string(),
    os: v.string(),
    agentVersion: v.string(),
    hardwareId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db.insert("devices", {
      ...args,
      enrollmentDate: Date.now(),
      lastHeartbeat: Date.now(),
      status: "offline",
      protectionStatus: "pending",
      hardwareState: "disconnected",
      isEnrolled: false,
    });
    return device;
  },
});

// ─── Enroll Device ────────────────────────────────────────────
export const enroll = mutation({
  args: {
    deviceId: v.string(),
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const enrollmentToken = await ctx.db
      .query("enrollmentTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!enrollmentToken || enrollmentToken.used || enrollmentToken.expiresAt < Date.now()) {
      throw new Error("Invalid or expired enrollment token");
    }

    await ctx.db.patch(enrollmentToken._id, { used: true });

    const devices = await ctx.db
      .query("devices")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();

    if (devices) {
      await ctx.db.patch(devices._id, {
        isEnrolled: true,
        status: "online",
        protectionStatus: "active",
        lastHeartbeat: Date.now(),
        employeeId: enrollmentToken.employeeId,
      });
      return devices._id;
    }
    return null;
  },
});

// ─── Update Heartbeat ─────────────────────────────────────────
export const heartbeat = mutation({
  args: { deviceId: v.string() },
  handler: async (ctx, args) => {
    const device = await ctx.db
      .query("devices")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    if (device && device.isEnrolled && device.employeeId) {
      await ctx.db.patch(device._id, {
        lastHeartbeat: Date.now(),
        status: "online",
      });
    }
  },
});

// ─── Update Device Status ─────────────────────────────────────
export const updateStatus = mutation({
  args: {
    deviceId: v.string(),
    status: v.union(v.literal("online"), v.literal("offline"), v.literal("protected"), v.literal("lockdown")),
  },
  handler: async (ctx, args) => {
    const device = await ctx.db
      .query("devices")
      .withIndex("by_deviceId", (q) => q.eq("deviceId", args.deviceId))
      .first();
    if (device) {
      await ctx.db.patch(device._id, { status: args.status });
    }
  },
});

// ─── Get All Devices ──────────────────────────────────────────
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("devices").order("desc").collect();
  },
});

// ─── Get Devices by Employee ──────────────────────────────────
export const getByEmployee = query({
  args: { employeeId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("devices")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .collect();
  },
});

// ─── Get Device Stats ─────────────────────────────────────────
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const devices = await ctx.db.query("devices").collect();
    const now = Date.now();
    const fiveMinAgo = now - 5 * 60 * 1000;
    return {
      total: devices.length,
      online: devices.filter((d) => d.status === "online" && d.lastHeartbeat > fiveMinAgo).length,
      protected: devices.filter((d) => d.protectionStatus === "active").length,
      offline: devices.filter((d) => d.status === "offline" || d.lastHeartbeat <= fiveMinAgo).length,
      lockdown: devices.filter((d) => d.status === "lockdown").length,
    };
  },
});

// ─── Delete Device ────────────────────────────────────────────
export const remove = mutation({
  args: { id: v.id("devices") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
