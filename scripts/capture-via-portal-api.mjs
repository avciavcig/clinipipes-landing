#!/usr/bin/env node
/** Fetch demo PNGs from clinic-portal internal API (puppeteer runs on portal). */
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO = path.join(__dirname, '..', 'demo');
const TYPES = ['dashboard', 'sales', 'form', 'pdf', 'doctor'];

function signPayload(secret, timestamp, body) {
  return crypto.createHmac('sha256', secret).update(String(timestamp) + '.' + body).digest('hex');
}

function fetchPng(base, type, secret) {
  return new Promise(function (resolve, reject) {
    const ts = String(Date.now());
    const sig = signPayload(secret, ts, type);
    const url = new URL(base.replace(/\/$/, '') + '/internal/demo-screenshots/' + type);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-CliniPipes-Timestamp': ts,
        'X-CliniPipes-Signature': sig,
      },
      timeout: 120000,
    }, function (res) {
      const chunks = [];
      res.on('data', function (c) { chunks.push(c); });
      res.on('end', function () {
        const buf = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          let msg = buf.toString('utf8').slice(0, 200);
          try { msg = JSON.parse(buf.toString()).error || msg; } catch (_) {}
          reject(new Error(type + ': HTTP ' + res.statusCode + ' ' + msg));
          return;
        }
        if (buf.length < 5000) {
          reject(new Error(type + ': response too small'));
          return;
        }
        resolve(buf);
      });
    });
    req.on('error', reject);
    req.on('timeout', function () { req.destroy(new Error(type + ': timeout')); });
    req.end();
  });
}

export async function captureViaPortalApi() {
  const secret = process.env.CLINIPIPES_WEBHOOK_SECRET || '';
  const base = process.env.CLINIC_PORTAL_URL || process.env.PORTAL_URL || '';
  if (!secret || !base) return { ok: false, reason: 'missing_secret_or_portal_url' };

  fs.mkdirSync(DEMO, { recursive: true });
  const saved = [];
  for (const type of TYPES) {
    const buf = await fetchPng(base, type, secret);
    fs.writeFileSync(path.join(DEMO, type + '.png'), buf);
    console.log('saved', type + '.png', 'via portal API', buf.length, 'bytes');
    saved.push(type);
  }
  return { ok: true, saved, source: 'portal-api' };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  captureViaPortalApi()
    .then(function (r) {
      if (!r.ok) {
        console.error('Portal API capture unavailable:', r.reason);
        process.exit(1);
      }
      console.log('Done —', r.saved.join(', '));
    })
    .catch(function (e) {
      console.error(e.message || e);
      process.exit(1);
    });
}
