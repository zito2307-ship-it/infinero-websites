// Erstellt eine Karte ohne Drittanbieter: sucht die Adresse (Nominatim) und speichert passende
// OpenStreetMap-Kacheln nach kunden/<kunde>/bilder/karte/. Die Seite zeigt sie sofort an – ohne Klick,
// ohne Datenübertragung an Google/OSM beim Besuch. Aufruf: npm run karte -- K-0001 [--zoom 17]
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { KUNDEN, findeKunde, stopp } from './gemeinsam.mjs';

const kunde = findeKunde(process.argv[2]);
const zi = process.argv.indexOf('--zoom');
const z = zi > 0 ? Number(process.argv[zi + 1]) : 17;
const inhalt = YAML.parse(fs.readFileSync(path.join(KUNDEN, kunde, 'inhalt.yaml'), 'utf8'));
const f = inhalt.firma;
const UA = { 'User-Agent': 'INFINERO-Websites/1.0 (kontakt@infinero.de)' };

const q = new URLSearchParams({ street: f.strasse, postalcode: f.plz, city: f.ort, country: 'Deutschland', format: 'json', limit: '1' });
const treffer = await (await fetch(`https://nominatim.openstreetmap.org/search?${q}`, { headers: UA })).json();
if (!treffer.length) stopp(`Adresse nicht gefunden: ${f.strasse}, ${f.plz} ${f.ort}`);
const lat = Number(treffer[0].lat), lon = Number(treffer[0].lon);

// Kachel-Koordinaten (Web-Mercator) der Adresse
const n = 2 ** z;
const xf = ((lon + 180) / 360) * n;
const yf = ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) * n;
const SP = 7, ZE = 3; // 7 × 3 Kacheln à 256 px = 1792 × 768 – reicht für breite Bildschirme
const x0 = Math.floor(xf) - 3, y0 = Math.floor(yf) - 1;

const ziel = path.join(KUNDEN, kunde, 'bilder', 'karte');
fs.rmSync(ziel, { recursive: true, force: true });
fs.mkdirSync(ziel, { recursive: true });
for (let r = 0; r < ZE; r++) for (let c = 0; c < SP; c++) {
  const res = await fetch(`https://tile.openstreetmap.org/${z}/${x0 + c}/${y0 + r}.png`, { headers: UA });
  if (!res.ok) stopp(`Kachel ${z}/${x0 + c}/${y0 + r}: ${res.status}`);
  fs.writeFileSync(path.join(ziel, `${r}-${c}.png`), Buffer.from(await res.arrayBuffer()));
}
// Position der Markierung in Prozent der Gesamtfläche
const karte = { lat, lon, z, spalten: SP, zeilen: ZE, x: ((xf - x0) / SP) * 100, y: ((yf - y0) / ZE) * 100 };
fs.writeFileSync(path.join(ziel, 'karte.json'), JSON.stringify(karte, null, 2));
console.log(`✔ Karte für ${kunde}: ${lat.toFixed(5)}, ${lon.toFixed(5)} (Zoom ${z}) → bilder/karte/`);
