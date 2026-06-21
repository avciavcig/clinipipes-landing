/** CliniPipes yasal metin gövdeleri — scripts/build-legal-pages.mjs tarafından HTML'e dönüştürülür. */

export function sellerBlock(S) {
  const type = S.sellerType ? ` (${S.sellerType})` : '';
  let h = `<div class="seller-box"><strong>Hizmet Sağlayıcı / Satıcı:</strong> ${S.sellerName}${type}<br>`;
  h += `<strong>Marka:</strong> ${S.brand}<br>`;
  h += `<strong>Adres:</strong> ${S.address}<br>`;
  if (S.phone) h += `<strong>Telefon:</strong> ${S.phone}<br>`;
  h += `<strong>E-posta:</strong> <a href="mailto:${S.email}">${S.email}</a><br>`;
  if (S.taxOffice && S.taxNumber) {
    h += `<strong>Vergi Dairesi / No:</strong> ${S.taxOffice} — ${S.taxNumber}<br>`;
  } else if (S.taxNumber) h += `<strong>Vergi / T.C. Kimlik No:</strong> ${S.taxNumber}<br>`;
  if (S.mersis) h += `<strong>MERSİS:</strong> ${S.mersis}<br>`;
  h += `</div>`;
  return h;
}

export function legalNotice() {
  return `<div class="legal-notice"><strong>Önemli:</strong> Bu metinler CliniPipes SaaS hizmeti için hazırlanmıştır; emredici kanun hükümleri saklıdır. Avukat incelemesi yine de önerilir. Metinler; <strong>rol ayrımı</strong> (hasta verisinde sorumluluk klinikte), <strong>sorumluluk sınırı</strong>, <strong>tazminat</strong> ve <strong>sağlık hizmeti sunulmadığı</strong> ilkelerini açıkça düzenlemeyi amaçlar.</div>`;
}

export function medicalDisclaimer() {
  return `
<p>CliniPipes <strong>sağlık kuruluşu değildir</strong>; tıbbi teşhis, tedavi, reçete, acil müdahale veya sağlık danışmanlığı <strong>sunmaz ve sunamaz</strong>. Platformdaki içerik, form alanları, PDF teklif şablonları ve raporlar yalnızca idari/operasyonel amaçlıdır; tıbbi karar niteliği taşımaz. Tüm klinik, etik ve mesleki sorumluluk <strong>Müşteri / Klinik</strong>’e aittir.</p>`;
}

export function warrantyDisclaimer() {
  return `
<p>Hizmet, emredici hükümler saklı kalmak kaydıyla, <strong>“olduğu gibi”</strong> ve <strong>“mevcut hâliyle”</strong> sunulur. CliniPipes; Müşteri’nin mevzuata (KVKK, GDPR, sağlık mevzuatı, reklam/tüketici kuralları vb.) uyumunu, hasta sonuçlarını, ticari başarısını veya kesintisiz çalışmayı <strong>garanti etmez</strong>. Yazılımın Müşteri’nin özel beklentilerini karşılayacağına dair zımni garanti verilmez.</p>`;
}

export function forceMajeure() {
  return `
<p>Taraflar; doğal afet, savaş, salgın, grev, kamu otoritesi kararı, enerji/altyapı kesintisi, internet omurga arızası, siber saldırı (makul önlemlere rağmen), barındırma/ödeme/iletişim sağlayıcı kesintileri ve kontrol dışı diğer olaylardan doğan gecikme veya ifa edilememeden, gerekli özeni göstermiş olmak kaydıyla sorumlu tutulamaz.</p>`;
}

export function b2bAcknowledgment() {
  return `
<p>CliniPipes ağırlıklı olarak <strong>sağlık kuruluşları ve ticari işletmelere</strong> yöneliktir. Müşteri, siparişi klinik/kurum adına veren kişinin <strong>yetkili temsilci</strong> olduğunu; kurumun veri sorumlusu sıfatını kabul ettiğini ve (tüketici niteliği taşıması halinde) emredici tüketici hükümlerinin saklı olduğunu beyan eder.</p>`;
}

export function liabilityCap() {
  return `
<p><strong>8.1. Sorumluluk tavanı.</strong> Emredici kanun hükümleri saklı kalmak kaydıyla; Hizmet Sağlayıcı’nın işbu sözleşmeden, haksız fiilden, kusurdan veya sair sebeplerden doğan <strong>toplam</strong> sorumluluğu, talebe konu olaydan önceki <strong>son 12 ayda Müşteri tarafından Hizmet Sağlayıcı’ya fiilen ödenen net hizmet bedeli</strong> ile sınırlıdır.</p>
<p><strong>8.2. Hariç tutulan zararlar.</strong> Hiçbir hâlde; dolaylı zarar, kar kaybı, gelir kaybı, itibar kaybı, veri kaybı veya bozulması (Müşteri’nin düzenli yedek/export yükümlülüğü saklı), iş kesintisi, üçüncü kişi talepleri, idari para cezası, cezai şart, manevi tazminat veya örnek niteliğinde tazminat talep edilemez.</p>
<p><strong>8.3. Klinik kaynaklı talepler.</strong> Müşteri’nin veri sorumluluğu, eksik aydınlatma/rıza, sağlık verisi işleme, tıbbi içerik, hasta iletişimi, personel ihlali, hukuka aykırı kullanım veya platforma yüklenen içerikten doğan talepler <strong>bu sınırın dışında değerlendirilmez</strong> — bu talepler Müşteri’nin tazminat yükümlülüğü kapsamındadır (bkz. Tazminat maddesi).</p>
<p><strong>8.4. Üçüncü taraf hizmetler.</strong> Barındırma, ödeme, e-posta, SMS, WhatsApp/Telegram API ve benzeri üçüncü taraf kesintilerinden Hizmet Sağlayıcı sorumlu değildir.</p>
<p><strong>8.5. Kasıt ve ağır kusur.</strong> Hizmet Sağlayıcı’nın kasıtı veya ağır kusuru hallerinde emredici kanun uyarınca sorumluluk sınırı uygulanmayabilir.</p>`;
}

