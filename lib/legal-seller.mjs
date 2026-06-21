import fs from 'fs';
import path from 'path';

function trim(v) {
  return String(v ?? '').trim();
}

export function loadLegalSeller(root) {
  const raw = fs.readFileSync(path.join(root, 'legal-seller.json'), 'utf8');
  return JSON.parse(raw);
}

export function sellerBlock(S) {
  const name = trim(S.sellerName);
  const type = trim(S.sellerType);
  const brand = trim(S.brand) || 'CliniPipes';
  const address = trim(S.address);
  const phone = trim(S.phone);
  const email = trim(S.email);
  const taxOffice = trim(S.taxOffice);
  const taxNumber = trim(S.taxNumber);
  const mersis = trim(S.mersis);

  let h = `<div class="seller-box"><strong>Hizmet Sağlayıcı / Satıcı:</strong> ${name}${type ? ` (${type})` : ''}<br>`;
  h += `<strong>Marka:</strong> ${brand}<br>`;
  if (address) h += `<strong>Adres:</strong> ${address}<br>`;
  if (phone) h += `<strong>Telefon:</strong> ${phone}<br>`;
  if (email) h += `<strong>E-posta:</strong> <a href="mailto:${email}">${email}</a><br>`;
  if (taxOffice && taxNumber) {
    h += `<strong>Vergi Dairesi / No:</strong> ${taxOffice} — ${taxNumber}<br>`;
  } else if (taxNumber) {
    h += `<strong>Vergi / T.C. Kimlik No:</strong> ${taxNumber}<br>`;
  }
  if (mersis) h += `<strong>MERSİS:</strong> ${mersis}<br>`;
  h += `</div>`;
  return h;
}

export function applyLegalHtml(html, S) {
  const name = trim(S.sellerName);
  const email = trim(S.email);
  let out = String(html);
  const sb = sellerBlock(S);

  out = out.replace(/<div class="seller-box">[\s\S]*?<\/div>/gi, sb);

  if (email) {
    out = out.replace(/mailto:[^"'>\s]+/gi, `mailto:${email}`);
    out = out.replace(/(?<=[\s;>])([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?=[\s<.,;])/g, email);
  }

  if (name) {
    out = out.replace(/veri sorumlusu <strong>[^<]*<\/strong>/gi, `veri sorumlusu <strong>${name}</strong>`);
    out = out.replace(/(<strong>Hizmet Sağlayıcı:<\/strong> )[^<—]+( — CliniPipes)/gi, `$1${name}$2`);
    out = out.replace(/(<tr><td>Abone, fatura[^<]*<\/td><td><strong>)[^<]+(<\/strong>)/gi, `$1${name}$2`);
    out = out.replace(/(<tr><td>Web sitesi ziyaretçisi[^<]*<\/td><td><strong>)[^<]+(<\/strong>)/gi, `$1${name}$2`);
    out = out.replace(/; [^;]+ tarafından sunulan bulut tabanlı SaaS/gi, `; ${name} tarafından sunulan bulut tabanlı SaaS`);
    out = out.replace(/(<a href="\/gizlilik">KVKK Aydınlatma Metni<\/a> kapsamında )[^.<]+(\.<\/p>)/gi, `$1${email || name}$2`);
  }

  return out;
}

export function applyIndexContact(html, S) {
  const email = trim(S.email);
  if (!email) return String(html);
  let out = String(html);
  const mailto = `mailto:${email}`;
  const tr = `Destek: ${email}`;
  const en = `Support: ${email}`;

  out = out.replace(/<a\s+href="#"\s+([^>]*\bdata-contact-mail\b[^>]*)>/gi, `<a href="${mailto}" $1>`);
  out = out.replace(/<a\s+href="mailto:[^"]*"\s+([^>]*\bdata-contact-mail\b[^>]*)>/gi, `<a href="${mailto}" $1>`);

  out = out.replace(
    /(<a\s+href="mailto:[^"]*"\s+id="footerSupportLink"\s+data-contact-mail\s+)data-tr="[^"]*"\s+data-en="[^"]*"([^>]*>)[^<]*(<\/a>)/i,
    `$1data-tr="${tr}" data-en="${en}"$2${tr}$3`
  );

  return out;
}
