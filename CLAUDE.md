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

## Standard-Ablauf „Entwürfe → Auswahl → Ausbau“ (seit 06.10.2026)
Zwei Slash-Befehle in `.claude/commands/` tragen den ganzen Ablauf – **das ist das Format, nichts mehr frei erklären**:
1. **`/entwuerfe`** holt offene Wünsche aus der App (`select public.website_arbeit()`), legt den Kunden an (`npm run neu … --lead <id>`),
   füllt `inhalt.yaml` aus App + alter Website, erzeugt drei Entwürfe (`npm run varianten`, verfeinern mit taste-skill), baut und lädt
   sie hoch (`npm run entwuerfe` → `a./b./c.<projekt>.pages.dev`) und trägt sie in die App ein (`select public.entwuerfe_eintragen(…)`).
   Der Inhaber bekommt einen Push und wählt **in der App** (Lead → „Website-Entwürfe“: A/B/C + Feedback).
2. **`/ausbauen`** nimmt die Auswahl (`website_arbeit().gewaehlt`), übernimmt den Entwurf (`npm run ausbauen -- K-… b`), arbeitet das
   Feedback ein (soft-skill, emil-design-eng, mobile-native), prüft (0 Fehler), veröffentlicht die Vorschau und meldet den Link in die App
   (`select public.entwuerfe_status('K-…','vorschau', url)`). Live nur auf ausdrückliches „live“ des Inhabers.
Entwürfe = `kunden/K-…/varianten/{a,b,c}.yaml` (nur Abweichungen: `design`, `hero`, `ohne`, `name`, `beschreibung`; `null` entfernt einen
Schlüssel – Logik in `basis/lib/laden.mjs`). Nach der Auswahl steht `variante: b` in `inhalt.yaml`; die Datei bleibt die einzige Inhaltsquelle.
Stufe 2 (geplant): derselbe Ablauf automatisch per GitHub Action, ausgelöst von der App (Supabase-Webhook) – Skripte und Skills liegen
dafür bereits komplett im Repo; es fehlt nur der Auslöser + Secrets (Anthropic-Key, Cloudflare, Supabase).

**Skills-Konvention:** Design-Skills liegen in `.claude/skills/` und werden automatisch geladen. Welcher Skill in welchem Schritt läuft,
steht in den beiden Befehlen. Neuer Skill von GitHub → Ordner nach `.claude/skills/`, eine Zeile im passenden Befehl ergänzen. Fertig.
_Todo (Inhaber, 06.10.2026): weitere Skills einfügen._

## Befehle
```bash
npm install                                   # einmalig nach dem Klonen
npm run neu -- K-0012 mueller-bau "Müller Bau" --branche handwerk   # gastro | beauty | handwerk | allgemein
npm run vorschau -- K-0012                    # Live-Vorschau http://localhost:4321
npm run pruefen -- K-0012                     # Bauen + Playwright-Prüfung → pruefung/<kunde>/bericht.md + Screenshots
npm run bauen -- --alle                       # alle Kunden nach dist/<kunde>/
npm run veroeffentlichen -- K-0012 [--live]   # Cloudflare Pages (Vorschau-Link bzw. live)
npm run varianten -- K-0012                   # 3 Entwürfe a/b/c anlegen (Standard-Rezept je Branche)
npm run entwuerfe -- K-0012 [--ohne-hochladen]  # Entwürfe bauen, Vorschaubilder, hochladen, SQL für die App drucken
npm run pruefen -- K-0012 --variante c        # einen Entwurf prüfen
npm run ausbauen -- K-0012 b                  # gewählten Entwurf übernehmen
npm run sichtbarkeit -- K-0012                # Sichtbarkeits-Check (wie infinero.de/check) lokal – ohne Mail/Lead; Ziel 90 lokal = 100 online
npm run sichtbarkeit -- alte-seite.de         # alte Website des Kunden zum Vergleich
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
| `preisliste` | Speisekarte/Preisliste | `posten` oder `gruppen: [{titel, posten: [{name, text, preis}]}]`, `hinweis`, `aktion: {text, ziel, hinweis}` (z. B. Bestell-Link) |
| `galerie` | Referenzen/Fotos | `bilder: [{bild, text, alt}]` |
| `team` | Personen | `personen: [{name, rolle, bild}]` (ohne Bild: Anfangsbuchstabe) |
| `bewertungen` | Kundenstimmen | `eintraege: [{name, text, sterne}]` – genau 1 Eintrag = großes Zitat; `quelle` |
| `band` | Aussage über volle Breite | `label`, `titel`, `text` |
| `anfrage` | Formular | `art: reservierung \| termin \| rueckruf \| kontakt`, `themen`, `zeiten`, `punkte` (Liste links → zweispaltig), `formular_titel`, `nachricht: true`, `knopf`, `erfolg`, `erfolg_text` |
| `faq` | Häufige Fragen | `fragen: [{frage, antwort}]` |
| `kontakt` | Öffnungszeiten + Adresse (+ Karte) | `zeiten_titel`, `titel`, `hinweis`, `karte` |

**Weitere Optionen (Runde 2, Testkunde K-0001):**
- `hero.grafik: zahn | sonne | eis` (nur `variante: geteilt`) – große Linien-Grafik mit sanft bewegtem Hintergrund statt Foto; `hero.telefon_zeigen: true` = Anruf-Knopf mit Hörer-Symbol (bei `bild`/`dunkel` nur Textlink – `telefon_zeigen: knopf` macht dort einen Knopf; `hero.aktion_mitte: true` = Hauptknopf am Computer mittig zwischen Anruf und Zweitaktion).
- `design.zusatz_mobil: true` = Unterzeile (`firma.zusatz`) auch auf dem Handy zeigen (nur bei kurzen Namen).
- `design.telefon_im_menue: true` = Nummer mit Hörer im Kopf, auf dem Handy runder Anruf-Knopf neben dem Menü. `anfrage.telefon_zeigen: true` (+ `telefon_text`) = „Lieber persönlich? Rufen Sie uns an“ mit Knopf über dem Formular.
- `leistungen.eintraege[].details: { einleitung, abschnitte: [{ titel, text }], hinweis }` → eigene Unterseite `/leistungen/<slug>` + „Mehr erfahren“.
- `team.personen[].text` → „Mehr erfahren“ zum Ausklappen (nur echte Angaben aus dem Onboarding – nichts erfinden).
- `galerie.slider: true` → automatisch laufende Bildleiste (pausiert bei Maus/Fokus, keine Bewegung bei „reduzierte Bewegung“).
- `kontakt.karte` + `npm run karte -- K-…` → Karte aus lokal gespeicherten OpenStreetMap-Kacheln (sofort sichtbar, keine Einwilligung nötig, „Route planen“ öffnet Google Maps). Ohne Kacheln: Google Maps mit 2-Klick.
- `design.logo` (+ `logo_hoehe` in px, Standard 44; im Footer auf hellem Feld, abschaltbar mit `logo_im_fuss: false`; `logo_im_kopf: false` = Kopf zeigt Zeichen + Name; `logo_feld: false` = kein heller Hintergrund hinter dem Logo bei dunklen Themes). `hero.logo: true` = Logo groß über der Überschrift (ersetzt das Label); `hero.abdunkeln: 60` = Foto im Hero heller/dunkler (Standard 82, Prozent)
- `design.zeichen_icon: zahn` (Symbol statt Buchstabe im Logo), `design.bewegung: true` (Abschnitte blenden beim Scrollen ein).
- `firma.name_kopf` / `firma.name_fuss` (Name im Kopf bzw. Footer mit `<br>`), `firma.fax`, `recht.bildnachweise` (Pflicht bei CC-Fotos, z. B. Wikimedia Commons).

Icons (`icon:`): uhr, telefon, stern, blatt, blitz, tropfen, bad, werkzeug, herz, haken, kalender, ort, schild,
funke, haus, chat, euro, auto, schere, besteck, zahn, sonne, eis, kaffee, waffel (`basis/bausteine/Icon.astro`, dort ergänzen).

**YAML-Falle:** In `{ … }` muss Text mit Komma in Anführungszeichen: `{ text: "Rot, grün" }`. Sonst wird abgeschnitten
(die Prüfung meldet dann „leer – oder Text mit Komma…“). Ebenso Text, der mit `&`, `*`, `#` oder `:` beginnt.

