// Sichtbarkeits-Check (derselbe wie auf infinero.de/check.html) für eine Kundenseite – lokal, ohne Mail und ohne Lead:
// die Prüflogik aus dem Website-Repo wird direkt aufgerufen, Brevo- und App-Weitergabe sind abgeschaltet.
// Aufruf:  npm run sichtbarkeit -- K-0012                → prüft den fertigen Build dist/<kunde> (lokal, ohne HTTPS)
//          npm run sichtbarkeit -- https://beispiel.de   → prüft eine Website online (z. B. die alte Seite zum Vergleich)
// Erwartung für unsere Seiten: alles grün außer „HTTPS“ bei der lokalen Prüfung (online liefert Cloudflare immer HTTPS).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT, findeKunde, stopp } from './gemeinsam.mjs';

for (const k of ['BREVO_API_KEY', 'LEAD_WEBHOOK_URL', 'LEAD_WEBHOOK_SECRET', 'BREVO_LIST_ID']) delete process.env[k];
const CHECK = path.resolve(ROOT, '../infinero-website/netlify/functions/sichtbarkeit.js');
if (!fs.existsSync(CHECK)) stopp(`Checker nicht gefunden: ${CHECK} (Repo infinero-website neben diesem Repo klonen)`);
const { handler } = createRequire(import.meta.url)(CHECK);

const arg = process.argv[2] ?? '';
const zeigen = (j) => {
  const c = j.checks ?? {};
  console.log(`\nSichtbarkeits-Score: ${j.score}/100  (Technik ${j.categories.technik} · SEO ${j.categories.seo} · KI ${j.categories.ki} · Lokal ${j.categories.lokal})`);
  console.log(Object.entries(c).filter(([, v]) => typeof v === 'boolean').map(([k, v]) => `${v ? '✔' : '✖'} ${k}`).join('  '));
  for (const l of j.levers ?? []) console.log(`→ ${l.title}`);
};
const pruefe = async (url) => {
  const r = JSON.parse((await handler({ httpMethod: 'GET', queryStringParameters: { url } })).body);
  if (!r.ok) stopp(r.error);
  zeigen(r);
};

if (/^https?:\/\/|\.[a-z]{2,}$/i.test(arg) && !/^K-/i.test(arg)) await pruefe(arg);
else {
  const kunde = findeKunde(arg);
  const ordner = path.join(ROOT, 'dist', kunde);
  if (!fs.existsSync(path.join(ordner, 'index.html'))) stopp(`Kein Build in dist/${kunde} – erst \`npm run bauen -- ${kunde}\``);
  const srv = http.createServer((q, s) => {
    let p = decodeURIComponent(q.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let f = path.join(ordner, path.normalize(p));
    if (!f.startsWith(ordner)) { s.writeHead(403); return s.end(); }
    if (!fs.existsSync(f) && fs.existsSync(f + '.html')) f += '.html';
    if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { s.writeHead(404); return s.end(); }
    s.writeHead(200); s.end(fs.readFileSync(f));
  });
  await new Promise((ok) => srv.listen(0, '127.0.0.1', ok));
  console.log(`Prüfe ${kunde} (lokaler Build – HTTPS kommt erst online über Cloudflare)`);
  await pruefe(`http://127.0.0.1:${srv.address().port}/`);
  srv.close();
}
