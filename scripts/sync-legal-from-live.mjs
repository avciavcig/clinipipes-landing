#!/usr/bin/env node
/** Sync legal/static pages from live clinipipes.com → local HTML files. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = process.env.LIVE_URL || 'https://clinipipes.com';

const PAGES = {
  'hakkimizda.html': '/hakkimizda',
  'gizlilik.html': '/gizlilik',
  'teslimat.html': '/teslimat',
  'mesafeli-satis.html': '/mesafeli-satis',
  'sss.html': '/sss',
  'kullanim-kosullari.html': '/kullanim-kosullari',
  'etk.html': '/etk',
};

async function main() {
  for (const [file, route] of Object.entries(PAGES)) {
    const res = await fetch(BASE + route);
    if (!res.ok) throw new Error(`${route} → ${res.status}`);
    const html = await res.text();
    fs.writeFileSync(path.join(ROOT, file), html, 'utf8');
    console.log('saved', file);
  }
  console.log('Done — legal pages synced from', BASE);
}

main().catch(e => { console.error(e); process.exit(1); });
