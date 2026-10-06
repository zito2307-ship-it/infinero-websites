---
description: Offene Website-Wünsche aus der Vertriebs-App holen und je Lead drei Design-Entwürfe bauen, hochladen und in der App bereitstellen
---
# /entwuerfe – Drei Design-Entwürfe je Lead

Du arbeitest im Repo `infinero-websites` (Regeln: `CLAUDE.md`). Ziel: Für jeden wartenden Lead aus der Vertriebs-App
drei Entwürfe (A hell & ruhig · B kräftig & bildstark · C dunkel & edel) als Links bereitstellen, die der Inhaber in der App
auswählt. Argument optional: `$ARGUMENTS` = ein Kunde (`K-0012`) oder eine App-Lead-ID; ohne Argument alle offenen.

## 1. Arbeitsliste holen
Supabase-Connector (Projekt `ckiuvhuvuicbiabfkggg`): `select public.website_arbeit();`
- `demos_offen`: Leads mit „Demo-Website gewünscht“ (`demo_infos` = die 6 Kurzfragen) → **Demo** (`demo: true`, `noindex: true`, echte Firmendaten, Formular im Vorschau-Modus).
- `auftraege_offen`: bezahlte Aufträge (Website/Pakete) ohne Entwürfe → **echte Seite** (`demo: false`, `noindex: true` bis zur Freigabe, Formular aktiv, Daten aus `onboarding`).
- `gewaehlt` / `in_arbeit`: nur melden – dafür gibt es `/ausbauen`.
Nichts offen → kurz melden und aufhören.

## 2. Je Lead: Kunde anlegen
- Nächste freie Nummer: Demos `K-91xx`-frei? Nein – Demos aus der App bekommen echte Nummern `K-00xx` (nächste freie in `kunden/`), weil daraus Kunden werden.
- `npm run neu -- K-00xx <slug> "<Firma>" --branche <gastro|beauty|handwerk|praxis|allgemein> --lead <lead_id> [--auftrag <auftrag_id>]`
- `inhalt.yaml` füllen – **nur echte Angaben**: App-Daten (Firma, Adresse, Telefon, E-Mail, Ansprechpartner, Branche, `demo_infos`/`onboarding`),
  dann alte Website / Google-Profil (`website`) mit dem Browser lesen: Leistungen, Öffnungszeiten, Team, Impressum (Rechtsform, Register, Kammer).
  Fotos der alten Website nur, wenn `demo_infos.bilder` das erlaubt („alte Seite/Instagram“); sonst keine Fotos (Hero-Grafik/Farben) – **keine Stockfotos ohne Freigabe**.
  Unbekanntes bleibt `"??"` (erscheint im Prüfbericht). Texte: kurz, konkret, Nutzen für den Endkunden; Heilberufe → HWG-Regeln (CLAUDE.md).
  Lies dafür den **taste-skill**: Richtung aus dem Brief ableiten (`demo_infos.stil`, `farben`, `besonders`), nichts Schablonenhaftes.
- Kundenfarben aus `demo_infos.farben` → `design.farben`.

## 3. Drei Entwürfe
- `npm run varianten -- K-00xx` legt `varianten/a.yaml`, `b.yaml`, `c.yaml` an (Standard-Rezept).
- Verfeinern (taste-skill): je Entwurf eine klare Idee, nicht nur Farbe tauschen – z. B. anderer Hero (`geteilt`/`bild`/`dunkel`/`grafik`),
  andere Reihenfolge oder weggelassene Abschnitte (`ohne:`), passendes Theme. Alte Website vorhanden → zusätzlich **redesign-skill** (Audit, was war schlecht).
  `name`/`beschreibung` je Entwurf so, dass der Inhaber den Unterschied in einem Satz versteht.
- `npm run entwuerfe -- K-00xx` → baut, prüft grob (Konsole, Überbreite), macht Vorschaubilder, lädt `a./b./c.<projekt>.pages.dev` hoch
  und druckt den fertigen SQL-Aufruf `select public.entwuerfe_eintragen(…)`.
- Vorschaubilder in `pruefung/K-00xx/entwurf-*-handy.png` **selbst ansehen**: wirkt einer wie Schablone oder kaputt → nachbessern und erneut.

## 4. In der App bereitstellen
- Den gedruckten SQL-Aufruf über den Supabase-Connector ausführen (setzt Lead auf „in Arbeit“, Push an den Inhaber, Verlaufseintrag).
- `git add -A && git commit` mit Nachricht `Entwürfe K-00xx <Firma> (A/B/C)`.

## 5. Melden
Kurz, ohne Fachjargon: Firma, drei Links, ein Satz je Entwurf, was fehlte (`"??"`), was vom Inhaber zu entscheiden ist.
Er wählt in der App (oder sagt hier „B + Feedback“) → dann `/ausbauen`.

## Regeln
- Nie erfinden: Adressen, Register-/Kammerdaten, Teamrollen, Bewertungen. Fehlt es → `"??"`.
- Den Namen der Chat-/CRM-Plattform nirgends nennen (CLAUDE.md).
- Nichts geht live. Entwürfe und Vorschau tragen `noindex`.
- Mehrere Leads: nacheinander, je Lead ein Commit.
