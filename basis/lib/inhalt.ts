// Lädt kunden/<KUNDE>/inhalt.yaml, ergänzt Standardwerte und listet fehlende Pflichtangaben.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

export const OFFEN = '??'; // Platzhalter für „liefert Kunde nach“

const kunde = process.env.KUNDE!;
const datei = path.join(process.cwd(), 'kunden', kunde, 'inhalt.yaml');
const roh: any = YAML.parse(fs.readFileSync(datei, 'utf8'));

export const inhalt: any = {
  sprache: 'de',
  ansprache: 'sie',
  funktionen: {},
  oeffnungszeiten: [],
  social: [],
  ...roh,
};
inhalt.funktionen = { karte: false, chat: 'aus', ki_telefon: false, formular_endpunkt: '', ...roh.funktionen };
inhalt.hosting = {
  anbieter: 'Cloudflare, Inc., 101 Townsend St., San Francisco, CA 94107, USA',
  kurz: 'Cloudflare',
  ...roh.hosting,
};

/** Telefonnummer für tel:-Links (03641 55 88 00 → +493641558800). */
export function telLink(nr?: string) {
  if (!nr) return '';
  let n = nr.replace(/[^\d+]/g, '');
  if (n.startsWith('00')) n = '+' + n.slice(2);
  else if (n.startsWith('0')) n = '+49' + n.slice(1);
  return n;
}

/** Bildpfad aus kunden/<KUNDE>/bilder/ (liegt im Wurzelverzeichnis der fertigen Seite). */
export function bild(name?: string) {
  if (!name) return '';
  return name.startsWith('http') || name.startsWith('/') ? name : '/' + name;
}

export const istOffen = (v: unknown) => v === undefined || v === null || v === '' || v === OFFEN;

/** Pflichtangaben, ohne die eine Seite nicht live gehen darf. */
export function fehlendeAngaben(i: any = inhalt): string[] {
  const pflicht = [
    'firma.name', 'firma.rechtlicher_name', 'firma.inhaber', 'firma.strasse', 'firma.plz', 'firma.ort',
    'firma.bundesland', 'firma.telefon', 'firma.email', 'seo.titel', 'seo.beschreibung', 'design.theme',
  ];
  const fehlt = pflicht.filter((p) => istOffen(p.split('.').reduce((o: any, k) => o?.[k], i)));
  // überall im Inhalt verteilte „??“ ebenfalls melden
  const suche = (o: any, pfad: string) => {
    if (o === OFFEN) fehlt.push(pfad);
    else if (o === null) fehlt.push(`${pfad} (leer – oder Text mit Komma in { … } ohne Anführungszeichen?)`);
    else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) suche(v, pfad ? `${pfad}.${k}` : k);
  };
  suche(i, '');
  // Pflicht je nach Funktion (Datenschutzerklärung)
  const fn = i.funktionen ?? {};
  if (fn.chat === 'snippet' && istOffen(i.datenschutz?.chat_ki_anbieter)) fehlt.push('datenschutz.chat_ki_anbieter');
  if (fn.ki_telefon && istOffen(i.datenschutz?.telefon_dienstleister)) fehlt.push('datenschutz.telefon_dienstleister');
  if (fn.chat === 'snippet' && istOffen(fn.chat_snippet)) fehlt.push('funktionen.chat_snippet');
  return [...new Set(fehlt)];
}

export const AUFSICHT: Record<string, string> = {
  'Baden-Württemberg': 'Landesbeauftragte/r für den Datenschutz und die Informationsfreiheit Baden-Württemberg',
  'Bayern': 'Bayerisches Landesamt für Datenschutzaufsicht (BayLDA)',
  'Berlin': 'Berliner Beauftragte/r für Datenschutz und Informationsfreiheit',
  'Brandenburg': 'Landesbeauftragte/r für den Datenschutz und für das Recht auf Akteneinsicht Brandenburg',
  'Bremen': 'Landesbeauftragte/r für Datenschutz und Informationsfreiheit der Freien Hansestadt Bremen',
  'Hamburg': 'Hamburgische/r Beauftragte/r für Datenschutz und Informationsfreiheit',
  'Hessen': 'Hessische/r Beauftragte/r für Datenschutz und Informationsfreiheit',
  'Mecklenburg-Vorpommern': 'Landesbeauftragte/r für Datenschutz und Informationsfreiheit Mecklenburg-Vorpommern',
  'Niedersachsen': 'Landesbeauftragte/r für den Datenschutz Niedersachsen',
  'Nordrhein-Westfalen': 'Landesbeauftragte/r für Datenschutz und Informationsfreiheit Nordrhein-Westfalen',
  'Rheinland-Pfalz': 'Landesbeauftragte/r für den Datenschutz und die Informationsfreiheit Rheinland-Pfalz',
  'Saarland': 'Unabhängiges Datenschutzzentrum Saarland',
  'Sachsen': 'Sächsische/r Datenschutz- und Transparenzbeauftragte/r',
  'Sachsen-Anhalt': 'Landesbeauftragte/r für den Datenschutz Sachsen-Anhalt',
  'Schleswig-Holstein': 'Unabhängiges Landeszentrum für Datenschutz Schleswig-Holstein',
  'Thüringen': 'Thüringer Landesbeauftragte/r für den Datenschutz und die Informationsfreiheit (TLfDI)',
};
