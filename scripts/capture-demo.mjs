import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const demoDir = path.join(root, 'demo');
const PORT = process.env.PORT || 8099;
const BASE = 'http://127.0.0.1:' + PORT;
const VIEWPORT = { width: 1440, height: 900 };

const PAGES = [
  { url: '/demo/dashboard.html', file: 'dashboard.png', ready: '.topbar, .dash-card' },
  { url: '/demo/sales.html', file: 'sales.png', ready: '.kanban, .page' },
  { url: '/demo/doctor.html', file: 'doctor.png', ready: '.topbar, .doctor-wrap' },
  { url: '/demo/pdf.html', file: 'pdf.png', ready: '.tp-page, .proposal' },
];

function waitForServer(ms) {
  const deadline = Date.now() + ms;
  return new Promise(function (resolve, reject) {
    (function tick() {
      http.get(BASE + '/demo/dashboard.html', function (res) {
        res.resume();
        if (res.statusCode === 200) resolve();
        else if (Date.now() > deadline) reject(new Error('server not ready (status ' + res.statusCode + ')'));
        else setTimeout(tick, 400);
      }).on('error', function () {
        if (Date.now() > deadline) reject(new Error('server not ready'));
        else setTimeout(tick, 400);
      });
    })();
  });
}

async function main() {
  fs.mkdirSync(demoDir, { recursive: true });
  const server = spawn('node', ['server.js'], {
    cwd: root,
    env: Object.assign({}, process.env, { PORT: String(PORT) }),
    stdio: 'ignore',
  });

  try {
    await waitForServer(25000);
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: VIEWPORT, deviceScaleFactor: 1 });

    for (const p of PAGES) {
      await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForSelector(p.ready, { timeout: 15000 });
      await page.evaluate(function () { return document.fonts && document.fonts.ready; }).catch(function () {});
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(demoDir, p.file),
        type: 'png',
        fullPage: true,
      });
      const size = fs.statSync(path.join(demoDir, p.file));
      console.log('saved', p.file, 'full-page', size.size, 'bytes');
    }

    await browser.close();
    console.log('Local demo screenshots ready (full-page)');
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch(function (e) {
  console.error(e);
  process.exit(1);
});
