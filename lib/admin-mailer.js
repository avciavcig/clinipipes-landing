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
  if (!getApiKey()) return 'RESEND_API_KEY eksik. Railway Variables\'a ekleyin.';
  if (!getAdmin2faEmail()) return 'ADMIN_2FA_EMAIL eksik. Resend\'e kayıt olduğunuz e-postayı yazın.';
  return 'E-posta ayarı eksik.';
}

function buildCodeEmail(code, purpose) {
  var titles = { setup:'2FA kurulumu', login:'Admin girişi', disable:'2FA devre dışı', password:'Şifre değişikliği' };
  var title = titles[purpose] || 'Doğrulama';
  return '<div style="font-family:system-ui,sans-serif;max-width:420px;line-height:1.5">' +
    '<p>CliniPipes yönetim paneli — <strong>' + title + '</strong></p>' +
    '<p style="font-size:34px;letter-spacing:10px;font-weight:700;margin:1.25rem 0">' + code + '</p>' +
    '<p style="color:#666;font-size:14px">Bu kod 10 dakika geçerlidir.</p></div>';
}

function buildTestEmail() {
  return '<div style="font-family:system-ui,sans-serif;max-width:420px;line-height:1.5">' +
    '<p><strong>CliniPipes — E-posta Test Mesajı</strong></p>' +
    '<p>E-posta yapılandırmanız doğru çalışıyor.</p>' +
    '<p style="color:#666;font-size:14px">Gönderen: ' + getFromAddress() + '<br>Alıcı: ' + getAdmin2faEmail() + '</p>' +
    '</div>';
}

function parseResendError(statusCode, body) {
  var hint = 'Resend hatası (HTTP ' + statusCode + ')';
  try {
    var parsed = JSON.parse(body);
    if (parsed && parsed.message) {
      hint = parsed.message;
      if (/only send testing emails to your own/i.test(hint)) {
        hint = 'Resend ücretsiz planda sadece kendi hesap e-postanıza gönderilebilir. ' +
          'ADMIN_2FA_EMAIL (' + getAdmin2faEmail() + ') Resend hesabınıza kayıtlı e-posta ile aynı olmalı. ' +
          'Farklı adrese göndermek için resend.com/domains üzerinden domain doğrulaması yapın.';
      }
      if (/api key/i.test(hint) || /unauthorized/i.test(hint)) {
        hint = 'RESEND_API_KEY geçersiz. Resend panelinden yeni API anahtarı oluşturun.';
      }
    }
  } catch (e) {}
  return hint;
}

function sendEmail(to, subject, html) {
  var apiKey = getApiKey();
  var body = JSON.stringify({ from: getFromAddress(), to: [to], subject: subject, html: html });
  return new Promise(function(resolve) {
    var req = https.request({
      hostname: 'api.resend.com', path: '/emails', method: 'POST', timeout: SEND_TIMEOUT_MS,
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, function(res) {
      var d = '';
      res.on('data', function(c) { d += c; });
      res.on('end', function() {
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
    req.on('timeout', function() { req.destroy(); resolve({ ok: false, error: 'Resend zaman aşımı.' }); });
    req.on('error', function(err) { resolve({ ok: false, error: err.message || 'resend_failed' }); });
    req.write(body);
    req.end();
  });
}

function sendAdminCode(code, purpose) {
  if (!isConfigured()) return Promise.resolve({ ok: false, error: configError() });
  return sendEmail(getAdmin2faEmail(), 'CliniPipes Admin — Doğrulama Kodu', buildCodeEmail(code, purpose));
}

function sendTestEmail() {
  if (!isConfigured()) return Promise.resolve({ ok: false, error: configError() });
  return sendEmail(getAdmin2faEmail(), 'CliniPipes — E-posta Yapılandırma Testi', buildTestEmail());
}

module.exports = {
  isConfigured, isResendConfigured: isConfigured, getMailProvider,
  getAdmin2faEmail, getFromAddress, configError, maskEmail,
  sendAdminCode, sendTestEmail
};
