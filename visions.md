<!-- SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# Helgas Katzenspiel — Vision

Ein freundliches, niedliches und buntes Browserspiel. Ein Mädchen hat ganz viele Katzen, streichelt
und versorgt sie, geht zur Schule und verdient Münzen. Keine Waffen, kein Blut, kein Schießen, kein
Kampf, kein Krieg.

## Aussehen & Technik

1. Grafikstil wie [Allium Assault](../AlliumAssault/) (3D, weiche Formen, Hügel, See, Bäume), aber mit Katzen.
2. Läuft im Browser, gebaut mit Babylon.js.
3. Die Oberfläche ist auf Deutsch.

## Steuerung

4. Pfeiltasten links/rechts: das Mädchen läuft.
5. Leertaste: springen.
6. Enter: eine Katze streicheln, wenn das Mädchen nah genug dran ist.
7. Leertaste halten: das Mädchen kann **fliegen**.
8. Z: das Mädchen kann **zaubern** (Glitzersterne; Katzen in der Nähe freuen sich).
9. Pfeiltasten hoch/runter: nach hinten und nach vorne laufen (nicht nur links/rechts).
10. Eine Katze hochnehmen und mit ihr zusammen fliegen.
11. K: Kaufmenü öffnen. S: Spielstand speichern — beim nächsten Öffnen im selben Browser geht es genau
    dort weiter.

## Das Mädchen

12. Genau ein Mädchen, das ganz viele Katzen hat.
13. Figuren-Editor: Haarfarbe, Haarlänge, Gesicht, Hautfarbe, Oberteil, Unterteil.
14. Haarschmuck: Katzenohren-Haarreif, Spangen, Schleifen; dazu Ohrringe und Nagellack.

## Welt

15. Eine Landschaft mit Katzen und ein Haus im gleichen Stil. Ganz viele Blumen.
16. Ins Haus hineingehen. Im Haus: Küche, Bad, Anziehschrank. Die Katzen brauchen viel Platz.
17. Ein Kaufladen, in den das Mädchen hineingehen kann: Kleidung, Katzenfutter, Leckerlis, Spielzeug.

## Katzen

18. Beim Streicheln erscheinen kleine Herzchen — die Katzen freuen sich.
19. In der Küche Milch und Futter hinstellen, darüber freuen sich die Katzen auch.
20. Aussehen der Katzen ist wählbar: Farbe (auch grün, blau, lila …), Größe (klein bis groß), Namen
    selbst aussuchen.
21. Katzen wachsen, wenn man gut auf sie aufpasst und sie füttert.
22. Mit 100 € kann man eine neue Katze kaufen; viele Katzen bekommen Babys.
23. Spielzeug für die Katzen, mit den Katzen spielen.

## Münzen & Schule

24. In der Schule Rechenaufgaben lösen; gut rechnen und gute Noten bringen Münzen.
25. Je mehr Herzen die Katzen machen, desto schneller findet man Münzen.
26. Münzen tauchen auf, wenn sich Katzen freuen — auf dem Küchentisch, in Schüsseln, im Bad, im Anziehschrank.
27. Mit Münzen kauft man Futter, Trinken, Spielzeug, Kleidung und Deko fürs Haus.

## Vorerst nicht

- Hamster und Hunde — erstmal nur Katzen.

## Qualität

- `README.md` mit Badges, Anleitung und Screenshot; Lizenz GPLv3.
- Atomare Commits, Versionsnummer steigt mit jedem Commit.
- `localPipeline.sh`: Lint, Formatierung, Typprüfung, Tests (≥ 95 % Abdeckung), Build, E2E im Browser —
  damit das Spiel nicht abstürzt. GitHub Actions spiegeln die Pipeline.

## Umsetzungsplan

- [x] MVP: Landschaft, Haus, Mädchen, Katzen; laufen, springen, fliegen, streicheln, zaubern; Münzen.
- [x] Mehr Blumen.
- [x] Kaufmenü (K): Kleidung, Futter (1), Leckerli (2), Wollknäuel (3).
- [ ] Pipeline, Linting, README.
- [ ] Speichern (S) und Laden des ganzen Spielstands.
- [ ] Nach hinten/vorne laufen.
- [ ] Katze hochnehmen und mit ihr fliegen.
- [ ] Katzen-Editor: Name, Farbe, Größe.
- [ ] Kaufladen-Gebäude zum Hineingehen.
- [ ] Ins Haus gehen: Küche (Milch und Futter hinstellen), Bad, Anziehschrank; Münzen in Schüsseln, auf
      dem Tisch, im Schrank.
- [ ] Figuren-Editor: Haarfarbe, Haarlänge, Gesicht, Hautfarbe, Haarschmuck, Ohrringe, Nagellack.
- [ ] Schule: Rechenaufgaben, Noten, Münzen.
- [ ] Katzen kaufen (100 Münzen), Katzen wachsen, Katzenbabys.
- [ ] Deko fürs Haus.
- [ ] Später: Docker/ghcr.
