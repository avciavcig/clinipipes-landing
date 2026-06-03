#!/usr/bin/env python3
# clinipipes-landing — TUM degisiklikleri orijinal repo uzerine uygular.
# Calistir: ~/clinipipes-landing icinde  ->  python3 apply_all.py
# Her hedef tam-eslesme; biri bulunmazsa HATA verir ve HICBIR sey yazmaz (guvenli).
import io, sys

def read(p):
    return io.open(p, "r", encoding="utf-8").read()
def write(p, s):
    io.open(p, "w", encoding="utf-8").write(s)
def repl(s, old, new, label):
    if s.count(old) != 1:
        sys.exit("HATA [%s]: beklenen 1, bulunan %d. Yerel dosya orijinalden farkli; hicbir sey yazilmadi." % (label, s.count(old)))
    return s.replace(old, new)

# =================== index.html ===================
h = read("index.html")

# 1) tier ikonlari
IC_S = '<svg class="price-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V8"/><path d="M8 12l4-4 4 4"/><path d="M5 20h14"/></svg>'
IC_P = '<svg class="price-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 12l9 5 9-5"/></svg>'
IC_K = '<svg class="price-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>'
h = repl(h, '<div class="price-plan" data-tr="Başlangıç" data-en="Starter">Başlangıç</div>',
         IC_S + '\n      <div class="price-plan" data-tr="Başlangıç" data-en="Starter">Başlangıç</div>', "ikon:starter")
h = repl(h, '<div class="price-plan">Pro</div>', IC_P + '\n      <div class="price-plan">Pro</div>', "ikon:pro")
h = repl(h, '<div class="price-plan" data-tr="Kurulum" data-en="Setup">Kurulum</div>',
         IC_K + '\n      <div class="price-plan" data-tr="Kurulum" data-en="Setup">Kurulum</div>', "ikon:setup")

# 2) butonlar -> Sepete Ekle
h = repl(h, '<button class="btn-dark" data-tr="Satın Al" data-en="Buy Now">Satın Al</button>',
         '<button class="btn-dark" onclick="addToCart(\'starter\')" data-tr="Sepete Ekle" data-en="Add to Cart">Sepete Ekle</button>', "btn:starter")
h = repl(h, '<button class="btn-white" data-tr="Satın Al" data-en="Buy Now">Satın Al</button>',
         '<button class="btn-white" onclick="addToCart(\'pro\')" data-tr="Sepete Ekle" data-en="Add to Cart">Sepete Ekle</button>', "btn:pro")
h = repl(h, '<button class="btn-dark" data-tr="Kurulum Talep Et" data-en="Request Setup">Kurulum Talep Et</button>',
         '<button class="btn-dark" onclick="addToCart(\'setup\')" data-tr="Sepete Ekle" data-en="Add to Cart">Sepete Ekle</button>', "btn:setup")

