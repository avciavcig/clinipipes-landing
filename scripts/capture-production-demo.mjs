#!/usr/bin/env node
/** Capture demo PNGs — portal API first, then direct playwright login. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { captureViaPortalApi } from './capture-via-portal-api.mjs';
import { captureDirect } from './capture-production-direct.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

function loadEnvFile() {
  const envPath = path.join(ROOT, '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
    if (!m || process.env[m[1]]) continue;
    let val = (m[2] || '').trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[m[1]] = val;
  }
}

loadEnvFile();

async function main() {
  if (process.env.CLINIPIPES_WEBHOOK_SECRET && (process.env.CLINIC_PORTAL_URL || process.env.PORTAL_URL)) {
    try {
      const r = await captureViaPortalApi();
      if (r.ok) {
        console.log('Done — demo/*.png via clinic-portal API');
        return;
      }
    } catch (e) {
      console.warn('Portal API capture failed:', e.message);
      console.warn('Falling back to direct playwright login...');
    }
  }

  await captureDirect();
  console.log('Done — demo/*.png via direct login');
}

main().catch(function (e) {
  console.error(e.message || e);
  process.exit(1);
});
