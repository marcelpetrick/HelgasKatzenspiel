<!-- SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Helgas Katzenspiel 🐱

Ein niedliches, buntes Browserspiel: Ein Mädchen streichelt und versorgt ganz viele Katzen, zaubert,
fliegt, geht zur Schule, verdient Münzen, kauft im Katzenladen ein und schmückt ihr Haus.

## Neu in dieser Version

- Babylon.js, Vite, ESLint, Stylelint, globale Typen und die Node.js-24-Typen wurden auf ihre
  neuesten kompatiblen Versionen aktualisiert; Vitest und die Testabdeckung auf Version 5.0.3.
- Nur ein Tab kann gleichzeitig spielen. Ein zweiter wartet, bis das erste Spiel geschlossen ist, und
  lädt dann dessen letzten Spielstand.
- Die Schule verwirft Antworten aus abgebrochenen Aufgaben; Schaltflächen lassen sich wieder mit der
  Tastatur bedienen. Überschüssige Herzen zählen für das nächste Katzenbaby weiter.
- Der Release-Ablauf prüft vor der Veröffentlichung, dass der Tag auf `main` liegt und neuer als die
  bisherigen Releases ist. Ein erneut ausgeführter älterer Image-Job setzt `latest` nicht zurück.

## Was drin ist

- Garten mit Schule, Haus und Katzenladen; laufen in alle Richtungen, springen, fliegen, zaubern.
- Katzen streicheln, füttern, Milch geben, hochnehmen und mit ihnen fliegen; Wollknäuel zum Spielen.
- Haus mit Küche (Schüsseln für Milch und Futter), Flur, Bad und Schlafzimmer; Münzen in den Schränken.
- Schule mit Rechenaufgaben in drei Stufen, Zeugnis und Münzen für gute Noten.
- Katzenladen: Kleidung, Haarschmuck, Ohrringe, Nagellack, Katzensachen, Deko und neue Katzen.
- „Meine Figur“ (F) und „Meine Katzen“ (M): Aussehen, Namen, Farben und Größen.
- Katzenbabys, wachsende und rundere Katzen, Speichern mit S, niedliche Geräusche.

## Spielen

- **Web-Paket:** `helgas-katzenspiel-<version>-web.zip` entpacken, mit einem beliebigen statischen
  Webserver ausliefern (z. B. `npx serve`) und im Browser öffnen.
- **Docker:** Das Image wird nach dem GitHub-Release in einem eigenen Job veröffentlicht. Falls es
  noch fehlt, den Release-Workflow prüfen und den fehlgeschlagenen Image-Job erneut starten. Das
  Paket ist privat wie das Repository, deshalb zuerst mit einem GitHub-Token
  (Recht `read:packages`) anmelden: `docker login ghcr.io -u <github-name>`. Dann
  `docker run --rm -p 8080:80 ghcr.io/marcelpetrick/helgas-katzenspiel:<version>` und
  <http://localhost:8080> öffnen.
