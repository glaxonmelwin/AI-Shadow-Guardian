import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// ─── Roles ────────────────────────────────────────────────────
export const ROLES = {
  MANAGER: "manager",
  EMPLOYEE: "employee",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.MANAGER),
  v.literal(ROLES.EMPLOYEE),
);
export type Role = Infer<typeof roleValidator>;

// ─── Enums ────────────────────────────────────────────────────
export const EVENT_TYPES = {
  SAFE_REQUEST: "safe_request",
  SENSITIVE_REQUEST: "sensitive_request",
  CREDENTIAL_LEAK: "credential_leak",
  PII_LEAK: "pii_leak",
  SOURCE_CODE_LEAK: "source_code_leak",
  UNAUTHORIZED_AI: "unauthorized_ai",
  POLICY_VIOLATION: "policy_violation",
  DEVICE_OFFLINE: "device_offline",
  AGENT_DISCONNECTED: "agent_disconnected",
  HARDWARE_DISCONNECTED: "hardware_disconnected",
  HARDWARE_TAMPER: "hardware_tamper",
  CLIPBOARD_EVENT: "clipboard_event",
  FILE_EVENT: "file_event",
} as const;
export const eventTypeValidator = v.union(
  ...Object.values(EVENT_TYPES).map((t) => v.literal(t)) as [any, any, ...any[]],
);

export const SEVERITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
} as const;
export const severityValidator = v.union(
  ...Object.values(SEVERITY).map((s) => v.literal(s)) as [any, any, ...any[]],
);

export const DECISION = {
  ALLOW: "allow",
  WARN: "warn",
  BLOCK: "block",
} as const;
export const decisionValidator = v.union(
  ...Object.values(DECISION).map((d) => v.literal(d)) as [any, any, ...any[]],
);

export const ALERT_STATUS = {
  OPEN: "open",
  ACKNOWLEDGED: "acknowledged",
  RESOLVED: "resolved",
} as const;
export const alertStatusValidator = v.union(
  ...Object.values(ALERT_STATUS).map((s) => v.literal(s)) as [any, any, ...any[]],
);

export const INCIDENT_STATUS = {
  OPEN: "open",
  INVESTIGATING: "investigating",
  RESOLVED: "resolved",
  FALSE_POSITIVE: "false_positive",
} as const;
export const incidentStatusValidator = v.union(
  ...Object.values(INCIDENT_STATUS).map((s) => v.literal(s)) as [any, any, ...any[]],
);

export const HARDWARE_STATE = {
  CONNECTED: "connected",
  PROTECTED: "protected",
  WARNING: "warning",
  LOCKDOWN: "lockdown",
  DISCONNECTED: "disconnected",
  TAMPERED: "tampered",
} as const;
export const hardwareStateValidator = v.union(
  ...Object.values(HARDWARE_STATE).map((s) => v.literal(s)) as [any, any, ...any[]],
);

export const DEVICE_STATUS = {
  ONLINE: "online",
  OFFLINE: "offline",
  PROTECTED: "protected",
  LOCKDOWN: "lockdown",
} as const;
export const deviceStatusValidator = v.union(
  ...Object.values(DEVICE_STATUS).map((s) => v.literal(s)) as [any, any, ...any[]],
);

