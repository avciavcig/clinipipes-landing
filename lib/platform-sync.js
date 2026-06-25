/** Landing ↔ clinic-portal parity — fiyat, kurulum, sürüm ve entegrasyon referansları */

const { PORTAL_RELEASE_STATIC } = require("./portal-release");

const SETUP_FAQ = {
  tr: "Başvurunuzdan sonra 1 iş günü içinde hesabınız açılır. Portalda 5 adımlı kurulum sihirbazı sizi yönlendirir: klinik bilgileri ve görseller (logo, klinik/doktor/rehber fotoğrafları), çok dilli hasta formu (EN/TR/DE), ekip, bildirimler ve test. Zorunlu alanlar tamamlanmadan sonraki adıma geçilemez. Kurulum paketinde logo, rehber fotoğrafları ve ekip eğitimi dahildir.",
  en: "Your account opens within 1 business day. The portal guides you through a 5-step setup wizard: clinic details and photos (logo, clinic/doctor/guide images), multilingual patient form (EN/TR/DE), team, notifications, and testing. Required fields must be completed before advancing. The optional setup package includes logo, guide photos, and team training.",
};

const PRICING = {
  starter: { intro: 45, list: 69 },
  pro: { intro: 79, list: 119 },
  setup: { intro: 99, list: 149 },
};

const PORTAL_ENV = {
  proPlanPrice: 79,
  proPlanListPrice: 119,
};

function getPlatformSyncInfo(opts) {
  opts = opts || {};
  const portalUrl = String(process.env.CLINIC_PORTAL_URL || process.env.PORTAL_URL || "").trim().replace(/\/$/, "");
  const portalRelease = opts.portalRelease || PORTAL_RELEASE_STATIC;
  return {
    provisioningMode: opts.provisioningMode || "manual",
    portalUrl: portalUrl || null,
    landingUrl: "https://clinipipes.com",
    landingVersion: "clinipipes.v2.3",
    webhookConfigured: Boolean(String(process.env.CLINIPIPES_WEBHOOK_SECRET || "").trim()),
    integrationEnabled: process.env.ENABLE_PORTAL_INTEGRATION === "true",
    pricing: PRICING,
    portalEnv: PORTAL_ENV,
    portalRelease,
    setupWizardSteps: 5,
    setupWizardLabels: ["Klinik", "Form", "Ekip", "Bildirim", "Test"],
    setupFaq: SETUP_FAQ,
    emailHint: "Portal: RESEND_API_KEY veya SMTP_USER+SMTP_PASS (klinik bildirimleri)",
    resilienceMarketing: "Kurulum & teklif yedekleme, günlük DB yedek, canlı durum izleme (V4.1.1)",
  };
}

module.exports = {
  SETUP_FAQ,
  PRICING,
  PORTAL_ENV,
  PORTAL_RELEASE_STATIC,
  getPlatformSyncInfo,
};
