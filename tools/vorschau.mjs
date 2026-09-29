// Startet die Live-Vorschau eines Kunden: npm run vorschau -- K-9101
import { astro, findeKunde } from './gemeinsam.mjs';
const kunde = findeKunde(process.argv[2]);
console.log(`▶ Vorschau ${kunde} – im Browser öffnen: http://localhost:4321`);
process.exit(astro('dev', kunde, ['--port', '4321']));
