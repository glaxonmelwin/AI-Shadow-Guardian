// AI Shadow Guardian — real endpoint agent
//
// This agent:
//   - Enrolls the endpoint with Convex.
//   - Sends a heartbeat every POLL_INTERVAL_SECONDS.
//   - Scans the OS clipboard for DLP violations.
//   - Reports flagged clipboard events to Convex.
//   - Runs the local network monitor on 127.0.0.1:8888.
//   - Refreshes manager-configured AI destinations periodically.
//   - Reports AI-service access attempts to Convex.
//   - Displays visible OS notifications that monitoring is active.
//
// IMPORTANT:
// The user of this device must be informed that clipboard and
// AI/network traffic are monitored according to the organization's
// monitoring policy.
//
// HTTPS traffic is NOT decrypted. The network monitor can see the
// destination hostname during HTTPS CONNECT and can block configured
// AI domains at that point.

import "dotenv/config";

import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";

import clipboard from "clipboardy";
import notifier from "node-notifier";
import nodeMachineId from "node-machine-id";

import {
  startNetworkMonitor,
  mergeDestinations,
  buildSecurityEventArgs,
} from "./network-monitor.mjs";

import {
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";

import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";

const { machineIdSync } = nodeMachineId;

// ─────────────────────────────────────────────────────────────
// PATHS
// ─────────────────────────────────────────────────────────────

const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);

const STATE_PATH = path.join(
  __dirname,
  ".device-state.json"
);

// ─────────────────────────────────────────────────────────────
// ENVIRONMENT
// ─────────────────────────────────────────────────────────────

const CONVEX_URL = process.env.CONVEX_URL;

const ENROLLMENT_TOKEN =
  process.env.ENROLLMENT_TOKEN;

const DEVICE_NAME =
  process.env.DEVICE_NAME || os.hostname();

const POLL_MS =
  Number(
    process.env.POLL_INTERVAL_SECONDS || 8
  ) * 1000;

const NOTIFY_EVERY_N_POLLS = Math.max(
  1,
  Math.round((15 * 60 * 1000) / POLL_MS)
);

const NETWORK_MONITOR_PORT =
  Number(
    process.env.NETWORK_MONITOR_PORT || 8888
  );

const NETWORK_MONITOR_ENABLED =
  process.env.NETWORK_MONITOR_ENABLED !== "false";

const DESTINATIONS_REFRESH_MS =
  5 * 60 * 1000;

// ─────────────────────────────────────────────────────────────
// VALIDATION
// ─────────────────────────────────────────────────────────────

if (!CONVEX_URL) {
  console.error(
    "Missing CONVEX_URL in agent/.env — see .env.example."
  );

  process.exit(1);
}

const client = new ConvexHttpClient(
  CONVEX_URL
);

// ─────────────────────────────────────────────────────────────
// DEVICE STATE
// ─────────────────────────────────────────────────────────────

function loadState() {
  if (!existsSync(STATE_PATH)) {
    return null;
  }

  try {
    return JSON.parse(
      readFileSync(
        STATE_PATH,
        "utf-8"
      )
    );
  } catch {
    return null;
  }
}

function saveState(state) {
  writeFileSync(
    STATE_PATH,
    JSON.stringify(state, null, 2)
  );
}

// ─────────────────────────────────────────────────────────────
// USER NOTIFICATION
// ─────────────────────────────────────────────────────────────

function notifyMonitoringActive() {
  const message =
    NETWORK_MONITOR_ENABLED
      ? "This device is being monitored for data-loss prevention (clipboard scanning + AI-service network traffic). Contact IT with questions."
      : "This device is being monitored for data-loss prevention (clipboard scanning). Contact IT with questions.";

  try {
    notifier.notify({
      title: "AI Shadow Guardian",
      message,
      sound: false,
      wait: false,
    });
  } catch (err) {
    console.error(
      "Monitoring notification failed:",
      err?.message || err
    );
  }
}

// ─────────────────────────────────────────────────────────────
// ENROLLMENT
// ─────────────────────────────────────────────────────────────

