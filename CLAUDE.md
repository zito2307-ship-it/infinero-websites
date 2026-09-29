# Hinweise für Claude – INFINERO Website-Fließband

Hier entstehen **alle Kundenwebsites** von INFINERO (Inhaber Ziu Tonndorf, Jena). Ziel: Onboarding-Daten rein →
Vorschau-Link raus in < 1 Tag, bis zu eine neue Seite pro Arbeitstag, Änderungen in Minuten.
Hintergrund und Entscheidungen: Vault-Repo `zito2307-ship-it/vertrieb`, Datei `00_Start/Website-System.md`.
Sprache: Deutsch. Der Inhaber ist kein Techniker → Rückmeldungen kurz, ohne Fachjargon, mit klaren Schritten.

## Grundprinzip
**Ein Astro-Projekt für alle Kunden.** Inhalt, Design und Technik sind getrennt:

| Ordner | Inhalt | Wer ändert |
|---|---|---|
| `kunden/K-NNNN-slug/inhalt.yaml` | alle Texte, Daten, Bausteinwahl, Theme, Funktionen eines Kunden | pro Kunde |
| `kunden/K-NNNN-slug/bilder/` | Fotos, Logo, favicon.svg (liegen später im Wurzelverzeichnis der Seite) | pro Kunde |
| `themes/<name>/theme.css` | Farben, Schriften, Rundungen, Stil-Abweichungen | selten, gilt für viele |
| `basis/` | Bausteine, Layout, Impressum/Datenschutz, CSS-Grundgerüst | selten, gilt für **alle** |
| `tools/` | Skripte: neuer Kunde, Vorschau, Bauen, Prüfen, Veröffentlichen | selten |

**Regel:** Individualität über Theme + Bausteinwahl + `design.farben` – **keine Sonderlösungen pro Kunde in `basis/`**.
Braucht ein Kunde etwas Neues, wird es als allgemeiner Baustein/Option gebaut, den alle nutzen können.
Änderungen an `basis/` oder `themes/` betreffen alle Kunden → danach `npm run bauen -- --alle` und
mindestens je Theme einen Kunden mit `npm run pruefen` kontrollieren.

## Befehle
```bash
npm install                                   # einmalig nach dem Klonen
npm run neu -- K-0012 mueller-bau "Müller Bau" --branche handwerk   # gastro | beauty | handwerk | allgemein
npm run vorschau -- K-0012                    # Live-Vorschau http://localhost:4321
npm run pruefen -- K-0012                     # Bauen + Playwright-Prüfung → pruefung/<kunde>/bericht.md + Screenshots
npm run bauen -- --alle                       # alle Kunden nach dist/<kunde>/
npm run veroeffentlichen -- K-0012 [--live]   # Cloudflare Pages (Vorschau-Link bzw. live)
```
Kunden können überall kurz angegeben werden: `K-0012`, `mueller-bau` oder voller Ordnername.

## Ablauf pro Kunde (Stufen der Vertriebs-App)
1. **beauftragt/onboarding:** `npm run neu …` → `inhalt.yaml` aus dem Onboarding (Fragenkatalog im Vault:
   `40_Produkte/Onboarding-Fragenkatalog.md`) füllen. Unbekanntes bleibt `"??"` → erscheint im Prüfbericht als offen.
2. **in_arbeit:** Theme wählen, Bausteine zusammenstellen, Texte schreiben (Ausgangspunkt: passende Demo K-91xx).
   Texte: kurz, konkret, Nutzen für den Endkunden, Sie/Du laut Onboarding. Design-Skills unter `.claude/skills`
   (taste-skill, soft-skill, redesign-skill, emil-design-eng …) für Feinschliff nutzen.
3. **Prüfen:** `npm run pruefen` muss **0 Fehler** haben. Screenshots (Desktop + Handy) selbst ansehen.
4. **abnahme:** `npm run veroeffentlichen -- K-…` → Vorschau-Link an den Kunden.
5. **live:** `demo: false`, `beispiel: false`, Domain gesetzt, Formular in Supabase freigeschaltet → `--live`, Domain verbinden,
   Stufe „live“ in der App (Abo startet).
6. **Flatrate-Änderungen:** nur `inhalt.yaml`/Bilder ändern → prüfen → veröffentlichen.
Website-Notiz im Vault: `20_Websites/W-NNNN domain.md` aus `90_Vorlagen/Website-Blueprint.md`
(cms: Astro, hosting: Cloudflare Pages).

