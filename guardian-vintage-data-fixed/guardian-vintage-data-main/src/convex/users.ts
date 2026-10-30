import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Get Current User ─────────────────────────────────────────
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    const u = user as any;
    return {
      _id: u._id,
      name: u.name,
      image: u.image,
      email: u.email,
      role: u.role,
      isAnonymous: u.isAnonymous,
    };
  },
});

// ─── Set User Role ────────────────────────────────────────────
export const setRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("manager"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

// ─── Set My Own Role (self-service, used right after sign in) ──
export const setMyRole = mutation({
  args: {
    role: v.union(v.literal("manager"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    await ctx.db.patch(userId, { role: args.role });
  },
});

// ─── Get / Generate My Tracking Key (employee-side) ─────────────
// Every employee has a personal key. If they don't have one yet
// (e.g. accounts created before this feature), generate it on read.
export const getMyTrackingKey = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const existing = (user as any).trackingKey as string | undefined;
    if (existing) return existing;
    const key = `EMP-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    await ctx.db.patch(userId, { trackingKey: key });
    return key;
  },
});

// ─── Add / Link Employee By Key (manager-side) ───────────────────
export const addEmployeeByKey = mutation({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const managerId = await getAuthUserId(ctx);
    if (!managerId) throw new Error("Not authenticated");
    const manager = await ctx.db.get(managerId);
    if (!manager || (manager as any).role !== "manager") {
      throw new Error("Only managers can add employees");
    }

    const trimmedKey = args.key.trim();
    const employee = await ctx.db
      .query("users")
      .withIndex("by_trackingKey", (q) => q.eq("trackingKey", trimmedKey))
      .first();

    if (!employee) throw new Error("No employee found with that key");
    if ((employee as any).role !== "employee") {
      throw new Error("That key does not belong to an employee account");
    }

    await ctx.db.patch(employee._id, { managedBy: managerId });
    return { employeeId: employee._id, name: (employee as any).name, email: (employee as any).email };
  },
});

// ─── Remove Employee From My Tracking (manager-side) ─────────────
export const removeManagedEmployee = mutation({
  args: { employeeId: v.id("users") },
  handler: async (ctx, args) => {
    const managerId = await getAuthUserId(ctx);
    if (!managerId) throw new Error("Not authenticated");
    const employee = await ctx.db.get(args.employeeId);
    if (!employee || (employee as any).managedBy !== managerId) {
      throw new Error("That employee is not tracked by you");
    }
    await ctx.db.patch(args.employeeId, { managedBy: undefined });
  },
});

// ─── List Employees I (the signed-in manager) Track ──────────────
export const myEmployees = query({
  args: {},
  handler: async (ctx) => {
    const managerId = await getAuthUserId(ctx);
    if (!managerId) return [];
    return await ctx.db
      .query("users")
      .withIndex("by_managedBy", (q) => q.eq("managedBy", managerId))
      .collect();
  },
});

// ─── List Users by Role ───────────────────────────────────────
export const listByRole = query({
  args: {
    role: v.union(v.literal("manager"), v.literal("employee")),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("role", (q) => q.eq("role", args.role))
      .collect();
  },
});

// ─── List All Users ───────────────────────────────────────────
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("users").collect();
  },
});

// ─── Create Enrollment Token ──────────────────────────────────
export const createEnrollmentToken = mutation({
  args: {
    createdBy: v.id("users"),
    employeeId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const token = `ENV-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const tokenId = await ctx.db.insert("enrollmentTokens", {
      token,
      createdBy: args.createdBy,
      employeeId: args.employeeId,
      used: false,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    });
    // Return the actual token string, not just the doc ID — the caller
    // needs this to hand to the monitoring agent's config.
    return { tokenId, token };
  },
});
