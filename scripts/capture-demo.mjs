import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const demoDir = path.join(root, 'demo');

async function shot(page, file, opts = {}) {
  await page.screenshot({ path: path.join(demoDir, file), type: 'png', ...opts });
  console.log('saved', file);
}

async function main() {
  fs.mkdirSync(demoDir, { recursive: true });

  const content = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
  if (content.gallery?.[0]?.src) {
    const m = content.gallery[0].src.match(/^data:image\/(\w+);base64,(.+)$/);
    if (m) fs.writeFileSync(path.join(demoDir, 'dashboard.png'), Buffer.from(m[2], 'base64'));
    console.log('saved dashboard.png from content.json');
  }

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto('file://' + path.join(demoDir, 'sales.html'));
  await page.waitForTimeout(300);
  await shot(page, 'sales.png', { fullPage: false });

  await page.setViewportSize({ width: 920, height: 1100 });
  await page.goto('file://' + path.join(demoDir, 'pdf.html'));
  await page.waitForTimeout(300);
  await shot(page, 'pdf.png', { fullPage: true });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://clinic-portal-production-3068.up.railway.app/form/54d115ed98192cda23a85c1f413618fd');
  await page.waitForLoadState('networkidle');
  await page.locator('h2:has-text("Patient Pre-Assessment Form")').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  const formBox = await page.locator('form').first().boundingBox();
  if (formBox) {
    await shot(page, 'form.png', { clip: { x: Math.max(0, formBox.x - 20), y: Math.max(0, formBox.y - 12), width: Math.min(1280, formBox.width + 40), height: Math.min(720, formBox.height + 24) } });
  } else {
    await shot(page, 'form.png');
  }

  await browser.close();
  console.log('Demo screenshots ready in demo/');
}

main().catch((e) => { console.error(e); process.exit(1); });
