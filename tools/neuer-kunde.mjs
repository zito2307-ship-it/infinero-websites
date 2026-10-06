// Legt einen neuen Kunden aus kunden/_vorlage an.
// npm run neu -- K-0012 mueller-bau "Müller Bau" --branche handwerk [--theme handwerk-kraeftig] [--farbe "#1d5c4a"]
import fs from 'node:fs';
import path from 'node:path';
import { KUNDEN, ROOT, stopp } from './gemeinsam.mjs';

const [id, slug, name] = process.argv.slice(2).filter((a, i, l) => !a.startsWith('--') && !l[i - 1]?.startsWith('--'));
const opt = (n) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : undefined; };
if (!/^K-\d{4}$/.test(id ?? '') || !/^[a-z0-9-]+$/.test(slug ?? '') || !name)
  stopp('Aufruf: npm run neu -- K-0012 mueller-bau "Müller Bau" --branche handwerk|gastro|beauty|praxis|allgemein [--theme …] [--farbe "#hex"] [--lead <App-Lead-ID>] [--auftrag <App-Auftrag-ID>]');

const branche = opt('branche') ?? 'allgemein';
const lead = opt('lead') ?? 'null', auftrag = opt('auftrag') ?? 'null';
const THEMES = { gastro: 'gastro-warm', beauty: 'beauty-hell', handwerk: 'handwerk-kraeftig', praxis: 'praxis-klar', allgemein: 'handwerk-kraeftig' };
const theme = opt('theme') ?? THEMES[branche];
if (!theme || !fs.existsSync(path.join(ROOT, 'themes', theme, 'theme.css')))
  stopp(`Theme „${theme}“ gibt es nicht. Vorhanden: ${fs.readdirSync(path.join(ROOT, 'themes')).join(', ')}`);

const ordner = `${id}-${slug}`;
const ziel = path.join(KUNDEN, ordner);
if (fs.readdirSync(KUNDEN).some((d) => d.startsWith(id + '-'))) stopp(`${id} ist schon vergeben.`);

// Startaufbau je Branche (Reihenfolge der Bausteine) – danach frei anpassen.
const H = (variante) => `  - typ: hero\n    variante: ${variante}\n    titel: "??"\n    text: "??"\n    # bild: hero.jpg`;
const ABSCHNITTE = {
  gastro: [H('bild'),
    '  - typ: textbild\n    anker: ueber\n    menue: Über uns\n    titel: "??"\n    text: ["??"]\n    bild: "??"',
    '  - typ: preisliste\n    anker: speisekarte\n    menue: Speisekarte\n    titel: Von der Karte\n    posten:\n      - { name: "??", text: "", preis: "??" }',
    '  - typ: anfrage\n    anker: anfrage\n    art: reservierung\n    titel: Tisch reservieren\n    zeiten: ["18:00", "18:30", "19:00", "19:30", "20:00"]',
    '  - typ: kontakt\n    anker: kontakt\n    menue: Kontakt'],
  beauty: [H('geteilt'),
    '  - typ: leistungen\n    anker: leistungen\n    menue: Behandlungen\n    titel: "??"\n    eintraege:\n      - { titel: "??", text: "??", preis: "??" }',
    '  - typ: team\n    anker: team\n    menue: Team\n    titel: Ihr Team\n    personen:\n      - { name: "??", rolle: "??" }',
    '  - typ: anfrage\n    anker: anfrage\n    art: termin\n    titel: Termin anfragen\n    themen: ["??"]\n    zeiten: ["09:00", "11:00", "14:00", "16:00"]',
    '  - typ: kontakt\n    anker: kontakt\n    menue: Kontakt'],
  handwerk: [H('dunkel') + '\n    telefon_zeigen: true',
    '  - typ: leistungen\n    anker: leistungen\n    menue: Leistungen\n    titel: "??"\n    eintraege:\n      - { icon: werkzeug, titel: "??", text: "??" }',
    '  - typ: galerie\n    anker: referenzen\n    menue: Referenzen\n    titel: Referenzen\n    bilder:\n      - { bild: "??", text: "??" }',
    '  - typ: anfrage\n    anker: anfrage\n    art: rueckruf\n    titel: Rückruf anfordern\n    themen: ["??", Sonstiges]',
    '  - typ: kontakt\n    anker: kontakt\n    menue: Kontakt'],
};
ABSCHNITTE.praxis = [H('geteilt'),
  '  - typ: leistungen\n    anker: leistungen\n    menue: Leistungen\n    titel: "??"\n    eintraege:\n      - { icon: funke, titel: "??", text: "??" }',
  '  - typ: textbild\n    anker: praxis\n    menue: Praxis\n    titel: "??"\n    text: ["??"]\n    bild: "??"',
  '  - typ: team\n    anker: team\n    menue: Team\n    titel: Ihr Praxisteam\n    personen:\n      - { name: "??", rolle: "??" }',
  '  - typ: faq\n    titel: Häufige Fragen\n    fragen:\n      - { frage: "??", antwort: "??" }',
  '  - typ: anfrage\n    anker: anfrage\n    art: termin\n    titel: Termin anfragen\n    themen: [Erstberatung, Kontrolltermin, Sonstiges]\n    zeiten: [Vormittags, Nachmittags, egal]',
  '  - typ: kontakt\n    anker: kontakt\n    menue: Kontakt'];
