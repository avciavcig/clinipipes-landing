#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'legal-seller.json'), 'utf8'));

const CSS = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,sans-serif;font-size:.96rem;background:#FAFAF8;color:#0E0E0C;line-height:1.75}.container{max-width:760px;margin:0 auto;padding:4rem 2rem}h1{font-size:1.9rem;margin-bottom:.4rem;font-weight:700}h2{font-size:1.05rem;font-weight:600;margin:1.8rem 0 .5rem;color:#333}p,li{margin-bottom:.75rem;color:#3D3D3A}ul{padding-left:1.4rem;margin-bottom:1rem}a{color:#1D9E75}.back{display:inline-block;margin-bottom:2rem;color:#1D9E75;text-decoration:none;font-size:.88rem}.date{color:#888;font-size:.83rem;margin-bottom:2rem;display:block}.seller-box{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin:1rem 0 1.5rem;font-size:.92rem}`;

function page(title, body) {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title} — CliniPipes</title><style>${CSS}</style></head><body><div class="container"><a href="/" class="back">← Ana Sayfa</a>${body}</div></body></html>`;
}

function sellerBlock() {
  let h = `<div class="seller-box"><strong>Satıcı / Veri Sorumlusu:</strong> ${S.sellerName} (${S.sellerType})<br>`;
  h += `<strong>Marka:</strong> ${S.brand}<br>`;
  h += `<strong>Adres:</strong> ${S.address}<br>`;
  if (S.phone) h += `<strong>Telefon:</strong> ${S.phone}<br>`;
  h += `<strong>E-posta:</strong> <a href="mailto:${S.email}">${S.email}</a><br>`;
  if (S.taxOffice && S.taxNumber) h += `<strong>Vergi Dairesi / No:</strong> ${S.taxOffice} — ${S.taxNumber}<br>`;
  else if (S.taxNumber) h += `<strong>Vergi No:</strong> ${S.taxNumber}<br>`;
  if (S.mersis) h += `<strong>MERSİS:</strong> ${S.mersis}<br>`;
  h += `</div>`;
  return h;
}

const pages = {
  'hakkimizda.html': page('Hakkımızda', `
<h1>Hakkımızda</h1>
<p>CliniPipes, uluslararası hasta hizmetleri sunan sağlık kuruluşlarının satış, hasta yönetimi ve operasyon süreçlerini dijitalleştirmek amacıyla geliştirilmiş bulut tabanlı bir platformdur.</p>
<p>Birçok sağlık kuruluşu hasta taleplerini, satış süreçlerini, teklif hazırlıklarını ve operasyon takibini farklı sistemler, Excel dosyaları ve mesajlaşma uygulamaları üzerinden yönetmektedir. CliniPipes bu süreçleri tek platform altında birleştirir.</p>
<h2>Misyonumuz</h2>
<p>Sağlık kuruluşlarının hasta kazanımı, satış yönetimi ve operasyon süreçlerini sadeleştirerek ekiplerin daha verimli çalışmasını sağlamak.</p>
<h2>Ürünümüz</h2>
<ul><li>Hasta ve lead yönetimi</li><li>Satış süreçlerinin takibi</li><li>Doktor ve ekip yönetimi</li><li>Dijital form ve doküman yönetimi</li><li>PDF teklif oluşturma</li><li>Operasyon ve süreç takibi</li><li>Performans raporlama</li></ul>
<h2>Vizyonumuz</h2>
<p>Sağlık kuruluşlarının uluslararası hasta süreçlerini verimli yönetmelerini sağlayan güvenilir bir teknoloji platformu olmak.</p>
<h2>İletişim</h2>
${sellerBlock()}`),

  'gizlilik.html': page('Gizlilik Politikası ve KVKK', `
