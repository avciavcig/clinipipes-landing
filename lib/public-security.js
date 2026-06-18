const crypto = require('crypto');

const CHECKOUT_TTL_MS = 30 * 60 * 1000;
const MAX_CHECKOUT_ATTEMPTS = 8;
const CHECKOUT_LOCK_MS = 15 * 60 * 1000;

const checkoutTokens = new Map();
const rateBuckets = new Map();

function getClientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
}

function createCheckoutToken() {
  const token = crypto.randomBytes(24).toString('hex');
  checkoutTokens.set(token, { expires: Date.now() + CHECKOUT_TTL_MS, used: 0 });
  return token;
}

function verifyCheckoutToken(token) {
  if (!token) return false;
  const rec = checkoutTokens.get(token);
  if (!rec || rec.expires < Date.now()) {
    checkoutTokens.delete(token);
    return false;
  }
  return true;
}

function consumeCheckoutToken(token) {
  if (!verifyCheckoutToken(token)) return false;
  const rec = checkoutTokens.get(token);
  rec.used += 1;
  if (rec.used > 3) checkoutTokens.delete(token);
  return true;
}

function checkRateLimit(key, max, windowMs) {
  const now = Date.now();
  let rec = rateBuckets.get(key);
  if (!rec || rec.reset < now) {
    rec = { count: 0, reset: now + windowMs };
    rateBuckets.set(key, rec);
  }
  rec.count += 1;
  if (rec.count > max) {
    return { ok: false, retryAfter: Math.ceil((rec.reset - now) / 1000) };
  }
  return { ok: true };
}

function checkCheckoutAllowed(ip) {
  return checkRateLimit('checkout:' + ip, MAX_CHECKOUT_ATTEMPTS, CHECKOUT_LOCK_MS);
}

function checkClaimAllowed(ip) {
  return checkRateLimit('claim:' + ip, 5, 60 * 60 * 1000);
}

function sanitizeSlug(input) {
  return String(input || '').toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 48);
}

function sanitizeEmail(input) {
  const e = String(input || '').trim().toLowerCase().slice(0, 120);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return '';
  return e;
}

function sanitizeText(input, max) {
  return String(input || '').replace(/[<>\0]/g, '').trim().slice(0, max || 200);
}

module.exports = {
  createCheckoutToken: createCheckoutToken,
  verifyCheckoutToken: verifyCheckoutToken,
  consumeCheckoutToken: consumeCheckoutToken,
  checkCheckoutAllowed: checkCheckoutAllowed,
  checkClaimAllowed: checkClaimAllowed,
  getClientIp: getClientIp,
  sanitizeSlug: sanitizeSlug,
  sanitizeEmail: sanitizeEmail,
  sanitizeText: sanitizeText
};
