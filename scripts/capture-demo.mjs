import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const demoDir = path.join(__dirname, '..', 'demo');
const PORT = process.env.PORT || 8080;
const BASE = 'http://127.0.0.1:' + PORT;
const VIEWPORT = { width: 1440, height: 900 };

const PAGES = [
  { url: '/demo/dashboard.html', file: 'dashboard.png' },
  { url: '/demo/sales.html', file: 'sales.png' },
  { url: '/demo/doctor.html', file: 'doctor.png' },
  { url: '/demo/form.html', file: 'form.png' },
  { url: '/demo/pdf.html', file: 'pdf.png' },
];

async function main() {
  fs.mkdirSync(demoDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });

  for (const p of PAGES) {
    await page.goto(BASE + p.url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({
      path: path.join(demoDir, p.file),
      type: 'png',
      fullPage: false
    });
    console.log('saved', p.file, VIEWPORT.width + 'x' + VIEWPORT.height);
  }

  await browser.close();
  console.log('Demo screenshots ready — all', VIEWPORT.width + 'x' + VIEWPORT.height);
}

main().catch((e) => { console.error(e); process.exit(1); });