<h1>Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
<p class="date">Son Güncelleme: ${S.updated}</p>
<h2>1. Veri Sorumlusu</h2>
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) kapsamında kişisel verileriniz aşağıdaki veri sorumlusu tarafından işlenmektedir:</p>
${sellerBlock()}
<h2>2. İşlenen Kişisel Veriler</h2>
<p><strong>2.1. CliniPipes aboneleri (klinik / işletme kullanıcıları):</strong> Kimlik ve iletişim bilgileri, kurum bilgileri, fatura/abonelik/ödeme bilgileri, hesap bilgileri, IP/cihaz/log kayıtları, destek kayıtları.</p>
<p><strong>2.2. Klinikler tarafından platforma girilen hasta / lead verileri:</strong> Kimlik, iletişim, sağlık geçmişi, tedavi talebi, fotoğraf/röntgen, form yanıtları ve onay kayıtları.</p>
<p><strong>Önemli:</strong> Hasta verileri bakımından asıl <strong>veri sorumlusu ilgili sağlık kuruluşudur (klinik)</strong>. ${S.sellerName}, bu veriler bakımından KVKK kapsamında <strong>veri işleyen</strong> sıfatıyla hareket eder. Özel nitelikli kişisel veriler (sağlık verisi), hizmetin sunulması, sözleşmenin ifası ve ilgili mevzuata uygun açık rıza/istisnai hükümler kapsamında işlenir.</p>
<h2>3. İşlenme Amaçları</h2>
<p>Hesap yönetimi, SaaS hizmetinin sunulması, abonelik/faturalandırma/ödeme, teknik destek, bilgi güvenliği, hukuki yükümlülükler, mevzuat kaynaklı saklama ve (açık rıza halinde) ticari iletişim.</p>
<h2>4. Hukuki Sebepler</h2>
<p>KVKK md. 5 ve md. 6 kapsamında; sözleşmenin kurulması/ifası, hukuki yükümlülük, hak tesisi/korunması, meşru menfaat, kanuni zorunluluk ve gerektiğinde açık rıza.</p>
<h2>5. Aktarım</h2>
<p>Ödeme kuruluşları (iyzico), bulut altyapı sağlayıcıları (yurt dışı barındırma dahil), e-posta/bildirim servisleri, muhasebe hizmeti verenler ve hukuken yetkili mercilerle, hizmet için gerekli ölçüde paylaşılabilir.</p>
<p><strong>Yurt dışına aktarım:</strong> Altyapının yurt dışında konumlanması halinde KVKK md. 9 uyarınca yeterli koruma, taahhütname veya açık rıza gibi uygun güvenceler sağlanır.</p>
<h2>6. Veri Güvenliği</h2>
<p>Erişim kontrolü, rol bazlı yetkilendirme, şifreleme, güvenli sunucu, loglama, yedekleme ve güvenlik güncellemeleri uygulanır.</p>
<h2>7. Saklama Süresi</h2>
<p>Hizmet ilişkisi, mevzuat ve uyuşmazlık süreleri boyunca; sonrasında silme/yok etme/anonimleştirme.</p>
<h2>8. KVKK md. 11 Hakları</h2>
<p>İşlenip işlenmediğini öğrenme, bilgi talebi, amacı öğrenme, aktarılan üçüncü kişileri bilme, düzeltme, silme/yok etme, itiraz ve zarar giderimi talep etme haklarına sahipsiniz.</p>
<h2>9. Başvuru</h2>
<p>Taleplerinizi <a href="mailto:${S.email}">${S.email}</a> adresine iletebilirsiniz. Kimlik doğrulama istenebilir. Başvurular en geç 30 gün içinde sonuçlandırılır.</p>
<h2>10. Çerezler</h2>
<p>Zorunlu, güvenlik ve (varsa) analitik çerezler kullanılabilir. Tarayıcı ayarlarından tercihlerinizi yönetebilirsiniz.</p>
<h2>11. Değişiklikler</h2>
<p>Güncel metin web sitesinde yayımlandığı tarihte yürürlüğe girer.</p>`),

  'teslimat.html': page('Teslimat ve İade Koşulları', `
