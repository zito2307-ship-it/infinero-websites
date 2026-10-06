// Baut alle Entwürfe eines Kunden (kunden/<kunde>/varianten/*.yaml), macht Vorschaubilder,
// lädt jeden Entwurf als eigenen Branch zu Cloudflare Pages (a.<projekt>.pages.dev …)
// und schreibt das Ergebnis nach pruefung/<kunde>/entwuerfe.json – inkl. fertigem SQL für die App.
// Aufruf: npm run entwuerfe -- K-0012 [--ohne-hochladen]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { ROOT, KUNDEN, astro, findeKunde, stopp, pagesProjekt, pagesHochladen } from './gemeinsam.mjs';
import { ladeInhalt, varianten } from '../basis/lib/laden.mjs';

const kunde = findeKunde(process.argv[2]);
const ohneHochladen = process.argv.includes('--ohne-hochladen');
const ids = varianten(ROOT, kunde);
if (!ids.length) stopp(`Keine Entwürfe in kunden/${kunde}/varianten/ – erst \`npm run varianten -- ${kunde}\`.`);
const basisInhalt = ladeInhalt(ROOT, kunde, '');
const projekt = pagesProjekt(kunde);
const aus = path.join(ROOT, 'pruefung', kunde);
fs.mkdirSync(aus, { recursive: true });

const TYPEN = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff' };
function server(dist) {
  const s = http.createServer((req, res) => {
    const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    for (const k of [p, p + '.html', path.join(p, 'index.html')]) {
      const d = path.join(dist, k);
      if (d.startsWith(dist) && fs.existsSync(d) && fs.statSync(d).isFile()) { res.writeHead(200, { 'Content-Type': TYPEN[path.extname(d)] ?? 'application/octet-stream' }); return fs.createReadStream(d).pipe(res); }
    }
    res.writeHead(404); res.end('nicht gefunden');
  });
  return new Promise((r) => s.listen(0, '127.0.0.1', () => r([s, `http://127.0.0.1:${s.address().port}`])));
}

let browser;
try { browser = await chromium.launch({ channel: 'chrome' }); } catch { browser = await chromium.launch(); }

const ergebnis = [];
for (const id of ids) {
  console.log(`\n▶ Entwurf ${id.toUpperCase()}`);
  if (astro('build', kunde, [], { VARIANTE: id }) !== 0) stopp(`Entwurf ${id} lässt sich nicht bauen.`);
  const dist = path.join(ROOT, 'dist', `${kunde}--${id}`);
  const v = ladeInhalt(ROOT, kunde, id)._variante;
  const [s, url] = await server(dist);
  const probleme = [];
  for (const [name, opts] of [['desktop', { viewport: { width: 1440, height: 900 } }], ['handy', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
    const page = await browser.newPage(opts);
    page.on('pageerror', (e) => probleme.push(`${name}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') probleme.push(`${name}: ${m.text()}`); });
    await page.goto(url + '/', { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(2600); // Einblend-Animationen abwarten
    const [sw, iw] = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
    if (sw > iw + 1) probleme.push(`${name}: ${sw - iw} px zu breit`);
    await page.screenshot({ path: path.join(dist, `entwurf-${name}.png`) });            // wird mit hochgeladen
    fs.copyFileSync(path.join(dist, `entwurf-${name}.png`), path.join(aus, `entwurf-${id}-${name}.png`));
    await page.close();
  }
  s.close();
  if (probleme.length) console.warn(`  ⚠️ ${probleme.join(' · ')}`);
  const basisUrl = ohneHochladen ? `file://${dist}` : pagesHochladen(projekt, dist, id);
  ergebnis.push({ id, name: v.name, beschreibung: v.beschreibung, theme: ladeInhalt(ROOT, kunde, id).design?.theme, url: basisUrl,
    desktop: `${basisUrl}/entwurf-desktop.png`, handy: `${basisUrl}/entwurf-handy.png`, probleme });
  console.log(`  ✔ ${basisUrl}`);
}
await browser.close();

const leadId = basisInhalt.app?.lead_id ?? null;
const json = { kunde: basisInhalt.kunde ?? kunde.slice(0, 6), ordner: kunde, lead_id: leadId, firma: basisInhalt.firma?.name, erstellt: new Date().toISOString(), varianten: ergebnis };
fs.writeFileSync(path.join(aus, 'entwuerfe.json'), JSON.stringify(json, null, 2));

const sqlVarianten = JSON.stringify(ergebnis.map(({ probleme, ...r }) => r)).replace(/'/g, "''");
console.log(`\n✔ ${ergebnis.length} Entwürfe → pruefung/${kunde}/entwuerfe.json`);
console.log(`\nIn die App eintragen (Supabase-Connector, SQL):`);
console.log(leadId
  ? `select public.entwuerfe_eintragen(${leadId}, '${json.kunde}', '${sqlVarianten}'::jsonb);`
  : `-- lead_id fehlt in inhalt.yaml (app.lead_id) – bitte ergänzen oder hier einsetzen:\nselect public.entwuerfe_eintragen(<LEAD_ID>, '${json.kunde}', '${sqlVarianten}'::jsonb);`);
