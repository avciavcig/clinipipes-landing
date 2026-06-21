#!/usr/bin/env node
/**
 * Capture demo screenshots from clinic-portal v3 (local bootstrap).
 * Requires: Docker, clinic-portal deps, playwright in clinipipes-landing.
 */
import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LANDING = path.join(__dirname, '..');
const PORTAL = path.join(process.env.HOME, 'clinic-portal');
const DEMO = path.join(LANDING, 'demo');
const PORT = 3099;
const PG = 'clinipipes-demo-pg';
const DB_URL = 'postgresql://postgres:postgres@127.0.0.1:5433/clinic';

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function waitHealth(url, tries = 60) {
  return new Promise((resolve, reject) => {
    let n = 0;
    const tick = () => {
      http.get(url, res => {
        res.resume();
        if (res.statusCode === 200) resolve();
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (++n >= tries) reject(new Error('Server did not start'));
      else setTimeout(tick, 1000);
    };
    tick();
  });
}

function ensurePostgres() {
  try {
    execSync(`docker inspect ${PG}`, { stdio: 'ignore' });
    execSync(`docker start ${PG}`, { stdio: 'ignore' });
  } catch {
    execSync(`docker run --name ${PG} -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=clinic -p 5433:5432 -d postgres:16-alpine`, { stdio: 'inherit' });
  }
  for (let i = 0; i < 30; i++) {
    try {
      execSync(`docker exec ${PG} pg_isready -U postgres`, { stdio: 'ignore' });
      return;
    } catch { wait(500); }
  }
  throw new Error('Postgres not ready');
}

function seedDb() {
  const sql = `
UPDATE users SET "mustChangePassword"=false WHERE username='owner';
UPDATE clinic_settings SET
  "clinicName"='CliniPipes Demo Clinic',
  "clinicWhatsapp"='+90 530 300 00 00',
  "clinicAddress"='İzmir, Turkey',
  "clinicAbout"='Modern dental clinic for international patients.',
  "doctorName"='Mehmet Kaan ERSOY',
  "doctorTitle"='Diş Hekimi',
  "doctorBio"='Implantology and aesthetic dentistry specialist.',
  currency='EUR',
  plan='pro',
  active=true
WHERE id=1;
DELETE FROM doctor_notes;
DELETE FROM patients;
INSERT INTO patients (name,age,phone,email,country,channel,treatment,complaint,"createdAt",clinic_id,pipeline_stage,pipeline_migrated) VALUES
('James Mitchell','42','+442071234567','james@example.com','United Kingdom','Instagram','Hollywood Smile','Teeth alignment',NOW()::text,1,'awaiting_assessment',true),
('Thomas Weber','38','+491511234','thomas@example.com','Germany','Google','Zirconium Crowns',NULL,NOW()::text,1,'plan_ready',true),
('Lena Müller','35','+491601234','lena@example.com','Germany','Referral','Estetik cerrahi',NULL,NOW()::text,1,'price_offered',true),
('M. Al-Rashid','44','+971501234','m.rashid@example.com','UAE','Instagram','Veneer',NULL,NOW()::text,1,'approved',true);
INSERT INTO doctor_notes ("patientId","clinicalAssessment","treatmentPlan","treatmentDuration","priceOffer","priceIncludes","hotelName","hotelCheckIn","hotelCheckOut",language,clinic_id,"updatedAt")
SELECT id,'Patient suitable for full-arch aesthetic rehabilitation.','20 zirconium crowns, whitening protocol','5 days in clinic','6500','Transfer, hotel, follow-up','Swissôtel Büyük Efes','2026-09-15','2026-09-20','en',1,NOW()::text FROM patients WHERE name='James Mitchell' LIMIT 1;
SELECT "formToken" FROM clinic_settings WHERE id=1;
`;
  const out = execSync(`docker exec -i ${PG} psql -U postgres -d clinic -t -A`, { input: sql }).toString().trim();
  const token = out.split('\n').filter(Boolean).pop();
  return token;
}

async function capture() {
  fs.mkdirSync(DEMO, { recursive: true });
  ensurePostgres();

  const env = {
    ...process.env,
    NODE_ENV: 'development',
    PORT: String(PORT),
    DATABASE_URL: DB_URL,
    SESSION_SECRET: 'devsessionsecretdevsessionsecret12',
    MASTER_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    BOOTSTRAP_DEV_OWNER: 'true',
    BOOTSTRAP_DEV_PASSWORD: 'DemoOwner123!',
    REGISTER_ENABLED: 'false',
  };

  const server = spawn('node', ['server.js'], { cwd: PORTAL, env, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', d => process.stdout.write('[portal] ' + d));
  server.stderr.on('data', d => process.stderr.write('[portal] ' + d));

  try {
    await waitHealth(`http://127.0.0.1:${PORT}/health`);
    await wait(1500);
    const formToken = seedDb();
    if (!formToken) throw new Error('No formToken');

    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto(`http://127.0.0.1:${PORT}/login`);
    await page.fill('input[name="username"]', 'owner');
    await page.fill('input[name="password"]', 'DemoOwner123!');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    if (page.url().includes('change-password')) {
      await page.fill('input[name="newPassword"]', 'DemoOwner123!');
      await page.fill('input[name="newPassword2"]', 'DemoOwner123!');
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
    }

    await page.goto(`http://127.0.0.1:${PORT}/dashboard`);
    await page.waitForLoadState('networkidle');
    await wait(500);
    await page.screenshot({ path: path.join(DEMO, 'dashboard.png'), type: 'png' });
    console.log('saved dashboard.png');

    await page.goto(`http://127.0.0.1:${PORT}/sales/pipeline`);
    await page.waitForLoadState('networkidle');
    await wait(500);
    await page.screenshot({ path: path.join(DEMO, 'sales.png'), type: 'png' });
    console.log('saved sales.png');

    await page.goto(`http://127.0.0.1:${PORT}/form/${formToken}`);
    await page.waitForLoadState('networkidle');
    await page.locator('h2:has-text("Patient Pre-Assessment Form"), h2:has-text("Pre-Assessment")').first().scrollIntoViewIfNeeded().catch(() => {});
    await wait(400);
    const formEl = page.locator('form').first();
    if (await formEl.count()) {
      const box = await formEl.boundingBox();
      if (box) {
        await page.screenshot({
          path: path.join(DEMO, 'form.png'), type: 'png',
          clip: { x: Math.max(0, box.x - 24), y: Math.max(0, box.y - 16), width: Math.min(1440, box.width + 48), height: Math.min(820, box.height + 32) }
        });
      } else await page.screenshot({ path: path.join(DEMO, 'form.png'), type: 'png', fullPage: false });
    } else {
      await page.screenshot({ path: path.join(DEMO, 'form.png'), type: 'png', fullPage: false });
    }
    console.log('saved form.png');

    await page.setViewportSize({ width: 960, height: 1200 });
    await page.goto(`http://127.0.0.1:${PORT}/preview-pdf/1`);
    await page.waitForLoadState('networkidle');
    await wait(400);
    await page.screenshot({ path: path.join(DEMO, 'pdf.png'), type: 'png', fullPage: true });
    console.log('saved pdf.png');

    await browser.close();
    console.log('Done — demo/*.png from clinic-portal v3');
  } finally {
    server.kill('SIGTERM');
  }
}

capture().catch(err => { console.error(err); process.exit(1); });
