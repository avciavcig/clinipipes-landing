import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const demoDir = path.join(root, 'demo');
const PORT = process.env.PORT || 8080;
const BASE = 'http://127.0.0.1:' + PORT;

async function shot(page, file, opts = {}) {
  await page.screenshot({ path: path.join(demoDir, file), type: 'png', ...opts });
  console.log('saved', file);
}

async function main() {
  fs.mkdirSync(demoDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const pages = [
    { url: '/demo/dashboard.html', file: 'dashboard.png', fullPage: false },
    { url: '/demo/sales.html', file: 'sales.png', fullPage: false },
    { url: '/demo/doctor.html', file: 'doctor.png', fullPage: false },
    { url: '/demo/form.html', file: 'form.png', fullPage: true, viewport: { width: 820, height: 900 } },
    { url: '/demo/pdf.html', file: 'pdf.png', fullPage: true, viewport: { width: 820, height: 900 } },
  ];

  for (const p of pages) {
    if (p.viewport) await page.setViewportSize(p.viewport);
    else await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(BASE + p.url);
    await page.waitForTimeout(500);
    await shot(page, p.file, { fullPage: !!p.fullPage });
  }

  await browser.close();
  console.log('Demo screenshots ready in demo/');
}

main().catch((e) => { console.error(e); process.exit(1); });
