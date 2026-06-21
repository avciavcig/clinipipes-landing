#!/usr/bin/env node
/** Capture demo PNGs from live clinic-portal production. */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.join(__dirname, '..', 'demo');
const BASE = (process.env.PORTAL_URL || 'https://clinic-portal-production-3068.up.railway.app').replace(/\/$/, '');
const OWNER_EMAIL = process.env.DEMO_USER || process.env.DEMO_EMAIL || '';
const OWNER_PASS = process.env.DEMO_PASS || '';
const DOCTOR_EMAIL = process.env.DEMO_DOCTOR_USER || process.env.DEMO_DOCTOR_EMAIL || '';
const DOCTOR_PASS = process.env.DEMO_DOCTOR_PASS || OWNER_PASS;
const FORM_PATH = process.env.DEMO_FORM_PATH || '/form/54d115ed98192cda23a85c1f413618fd';

async function login(page, email, password) {
  if (!email || !password) throw new Error('DEMO_USER (e-posta) ve DEMO_PASS gerekli');
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[name="username"]');
  await page.fill('input[name="username"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }).catch(function () {}),
    page.click('button[type="submit"]')
  ]);
  await page.waitForTimeout(400);
  if (page.url().includes('change-password')) {
    await page.fill('input[name="newPassword"]', password);
    await page.fill('input[name="newPassword2"]', password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }).catch(function () {}),
      page.click('button[type="submit"]')
    ]);
  }
  if (page.url().includes('/login')) {
    const err = await page.locator('.error').first().textContent().catch(function () { return ''; });
    throw new Error(`Login failed for ${email} at ${page.url()} ${(err || '').trim()}`);
  }
}

async function captureDoctor(browser) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  try {
    await login(page, DOCTOR_EMAIL, DOCTOR_PASS);
    await page.goto(`${BASE}/doctor`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    const patientLink = page.locator('a[href*="/doctor/patient/"]').first();
    if (await patientLink.count()) {
      await patientLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: path.join(DEMO, 'doctor.png'), type: 'png' });
    console.log('saved doctor.png');
  } finally {
    await page.close();
  }
}

async function main() {
  fs.mkdirSync(DEMO, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await login(page, OWNER_EMAIL, OWNER_PASS);
    console.log('Logged in as', OWNER_EMAIL);

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
    await page.setViewportSize({ width: 820, height: 900 });
    await page.goto(pdfUrl, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    const firstPage = page.locator('.tp-page').first();
    if (await firstPage.count()) {
      const box = await firstPage.boundingBox();
      if (box) {
        await page.screenshot({
          path: path.join(DEMO, 'pdf.png'), type: 'png',
          clip: { x: box.x, y: box.y, width: box.width, height: box.height }
        });
        console.log('saved pdf.png (page 1) from', pdfUrl);
      } else {
        await page.screenshot({ path: path.join(DEMO, 'pdf.png'), type: 'png', fullPage: true });
        console.log('saved pdf.png from', pdfUrl);
      }
    } else {
      await page.screenshot({ path: path.join(DEMO, 'pdf.png'), type: 'png', fullPage: true });
      console.log('saved pdf.png from', pdfUrl);
    }
  } catch (e) {
    console.warn('Owner capture failed:', e.message);
    console.warn('Continuing with public pages only.');
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

  try {
    await captureDoctor(browser);
  } catch (e) {
    console.warn('Doctor capture failed:', e.message);
    console.warn('Keeping existing doctor.png if present.');
  }

  await page.close();
  await browser.close();
  console.log('Done — demo/*.png from', BASE);
}

main().catch(e => { console.error(e); process.exit(1); });
