var lang = 'tr', period = 'monthly', BUNDLE = 20, foundingActive = false;
var PRICES = {
  starter: { monthly: 45, yearly: 450, recurring: true, tr: 'Başlangıç Planı', en: 'Starter Plan' },
  pro: { monthly: 95, yearly: 950, recurring: true, tr: 'Pro Plan', en: 'Pro Plan' },
  setup: { oneoff: 100, recurring: false, tr: 'Kurulum Hizmeti', en: 'Setup Service' }
};
var cart = { starter: false, pro: false, setup: false };

function t(tr, en) { return lang === 'en' ? en : tr; }
function eur(n) { return '$' + n; }

function toggleLang() {
  lang = lang === 'tr' ? 'en' : 'tr';
  document.documentElement.lang = lang;
  document.querySelector('.lang-btn').textContent = lang === 'tr' ? 'EN' : 'TR';
  document.querySelectorAll('[data-tr]').forEach(function (el) {
    var txt = el.getAttribute('data-' + lang);
    if (!txt) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = txt;
    else el.innerHTML = txt;
  });
  renderCart();
}

function toggleFaq(q) {
  var item = q.parentElement;
  var wasOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function (i) { i.classList.remove('open'); });
  if (!wasOpen) item.classList.add('open');
}

function setTab(tab) {
  document.querySelectorAll('.demo-tab').forEach(function (t) { t.classList.remove('on'); });
  tab.classList.add('on');
  var key = tab.getAttribute('data-demo');
  document.querySelectorAll('.demo-panel').forEach(function (p) {
    p.classList.toggle('on', p.getAttribute('data-demo') === key);
  });
}

function addToCart(key) {
  if (key === 'starter') cart.pro = false;
  if (key === 'pro') cart.starter = false;
  cart[key] = true;
  renderCart();
  openCart();
}

function removeFromCart(key) {
  cart[key] = false;
  renderCart();
}

function setPeriod(p) {
  period = p;
  document.getElementById('perMonthly').classList.toggle('active', p === 'monthly');
  document.getElementById('perYearly').classList.toggle('active', p === 'yearly');
  renderCart();
}

function openCart() {
  document.getElementById('cartOverlay').classList.add('open');
  document.getElementById('cartPanel').classList.add('open');
}

function closeCart() {
  document.getElementById('cartOverlay').classList.remove('open');
  document.getElementById('cartPanel').classList.remove('open');
}

function lineFor(key) {
  var p = PRICES[key];
  if (key === 'setup') return { name: t(p.tr, p.en), price: p.oneoff, sub: t('tek seferlik', 'one-time') };
  var amt = period === 'yearly' ? p.yearly : p.monthly;
  return { name: t(p.tr, p.en), price: amt, sub: eur(amt) + (period === 'yearly' ? t('/yıl', '/yr') : t('/ay', '/mo')) };
}

function renderCart() {
  var cc = document.getElementById('cartCount');
  if (!cc) return;
  var keys = Object.keys(cart).filter(function (k) { return cart[k]; });
  cc.textContent = keys.length;
  var itemsEl = document.getElementById('cartItems');
  var footEl = document.getElementById('cartFoot');
  if (!keys.length) {
    itemsEl.innerHTML = '<div class="cart-empty">' + t('Sepetiniz boş.', 'Your cart is empty.') + '</div>';
    footEl.innerHTML = '';
    return;
  }
  var rows = '', subtotal = 0;
  keys.forEach(function (k) {
    var L = lineFor(k);
    subtotal += L.price;
    rows += '<div class="cart-item"><div><div class="cart-item-name">' + L.name + '</div><div class="cart-item-sub">' + L.sub + '</div></div>'
      + '<div style="display:flex;gap:.5rem;align-items:flex-start"><span class="cart-item-price">' + eur(L.price) + '</span>'
      + '<button class="cart-item-rm" onclick="removeFromCart(\'' + k + '\')">✕</button></div></div>';
  });
  itemsEl.innerHTML = rows;
  var bundle = (cart.starter || cart.pro) && cart.setup ? BUNDLE : 0;
  var total = subtotal - bundle;
  var f = '';
  f += '<div class="cart-line"><span>' + t('Ara toplam', 'Subtotal') + '</span><span>' + eur(subtotal) + '</span></div>';
  if (bundle) f += '<div class="cart-line discount"><span>' + t('Paket indirimi', 'Bundle discount') + '</span><span>−' + eur(bundle) + '</span></div>';
  f += '<div class="cart-total"><span>' + t('Toplam', 'Total') + '</span><span>' + eur(total) + '</span></div>';
  f += '<button class="cart-checkout" onclick="openCheckout()">' + t('Satın Al', 'Buy Now') + '</button>';
  f += '<div class="cart-note">' + t('Sipariş e-posta ile alınır. iyzico ödeme bağlantısı yanıt olarak gönderilir.', 'Order by email. iyzico payment link sent in reply.') + '</div>';
  footEl.innerHTML = f;
}