## Bausteine (`abschnitte:` in inhalt.yaml, Reihenfolge = Reihenfolge auf der Seite)
Gemeinsame Felder: `anker` (Sprungziel), `menue` (Eintrag im Menü), `label`, `titel` (darf `<em>` enthalten), `text`, `flaeche: true` (heller Kasten-Hintergrund).

| typ | wofür | wichtige Felder |
|---|---|---|
| `hero` | Kopfbereich | `variante: bild \| geteilt \| dunkel`, `bild`, `badge`, `bewertung`, `aktion`, `zweitaktion`, `telefon_zeigen`, `kennzahlen` (nur geteilt), `leiste` (Zahlenleiste darunter) |
| `vorteile` | 3–4 Vorteile mit Icon | `punkte: [{icon, titel, text}]`, `ueberlappend: true` (direkt nach dem Hero) |
| `textbild` | Über uns / Geschichte | `text` (Liste = Absätze), `bild`, `bild_alt`, `bild_text`, `bild_links`, `aktion` |
| `leistungen` | Leistungen/Behandlungen als Karten | `eintraege: [{titel, text, icon oder bild, preis, link}]`, `aktion` |
| `preisliste` | Speisekarte/Preisliste | `posten` oder `gruppen: [{titel, posten: [{name, text, preis}]}]`, `hinweis` |
| `galerie` | Referenzen/Fotos | `bilder: [{bild, text, alt}]` |
| `team` | Personen | `personen: [{name, rolle, bild}]` (ohne Bild: Anfangsbuchstabe) |
| `bewertungen` | Kundenstimmen | `eintraege: [{name, text, sterne}]` – genau 1 Eintrag = großes Zitat; `quelle` |
| `band` | Aussage über volle Breite | `label`, `titel`, `text` |
| `anfrage` | Formular | `art: reservierung \| termin \| rueckruf \| kontakt`, `themen`, `zeiten`, `punkte` (Liste links → zweispaltig), `formular_titel`, `nachricht: true`, `knopf`, `erfolg`, `erfolg_text` |
| `faq` | Häufige Fragen | `fragen: [{frage, antwort}]` |
| `kontakt` | Öffnungszeiten + Adresse (+ Karte) | `zeiten_titel`, `titel`, `hinweis`, `karte` |

Icons (`icon:`): uhr, telefon, stern, blatt, blitz, tropfen, bad, werkzeug, herz, haken, kalender, ort, schild,
funke, haus, chat, euro, auto, schere, besteck (`basis/bausteine/Icon.astro`, dort ergänzen).

**YAML-Falle:** In `{ … }` muss Text mit Komma in Anführungszeichen: `{ text: "Rot, grün" }`. Sonst wird abgeschnitten
(die Prüfung meldet dann „leer – oder Text mit Komma…“).

## Themes
| Theme | Stil | passt zu |
|---|---|---|
| `gastro-warm` | Weinrot/Creme, Cormorant Garamond + Manrope, runde Buttons | Restaurant, Café, Bäckerei |
| `beauty-hell` | Pflaume/Rosé, Playfair Display + Jost, eckig, Großbuchstaben-Buttons | Kosmetik, Nägel, Friseur, Physio |
| `handwerk-kraeftig` | Marine/Orange, Manrope 800, kräftig | SHK, Elektro, Dach, Maler, Kfz, allgemein |
| `praxis-klar` | Petrol/Mint, Plus Jakarta Sans, ruhig | Zahnarzt, Kieferorthopädie, Arzt, Physio, Kanzlei |

Neues Theme: Ordner kopieren, Variablen anpassen. Schriften **nur lokal** über `@fontsource/*` (latin + latin-ext)
– **niemals Google-Fonts-CDN**. Kontrast: Text ≥ 4,5:1 (axe prüft) – für Labels auf hellem Grund `--label` setzen.
Kundenfarben: `design.farben: { akzent: "#…", akzent-dunkel: "#…" }` (weißer Text auf `akzent` muss lesbar bleiben).

## Recht & Datenschutz (Muster – bei Änderungen am Vertragswerk auf anwaltliche Prüfung hinweisen)
- Impressum (§ 5 DDG) und Datenschutzerklärung werden **automatisch** aus `firma`, `recht`, `funktionen` erzeugt
  (Vorlagen im Vault: `50_Rechtliches/Website-Rechtstexte/`). Nur eingesetzte Dienste erscheinen.
