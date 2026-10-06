// Lädt kunden/<kunde>/inhalt.yaml und legt – falls gewünscht – eine Design-Variante darüber.
// Wird von astro.config.mjs UND basis/lib/inhalt.ts benutzt, damit beide dasselbe sehen.
//
// Varianten (kunden/<kunde>/varianten/a.yaml, b.yaml, c.yaml) enthalten nur Abweichungen:
//   name: Hell & ruhig            Anzeigename für die Auswahl
//   beschreibung: …               ein Satz
//   design: { theme: …, farben: … }   wird tief in inhalt.design gemischt
//   hero: { variante: bild, bild: … }  wird in den Hero-Abschnitt gemischt
//   ohne: [galerie, team]         Abschnitte (typ oder anker), die in dieser Variante fehlen
//   alle anderen Schlüssel        werden tief gemischt (Objekte) bzw. ersetzt (Listen, Werte)
// Welche Variante gilt: VARIANTE=<id> (Entwürfe bauen) oder `variante: <id>` in inhalt.yaml (nach der Auswahl).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export function varianten(root, kunde) {
  const dir = path.join(root, 'kunden', kunde, 'varianten');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.yaml')).map((f) => f.replace(/\.yaml$/, '')).sort();
}

export function ladeInhalt(root, kunde, varianteEnv) {
  const dir = path.join(root, 'kunden', kunde);
  const datei = path.join(dir, 'inhalt.yaml');
  if (!fs.existsSync(datei)) throw new Error(`Kein Kunde „${kunde}“ (erwartet: ${datei})`);
  const inhalt = YAML.parse(fs.readFileSync(datei, 'utf8')) ?? {};
  const id = varianteEnv || inhalt.variante || null;
  inhalt._variante = null;
  if (id) {
    const vDatei = path.join(dir, 'varianten', `${id}.yaml`);
    if (!fs.existsSync(vDatei)) throw new Error(`Variante „${id}“ fehlt (${vDatei})`);
    const ov = YAML.parse(fs.readFileSync(vDatei, 'utf8')) ?? {};
    anwenden(inhalt, ov);
    inhalt._variante = { id, name: ov.name ?? id.toUpperCase(), beschreibung: ov.beschreibung ?? '', entwurf: !!varianteEnv };
  }
  return inhalt;
}

function anwenden(inhalt, ov) {
  const { name, beschreibung, hero, ohne, ...rest } = ov;
  if (hero) {
    const h = (inhalt.abschnitte ?? []).find((a) => a.typ === 'hero');
    if (h) Object.assign(h, hero);
  }
  if (Array.isArray(ohne) && ohne.length) {
    inhalt.abschnitte = (inhalt.abschnitte ?? []).filter((a) => !ohne.includes(a.typ) && !ohne.includes(a.anker));
  }
  mischen(inhalt, rest);
}

function mischen(ziel, quelle) {
  for (const [k, v] of Object.entries(quelle ?? {})) {
    const obj = (x) => x && typeof x === 'object' && !Array.isArray(x);
    if (v === null) delete ziel[k];                // `grafik: null` in einer Variante entfernt den Schlüssel
    else if (obj(v) && obj(ziel[k])) mischen(ziel[k], v);
    else ziel[k] = v;
  }
}
