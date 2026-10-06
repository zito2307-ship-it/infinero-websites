// Gemeinsame Helfer für die Skripte in tools/.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const KUNDEN = path.join(ROOT, 'kunden');

export function alleKunden() {
  return fs.readdirSync(KUNDEN).filter((d) => /^K-\d{4}-/.test(d) && fs.existsSync(path.join(KUNDEN, d, 'inhalt.yaml'))).sort();
}

/** Ordnername aus „K-9101“, „da-rosa“ oder vollem Namen finden. */
export function findeKunde(arg) {
  if (!arg) stopp('Bitte Kunden angeben, z. B. K-9101 oder da-rosa.');
  const treffer = alleKunden().filter((k) => k === arg || k.startsWith(arg + '-') || k.endsWith('-' + arg) || k.includes(arg));
  if (treffer.length === 1) return treffer[0];
  stopp(treffer.length ? `Mehrdeutig: ${treffer.join(', ')}` : `Kein Kunde „${arg}“. Vorhanden: ${alleKunden().join(', ')}`);
}

export function astro(befehl, kunde, extra = [], env = {}) {
  const r = spawnSync('npx', ['astro', befehl, ...extra], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, KUNDE: kunde, ASTRO_TELEMETRY_DISABLED: '1', ...env } });
  return r.status ?? 1;
}

/** Cloudflare-Pages-Projektname eines Kunden: Ordner ohne „K-NNNN-“ */
export const pagesProjekt = (kunde) => kunde.slice(7).toLowerCase().slice(0, 58);

/** Lädt einen fertigen Ordner zu Cloudflare Pages hoch (Branch = Alias-URL). Braucht .env mit Cloudflare-Zugang. */
export function pagesHochladen(projekt, ordner, branch) {
  if (fs.existsSync(path.join(ROOT, '.env'))) process.loadEnvFile(path.join(ROOT, '.env'));
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)
    stopp('CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID fehlen – in .env eintragen (siehe CLAUDE.md, Abschnitt Cloudflare).');
  // Wrangler in einem leeren Arbeitsordner starten – im Projektordner würde es Astro erkennen und
  // ungefragt einen Server-Adapter einbauen. Wir laden nur fertige statische Dateien hoch.
  const arbeit = path.join(ROOT, '.wrangler', 'arbeit');
  fs.mkdirSync(arbeit, { recursive: true });
  const w = (args, still = false) => spawnSync('npx', ['-y', 'wrangler@4', ...args], { cwd: arbeit, stdio: still ? 'pipe' : 'inherit', env: process.env });
  // --force = klassisches Pages (nicht auf Workers umleiten); Fehler „existiert schon“ ist ok
  w(['pages', 'project', 'create', projekt, '--production-branch', 'main', '--force'], true);
  const r = w(['pages', 'deploy', ordner, '--project-name', projekt, '--branch', branch, '--commit-dirty=true']);
  if (r.status !== 0) stopp(`Hochladen von ${ordner} fehlgeschlagen.`);
  return branch === 'main' ? `https://${projekt}.pages.dev` : `https://${branch}.${projekt}.pages.dev`;
}

export function stopp(text) {
  console.error(`✖ ${text}`);
  process.exit(1);
}