async function ensureEnrolled() {
  let state = loadState();

  // Already enrolled locally.
  if (
    state?.deviceId &&
    state?.enrolled
  ) {
    console.log(
      `Existing enrollment found for device ${state.deviceId}.`
    );

    return state;
  }

  if (!ENROLLMENT_TOKEN) {
    console.error(
      "No local device state found and no ENROLLMENT_TOKEN set in agent/.env. " +
        "Get a fresh one-time token from a manager on the Employees page."
    );

    process.exit(1);
  }

  const hardwareId =
    machineIdSync(true);

  const deviceId =
    state?.deviceId ||
    `AGT-${hardwareId
      .slice(0, 12)
      .toUpperCase()}`;

  console.log(
    `Registering and enrolling device ${deviceId} (${DEVICE_NAME})...`
  );

  let enrolledDeviceId;

  try {
    enrolledDeviceId =
      await client.mutation(
        anyApi.devices.registerAndEnroll,
        {
          deviceId,
          token: ENROLLMENT_TOKEN,
          employeeName: DEVICE_NAME,
          deviceName: DEVICE_NAME,
          os: `${os.platform()} ${os.release()}`,
          agentVersion: "0.1.0",
          hardwareId,
        }
      );
  } catch (err) {
    console.error(
      "Enrollment request failed:",
      err?.message || err
    );

    process.exit(1);
  }

  if (!enrolledDeviceId) {
    console.error(
      "Enrollment failed — token may be invalid, expired, or already used. " +
        "Ask your manager for a new enrollment token."
    );

    process.exit(1);
  }

  state = {
    deviceId,
    enrolled: true,
    enrolledAt: Date.now(),
  };

  saveState(state);

  console.log(
    "Enrollment successful. This device is now tracked on the dashboard."
  );

  return state;
}

// ─────────────────────────────────────────────────────────────
// CLIPBOARD DLP
// ─────────────────────────────────────────────────────────────

async function scanClipboardIfChanged(
  lastValueRef
) {
  let current;

  try {
    current = await clipboard.read();
  } catch (err) {
    console.error(
      `[${new Date().toLocaleTimeString()}] Clipboard read failed:`,
      err?.message || err
    );

    return;
  }

  if (
    !current ||
    current === lastValueRef.value
  ) {
    return;
  }

  lastValueRef.value = current;

  console.log(
    `[${new Date().toLocaleTimeString()}] Clipboard changed: ${current
      .replace(/\s+/g, " ")
      .slice(0, 120)}`
  );

  // Ignore extremely short clipboard values.
  if (
    current.trim().length < 8
  ) {
    console.log(
      `[${new Date().toLocaleTimeString()}] Clipboard content too short to scan.`
    );

    return;
  }

  let result;

  try {
    result =
      await client.action(
        anyApi.dlp.analyzeContentAction,
        {
          content: current,
          employeeName: DEVICE_NAME,
          contentType: "clipboard",
        }
      );
  } catch (err) {
    console.error(
      `[${new Date().toLocaleTimeString()}] Clipboard DLP analysis failed:`,
      err?.message || err
    );

    return;
  }

  const detections =
    result.detections || [];

  console.log(
    `[${new Date().toLocaleTimeString()}] DLP result: decision=${result.decision}, score=${result.riskScore}, detections=${detections.length}`
  );

  // Normal clipboard content.
  if (
    result.decision === "allow" &&
    detections.length === 0
  ) {
    console.log(
      `[${new Date().toLocaleTimeString()}] Clipboard content ALLOWED, score=${result.riskScore}`
    );

    return;
  }

  const hasSecret =
    detections.some(
      (d) => d.category === "secret"
    );

  const hasPii =
    detections.some(
      (d) => d.category === "pii"
    );

  const hasCode =
    detections.some(
      (d) =>
        d.category === "source_code"
    );

  const eventType = hasSecret
    ? "credential_leak"
    : hasPii
    ? "pii_leak"
    : hasCode
    ? "source_code_leak"
    : "policy_violation";

  const severity =
    result.riskScore >= 85
      ? "critical"
      : result.riskScore >= 70
      ? "high"
      : result.riskScore >= 40
      ? "medium"
      : "low";

  const state = loadState();

  try {
    await client.mutation(
      anyApi.dlp.recordSecurityEvent,
      {
        eventType,

        severity,

        decision:
          result.decision,

        employeeName:
          DEVICE_NAME,

        deviceId:
          state?.deviceId,

        application:
          "clipboard",

        contentType:
          "clipboard",

        contentSummary:
          `Clipboard content flagged: ${result.classification} (${detections.length} detection${
            detections.length === 1
              ? ""
              : "s"
          })`,

        riskScore:
          result.riskScore,

        classification:
          result.classification,

        reasons:
          result.reasons,
      }
    );

    console.log(
      `[${new Date().toLocaleTimeString()}] Security event recorded: ${eventType}, decision=${result.decision}, score=${result.riskScore}`
    );
  } catch (err) {
    console.error(
      `[${new Date().toLocaleTimeString()}] Failed to record clipboard security event:`,
      err?.message || err
    );
  }

  console.log(
    `[${new Date().toLocaleTimeString()}] Flagged clipboard content: ${result.classification}, decision=${result.decision}, score=${result.riskScore}`
  );
}

// ─────────────────────────────────────────────────────────────
// AI DESTINATIONS
// ─────────────────────────────────────────────────────────────

let destinationsCache =
  mergeDestinations([]);