// ─── Schema ───────────────────────────────────────────────────
const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
      employeeId: v.optional(v.string()),
      createdAt: v.optional(v.number()),
      // Employee's own personal key, shown to them after they sign up.
      // A manager enters this key to link/track that employee.
      trackingKey: v.optional(v.string()),
      // Set once a manager successfully enters this employee's trackingKey.
      managedBy: v.optional(v.id("users")),
    }).index("email", ["email"])
      .index("role", ["role"])
      .index("by_trackingKey", ["trackingKey"])
      .index("by_managedBy", ["managedBy"]),

    // ── Devices ────────────────────────────────────────────────
    devices: defineTable({
      deviceId: v.string(),
      employeeId: v.optional(v.id("users")),
      employeeName: v.string(),
      deviceName: v.string(),
      os: v.string(),
      agentVersion: v.string(),
      hardwareId: v.optional(v.string()),
      enrollmentDate: v.number(),
      lastHeartbeat: v.number(),
      status: deviceStatusValidator,
      protectionStatus: v.string(),
      hardwareState: hardwareStateValidator,
      isEnrolled: v.boolean(),
    }).index("by_employee", ["employeeId"])
      .index("by_deviceId", ["deviceId"])
      .index("by_status", ["status"]),

    // ── Policies ───────────────────────────────────────────────
    policies: defineTable({
      name: v.string(),
      description: v.string(),
      policyCode: v.string(),
      classification: v.string(),
      destination: v.string(),
      application: v.optional(v.string()),
      riskThreshold: severityValidator,
      action: decisionValidator,
      enabled: v.boolean(),
      createdBy: v.id("users"),
      createdAt: v.number(),
      updatedAt: v.number(),
    }).index("by_enabled", ["enabled"])
      .index("by_classification", ["classification"]),

    // ── Security Events ────────────────────────────────────────
    securityEvents: defineTable({
      eventType: eventTypeValidator,
      severity: severityValidator,
      decision: decisionValidator,
      employeeId: v.optional(v.id("users")),
      employeeName: v.string(),
      deviceId: v.optional(v.string()),
      destination: v.optional(v.string()),
      application: v.optional(v.string()),
      contentType: v.optional(v.string()),
      contentSummary: v.string(),
      riskScore: v.number(),
      classification: v.string(),
      reasons: v.array(v.string()),
      policyId: v.optional(v.id("policies")),
      timestamp: v.number(),
    }).index("by_timestamp", ["timestamp"])
      .index("by_employee", ["employeeId"])
      .index("by_severity", ["severity"])
      .index("by_decision", ["decision"])
      .index("by_eventType", ["eventType"]),

    // ── DLP Detections ─────────────────────────────────────────
    dlpDetections: defineTable({
      eventId: v.id("securityEvents"),
      detectionType: v.string(),
      confidence: v.number(),
      matchedPattern: v.string(),
      redactedValue: v.optional(v.string()),
      location: v.optional(v.string()),
    }).index("by_eventId", ["eventId"]),

    // ── Alerts ─────────────────────────────────────────────────
    alerts: defineTable({
      severity: severityValidator,
      employeeId: v.optional(v.id("users")),
      employeeName: v.string(),
      deviceId: v.optional(v.string()),
      eventId: v.optional(v.id("securityEvents")),
      category: v.string(),
      description: v.string(),
      status: alertStatusValidator,
      assignedManager: v.optional(v.id("users")),
      resolution: v.optional(v.string()),
      createdAt: v.number(),
      resolvedAt: v.optional(v.number()),
    }).index("by_status", ["status"])
      .index("by_severity", ["severity"])
      .index("by_createdAt", ["createdAt"]),

    // ── Incidents ──────────────────────────────────────────────
    incidents: defineTable({
      title: v.string(),
      description: v.string(),
      severity: severityValidator,
      status: incidentStatusValidator,
      employeeId: v.optional(v.id("users")),
      employeeName: v.string(),
      deviceId: v.optional(v.string()),
      eventId: v.optional(v.id("securityEvents")),
      alertId: v.optional(v.id("alerts")),
      assignedManager: v.optional(v.id("users")),
      notes: v.array(v.object({
        content: v.string(),
        author: v.string(),
        timestamp: v.number(),
      })),
      createdAt: v.number(),
      updatedAt: v.number(),
      resolvedAt: v.optional(v.number()),
    }).index("by_status", ["status"])
      .index("by_severity", ["severity"])
      .index("by_createdAt", ["createdAt"]),

    // ── Audit Logs ─────────────────────────────────────────────
    auditLogs: defineTable({
      action: v.string(),
      userId: v.optional(v.id("users")),
      userName: v.string(),
      details: v.string(),
      category: v.string(),
      timestamp: v.number(),
    }).index("by_timestamp", ["timestamp"])
      .index("by_userId", ["userId"])
      .index("by_category", ["category"]),

    // ── Destinations ───────────────────────────────────────────
    destinations: defineTable({
      name: v.string(),
      domain: v.string(),
      category: v.string(),
      riskLevel: severityValidator,
      action: decisionValidator,
      enabled: v.boolean(),
      createdAt: v.number(),
    }).index("by_domain", ["domain"])
      .index("by_category", ["category"]),

    // ── Reports ────────────────────────────────────────────────
    reports: defineTable({
      title: v.string(),
      type: v.string(),
      period: v.string(),
      generatedBy: v.id("users"),
      summary: v.string(),
      data: v.any(),
      createdAt: v.number(),
    }).index("by_type", ["type"])
      .index("by_createdAt", ["createdAt"]),

    // ── Hardware State ─────────────────────────────────────────
    hardwareState: defineTable({
      deviceId: v.string(),
      state: hardwareStateValidator,
      tamperDetected: v.boolean(),
      lastHeartbeat: v.number(),
      policyVersion: v.number(),
      lockdownActive: v.boolean(),
      lockdownTriggeredBy: v.optional(v.id("users")),
      lockdownReason: v.optional(v.string()),
      lockdownTime: v.optional(v.number()),
      serialPort: v.optional(v.string()),
      firmwareVersion: v.optional(v.string()),
    }).index("by_deviceId", ["deviceId"]),

    // ── Enrollment Tokens ──────────────────────────────────────
    enrollmentTokens: defineTable({
      token: v.string(),
      createdBy: v.id("users"),
      employeeId: v.optional(v.id("users")),
      used: v.boolean(),
      createdAt: v.number(),
      expiresAt: v.number(),
    }).index("by_token", ["token"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;
