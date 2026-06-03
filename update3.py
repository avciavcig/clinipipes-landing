#!/usr/bin/env python3
# clinipipes-landing 3. guncelleme: Sepet -> Satin Al akisina Mesafeli Satis Sozlesmesi onayi
#  - Satin Al artik once sozlesme onay modalini acar (kaydirilabilir sozlesme + onay kutusu)
#  - Kutu isaretlenmeden satin alma butonu pasif
#  - Onay zamani siparis e-postasina yazilir
# Calistir: ~/clinipipes-landing icinde -> python3 update3.py
import io, sys
def read(p): return io.open(p,"r",encoding="utf-8").read()
def write(p,s): io.open(p,"w",encoding="utf-8").write(s)
def repl(s, old, new, label):
    if s.count(old) != 1:
        sys.exit("HATA [%s]: beklenen 1, bulunan %d. Hicbir sey yazilmadi." % (label, s.count(old)))
    return s.replace(old, new)

h = read("index.html")

# 1) sepet "Satın Al" butonu -> modal acar
h = repl(h, 'onclick="checkout()"', 'onclick="openCheckout()"', "cart-btn")

# 2) checkout() -> confirmPurchase(), onay zamani ekle, modal kapat
h = repl(h, "function checkout(){", "function confirmPurchase(){", "fn-rename")
h = repl(h, r"+ perTxt + '\n\n'",
         r"+ perTxt + '\n' + (L === 'en' ? 'Distance Sales Agreement accepted: ' : 'Mesafeli Satış Sözleşmesi onaylandı: ') + new Date().toLocaleString() + '\n\n'",
         "approval-line")
h = repl(h, "'&body=' + encodeURIComponent(body);\n}",
         "'&body=' + encodeURIComponent(body);\n  closeCheckout();\n}", "close-after")

# 3) openCheckout/closeCheckout fonksiyonlari (closeCart'tan sonra)
CLOSECART = "function closeCart(){ document.getElementById('cartOverlay').classList.remove('open'); document.getElementById('cartPanel').classList.remove('open'); }"
CO_JS = CLOSECART + """
function openCheckout(){
  var keys = Object.keys(cart).filter(function(k){ return cart[k]; });
  if(keys.length === 0){ return; }
  var rows = ''; var subtotal = 0;
  keys.forEach(function(k){ var li = lineFor(k); subtotal += li.price; rows += '<div class="row"><span>' + li.name + '</span><span>' + eur(li.price) + '</span></div>'; });
  var hasPlan = cart.starter || cart.pro;
  var bundle = (hasPlan && cart.setup) ? BUNDLE : 0;
  if(bundle){ rows += '<div class="row" style="color:var(--accent)"><span>' + t('Paket indirimi','Bundle discount') + '</span><span>\\u2212' + eur(bundle) + '</span></div>'; }
  rows += '<div class="row tot"><span>' + t('Toplam','Total') + '</span><span>' + eur(subtotal - bundle) + '</span></div>';
  document.getElementById('coSummary').innerHTML = rows;
  document.getElementById('coAgree').checked = false;
  document.getElementById('coConfirm').disabled = true;
  closeCart();
  document.getElementById('coOverlay').classList.add('open');
  document.getElementById('coModal').classList.add('open');
}
function closeCheckout(){
  document.getElementById('coOverlay').classList.remove('open');
  document.getElementById('coModal').classList.remove('open');
}"""
h = repl(h, CLOSECART, CO_JS, "co-js")

# 4) modal CSS -> </style> oncesi
CSS = """  .co-overlay { position: fixed; inset: 0; background: rgba(14,14,12,0.55); z-index: 1100; opacity: 0; visibility: hidden; transition: opacity 0.25s; }
  .co-overlay.open { opacity: 1; visibility: visible; }
  .co-modal { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -46%); width: 540px; max-width: 92vw; max-height: 88vh; background: var(--white); border-radius: 14px; z-index: 1101; display: flex; flex-direction: column; opacity: 0; visibility: hidden; transition: opacity 0.25s, transform 0.25s; box-shadow: 0 20px 60px rgba(14,14,12,0.3); }
  .co-modal.open { opacity: 1; visibility: visible; transform: translate(-50%, -50%); }
  .co-head { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.4rem; border-bottom: 1px solid var(--border); }
  .co-head h3 { font-family: 'Playfair Display', serif; font-size: 1.2rem; }
  .co-close { background: none; border: none; font-size: 1.6rem; cursor: pointer; color: var(--muted); line-height: 1; }
  .co-body { padding: 1.2rem 1.4rem; overflow-y: auto; }
  .co-summary { font-size: 0.88rem; margin-bottom: 1rem; }
  .co-summary .row { display: flex; justify-content: space-between; padding: 0.25rem 0; color: var(--muted); }
  .co-summary .row.tot { font-weight: 700; color: var(--dark); border-top: 1px solid var(--border); margin-top: 0.4rem; padding-top: 0.5rem; }
  .co-clabel { font-size: 0.8rem; font-weight: 600; color: var(--muted); margin-bottom: 0.4rem; }
  .co-contract { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; height: 220px; }
  .co-contract iframe { width: 100%; height: 100%; border: 0; display: block; }
  .co-check { display: flex; gap: 0.55rem; align-items: flex-start; font-size: 0.85rem; margin: 1rem 0; cursor: pointer; }
  .co-check input { margin-top: 0.2rem; flex-shrink: 0; }
  .co-confirm { width: 100%; background: var(--accent); color: #fff; border: none; padding: 0.85rem; border-radius: 6px; font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
  .co-confirm:disabled { opacity: 0.45; cursor: not-allowed; }
  .co-confirm:hover:not(:disabled) { background: var(--accent-dark); }
</style>"""
h = repl(h, "</style>", CSS, "css")

# 5) modal markup -> </body> oncesi
MODAL = """<div class="co-overlay" id="coOverlay" onclick="closeCheckout()"></div>
<div class="co-modal" id="coModal" role="dialog" aria-modal="true" aria-label="Sipariş Onayı">
  <div class="co-head">
    <h3 data-tr="Sipariş Onayı" data-en="Order Confirmation">Sipariş Onayı</h3>
    <button class="co-close" onclick="closeCheckout()" aria-label="Kapat">&times;</button>
  </div>
  <div class="co-body">
    <div class="co-summary" id="coSummary"></div>
    <div class="co-clabel" data-tr="Mesafeli Satış Sözleşmesi" data-en="Distance Sales Agreement">Mesafeli Satış Sözleşmesi</div>
    <div class="co-contract"><iframe src="/mesafeli-satis" title="Mesafeli Satış Sözleşmesi"></iframe></div>
    <label class="co-check"><input type="checkbox" id="coAgree" onchange="document.getElementById('coConfirm').disabled = !this.checked"><span data-tr="Mesafeli Satış Sözleşmesi'ni okudum ve onaylıyorum." data-en="I have read and accept the Distance Sales Agreement.">Mesafeli Satış Sözleşmesi'ni okudum ve onaylıyorum.</span></label>
    <button class="co-confirm" id="coConfirm" disabled onclick="confirmPurchase()" data-tr="Satın Al" data-en="Buy Now">Satın Al</button>
  </div>
</div>
</body>"""
h = repl(h, "</body>", MODAL, "modal")

write("index.html", h)
print("OK — sozlesme onay modali eklendi (Satin Al -> sozlesme + onay kutusu -> tamamla).")
