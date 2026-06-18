const https = require('https');
const http = require('http');
const { URL } = require('url');
const { buildSignedHeaders, getWebhookSecret } = require('./integration-auth');

function isPortalIntegrationEnabled() {
  return process.env.ENABLE_PORTAL_INTEGRATION === 'true';
}

function postJson(url, body, timeoutMs) {
  return new Promise(function (resolve, reject) {
    const parsed = new URL(url);
    const raw = JSON.stringify(body);
    const headers = buildSignedHeaders(body);
    headers['Content-Length'] = Buffer.byteLength(raw);
    const lib = parsed.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: headers,
      timeout: timeoutMs || 15000
    }, function (res) {
      var data = '';
      res.on('data', function (c) { data += c; });
      res.on('end', function () {
        var json = {};
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, data: json, raw: data });
      });
    });
    req.on('error', reject);
    req.on('timeout', function () { req.destroy(); reject(new Error('portal_timeout')); });
    req.write(raw);
    req.end();
  });
}

function provisionClinic(order) {
  if (!isPortalIntegrationEnabled()) {
    return Promise.resolve({ ok: false, skipped: true, reason: 'integration_disabled' });
  }
  const secret = getWebhookSecret();
  const base = (process.env.CLINIC_PORTAL_URL || '').replace(/\/$/, '');
  if (!secret || !base) {
    return Promise.resolve({ ok: false, skipped: true, reason: 'integration_not_configured' });
  }
  const url = base + '/internal/webhooks/clinipipes/provision';
  return postJson(url, order, 20000).then(function (res) {
    if (res.status >= 200 && res.status < 300 && res.data.ok) {
      return { ok: true, clinicId: res.data.clinicId, slug: res.data.slug };
    }
    return { ok: false, error: res.data.error || 'provision_failed', status: res.status };
  });
}

module.exports = { provisionClinic: provisionClinic, postJson: postJson, isPortalIntegrationEnabled: isPortalIntegrationEnabled };
