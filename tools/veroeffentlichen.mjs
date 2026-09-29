// Lädt einen Kunden zu Cloudflare Pages hoch (ein Pages-Projekt pro Kunde).
//   npm run veroeffentlichen -- K-0012          → Vorschau-Link (Branch „vorschau“) für die Abnahme
//   npm run veroeffentlichen -- K-0012 --live   → Produktion (nur ohne offene Pflichtangaben)
// Braucht CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID in .env (nie ins Repo!).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, findeKunde, stopp } from './gemeinsam.mjs';

const kunde = findeKunde(process.argv[2]);
const live = process.argv.includes('--live');
if (fs.existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'));
if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)
  stopp('CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID fehlen – in .env eintragen (siehe CLAUDE.md, Abschnitt Cloudflare).');

// Erst prüfen – live nur, wenn alles grün ist
const pruef = spawnSync('node', ['tools/pruefen.mjs', kunde], { cwd: ROOT, stdio: 'inherit' });
process.env.KUNDE = kunde;
const { inhalt, fehlendeAngaben } = await import('../basis/lib/inhalt.ts');
if (live) {
  if (pruef.status !== 0) stopp('Prüfung hat Fehler – erst beheben (pruefung/<kunde>/bericht.md).');
  if (fehlendeAngaben().length) stopp('Es fehlen noch Pflichtangaben.');
  if (inhalt.demo || inhalt.beispiel) stopp('Demo/Beispiel geht nicht live (demo/beispiel: false setzen).');
}

const projekt = `${kunde.slice(7)}`.toLowerCase().slice(0, 58); // Ordner ohne „K-NNNN-“
const wrangler = (args) => spawnSync('npx', ['-y', 'wrangler@latest', ...args], { cwd: ROOT, stdio: 'inherit', env: process.env }).status;

// Projekt anlegen, falls es noch nicht existiert (Fehler „existiert schon“ ist ok)
wrangler(['pages', 'project', 'create', projekt, '--production-branch', 'main']);
const status = wrangler(['pages', 'deploy', path.join('dist', kunde), '--project-name', projekt, '--branch', live ? 'main' : 'vorschau', '--commit-dirty=true']);
if (status !== 0) stopp('Hochladen fehlgeschlagen.');
console.log(live
  ? `✔ Live: https://${projekt}.pages.dev – Domain ${inhalt.domain} im Cloudflare-Dashboard unter Pages → ${projekt} → Custom domains verbinden.`
  : `✔ Vorschau: https://vorschau.${projekt}.pages.dev – diesen Link zur Abnahme an den Kunden.`);
