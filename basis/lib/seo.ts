// SEO + KI-Sichtbarkeit (GEO) für jede Kundenseite – alles aus inhalt.yaml abgeleitet, nichts pro Kunde gebaut:
//  • strukturdaten(): schema.org als JSON-LD (Betriebstyp je Branche, Adresse, Geo, Öffnungszeiten, Speisekarte, FAQ)
//  • llmsText(): /llms.txt – Klartext-Steckbrief für KI-Assistenten (ChatGPT, Perplexity, Gemini …)
//  • seitenListe(): Seiten für /sitemap.xml
// Optionale Felder in inhalt.yaml → seo: { schema_typ, kueche, preisklasse, profile: [url…], bild }
// Bewusst NICHT: aggregateRating mit Google-Bewertungen (Google wertet eigene Bewertungs-Markups lokaler Betriebe als
// „selbstbezogen“ und ignoriert/straft sie) – die Bewertung steht stattdessen im Text und in llms.txt.
import { inhalt, bild, karte, telLink, leistungsSeiten, istOffen } from './inhalt';

const TYP: Record<string, string> = {
  gastro: 'Restaurant', beauty: 'BeautySalon', handwerk: 'HomeAndConstructionBusiness', praxis: 'Dentist', allgemein: 'LocalBusiness',
};
const LAND: Record<string, string> = {
  'Baden-Württemberg': 'DE-BW', Bayern: 'DE-BY', Berlin: 'DE-BE', Brandenburg: 'DE-BB', Bremen: 'DE-HB', Hamburg: 'DE-HH',
  Hessen: 'DE-HE', 'Mecklenburg-Vorpommern': 'DE-MV', Niedersachsen: 'DE-NI', 'Nordrhein-Westfalen': 'DE-NW',
  'Rheinland-Pfalz': 'DE-RP', Saarland: 'DE-SL', Sachsen: 'DE-SN', 'Sachsen-Anhalt': 'DE-ST', 'Schleswig-Holstein': 'DE-SH', Thüringen: 'DE-TH',
};
const TAGE = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const KUERZEL = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'];