## SEO & KI-Sichtbarkeit (automatisch, seit 06.10.2026)
Jede Seite bekommt ohne Zutun (Logik `basis/lib/seo.ts`): JSON-LD mit Betriebstyp je Branche (Restaurant, Dentist, BeautySalon,
HomeAndConstructionBusiness, sonst LocalBusiness), Adresse, Geo-Koordinaten (aus `bilder/karte/karte.json`), Öffnungszeiten
(aus `oeffnungszeiten`, Formate „Mo – Fr“ / „Montag – Sonntag“ / „8:30 – 12:30 · 13:30 – 19:30“), Speisekarte + Reservierung (Gastro),
Leistungen, FAQPage (aus `faq`-Abschnitten); dazu Open-Graph-Angaben, geo.*-Meta, saubere canonical-Adresse sowie
`/robots.txt`, `/sitemap.xml` (nur mit `domain`) und `/llms.txt` (Steckbrief für KI-Assistenten).
Optionale Felder: `seo: { schema_typ: Bakery, kueche: Italienisch, preisklasse: "€€", profile: [Google-/Instagram-Links], bild }`.
**Für GEO zählt der Inhalt:** jede Seite braucht einen `faq`-Abschnitt mit echten Fragen (Lage, Zeiten, Anmeldung/Reservierung,
Angebot) und klare Sätze mit Ort + Leistung („Italienisches Restaurant am Jenaer Marktplatz“). Bewertungen nur als Text,
**kein** aggregateRating-Markup (Google wertet das bei lokalen Betrieben als selbstbezogen).
Vor jeder Vorschau `npm run sichtbarkeit -- K-…` → lokal 90/100 (nur HTTPS offen) ist das Ziel.

## Themes
| Theme | Stil | passt zu |
|---|---|---|
| `gastro-warm` | Weinrot/Creme, Cormorant Garamond + Manrope, runde Buttons | Restaurant, Café, Bäckerei |
| `beauty-hell` | Pflaume/Rosé, Playfair Display + Jost, eckig, Großbuchstaben-Buttons | Kosmetik, Nägel, Friseur, Physio |
| `handwerk-kraeftig` | Marine/Orange, Manrope 800, kräftig | SHK, Elektro, Dach, Maler, Kfz, allgemein |
| `praxis-klar` | Petrol/Mint, Plus Jakarta Sans, ruhig | Zahnarzt, Kieferorthopädie, Arzt, Physio, Kanzlei |
| `edel-dunkel` | Anthrazit/Gold, Cormorant + Manrope, dunkel | gehobene Gastro, Spa, Kanzlei, Immobilien; Standard für Entwurf C |

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
- `app: { lead_id, auftrag_id }` in `inhalt.yaml` verknüpft den Kunden mit der Vertriebs-App (Supabase-Tabelle `website_entwuerfe`).
