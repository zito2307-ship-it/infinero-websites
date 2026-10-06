// Lädt einen Kunden zu Cloudflare Pages hoch (ein Pages-Projekt pro Kunde).
//   npm run veroeffentlichen -- K-0012          → Vorschau-Link (Branch „vorschau“) für die Abnahme
//   npm run veroeffentlichen -- K-0012 --live   → Produktion (nur ohne offene Pflichtangaben)
// Braucht CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in .env (nie ins Repo!).
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT, findeKunde, stopp, pagesProjekt, pagesHochladen } from './gemeinsam.mjs';

const kunde = findeKunde(process.argv[2]);
const live = process.argv.includes('--live');

// Erst prüfen – live nur, wenn alles grün ist
const pruef = spawnSync('node', ['tools/pruefen.mjs', kunde], { cwd: ROOT, stdio: 'inherit' });
process.env.KUNDE = kunde;
const { inhalt, fehlendeAngaben } = await import('../basis/lib/inhalt.ts');
if (live) {
  if (pruef.status !== 0) stopp('Prüfung hat Fehler – erst beheben (pruefung/<kunde>/bericht.md).');
  if (fehlendeAngaben().length) stopp('Es fehlen noch Pflichtangaben.');
  if (inhalt.demo || inhalt.beispiel) stopp('Demo/Beispiel geht nicht live (demo/beispiel: false setzen).');
}

const projekt = pagesProjekt(kunde);
const url = pagesHochladen(projekt, path.join(ROOT, 'dist', kunde), live ? 'main' : 'vorschau');
console.log(live
  ? `✔ Live: ${url} – Domain ${inhalt.domain} im Cloudflare-Dashboard unter Pages → ${projekt} → Custom domains verbinden.`
  : `✔ Vorschau: ${url} – diesen Link zur Abnahme an den Kunden.`);
