const crypto = require('crypto');

const MAX_SKEW_MS = 5 * 60 * 1000;
const SIG_HEADER = 'x-clinipipes-signature';
const TS_HEADER = 'x-clinipipes-timestamp';

function getWebhookSecret() {
  return process.env.CLINIPIPES_WEBHOOK_SECRET || '';
}

function canonicalBody(body) {
  return typeof body === 'string' ? body : JSON.stringify(body);
}

function signPayload(secret, timestamp, body) {
  return crypto.createHmac('sha256', secret).update(String(timestamp) + '.' + canonicalBody(body)).digest('hex');
}

function safeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function verifyWebhookRequest(req, rawBody) {
  const secret = getWebhookSecret();
  if (!secret) return { ok: false, error: 'secret_not_configured' };
  const sig = String(req.headers[SIG_HEADER] || req.headers['X-CliniPipes-Signature'] || '');
  const ts = String(req.headers[TS_HEADER] || req.headers['X-CliniPipes-Timestamp'] || '');
  if (!sig || !ts) return { ok: false, error: 'missing_headers' };
  const tsNum = parseInt(ts, 10);
  if (!tsNum || Math.abs(Date.now() - tsNum) > MAX_SKEW_MS) return { ok: false, error: 'timestamp_invalid' };
  const expected = signPayload(secret, ts, rawBody);
  if (!safeEqual(sig, expected)) return { ok: false, error: 'invalid_signature' };
  return { ok: true };
}

function buildSignedHeaders(body) {
  const secret = getWebhookSecret();
  if (!secret) throw new Error('CLINIPIPES_WEBHOOK_SECRET missing');
  const ts = String(Date.now());
  const raw = canonicalBody(body);
  return {
    'Content-Type': 'application/json',
    'X-CliniPipes-Timestamp': ts,
    'X-CliniPipes-Signature': signPayload(secret, ts, raw)
  };
}

module.exports = {
  MAX_SKEW_MS: MAX_SKEW_MS,
  getWebhookSecret: getWebhookSecret,
  signPayload: signPayload,
  verifyWebhookRequest: verifyWebhookRequest,
  buildSignedHeaders: buildSignedHeaders,
  safeEqual: safeEqual
};
