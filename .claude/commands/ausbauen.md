---
description: Gewählten Website-Entwurf mit dem Feedback des Inhabers zur fertigen Seite ausbauen und Vorschau-Link in die App schreiben
---
# /ausbauen – Vom gewählten Entwurf zur fertigen Website

Repo `infinero-websites` (Regeln: `CLAUDE.md`). Argument optional: `$ARGUMENTS` = `K-0012` oder `K-0012 b`
(wenn der Inhaber hier im Chat gewählt hat statt in der App). Ohne Argument: alle mit Status „gewaehlt“.

## 1. Auswahl holen
Supabase-Connector: `select public.website_arbeit();` → Liste `gewaehlt` (kunde, gewaehlt, feedback).
Wurde hier im Chat gewählt: Auswahl + Feedback zuerst eintragen:
`update public.website_entwuerfe set gewaehlt='b', feedback='…' where kunde='K-0012';`

## 2. Entwurf übernehmen
- `npm run ausbauen -- K-0012 b` → setzt `variante: b` in `inhalt.yaml`, löscht a/c.
- Status in der App: `select public.entwuerfe_status('K-0012', 'in_ausbau');`

## 3. Feedback einarbeiten und fertig bauen
- Jeden Punkt aus `feedback` umsetzen und am Ende auflisten (erledigt / nicht möglich, warum).
- Inhalt vervollständigen: offene `"??"` aus App (`onboarding`) oder alter Website schließen; Detailseiten für Leistungen (`details:`),
  Team-Infos, FAQ, Karte (`npm run karte -- K-0012`), Logo (`design.logo`), Rechtstexte (Impressum-Pflichtangaben je Branche).
- Feinschliff mit **soft-skill** und **emil-design-eng** (Abstände, Typografie, Zustände), Handy mit **mobile-native** gegenchecken.
- SEO/GEO: `faq`-Abschnitt mit echten Fragen anlegen, `seo.titel`/`seo.beschreibung` mit Ort + Leistung, bei Gastro `seo.kueche`.
  `npm run sichtbarkeit -- K-0012` → lokal 90/100 (nur HTTPS offen); alte Seite zum Vergleich: `npm run sichtbarkeit -- <alte-domain>`.
- `npm run pruefen -- K-0012` → **0 Fehler**; Screenshots Desktop + Handy selbst ansehen (Startbereich, Formular, Menü).
- Formular freischalten, falls echter Kunde (CLAUDE.md, Abschnitt Formulare) – Empfänger nur aus App/Onboarding.

## 4. Vorschau bereitstellen
- `npm run veroeffentlichen -- K-0012` → `https://vorschau.<projekt>.pages.dev`
- `select public.entwuerfe_status('K-0012', 'vorschau', 'https://vorschau.<projekt>.pages.dev');` (Push an den Inhaber, Link in der App)
- Commit: `K-0012 <Firma>: Entwurf B ausgebaut, Feedback eingearbeitet`

## 5. Melden
Kurz: Vorschau-Link, was aus dem Feedback umgesetzt wurde, was noch offen ist (fehlende Angaben, Fotos, Domain), nächster Schritt
(Abnahme durch den Kunden → `--live` erst nach ausdrücklichem „live“ des Inhabers; dann `entwuerfe_status(…, 'live', url)`).

## Regeln
- Nichts erfinden, Platzhalter als `"??"` lassen. Plattformname nie nennen. Live nur auf Zuruf des Inhabers.