ABSCHNITTE.allgemein = [H('dunkel'), ABSCHNITTE.handwerk[1],
  '  - typ: anfrage\n    anker: anfrage\n    art: kontakt\n    titel: Schreiben Sie uns',
  '  - typ: kontakt\n    anker: kontakt\n    menue: Kontakt'];
if (!ABSCHNITTE[branche]) stopp(`Unbekannte Branche „${branche}“ (gastro, beauty, handwerk, praxis, allgemein)`);

fs.cpSync(path.join(KUNDEN, '_vorlage'), ziel, { recursive: true });
const datei = path.join(ziel, 'inhalt.yaml');
let yaml = fs.readFileSync(datei, 'utf8')
  .replace('{{KUNDE}}', id).replace('{{BRANCHE}}', branche).replace('{{NAME}}', JSON.stringify(name))
  .replace('{{THEME}}', theme).replace('{{LEAD}}', lead).replace('{{AUFTRAG}}', auftrag).replace('{{ABSCHNITTE}}', ABSCHNITTE[branche].join('\n\n'));
const farbe = opt('farbe');
if (farbe) yaml = yaml.replace('  # farben: {', `  farben: { akzent: "${farbe}" }\n  # farben: {`);
fs.writeFileSync(datei, yaml);

// Platzhalter-Favicon: Anfangsbuchstabe in Akzentfarbe
const css = fs.readFileSync(path.join(ROOT, 'themes', theme, 'theme.css'), 'utf8');
const akzent = farbe ?? css.match(/--akzent:\s*(#[0-9a-f]{3,8})/i)?.[1] ?? '#333';
const buchstabe = name.trim().charAt(0).toUpperCase().replace(/[<&>]/g, '');
fs.writeFileSync(path.join(ziel, 'bilder', 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${akzent}"/><text x="32" y="44" font-family="Georgia,serif" font-size="34" font-weight="700" fill="#fff" text-anchor="middle">${buchstabe}</text></svg>\n`);

console.log(`✔ ${ordner} angelegt (Branche ${branche}, Theme ${theme})
  1. kunden/${ordner}/inhalt.yaml ausfüllen (alle „??“), Bilder nach kunden/${ordner}/bilder/
  2. npm run varianten -- ${id}   → 3 Entwürfe (a/b/c) anlegen, dann npm run entwuerfe -- ${id}
     oder direkt: npm run vorschau -- ${id}     → http://localhost:4321
  3. npm run pruefen -- ${id}      → pruefung/${ordner}/bericht.md
  4. Website-Notiz im Vault: 20_Websites/W-NNNN <domain>.md (Vorlage 90_Vorlagen/Website-Blueprint.md)`);
