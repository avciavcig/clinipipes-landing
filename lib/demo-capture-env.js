const crypto = require("crypto");
const https = require("https");
const http = require("http");

function envTruthy(name) {
  return Boolean(String(process.env[name] || "").trim());
}

function portalBaseUrl() {
  return String(process.env.CLINIC_PORTAL_URL || process.env.PORTAL_URL || "").trim().replace(/\/$/, "");
}

function signPayload(secret, timestamp, body) {
  return crypto.createHmac("sha256", secret).update(String(timestamp) + "." + body).digest("hex");
}

function getLandingDemoCaptureStatus() {
  const secret = envTruthy("CLINIPIPES_WEBHOOK_SECRET");
  const portalUrl = portalBaseUrl();
  const owner = envTruthy("DEMO_USER") || envTruthy("DEMO_EMAIL");
  const pass = envTruthy("DEMO_PASS");
  const formPath = String(process.env.DEMO_FORM_PATH || "").trim();

  const checks = {
    CLINIPIPES_WEBHOOK_SECRET: secret,
    CLINIC_PORTAL_URL: Boolean(portalUrl),
    DEMO_USER: owner,
    DEMO_PASS: pass,
    DEMO_FORM_PATH: Boolean(formPath),
  };

  const missing = [];
  if (!secret) missing.push("CLINIPIPES_WEBHOOK_SECRET");
  if (!portalUrl) missing.push("CLINIC_PORTAL_URL veya PORTAL_URL");
  if (!owner) missing.push("DEMO_USER");
  if (!pass) missing.push("DEMO_PASS");

  const portalApiReady = secret && portalUrl;
  const directReady = owner && pass && portalUrl;

  return {
    service: "clinipipes-landing",
    portalUrl: portalUrl || null,
    webhookEnabled: secret,
    ownerLogin: owner && pass,
    formPath: formPath || null,
    portalApiReady,
    directReady,
    ready: portalApiReady || directReady,
    mode: portalApiReady ? "portal-api" : (directReady ? "direct-playwright" : "none"),
    checks,
    missing,
  };
}

function fetchPortalDemoCaptureStatus() {
  return new Promise(function (resolve) {
    const secret = String(process.env.CLINIPIPES_WEBHOOK_SECRET || "").trim();
    const base = portalBaseUrl();
    if (!secret || !base) {
      resolve({ ok: false, error: "missing_secret_or_portal_url" });
      return;
    }
    const ts = String(Date.now());
    const sig = signPayload(secret, ts, "status");
    let url;
    try {
      url = new URL(base.replace(/\/$/, "") + "/internal/demo-screenshots/status");
    } catch (e) {
      resolve({ ok: false, error: "invalid_portal_url" });
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
          resolve({ ok: res.statusCode === 200 && json.ok, status: res.statusCode, portal: json });
        } catch (e) {
          resolve({ ok: false, status: res.statusCode, error: data.slice(0, 200) || "invalid_json" });
        }
      });
    });
    req.on("error", function (err) {
      resolve({ ok: false, error: err.message || "request_failed" });
    });
    req.on("timeout", function () {
      req.destroy();
      resolve({ ok: false, error: "timeout" });
    });
    req.end();
  });
}

async function getCombinedDemoCaptureStatus() {
  const landing = getLandingDemoCaptureStatus();
  const portalProbe = await fetchPortalDemoCaptureStatus();
  const portal = portalProbe.portal || null;
  const combinedMissing = [...landing.missing];
  if (portal && Array.isArray(portal.missing)) {
    portal.missing.forEach(function (item) {
      const label = "portal:" + item;
      if (!combinedMissing.includes(label)) combinedMissing.push(label);
    });
  }
  return {
    landing,
    portalProbe,
    portal,
    ready: landing.ready && portalProbe.ok && portal && portal.ready,
    combinedMissing,
  };
}

module.exports = {
  getLandingDemoCaptureStatus,
  fetchPortalDemoCaptureStatus,
  getCombinedDemoCaptureStatus,
};
