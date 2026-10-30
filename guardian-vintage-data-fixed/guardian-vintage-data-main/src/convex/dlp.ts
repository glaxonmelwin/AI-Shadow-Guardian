import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";

// ─── Secret Detection Patterns ────────────────────────────────
const SECRET_PATTERNS: Array<{ type: string; regex: RegExp; confidence: number }> = [
  { type: "API_KEY", regex: /(?:api[_-]?key|apikey)\s*[:=]\s*['"]?\w{20,}['"]?/gi, confidence: 0.9 },
  { type: "AWS_SECRET_KEY", regex: /(?:aws[_-]?secret[_-]?access[_-]?key)\s*[:=]\s*['"]?[A-Za-z0-9/+=]{40}['"]?/gi, confidence: 0.95 },
  { type: "AWS_ACCESS_KEY", regex: /(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}/g, confidence: 0.95 },
  { type: "GITHUB_TOKEN", regex: /ghp_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{82}/g, confidence: 0.95 },
  { type: "OPENAI_KEY", regex: /sk-[A-Za-z0-9]{32,}/g, confidence: 0.95 },
  { type: "STRIPE_KEY", regex: /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{24,}/g, confidence: 0.95 },
  { type: "JWT_TOKEN", regex: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]+/g, confidence: 0.9 },
  { type: "PRIVATE_KEY", regex: /-----BEGIN\s(?:RSA\s)?PRIVATE\sKEY-----/g, confidence: 0.98 },
  { type: "BEARER_TOKEN", regex: /Bearer\s+[A-Za-z0-9_\-\.]{20,}/gi, confidence: 0.85 },
  { type: "DATABASE_URL", regex: /(?:postgres|mysql|mongodb):\/\/[^\s'"]+/gi, confidence: 0.9 },
  { type: "CONNECTION_STRING", regex: /(?:Server|Data Source)\s*=\s*[^\s;]+/gi, confidence: 0.85 },
  { type: "PASSWORD_ASSIGNMENT", regex: /(?:password|passwd|pwd)\s*[:=]\s*['"]?[^\s'"]{6,}['"]?/gi, confidence: 0.8 },
  { type: "AUTH_HEADER", regex: /Authorization\s*:\s*(?:Basic|Bearer|Token)\s+[A-Za-z0-9_\-\.]+/gi, confidence: 0.85 },
];

// ─── PII Detection Patterns ───────────────────────────────────
const PII_PATTERNS: Array<{ type: string; regex: RegExp; confidence: number }> = [
  { type: "EMAIL", regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, confidence: 0.9 },
  { type: "PHONE_US", regex: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, confidence: 0.75 },
  { type: "SSN", regex: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/g, confidence: 0.85 },
  { type: "CREDIT_CARD", regex: /\b(?:\d{4}[-.\s]?){3}\d{4}\b/g, confidence: 0.7 },
  { type: "IP_ADDRESS", regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, confidence: 0.6 },
  { type: "PASSPORT", regex: /\b[A-Z]{1,2}\d{6,9}\b/g, confidence: 0.5 },
];

// ─── Source Code Indicators ───────────────────────────────────
const SOURCE_CODE_PATTERNS: Array<{ type: string; regex: RegExp; confidence: number }> = [
  { type: "FUNCTION_DEF", regex: /(?:function|def|class|interface|struct|enum)\s+\w+/g, confidence: 0.6 },
  { type: "IMPORT_STATEMENT", regex: /(?:import|from|require)\s+[\w./]+/g, confidence: 0.5 },
  { type: "API_ENDPOINT", regex: /(?:app\.(get|post|put|delete)|@(Get|Post|Put|Delete)Mapping|router\.(get|post|put|delete))/g, confidence: 0.7 },
  { type: "SQL_QUERY", regex: /(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP)\s+(?:TABLE|FROM|INTO|SET)/gi, confidence: 0.8 },
  { type: "HARDCODED_SECRET", regex: /(?:const|let|var)\s+(?:\w*(?:key|secret|token|password|credential)\w*)\s*=\s*['"][^'"]+['"]/gi, confidence: 0.9 },
];

// ─── Company Keyword Detection ────────────────────────────────
const DEFAULT_KEYWORDS = [
  "proprietary", "confidential", "internal only", "trade secret",
  "do not share", "nda required", "classified", "restricted",
  "board meeting", "merger", "acquisition", "ip portfolio",
  "source code", "algorithm", "unreleased", "under wraps",
];

function redactValue(value: string): string {
  if (value.length <= 4) return "****";
  return value.substring(0, 2) + "*".repeat(Math.min(value.length - 4, 16)) + value.substring(value.length - 2);
}

export function analyzeContent(
  content: string,
  keywords: string[] = DEFAULT_KEYWORDS,
): {
  riskScore: number;
  classification: string;
  decision: "allow" | "warn" | "block";
  detections: Array<{
    type: string;
    category: string;
    confidence: number;
    matchedPattern: string;
    redactedValue?: string;
  }>;
  reasons: string[];
} {
  const detections: Array<{
    type: string;
    category: string;
    confidence: number;
    matchedPattern: string;
    redactedValue?: string;
  }> = [];
  const reasons: string[] = [];
  let maxConfidence = 0;

  // Check secrets
  for (const pattern of SECRET_PATTERNS) {
    const matches = content.match(pattern.regex);
    if (matches) {
      for (const match of matches) {
        detections.push({
          type: pattern.type,
          category: "secret",
          confidence: pattern.confidence,
          matchedPattern: redactValue(match),
          redactedValue: redactValue(match),
        });
        maxConfidence = Math.max(maxConfidence, pattern.confidence);
        reasons.push(`${pattern.type} detected`);
      }
    }
  }

  // Check PII
  for (const pattern of PII_PATTERNS) {
    const matches = content.match(pattern.regex);
    if (matches) {
      for (const match of matches) {
        detections.push({
          type: pattern.type,
          category: "pii",
          confidence: pattern.confidence,
          matchedPattern: redactValue(match),
          redactedValue: redactValue(match),
        });
        maxConfidence = Math.max(maxConfidence, pattern.confidence);
        reasons.push(`${pattern.type} PII detected`);
      }
    }
  }

  // Check source code
  for (const pattern of SOURCE_CODE_PATTERNS) {
    const matches = content.match(pattern.regex);
    if (matches && matches.length >= 3) {
      detections.push({
        type: pattern.type,
        category: "source_code",
        confidence: pattern.confidence,
        matchedPattern: `${matches.length} instances detected`,
      });
      maxConfidence = Math.max(maxConfidence, pattern.confidence);
      reasons.push(`Source code patterns detected (${matches.length} instances)`);
    }
  }

  // Check keywords
  const lowerContent = content.toLowerCase();
  for (const keyword of keywords) {
    if (lowerContent.includes(keyword.toLowerCase())) {
      detections.push({
        type: "SENSITIVE_KEYWORD",
        category: "keyword",
        confidence: 0.7,
        matchedPattern: `"${keyword}"`,
      });
      maxConfidence = Math.max(maxConfidence, 0.7);
      reasons.push(`Confidential keyword: "${keyword}"`);
    }
  }

  // Calculate risk score
  const secretDetections = detections.filter((d) => d.category === "secret");
  const piiDetections = detections.filter((d) => d.category === "pii");
  const codeDetections = detections.filter((d) => d.category === "source_code");

  let riskScore = maxConfidence * 100;
  if (secretDetections.length > 0) riskScore = Math.max(riskScore, 85);
  if (codeDetections.length >= 2) riskScore = Math.max(riskScore, 70);
  if (piiDetections.length >= 3) riskScore = Math.max(riskScore, 60);

  // Determine classification
  let classification = "SAFE";
  if (riskScore >= 85) classification = "CRITICAL";
  else if (riskScore >= 70) classification = "CONFIDENTIAL";
  else if (riskScore >= 50) classification = "SENSITIVE";
  else if (riskScore >= 30) classification = "INTERNAL";
  else if (detections.length > 0) classification = "GENERAL";

  // Determine decision
  let decision: "allow" | "warn" | "block" = "allow";
  if (riskScore >= 70) decision = "block";
  else if (riskScore >= 40) decision = "warn";

  // Deduplicate reasons
  const uniqueReasons = [...new Set(reasons)].slice(0, 5);

  return {
    riskScore: Math.min(riskScore, 100),
    classification,
    decision,
    detections,
    reasons: uniqueReasons.length > 0 ? uniqueReasons : ["Content appears safe"],
  };
}

// ─── Convex Action: Analyze content from agent/API ────────────
export const analyzeContentAction = action({
  args: {
    content: v.string(),
    destination: v.optional(v.string()),
    application: v.optional(v.string()),
    deviceId: v.optional(v.string()),
    employeeId: v.optional(v.id("users")),
    employeeName: v.string(),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const result = analyzeContent(args.content);
    return result;
  },
});

// ─── Convex Mutation: Record a security event ─────────────────
export const recordSecurityEvent = mutation({
  args: {
    eventType: v.union(
      v.literal("safe_request"), v.literal("sensitive_request"), v.literal("credential_leak"),
      v.literal("pii_leak"), v.literal("source_code_leak"), v.literal("unauthorized_ai"),
      v.literal("policy_violation"), v.literal("device_offline"), v.literal("agent_disconnected"),
      v.literal("hardware_disconnected"), v.literal("hardware_tamper"), v.literal("clipboard_event"),
      v.literal("file_event"),
    ),
    severity: v.union(
      v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"),
    ),
    decision: v.union(
      v.literal("allow"), v.literal("warn"), v.literal("block"),
    ),
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
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("securityEvents", {
      ...args,
      timestamp: Date.now(),
    });
    return eventId;
  },
});

// ─── Query: Get recent events ─────────────────────────────────
export const getRecentEvents = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("securityEvents")
      .order("desc")
      .take(limit);
  },
});

// ─── Query: Get events by employee ────────────────────────────
export const getEventsByEmployee = query({
  args: { employeeId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return await ctx.db
      .query("securityEvents")
      .withIndex("by_employee", (q) => q.eq("employeeId", args.employeeId))
      .order("desc")
      .take(limit);
  },
});

// ─── Query: Get event stats ───────────────────────────────────
export const getEventStats = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

    const allEvents = await ctx.db.query("securityEvents").order("desc").take(1000);

    const todayEvents = allEvents.filter((e) => e.timestamp > dayAgo);
    const weekEvents = allEvents.filter((e) => e.timestamp > weekAgo);

    return {
      total: allEvents.length,
      today: todayEvents.length,
      thisWeek: weekEvents.length,
      blocked: allEvents.filter((e) => e.decision === "block").length,
      warned: allEvents.filter((e) => e.decision === "warn").length,
      allowed: allEvents.filter((e) => e.decision === "allow").length,
      critical: allEvents.filter((e) => e.severity === "critical").length,
      high: allEvents.filter((e) => e.severity === "high").length,
      medium: allEvents.filter((e) => e.severity === "medium").length,
      low: allEvents.filter((e) => e.severity === "low").length,
      byType: Object.entries(
        allEvents.reduce((acc, e) => {
          acc[e.eventType] = (acc[e.eventType] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
      ),
      byDecision: [
        { name: "Allowed", value: allEvents.filter((e) => e.decision === "allow").length, color: "#6b8e5a" },
        { name: "Warned", value: allEvents.filter((e) => e.decision === "warn").length, color: "#c4943e" },
        { name: "Blocked", value: allEvents.filter((e) => e.decision === "block").length, color: "#8b4513" },
      ],
    };
  },
});
