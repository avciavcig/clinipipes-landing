var lang = 'tr', period = 'monthly', BUNDLE = 20, foundingActive = false, checkoutToken = '';
var PRICES = {
  starter: { monthly: 45, yearly: 450, recurring: true, tr: 'Başlangıç Planı', en: 'Starter Plan' },
  pro: { monthly: 79, yearly: 790, recurring: true, tr: 'Professional Plan', en: 'Professional Plan' },
  setup: { oneoff: 99, recurring: false, tr: 'Kurulum Hizmeti', en: 'Setup Service' }
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
    else if (el.classList.contains('section-h') || el.tagName === 'H1') el.innerHTML = txt;
    else el.textContent = txt;
  });
  renderCart();
  loadPrices();
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
  var scroll = document.querySelector('.demo-scroll');
  if (scroll) scroll.scrollTop = 0;
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
  f += '<div class="cart-note">' + t('Güvenli sipariş formu. Siparişiniz alındıktan sonra ödeme bağlantısı e-posta ile iletilecektir.', 'Secure order form. After your order is received, a payment link will be sent by email.') + '</div>';
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
  document.getElementById('coPreInfo').checked = false;
  document.getElementById('coDigital').checked = false;
  document.getElementById('coKvkk').checked = false;
  updateCheckoutConfirm();
  closeCart();
  document.getElementById('coOverlay').classList.add('open');
  document.getElementById('coModal').classList.add('open');
}

function updateCheckoutConfirm() {
  var ok = document.getElementById('coPreInfo').checked
    && document.getElementById('coAgree').checked
    && document.getElementById('coDigital').checked
    && document.getElementById('coKvkk').checked;
  document.getElementById('coConfirm').disabled = !ok;
}

function closeCheckout() {
  document.getElementById('coOverlay').classList.remove('open');
  document.getElementById('coModal').classList.remove('open');
}

function confirmPurchase() {
  var keys = Object.keys(cart).filter(function (k) { return cart[k]; });
  if (!keys.length) return;
  var clinicName = (document.getElementById('coClinic') || {}).value || '';
  var ownerEmail = (document.getElementById('coEmail') || {}).value || '';
  var phone = (document.getElementById('coPhone') || {}).value || '';
  var honeypot = (document.getElementById('coWebsite') || {}).value || '';
  if (!clinicName.trim() || !ownerEmail.trim()) {
    alert(lang === 'en' ? 'Please enter clinic name and email.' : 'Klinik adı ve e-posta zorunludur.');
    return;
  }
  var btn = document.getElementById('coConfirm');
  if (btn) { btn.disabled = true; btn.textContent = lang === 'en' ? 'Sending…' : 'Gönderiliyor…'; }
  fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      checkoutToken: checkoutToken,
      website: honeypot,
      clinicName: clinicName.trim(),
      ownerEmail: ownerEmail.trim(),
      phone: phone.trim(),
      items: keys,
      period: period,
      consents: {
        preInfo: document.getElementById('coPreInfo').checked,
        agree: document.getElementById('coAgree').checked,
        digital: document.getElementById('coDigital').checked,
        kvkk: document.getElementById('coKvkk').checked
      }
    })
  }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, data: d }; }); })
    .then(function (res) {
      if (btn) { btn.disabled = false; btn.textContent = lang === 'en' ? 'Submit Order' : 'Siparişi Gönder'; }
      if (!res.data.ok) {
        alert((lang === 'en' ? 'Order failed: ' : 'Sipariş gönderilemedi: ') + (res.data.error || '?'));
        return;
      }
      closeCheckout();
      alert(res.data.mode === 'provisioned'
        ? (lang === 'en' ? 'Account created! Check your email for login details.' : 'Hesabınız oluşturuldu! Giriş bilgileri e-postanıza gönderildi.')
        : (lang === 'en' ? 'Order received. We will contact you shortly with payment details.' : 'Siparişiniz alındı. Ödeme detayları için kısa süre içinde sizinle iletişime geçeceğiz.'));
      if (foundingActive) {
        fetch('/api/claim-slot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutToken: checkoutToken })
        }).catch(function () {});
        foundingActive = false;
      }
      refreshCheckoutToken();
    })
    .catch(function () {
      if (btn) { btn.disabled = false; btn.textContent = lang === 'en' ? 'Submit Order' : 'Siparişi Gönder'; }
      alert(lang === 'en' ? 'Connection error. Please try again.' : 'Bağlantı hatası. Lütfen tekrar deneyin.');
    });
}

