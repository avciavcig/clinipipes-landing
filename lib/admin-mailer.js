const https = require('https');

const SEND_TIMEOUT_MS = 15000;

function getApiKey() {
  return String(process.env.RESEND_API_KEY || '').trim();
}

function getAdmin2faEmail() {
  return String(process.env.ADMIN_2FA_EMAIL || '').trim().toLowerCase();
}

function getFromAddress() {
  var custom = String(process.env.RESEND_FROM || '').trim();
  if (custom) return custom;
  return 'onboarding@resend.dev';
}

function isConfigured() {
  return !!(getApiKey() && getAdmin2faEmail());
}

function getMailProvider() {
  return isConfigured() ? 'resend' : null;
}

function maskEmail(email) {
  var e = String(email || '').trim();
  var at = e.indexOf('@');
  if (at < 1) return '***';
  var local = e.slice(0, at);
  var domain = e.slice(at + 1);
  var shown = local.length <= 2 ? local[0] + '***' : local.slice(0, 2) + '***';
  return shown + '@' + domain;
}

function configError() {
  if (!getApiKey()) {
    return 'RESEND_API_KEY eksik. Railway Variables\'a ekleyin.';
  }
  if (!getAdmin2faEmail()) {
    return 'ADMIN_2FA_EMAIL eksik. Resend\'e kayıt olduğunuz e-postayı yazın (ör. avcivcig@gmail.com).';
  }
  return 'E-posta ayarı eksik.';
}

function buildCodeEmail(code, purpose) {
  var titles = {
    setup: '2FA kurulumu',
    login: 'Admin girişi',
    disable: '2FA devre dışı',
    password: 'Şifre değişikliği'
  };
  var title = titles[purpose] || 'Doğrulama';
  return '<div style="font-family:system-ui,sans-serif;max-width:420px;line-height:1.5">' +
    '<p>CliniPipes yönetim paneli — <strong>' + title + '</strong></p>' +
    '<p style="font-size:34px;letter-spacing:10px;font-weight:700;margin:1.25rem 0">' + code + '</p>' +
    '<p style="color:#666;font-size:14px">Bu kod 10 dakika geçerlidir.</p></div>';
}

function parseResendError(statusCode, body) {
  var hint = 'Resend hatası (HTTP ' + statusCode + ')';
  try {
    var parsed = JSON.parse(body);
    if (parsed && parsed.message) {
      hint = parsed.message;
      if (/only send testing emails to your own/i.test(hint)) {
        hint += ' — ADMIN_2FA_EMAIL, Resend hesabınızdaki e-posta ile aynı olmalı.';
      }
    }
  } catch (e) { /* ignore */ }
  return hint;
}

function sendAdminCode(code, purpose) {
  if (!isConfigured()) {
    return Promise.resolve({ ok: false, error: configError() });
  }
  var apiKey = getApiKey();
  var to = getAdmin2faEmail();
  var body = JSON.stringify({
    from: getFromAddress(),
    to: [to],
    subject: 'CliniPipes Admin — Doğrulama Kodu',
    html: buildCodeEmail(code, purpose)
  });
  return new Promise(function (resolve) {
    var req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      timeout: SEND_TIMEOUT_MS,
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    }, function (res) {
      var d = '';
      res.on('data', function (c) { d += c; });
      res.on('end', function () {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log('[mail] Resend OK → ' + maskEmail(to));
          resolve({ ok: true, provider: 'resend' });
          return;
        }
        var err = parseResendError(res.statusCode, d);
        console.error('[mail] Resend FAIL:', err);
        resolve({ ok: false, error: err, provider: 'resend' });
      });
    });
    req.on('timeout', function () {
      req.destroy();
      resolve({ ok: false, error: 'Resend zaman aşımı', provider: 'resend' });
    });
    req.on('error', function (err) {
      resolve({ ok: false, error: err.message || 'resend_failed', provider: 'resend' });
    });
    req.write(body);
    req.end();
  });
}

module.exports = {
  isConfigured: isConfigured,
  isResendConfigured: isConfigured,
  getMailProvider: getMailProvider,
  getAdmin2faEmail: getAdmin2faEmail,
  configError: configError,
  maskEmail: maskEmail,
  sendAdminCode: sendAdminCode
};