<h1>Teslimat ve İade Koşulları</h1>
<p class="date">Son Güncelleme: ${S.updated}</p>
${sellerBlock()}
<h2>1. Hizmetin Niteliği</h2>
<p>CliniPipes bulut tabanlı yazılım hizmetidir (SaaS). Fiziksel ürün teslimatı yapılmaz.</p>
<h2>2. Teslimat</h2>
<p>Ödeme onayı sonrası kullanıcı hesabı oluşturulur; erişim bilgileri elektronik ortamda iletilir. Normal koşullarda aynı iş günü içinde erişim sağlanır.</p>
<h2>3. Abonelik</h2>
<p>Abonelik modeliyle sunulur. Süre sonunda yenileme gerekir.</p>
<h2>4. İptal</h2>
<p>Abonelik dilediğiniz zaman iptal edilebilir. Mevcut dönem sonuna kadar erişim devam eder; kullanılmayan süre için kısmi iade yapılmaz.</p>
<h2>5. İade</h2>
<p>Erişim sağlandıktan ve hizmet kullanılmaya başlandıktan sonra genel kural olarak ücret iadesi yapılmaz. Mükerrer ödeme, hatalı tahsilat, teknik nedenle hizmetin sunulamaması hallerinde talep <a href="mailto:${S.email}">${S.email}</a> üzerinden değerlendirilir.</p>
<h2>6. Cayma Hakkı</h2>
<p>6502 sayılı Kanun kapsamındaki 14 günlük cayma hakkı, dijital hizmetin anında ifasına açık onay verilmesi halinde kaybedilebilir. Ayrıntılar <a href="/mesafeli-satis">Mesafeli Hizmet Sözleşmesi</a>’nde düzenlenmiştir.</p>
<h2>7. Hizmet Sürekliliği</h2>
<p>Bakım ve güvenlik güncellemeleri nedeniyle planlı kesintiler olabilir; mümkün olduğunca önceden bilgilendirilir.</p>
<h2>8. Tüketici Uyuşmazlıkları</h2>
<p>Tüketici işlemlerinde parasal sınırlara tabi olarak Tüketici Hakem Heyetleri ve Tüketici Mahkemeleri’ne başvurulabilir.</p>
<h2>9. Değişiklikler</h2>
<p>Güncel metin web sitesinde yayımlandığı tarihte yürürlüğe girer.</p>`),

  'mesafeli-satis.html': page('Mesafeli Hizmet Sözleşmesi', `
<h1>Mesafeli Hizmet Sözleşmesi</h1>
<p class="date">Son Güncelleme: ${S.updated}</p>
<h2>1. Taraflar</h2>
${sellerBlock()}
<p><strong>Müşteri:</strong> Platform üzerinden hizmet satın alan gerçek veya tüzel kişi.</p>
<p>6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında elektronik ortamda kurulmuştur.</p>
<h2>2. Konu</h2>
<p>CliniPipes bulut yazılım aboneliğinin satın alınması, erişiminin sağlanması ve kullanımına ilişkin hak ve yükümlülükler.</p>
<h2>3. Hizmet Kapsamı</h2>
<p>Hasta/lead yönetimi, satış takibi, form yönetimi, PDF teklif, ekip yönetimi, operasyon takibi ve raporlama modülleri. Kapsam satın alınan pakete göre değişir.</p>
<h2>4. Ücret ve Ödeme</h2>
<p>Güncel fiyatlar web sitesinde ilan edilir. Ödeme iyzico veya ilan edilen güvenli yöntemlerle tahsil edilir.</p>
<h2>5. Hizmetin İfası</h2>
<p>Ödeme sonrası hesap oluşturulur; erişim genellikle aynı iş günü sağlanır.</p>
<h2>6. Abonelik Süresi</h2>
<p>Satın alınan dönem boyunca geçerlidir; yenileme gerekir.</p>
<h2>7. Cayma Hakkı ve İade</h2>
<p>Müşteri, hizmetin ifasına başlanmadan önce 14 gün içinde cayma hakkına sahip olabilir. Dijital hizmetin derhal ifasına açık onay verilmesi halinde cayma hakkı kaybedilebilir. Mükerrer ödeme, teknik hata veya hizmetin sunulamaması ayrıca değerlendirilir.</p>
<h2>8. Müşteri Yükümlülükleri</h2>
<p>Hesap güvenliği, hukuka uygun kullanım, platforma yüklenen hasta verilerinde gerekli aydınlatma/rızaların alınması (klinik veri sorumlusu olarak).</p>
<h2>9. Hizmet Sağlayıcı Yükümlülükleri</h2>
<p>Hizmeti sözleşmeye uygun sunmak, makul güvenlik tedbirleri almak, yasal yükümlülüklere uymak, teknik destek sağlamak.</p>
<h2>10. Kişisel Veriler</h2>
<p><a href="/gizlilik">KVKK Aydınlatma Metni</a> işbu sözleşmenin ayrılmaz parçasıdır.</p>
<h2>11. Fikri Mülkiyet</h2>
<p>CliniPipes yazılımı ve markası Hizmet Sağlayıcı’ya aittir; Müşteri’ye süreli kullanım hakkı verilir.</p>
<h2>12. Sorumluluğun Sınırı</h2>
<p>Müşteri kaynaklı veri hataları, üçüncü taraf altyapı kesintileri ve mücbir sebep hallerinde, emredici hükümler saklı kalmak kaydıyla sorumluluk sınırlıdır.</p>
<h2>13. Uyuşmazlık</h2>
<p>Tüketici işlemlerinde Tüketici Hakem Heyetleri / Tüketici Mahkemeleri (sınırlara tabi). Diğer uyuşmazlıklarda İzmir Mahkemeleri ve İcra Daireleri yetkilidir.</p>
<h2>14. Yürürlük</h2>
<p>Müşteri siparişi onaylayarak <a href="/on-bilgilendirme">Ön Bilgilendirme Formu</a>’nu ve bu sözleşmeyi kabul eder.</p>`),

  'kullanim-kosullari.html': page('Kullanım Koşulları', `