function refreshCheckoutToken() {
  fetch('/api/checkout-token').then(function (r) { return r.json(); }).then(function (d) {
    if (d.token) checkoutToken = d.token;
  }).catch(function () {});
}

function fmtUsd(n) {
  return '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function paintCard(id, listM, nowM, listY, nowY) {
  var w = document.getElementById('was' + id);
  var n = document.getElementById('now' + id);
  var y = document.getElementById('yr' + id);
  if (n) n.textContent = fmtUsd(nowM);
  if (w) {
    if (listM !== nowM) { w.textContent = fmtUsd(listM); w.style.display = 'inline'; }
    else w.style.display = 'none';
  }
  if (y) {
    var save = lang === 'en' ? ' — Save 2 months.' : ' — 2 ay bedava';
    var yrSuffix = lang === 'en' ? '/year' : '/yıl';
    if (listY !== nowY) y.innerHTML = '<s>' + fmtUsd(listY) + yrSuffix + '</s> ' + fmtUsd(nowY) + yrSuffix + save;
    else y.textContent = fmtUsd(nowY) + yrSuffix + save;
  }
}

function loadPrices() {
  fetch('/content.json').then(function (r) { return r.json(); }).then(function (c) {
    if (!c) return;
    if (c.prices) {
      var p = c.prices, rem = 0;
      var sm = +p.sm, pm = +p.pm, su = +p.setup;
      var sy = +(p.sy || sm * 10), py = +(p.py || pm * 10);
      var smN = sm, syN = sy, pmN = pm, pyN = py, suN = su;
      if (c.founding && c.founding.slots_remaining > 0) {
        rem = c.founding.slots_remaining;
        foundingActive = true;
        smN = +(p.sm_f != null ? p.sm_f : sm);
        syN = +(p.sy_f != null ? p.sy_f : sy);
        pmN = +(p.pm_f != null ? p.pm_f : pm);
        pyN = +(p.py_f != null ? p.py_f : py);
        suN = +(p.setup_f != null ? p.setup_f : su);
      } else foundingActive = false;
      BUNDLE = +(p.bundle || 0);
      PRICES.starter.monthly = smN; PRICES.starter.yearly = syN;
      PRICES.pro.monthly = pmN; PRICES.pro.yearly = pyN;
      PRICES.setup.oneoff = suN;
      paintCard('Starter', sm, smN, sy, syN);
      paintCard('Pro', pm, pmN, py, pyN);
      paintCard('Setup', su, suN, su, suN);
      var slots = document.getElementById('foundingBannerSlots');
      var strip = document.getElementById('foundingStripSlots');
      var txt = rem + (lang === 'en' ? ' spots remaining' : ' slot kaldı');
      if (slots) slots.textContent = txt;
      if (strip) strip.textContent = txt;
    }
    if (c.founding) {
      var stripEl = document.querySelector('.founding-strip span:first-child');
      if (stripEl) {
        var st = lang === 'en' ? (c.founding.strip_en || c.founding.strip_tr) : c.founding.strip_tr;
        if (st) stripEl.textContent = st;
      }
      var banner = document.querySelector('.founding-banner p');
      if (banner && c.founding.banner_title_tr) {
        var bt = lang === 'en' ? c.founding.banner_title_en : c.founding.banner_title_tr;
        var bd = lang === 'en' ? c.founding.banner_desc_en : c.founding.banner_desc_tr;
        banner.innerHTML = '🏆 <strong data-tr="' + c.founding.banner_title_tr + '" data-en="' + (c.founding.banner_title_en || '') + '">' + bt + '</strong> — <span data-tr="' + c.founding.banner_desc_tr + '" data-en="' + (c.founding.banner_desc_en || '') + '">' + bd + '</span>';
      }
    }
    if (c.demo) applyDemo(c.demo);
    if (c.landing) applyLanding(c.landing);
    loadDemoData();
  }).catch(function () { loadDemoData(); });
}

