#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pages } from './legal-content.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = process.env.LEGAL_OUT_DIR || ROOT;
const S = JSON.parse(fs.readFileSync(path.join(ROOT, 'legal-seller.json'), 'utf8'));

const CSS = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,-apple-system,sans-serif;font-size:.96rem;background:#FAFAF8;color:#0E0E0C;line-height:1.75}.container{max-width:760px;margin:0 auto;padding:4rem 2rem}h1{font-size:1.9rem;margin-bottom:.4rem;font-weight:700}h2{font-size:1.05rem;font-weight:600;margin:1.8rem 0 .5rem;color:#333}h3{font-size:.98rem;font-weight:600;margin:1.2rem 0 .4rem;color:#444}p,li{margin-bottom:.75rem;color:#3D3D3A}ul{padding-left:1.4rem;margin-bottom:1rem}a{color:#1D9E75}.back{display:inline-block;margin-bottom:2rem;color:#1D9E75;text-decoration:none;font-size:.88rem}.date{color:#888;font-size:.83rem;margin-bottom:2rem;display:block}.seller-box,.role-box{background:#f3f4f6;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;margin:1rem 0 1.5rem;font-size:.92rem}.legal-table{width:100%;border-collapse:collapse;margin:1rem 0;font-size:.88rem}.legal-table th,.legal-table td{border:1px solid #e5e7eb;padding:8px 10px;text-align:left;vertical-align:top}.legal-table th{background:#f9fafb}hr{border:none;border-top:1px solid #e5e7eb;margin:1.5rem 0}`;

function page(title, body) {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title} — CliniPipes</title><style>${CSS}</style></head><body><div class="container"><a href="/" class="back">← Ana Sayfa</a>${body}</div></body></html>`;
}

const TITLES = {
  'hakkimizda.html': 'Hakkımızda',
  'gizlilik.html': 'Gizlilik Politikası ve KVKK',
  'veri-rolu.html': 'Veri Koruma ve Rol Ayrımı',
  'cerez-politikasi.html': 'Çerez Politikası',
  'teslimat.html': 'Teslimat ve İade Koşulları',
  'mesafeli-satis.html': 'Mesafeli Hizmet Sözleşmesi',
  'kullanim-kosullari.html': 'Kullanım Koşulları',
  'etk.html': 'ETK Metni',
  'on-bilgilendirme.html': 'Ön Bilgilendirme Formu',
  'sss.html': 'Sıkça Sorulan Sorular',
};

const allPages = pages(S);
for (const [file, body] of Object.entries(allPages)) {
  const title = TITLES[file] || 'CliniPipes';
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, file), page(title, body), 'utf8');
  console.log('wrote', file);
}
