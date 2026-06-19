const https = require('https');
const nodemailer = require('nodemailer');

const SEND_TIMEOUT_MS = 15000;

function getSmtpConfig() {
  return {
    host: String(process.env.SMTP_HOST || '').trim(),
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: String(process.env.SMTP_USER || '').trim(),
    pass: String(process.env.SMTP_PASS || '').trim()
  };
}

function getAdmin2faEmail() {
  return String(process.env.ADMIN_2FA_EMAIL || process.env.SMTP_USER || '').trim();
}

function getFromAddress() {
  if (process.env.RESEND_API_KEY) {
    return String(process.env.RESEND_FROM || 'CliniPipes <onboarding@resend.dev>').trim();
  }
  return String(process.env.SMTP_FROM || ('CliniPipes Admin <' + getAdmin2faEmail() + '>')).trim();
}

function isResendConfigured() {
  return !!(String(process.env.RESEND_API_KEY || '').trim() && getAdmin2faEmail());
}

function isSmtpConfigured() {
  var smtp = getSmtpConfig();
  return !!(smtp.host && smtp.user && smtp.pass && getAdmin2faEmail());
}

function isConfigured() {
  return isResendConfigured() || isSmtpConfigured();
}

function getMailProvider() {
  if (isResendConfigured()) return 'resend';
  if (isSmtpConfigured()) return 'smtp';
  return null;
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
    '<p style="color:#666;font-size:14px">Bu kod 10 dakika geçerlidir. Siz istemediyseniz bu e-postayı yok sayın.</p>' +
    '</div>';
}

function sendViaResend(code, purpose) {
  var apiKey = String(process.env.RESEND_API_KEY || '').trim();
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
          resolve({ ok: true, provider: 'resend' });
          return;
        }
        var hint = 'Resend gönderimi başarısız.';
        try {
          var parsed = JSON.parse(d);
          if (parsed && parsed.message) hint = parsed.message;
        } catch (e) { /* ignore */ }
        resolve({ ok: false, error: hint, provider: 'resend' });
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

function sendViaSmtp(code, purpose) {
  var smtp = getSmtpConfig();
  var transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: SEND_TIMEOUT_MS,
    greetingTimeout: SEND_TIMEOUT_MS,
    socketTimeout: SEND_TIMEOUT_MS
  });
  return transporter.sendMail({
    from: getFromAddress(),
    to: getAdmin2faEmail(),
    subject: 'CliniPipes Admin — Doğrulama Kodu',
    html: buildCodeEmail(code, purpose)
  }).then(function () {
    return { ok: true, provider: 'smtp' };
  }).catch(function (err) {
    var msg = err.message || 'send_failed';
    if (/timeout|ETIMEDOUT|ECONNREFUSED/i.test(msg)) {
      msg = 'SMTP bağlantısı kurulamadı. Railway Hobby planında Gmail SMTP çalışmaz — RESEND_API_KEY kullanın.';
    }
    return { ok: false, error: msg, provider: 'smtp' };
  });
}

function sendAdminCode(code, purpose) {
  if (isResendConfigured()) {
    return sendViaResend(code, purpose);
  }
  if (isSmtpConfigured()) {
    return sendViaSmtp(code, purpose);
  }
  return Promise.resolve({
    ok: false,
    error: 'mail_not_configured',
    message: 'RESEND_API_KEY veya SMTP ayarları gerekli. Railway\'de Resend önerilir.'
  });
}

module.exports = {
  isConfigured: isConfigured,
  isResendConfigured: isResendConfigured,
  getMailProvider: getMailProvider,
  getAdmin2faEmail: getAdmin2faEmail,
  maskEmail: maskEmail,
  sendAdminCode: sendAdminCode
};
