const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const speakeasy = require('speakeasy');

const SESSION_COOKIE = 'cp_admin_session';
const SESSION_HOURS = 8;
const MAX_BODY_BYTES = 15 * 1024 * 1024;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 60 * 1000;
const PENDING_2FA_MS = 5 * 60 * 1000;
const MIN_PASSWORD_LEN = 8;

function timingSafeEqual(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return salt.toString('hex') + ':' + hash.toString('hex');
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (!String(stored).includes(':')) return timingSafeEqual(password, stored);
  const parts = String(stored).split(':');
  if (parts.length !== 2) return false;
  const hash = crypto.scryptSync(password, Buffer.from(parts[0], 'hex'), 64);
  return timingSafeEqual(hash.toString('hex'), parts[1]);
}

function createAdminAuth(configPath, envPassword) {
  const pending2fa = new Map();

  function defaultConfig() {
    return { passwordHash: null, totpSecret: null, totpEnabled: false, sessions: [], loginAttempts: {} };
  }

  function loadConfig() {
    try {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      const cfg = Object.assign(defaultConfig(), raw);
      if (raw.key && !cfg.passwordHash) {
        cfg.passwordHash = hashPassword(raw.key);
        delete cfg.key;
        saveConfig(cfg);
      }
      cfg.sessions = (cfg.sessions || []).filter(function (s) { return s.expires > Date.now(); });
      return cfg;
    } catch (e) {
      return defaultConfig();
    }
  }

  function saveConfig(cfg) {
    fs.writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
  }

  function getStoredPasswordHash(cfg) {
    return cfg.passwordHash || envPassword || '';
  }

  function parseCookies(req) {
    const out = {};
    const raw = req.headers.cookie || '';
    raw.split(';').forEach(function (part) {
      const idx = part.indexOf('=');
      if (idx < 0) return;
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      if (k) out[k] = decodeURIComponent(v);
    });
    return out;
  }

  function getClientIp(req) {
    return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();
  }

  function isHttps(req) {
    return req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production';
  }

  function setCookie(res, name, value, maxAgeSec, req) {
    const parts = [
      name + '=' + encodeURIComponent(value),
      'Path=/',
      'HttpOnly',
      'SameSite=Strict',
      'Max-Age=' + maxAgeSec
    ];
    if (isHttps(req)) parts.push('Secure');
    res.setHeader('Set-Cookie', parts.join('; '));
  }

  function clearCookie(res, name, req) {
    setCookie(res, name, '', 0, req);
  }

  function checkLoginAllowed(cfg, ip) {
    const rec = (cfg.loginAttempts || {})[ip];
    if (!rec || !rec.lockUntil) return { ok: true };
    if (Date.now() < rec.lockUntil) {
      return { ok: false, retryAfter: Math.ceil((rec.lockUntil - Date.now()) / 1000) };
    }
    delete cfg.loginAttempts[ip];
    saveConfig(cfg);
    return { ok: true };
  }

  function recordFailedLogin(cfg, ip) {
    cfg.loginAttempts = cfg.loginAttempts || {};
    const rec = cfg.loginAttempts[ip] || { count: 0, lockUntil: 0 };
    rec.count += 1;
    if (rec.count >= MAX_LOGIN_ATTEMPTS) {
      rec.lockUntil = Date.now() + LOCKOUT_MS;
      rec.count = 0;
    }
    cfg.loginAttempts[ip] = rec;
    saveConfig(cfg);
    return rec.lockUntil > Date.now() ? Math.ceil((rec.lockUntil - Date.now()) / 1000) : 0;
  }

  function clearFailedLogin(cfg, ip) {
    if (cfg.loginAttempts && cfg.loginAttempts[ip]) {
      delete cfg.loginAttempts[ip];
      saveConfig(cfg);
    }
  }

  function createSession(cfg) {
    const token = crypto.randomBytes(32).toString('hex');
    const csrf = crypto.randomBytes(24).toString('hex');
    const expires = Date.now() + SESSION_HOURS * 3600000;
    cfg.sessions = (cfg.sessions || []).filter(function (s) { return s.expires > Date.now(); });
    cfg.sessions.push({ token: token, csrf: csrf, expires: expires, created: Date.now() });
    saveConfig(cfg);
    return { token: token, csrf: csrf, expires: expires };
  }

  function destroySession(cfg, token) {
    cfg.sessions = (cfg.sessions || []).filter(function (s) { return s.token !== token; });
    saveConfig(cfg);
  }

  function findSession(cfg, token) {
    if (!token) return null;
    return (cfg.sessions || []).find(function (s) { return s.token === token && s.expires > Date.now(); }) || null;
  }

  function normalizeTotpSecret(secret) {
    return String(secret || '').replace(/\s/g, '').replace(/=+$/g, '').toUpperCase();
  }

  function resolveTotpSecret(clientSecret, serverSecret) {
    var out = [];
    var a = normalizeTotpSecret(clientSecret);
    var b = normalizeTotpSecret(serverSecret);
    if (a) out.push(a);
    if (b && out.indexOf(b) < 0) out.push(b);
    return out;
  }

  function verifyTotpAny(secrets, code) {
    for (var i = 0; i < secrets.length; i++) {
      if (verifyTotp(secrets[i], code)) return secrets[i];
    }
    return null;
  }

  function verifyTotp(secret, code) {
    const clean = normalizeTotpSecret(secret);
    let token = String(code || '').replace(/\D/g, '');
    if (token.length > 0 && token.length < 6) token = token.padStart(6, '0');
    token = token.slice(0, 6);
    if (!clean || !/^\d{6}$/.test(token)) return false;
    try {
      return speakeasy.totp.verifyDelta({
        secret: clean,
        encoding: 'base32',
        token: token,
        window: 10,
        step: 30
      }) != null;
    } catch (e) {
      return false;
    }
  }

  function currentTotpCode(secret) {
    return speakeasy.totp({
      secret: normalizeTotpSecret(secret),
      encoding: 'base32',
      step: 30
    });
  }

  function createTotpSetup() {
    var raw = speakeasy.generateSecret({ length: 20, otpauth_url: false });
    var secret = normalizeTotpSecret(raw.base32);
    var uri = speakeasy.otpauthURL({
      secret: secret,
      label: 'CliniPipes',
      issuer: 'CliniPipes',
      encoding: 'base32'
    });
    return { secret: secret, uri: uri };
  }

  function setPendingTotpSecret(cfg, sessionToken, secret) {
    cfg.totpPendingSecret = secret;
    (cfg.sessions || []).forEach(function (s) {
      if (s.token === sessionToken) {
        s.totpPendingSecret = secret;
        s.totpPendingAt = Date.now();
      }
    });
  }

  function getPendingTotpSecret(cfg, sessionToken) {
    var sess = (cfg.sessions || []).find(function (s) {
      return s.token === sessionToken && s.expires > Date.now();
    });
    if (sess && sess.totpPendingSecret) return sess.totpPendingSecret;
    return cfg.totpPendingSecret || null;
  }

  function clearPendingTotpSecret(cfg, sessionToken) {
    delete cfg.totpPendingSecret;
    (cfg.sessions || []).forEach(function (s) {
      if (!sessionToken || s.token === sessionToken) {
        delete s.totpPendingSecret;
        delete s.totpPendingAt;
      }
    });
  }

  function generateTotpSecret() {
    return createTotpSetup().secret;
  }

  function getTotpUri(secret) {
    return speakeasy.otpauthURL({
      secret: normalizeTotpSecret(secret),
      label: 'CliniPipes',
      issuer: 'CliniPipes',
      encoding: 'base32'
    });
  }

  function createPending2fa(ip) {
    const token = crypto.randomBytes(24).toString('hex');
    pending2fa.set(token, { ip: ip, expires: Date.now() + PENDING_2FA_MS });
    return token;
  }

  function consumePending2fa(token, ip) {
    const rec = pending2fa.get(token);
    if (!rec || rec.expires < Date.now() || rec.ip !== ip) return false;
    pending2fa.delete(token);
    return true;
  }

  function authenticateRequest(req, qs, res, requireCsrf) {
    const cfg = loadConfig();
    const cookies = parseCookies(req);
    const session = findSession(cfg, cookies[SESSION_COOKIE]);
    if (session) {
      if (requireCsrf && req.method !== 'GET' && req.method !== 'HEAD') {
        const csrf = req.headers['x-csrf-token'];
        if (!csrf || !timingSafeEqual(csrf, session.csrf)) {
          res.writeHead(403, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'csrf' }));
          return null;
        }
      }
      return { cfg: cfg, session: session };
    }
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'unauthorized' }));
    return null;
  }

  function isValidPngBase64(b64) {
    const m = String(b64).match(/^data:image\/png;base64,(.+)$/i);
    if (!m) return false;
    try {
      const buf = Buffer.from(m[1], 'base64');
      return buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
    } catch (e) {
      return false;
    }
  }

  function setSecurityHeaders(res, opts) {
    opts = opts || {};
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('X-XSS-Protection', '0');
    if (opts.admin) {
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'");
    }
  }

  function readBody(req, cb) {
    var body = '';
    var size = 0;
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        cb(new Error('payload_too_large'));
        return;
      }
      body += chunk;
    });
    req.on('end', function () { cb(null, body); });
    req.on('error', function (err) { cb(err); });
  }

  return {
    SESSION_COOKIE: SESSION_COOKIE,
    MIN_PASSWORD_LEN: MIN_PASSWORD_LEN,
    MAX_BODY_BYTES: MAX_BODY_BYTES,
    loadConfig: loadConfig,
    saveConfig: saveConfig,
    getStoredPasswordHash: getStoredPasswordHash,
    parseCookies: parseCookies,
    getClientIp: getClientIp,
    setCookie: setCookie,
    clearCookie: clearCookie,
    checkLoginAllowed: checkLoginAllowed,
    recordFailedLogin: recordFailedLogin,
    clearFailedLogin: clearFailedLogin,
    createSession: createSession,
    destroySession: destroySession,
    findSession: findSession,
    verifyPassword: verifyPassword,
    hashPassword: hashPassword,
    verifyTotp: verifyTotp,
    verifyTotpAny: verifyTotpAny,
    currentTotpCode: currentTotpCode,
    createTotpSetup: createTotpSetup,
    resolveTotpSecret: resolveTotpSecret,
    normalizeTotpSecret: normalizeTotpSecret,
    generateTotpSecret: generateTotpSecret,
    getTotpUri: getTotpUri,
    setPendingTotpSecret: setPendingTotpSecret,
    getPendingTotpSecret: getPendingTotpSecret,
    clearPendingTotpSecret: clearPendingTotpSecret,
    createPending2fa: createPending2fa,
    consumePending2fa: consumePending2fa,
    authenticateRequest: authenticateRequest,
    isValidPngBase64: isValidPngBase64,
    setSecurityHeaders: setSecurityHeaders,
    readBody: readBody
  };
}

module.exports = { createAdminAuth: createAdminAuth };
