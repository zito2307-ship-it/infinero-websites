// Qualitätsprüfung eines Kunden: npm run pruefen -- K-9101 [--ohne-bauen]
// Baut die Seite, öffnet sie in Chrome (Playwright) auf Desktop + Handy und prüft:
// Konsolenfehler, kaputte Links/Bilder, fremde Server (Datenschutz), Überbreite auf dem Handy,
// Barrierefreiheit (axe), Formular + Chat, fehlende Pflichtangaben. Ergebnis: pruefung/<kunde>/
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { ROOT, astro, findeKunde, stopp } from './gemeinsam.mjs';

const kunde = findeKunde(process.argv[2]);
const ohneBauen = process.argv.includes('--ohne-bauen');
const vi = process.argv.indexOf('--variante'); const varianteId = vi > 0 ? process.argv[vi + 1] : '';   // Entwurf a/b/c prüfen
const dist = path.join(ROOT, 'dist', varianteId ? `${kunde}--${varianteId}` : kunde);
const aus = path.join(ROOT, 'pruefung', varianteId ? `${kunde}--${varianteId}` : kunde);

if (!ohneBauen && astro('build', kunde, [], varianteId ? { VARIANTE: varianteId } : {}) !== 0) stopp('Bauen fehlgeschlagen.');
fs.rmSync(aus, { recursive: true, force: true });
fs.mkdirSync(aus, { recursive: true });

process.env.KUNDE = kunde; if (varianteId) process.env.VARIANTE = varianteId;
const { inhalt, fehlendeAngaben } = await import('../basis/lib/inhalt.ts');

// Kleiner Webserver wie bei Cloudflare Pages (/impressum → impressum.html)
const TYPEN = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const kandidaten = [p, p + '.html', path.join(p, 'index.html')];
  for (const k of kandidaten) {
    const datei = path.join(dist, k);
    if (datei.startsWith(dist) && fs.existsSync(datei) && fs.statSync(datei).isFile()) {
      res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] ?? 'application/octet-stream' });
      return fs.createReadStream(datei).pipe(res);
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(fs.existsSync(path.join(dist, '404.html')) ? fs.readFileSync(path.join(dist, '404.html')) : 'nicht gefunden');
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const basis = `http://127.0.0.1:${server.address().port}`;

let browser;
try { browser = await chromium.launch({ channel: 'chrome' }); }
catch { browser = await chromium.launch(); } // Fallback: Playwright-Chromium (npx playwright install chromium)

const fehler = [];   // blockiert Livegang
const hinweise = []; // ansehen, blockiert nicht
const { leistungsSeiten } = await import('../basis/lib/inhalt.ts');
const SEITEN = ['/', '/impressum', '/datenschutz', ...leistungsSeiten().slice(0, 1).map((l) => `/leistungen/${l.slug}`)];
const GERAETE = { desktop: { viewport: { width: 1440, height: 900 } }, handy: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
let gewicht = 0;

for (const [geraet, opts] of Object.entries(GERAETE)) {
  const ctx = await browser.newContext(opts);
  for (const seite of SEITEN) {
    const page = await ctx.newPage();
    const name = `${seite === '/' ? 'start' : seite.slice(1).replace(/\//g, '_')}-${geraet}`;
    page.on('console', (m) => { if (m.type() === 'error') fehler.push(`${name}: Konsolenfehler – ${m.text()}`); });
    page.on('pageerror', (e) => fehler.push(`${name}: Skriptfehler – ${e.message}`));
    page.on('response', async (r) => {
      const u = new URL(r.url());
      if (u.origin !== basis) hinweise.push(`${name}: lädt von fremdem Server ${u.host} (Datenschutz prüfen!)`);
      else if (r.status() >= 400) fehler.push(`${name}: ${r.status()} für ${u.pathname}`);
      if (geraet === 'desktop' && seite === '/') gewicht += (await r.body().catch(() => Buffer.alloc(0))).length;
    });
    await page.goto(basis + seite, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);

    // Überbreite (seitliches Scrollen auf dem Handy)
    const breite = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    if (breite[0] > breite[1] + 1) fehler.push(`${name}: Seite ist ${breite[0] - breite[1]} px zu breit (seitliches Scrollen)`);

    // Interne Links + Anker
    const links = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const l of new Set(links)) {
      if (l.startsWith('#') && l.length > 1 && !(await page.$(l))) fehler.push(`${name}: Anker ${l} existiert nicht`);
      else if (l.startsWith('/')) {
        const [pfad, anker] = l.split('#');
        const r = await fetch(basis + pfad);
        if (!r.ok) fehler.push(`${name}: Link ${l} führt ins Leere (${r.status})`);
        else if (anker && pfad === '/' && !(await r.text()).includes(`id="${anker}"`)) fehler.push(`${name}: Anker ${l} existiert nicht`);
      } else if (l === '#' ) hinweise.push(`${name}: leerer Link (#)`);
    }

    // Barrierefreiheit
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    for (const v of axe.violations) {
      const text = `${name}: Barrierefreiheit – ${v.help} (${v.nodes.length}×) [${v.id}] z. B. ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`;
      (['critical', 'serious'].includes(v.impact) ? fehler : hinweise).push(text);
    }

    await page.screenshot({ path: path.join(aus, `${name}.png`), fullPage: true });
    await page.close();
  }
  await ctx.close();
}

