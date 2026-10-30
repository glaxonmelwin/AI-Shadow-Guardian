import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ─── Generate Report ──────────────────────────────────────────
export const generate = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    period: v.string(),
    generatedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let startTime = 0;
    if (args.period === "daily") startTime = now - 24 * 60 * 60 * 1000;
    else if (args.period === "weekly") startTime = now - 7 * 24 * 60 * 60 * 1000;
    else if (args.period === "monthly") startTime = now - 30 * 24 * 60 * 60 * 1000;

    const events = await ctx.db.query("securityEvents").collect();
    const periodEvents = events.filter((e) => e.timestamp >= startTime);
    const devices = await ctx.db.query("devices").collect();
    const incidents = await ctx.db.query("incidents").collect();
    const alerts = await ctx.db.query("alerts").collect();

    const allowed = periodEvents.filter((e) => e.decision === "allow").length;
    const warned = periodEvents.filter((e) => e.decision === "warn").length;
    const blocked = periodEvents.filter((e) => e.decision === "block").length;
    const critical = periodEvents.filter((e) => e.severity === "critical").length;
    const high = periodEvents.filter((e) => e.severity === "high").length;

    const destCounts: Record<string, number> = {};
    periodEvents.forEach((e) => {
      if (e.destination) destCounts[e.destination] = (destCounts[e.destination] || 0) + 1;
    });
    const topDestinations = Object.entries(destCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

    const polCounts: Record<string, number> = {};
    periodEvents.forEach((e) => {
      if (e.classification) polCounts[e.classification] = (polCounts[e.classification] || 0) + 1;
    });
    const topClassifications = Object.entries(polCounts).sort(([, a], [, b]) => b - a).slice(0, 5);

    const data = {
      events: { total: periodEvents.length, allowed, warned, blocked, critical, high },
      devices: { total: devices.length, online: devices.filter((d) => d.status === "online").length, protected: devices.filter((d) => d.protectionStatus === "active").length },
      incidents: { total: incidents.length, open: incidents.filter((i) => i.status === "open").length, resolved: incidents.filter((i) => i.status === "resolved").length },
      alerts: { total: alerts.length, open: alerts.filter((a) => a.status === "open").length },
      topDestinations,
      topClassifications,
    };

    let summary = `During this ${args.period} period, ${periodEvents.length} security events were detected across ${devices.length} enrolled devices. `;
    if (blocked > 0) summary += `${blocked} requests were automatically blocked. `;
    if (warned > 0) summary += `${warned} requests triggered warnings. `;
    if (critical > 0) summary += `${critical} events were classified as critical severity. `;
    if (blocked === 0 && warned === 0) summary += "No security violations were detected during this period. ";
    summary += `The security posture remains ${critical === 0 && high < 3 ? "strong" : "requires attention"}.`;

    const reportId = await ctx.db.insert("reports", {
      title: args.title, type: args.type, period: args.period,
      generatedBy: args.generatedBy, summary, data, createdAt: Date.now(),
    });
    return { reportId, summary, data };
  },
});

// ─── List Reports ─────────────────────────────────────────────
export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db.query("reports").order("desc").take(args.limit ?? 50);
  },
});

// ─── Get Report ───────────────────────────────────────────────
export const get = query({
  args: { id: v.id("reports") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// ─── Get Dashboard Stats ──────────────────────────────────────
export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;

    const devices = await ctx.db.query("devices").collect();
    const events = await ctx.db.query("securityEvents").collect();
    const alerts = await ctx.db.query("alerts").collect();
    const incidents = await ctx.db.query("incidents").collect();

    const todayEvents = events.filter((e) => e.timestamp > dayAgo);

    const hourlyData = Array.from({ length: 24 }, (_, i) => {
      const hourStart = dayAgo + i * 60 * 60 * 1000;
      const hourEnd = hourStart + 60 * 60 * 1000;
      const hourEvents = todayEvents.filter((e) => e.timestamp >= hourStart && e.timestamp < hourEnd);
      return {
        hour: new Date(hourStart).toLocaleTimeString("en-US", { hour: "2-digit", hour12: false }),
        allowed: hourEvents.filter((e) => e.decision === "allow").length,
        warned: hourEvents.filter((e) => e.decision === "warn").length,
        blocked: hourEvents.filter((e) => e.decision === "block").length,
      };
    });

    const riskDistribution = [
      { name: "Low", value: events.filter((e) => e.severity === "low").length, color: "#6b8e5a" },
      { name: "Medium", value: events.filter((e) => e.severity === "medium").length, color: "#c4943e" },
      { name: "High", value: events.filter((e) => e.severity === "high").length, color: "#a0522d" },
      { name: "Critical", value: events.filter((e) => e.severity === "critical").length, color: "#6b2f0a" },
    ];

    const typeCounts: Record<string, number> = {};
    events.forEach((e) => { typeCounts[e.eventType] = (typeCounts[e.eventType] || 0) + 1; });
    const topViolations = Object.entries(typeCounts).sort(([, a], [, b]) => b - a).slice(0, 5).map(([type, count]) => ({ type, count }));

    return {
      totalDevices: devices.length,
      onlineDevices: devices.filter((d) => d.status === "online").length,
      protectedDevices: devices.filter((d) => d.protectionStatus === "active").length,
      totalEvents: events.length,
      todayEvents: todayEvents.length,
      allowedRequests: events.filter((e) => e.decision === "allow").length,
      warnedRequests: events.filter((e) => e.decision === "warn").length,
      blockedRequests: events.filter((e) => e.decision === "block").length,
      highRiskEvents: events.filter((e) => e.severity === "high" || e.severity === "critical").length,
      criticalIncidents: incidents.filter((i) => i.severity === "critical").length,
      openAlerts: alerts.filter((a) => a.status === "open").length,
      openIncidents: incidents.filter((i) => i.status === "open").length,
      hourlyData,
      riskDistribution,
      topViolations,
      byDecision: [
        { name: "Allowed", value: events.filter((e) => e.decision === "allow").length },
        { name: "Warned", value: events.filter((e) => e.decision === "warn").length },
        { name: "Blocked", value: events.filter((e) => e.decision === "block").length },
      ],
    };
  },
});