# 3) CSS (ikon + sepet + plan karsilastirma) -> </style> oncesi
CSS = """  .price-icon { width: 34px; height: 34px; color: var(--accent); margin-bottom: 0.9rem; display: block; }
  .price-card.featured .price-icon { color: #fff; }
  .cart-fab { position: fixed; bottom: 24px; right: 24px; z-index: 1000; background: var(--accent); color: #fff; border: none; border-radius: 100px; padding: 0.85rem 1.25rem; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; font-weight: 600; cursor: pointer; box-shadow: 0 6px 20px rgba(14,14,12,0.18); display: flex; align-items: center; gap: 0.5rem; transition: transform 0.2s; }
  .cart-fab:hover { transform: translateY(-2px); }
  .cart-fab .cart-count { background: #fff; color: var(--accent); border-radius: 100px; min-width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; padding: 0 5px; }
  .cart-overlay { position: fixed; inset: 0; background: rgba(14,14,12,0.45); z-index: 1001; opacity: 0; visibility: hidden; transition: opacity 0.25s; }
  .cart-overlay.open { opacity: 1; visibility: visible; }
  .cart-panel { position: fixed; top: 0; right: 0; height: 100%; width: 380px; max-width: 90vw; background: var(--white); z-index: 1002; transform: translateX(100%); transition: transform 0.28s ease; display: flex; flex-direction: column; box-shadow: -8px 0 30px rgba(14,14,12,0.15); }
  .cart-panel.open { transform: translateX(0); }
  .cart-head { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--border); }
  .cart-head h3 { font-family: 'Playfair Display', serif; font-size: 1.25rem; }
  .cart-close { background: none; border: none; font-size: 1.6rem; cursor: pointer; color: var(--muted); line-height: 1; }
  .cart-period { display: flex; margin: 1rem 1.5rem 0; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; }
  .cart-period button { flex: 1; background: none; border: none; padding: 0.5rem; font-family: 'DM Sans', sans-serif; font-size: 0.8rem; cursor: pointer; color: var(--muted); }
  .cart-period button.active { background: var(--dark); color: #fff; }
  .cart-items { flex: 1; overflow-y: auto; padding: 0.5rem 1.5rem; }
  .cart-empty { color: var(--muted); font-size: 0.9rem; text-align: center; padding: 2.5rem 0; }
  .cart-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem; padding: 0.85rem 0; border-bottom: 1px solid var(--border); }
  .cart-item-name { font-size: 0.9rem; font-weight: 600; }
  .cart-item-sub { font-size: 0.78rem; color: var(--muted); margin-top: 0.15rem; }
  .cart-item-price { font-size: 0.9rem; font-weight: 600; white-space: nowrap; }
  .cart-item-rm { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 0.9rem; }
  .cart-foot { border-top: 1px solid var(--border); padding: 1.25rem 1.5rem; }
  .cart-line { display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.4rem; color: var(--muted); }
  .cart-line.discount { color: var(--accent); }
  .cart-total { display: flex; justify-content: space-between; font-size: 1.05rem; font-weight: 700; margin: 0.6rem 0 1rem; color: var(--dark); }
  .cart-checkout { width: 100%; background: var(--accent); color: #fff; border: none; padding: 0.85rem; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
  .cart-checkout:hover { background: var(--accent-dark); }
  .cart-note { font-size: 0.72rem; color: var(--muted); text-align: center; margin-top: 0.6rem; }
  .plan-compare { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; max-width: 780px; margin: 3rem auto 0; text-align: left; }
  .plan-col { border: 1px solid rgba(250,250,248,0.16); border-radius: 12px; padding: 1.6rem; background: rgba(250,250,248,0.04); }
  .plan-col.pro { border-color: var(--accent); }
  .plan-col h4 { font-size: 1.05rem; color: var(--white); margin-bottom: 0.2rem; }
  .plan-col .plan-for { font-size: 0.8rem; color: rgba(250,250,248,0.55); margin-bottom: 1.1rem; }
  .plan-col ul { list-style: none; }
  .plan-col li { font-size: 0.86rem; color: rgba(250,250,248,0.82); padding: 0.35rem 0; display: flex; gap: 0.55rem; align-items: flex-start; }
  .plan-col li::before { content: '\\2192'; color: var(--accent); flex-shrink: 0; }
  @media (max-width: 768px) { .cart-fab { bottom: 16px; right: 16px; } .plan-compare { grid-template-columns: 1fr; } }
</style>"""
h = repl(h, "</style>", CSS, "css")

# 4) nav -> İletişim (/iletisim) linki
h = repl(h, '<a href="#pricing" data-tr="Fiyatlandırma" data-en="Pricing">Fiyatlandırma</a>',
         '<a href="#pricing" data-tr="Fiyatlandırma" data-en="Pricing">Fiyatlandırma</a>\n    <a href="/iletisim" data-tr="İletişim" data-en="Contact">İletişim</a>', "nav")

