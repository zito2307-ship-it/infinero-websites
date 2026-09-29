// Baut einen Kunden (oder alle mit --alle) nach dist/<kunde>/.
import { alleKunden, astro, findeKunde } from './gemeinsam.mjs';
const arg = process.argv[2];
const liste = arg === '--alle' ? alleKunden() : [findeKunde(arg)];
let fehler = 0;
for (const k of liste) {
  console.log(`\n▶ Baue ${k}`);
  if (astro('build', k) !== 0) { fehler++; console.error(`✖ ${k} fehlgeschlagen`); }
}
process.exit(fehler ? 1 : 0);