export function indemnificationClause(S) {
  return `
<p><strong>9.1. Genel tazminat.</strong> Müşteri; aşağıdaki konulardan kaynaklanan veya bunlarla bağlantılı her türlü üçüncü kişi talebi, idari soruşturma, veri koruma otoritesi (KVKK Kurumu, AB denetim otoriteleri vb.) işlemi, dava, zarar, ceza, masraf (makul avukatlık ve vekalet ücretleri dahil) nedeniyle Hizmet Sağlayıcı’nın uğradığı zararı <strong>derhal tazmin etmeyi, savunmayı ve beri kılmayı</strong> kabul eder:</p>
<ul>
  <li>Müşteri’nin <strong>veri sorumlusu</strong> sıfatıyla yürüttüğü tüm kişisel veri işleme faaliyetleri (sağlık verisi / özel nitelikli veri dahil)</li>
  <li>Eksik veya hatalı aydınlatma, rıza, opt-in, çerez/onay metinleri</li>
  <li>Hasta/aday formları, PDF teklifler, e-posta/SMS/WhatsApp mesajları ve klinik personelinin iletişimleri</li>
  <li>Tıbbi değerlendirme, teklif, fiyatlandırma, tanı/tedavi iddiası veya sağlık sonucu taahhüdü</li>
  <li>CliniPipes’ın veri sorumlusu veya sağlık hizmeti sağlayıcısı gibi gösterilmesi</li>
  <li>Platforma yüklenen içerik, görüntü, marka ihlali veya üçüncü kişi hak ihlali</li>
  <li>Personel/alt kullanıcı hesaplarının kötüye kullanımı</li>
  <li>Mevzuata aykırı reklam, sağlık turizmi veya tüketici uygulamaları</li>
  <li>Müşteri talimatına aykırı olmayan teknik barındırma dışında, Müşteri kaynaklı uyumsuzluk iddiaları</li>
</ul>
<p><strong>9.2. Bildirim.</strong> Hizmet Sağlayıcı, talebi makul sürede Müşteri’ye iletir; Müşteri savunmada iş birliği yapar.</p>
<p><strong>9.3. Sınır.</strong> Tazminat yükümlülüğü, Hizmet Sağlayıcı’nın <strong>kasıt veya ağır kusurundan</strong> doğrudan ve somut olarak kaynaklanan zararlar için tersine çevrilemez.</p>`;
}

export function clinicDataDuties() {
  return `
<ul>
  <li>Kendi adına hasta/aday verisi işleyen <strong>münhasır veri sorumlusu</strong> olduğunu kabul eder; CliniPipes’ın bu verilerde veri sorumlusu olmadığını bilir.</li>
  <li>6698 sayılı KVKK, GDPR (uygulanabildiği ölçüde), sağlık mevzuatı ve ilgili tüm düzenlemelere <strong>kendi adına</strong> uymakla yükümlüdür.</li>
  <li>Özel nitelikli kişisel veri (sağlık verisi) için gerekli <strong>aydınlatma, açık rıza veya istisnai hukuki sebep</strong> şartlarını sağlar.</li>
  <li>Hasta/aday formlarında, web sitesinde, PDF’lerde ve iletişim kanallarında <strong>kendi unvanını, iletişim bilgisini ve gizlilik metnini</strong> kullanır; CliniPipes’ı veri sorumlusu veya sağlık hizmeti sağlayıcısı olarak göstermez.</li>
  <li>Platforma yalnızca <strong>hukuka uygun</strong> elde edilmiş veri girer; sahte, yanıltıcı veya yetkisiz veri yüklemekten kaçınır.</li>
  <li>Personel erişimlerini rol bazlı yönetir; ayrılan personelin erişimini kapatır; şifre paylaşımını yasaklar.</li>
  <li>Düzenli veri yedekleme/export alır; fesih sonrası veri kaybı riskini kendisi yönetir.</li>
  <li>Veri ihlali şüphesinde <strong>önce kendi yükümlülükleri</strong> kapsamında mercilere bildirim yapar ve eş zamanlı Hizmet Sağlayıcı’yı bilgilendirir.</li>
  <li>AB/UK ve diğer ülkelerden gelen hastalar için <strong>uluslararası aktarım</strong> yükümlülüklerini kendi adına yerine getirir.</li>
  <li>CliniPipes’ın yalnızca <strong>yazılım lisansı</strong> verdiğini; uyum denetimi veya hukuki danışmanlık vermediğini kabul eder.</li>
</ul>`;
}

export function roleSummary(S) {
  return `
<h2>Veri koruma — temel ilke</h2>
<div class="role-box">
<p><strong>CliniPipes hasta verisi toplayan bir uygulama değildir.</strong> CliniPipes; sağlık kuruluşlarına (kliniklere) yönelik <strong>bulut tabanlı yazılım (SaaS)</strong> lisansı sunar. Hasta ve aday kişisel verileri — sağlık verisi dahil — <strong>klinik tarafından</strong>, kliniğin kendi operasyonel süreçleri kapsamında, kliniğe tahsis edilen şifreli bulut ortamına kaydedilir. CliniPipes bu verileri <strong>kendi adına toplamaz, profillemez, pazarlama amacıyla kullanmaz veya üçüncü taraflara satmaz</strong>.</p>
<ul>
  <li><strong>Hasta / aday verileri:</strong> KVKK md. 3 uyarınca <strong>veri sorumlusu ilgili sağlık kuruluşudur (Müşteri / Klinik)</strong>. CliniPipes bu veriler bakımından <strong>veri sorumlusu değildir</strong>; yalnızca klinik talimatları ve sözleşme kapsamında sınırlı <strong>veri işleyen</strong> konumundadır.</li>
  <li><strong>Abone / ziyaretçi verileri:</strong> Web sitesi, sipariş, fatura ve hesap açılışına ilişkin veriler bakımından <strong>veri sorumlusu ${S.sellerName}</strong>’dir.</li>
  <li><strong>Sağlık hizmeti:</strong> CliniPipes tıbbi teşhis, tedavi veya sağlık danışmanlığı sunmaz; tüm klinik kararlar kliniğin sorumluluğundadır.</li>
</ul>
<p>Ayrıntılı rol ayrımı için <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a> metnine bakınız.</p>
</div>`;
}