# 5) #demo icine Başlangıç/Pro karsilastirmasi
COMPARE = """
  <div class="plan-compare">
    <div class="plan-col">
      <h4 data-tr="Başlangıç" data-en="Starter">Başlangıç</h4>
      <div class="plan-for" data-tr="Tek doktorlu, yeni başlayan klinikler için." data-en="For single-doctor clinics getting started.">Tek doktorlu, yeni başlayan klinikler için.</div>
      <ul>
        <li data-tr="1 satışçı + 1 doktor kullanıcısı" data-en="1 sales + 1 doctor user">1 satışçı + 1 doktor kullanıcısı</li>
        <li data-tr="Aylık 30 hastaya kadar kayıt" data-en="Up to 30 patient records / month">Aylık 30 hastaya kadar kayıt</li>
        <li data-tr="Dashboard, doktor paneli ve satış takibi" data-en="Dashboard, doctor panel and sales tracking">Dashboard, doktor paneli ve satış takibi</li>
        <li data-tr="Form Builder ile özel hasta formları" data-en="Custom patient forms with Form Builder">Form Builder ile özel hasta formları</li>
        <li data-tr="PDF teklif oluşturma" data-en="PDF proposal generation">PDF teklif oluşturma</li>
      </ul>
    </div>
    <div class="plan-col pro">
      <h4 data-tr="Pro — tüm farklar" data-en="Pro — all the extras">Pro — tüm farklar</h4>
      <div class="plan-for" data-tr="Büyüyen, çok kullanıcılı klinikler için." data-en="For growing, multi-user clinics.">Büyüyen, çok kullanıcılı klinikler için.</div>
      <ul>
        <li data-tr="Her rolden 5 kullanıcı" data-en="5 users across any role">Her rolden 5 kullanıcı</li>
        <li data-tr="Sınırsız hasta kaydı (aylık limit yok)" data-en="Unlimited patient records (no monthly cap)">Sınırsız hasta kaydı (aylık limit yok)</li>
        <li data-tr="Tüm modüller ve raporlar dahil" data-en="All modules and reports included">Tüm modüller ve raporlar dahil</li>
        <li data-tr="Hasta iletişim bilgileri satışçıdan gizli" data-en="Patient contact info hidden from sales staff">Hasta iletişim bilgileri satışçıdan gizli</li>
        <li data-tr="Telegram & WhatsApp anlık bildirim" data-en="Instant Telegram & WhatsApp notifications">Telegram & WhatsApp anlık bildirim</li>
      </ul>
    </div>
  </div>
</section>

<section id="pricing">"""
h = repl(h, "</section>\n\n<section id=\"pricing\">", COMPARE, "demo:compare")

# 6) footer yasal linklerine İletişim ekle
h = repl(h, '<a href="/mesafeli-satis" style="color:#888780;text-decoration:none;">Mesafeli Satış Sözleşmesi</a>',
         '<a href="/mesafeli-satis" style="color:#888780;text-decoration:none;">Mesafeli Satış Sözleşmesi</a>\n    <a href="/iletisim" style="color:#888780;text-decoration:none;">İletişim</a>', "footer-link")

# 7) sepet markup -> </body> oncesi
MARKUP = """<button class="cart-fab" id="cartFab" onclick="openCart()">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
  <span class="cart-label" data-tr="Sepet" data-en="Cart">Sepet</span>
  <span class="cart-count" id="cartCount">0</span>
</button>
<div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
<aside class="cart-panel" id="cartPanel" aria-label="Sepet">
  <div class="cart-head">
    <h3 data-tr="Sepetiniz" data-en="Your Cart">Sepetiniz</h3>
    <button class="cart-close" onclick="closeCart()" aria-label="Kapat">&times;</button>
  </div>
  <div class="cart-period">
    <button id="perMonthly" class="active" onclick="setPeriod('monthly')" data-tr="Aylık" data-en="Monthly">Aylık</button>
    <button id="perYearly" onclick="setPeriod('yearly')" data-tr="Yıllık · 2 ay bedava" data-en="Yearly · 2 mo free">Yıllık · 2 ay bedava</button>
  </div>
  <div class="cart-items" id="cartItems"></div>
  <div class="cart-foot" id="cartFoot"></div>
</aside>
</body>"""
h = repl(h, "</body>", MARKUP, "markup")

