
import http from "node:http";
import net from "node:net";
import { URL } from "node:url";

// ==========================================
// DEFAULT AI DESTINATIONS
// ==========================================

const AI_SERVICES = [
  ["chat.openai.com", "ChatGPT", "ai_chatbot", "high", "block"],
  ["chatgpt.com", "ChatGPT", "ai_chatbot", "high", "block"],
  ["api.openai.com", "OpenAI API", "ai_api", "critical", "block"],
  ["claude.ai", "Claude", "ai_chatbot", "high", "block"],
  ["api.anthropic.com", "Anthropic API", "ai_api", "critical", "block"],
  ["gemini.google.com", "Gemini", "ai_chatbot", "high", "block"],
  ["bard.google.com", "Bard", "ai_chatbot", "high", "block"],
  ["copilot.microsoft.com", "Copilot", "ai_chatbot", "high", "block"],
  ["perplexity.ai", "Perplexity", "ai_chatbot", "high", "block"],
  ["poe.com", "Poe", "ai_chatbot", "high", "block"],
  ["character.ai", "Character.AI", "ai_chatbot", "high", "block"],
  ["deepseek.com", "DeepSeek", "ai_chatbot", "high", "block"],
  ["chat.deepseek.com", "DeepSeek", "ai_chatbot", "high", "block"],
  ["mistral.ai", "Mistral", "ai_chatbot", "high", "block"],
  ["you.com", "You.com", "ai_chatbot", "high", "block"],
  ["grok.com", "Grok", "ai_chatbot", "high", "block"],
  ["x.ai", "xAI", "ai_chatbot", "high", "block"],
  ["huggingface.co", "Hugging Face", "ai_platform", "medium", "allow"],
  ["midjourney.com", "Midjourney", "ai_image", "medium", "allow"],
];

export const DEFAULT_AI_DESTINATIONS = AI_SERVICES.map(
  ([domain, name, category, riskLevel, action]) => ({
    domain,
    name,
    category,
    riskLevel,
    action,
  })
);

const RISK_SCORE = {
  critical: 95,
  high: 80,
  medium: 55,
  low: 25,
};

const SEVERITY_FROM_RISK = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
};

// ==========================================
// HELPERS
// ==========================================

function normalizeHost(host) {
  return String(host || "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/\.$/, "");
}

export function mergeDestinations(configured = []) {
  const byDomain = new Map(
    DEFAULT_AI_DESTINATIONS.map(d => [
      d.domain.toLowerCase(),
      { ...d },
    ])
  );

  for (const row of configured || []) {
    if (!row?.domain) continue;

    const domain = normalizeHost(row.domain);

    if (row.enabled === false) {
      byDomain.delete(domain);
      continue;
    }

    const existing = byDomain.get(domain) || {};

    byDomain.set(domain, {
      ...existing,
      ...row,
      domain,
      action: ["block", "warn", "allow"].includes(row.action)
        ? row.action
        : existing.action || "warn",
    });
  }

  return [...byDomain.values()];
}

function matchDestination(hostname, destinations) {
  const host = normalizeHost(hostname);

  return [...destinations]
    .filter(d => {
      if (!d?.domain || d.enabled === false) return false;
      const domain = normalizeHost(d.domain);
      return host === domain || host.endsWith("." + domain);
    })
    .sort(
      (a, b) =>
        normalizeHost(b.domain).length -
        normalizeHost(a.domain).length
    )[0];
}

// ==========================================
// BLOCK RESPONSES
// ==========================================

function blockHttpResponse(res, matched) {
  const name = matched?.name || matched?.domain || "AI service";

  res.writeHead(403, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "close",
  });

  res.end(`Blocked by AI Shadow Guardian: ${name}\n`);
}

function blockHttpsConnection(socket, matched) {
  const name = matched?.name || matched?.domain || "AI service";
  const body = `Blocked by AI Shadow Guardian: ${name}\n`;

  const response =
    "HTTP/1.1 403 Forbidden\r\n" +
    "Content-Type: text/plain; charset=utf-8\r\n" +
    `Content-Length: ${Buffer.byteLength(body)}\r\n` +
    "Cache-Control: no-store\r\n" +
    "Connection: close\r\n" +
    "\r\n" +
    body;

  if (!socket.destroyed) {
    socket.end(response);
  }
}

// ==========================================
// NETWORK MONITOR
// ==========================================

