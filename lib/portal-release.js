const crypto = require("crypto");
const https = require("https");
const http = require("http");

const PORTAL_RELEASE_STATIC = {
  service: "clinic-portal",
  version: "4.1.1",
  label: "Clinic-Portal V4.1.1",
  landingVersion: "clinipipes.v2.3",
  releasedAt: "2026-06",
  highlights: [
    "Dayanıklılık protokolü: teklif sürümleme + kurulum snapshot",
    "Günlük pg_dump yedek (GitHub Actions)",
    "Release QA + E2E genişletme",
  ],
};

function portalBaseUrl() {
  return String(process.env.CLINIC_PORTAL_URL || process.env.PORTAL_URL || "").trim().replace(/\/$/, "");
}

function signPayload(secret, timestamp, body) {
  return crypto.createHmac("sha256", secret).update(String(timestamp) + "." + body).digest("hex");
}

function fetchPortalPlatformInfo() {
  return new Promise(function (resolve) {
    const secret = String(process.env.CLINIPIPES_WEBHOOK_SECRET || "").trim();
    const base = portalBaseUrl();
    if (!secret || !base) {
      resolve({ ok: false, error: "missing_secret_or_portal_url", release: PORTAL_RELEASE_STATIC });
      return;
    }
    const ts = String(Date.now());
    const sig = signPayload(secret, ts, "platform-info");
    let url;
    try {
      url = new URL(base + "/internal/platform-info");
    } catch (e) {
      resolve({ ok: false, error: "invalid_portal_url", release: PORTAL_RELEASE_STATIC });
      return;
    }
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname,
      method: "GET",
      headers: {
        "X-CliniPipes-Timestamp": ts,
        "X-CliniPipes-Signature": sig,
      },
      timeout: 15000,
    }, function (res) {
      let data = "";
      res.on("data", function (chunk) { data += chunk; });
      res.on("end", function () {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200 && json.ok) {
            resolve({ ok: true, release: json, live: true });
          } else {
            resolve({ ok: false, status: res.statusCode, error: json.error || "portal_error", release: PORTAL_RELEASE_STATIC });
          }
        } catch (e) {
          resolve({ ok: false, status: res.statusCode, error: "invalid_json", release: PORTAL_RELEASE_STATIC });
        }
      });
    });
    req.on("error", function (err) {
      resolve({ ok: false, error: err.message || "request_failed", release: PORTAL_RELEASE_STATIC });
    });
    req.on("timeout", function () {
      req.destroy();
      resolve({ ok: false, error: "timeout", release: PORTAL_RELEASE_STATIC });
    });
    req.end();
  });
}

module.exports = {
  PORTAL_RELEASE_STATIC,
  fetchPortalPlatformInfo,
};
