# CliniPipes Yasal Metinler — Hukuki Değerlendirme (Taslak)

> **Not:** Bu belge hukuki danışmanlık değildir. Yayına almadan önce bir avukat / KVKK uzmanı ile doğrulanmalıdır.

## Genel sonuç

Mevcut metinler **genel çerçeve olarak makul** ancak Türkiye mevzuatı (KVKK, TKHK / Mesafeli Sözleşmeler, ETK, Tüketici mevzuatı) açısından **tek başına yeterli ve tam uyumlu sayılmaz**. Özellikle **veri sorumlusu kimlik bilgileri**, **sağlık verisi (özel nitelikli kişisel veri)**, **cayma hakkı / dijital hizmet istisnası**, **tüketici uyuşmazlık mercileri** ve **yurt dışı veri aktarımı** konularında eksikler var.

---

## Sayfa bazında durum

| Sayfa | Durum | Özet |
|-------|-------|------|
| Hakkımızda | Düşük risk | Yasal zorunluluk değil; ticari unvan/adres eksikliği güven sorunu |
| KVKK / Gizlilik | **Kritik eksikler** | Veri sorumlusu kimliği yetersiz; sağlık verisi ve rol ayrımı yok; yurt dışı aktarım yok |
| Teslimat ve İade | **Orta–yüksek** | Satıcı kimlik bilgileri eksik; cayma/ön bilgilendirme referansı zayıf |
| Mesafeli Satış | **Kritik eksikler** | Ön bilgilendirme unsurları, cayma istisnası onayı, tüketici hakem heyeti yok |
| Kullanım Koşulları | Orta | B2B/B2C ayrımı yok; sağlık verisi sorumluluğu net değil |
| ETK Metni | **Orta–yüksek** | İYS, izin geri çekme yöntemi, veri sorumlusu kimliği eksik |
| SSS | Düşük risk | Abonelik/iptal tutarlı; “güvenli” ifadesi abartılı olabilir |

---

## Kritik eksikler (öncelik sırasıyla)

### 1. Veri sorumlusu / satıcı kimlik bilgileri
Tüm yasal metinlerde yalnızca **“Nodus Strategy”** ve e-posta var. Mesafeli satış ve KVKK için genelde şunlar gerekir:

- Ticari unvan (ör. Nodus Strategy …)
- Açık adres
- Telefon
- E-posta
- MERSİS no (varsa)
- Vergi dairesi / VKN (B2B faturalama için)

**Aksiyon:** Resmi ticari bilgileri avukat/muhasebeciden alıp tüm metinlere ekleyin.

### 2. Sağlık verisi (KVKK md. 6 — özel nitelikli kişisel veri)
CliniPipes, kliniklerin **hasta sağlık bilgisi, fotoğraf, röntgen** gibi verileri işlemesine aracılık eder. Mevcut KVKK metni bunu **hiç ele almıyor**.

Netleştirilmesi gerekenler:
- CliniPipes abonesi **klinik** hasta verisi için asıl veri sorumlusu mu?
- Nodus Strategy bu verilerde **veri işleyen** mi?
- Özel nitelikli veri için **açık rıza / sağlık hizmeti istisnası** hangi tarafta?
- Saklama, silme, şifreleme (AES-256 iddiası) metinde somutlaştırılmalı

**Risk:** KVKK denetiminde en yüksek risk alanı.

### 3. Yurt dışına veri aktarımı
Altyapı (ör. Railway, bulut, e-posta, ödeme) yurt dışındaysa KVKK md. 9 kapsamında **aktarım şartları** aydınlatma metninde belirtilmeli.

### 4. Mesafeli satış — cayma hakkı (dijital hizmet)
6502 sayılı TKHK ve Mesafeli Sözleşmeler Yönetmeliği uyarınca:
- **14 günlük cayma hakkı** açıklanmalı
- Anında ifa edilen dijital hizmetlerde tüketicinin **cayma hakkını kaybedeceğine dair açık onay** alınması gerekir (Yönetmelik md. 15/ğ)
- Ödeme öncesi **ön bilgilendirme formu** zorunlu unsurları checkout’ta sunulmalı

Mevcut metin “kullanılamayabilir” diyor ama **onay mekanizması ve prosedür** tanımlı değil.

### 5. Tüketici uyuşmazlık mercileri
Mesafeli satış ve teslimat metinlerinde **Tüketici Hakem Heyeti** ve **Tüketici Mahkemesi** bilgisi yok (TKHK md. 68).

### 6. ETK / ticari ileti
- **İYS** (İleti Yönetim Sistemi) kaydı ve ret hakkı kullanım yolu belirtilmeli
- İşlem bildirimi ile **ticari ileti** ayrımı yapılmalı
- “Onay alınır” deniyor; **hangi kanaldan, nasıl geri çekilir** net değil

### 7. Çerez politikası
KVKK metninde 2 cümle var; pratikte **ayrı Çerez Politikası** veya detaylı bölüm önerilir (zorunlu / analitik / tercih çerezleri).

---

## Orta seviye eksikler

- **B2B / B2C ayrımı:** Kliniklere satış çoğunlukla ticari; tüketici hükümleri her alıcıya uygulanmayabilir. Metinler bunu netleştirmeli.
- **Ön bilgilendirme ↔ Mesafeli sözleşme ↔ Teslimat** arasında çapraz referans zayıf.
- **Kurulum ücreti** SSS’te belirsiz; landing’de fiyat var — tutarlılık iyi olur.
- **GDPR:** AB’den hasta formu dolduran kişiler için klinik veri sorumlusu GDPR’a tabi olabilir; CliniPipes landing metni en azından “kliniklerin kendi yükümlülükleri”ne atıf yapmalı.

---

## Hakkımızda & SSS

Bu sayfalar doğrudan yasal yükümlülük metni değil. Hakkımızda’ya ticari kimlik eklenmesi **güven** için önerilir. SSS’teki “Verilerim güvende mi? — Evet” ifadesi mutlak garanti gibi okunabilir; **“gerekli teknik ve idari tedbirler alınmaktadır”** şeklinde yumuşatılması daha güvenli.

---

## Önerilen uygulama sırası (yayın öncesi)

1. Resmi şirket bilgilerini netleştirin
2. KVKK metnini sağlık verisi + veri işleyen rolü + yurt dışı aktarım ile güncelleyin
3. Mesafeli satış + ön bilgilendirme + checkout onay kutularını uyumlu hale getirin
4. ETK metnini İYS / ret yolu ile güçlendirin
5. Avukat incelemesi
6. Sonra HTML dosyalarına uygulayın

---

## Hazırlanan taslak dosyalar

| Dosya | İçerik |
|-------|--------|
| `01-gizlilik-TASLAK.md` | Güncellenmiş KVKK + Gizlilik |
| `02-mesafeli-satis-TASLAK.md` | Güncellenmiş Mesafeli Hizmet Sözleşmesi |
| `03-teslimat-TASLAK.md` | Güncellenmiş Teslimat ve İade |
| `04-kullanim-kosullari-TASLAK.md` | Güncellenmiş Kullanım Koşulları |
| `05-etk-TASLAK.md` | Güncellenmiş ETK Metni |
| `06-on-bilgilendirme-TASLAK.md` | Checkout için Ön Bilgilendirme Formu (yeni) |
| `07-hakkimizda-TASLAK.md` | Hakkımızda (kimlik bilgili) |

**Mevcut HTML dosyaları değiştirilmedi.**