function openCheckout() {
  var keys = Object.keys(cart).filter(function (k) { return cart[k]; });
  if (!keys.length) return;
  var rows = '', subtotal = 0;
  keys.forEach(function (k) {
    var L = lineFor(k);
    subtotal += L.price;
    rows += '<div class="row"><span>' + L.name + '</span><span>' + eur(L.price) + '</span></div>';
  });
  var bundle = (cart.starter || cart.pro) && cart.setup ? BUNDLE : 0;
  if (bundle) rows += '<div class="row" style="color:var(--g)"><span>' + t('Paket indirimi', 'Bundle') + '</span><span>−' + eur(bundle) + '</span></div>';
  rows += '<div class="row tot"><span>' + t('Toplam', 'Total') + '</span><span>' + eur(subtotal - bundle) + '</span></div>';
  document.getElementById('coSummary').innerHTML = rows;
  document.getElementById('coAgree').checked = false;
  document.getElementById('coConfirm').disabled = true;
  closeCart();
  document.getElementById('coOverlay').classList.add('open');
  document.getElementById('coModal').classList.add('open');
}

function closeCheckout() {
  document.getElementById('coOverlay').classList.remove('open');
  document.getElementById('coModal').classList.remove('open');
}

function confirmPurchase() {
  var keys = Object.keys(cart).filter(function (k) { return cart[k]; });
  if (!keys.length) return;
  var lines = [], subtotal = 0;
  keys.forEach(function (k) {
    var L = lineFor(k);
    subtotal += L.price;
    lines.push('- ' + L.name + ': ' + eur(L.price) + ' (' + L.sub + ')');
  });
  var bundle = (cart.starter || cart.pro) && cart.setup ? BUNDLE : 0;
  var body = (lang === 'en' ? 'Order — CliniPipes\n\n' : 'Sipariş — CliniPipes\n\n') + lines.join('\n') + '\n';
  if (bundle) body += (lang === 'en' ? 'Bundle discount: −' : 'Paket indirimi: −') + eur(bundle) + '\n';
  body += (lang === 'en' ? 'Total: ' : 'Toplam: ') + eur(subtotal - bundle) + '\n';
  body += (lang === 'en' ? 'Billing: ' : 'Ödeme periyodu: ') + (period === 'yearly' ? t('Yıllık', 'Yearly') : t('Aylık', 'Monthly')) + '\n\n';
  body += lang === 'en'
    ? 'Clinic name:\nContact:\nPhone:\n'
    : 'Klinik adı:\nYetkili:\nTelefon:\n';
  window.location.href = 'mailto:info@nodustrategy.com?subject=' + encodeURIComponent(lang === 'en' ? 'CliniPipes Order' : 'CliniPipes Sipariş')
    + '&body=' + encodeURIComponent(body);
  closeCheckout();
  if (foundingActive) {
    fetch('/api/claim-slot', { method: 'POST' }).catch(function () {});
    foundingActive = false;
  }
}

function paintCard(id, listM, nowM, listY, nowY) {
  var w = document.getElementById('was' + id);
  var n = document.getElementById('now' + id);
  var y = document.getElementById('yr' + id);
  if (n) n.textContent = '$' + nowM;
  if (w) {
    if (listM !== nowM) { w.textContent = '$' + listM; w.style.display = 'inline'; }
    else w.style.display = 'none';
  }
  if (y) y.textContent = (lang === 'en' ? 'or $' : 'veya $') + nowY + (lang === 'en' ? '/year — 2 months free' : '/yıl — 2 ay bedava');
}

function loadPrices() {
  fetch('/content.json').then(function (r) { return r.json(); }).then(function (c) {
    if (!c || !c.prices) return;
    var p = c.prices, disc = 0, rem = 0;
    if (c.founding && c.founding.slots_remaining > 0) {
      disc = (c.founding.discount || 50) / 100;
      rem = c.founding.slots_remaining;
      foundingActive = true;
    }
    BUNDLE = +(p.bundle || 20);
    var sm = +p.sm, sy = +p.sy, pm = +p.pm, py = +p.py, su = +p.setup;
    var smN = disc ? Math.round(sm * (1 - disc)) : sm;
    var syN = disc ? Math.round(sy * (1 - disc)) : sy;
    var pmN = disc ? Math.round(pm * (1 - disc)) : pm;
    var pyN = disc ? Math.round(py * (1 - disc)) : py;
    var suN = disc ? Math.round(su * (1 - disc)) : su;
    PRICES.starter.monthly = smN; PRICES.starter.yearly = syN;
    PRICES.pro.monthly = pmN; PRICES.pro.yearly = pyN;
    PRICES.setup.oneoff = suN;
    paintCard('Starter', sm, smN, sy, syN);
    paintCard('Pro', pm, pmN, py, pyN);
    paintCard('Setup', su, suN, su, suN);
    var slots = document.getElementById('foundingBannerSlots');
    var strip = document.querySelector('.strip-slots');
    var txt = rem + (lang === 'en' ? ' slots left' : ' slot kaldı');
    if (slots) slots.textContent = txt;
    if (strip) strip.textContent = txt;
  }).catch(function () {});
}

document.querySelectorAll('.reveal').forEach(function (el) {
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.1 }).observe(el);
});

document.addEventListener('DOMContentLoaded', function () {
  renderCart();
  loadPrices();
});
