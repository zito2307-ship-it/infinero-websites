---
kunde: K-0003
lead: L-001032
firma: „Zur Sonne“ GmbH – Ristorante Due Angeli
vorschau: https://vorschau.zur-sonne.pages.dev
stand: 2026-10-06
tags: [website, todo]
---
# Zur Sonne / Due Angeli – offene Punkte

Demo ist fertig und präsentierbar (Entwurf B, 0 Fehler, Sichtbarkeits-Check 100/100).

## Ziu besorgt
- [ ] **Domain** registrieren – danach in `inhalt.yaml` → `domain:` eintragen (steht noch auf jena-dueangeli.de = Lieferando-Seite),
      Formular-Freischaltung (`website_formulare.domains`) ergänzen, Domain im Cloudflare-Dashboard mit dem Pages-Projekt `zur-sonne` verbinden
- [ ] **Echte Speisekarte** – die Preise auf der Seite stammen von Lieferando
- [ ] **Neuere, gute Fotos** (Essen, Gastraum, Terrasse)
- [ ] **E-Mail-Adresse des Restaurants** – fürs Impressum und als Empfänger der Reservierungen

## Vor der Übergabe klären
- [ ] **Fotorechte:** Gäste-Fotos von Google nur mit Erlaubnis der Fotografen; auf 2 Bildern sind Gäste erkennbar
      (`markt-abend.webp`, `eisbecher.webp`)
- [ ] **Reservierungen umstellen:** gehen im Test an Ziu → Empfänger in Supabase `website_formulare` (K-0003) auf die
      Restaurant-Adresse ändern, Firmenname ohne „(Test)“

## Livegang (nur auf ausdrückliches „live“ von Ziu)
- [ ] `demo: false`, `noindex` entfernen, `firma.email` gesetzt → `npm run pruefen -- K-0003` (0 Fehler, keine offenen Angaben)
- [ ] `npm run veroeffentlichen -- K-0003 --live`, Domain verbinden, `entwuerfe_status('K-0003','live', url)`
- [ ] Google-Unternehmensprofil: Website-Link eintragen (bisher keiner hinterlegt)