export function consumerDispute() {
  return `
<p>Müşteri’nin <strong>tüketici</strong> sıfatıyla işlem yaptığı hallerde, parasal sınırlara tabi olarak il/ilçe Tüketici Hakem Heyetleri’ne ve Tüketici Mahkemeleri’ne başvurabilir. Tüketici Hakem Heyeti sınırları her yıl güncellenir; güncel bilgi için <a href="https://www.tuketici.gov.tr" target="_blank" rel="noopener">tuketici.gov.tr</a> adresine bakınız.</p>`;
}

export function pages(S) {
  const sb = sellerBlock(S);
  const ln = legalNotice();
  const rs = roleSummary(S);
  const lc = liabilityCap();
  const ind = indemnificationClause(S);
  const md = medicalDisclaimer();
  const wd = warrantyDisclaimer();
  const fm = forceMajeure();
  const b2b = b2bAcknowledgment();
  const cd = clinicDataDuties();
  const cdisp = consumerDispute();
  const updated = S.updated || 'Haziran 2026';

  return {
    'hakkimizda.html': `
<h1>Hakkımızda</h1>
<p>CliniPipes, uluslararası hasta hizmetleri sunan sağlık kuruluşlarının satış, hasta yönetimi ve operasyon süreçlerini dijitalleştirmek amacıyla geliştirilmiş bulut tabanlı bir <strong>yazılım platformudur</strong>.</p>
<p>CliniPipes bir sağlık kuruluşu değildir; tıbbi teşhis, tedavi veya hasta bakımı sunmaz. Platform, kliniklerin kendi süreçlerini yönetmesine yönelik teknoloji aracıdır.</p>
<h2>Misyonumuz</h2>
<p>Sağlık kuruluşlarının hasta kazanımı, satış yönetimi ve operasyon süreçlerini sadeleştirerek ekiplerin daha verimli çalışmasını sağlamak.</p>
<h2>Ürünümüz</h2>
<ul>
  <li>Hasta ve lead yönetimi (klinik tarafından işletilir)</li>
  <li>Satış süreçlerinin takibi</li>
  <li>Doktor ve ekip yönetimi</li>
  <li>Dijital form ve doküman yönetimi</li>
  <li>PDF teklif oluşturma</li>
  <li>Operasyon ve süreç takibi</li>
  <li>Performans raporlama</li>
</ul>
<h2>Veri ve gizlilik</h2>
<p>Hasta verileri CliniPipes tarafından toplanmaz; klinikler kendi adlarına işler. Teknik mimari ve hukuki rol ayrımı <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a> sayfasında açıklanmıştır.</p>
<h2>Vizyonumuz</h2>
<p>Sağlık kuruluşlarının uluslararası hasta süreçlerini verimli yönetmelerini sağlayan güvenilir bir teknoloji platformu olmak.</p>
<h2>İletişim</h2>
${sb}`,

    'veri-rolu.html': `
<h1>Veri Koruma, Rol Ayrımı ve Veri İşleme Şartları</h1>
<p class="date">Son Güncelleme: ${updated}</p>
${ln}
${sb}
<p>Bu belge; CliniPipes yazılımının <strong>kişisel veri toplayıcısı olmadığını</strong>, hasta verilerinde asıl sorumluluğun <strong>klinikte</strong> olduğunu ve Hizmet Sağlayıcı’nın yalnızca sınırlı teknik rol üstlendiğini açıklar. <a href="/kullanim-kosullari">Kullanım Koşulları</a> ve <a href="/mesafeli-satis">Mesafeli Hizmet Sözleşmesi</a>’nin ayrılmaz parçasıdır.</p>

<h2>1. Tanımlar</h2>
<ul>
  <li><strong>Hizmet Sağlayıcı:</strong> ${S.sellerName} — CliniPipes yazılımını geliştiren ve lisanslayan taraf.</li>
  <li><strong>Müşteri / Klinik:</strong> CliniPipes aboneliği satın alan sağlık kuruluşu veya yetkili temsilcisi.</li>
  <li><strong>Platform:</strong> CliniPipes bulut yazılımı ve ilişkili arayüzler.</li>
  <li><strong>Hasta / aday verisi:</strong> Klinik tarafından platforma girilen; kimlik, iletişim, sağlık geçmişi, görüntü, form yanıtı ve benzeri kişisel veriler.</li>
  <li><strong>Abone verisi:</strong> Sipariş, fatura, hesap, destek ve web sitesi trafiğine ilişkin veriler.</li>
</ul>

<h2>2. Temel ilke — CliniPipes hasta verisi toplamaz</h2>
<p>CliniPipes, hasta veya aday kişisel verilerini <strong>kendi adına toplamaz, amaç belirlemez, profillemez veya ticari pazarlama amacıyla işlemez</strong>. Yazılım; kliniğin personeli tarafından kullanılmak üzere sunulan bir <strong>iş uygulamasıdır</strong>. Veri girişi klinik personeli tarafından yapılır; hasta formları kliniğin süreçleri kapsamında doldurulur.</p>
<p>Hasta verileri, kliniğe tahsis edilen mantıksal ortamda, aktarım ve saklama sırasında <strong>şifreleme (AES-256)</strong> dahil teknik tedbirlerle korunur. Verinin hangi amaçla, hangi hukuki sebeple ve ne kadar süre tutulacağına <strong>yalnızca klinik (veri sorumlusu)</strong> karar verir.</p>

<h2>3. KVKK / GDPR rol dağılımı</h2>
<table class="legal-table">
  <thead><tr><th>Veri türü</th><th>Veri sorumlusu</th><th>CliniPipes rolü</th></tr></thead>
  <tbody>
    <tr><td>Hasta / aday / sağlık verisi</td><td><strong>Klinik (Müşteri)</strong></td><td>Veri sorumlusu <strong>değildir</strong>; yalnızca KVKK md. 3 kapsamında, klinik talimatlarıyla sınırlı <strong>veri işleyen</strong></td></tr>
    <tr><td>Abone, fatura, sipariş, destek</td><td><strong>${S.sellerName}</strong></td><td>Veri sorumlusu</td></tr>
    <tr><td>Web sitesi ziyaretçisi (çerez/log)</td><td><strong>${S.sellerName}</strong></td><td>Veri sorumlusu (<a href="/cerez-politikasi">Çerez Politikası</a>)</td></tr>
  </tbody>
</table>

<h2>4. Klinik yükümlülükleri (veri sorumlusu)</h2>
<p>Müşteri / Klinik;</p>
${cd}
<p>Klinik, hasta ve adaylara yönelik aydınlatma metinlerinde CliniPipes’ı veri sorumlusu olarak göstermemeli; kendi unvanını ve iletişim bilgilerini esas almalıdır.</p>

<h2>5. Hizmet Sağlayıcı yükümlülükleri (veri işleyen)</h2>
<ul>
  <li>Yazılımı sözleşmeye uygun sunmak ve makul güvenlik tedbirleri uygulamak</li>
  <li>Verileri yalnızca klinik talimatları ve sözleşme kapsamında işlemek; kendi pazarlama amacıyla kullanmamak</li>
  <li>Yetkisiz erişime karşı erişim kontrolü, şifreleme, loglama ve yedekleme uygulamak</li>
  <li>Alt hizmet sağlayıcı (bulut, e-posta vb.) kullanımında makul sözleşmesel güvenceler sağlamak</li>
  <li>Destek talepleri dışında hasta verisine erişimi asgari düzeyde tutmak</li>
  <li>Sözleşme sona erdiğinde, makul süre içinde verilerin silinmesi veya iadesi için teknik imkân sunmak (klinik yedek/export sorumluluğu saklı)</li>
</ul>

<h2>6. Alt hizmet sağlayıcılar ve yurt dışı aktarım</h2>
<p>Platform altyapısı (barındırma, e-posta, ödeme, CDN vb.) yurt içi veya yurt dışında konumlanabilir. Hizmet Sağlayıcı, hasta verisi bakımından yalnızca klinik adına teknik barındırma sağlar. Yurt dışına aktarım söz konusu olduğunda KVKK md. 9 ve (AB hastaları için) GDPR aktarım kurallarına uyum <strong>öncelikle klinik veri sorumlusunun yükümlülüğündedir</strong>; Hizmet Sağlayıcı makul teknik ve sözleşmesel destek sunar.</p>

<h2>7. Tazminat (Müşteri → Hizmet Sağlayıcı)</h2>
${ind}

<h2>8. Sorumluluk sınırı</h2>
${lc}

<h2>9. Veri ihlali bildirimi</h2>
<p><strong>9.1.</strong> Müşteri, kendi sistem/kullanıcı kaynaklı ihlalleri ilgili mercilere bildirmekten birincil derecede sorumludur.</p>
<p><strong>9.2.</strong> Hizmet Sağlayıcı, altyapı kaynaklı şüpheli ihlali makul sürede Müşteri’ye bildirir; hasta/adaylara doğrudan bildirim yapma yükümlülüğü <strong>Müşteri’ye (veri sorumlusu)</strong> aittir.</p>

<h2>10. İşleme talimatları ve erişim</h2>
<p>Hasta verisi, yalnızca Müşteri’nin platform kullanımı ve destek talepleri kapsamında, sözleşmeye uygun şekilde işlenir. Hizmet Sağlayıcı personeli <strong>need-to-know</strong> ilkesiyle sınırlı erişir. Müşteri, hasta verisine erişim taleplerini kendi personeli üzerinden yönetir.</p>

<h2>11. Yasak beyanlar</h2>
<p>Müşteri; CliniPipes’ı hasta/adaylara “veri sorumlusu”, “sağlık hizmeti sağlayıcısı” veya “veri toplayıcı” olarak tanıtamaz; CliniPipes logosunu kendi gizlilik metninde veri sorumlusu gibi gösteremez.</p>

<h2>12. Sözleşme sonu — silme / iade</h2>
<p>Abonelik sona erdiğinde Müşteri verilerini önceden export eder. Hizmet Sağlayıcı, makul süre sonunda teknik imkânlar dâhilinde silme sağlar; yasal saklama yükümlülükleri saklıdır.</p>

<h2>13. Veri sahibi başvuruları</h2>
<p><strong>Hasta / aday:</strong> KVKK md. 11 / GDPR taleplerini <strong>doğrudan kliniğe</strong> yöneltmelidir. CliniPipes destek kanalları hasta başvurularını yanıtlamaz; kliniğe yönlendirir.</p>
<p><strong>Abone / ziyaretçi:</strong> <a href="/gizlilik">KVKK Aydınlatma Metni</a> kapsamında ${S.email}.</p>

<h2>14. Mücbir sebep</h2>
${fm}

<h2>15. Bölünebilirlik ve yürürlük</h2>
<p>Bir hükmün geçersiz sayılması diğer hükümleri etkilemez. Abonelik satın alımı veya platform kullanımı ile kabul edilmiş sayılır.</p>`,

    'gizlilik.html': `
<h1>Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
<p class="date">Son Güncelleme: ${updated}</p>
${ln}
${rs}

<h2>1. Kapsam — iki ayrı rejim</h2>
<p>Bu metin iki farklı veri işleme rejimini kapsar:</p>
<ul>
  <li><strong>(A) Abone, sipariş ve web sitesi ziyaretçisi verileri:</strong> Aşağıdaki “Veri Sorumlusu” bölümü geçerlidir.</li>
  <li><strong>(B) Hasta / aday verileri:</strong> CliniPipes bu verileri kendi adına toplamaz. Veri sorumlusu <strong>yalnızca ilgili kliniktir</strong>. Ayrıntılar <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a> belgesindedir.</li>
</ul>

<h2>2. Veri sorumlusu (A kapsamı — abone / ziyaretçi)</h2>
<p>6698 sayılı KVKK kapsamında aşağıdaki kişisel verileriniz veri sorumlusu sıfatıyla işlenir:</p>
${sb}

<h2>3. İşlenen kişisel veriler</h2>
<h3>3.1. Abone, sipariş ve hesap verileri</h3>
<ul>
  <li>Kimlik ve iletişim (ad-soyad, unvan, telefon, e-posta, klinik adı)</li>
  <li>Fatura, abonelik, ödeme ve muhasebe kayıtları</li>
  <li>Kullanıcı hesabı, rol ve kimlik doğrulama kayıtları</li>
  <li>Destek talepleri ve yazışmalar</li>
  <li>IP, cihaz, tarayıcı, oturum ve güvenlik logları</li>
</ul>
<h3>3.2. Hasta / aday verileri — CliniPipes veri sorumlusu değildir</h3>
<p>Klinikler tarafından platforma girilen hasta ve aday verileri (sağlık verisi, görüntü, form yanıtları dahil) <strong>CliniPipes tarafından toplanmaz veya kendi adına işlenmez</strong>. Bu veriler kliniğin veri sorumluluğunda, kliniğe tahsis edilen şifreli ortamda saklanır. CliniPipes yalnızca sözleşme kapsamında sınırlı <strong>veri işleyen</strong> rolündedir.</p>
<p><strong>Hasta/aday başvuruları</strong> (KVKK md. 11, GDPR talepleri) doğrudan ilgili <strong>kliniğe</strong> yapılmalıdır; ${S.email} adresine gelen hasta talepleri yanıtlanmadan kliniğe yönlendirilir.</p>

<h2>4. İşleme amaçları (A kapsamı)</h2>
<ul>
  <li>Sipariş ve sözleşme süreçlerinin yürütülmesi</li>
  <li>SaaS aboneliğinin kurulması, faturalandırılması ve desteklenmesi</li>
  <li>Ödeme ve mali yükümlülükler</li>
  <li>Bilgi güvenliği, dolandırıcılık önleme ve loglama</li>
  <li>Hukuki yükümlülükler ve uyuşmazlık yönetimi</li>
  <li>Açık rıza halinde ticari ileti (ETK — <a href="/etk">ayrı metin</a>)</li>
</ul>

<h2>5. Hukuki sebepler</h2>
<p>KVKK md. 5; sözleşmenin kurulması/ifası, hukuki yükümlülük, bir hakkın tesisi/korunması, meşru menfaat (temel hak ve özgürlüklere zarar vermemek kaydıyla) ve gerektiğinde açık rıza.</p>

<h2>6. Aktarım</h2>
<p>Ödeme kuruluşları (iyzico), bulut barındırma, e-posta/bildirim servisleri, muhasebe danışmanları ve hukuken yetkili mercilerle, amaçla sınırlı ve ölçülü paylaşım yapılabilir.</p>
<p><strong>Yurt dışı aktarım (A kapsamı):</strong> Abone verileri için altyapının yurt dışında bulunması halinde KVKK md. 9 uyarınca yeterli koruma, taahhütname veya açık rıza gibi uygun güvenceler uygulanır.</p>

<h2>7. Veri güvenliği</h2>
<p>Erişim kontrolü, rol bazlı yetkilendirme, şifreleme, güvenli iletişim, yedekleme, loglama ve güvenlik güncellemeleri uygulanır. Hasta verisi için ek teknik detaylar <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a>’nda açıklanmıştır.</p>

<h2>8. Saklama süresi</h2>
<p>Hizmet ilişkisi, vergi/ ticari mevzuat saklama süreleri ve uyuşmazlık zamanaşımı boyunca; sonrasında silme, yok etme veya anonimleştirme.</p>

<h2>9. KVKK md. 11 hakları (A kapsamı)</h2>
<p>İşlenip işlenmediğini öğrenme, bilgi talebi, amacı öğrenme, aktarılan üçüncü kişileri bilme, düzeltme, silme/yok etme, otomatik işlem itirazı ve zarar giderimi talep etme haklarına sahipsiniz.</p>
<p><strong>Hasta verisi:</strong> Başvurularınızı ilgili <strong>kliniğe</strong> yöneltiniz.</p>

<h2>10. Başvuru</h2>
<p>Abone/ziyaretçi talepleri: <a href="mailto:${S.email}">${S.email}</a>. Kimlik doğrulama istenebilir. Yanıt süresi en geç 30 gün.</p>

<h2>11. Çerezler</h2>
<p><a href="/cerez-politikasi">Çerez Politikası</a> geçerlidir.</p>

<h2>12. Değişiklikler</h2>
<p>Güncel metin yayımlandığı tarihte yürürlüğe girer.</p>`,

    'cerez-politikasi.html': `
<h1>Çerez Politikası</h1>
<p class="date">Son Güncelleme: ${updated}</p>
${sb}
<p>Bu politika, clinipipes.com web sitesinde kullanılan çerezleri açıklar. Platform (uygulama) oturum çerezleri abonelik kapsamında ayrıca değerlendirilir.</p>

<h2>1. Çerez nedir?</h2>
<p>Çerezler, web sitesini ziyaret ettiğinizde cihazınıza kaydedilen küçük metin dosyalarıdır.</p>

<h2>2. Kullandığımız çerez türleri</h2>
<table class="legal-table">
  <thead><tr><th>Tür</th><th>Amaç</th><th>Zorunluluk</th></tr></thead>
  <tbody>
    <tr><td>Zorunlu / oturum</td><td>Güvenlik, oturum, form gönderimi, sepet</td><td>Hizmet için gerekli</td></tr>
    <tr><td>Tercih</td><td>Dil seçimi (TR/EN)</td><td>İsteğe bağlı</td></tr>
    <tr><td>Analitik</td><td>Ziyaret istatistikleri (varsa, anonim/agrege)</td><td>İsteğe bağlı — devreye alınırsa güncellenir</td></tr>
  </tbody>
</table>

<h2>3. Üçüncü taraf çerezleri</h2>
<p>Ödeme (iyzico) veya gömülü içerik kullanıldığında ilgili sağlayıcıların çerezleri uygulanabilir; kendi politikalarına tabidirler.</p>

<h2>4. Yönetim</h2>
<p>Tarayıcı ayarlarından çerezleri silebilir veya engelleyebilirsiniz. Zorunlu çerezlerin kapatılması sitenin veya sipariş akışının çalışmamasına yol açabilir.</p>

<h2>5. KVKK</h2>
<p>Kişisel veri işleme detayları için <a href="/gizlilik">KVKK Aydınlatma Metni</a>.</p>`,

    'kullanim-kosullari.html': `
<h1>Kullanım Koşulları</h1>
<p class="date">Son Güncelleme: ${updated}</p>
${ln}
${sb}
<p>CliniPipes platformunu kullanan tüm Müşteri ve kullanıcılar bu koşulları kabul etmiş sayılır. <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a> ayrılmaz parçadır.</p>

<h2>1. Tanım ve kapsam</h2>
<p>CliniPipes; ${S.sellerName} tarafından sunulan bulut tabanlı SaaS yazılımıdır. Koşullar web sitesi, yönetim paneli ve ilişkili hizmetleri kapsar.</p>

<h2>2. Hizmet niteliği — yazılım, sağlık hizmeti değil</h2>
${md}

<h2>3. Hesap ve erişim</h2>
<ul>
  <li>Hesap bilgileri gizli tutulur; yetkisiz kullanım derhal bildirilir.</li>
  <li>Rol bazlı erişim Müşteri tarafından yönetilir; ayrılan personel erişimi kapatılır.</li>
  <li>Hizmet Sağlayıcı, güvenlik veya sözleşme ihlali şüphesinde erişimi askıya alabilir.</li>
</ul>

<h2>4. Veri sorumluluğu — hasta verisi</h2>
<p><strong>CliniPipes hasta verisi toplayan bir uygulama değildir.</strong> Müşteri / Klinik, platforma girdiği tüm hasta ve aday verilerinden münhasıran sorumlu <strong>veri sorumlusudur</strong>. Hizmet Sağlayıcı veri sorumlusu değildir; yalnızca sözleşme kapsamında sınırlı veri işleyendir.</p>
<p>Müşteri;</p>
${cd}

<h2>5. Kabul edilemez kullanım</h2>
<ul>
  <li>Hukuka aykırı içerik, sahte veri veya yetkisiz hasta kaydı</li>
  <li>Yetkisiz erişim, tersine mühendislik, zararlı yazılım, sistem manipülasyonu</li>
  <li>Fikri mülkiyet ihlali, lisanssız yeniden satış veya alt lisans</li>
  <li>Spam, kötüye kullanım veya altyapıya aşırı yük</li>
</ul>

<h2>6. Fikri mülkiyet</h2>
<p>CliniPipes yazılımı, markası, arayüzü ve dokümantasyonu Hizmet Sağlayıcı’ya aittir. Müşteri’ye abonelik süresince devredilemez, münhasır olmayan kullanım hakkı verilir. Müşteri yalnızca kendi girdiği verilerin sahibidir.</p>

<h2>7. Hizmet seviyesi ve garanti reddi</h2>
${wd}
<p>Makul erişilebilirlik hedeflenir. Bakım, güncelleme, altyapı kesintisi ve mücbir sebep hallerinde kesinti olabilir.</p>

<h2>8. Sorumluluk sınırı ve tazminat</h2>
${lc}
${ind}

<h2>9. Mücbir sebep</h2>
${fm}

<h2>10. B2B / yetkili temsil</h2>
${b2b}

<h2>11. Süre, fesih ve veri</h2>
<p>Abonelik dönemi ve yenileme koşulları sipariş ekranında belirtilir. Fesih halinde erişim dönem sonunda sona erer. Müşteri, fesih öncesi verilerini export etmekle yükümlüdür. Saklama/silme prosedürü sözleşme ve mevzuata uygun yürütülür.</p>

<h2>10. Gizlilik ve çerezler</h2>
<p><a href="/gizlilik">KVKK Aydınlatma Metni</a>, <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a>, <a href="/cerez-politikasi">Çerez Politikası</a>.</p>

<h2>11. Uyuşmazlık</h2>
<p>Türkiye Cumhuriyeti kanunları uygulanır.</p>
${cdisp}
<p>Diğer uyuşmazlıklarda <strong>İzmir Mahkemeleri ve İcra Daireleri</strong> yetkilidir.</p>

<h2>12. İletişim</h2>
<p><a href="mailto:${S.email}">${S.email}</a></p>`,

    'mesafeli-satis.html': `
<h1>Mesafeli Hizmet Sözleşmesi</h1>
<p class="date">Son Güncelleme: ${updated}</p>
${ln}
<h2>1. Taraflar</h2>
${sb}
<p><strong>Müşteri:</strong> Platform üzerinden hizmet satın alan gerçek veya tüzel kişi (sağlık kuruluşu / yetkili temsilcisi).</p>
${b2b}
<p>6502 sayılı Kanun ve Mesafeli Sözleşmeler Yönetmeliği kapsamında elektronik ortamda kurulmuştur.</p>

<h2>2. Konu</h2>
<p>CliniPipes bulut yazılım aboneliğinin (ve varsa kurulum hizmetinin) satın alınması, dijital erişimin sağlanması ve kullanımına ilişkin hak ve yükümlülükler.</p>

<h2>3. Hizmetin niteliği</h2>
<p><strong>Dijital yazılım hizmeti (SaaS).</strong> Fiziksel ürün teslimi yoktur. CliniPipes sağlık hizmeti sunmaz; hasta verisi toplayıcısı değildir.</p>
${md}

<h2>4. Hizmet kapsamı</h2>
<p>Pakete göre: hasta/lead yönetimi, satış takibi, form, PDF teklif, ekip yönetimi, operasyon takibi, raporlama. Özellikler geliştirme ile güncellenebilir; esaslı hak kaybı oluşturmayan değişiklikler makul kabul edilir.</p>

<h2>5. Ücret ve ödeme</h2>
<p>Güncel fiyatlar web sitesinde ilan edilir. Ödeme iyzico veya ilan edilen güvenli yöntemlerle tahsil edilir. Vergi dahil/hariç durumu sipariş ekranında gösterilir.</p>

<h2>6. İfa — dijital erişim</h2>
<p>Ödeme onayı sonrası hesap oluşturulur; erişim bilgileri e-posta ile iletilir. Normal koşullarda aynı iş günü içinde erişim sağlanır. Müşteri, dijital hizmetin <strong>derhal ifasına</strong> onay verdiğinde cayma hakkını kaybedebilir (bkz. md. 8).</p>

<h2>7. Abonelik süresi</h2>
<p>Seçilen dönem (aylık/yıllık) boyunca geçerlidir; otomatik yenileme sipariş koşullarında belirtilmediği sürece yapılmaz — yenileme Müşteri tarafından gerçekleştirilir.</p>

<h2>8. Cayma hakkı</h2>
<p>Müşteri, <strong>tüketici</strong> ise ve hizmet ifasına başlanmamışsa 14 gün içinde cayma hakkına sahip olabilir. <strong>Anında ifa edilen dijital hizmetlerde</strong>, Mesafeli Sözleşmeler Yönetmeliği md. 15/ğ uyarınca, Müşteri’nin <strong>“cayma hakkını kaybedeceğine dair açık onay”</strong> vermesi ve hizmetin ifasına başlanması halinde cayma hakkı kullanılamaz. Bu onay sipariş ekranındaki kutucuk ile alınır.</p>
<p>Cayma bildirimi: <a href="mailto:${S.email}">${S.email}</a>. Mükerrer ödeme, teknik hata veya hizmetin hiç sunulamaması ayrı değerlendirilir.</p>

<h2>9. İptal ve iade</h2>
<p>Abonelik dönem sonunda iptal edilebilir; kullanılmayan süre için kısmi iade yapılmaz (<a href="/teslimat">Teslimat ve İade</a>). Erişim sağlandıktan sonra genel kural olarak iade yoktur.</p>

<h2>10. Müşteri yükümlülükleri</h2>
${cd}
<p>Hesap güvenliği, hukuka uygun kullanım ve ödeme yükümlülükleri Müşteri’ye aittir.</p>

<h2>11. Hizmet Sağlayıcı yükümlülükleri</h2>
<ul>
  <li>Hizmeti sözleşmeye uygun sunmak</li>
  <li>Makul güvenlik tedbirleri uygulamak</li>
  <li>Yasal yükümlülüklere uymak</li>
  <li>Makul teknik destek sağlamak</li>
</ul>

<h2>12. Kişisel veriler</h2>
<p><a href="/gizlilik">KVKK Aydınlatma Metni</a> ve <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a> işbu sözleşmenin ayrılmaz parçasıdır. Hasta verisi sorumluluğu Müşteri’dedir.</p>

<h2>13. Fikri mülkiyet</h2>
<p>CliniPipes yazılımı ve markası Hizmet Sağlayıcı’ya aittir; Müşteri’ye süreli kullanım hakkı verilir.</p>

<h2>14. Garanti reddi</h2>
${wd}

<h2>15. Sorumluluk sınırı ve tazminat</h2>
${lc}
${ind}

<h2>16. Mücbir sebep</h2>
${fm}

<h2>17. Uyuşmazlık</h2>
${cdisp}
<p>Diğer uyuşmazlıklarda İzmir Mahkemeleri ve İcra Daireleri yetkilidir.</p>

<h2>18. Yürürlük</h2>
<p>Müşteri siparişi onaylayarak <a href="/on-bilgilendirme">Ön Bilgilendirme Formu</a>’nu, <a href="/kullanim-kosullari">Kullanım Koşulları</a>’nı, <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a>’nı ve bu sözleşmeyi kabul eder.</p>`,

    'teslimat.html': `
<h1>Teslimat ve İade Koşulları</h1>
<p class="date">Son Güncelleme: ${updated}</p>
${sb}

<h2>1. Hizmetin niteliği</h2>
<p>CliniPipes bulut tabanlı yazılım hizmetidir (SaaS). Fiziksel ürün teslimatı yapılmaz.</p>

<h2>2. Teslimat / dijital erişim</h2>
<p>Ödeme onayı sonrası kullanıcı hesabı oluşturulur; erişim bilgileri elektronik ortamda (e-posta) iletilir. Normal koşullarda aynı iş günü içinde erişim sağlanır. Kurulum hizmeti satın alınmışsa ayrıca planlanır.</p>

<h2>3. Abonelik</h2>
<p>Seçilen dönem boyunca geçerlidir; süre sonunda yenileme gerekir.</p>

<h2>4. İptal</h2>
<p>Abonelik dilediğiniz zaman (dönem sonuna kadar geçerli olmak üzere) iptal edilebilir. Mevcut dönem sonuna kadar erişim devam eder; kullanılmayan süre için kısmi iade yapılmaz.</p>

<h2>5. İade</h2>
<p>Dijital erişim sağlandıktan ve hizmet kullanılmaya başlandıktan sonra genel kural olarak ücret iadesi yapılmaz. Mükerrer ödeme, hatalı tahsilat veya teknik nedenle hizmetin hiç sunulamaması hallerinde <a href="mailto:${S.email}">${S.email}</a> üzerinden talep değerlendirilir.</p>

<h2>6. Cayma hakkı</h2>
<p>Tüketici işlemlerinde 14 günlük cayma hakkı, dijital hizmetin anında ifasına açık onay verilmesi halinde kaybedilebilir. Ayrıntılar <a href="/mesafeli-satis">Mesafeli Hizmet Sözleşmesi</a>’nde.</p>

<h2>7. Hizmet sürekliliği</h2>
<p>Bakım, güvenlik güncellemeleri ve mücbir sebep nedeniyle planlı/plansız kesintiler olabilir; mümkün olduğunca önceden bilgilendirilir.</p>

<h2>8. Veri export</h2>
<p>Abonelik sona erdiğinde Müşteri, hasta verilerini önceden export etmekle yükümlüdür. CliniPipes hasta verisi toplayıcısı değildir; veri sorumluluğu kliniğe aittir (<a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a>).</p>

<h2>9. Tüketici uyuşmazlıkları</h2>
${cdisp}

<h2>10. Değişiklikler</h2>
<p>Güncel metin yayımlandığı tarihte yürürlüğe girer.</p>`,

    'on-bilgilendirme.html': `
<h1>Ön Bilgilendirme Formu</h1>
<p class="date">Mesafeli Sözleşmeler Yönetmeliği — ödeme öncesi sunulur. Son Güncelleme: ${updated}</p>
${sb}

<h2>Satıcı bilgileri</h2>
<p>Yukarıdaki satıcı bilgileri geçerlidir.</p>

<h2>Hizmetin temel nitelikleri</h2>
<p><strong>CliniPipes</strong> — sağlık kuruluşlarına yönelik bulut tabanlı yazılım aboneliği (SaaS). Fiziksel ürün yoktur. CliniPipes sağlık hizmeti sunmaz ve hasta verisi toplayıcısı değildir.</p>

<h2>Seçilen paket, süre ve bedel</h2>
<p>Sipariş ekranında gösterilir. Vergi dahil/hariç durumu fiyatlandırmada belirtilir. Kurulum hizmeti ayrı kalemdir.</p>

<h2>Ödeme ve faturalandırma</h2>
<p>iyzico / kredi kartı veya ilan edilen yöntemler. Fatura elektronik ortamda düzenlenir.</p>

<h2>Teslimat / ifa şekli</h2>
<p>Ödeme onayı sonrası aynı iş günü dijital erişim; hesap bilgileri e-posta ile iletilir.</p>

<h2>Cayma hakkı</h2>
<p>Tüketici iseniz 14 gün içinde cayma hakkınız olabilir. <strong>Dijital hizmetin derhal ifasına onay vermeniz halinde cayma hakkınızı kaybedeceğinizi</strong> kabul etmiş olursunuz (sipariş ekranı onay kutusu).</p>

<h2>İptal / iade</h2>
<p>Abonelik dönem sonunda iptal; kullanılmayan süre iadesi yok (<a href="/teslimat">Teslimat ve İade</a>).</p>

<h2>Veri koruma</h2>
<p>Hasta verilerinde veri sorumlusu sizin klinik kuruluşunuzdur. CliniPipes yalnızca yazılım sağlayıcısıdır. <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a>, <a href="/gizlilik">KVKK</a>.</p>

<h2>Uyuşmazlık</h2>
${cdisp}

<h2>Politikalar</h2>
<ul>
  <li><a href="/mesafeli-satis">Mesafeli Hizmet Sözleşmesi</a></li>
  <li><a href="/kullanim-kosullari">Kullanım Koşulları</a></li>
  <li><a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a></li>
  <li><a href="/gizlilik">KVKK Aydınlatma Metni</a></li>
  <li><a href="/cerez-politikasi">Çerez Politikası</a></li>
</ul>`,

    'etk.html': `
<h1>Elektronik Ticari İleti Aydınlatma Metni</h1>
<p class="date">Son Güncelleme: ${updated}</p>
${sb}
<p>6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun ve ilgili mevzuat kapsamında hazırlanmıştır.</p>

<h2>1. Kapsam</h2>
<p><strong>Ticari ileti:</strong> Ürün/hizmet tanıtımı, kampanya, eğitim daveti gibi pazarlama amaçlı e-posta, SMS veya arama — yalnızca <strong>açık onay</strong> sonrası.</p>
<p><strong>İşlem bildirimi:</strong> Fatura, şifre sıfırlama, hesap aktivasyonu, güvenlik uyarısı — hizmetin ifası için zorunlu; ticari ileti sayılmaz.</p>

<h2>2. İşlenen veriler</h2>
<p>İletişim bilgileri (e-posta, telefon), onay kayıtları, ret kayıtları, İYS referansları.</p>

<h2>3. Onay</h2>
<p>Ticari ileti yalnızca açık onay alındıktan sonra gönderilir. Onay, sipariş/checkout veya ayrı opt-in ile alınabilir.</p>

<h2>4. İYS</h2>
<p>Kayıtlar İleti Yönetim Sistemi (İYS) mevzuatına uygun tutulur; İYS kaydı tamamlandığında bu metin güncellenir.</p>

<h2>5. Onayın geri alınması</h2>
<p>E-postalardaki abonelikten çık linki, <a href="mailto:${S.email}">${S.email}</a> adresine yazılı talep veya İYS üzerinden ret. Ret talepleri en geç 3 iş günü içinde işleme alınır.</p>

<h2>6. KVKK</h2>
<p><a href="/gizlilik">KVKK Aydınlatma Metni</a> geçerlidir.</p>`,

    'sss.html': `
<h1>Sıkça Sorulan Sorular</h1>

<p><strong>CliniPipes nedir?</strong></p>
<p>Sağlık kuruluşlarının hasta yönetimi, satış ve operasyon takibini tek platformda sunan bulut tabanlı <strong>yazılımdır</strong>. Sağlık hizmeti veya teşhis/tedavi sunmaz.</p>
<hr>

<p><strong>CliniPipes hasta verisi topluyor mu?</strong></p>
<p><strong>Hayır.</strong> CliniPipes veri toplayan bir uygulama değildir. Hasta verileri klinik tarafından, kliniğin sorumluluğunda platforma girilir ve şifreli ortamda saklanır. Veri sorumlusu kliniktir. Ayrıntılar: <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a>.</p>
<hr>

<p><strong>CliniPipes hangi kurumlar için uygundur?</strong></p>
<p>Sağlık turizmi klinikleri, diş/tıp merkezleri ve uluslararası hasta süreçlerini yöneten kuruluşlar.</p>
<hr>

<p><strong>Kurulum ne kadar sürer?</strong></p>
<p>Standart kurulumlar genellikle 1 iş günü içinde tamamlanır. Kurulum hizmeti ayrı satın alınabilir.</p>
<hr>

<p><strong>Verilerim güvende mi?</strong></p>
<p>CliniPipes, kişisel verilerin korunması için gerekli teknik ve idari tedbirleri uygular (şifreleme, erişim kontrolü vb.). Hasta verileri bakımından asıl sorumluluk kliniğe aittir. Ayrıntılar: <a href="/gizlilik">KVKK</a> ve <a href="/veri-rolu">Veri Koruma</a>.</p>
<hr>

<p><strong>Aboneliğimi iptal edebilir miyim?</strong></p>
<p>Evet. Mevcut dönem sonuna kadar erişim devam eder; kullanılmayan süre iadesi yapılmaz (<a href="/teslimat">Teslimat ve İade</a>).</p>
<hr>

<p><strong>Cayma hakkım var mı?</strong></p>
<p>Tüketici iseniz ve dijital hizmete hemen erişim onayı vermediyseniz 14 gün cayma hakkınız olabilir. Anında erişim onayı verirseniz cayma hakkı kaybolur (<a href="/mesafeli-satis">Mesafeli Sözleşme</a>).</p>
<hr>

<p><strong>Hasta verisi ihlalinde kim sorumlu?</strong></p>
<p>Platforma girilen hasta verilerinde <strong>veri sorumlusu kliniktir</strong>. CliniPipes yazılım sağlayıcısıdır; klinik kaynaklı aydınlatma/rıza eksiklikleri, tıbbi içerik ve hasta iletişiminden doğan talepler kliniğin sorumluluğundadır. Ayrıntılar: <a href="/veri-rolu">Veri Koruma ve Rol Ayrımı</a> (tazminat ve sorumluluk sınırı maddeleri).</p>
<hr>

<p><strong>İletişim?</strong></p>
<p><a href="mailto:${S.email}">${S.email}</a></p>`,
  };
}