export function startNetworkMonitor({
  port = 8888,
  getDestinations,
  onDetection,
  analyzeBody,
}) {
  const REPORT_COOLDOWN_MS = 5 * 60 * 1000;
  const lastReported = new Map();
  const dnsErrorReported = new Set();

  const WINDOWS_CONNECTIVITY_HOSTS = new Set([
    "ipv6.msftconnecttest.com",
    "www.msftconnecttest.com",
    "www.msftncsi.com",
  ]);

  function shouldReport(hostname, force = false) {
    if (force) return true;

    const host = normalizeHost(hostname);
    const last = lastReported.get(host) || 0;

    if (Date.now() - last < REPORT_COOLDOWN_MS) {
      return false;
    }

    lastReported.set(host, Date.now());
    return true;
  }

  function currentDestinations() {
    try {
      const result = getDestinations?.();
      return Array.isArray(result)
        ? result
        : DEFAULT_AI_DESTINATIONS;
    } catch (err) {
      console.error("Failed to load destinations:", err.message);
      return DEFAULT_AI_DESTINATIONS;
    }
  }

  async function reportDetection(data) {
    if (typeof onDetection !== "function") return;

    try {
      await onDetection(data);
    } catch (err) {
      console.error(
        "Network monitor: failed to report detection:",
        err?.message || err
      );
    }
  }

  function handleSocketError(socket, label) {
    socket.on("error", err => {
      if (err.code === "ECONNRESET" || err.code === "EPIPE") {
        return;
      }

      console.error(`[${label}]`, err.message);
    });
  }

  // ========================================
  // HTTP PROXY
  // ========================================

  const server = http.createServer((req, res) => {
    let target;

    try {
      target = new URL(
        req.url,
        `http://${req.headers.host}`
      );
    } catch {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }

    if (target.protocol !== "http:") {
      res.writeHead(400);
      res.end("Unsupported proxy protocol");
      return;
    }

    const destinations = currentDestinations();
    const matched = matchDestination(
      target.hostname,
      destinations
    );

    const host = normalizeHost(target.hostname);

    if (!WINDOWS_CONNECTIVITY_HOSTS.has(host)) {
      console.log(
        `[PROXY HTTP] ${target.hostname}:${target.port || 80} => ${
          matched?.action || "no matching rule"
        }`
      );
    }

    if (matched?.action === "block") {
      console.log(
        `[${new Date().toLocaleTimeString()}] BLOCKED HTTP AI service: ${
          matched.name || target.hostname
        }`
      );

      if (shouldReport(target.hostname)) {
        void reportDetection({
          hostname: target.hostname,
          port: Number(target.port) || 80,
          method: req.method,
          path: target.pathname + target.search,
          matched,
          dlpResult: null,
        });
      }

      blockHttpResponse(res, matched);
      return;
    }

    const chunks = [];

    req.on("data", chunk => {
      chunks.push(chunk);
    });

    req.on("error", err => {
      if (err.code !== "ECONNRESET") {
        console.error("HTTP request error:", err.message);
      }

      if (!res.headersSent && !res.destroyed) {
        res.writeHead(400);
        res.end("Bad request");
      }
    });

    req.on("end", async () => {
      const bodyBuf = Buffer.concat(chunks);
      const bodyStr = bodyBuf.length
        ? bodyBuf.toString("utf-8")
        : "";

      let dlpResult = null;

      if (
        matched &&
        bodyStr &&
        typeof analyzeBody === "function"
      ) {
        try {
          dlpResult = await analyzeBody(bodyStr);
        } catch (err) {
          console.error(
            "Network monitor: body DLP failed:",
            err?.message || err
          );
        }
      }

      if (matched) {
        const forceReport = Boolean(
          dlpResult?.detections?.length
        );

        if (shouldReport(target.hostname, forceReport)) {
          await reportDetection({
            hostname: target.hostname,
            port: Number(target.port) || 80,
            method: req.method,
            path: target.pathname + target.search,
            matched,
            dlpResult,
          });
        }

        if (matched.action === "warn") {
          console.log(
            `[${new Date().toLocaleTimeString()}] WARN HTTP AI service: ${
              matched.name || target.hostname
            }`
          );
        }
      }

      if (res.destroyed) return;

      const proxyReq = http.request(
        {
          hostname: target.hostname,
          port: Number(target.port) || 80,
          path: target.pathname + target.search,
          method: req.method,
          headers: {
            ...req.headers,
            host: target.host,
          },
        },
        proxyRes => {
          res.writeHead(
            proxyRes.statusCode || 502,
            proxyRes.headers
          );

          proxyRes.pipe(res);
        }
      );

      proxyReq.on("error", err => {
        const host = normalizeHost(target.hostname);

        if (
          err.code === "ENOTFOUND" &&
          WINDOWS_CONNECTIVITY_HOSTS.has(host)
        ) {
          if (!dnsErrorReported.has(host)) {
            console.log(
              `[INFO] Windows connectivity test DNS unavailable: ${host}`
            );
            dnsErrorReported.add(host);
          }
        } else if (
          err.code !== "ECONNRESET" &&
          err.code !== "EPIPE"
        ) {
          console.error(
            "Network monitor HTTP proxy error:",
            err?.message || err
          );
        }

        if (!res.destroyed) {
          if (!res.headersSent) {
            res.writeHead(502, {
              "Content-Type": "text/plain; charset=utf-8",
            });
          }

          res.end("Bad gateway");
        }
      });

      proxyReq.end(bodyBuf);
    });
  });

  // ========================================
  // HTTPS CONNECT PROXY
  // ========================================

  server.on("connect", (req, clientSocket, head) => {
    // IMPORTANT:
    // Attach this listener immediately.
    // It prevents ECONNRESET from crashing the agent.
    handleSocketError(clientSocket, "PROXY CLIENT ERROR");

    let hostname;
    let targetPort;

    try {
      const parsed = new URL(`http://${req.url}`);
      hostname = parsed.hostname;
      targetPort = Number(parsed.port) || 443;
    } catch {
      const parts = String(req.url || "").split(":");
      hostname = parts[0];
      targetPort = Number(parts[1]) || 443;
    }

    if (!hostname) {
      clientSocket.end(
        "HTTP/1.1 400 Bad Request\r\n" +
        "Connection: close\r\n\r\n"
      );
      return;
    }

    const destinations = currentDestinations();

    const matched = matchDestination(
      hostname,
      destinations
    );

    console.log(
      `[PROXY CONNECT] ${hostname}:${targetPort} => ${
        matched?.action || "no matching rule"
      }`
    );

    if (matched) {
      if (shouldReport(hostname)) {
        void reportDetection({
          hostname,
          port: targetPort,
          method: "CONNECT",
          path: null,
          matched,
          dlpResult: null,
        });
      }

      // BLOCK HTTPS AI WEBSITE
      if (matched.action === "block") {
        console.log(
          `[${new Date().toLocaleTimeString()}] BLOCKED HTTPS AI service: ${
            matched.name || hostname
          }`
        );

        blockHttpsConnection(clientSocket, matched);
        return;
      }

      if (matched.action === "warn") {
        console.log(
          `[${new Date().toLocaleTimeString()}] WARN HTTPS AI service: ${
            matched.name || hostname
          }`
        );
      }
    }

    // Forward allowed HTTPS traffic.
    const serverSocket = net.connect(
      targetPort,
      hostname
    );

    // Handle upstream socket errors as well.
    handleSocketError(serverSocket, "PROXY SERVER ERROR");

    serverSocket.on("connect", () => {
      if (clientSocket.destroyed) {
        serverSocket.destroy();
        return;
      }

      clientSocket.write(
        "HTTP/1.1 200 Connection Established\r\n\r\n"
      );

      if (head?.length) {
        serverSocket.write(head);
      }

      serverSocket.pipe(clientSocket);
      clientSocket.pipe(serverSocket);
    });

    serverSocket.on("error", () => {
      if (!clientSocket.destroyed) {
        clientSocket.end();
      }
    });

    clientSocket.on("close", () => {
      serverSocket.destroy();
    });

    serverSocket.on("close", () => {
      if (!clientSocket.destroyed) {
        clientSocket.end();
      }
    });
  });

  // ========================================
  // START SERVER
  // ========================================

  server.on("clientError", (err, socket) => {
    if (
      err.code !== "ECONNRESET" &&
      err.code !== "EPIPE"
    ) {
      console.error(
        "[PROXY HTTP CLIENT ERROR]",
        err.message
      );
    }

    if (!socket.destroyed) {
      socket.end(
        "HTTP/1.1 400 Bad Request\r\n" +
        "Connection: close\r\n\r\n"
      );
    }
  });

  server.on("error", err => {
    console.error(
      "Network monitor server error:",
      err?.message || err
    );
  });

  server.listen(port, "127.0.0.1", () => {
    console.log(
      `Network monitor: local proxy listening on 127.0.0.1:${port}`
    );

    console.log(
      "AI blocking enabled for destinations with action=block."
    );

    console.log(
      "Configure the browser or OS to use this HTTP proxy."
    );
  });

  return server;
}