/** HTML aus Texten entfernen (<em>, <br> …) */
export const klar = (t?: string) => String(t ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const wert = (v: any) => (istOffen(v) ? undefined : v);

/** „Mo – Fr“, „Montag – Sonntag“, „So & Feiertag“ → Tagesindizes; unbekannte Angaben (Notdienst, Online-Anfrage) → [] */
function tage(text: string): number[] {
  const teile = text.toLowerCase().split(/\s*(?:&|,|und|\+)\s*/);
  const out = new Set<number>();
  for (const t of teile) {
    const m = t.match(/^([a-zäöü]+)\.?\s*[–-]\s*([a-zäöü]+)\.?$/);
    const idx = (w: string) => KUERZEL.indexOf(w.slice(0, 2));
    if (m) {
      const a = idx(m[1]), b = idx(m[2]);
      if (a < 0 || b < 0) continue;
      for (let i = a; ; i = (i + 1) % 7) { out.add(i); if (i === b) break; }
    } else {
      const i = idx(t.trim());
      if (i >= 0 && /^(mo|di|mi|do|fr|sa|so)/.test(t.trim())) out.add(i);
    }
  }
  return [...out];
}

/** „11:00 – 22:00“, „8:30 – 12:30 · 13:30 – 19:30“, „09 – 19 Uhr“ → [[opens, closes], …] */
function zeiten(text: string): [string, string][] {
  const hh = (s: string) => { const [h, m = '00'] = s.split(':'); return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`; };
  return [...String(text).matchAll(/(\d{1,2}(?::\d{2})?)\s*[–-]\s*(\d{1,2}(?::\d{2})?)/g)].map((m) => [hh(m[1]), hh(m[2])]);
}

export function oeffnungszeitenSchema(liste: any[] = inhalt.oeffnungszeiten ?? []) {
  const out: any[] = [];
  for (const z of liste) {
    const t = tage(String(z.tage ?? '')), zs = zeiten(String(z.zeit ?? ''));
    if (!t.length || !zs.length) continue;
    for (const [opens, closes] of zs) out.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: t.map((i) => TAGE[i]), opens, closes });
  }
  return out;
}

const abschnitte = (typ: string) => (inhalt.abschnitte ?? []).filter((a: any) => a.typ === typ);
export const faqListe = () => abschnitte('faq').flatMap((a: any) => a.fragen ?? []);
const absolut = (site: URL | undefined, p: string) => (site ? new URL(p, site).href : undefined);
export const kartenLink = () => {
  const f = inhalt.firma ?? {};
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([klar(f.name), f.strasse, f.plz, f.ort].filter(Boolean).join(' '))}`;
};

export function strukturdaten(site?: URL) {
  const f = inhalt.firma ?? {}, seo = inhalt.seo ?? {};
  const typ = seo.schema_typ ?? TYP[inhalt.branche] ?? 'LocalBusiness';
  const url = site?.href;
  const bildUrl = absolut(site, bild(seo.bild ?? inhalt.design?.logo ?? ''));
  const b: any = {
    '@context': 'https://schema.org',
    '@type': typ,
    '@id': url ? url + '#betrieb' : undefined,
    name: klar(f.name),
    alternateName: wert(f.kurzname),
    legalName: wert(f.rechtlicher_name),
    description: klar(seo.beschreibung),
    url,
    telephone: wert(f.telefon) ? telLink(f.telefon) : undefined,
    faxNumber: wert(f.fax) ? telLink(f.fax) : undefined,
    email: wert(f.email),
    image: bildUrl,
    logo: inhalt.design?.logo ? absolut(site, bild(inhalt.design.logo)) : undefined,
    address: wert(f.strasse) && {
      '@type': 'PostalAddress', streetAddress: f.strasse, postalCode: wert(f.plz), addressLocality: wert(f.ort),
      addressRegion: wert(f.bundesland), addressCountry: 'DE',
    },
    geo: karte && { '@type': 'GeoCoordinates', latitude: karte.lat, longitude: karte.lon },
    hasMap: wert(f.strasse) ? kartenLink() : undefined,
    openingHoursSpecification: oeffnungszeitenSchema(),
    priceRange: seo.preisklasse,
    sameAs: (seo.profile ?? []).concat((inhalt.social ?? []).map((s: any) => s.url)).filter(Boolean),
  };
  if (typ === 'Restaurant' || inhalt.branche === 'gastro') {
    b.servesCuisine = seo.kueche;
    if (abschnitte('anfrage').some((a: any) => a.art === 'reservierung')) b.acceptsReservations = true;
    const karteA = abschnitte('preisliste')[0];
    if (karteA && url) b.hasMenu = url + '#' + (karteA.anker ?? 'speisekarte');
  }
  const leistungen = abschnitte('leistungen').flatMap((a: any) => a.eintraege ?? []);
  if (leistungen.length) b.makesOffer = leistungen.map((l: any) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: klar(l.titel), description: klar(l.text) } }));

  const graph: any[] = [b];
  const faq = faqListe();
  if (faq.length) graph.push({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map((q: any) => ({ '@type': 'Question', name: klar(q.frage), acceptedAnswer: { '@type': 'Answer', text: klar(q.antwort) } })),
  });
  if (url) graph.push({ '@context': 'https://schema.org', '@type': 'WebSite', name: klar(f.name), url, inLanguage: 'de-DE' });
  return JSON.parse(JSON.stringify(graph, (_k, v) => (v === '' || v === null || v === false && _k !== 'acceptsReservations' || (Array.isArray(v) && !v.length) ? undefined : v)));
}

/** Meta-Angaben zum Ort (geo.region …) – schadet nicht, manche Dienste lesen es noch. */
export function ortsMeta() {
  const f = inhalt.firma ?? {};
  return { region: LAND[f.bundesland], ort: wert(f.ort), position: karte ? `${karte.lat};${karte.lon}` : undefined };
}

