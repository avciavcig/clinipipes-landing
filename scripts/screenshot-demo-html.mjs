#!/usr/bin/env node
/** Screenshot demo HTML + production form → demo/*.png (no Docker). */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.join(__dirname, '..', 'demo');
const BASE = process.env.DEMO_BASE || 'http://127.0.0.1:8080';
const FORM_URL = process.env.DEMO_FORM_URL || 'https://app.clinipipes.com/form/your-clinic-token';

async function shot(page, file, opts = {}) {
  await page.screenshot({ path: path.join(DEMO, file), type: 'png', ...opts });
  const st = fs.statSync(path.join(DEMO, file));
  console.log('saved', file, st.size, 'bytes');
}

async function main() {
  fs.mkdirSync(DEMO, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  for (const [file, html] of [
    ['dashboard.png', '/demo/dashboard.html'],
    ['sales.png', '/demo/sales.html'],
    ['pdf.png', '/demo/pdf.html'],
  ]) {
    await page.goto(BASE + html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    if (file === 'pdf.png') {
      await page.setViewportSize({ width: 960, height: 1200 });
      await shot(page, file, { fullPage: true });
      await page.setViewportSize({ width: 1440, height: 900 });
    } else {
      await shot(page, file);
    }
  }

  await page.goto(FORM_URL, { waitUntil: 'networkidle' });
  await page.locator('h2').filter({ hasText: /Pre-Assessment|Patient/ }).first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(400);
  const form = page.locator('form').first();
  if (await form.count()) {
    const box = await form.boundingBox();
    if (box) {
      await shot(page, 'form.png', {
        clip: { x: Math.max(0, box.x - 24), y: Math.max(0, box.y - 16), width: Math.min(1440, box.width + 48), height: Math.min(820, box.height + 32) }
      });
    } else await shot(page, 'form.png');
  } else await shot(page, 'form.png');

  await browser.close();
  console.log('Done');
}

main().catch(e => { console.error(e); process.exit(1); });
