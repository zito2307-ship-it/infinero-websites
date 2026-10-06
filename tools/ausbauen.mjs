// Übernimmt den gewählten Entwurf dauerhaft: setzt `variante: <id>` in inhalt.yaml, löscht die anderen
// Entwürfe und die Entwurfs-Builds. Danach normal weiterarbeiten (vorschau / pruefen / veroeffentlichen).
// Aufruf: npm run ausbauen -- K-0012 b
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, KUNDEN, findeKunde, stopp } from './gemeinsam.mjs';
import { varianten } from '../basis/lib/laden.mjs';

const kunde = findeKunde(process.argv[2]);
const wahl = (process.argv[3] ?? '').toLowerCase();
const ids = varianten(ROOT, kunde);
if (!ids.includes(wahl)) stopp(`Entwurf „${wahl || '?'}“ gibt es nicht. Vorhanden: ${ids.join(', ') || 'keine'}`);

const datei = path.join(KUNDEN, kunde, 'inhalt.yaml');
let yaml = fs.readFileSync(datei, 'utf8');
if (/^variante:.*$/m.test(yaml)) yaml = yaml.replace(/^variante:.*$/m, `variante: ${wahl}`);
else yaml = yaml.replace(/^(kunde:.*\n)/m, `$1variante: ${wahl}            # gewählter Entwurf (kunden/…/varianten/${wahl}.yaml) – mit ausbauen.mjs gesetzt\n`);
fs.writeFileSync(datei, yaml);

for (const id of ids) {
  if (id !== wahl) fs.rmSync(path.join(KUNDEN, kunde, 'varianten', `${id}.yaml`));
  fs.rmSync(path.join(ROOT, 'dist', `${kunde}--${id}`), { recursive: true, force: true });
}
console.log(`✔ Entwurf ${wahl.toUpperCase()} übernommen (inhalt.yaml → variante: ${wahl}); andere Entwürfe entfernt.
  Feedback des Inhabers einarbeiten (steht in der App: website_entwuerfe.feedback), dann:
  npm run pruefen -- ${kunde}   →   npm run veroeffentlichen -- ${kunde}`);