# 8) sepet JS -> </script> oncesi (null-guard + DOM-ready)
JS = r"""var PRICES = {
  starter: { monthly:45, yearly:450, recurring:true, tr:'Başlangıç Planı', en:'Starter Plan' },
  pro:     { monthly:89, yearly:890, recurring:true, tr:'Pro Plan',        en:'Pro Plan' },
  setup:   { oneoff:199, recurring:false, tr:'Kurulum Hizmeti', en:'Setup Service' }
};
var cart = { starter:false, pro:false, setup:false };
var period = 'monthly';
var BUNDLE = 20;
function t(tr, en){ return currentLang === 'en' ? en : tr; }
function eur(n){ return '\u20AC' + n; }
function addToCart(key){ cart[key] = true; renderCart(); openCart(); }
function removeFromCart(key){ cart[key] = false; renderCart(); }
function setPeriod(p){
  period = p;
  document.getElementById('perMonthly').classList.toggle('active', p === 'monthly');
  document.getElementById('perYearly').classList.toggle('active', p === 'yearly');
  renderCart();
}
function openCart(){ document.getElementById('cartOverlay').classList.add('open'); document.getElementById('cartPanel').classList.add('open'); }
function closeCart(){ document.getElementById('cartOverlay').classList.remove('open'); document.getElementById('cartPanel').classList.remove('open'); }
function lineFor(key){
  var p = PRICES[key];
  if(key === 'setup'){ return { name:t(p.tr,p.en), price:p.oneoff, sub:t('tek seferlik','one-time') }; }
  var amt = (period === 'yearly') ? p.yearly : p.monthly;
  var per = (period === 'yearly') ? t('/yıl','/yr') : t('/ay','/mo');
  return { name:t(p.tr,p.en), price:amt, sub:eur(amt) + per };
}
function renderCart(){
  var cc = document.getElementById('cartCount');
  if(!cc){ return; }
  var keys = Object.keys(cart).filter(function(k){ return cart[k]; });
  cc.textContent = keys.length;
  var fab = document.querySelector('.cart-fab .cart-label'); if(fab){ fab.textContent = t('Sepet','Cart'); }
  var itemsEl = document.getElementById('cartItems');
  var footEl = document.getElementById('cartFoot');
  if(keys.length === 0){
    itemsEl.innerHTML = '<div class="cart-empty">' + t('Sepetiniz boş.','Your cart is empty.') + '</div>';
    footEl.innerHTML = '';
    return;
  }
  var rows = ''; var subtotal = 0;
  keys.forEach(function(k){
    var L = lineFor(k); subtotal += L.price;
    rows += '<div class="cart-item"><div><div class="cart-item-name">' + L.name + '</div><div class="cart-item-sub">' + L.sub + '</div></div>'
          + '<div style="display:flex;gap:0.6rem;align-items:flex-start;"><span class="cart-item-price">' + eur(L.price) + '</span>'
          + '<button class="cart-item-rm" onclick="removeFromCart(\'' + k + '\')" aria-label="remove">\u2715</button></div></div>';
  });
  itemsEl.innerHTML = rows;
  var hasPlan = cart.starter || cart.pro;
  var bundle = (hasPlan && cart.setup) ? BUNDLE : 0;
  var total = subtotal - bundle;
  var f = '';
  f += '<div class="cart-line"><span>' + t('Ara toplam','Subtotal') + '</span><span>' + eur(subtotal) + '</span></div>';
  if(bundle){ f += '<div class="cart-line discount"><span>' + t('Paket indirimi','Bundle discount') + '</span><span>\u2212' + eur(bundle) + '</span></div>'; }
  f += '<div class="cart-total"><span>' + t('Toplam','Total') + '</span><span>' + eur(total) + '</span></div>';
  f += '<button class="cart-checkout" onclick="checkout()">' + t('Satın Al','Buy Now') + '</button>';
  f += '<div class="cart-note">' + t('iyzico ödeme bağlantısı e-posta ile gönderilir.','iyzico payment link sent by email.') + '</div>';
  footEl.innerHTML = f;
}
function checkout(){
  var keys = Object.keys(cart).filter(function(k){ return cart[k]; });
  if(keys.length === 0){ return; }
  var L = (currentLang === 'en') ? 'en' : 'tr';
  var lines = []; var subtotal = 0;
  keys.forEach(function(k){ var li = lineFor(k); subtotal += li.price; lines.push('- ' + li.name + ': ' + eur(li.price) + ' (' + li.sub + ')'); });
  var hasPlan = cart.starter || cart.pro;
  var bundle = (hasPlan && cart.setup) ? BUNDLE : 0;
  var total = subtotal - bundle;
  var perTxt = (period === 'yearly') ? t('Yıllık','Yearly') : t('Aylık','Monthly');
  var body = (L === 'en' ? 'Order — CliniPipes\n\n' : 'Sipariş — CliniPipes\n\n') + lines.join('\n') + '\n';
  if(bundle){ body += (L === 'en' ? 'Bundle discount: \u2212' : 'Paket indirimi: \u2212') + eur(bundle) + '\n'; }
  body += (L === 'en' ? 'Total: ' : 'Toplam: ') + eur(total) + '\n'
        + (L === 'en' ? 'Billing: ' : 'Ödeme periyodu: ') + perTxt + '\n\n'
        + (L === 'en' ? 'Clinic name:\nContact person:\nPhone:\n\n(We will reply with the iyzico payment link.)'
                      : 'Klinik adı:\nYetkili:\nTelefon:\n\n(iyzico ödeme bağlantısını yanıt olarak göndereceğiz.)');
  var subj = (L === 'en') ? 'CliniPipes Order' : 'CliniPipes Sipariş';
  window.location.href = 'mailto:info@nodustrategy.com?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
}
if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', renderCart); } else { renderCart(); }
</script>"""
h = repl(h, "</script>", JS, "js")