function loadDemoData() {
  fetch('/demo-data.json').then(function (r) { return r.json(); }).then(function (d) {
    if (d.hero) applyHeroMock(d.hero);
  }).catch(function () {});
}

var TAG_CLASS = { ok: 'tag-ok', p: 'tag-p', w: 'tag-w', f: 'tag-f' };

function applyHeroMock(h) {
  var kpis = document.getElementById('hm-kpis');
  if (kpis && h.kpis) {
    kpis.querySelectorAll('.mock-kpi').forEach(function (el, i) {
      var k = h.kpis[i]; if (!k) return;
      var v = el.querySelector('.mock-kpi-v');
      var l = el.querySelector('.mock-kpi-l');
      if (v) {
        v.textContent = k.v;
        v.style.color = k.highlight ? 'var(--g)' : '';
      }
      if (l) l.textContent = lang === 'en' ? (k.l_en || k.l_tr) : k.l_tr;
    });
  }
  var rows = document.getElementById('hm-rows');
  if (!rows || !h.rows) return;
  var hdrs = lang === 'en' ? (h.headers_en || h.headers_tr || ['PATIENT', 'STATUS', 'QUOTE']) : (h.headers_tr || ['HASTA', 'DURUM', 'TEKLİF']);
  var hdr = '<div class="mock-table-row" style="padding-bottom:.35rem;margin-bottom:.2rem"><div style="font-size:.62rem;color:rgba(255,255,255,.2);font-weight:600;letter-spacing:.05em">' + hdrs[0] + '</div><div style="font-size:.62rem;color:rgba(255,255,255,.2);font-weight:600">' + hdrs[1] + '</div><div style="font-size:.62rem;color:rgba(255,255,255,.2);font-weight:600;text-align:right">' + hdrs[2] + '</div></div>';
  rows.innerHTML = hdr;
  h.rows.forEach(function (r) {
    var tag = TAG_CLASS[r.tag] || 'tag-w';
    var status = lang === 'en' ? (r.status_en || r.status_tr) : r.status_tr;
    rows.innerHTML += '<div class="mock-table-row"><div><div class="patient-n">' + r.name + '</div><div class="patient-c">' + r.meta + '</div></div><div><span class="mock-tag ' + tag + '">' + status + '</span></div><div class="mock-amt">' + r.amount + '</div></div>';
  });
}

