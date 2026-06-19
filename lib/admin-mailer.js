const nodemailer = require('nodemailer');

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
  return String(process.env.SMTP_FROM || ('CliniPipes Admin <' + getAdmin2faEmail() + '>')).trim();
}

function isConfigured() {
  var smtp = getSmtpConfig();
  return !!(smtp.host && smtp.user && smtp.pass && getAdmin2faEmail());
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

function sendAdminCode(code, purpose) {
  if (!isConfigured()) {
    return Promise.resolve({ ok: false, error: 'mail_not_configured' });
  }
  var smtp = getSmtpConfig();
  var transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass }
  });
  return transporter.sendMail({
    from: getFromAddress(),
    to: getAdmin2faEmail(),
    subject: 'CliniPipes Admin — Doğrulama Kodu',
    html: buildCodeEmail(code, purpose)
  }).then(function () {
    return { ok: true };
  }).catch(function (err) {
    return { ok: false, error: err.message || 'send_failed' };
  });
}

module.exports = {
  isConfigured: isConfigured,
  getAdmin2faEmail: getAdmin2faEmail,
  maskEmail: maskEmail,
  sendAdminCode: sendAdminCode
};