- Keine Cookies, keine fremden Server ohne Klick: Google Maps nur mit 2-Klick (`funktionen.karte`), Chat-Widget
  nur über `funktionen.chat: snippet` + `chat_snippet` (dann `datenschutz.chat_ki_anbieter` Pflicht).
- **Heilberufe (Branche `praxis`):** Impressum mit `recht.berufsbezeichnung` (+ `verliehen_in`), `kammer` (z. B. Landeszahnärztekammer),
  `aufsichtsbehoerde` (bei Kassenpraxis die KZV bzw. KV), `berufsregeln` (Heilberufe-/Kammergesetz, Berufsordnung mit Link).
  Heilmittelwerbegesetz beachten: keine Heilversprechen, keine Vorher-/Nachher-Bilder, keine Patienten-Testimonials zu
  Behandlungserfolgen, keine Angst machenden Aussagen. Formular zeigt automatisch den Hinweis „keine Gesundheitsdaten“.
- Domains registriert INFINERO (Inhaber = Kunde), DNS bei Cloudflare.
- Die Chat-/CRM-Plattform im Hintergrund wird **nirgends namentlich genannt** – weder auf Seiten noch im Quelltext,
  in Kommentaren oder Commit-Nachrichten. Öffentlich heißt es „KI-Assistent“ / „betrieben von INFINERO“.
- `domain`, Telefon, E-Mail, Adresse echter Kunden nur aus dem Onboarding – nie erfinden. Beispiele: `beispiel: true`, IDs 9xxx.
- Keine Passwörter, Tokens oder Kunden-IBANs ins Repo (`.env` ist ausgeschlossen).

## Formulare
Echte Kunden senden an die Supabase Edge Function **`formular`** (Projekt „INFINERO VERTRIEB“ `ckiuvhuvuicbiabfkggg`,
Code im Vault-Repo `supabase/functions/formular`, SQL `supabase/website_formulare.sql`). Sie schickt per Brevo eine Mail
von kontakt@infinero.de an den Kunden (Antworten gehen direkt an den Anfragenden). Demos/Beispiele: Vorschau-Modus.
**Vor dem Livegang jeden Kunden freischalten** (per Supabase-Connector, Empfänger nur aus dem Onboarding):
```sql
insert into public.website_formulare (kunde, empfaenger, firma, domains, pages_projekt)
values ('K-0012', 'info@mueller-bau.de', 'Müller Bau', array['mueller-bau.de'], 'mueller-bau');
```
Schutz: nur freigeschaltete Domains + `<pages_projekt>.pages.dev`, Honeypot `firma_website`, 5 Anfragen/10 Min. je IP,
100/Tag je Kunde. Inhalte werden nicht gespeichert (nur Protokoll `formular_log`, 30 Tage).

## Cloudflare
`.env` (nicht im Repo): `CLOUDFLARE_API_TOKEN=…` (Rechte: Cloudflare Pages – Edit) und `CLOUDFLARE_ACCOUNT_ID=…`.
Ein Pages-Projekt pro Kunde, Name = Ordner ohne `K-NNNN-`. Domain danach im Dashboard verbinden.

## Playwright / Browser
- `npm run pruefen` nutzt das installierte Google Chrome (Fallback: `npx playwright install chromium`).
- `.mcp.json` richtet den Playwright-MCP **mit sichtbarem Fenster** ein (lokal am Mac). In Cloud-Sessions ohne
  Bildschirm stattdessen `--headless` ergänzen (Vault-Repo hat eine Headless-Variante).

## Demos & Beispiele
- `K-9101-da-rosa` (gastro-warm), `K-9102-maison-lelou` (beauty-hell), `K-9103-berger-haustechnik` (handwerk-kraeftig):
  die drei Demos von infinero.de/demo, übernommen 1:1 in das System (`demo: true` → Demo-Balken + noindex).
  Das Original liegt noch im Repo der Infinero-Website (`~/Documents/Claude Infinero/Website/demos/`).
- `K-9001-baeckerei-huber`: Beispielkunde ohne Demo-Balken, eigene Farbe, Karte, FAQ, Kontaktformular.
- `kunden/_vorlage/`: Vorlage für `npm run neu` (nicht direkt benutzen).