// ==========================================
// SECURITY EVENT PAYLOAD
// ==========================================

export function buildSecurityEventArgs({
  hostname,
  port,
  method,
  path,
  matched,
  dlpResult,
  employeeName,
  deviceId,
}) {
  const baseRisk =
    RISK_SCORE[matched.riskLevel] ?? 50;

  const riskScore = dlpResult
    ? Math.max(
        baseRisk,
        Number(dlpResult.riskScore) || 0
      )
    : baseRisk;

  const severity =
    SEVERITY_FROM_RISK[matched.riskLevel] ??
    "medium";

  const decision = matched.action ?? "warn";

  const locationDesc = path
    ? `${method} ${hostname}${path}`
    : `${method} ${hostname}:${port}`;

  const reasons = [
    `Traffic to ${
      matched.name || hostname
    } (${matched.category || "ai_service"}) detected: ${locationDesc}`,
  ];

  if (dlpResult?.reasons?.length) {
    reasons.push(...dlpResult.reasons);
  }

  return {
    eventType: "unauthorized_ai",
    severity,
    decision,
    employeeName,
    deviceId,
    destination: hostname,
    application: "network",
    contentType: dlpResult
      ? "network_request_body"
      : "network_request",
    contentSummary: dlpResult
      ? `AI service accessed: ${
          matched.name || hostname
        } — request body flagged (${dlpResult.classification})`
      : `AI service accessed: ${
          matched.name || hostname
        } (${locationDesc})`,
    riskScore,
    classification:
      matched.riskLevel?.toUpperCase() ||
      "UNKNOWN",
    reasons: reasons.slice(0, 5),
  };
}
