#!/usr/bin/env node
/** Capture demo PNGs from live clinic-portal production (v3). */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.join(__dirname, '..', 'demo');
const BASE = process.env.PORTAL_URL || 'https://clinic-portal-production-3068.up.railway.app';
const USER = process.env.DEMO_USER || 'owner';
const PASS = process.env.DEMO_PASS || 'DemoOwner123!';
const FORM_PATH = '/form/54d115ed98192cda23a85c1f413618fd';

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[name="username"]', USER);
  await page.fill('input[name="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  if (page.url().includes('change-password')) {
    await page.fill('input[name="newPassword"]', PASS);
    await page.fill('input[name="newPassword2"]', PASS);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
  }
  if (page.url().includes('/login')) {
    const err = await page.locator('.error, [role="alert"], .alert').first().textContent().catch(() => '');
    throw new Error(`Login failed at ${page.url()} ${err || ''}`);
  }
}

async function main() {
  fs.mkdirSync(DEMO, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await login(page);
    console.log('Logged in as', USER);

    await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(DEMO, 'dashboard.png'), type: 'png' });
    console.log('saved dashboard.png');

    await page.goto(`${BASE}/sales/pipeline`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(DEMO, 'sales.png'), type: 'png' });
    console.log('saved sales.png');

    const previewLink = page.locator('a[href*="/preview-pdf/"]').first();
    let pdfUrl = `${BASE}/preview-pdf/1`;
    if (await previewLink.count()) {
      pdfUrl = await previewLink.getAttribute('href');
      if (pdfUrl.startsWith('/')) pdfUrl = BASE + pdfUrl;
    }
    await page.setViewportSize({ width: 960, height: 1200 });
    await page.goto(pdfUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(DEMO, 'pdf.png'), type: 'png', fullPage: true });
    console.log('saved pdf.png from', pdfUrl);
  } catch (e) {
    console.warn('Auth capture failed:', e.message);
    console.warn('Will still capture public form page.');
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}${FORM_PATH}`, { waitUntil: 'networkidle' });
  await page.locator('h2').filter({ hasText: /Pre-Assessment|Patient/ }).first().scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(400);
  const form = page.locator('.form-box, form').first();
  if (await form.count()) {
    const box = await form.boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(DEMO, 'form.png'), type: 'png',
        clip: { x: Math.max(0, box.x - 24), y: Math.max(0, box.y - 16), width: Math.min(1440, box.width + 48), height: Math.min(900, box.height + 32) }
      });
    } else await page.screenshot({ path: path.join(DEMO, 'form.png'), type: 'png' });
  } else await page.screenshot({ path: path.join(DEMO, 'form.png'), type: 'png' });

  console.log('saved form.png');
  await browser.close();
}

main().catch(e => { console.error(e); process.exit(1); });