<h1>Kullanım Koşulları</h1>
<p class="date">Son Güncelleme: ${S.updated}</p>
${sellerBlock()}
<h2>1. Kapsam</h2>
<p>CliniPipes platformunu kullanan tüm kullanıcılar için geçerlidir.</p>
<h2>2. Hizmet</h2>
<p>Bulut tabanlı SaaS; özellikler pakete göre değişebilir.</p>
<h2>3. Hesap Güvenliği</h2>
<p>Kullanıcı hesap bilgilerinin gizliliğinden sorumludur.</p>
<h2>4. Klinik Veri Sorumluluğu</h2>
<p>Klinik kullanıcıları platforma yükledikleri hasta verileri bakımından veri sorumlusudur. CliniPipes veri işleyen konumundadır.</p>
<h2>5. Yasaklı Kullanımlar</h2>
<p>Hukuka aykırı içerik, yetkisiz erişim, zararlı yazılım, sistem manipülasyonu ve izinsiz yeniden satış yasaktır.</p>
<h2>6. Fikri Mülkiyet</h2>
<p>Platform, marka ve içerikler korunmaktadır; yalnızca abonelik süresince sınırlı kullanım hakkı verilir.</p>
<h2>7. Sorumluluk</h2>
<p>Emredici hükümler saklı kalmak kaydıyla, kullanıcı veri girişi hataları ve altyapı kesintilerinden doğan dolaylı zararlardan sorumluluk sınırlıdır.</p>
<h2>8. Gizlilik</h2>
<p><a href="/gizlilik">KVKK Aydınlatma Metni</a> geçerlidir.</p>
<h2>9. Uyuşmazlık</h2>
<p>Türkiye Cumhuriyeti kanunları; tüketici mercileri ve İzmir Mahkemeleri (bkz. Mesafeli Sözleşme).</p>
<h2>10. İletişim</h2>
<p><a href="mailto:${S.email}">${S.email}</a></p>`),

  'etk.html': page('ETK Metni', `