async function refreshDestinations() {
  try {
    const configured =
      await client.query(
        anyApi.destinations.list,
        {}
      );

    destinationsCache =
      mergeDestinations(
        configured || []
      );

    console.log(
      `[${new Date().toLocaleTimeString()}] AI destination policy refreshed: ${destinationsCache.length} destinations`
    );
  } catch (err) {
    console.error(
      `[${new Date().toLocaleTimeString()}] Failed to refresh AI destinations list — using cached/default list:`,
      err?.message || err
    );
  }
}

// ─────────────────────────────────────────────────────────────
// NETWORK BODY DLP
// ─────────────────────────────────────────────────────────────

async function analyzeBody(bodyStr) {
  if (!bodyStr) {
    return null;
  }

  try {
    return await client.action(
      anyApi.dlp.analyzeContentAction,
      {
        content: bodyStr,
        employeeName: DEVICE_NAME,
        contentType:
          "network_request_body",
      }
    );
  } catch (err) {
    console.error(
      "Network request body DLP failed:",
      err?.message || err
    );

    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// NETWORK MONITOR
// ─────────────────────────────────────────────────────────────

function startNetworkMonitorIfEnabled(
  state
) {
  if (!NETWORK_MONITOR_ENABLED) {
    console.log(
      "Network monitor disabled (NETWORK_MONITOR_ENABLED=false)."
    );

    return null;
  }

  console.log(
    `Starting AI network monitor on 127.0.0.1:${NETWORK_MONITOR_PORT}...`
  );

  return startNetworkMonitor({
    port:
      NETWORK_MONITOR_PORT,

    getDestinations:
      () => destinationsCache,

    analyzeBody,

    onDetection:
      async ({
        hostname,
        port,
        method,
        path,
        matched,
        dlpResult,
      }) => {
        const args =
          buildSecurityEventArgs({
            hostname,
            port,
            method,
            path,
            matched,
            dlpResult,
            employeeName:
              DEVICE_NAME,
            deviceId:
              state.deviceId,
          });

        try {
          await client.mutation(
            anyApi.dlp
              .recordSecurityEvent,
            args
          );

          console.log(
            `[${new Date().toLocaleTimeString()}] AI service detected: ${
              matched?.name ||
              hostname
            } via ${method}, decision=${args.decision}, score=${args.riskScore}`
          );
        } catch (err) {
          console.error(
            `[${new Date().toLocaleTimeString()}] Failed to record AI network security event:`,
            err?.message || err
          );
        }
      },
  });
}

// ─────────────────────────────────────────────────────────────
// HEARTBEAT
// ─────────────────────────────────────────────────────────────

async function sendHeartbeat(
  state
) {
  try {
    await client.mutation(
      anyApi.devices.heartbeat,
      {
        deviceId:
          state.deviceId,
      }
    );

    console.log(
      `[${new Date().toLocaleTimeString()}] Heartbeat OK`
    );
  } catch (err) {
    console.error(
      `[${new Date().toLocaleTimeString()}] Heartbeat failed:`,
      err?.message || err
    );
  }
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log(
    "=========================================="
  );

  console.log(
    "AI Shadow Guardian agent starting..."
  );

  console.log(
    `Device: ${DEVICE_NAME}`
  );

  console.log(
    `Poll interval: ${POLL_MS / 1000}s`
  );

  console.log(
    `Network monitor: ${
      NETWORK_MONITOR_ENABLED
        ? `enabled on 127.0.0.1:${NETWORK_MONITOR_PORT}`
        : "disabled"
    }`
  );

  console.log(
    "=========================================="
  );

  // Enrollment.
  const state =
    await ensureEnrolled();

  // Visible monitoring notification.
  notifyMonitoringActive();

  // Load manager AI policy immediately.
  await refreshDestinations();

  // Refresh policy periodically.
  setInterval(
    refreshDestinations,
    DESTINATIONS_REFRESH_MS
  );

  // Start local proxy.
  try {
    startNetworkMonitorIfEnabled(
      state
    );
  } catch (err) {
    console.error(
      "Failed to start network monitor:",
      err?.message || err
    );
  }

  const lastClipboard = {
    value: null,
  };

  let pollCount = 0;

  // ─────────────────────────────────────────────
  // HEARTBEAT + CLIPBOARD LOOP
  // ─────────────────────────────────────────────

  setInterval(
    async () => {
      pollCount++;

      await sendHeartbeat(
        state
      );

      try {
        await scanClipboardIfChanged(
          lastClipboard
        );
      } catch (err) {
        console.error(
          "Clipboard scan failed:",
          err?.message || err
        );
      }

      // Periodic visible reminder.
      if (
        pollCount %
          NOTIFY_EVERY_N_POLLS ===
        0
      ) {
        notifyMonitoringActive();
      }
    },
    POLL_MS
  );

  console.log(
    `Running. Heartbeat + clipboard scan every ${POLL_MS / 1000}s. Press Ctrl+C to stop.`
  );
}

main().catch((err) => {
  console.error(
    "Fatal agent error:",
    err?.message || err
  );

  process.exit(1);
});