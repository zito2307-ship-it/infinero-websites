// Ein Astro-Projekt für alle Kunden: KUNDE=<ordnername> wählt Inhalt, Theme und Bilder.
// VARIANTE=<a|b|c> baut einen Design-Entwurf (kunden/<kunde>/varianten/<id>.yaml) nach dist/<kunde>--<id>.
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { ladeInhalt } from './basis/lib/laden.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const kunde = process.env.KUNDE;
if (!kunde) throw new Error('KUNDE fehlt – bitte über die Skripte starten, z. B. `npm run vorschau -- K-9101-da-rosa`.');
const variante = process.env.VARIANTE || '';

const kundeDir = path.join(root, 'kunden', kunde);
const inhalt = ladeInhalt(root, kunde, variante);
const theme = inhalt?.design?.theme;
const themeDatei = path.join(root, 'themes', theme ?? '', 'theme.css');
if (!theme || !fs.existsSync(themeDatei)) throw new Error(`Theme „${theme}“ nicht gefunden (themes/<name>/theme.css)`);

export default defineConfig({
  site: /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(inhalt.domain ?? '') ? `https://${inhalt.domain}` : undefined,
  srcDir: './basis',
  publicDir: path.join(kundeDir, 'bilder'),
  outDir: path.join(root, 'dist', variante ? `${kunde}--${variante}` : kunde),
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