function applyDemo(d) {
  var v = d.version || 1;
  var sec = document.querySelector('.demo .reveal');
  if (sec) {
    var ey = sec.querySelector('.eyebrow');
    var h2 = sec.querySelector('.section-h');
    var p = sec.querySelector('.section-p');
    if (ey && d.eyebrow_tr) { ey.setAttribute('data-tr', d.eyebrow_tr); ey.setAttribute('data-en', d.eyebrow_en || ''); ey.textContent = lang === 'en' ? (d.eyebrow_en || d.eyebrow_tr) : d.eyebrow_tr; }
    if (h2 && d.title_tr) { h2.setAttribute('data-tr', d.title_tr); h2.setAttribute('data-en', d.title_en || ''); h2.innerHTML = lang === 'en' ? (d.title_en || d.title_tr) : d.title_tr; }
    if (p && d.sub_tr) { p.setAttribute('data-tr', d.sub_tr); p.setAttribute('data-en', d.sub_en || ''); p.textContent = lang === 'en' ? (d.sub_en || d.sub_tr) : d.sub_tr; }
  }
  (d.items || []).forEach(function (item) {
    var tab = document.querySelector('.demo-tab[data-demo="' + item.id + '"]');
    if (tab) {
      tab.setAttribute('data-tr', item.tab_tr); tab.setAttribute('data-en', item.tab_en || '');
      tab.textContent = lang === 'en' ? (item.tab_en || item.tab_tr) : item.tab_tr;
    }
    var panel = document.querySelector('.demo-panel[data-demo="' + item.id + '"]');
    if (!panel) return;
    var img = panel.querySelector('img');
    if (img) { img.src = '/demo/' + item.id + '.png?v=' + v; img.alt = item.tab_tr || item.id; }
    var cap = panel.querySelector('.demo-cap');
    if (cap && item.cap_tr) {
      cap.setAttribute('data-tr', item.cap_tr); cap.setAttribute('data-en', item.cap_en || '');
      cap.textContent = lang === 'en' ? (item.cap_en || item.cap_tr) : item.cap_tr;
    }
  });
}

function applyLanding(l) {
  if (l.hero) {
    var h = l.hero;
    var map = [['.h-eyebrow', 'eyebrow'], ['.hero h1', 'title'], ['.hero-desc', 'desc']];
    map.forEach(function (pair) {
      var el = document.querySelector(pair[0]);
      var k = pair[1];
      if (!el || !h[k + '_tr']) return;
      el.setAttribute('data-tr', h[k + '_tr']); el.setAttribute('data-en', h[k + '_en'] || '');
      if (k === 'title') el.innerHTML = lang === 'en' ? (h[k + '_en'] || h[k + '_tr']) : h[k + '_tr'];
      else el.textContent = lang === 'en' ? (h[k + '_en'] || h[k + '_tr']) : h[k + '_tr'];
    });
  }
  if (l.sections) applyLandingSections(l.sections);
  if (l.faq && l.faq.length) {
    document.querySelectorAll('.faq-item').forEach(function (item, i) {
      var f = l.faq[i]; if (!f) return;
      var q = item.querySelector('.faq-q');
      var a = item.querySelector('.faq-a');
      if (q) { q.setAttribute('data-tr', f.q_tr); q.setAttribute('data-en', f.q_en || ''); q.textContent = lang === 'en' ? (f.q_en || f.q_tr) : f.q_tr; }
      if (a) { a.setAttribute('data-tr', f.a_tr); a.setAttribute('data-en', f.a_en || ''); a.textContent = lang === 'en' ? (f.a_en || f.a_tr) : f.a_tr; }
    });
  }
}

function setBi(el, tr, en, html) {
  if (!el || !tr) return;
  el.setAttribute('data-tr', tr);
  el.setAttribute('data-en', en || '');
  var txt = lang === 'en' ? (en || tr) : tr;
  if (html) el.innerHTML = txt;
  else el.textContent = txt;
}

