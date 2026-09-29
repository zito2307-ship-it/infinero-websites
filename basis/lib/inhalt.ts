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
// Formulare: echte Kunden senden über die Supabase-Funktion „formular“ (Vault-Repo vertrieb, supabase/functions/formular),
// Demos/Beispiele laufen im Vorschau-Modus. Empfänger + erlaubte Domains stehen in Supabase (Tabelle website_formulare).
export const FORMULAR_ENDPUNKT = 'https://ckiuvhuvuicbiabfkggg.supabase.co/functions/v1/formular';
inhalt.funktionen = { karte: false, chat: 'aus', ki_telefon: false, ...roh.funktionen };
inhalt.funktionen.formular ??= inhalt.demo || inhalt.beispiel ? 'vorschau' : 'aktiv';
inhalt.funktionen.formular_endpunkt = inhalt.funktionen.formular === 'aktiv' ? FORMULAR_ENDPUNKT : '';
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

/** URL-Teil aus einem Titel: „Ästhetische Kieferorthopädie“ → „aesthetische-kieferorthopaedie“ */
export function slug(text: string) {
  return text.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Alle Leistungen mit Detailseite (leistungen → eintraege[].details) */
export function leistungsSeiten(i: any = inhalt) {
  return (i.abschnitte ?? []).filter((a: any) => a.typ === 'leistungen')
    .flatMap((a: any) => a.eintraege).filter((l: any) => l.details).map((l: any) => ({ ...l, slug: l.slug ?? slug(l.titel) }));
}

// Karte ohne Drittanbieter (npm run karte) – liegt in bilder/karte/karte.json
const karteDatei = path.join(process.cwd(), 'kunden', kunde, 'bilder', 'karte', 'karte.json');
export const karte: any = fs.existsSync(karteDatei) ? JSON.parse(fs.readFileSync(karteDatei, 'utf8')) : null;

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
