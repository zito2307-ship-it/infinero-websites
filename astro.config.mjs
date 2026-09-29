// Ein Astro-Projekt für alle Kunden: KUNDE=<ordnername> wählt Inhalt, Theme und Bilder.
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';

const root = path.dirname(fileURLToPath(import.meta.url));
const kunde = process.env.KUNDE;
if (!kunde) throw new Error('KUNDE fehlt – bitte über die Skripte starten, z. B. `npm run vorschau -- K-9101-da-rosa`.');

const kundeDir = path.join(root, 'kunden', kunde);
const inhaltDatei = path.join(kundeDir, 'inhalt.yaml');
if (!fs.existsSync(inhaltDatei)) throw new Error(`Kein Kunde „${kunde}“ (erwartet: ${inhaltDatei})`);
const inhalt = YAML.parse(fs.readFileSync(inhaltDatei, 'utf8'));
const theme = inhalt?.design?.theme;
const themeDatei = path.join(root, 'themes', theme ?? '', 'theme.css');
if (!theme || !fs.existsSync(themeDatei)) throw new Error(`Theme „${theme}“ nicht gefunden (themes/<name>/theme.css)`);

export default defineConfig({
  site: /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(inhalt.domain ?? '') ? `https://${inhalt.domain}` : undefined,
  srcDir: './basis',
  publicDir: path.join(kundeDir, 'bilder'),
  outDir: path.join(root, 'dist', kunde),
  build: { format: 'file' },
  devToolbar: { enabled: false },
  vite: {
    resolve: {
      alias: {
        '@theme': themeDatei,
      },
    },
  },
});
