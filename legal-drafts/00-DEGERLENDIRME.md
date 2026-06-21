# CliniPipes Yasal Metinler — Durum (Haziran 2026)

> **Not:** Bu belge hukuki danışmanlık değildir. Yayına almadan önce bir avukat / KVKK uzmanı ile doğrulanmalıdır.

## Güncel durum

Landing yasal sayfaları `scripts/legal-content.mjs` + `scripts/build-legal-pages.mjs` ile üretilir. `npm run build:legal` komutu HTML dosyalarını günceller.

Satıcı bilgileri: `legal-seller.json`

## Temel hukuki model

| Konu | Düzenleme |
|------|-----------|
| CliniPipes rolü | Yazılım sağlayıcı (SaaS); **hasta verisi toplayıcısı değil** |
| Hasta / sağlık verisi | Veri sorumlusu: **klinik (Müşteri)** |
| CliniPipes (hasta verisi) | Veri sorumlusu **değil**; sınırlı **veri işleyen** (teknik sunum) |
| Abone / sipariş verisi | Veri sorumlusu: **Gökhan AVCI** |
| Sağlık hizmeti | Sunulmaz; tıbbi sorumluluk kliniğe aittir |

## Sayfalar

| Dosya | Açıklama |
|-------|----------|
| `veri-rolu.html` | Veri koruma, rol ayrımı, tazminat, sorumluluk sınırı |
| `gizlilik.html` | KVKK — abone/ziyaretçi + hasta verisi ayrımı |
| `cerez-politikasi.html` | Çerez politikası |
| `kullanim-kosullari.html` | Kullanım koşulları + klinik yükümlülükleri |
| `mesafeli-satis.html` | Mesafeli hizmet sözleşmesi |
| `on-bilgilendirme.html` | Ön bilgilendirme formu |
| `teslimat.html` | Teslimat ve iade |
| `etk.html` | ETK metni |
| `hakkimizda.html` | Hakkımızda |
| `sss.html` | SSS |

## Checkout onay kutuları

- Ön bilgilendirme
- Mesafeli sözleşme
- Kullanım koşulları + Veri koruma / rol ayrımı
- Dijital hizmet derhal ifa / cayma hakkı kaybı
- KVKK aydınlatma

## Avukat incelemesinde netleştirilmesi önerilenler

1. **Ticari unvan:** Şahıs mı, şirket mi — `legal-seller.json` sellerType
2. **MERSİS / KEP** (varsa)
3. **VERBİS** kaydı gerekliliği
4. **İYS** kaydı (ETK ticari ileti)
5. **Yurt dışı aktarım** güvenceleri (Railway, e-posta, iyzico lokasyonları)
6. **B2B vs tüketici** — klinik alıcılarının ticari sıfatı
7. **GDPR** — AB’den form dolduran hastalar için klinik yükümlülükleri (landing’de atıf var)

## Komut

```bash
npm run build:legal
```

`legal-seller.json` değiştikten sonra mutlaka çalıştırın.
