// Legt die drei Standard-Entwürfe eines Kunden an: kunden/<kunde>/varianten/{a,b,c}.yaml
//   A „Hell & ruhig“ · B „Kräftig & bildstark“ · C „Dunkel & edel“
// Vorhandene Dateien bleiben unangetastet (--neu überschreibt). Danach von Hand/mit taste-skill verfeinern.
// Aufruf: npm run varianten -- K-0012 [--neu]
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { KUNDEN, findeKunde } from './gemeinsam.mjs';

const kunde = findeKunde(process.argv[2]);
const neu = process.argv.includes('--neu');
const dir = path.join(KUNDEN, kunde);
const inhalt = YAML.parse(fs.readFileSync(path.join(dir, 'inhalt.yaml'), 'utf8'));
const theme = inhalt.design?.theme ?? 'handwerk-kraeftig';
const hero = (inhalt.abschnitte ?? []).find((a) => a.typ === 'hero') ?? {};

// Zweites, deutlich anderes Theme je Ausgangstheme (gleiche Kundenfarben bleiben über design.farben erhalten)
const ALTERNATIVE = { 'praxis-klar': 'beauty-hell', 'beauty-hell': 'gastro-warm', 'gastro-warm': 'beauty-hell', 'handwerk-kraeftig': 'praxis-klar', 'edel-dunkel': 'gastro-warm' };

// Erstes brauchbares Foto als Titelbild (keine Porträts, Logos, Karten)
const fotos = fs.existsSync(path.join(dir, 'bilder'))
  ? fs.readdirSync(path.join(dir, 'bilder')).filter((f) => /\.(jpe?g|webp|png)$/i.test(f) && !/^(person-|logo|favicon|team)/i.test(f)).sort()
  : [];
const titelbild = hero.bild ?? fotos[0] ?? null;

const VARIANTEN = {
  a: {
    name: 'Hell & ruhig',
    beschreibung: 'Viel Weißraum, klare Typografie, der Inhalt steht im Vordergrund.',
    design: { theme },
    hero: { variante: 'geteilt' },
  },
  b: {
    name: 'Kräftig & bildstark',
    beschreibung: 'Großes Titelbild, andere Schrift, mehr Kontrast – wirkt präsenter.',
    design: { theme: ALTERNATIVE[theme] ?? 'praxis-klar' },
    hero: titelbild ? { variante: 'bild', bild: titelbild, grafik: null } : { variante: 'dunkel', grafik: null },
  },
  c: {
    name: 'Dunkel & edel',
    beschreibung: 'Anthrazit mit Gold, Serifen-Überschriften – hochwertig und ruhig.',
    design: { theme: 'edel-dunkel' },
    hero: { variante: 'dunkel', grafik: null },
  },
};

fs.mkdirSync(path.join(dir, 'varianten'), { recursive: true });
for (const [id, v] of Object.entries(VARIANTEN)) {
  const ziel = path.join(dir, 'varianten', `${id}.yaml`);
  if (fs.existsSync(ziel) && !neu) { console.log(`• ${id}.yaml vorhanden – übersprungen`); continue; }
  const kopf = `# Entwurf ${id.toUpperCase()} – nur Abweichungen von inhalt.yaml (siehe basis/lib/laden.mjs)\n`;
  fs.writeFileSync(ziel, kopf + YAML.stringify(v));
  console.log(`✔ ${id}.yaml – ${v.name}`);
}
console.log(`\nWeiter: Entwürfe mit taste-skill prüfen/verfeinern, dann \`npm run entwuerfe -- ${inhalt.kunde ?? kunde}\``);
