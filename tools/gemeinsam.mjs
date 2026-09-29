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

export function astro(befehl, kunde, extra = []) {
  const r = spawnSync('npx', ['astro', befehl, ...extra], { cwd: ROOT, stdio: 'inherit', env: { ...process.env, KUNDE: kunde, ASTRO_TELEMETRY_DISABLED: '1' } });
  return r.status ?? 1;
}

export function stopp(text) {
  console.error(`✖ ${text}`);
  process.exit(1);
}