function applyLandingSections(s) {
  if (s.trust) {
    document.querySelectorAll('.h-trust-item').forEach(function (el, i) {
      var t = s.trust[i]; if (!t) return;
      var v = el.querySelector('.trust-val');
      var lbl = el.querySelector('.trust-lbl');
      if (v) v.textContent = t.val;
      if (lbl) setBi(lbl, t.lbl_tr, t.lbl_en);
    });
  }
  if (s.compare) {
    var cmp = document.querySelector('.compare .reveal');
    var c = s.compare;
    if (cmp) {
      setBi(cmp.querySelector('.eyebrow'), c.eyebrow_tr, c.eyebrow_en);
      setBi(cmp.querySelector('.section-h'), c.title_tr, c.title_en, true);
      setBi(cmp.querySelector('.section-p'), c.desc_tr, c.desc_en);
    }
    setBi(document.querySelector('.col-before .compare-head'), c.before_head_tr, c.before_head_en);
    setBi(document.querySelector('.col-after .compare-head'), c.after_head_tr, c.after_head_en);
    renderListItems('.col-before .compare-body', c.before, 'compare');
    renderListItems('.col-after .compare-body', c.after, 'compare');
  }
  if (s.pipeline) {
    var pip = document.querySelector('.pipeline .reveal');
    var p = s.pipeline;
    if (pip) {
      setBi(pip.querySelector('.eyebrow'), p.eyebrow_tr, p.eyebrow_en);
      setBi(pip.querySelector('.section-h'), p.title_tr, p.title_en, true);
      setBi(pip.querySelector('.section-p'), p.desc_tr, p.desc_en);
    }
    var noteWrap = document.getElementById('pipe-note');
    if (noteWrap && p.note_tr) setBi(noteWrap, p.note_tr, p.note_en, true);
    var steps = document.getElementById('pipe-track');
    if (steps && p.steps) {
      steps.innerHTML = p.steps.map(function (st) {
        var title = lang === 'en' ? (st.title_en || st.title_tr) : st.title_tr;
        var desc = lang === 'en' ? (st.desc_en || st.desc_tr) : st.desc_tr;
        return '<div class="pipe-step"><div class="pipe-icon">' + st.icon + '</div><h4 data-tr="' + st.title_tr + '" data-en="' + (st.title_en || '') + '">' + title + '</h4><p data-tr="' + st.desc_tr + '" data-en="' + (st.desc_en || '') + '">' + desc + '</p></div>';
      }).join('');
    }
  }
  if (s.features) {
    var feat = document.querySelector('.features .reveal');
    var f = s.features;
    if (feat) {
      setBi(feat.querySelector('.eyebrow'), f.eyebrow_tr, f.eyebrow_en);
      setBi(feat.querySelector('.section-h'), f.title_tr, f.title_en, true);
      setBi(feat.querySelector('.section-p'), f.desc_tr, f.desc_en);
    }
    var grid = document.querySelector('.feat-grid');
    if (grid && f.items) {
      grid.innerHTML = f.items.map(function (it) {
        var title = lang === 'en' ? (it.title_en || it.title_tr) : it.title_tr;
        var desc = lang === 'en' ? (it.desc_en || it.desc_tr) : it.desc_tr;
        return '<div class="feat"><div class="feat-ic">' + it.icon + '</div><h3 data-tr="' + it.title_tr + '" data-en="' + (it.title_en || '') + '">' + title + '</h3><p data-tr="' + it.desc_tr + '" data-en="' + (it.desc_en || '') + '">' + desc + '</p></div>';
      }).join('');
    }
  }
  if (s.cta) {
    var cta = document.querySelector('.cta-fin .wrap');
    var ct = s.cta;
    if (cta) {
      setBi(cta.querySelector('.eyebrow'), ct.eyebrow_tr, ct.eyebrow_en);
      setBi(cta.querySelector('h2'), ct.title_tr, ct.title_en, true);
      setBi(cta.querySelector('p'), ct.desc_tr, ct.desc_en);
      var btns = cta.querySelectorAll('.cta-group a');
      if (btns[0]) setBi(btns[0], ct.btn_tr, ct.btn_en);
      if (btns[1]) setBi(btns[1], ct.btn2_tr, ct.btn2_en);
    }
  }
}

function renderListItems(sel, items, type) {
  var body = document.querySelector(sel);
  if (!body || !items) return;
  body.innerHTML = items.map(function (it) {
    var txt = lang === 'en' ? (it.text_en || it.text_tr) : it.text_tr;
    return '<div class="compare-item"><span class="icon">' + it.icon + '</span><span data-tr="' + it.text_tr + '" data-en="' + (it.text_en || '') + '">' + txt + '</span></div>';
  }).join('');
}

document.querySelectorAll('.reveal').forEach(function (el) {
  new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.1 }).observe(el);
});

document.addEventListener('DOMContentLoaded', function () {
  renderCart();
  loadPrices();
  refreshCheckoutToken();
});