<h1>Elektronik Ticari İleti Aydınlatma Metni</h1>
<p class="date">Son Güncelleme: ${S.updated}</p>
${sellerBlock()}
<p>6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun kapsamında hazırlanmıştır.</p>
<h2>1. Kapsam</h2>
<p>Ürün güncellemeleri, kampanya duyuruları, eğitim/etkinlik bilgilendirmeleri gibi <strong>ticari iletiler</strong> e-posta, SMS veya telefon ile gönderilebilir.</p>
<p>Fatura, şifre sıfırlama, hesap aktivasyonu gibi <strong>işlem bildirimleri</strong> ticari ileti sayılmaz.</p>
<h2>2. Onay ve İYS</h2>
<p>Ticari ileti yalnızca açık onay alındıktan sonra gönderilir. Kayıtlar İleti Yönetim Sistemi (İYS) mevzuatına uygun tutulur.</p>
<h2>3. Onayın Geri Alınması</h2>
<p>E-postalardaki abonelikten çık linki, <a href="mailto:${S.email}">${S.email}</a> adresine talep veya İYS üzerinden ret hakkınızı kullanabilirsiniz. Ret talepleri en geç 3 iş günü içinde işleme alınır.</p>
<h2>4. KVKK</h2>
<p>İletişim bilgileriniz <a href="/gizlilik">KVKK Aydınlatma Metni</a> kapsamında işlenir.</p>`),

  'on-bilgilendirme.html': page('Ön Bilgilendirme Formu', `
<h1>Ön Bilgilendirme Formu</h1>
<p class="date">Mesafeli Sözleşmeler Yönetmeliği kapsamında ödeme öncesi sunulur.</p>
${sellerBlock()}
<p><strong>Hizmet:</strong> CliniPipes bulut yazılım aboneliği (opsiyonel kurulum hizmeti dahil olabilir)</p>
<p><strong>Seçilen paket / dönem / bedel:</strong> Sipariş ekranında gösterilir (vergiler dahil/hariç durumu fiyatlandırmada belirtilir).</p>
<p><strong>Ödeme:</strong> iyzico / kredi kartı</p>
<p><strong>Teslimat:</strong> Ödeme sonrası aynı gün dijital erişim (e-posta ile hesap bilgileri)</p>
<p><strong>Cayma hakkı:</strong> 14 gün — dijital hizmetin derhal ifasına onay vermeniz halinde cayma hakkınızı kaybedeceğinizi kabul edersiniz.</p>
<p><strong>İptal / iade:</strong> Abonelik dönem sonunda iptal; kullanılmayan süre iadesi yok (<a href="/teslimat">Teslimat ve İade</a>).</p>
<p><strong>Uyuşmazlık:</strong> Tüketici Hakem Heyeti / Tüketici Mahkemesi (sınırlara tabi)</p>
<p><strong>Politikalar:</strong> <a href="/mesafeli-satis">Mesafeli Hizmet Sözleşmesi</a>, <a href="/gizlilik">KVKK</a>, <a href="/kullanim-kosullari">Kullanım Koşulları</a></p>`),

  'sss.html': page('Sıkça Sorulan Sorular', `
<h1>Sıkça Sorulan Sorular</h1>
<p><strong>CliniPipes nedir?</strong></p><p>Sağlık kuruluşlarının hasta yönetimi, satış ve operasyon takibini tek platformda sunan bulut tabanlı yazılımdır.</p><hr>
<p><strong>CliniPipes hangi kurumlar için uygundur?</strong></p><p>Sağlık turizmi klinikleri, tıp merkezleri ve uluslararası hasta süreçlerini yöneten kuruluşlar.</p><hr>
<p><strong>Kurulum ne kadar sürer?</strong></p><p>Standart kurulumlar genellikle 1 iş günü içinde tamamlanır.</p><hr>
<p><strong>Verilerim güvende mi?</strong></p><p>CliniPipes, kişisel verilerin korunması için gerekli teknik ve idari tedbirleri uygular. Hasta verileri bakımından asıl veri sorumlusu kliniktir; ayrıntılar <a href="/gizlilik">KVKK metninde</a>.</p><hr>
<p><strong>Aboneliğimi iptal edebilir miyim?</strong></p><p>Evet. Mevcut dönem sonuna kadar erişim devam eder; kullanılmayan süre iadesi yapılmaz.</p><hr>
<p><strong>İletişim?</strong></p><p><a href="mailto:${S.email}">${S.email}</a></p>`),
};

for (const [file, html] of Object.entries(pages)) {
  fs.writeFileSync(path.join(ROOT, file), html, 'utf8');
  console.log('wrote', file);
}