export function seitenListe() {
  return ['/', ...leistungsSeiten().map((l: any) => `/leistungen/${l.slug}`)];
}

/** /llms.txt – kurzer, sachlicher Steckbrief in Markdown (Standard-Vorschlag llmstxt.org). */
export function llmsText(site?: URL) {
  const f = inhalt.firma ?? {}, seo = inhalt.seo ?? {};
  const z: string[] = [];
  const url = (p: string) => (site ? new URL(p, site).href : p);
  z.push(`# ${klar(f.name)}`, '', `> ${klar(seo.beschreibung || inhalt.fuss_text)}`, '');
  const adresse = [f.strasse, [f.plz, f.ort].filter(Boolean).join(' ')].filter((x) => wert(x)).join(', ');
  z.push('## Auf einen Blick', '');
  if (wert(f.rechtlicher_name)) z.push(`- Betreiber: ${f.rechtlicher_name}`);
  if (adresse) z.push(`- Adresse: ${adresse}`);
  if (wert(f.telefon)) z.push(`- Telefon: ${f.telefon}`);
  if (wert(f.email)) z.push(`- E-Mail: ${f.email}`);
  for (const o of inhalt.oeffnungszeiten ?? []) if (wert(o.zeit)) z.push(`- Geöffnet ${o.tage}: ${o.zeit}`);
  const hero = abschnitte('hero')[0];
  if (hero?.bewertung) z.push(`- Bewertung: ${klar(hero.bewertung)}`);
  if (adresse) z.push(`- Karte: ${kartenLink()}`);
  z.push('');
  const texte = (inhalt.abschnitte ?? []).filter((a: any) => ['hero', 'band', 'textbild'].includes(a.typ) && a.text);
  if (texte.length) {
    z.push('## Über uns', '');
    for (const a of texte) z.push([].concat(a.text).map(klar).join(' '), '');
  }
  const vort = abschnitte('vorteile').flatMap((a: any) => a.punkte ?? []);
  if (vort.length) { z.push('## Was uns ausmacht', ''); for (const p of vort) z.push(`- ${klar(p.titel)}: ${klar(p.text)}`); z.push(''); }
  for (const a of abschnitte('leistungen')) {
    z.push(`## ${klar(a.titel) || 'Leistungen'}`, '');
    for (const l of a.eintraege ?? []) z.push(`- ${klar(l.titel)}${l.text ? ': ' + klar(l.text) : ''}${l.preis ? ` (${l.preis})` : ''}`);
    z.push('');
  }
  for (const a of abschnitte('preisliste')) {
    z.push(`## ${klar(a.titel) || 'Preise'} (Auszug)`, '');
    for (const g of a.gruppen ?? [{ posten: a.posten }]) {
      if (g.titel) z.push(`### ${klar(g.titel)}`);
      for (const p of g.posten ?? []) z.push(`- ${klar(p.name)}${p.text ? ' – ' + klar(p.text) : ''}${p.preis ? `: ${p.preis} €` : ''}`);
      z.push('');
    }
  }
  const faq = faqListe();
  if (faq.length) { z.push('## Häufige Fragen', ''); for (const q of faq) z.push(`**${klar(q.frage)}**`, klar(q.antwort), ''); }
  const anfrage = abschnitte('anfrage')[0];
  z.push('## Links', '');
  z.push(`- [Startseite](${url('/')})`);
  if (anfrage) z.push(`- [${anfrage.art === 'reservierung' ? 'Tisch reservieren' : 'Anfrage stellen'}](${url('/#' + (anfrage.anker ?? 'anfrage'))})`);
  for (const l of leistungsSeiten()) z.push(`- [${klar(l.titel)}](${url('/leistungen/' + l.slug)})`);
  z.push(`- [Impressum](${url('/impressum')})`, '');
  return z.join('\n');
}
