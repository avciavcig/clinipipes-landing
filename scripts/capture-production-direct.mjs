#!/usr/bin/env node
/** Direct playwright login to clinic-portal (fallback when portal API unavailable). */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DEMO = path.join(ROOT, 'demo');

const BASE = (process.env.PORTAL_URL || process.env.CLINIC_PORTAL_URL || 'https://clinic-portal-production-3068.up.railway.app').replace(/\/$/, '');
const OWNER_EMAIL = process.env.DEMO_USER || process.env.DEMO_EMAIL || '';
const OWNER_PASS = process.env.DEMO_PASS || '';
const DOCTOR_EMAIL = process.env.DEMO_DOCTOR_USER || process.env.DEMO_DOCTOR_EMAIL || '';
const DOCTOR_PASS = process.env.DEMO_DOCTOR_PASS || OWNER_PASS;
const FORM_PATH = process.env.DEMO_FORM_PATH || '/form/54d115ed98192cda23a85c1f413618fd';
const VIEWPORT = { width: 1440, height: 900 };

async function waitStyled(page, selector, label) {
  await page.waitForSelector(selector, { timeout: 20000, state: 'visible' });
  await page.evaluate(function () { return document.fonts && document.fonts.ready; }).catch(function () {});
  await page.waitForTimeout(500);
  console.log('ready:', label || selector);
}

async function shot(page, file, label) {
  await page.screenshot({ path: path.join(DEMO, file), type: 'png', fullPage: true });
  const size = fs.statSync(path.join(DEMO, file)).size;
  console.log('saved', file, 'full-page', size, 'bytes', label ? '(' + label + ')' : '');
}

async function login(page, email, password) {
  if (!email || !password) throw new Error('DEMO_USER (e-posta) ve DEMO_PASS gerekli');
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[name="username"]');
  await page.locator('input[name="username"]').evaluate(function (el) { el.type = 'text'; });
  await page.fill('input[name="username"]', email);
  await page.fill('input[name="password"]', password);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }).catch(function () {}),
    page.click('button[type="submit"]')
  ]);
  await page.waitForTimeout(600);
  if (page.url().includes('change-password')) {
    await page.fill('input[name="newPassword"]', password);
    await page.fill('input[name="newPassword2"]', password);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }).catch(function () {}),
      page.click('button[type="submit"]')
    ]);
    await page.waitForTimeout(600);
  }
  if (page.url().includes('/login')) {
    const err = await page.locator('.error').first().textContent().catch(function () { return ''; });
    throw new Error(`Login failed for ${email}: ${(err || '').trim()}`);
  }
}

async function captureOwner(page) {
  await login(page, OWNER_EMAIL, OWNER_PASS);
  console.log('Logged in as', OWNER_EMAIL);

  await page.goto(`${BASE}/dashboard`, { waitUntil: 'load', timeout: 30000 });
  await waitStyled(page, '.topbar', 'dashboard topbar');
  await waitStyled(page, '.dash-card, .dash-wrap', 'dashboard content');
  await shot(page, 'dashboard.png', BASE + '/dashboard');

  await page.goto(`${BASE}/sales/pipeline`, { waitUntil: 'load', timeout: 30000 });
  await waitStyled(page, '.kanban, .pipeline-header, .page', 'sales pipeline');
  await shot(page, 'sales.png', BASE + '/sales/pipeline');

  let pdfUrl = '';
  const previewLink = page.locator('a[href*="/preview-pdf/"]').first();
  if (await previewLink.count()) {
    pdfUrl = await previewLink.getAttribute('href');
    if (pdfUrl.startsWith('/')) pdfUrl = BASE + pdfUrl;
  } else {
    const patientLink = page.locator('a[href*="/doctor/patient/"], [data-patient-id]').first();
    if (await patientLink.count()) {
      const pid = await patientLink.getAttribute('data-patient-id')
        || (await patientLink.getAttribute('href') || '').match(/patient\/(\d+)/)?.[1];
      if (pid) pdfUrl = `${BASE}/preview-pdf/${pid}`;
    }
  }
  if (!pdfUrl) pdfUrl = `${BASE}/preview-pdf/1`;

  await page.goto(pdfUrl, { waitUntil: 'load', timeout: 30000 });
  await waitStyled(page, '.proposal, .tp-page, .tp-hero', 'pdf proposal');
  await page.evaluate(function () {
    document.querySelectorAll('.tp-print-bar').forEach(function (el) { el.style.display = 'none'; });
  });
  await shot(page, 'pdf.png', pdfUrl);
}

async function captureForm(page) {
  await page.goto(`${BASE}${FORM_PATH}`, { waitUntil: 'load', timeout: 30000 });
  await waitStyled(page, '.form-box, .container', 'patient form');
  await page.evaluate(function () { window.scrollTo(0, 0); });
  await page.waitForTimeout(400);
  await shot(page, 'form.png', BASE + FORM_PATH);
}

async function captureDoctor(browser) {
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  try {
    await login(page, DOCTOR_EMAIL || OWNER_EMAIL, DOCTOR_PASS);
    await page.goto(`${BASE}/doctor`, { waitUntil: 'load', timeout: 30000 });
    await waitStyled(page, '.topbar, .doctor-wrap, .patient-list', 'doctor panel');
    const patientLink = page.locator('a[href*="/doctor/patient/"], .patient-row, [data-action="open-patient"]').first();
    if (await patientLink.count()) {
      await patientLink.click();
      await page.waitForLoadState('load');
      await waitStyled(page, '.doctor-detail, .patient-detail, .topbar', 'doctor patient');
    }
    await shot(page, 'doctor.png', BASE + '/doctor');
  } finally {
    await page.close();
  }
}

export async function captureDirect() {
  fs.mkdirSync(DEMO, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });
  let ownerOk = false;

  try {
    await captureOwner(page);
    ownerOk = true;
  } catch (e) {
    console.warn('Owner capture failed:', e.message);
  }

  try {
    await captureForm(page);
  } catch (e) {
    console.warn('Form capture failed:', e.message);
  }

  try {
    await captureDoctor(browser);
  } catch (e) {
    console.warn('Doctor capture failed:', e.message);
  }

  await page.close();
  await browser.close();

  const saved = ['dashboard', 'sales', 'form', 'pdf', 'doctor'].filter(function (id) {
    try { return fs.statSync(path.join(DEMO, id + '.png')).size > 5000; } catch { return false; }
  });

  if (!ownerOk) {
    throw new Error('Yönetim paneli / PDF için DEMO_USER + DEMO_PASS gerekli veya portal API kullanın');
  }
  if (!saved.length) throw new Error('Hiç görsel alınamadı');
  console.log('Captured (direct):', saved.join(', '));
  return { ok: true, saved, source: 'direct' };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  captureDirect().catch(function (e) {
    console.error(e.message || e);
    process.exit(1);
  });
}