// Formular + Chat auf der Startseite durchspielen
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(basis + '/', { waitUntil: 'networkidle' });
  const form = page.locator('form[data-anfrage]').first();
  if (await form.count()) {
    if (inhalt.funktionen.formular_endpunkt) hinweise.push(`Formular ist scharf (sendet an Supabase) – Testversand übersprungen. Freischaltung in Supabase-Tabelle website_formulare für ${inhalt.kunde} prüfen, dann einmal von Hand testen.`);
    else {
      for (const sel of await form.locator('select[required]').all()) {
        const werte = await sel.locator('option').evaluateAll((o) => o.map((x) => x.value).filter(Boolean));
        await sel.selectOption(werte[0]);
      }
      for (const inp of await form.locator('input[required], textarea[required]').all()) {
        const typ = await inp.getAttribute('type');
        if (typ === 'date') continue;
        await inp.fill(typ === 'email' ? 'test@example.org' : typ === 'tel' ? '0170 1234567' : 'Test');
      }
      await form.locator('button[type=submit]').click();
      if (!(await page.locator('.erfolg:not([hidden])').first().isVisible())) fehler.push('Formular: Bestätigung erscheint nach dem Absenden nicht');
      await page.screenshot({ path: path.join(aus, 'formular-gesendet.png') });
      hinweise.push('Formular im Vorschau-Modus (Demo/Beispiel) – Anfragen werden nicht verschickt.');
    }
  }
  if (inhalt.funktionen.chat === 'demo') {
    await page.click('[data-chat-knopf]');
    await page.fill('#chat-eingabe', 'Wann habt ihr geöffnet?');
    await page.press('#chat-eingabe', 'Enter');
    await page.waitForTimeout(900);
    if ((await page.locator('.msg.bot').count()) < 2) fehler.push('Demo-Chat antwortet nicht');
  }
  await page.close();
}

// Handy-Menü: öffnet es sich und führen die Links ans Ziel?
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto(basis + '/', { waitUntil: 'networkidle' });
  const knopf = page.locator('[data-menue-knopf]');
  if (await knopf.count()) {
    await knopf.click();
    if (!(await page.locator('#mobil-menue').isVisible())) fehler.push('Handy-Menü öffnet sich nicht');
    await page.screenshot({ path: path.join(aus, 'menue-handy.png') });
    await page.keyboard.press('Escape');
  } else if ((inhalt.abschnitte ?? []).some((a) => a.menue)) fehler.push('Handy: kein Menü-Knopf vorhanden');
  const f = page.locator('.formular').first();
  if (await f.count()) { await f.scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(aus, 'formular-handy.png') }); }
  await page.close();
}

await browser.close();
server.close();

// Pflichtangaben
const fehlt = fehlendeAngaben();
for (const f of fehlt) (inhalt.beispiel || inhalt.demo ? hinweise : fehler).push(`Fehlende Angabe: ${f}`);   // Demos: offen, aber nicht blockierend
if (inhalt.demo) hinweise.push('Demo-Modus aktiv (Demo-Balken + noindex) – für Livegang `demo: false` setzen.');
if (gewicht > 2_500_000) hinweise.push(`Startseite ist ${(gewicht / 1e6).toFixed(1)} MB groß – Bilder verkleinern.`);

const eindeutig = (l) => [...new Set(l)];
const bericht = [
  `# Prüfbericht ${kunde}`, '', `Stand: ${new Date().toLocaleString('de-DE')} · Startseite ${(gewicht / 1e6).toFixed(2)} MB`, '',
  `## Fehler (${eindeutig(fehler).length})`, ...eindeutig(fehler).map((f) => `- ❌ ${f}`), '',
  `## Hinweise (${eindeutig(hinweise).length})`, ...eindeutig(hinweise).map((h) => `- ⚠️ ${h}`), '',
  '## Screenshots', ...fs.readdirSync(aus).filter((f) => f.endsWith('.png')).map((f) => `- ${f}`),
].join('\n');
fs.writeFileSync(path.join(aus, 'bericht.md'), bericht);
console.log('\n' + bericht + `\n\n→ ${path.relative(ROOT, aus)}/`);
process.exit(eindeutig(fehler).length ? 1 : 0);