# 9) setLang icine renderCart
h = repl(h,
    "  document.querySelectorAll('[data-' + lang + ']').forEach(el => {\n    el.innerHTML = el.getAttribute('data-' + lang);\n  });\n}",
    "  document.querySelectorAll('[data-' + lang + ']').forEach(el => {\n    el.innerHTML = el.getAttribute('data-' + lang);\n  });\n  renderCart();\n}",
    "setLang")

write("index.html", h)

# =================== iletisim.html (yeni) ===================
ILETISIM = '<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>İletişim — CliniPipes</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:sans-serif;background:#FAFAF8;color:#0E0E0C;line-height:1.7}.container{max-width:760px;margin:0 auto;padding:5rem 2rem}h1{font-size:2rem;margin-bottom:.5rem}.sub{color:#888780;font-size:.9rem;margin-bottom:2rem}h2{font-size:1.1rem;margin:2rem 0 .75rem}p{margin-bottom:.5rem;color:#3D3D3A}a{color:#1D9E75}.back{display:inline-block;margin-bottom:2rem;color:#1D9E75;text-decoration:none;font-size:.9rem}table{border-collapse:collapse;width:100%;margin-top:.5rem}td{padding:.6rem .5rem;border-bottom:1px solid rgba(14,14,12,.08);vertical-align:top;font-size:.95rem}td.k{color:#888780;width:38%}.todo{color:#C0392B;font-weight:600}</style></head><body><div class="container"><a href="/" class="back">\u2190 Ana Sayfa</a><h1>İletişim</h1><p class="sub">Satıcı bilgileri ve iletişim kanalları.</p><h2>Satıcı Bilgileri</h2><table><tr><td class="k">Ad Soyad / İşletme</td><td class="todo">[AD SOYAD — DOLDURUN]</td></tr><tr><td class="k">Vergi Kimlik No</td><td class="todo">[VKN — DOLDURUN]</td></tr><tr><td class="k">Vergi Dairesi</td><td class="todo">[VERGİ DAİRESİ — DOLDURUN]</td></tr><tr><td class="k">Merkez Adresi</td><td class="todo">[ADRES — DOLDURUN]</td></tr><tr><td class="k">KEP Adresi</td><td class="todo">[KEP — DOLDURUN]</td></tr><tr><td class="k">Telefon</td><td class="todo">[TELEFON — DOLDURUN]</td></tr><tr><td class="k">E-posta</td><td><a href="mailto:info@nodustrategy.com">info@nodustrategy.com</a></td></tr></table><h2>Çalışma Saatleri</h2><p>Hafta içi 09:00\u201318:00</p></div></body></html>\n'
write("iletisim.html", ILETISIM)

# =================== server.js (route) ===================
s = read("server.js")
s = repl(s, "'/mesafeli-satis':'mesafeli-satis.html'}",
         "'/mesafeli-satis':'mesafeli-satis.html','/iletisim':'iletisim.html'}", "server-route")
write("server.js", s)

# =================== mesafeli-satis.html (satici kimligi) ===================
m = read("mesafeli-satis.html")
m = repl(m, "<strong>Satıcı:</strong> Gökhan Avcı — info@nodustrategy.com",
         ("<strong>Satıcı:</strong> <span style=\"color:#C0392B;font-weight:600\">[AD SOYAD — DOLDURUN]</span><br>"
          "VKN: <span style=\"color:#C0392B;font-weight:600\">[VKN]</span> &nbsp;|&nbsp; "
          "Vergi Dairesi: <span style=\"color:#C0392B;font-weight:600\">[VERGİ DAİRESİ]</span><br>"
          "Adres: <span style=\"color:#C0392B;font-weight:600\">[ADRES]</span><br>"
          "Tel: <span style=\"color:#C0392B;font-weight:600\">[TELEFON]</span> &nbsp;|&nbsp; "
          "KEP: <span style=\"color:#C0392B;font-weight:600\">[KEP]</span> &nbsp;|&nbsp; "
          "E-posta: info@nodustrategy.com"), "mesafeli")
write("mesafeli-satis.html", m)

print("OK — tum degisiklikler uygulandi: index.html, iletisim.html (yeni), server.js, mesafeli-satis.html")
