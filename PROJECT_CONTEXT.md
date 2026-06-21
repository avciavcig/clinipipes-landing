# CliniPipes — Tam Proje Bağlamı
# Oluşturulma: Haziran 2026
# Bu dosyayı yeni bir Claude oturumuna yükleyerek kaldığın yerden devam edebilirsin.

========================================
PROJE 1: CLİNİPİPES LANDING
========================================

REPO     : https://github.com/avciavcig/clinipipes-landing
Branch   : main
Deploy   : Railway (auto-deploy on push)
Domain   : clinipipes.com
Server   : Node.js — server.js (HTTP, port 8080)

--- ORTAM DEĞİŞKENLERİ ---
PORT        = Railway otomatik atar (8080 default)
ADMIN_KEY   = klinik2026  (→ /admin?key=klinik2026)
GITHUB_TOKEN= <GitHub PAT> (repo scope, admin paneli GitHub'a commit atar)

--- DOSYA YAPISI ---
server.js               — HTTP server, tüm route'lar
index.html              — Ana landing (~200KB, embedded base64 görseller)
admin.html              — /admin sayfası (2 tab: Fiyat&Galeri + Sayfa Editörü)
content.json            — Fiyatlar + galeri görselleri (admin panelden güncellenir)
hakkimizda.html
gizlilik.html           — KVKK Aydınlatma Metni
teslimat.html           — Teslimat ve İade Şartları
mesafeli-satis.html     — ⚠️ [DOLDURUN] alanları var! (VKN, vergi dairesi, adres, KEP)
sss.html
kullanim-kosullari.html
etk.html                — ETK Metni
package.json

--- ROUTE'LAR ---
GET  /                   → index.html
GET  /hakkimizda         → hakkimizda.html
GET  /gizlilik           → gizlilik.html
GET  /teslimat           → teslimat.html
GET  /mesafeli-satis     → mesafeli-satis.html
GET  /sss                → sss.html
GET  /kullanim-kosullari → kullanim-kosullari.html
GET  /etk                → etk.html
GET  /admin              → admin.html (ADMIN_KEY doğrulaması)
GET  /content.json       → content.json (no-cache)
GET  /api/file?name=X&key=Y → Dosya içeriği (index.html'de base64 → [BASE64_IMAGE])
POST /api/save?key=Y     → Dosya kaydet + GitHub commit
  Body: {filename, content}  → belirtilen dosyayı güncelle
  Body: {prices, gallery}    → content.json güncelle

--- ADMIN PANELİ ---
URL: clinipipes.com/admin?key=klinik2026
Tab 1 — Fiyat & Galeri: 6 fiyat inputu, 4 galeri görseli upload
Tab 2 — Sayfa & İçerik Editörü: tüm HTML + content.json düzenlenebilir
Kaydet → /api/save → GitHub commit → Railway deploy (~2dk)

--- INDEX.HTML ÖNEMLİ NOTLAR ---
- Dil: TR/EN bilingual (data-tr / data-en attribute + setLang() fonksiyonu)
- Fiyatlar: data-ck="p-sm/p-pm/p-su" → content.json ile override
- Galeri: .shots container → content.json gallery array ile client-side replace
- Sepet: addToCart('starter'|'pro'|'setup') → slide-in panel → openCheckout()
- Sözleşme: openCheckout() → co-modal (iframe /mesafeli-satis + onay kutusu)
- Ödeme: confirmPurchase() → şu an mailto (iyzico bekleniyor)
  → Swap noktası: confirmPurchase() içindeki mailto satırı

--- İYZİCO DURUMU ---
- Başvuru hazırlık aşamasında
- Onay gelince: confirmPurchase() içindeki mailto → iyzico ödeme çağrısıyla değişecek
- EUR fiyatlandırma → iyzico ile TRY/EUR netleştirilmeli

--- EKSİK / YAPILACAK ---
⚠️  mesafeli-satis.html içindeki [DOLDURUN] alanları doldurulmalı:
    AD SOYAD / Şirket unvanı, VKN, VERGİ DAİRESİ, ADRES, TELEFON, KEP
    → Bu tamamlanınca landing satışa hazır.

--- DEPLOY PROTOKOLÜ ---
git add -A && git commit -m "açıklama" && git push
→ Railway otomatik deploy (~2 dakika)

--- KOD TESLİM YÖNTEMİ ---
python3 << 'PYEOF' ... PYEOF  (heredoc)
Patch yaklaşımı: repl() helper (count==1 assert, güvenli)
Kural: Dosyayı okumadan ASLA patch yazma.


========================================
PROJE 2: CLİNİPİPES KLİNİK PORTAL
========================================

REPO     : https://github.com/avciavcig/dental-portal
Prod URL : dental-portal-production-31d7.up.railway.app
DB       : PostgreSQL — turntable.proxy.rlwy.net:55913
Local    : ~/clinic-portal/
Stack    : Node.js + Express + EJS + PostgreSQL

--- ORTAM DEĞİŞKENLERİ ---
PORT              = Railway atar
DATABASE_URL      = PostgreSQL bağlantı string'i
SESSION_SECRET    = express-session secret
MASTER_KEY        = AES-256 şifreleme için master key
ADMIN_SECRET      = /superadmin?key=... girişi
IS_PRODUCTION     = true (Railway'de)
BOOTSTRAP_DEV_OWNER / BOOTSTRAP_DEV_PASSWORD = sadece dev ortamı

--- DOSYA YAPISI ---
server.js                        — Ana uygulama, tüm route'lar ve initDB()
security.js                      — Helmet, CSRF, rate limit, şifreleme yardımcıları
metrics.js                       — SLA hesaplama, dashboard builder, pipeline helpers
super-admin.js                   — Superadmin panel route'ları
views/
  sales.ejs                      — Satışçı özet sayfası (/sales)
  sales-pipeline.ejs             — Kanban board (/sales/pipeline)
  sales-operations.ejs           — Görevler + activity feed (/sales/operations)
  partials/
    sales-header.ejs             — Satış paneli header
    sales-nav.ejs                — Özet / Pipeline / Operasyon nav
    sales-styles.ejs             — Tüm satış paneli CSS (kanban dahil)
    patient-modal.ejs            — Hasta detay modal + tüm JS fonksiyonları
    status-badge.ejs             — Pipeline stage badge
    design-system.ejs            — CSS değişkenleri ve global stiller
    csrf-meta.ejs                — CSRF token meta tag

--- VERİTABANI ŞEMASI (ana tablolar) ---
clinic_settings     — Klinik ayarları, plan, SLA config, iletişim bilgileri
patients            — Hasta kayıtları + pipeline kolonları
doctor_notes        — Doktor notları, tedavi planı, deposit
users               — Kullanıcılar (owner/doctor/satışçı rolleri)
form_fields         — Dinamik form alanları
activity_log        — Pipeline hareket geçmişi
audit_log           — Güvenlik audit log
health_checks       — Sistem sağlık kontrolleri
clinic_keys         — AES-256 per-clinic şifreleme anahtarları
upgrade_requests    — Plan yükseltme talepleri

--- PIPELINE KOLONLARI (Haziran 2026 itibarıyla) ---

patients tablosuna eklenmiş:
  pipeline_stage TEXT DEFAULT 'new_lead'
  stage_entered_at TIMESTAMPTZ
  pipeline_migrated BOOLEAN DEFAULT false
  closedAs TEXT           — 'won' / 'lost' (stage approved/not_suitable'da otomatik set)
  firstContactAt TIMESTAMPTZ
  sentToDoctorAt TIMESTAMPTZ  — awaiting_assessment stage'inde otomatik set
  quoteSentAt TIMESTAMPTZ     — price_offered stage'inde otomatik set
  lastContactAt TIMESTAMPTZ   — her stage değişiminde otomatik set
  nextFollowupAt TIMESTAMPTZ  — (henüz UI yok, ileride datepicker ile)
  lostReason TEXT             — (henüz UI yok, ileride dropdown ile)
  leadTemperature TEXT DEFAULT 'warm'  — (henüz UI yok, ileride badge ile)

doctor_notes tablosuna eklenmiş:
  depositAmount NUMERIC       — (henüz UI yok, doktor formu genişletilecek)
  depositPaidAt TIMESTAMPTZ   — (henüz UI yok)
  quoteValidUntil TIMESTAMPTZ — (henüz UI yok)

clinic_settings SLA kolonları:
  sla_new_lead INTEGER DEFAULT 24
  sla_assessment INTEGER DEFAULT 48
  sla_plan_ready INTEGER DEFAULT 24
  sla_price_offered INTEGER DEFAULT 48
  sla_followup INTEGER DEFAULT 72
  sla_rules JSONB

--- PIPELINE STAGE'LERİ ---
new_lead           → Yeni Lead
awaiting_assessment→ Değerlendirme Bekliyor
plan_ready         → Plan Hazır
extra_info         → Ek Bilgi / Görsel Bekleniyor
price_offered      → Fiyat Teklifi Verildi
followup           → Takipte
approved           → Onaylandı (closedAs='won')
not_suitable       → Uygun Değil (closedAs='lost')

--- ROLLER ---
owner    — Klinik sahibi, tam yetki
doctor   — Doktor, hasta notları + tedavi planı
satışçı  — Satış paneli (/sales), pipeline yönetimi

--- GÜVENLİK MİMARİSİ ---
- Helmet + CSP headers
- express-rate-limit (route bazlı)
- MASTER_KEY ile AES-256 per-clinic şifreleme (clinic_secret_key)
- express-validator input validation
- CSRF token (tüm POST'larda)
- Global error handler
- Sıfır npm audit vulnerability

--- PLAN GATING ---
Başlangıç planı: 30 hasta limiti, 1 kullanıcı
Pro planı       : sınırsız hasta, çoklu kullanıcı, WhatsApp, iletişim görünürlüğü
Superadmin      : /superadmin?key=ADMIN_SECRET → klinik oluştur, plan değiştir

--- SUPERADMIN PANELİ ---
URL: [domain]/superadmin?key=ADMIN_SECRET
İşlevler: Klinik listesi, yeni klinik oluştur, plan değiştir, kullanıcı yönetimi
iyzico webhook → /superadmin/create endpoint'ine bağlanacak (onay bekleniyor)

--- STABLE GIT TAG ---
clinipipesv2  — CRM pipeline çalışmasından önceki stabil baseline
(Yeni tag atılacak: clinipipesv3-crm-pipeline)

--- DEPLOY PROTOKOLÜ ---
git add -A && git commit -m "açıklama" && git push
→ Railway otomatik deploy
→ Railway stall yaşarsa: platform status page kontrol et, kod sorunu değil

--- KOD TESLİM YÖNTEMİ ---
python3 << 'PYEOF' ... PYEOF  (heredoc)
Kural: Dosyayı OKUMADAN patch yazma — bu kural defalarca kan dökerek öğrenildi.
Anchor string'i grep ile doğrula, count==1 assert et, sonra yaz.

--- YAPILACAKLAR (öncelik sırasıyla) ---
1. firstContactAt → hasta ilk açıldığında otomatik set (backend, UI gerektirmez)
2. lostReason UI → "Uygun Değil" kolonuna sürüklenince dropdown modal
3. nextFollowupAt UI → modal'a datepicker input
4. leadTemperature UI → Kanban kart üzerinde sıcak/ılık/soğuk badge
5. depositAmount/depositPaidAt/quoteValidUntil → doktor notu formuna input
6. iyzico webhook entegrasyonu → confirmPurchase() swap (landing)

--- ÖNEMLİ PRENSİPLER ---
- Klinik verisi klinik sahibine aittir, CliniPipes'a değil
- Silme yok, pasif deaktivasyon var (veri saklama yükümlülüğü)
- Her şey multi-tenant: clinic_id her sorguda zorunlu
- Fotoğraflar base64 DB'de (Cloudinary yok, Railway Volume yok)
- iyzico entegrasyonu harici onay bekliyor

========================================
CLAUDE'A NOT (yeni oturumda bu dosyayı okursan)
========================================
- Bu projenin sahibi Gökhan'dır.
- Kod tabanında Cursor ile de çalışmalar yapılmıştır — her zaman dosyayı oku, varsayım yapma.
- Gökhan kısa ve direkt iletişim sever, Türkçe yazışır.
- "Yapıyı bozma" — mevcut çalışan kod her zaman korunur, sadece ekleme yapılır.
- Şüpheli durumlarda önce grep/sed ile oku, sonra yaz.
