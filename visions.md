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

## Das Mädchen

9. Genau ein Mädchen, das ganz viele Katzen hat.
10. Figuren-Editor: Haarfarbe, Haarlänge, Gesicht, Hautfarbe, Oberteil, Unterteil.
11. Haarschmuck: Katzenohren-Haarreif, Spangen, Schleifen; dazu Ohrringe und Nagellack.

## Welt

12. Eine Landschaft mit Katzen und ein Haus im gleichen Stil.
13. Im Haus: Küche, Bad, Anziehschrank. Die Katzen brauchen viel Platz.

## Katzen

14. Beim Streicheln erscheinen kleine Herzchen — die Katzen freuen sich.
15. In der Küche Milch und Futter hinstellen, darüber freuen sich die Katzen auch.
16. Aussehen der Katzen ist wählbar.
17. Katzen wachsen, wenn man gut auf sie aufpasst und sie füttert.
18. Mit 100 € kann man eine neue Katze kaufen; viele Katzen bekommen Babys.
19. Spielzeug für die Katzen, mit den Katzen spielen.

## Münzen & Schule

20. In der Schule Rechenaufgaben lösen; gut rechnen und gute Noten bringen Münzen.
21. Je mehr Herzen die Katzen machen, desto schneller findet man Münzen.
22. Münzen tauchen auf, wenn sich Katzen freuen — auf dem Küchentisch, in Schüsseln, im Bad, im Anziehschrank.
23. Mit Münzen kauft man Futter, Trinken, Spielzeug, Kleidung und Deko fürs Haus.

## Vorerst nicht

- Hamster und Hunde — erstmal nur Katzen.

## Umsetzungsplan

1. **MVP (erledigt):** lokal im Browser lauffähig; Landschaft im Allium-Assault-Stil, ein Haus, ein
   Mädchen mit Katzenohren-Haarreif und Zauberstab, sechs Katzen, Laufen/Springen/Fliegen,
   Streicheln und Zaubern mit Herzchen, Münzen durch glückliche Katzen, deutsche Oberfläche.
2. Später: Haus betreten (Küche, Bad, Schrank), Füttern, Figuren-Editor, Shop, Schule mit
   Rechenaufgaben, Katzen kaufen/wachsen/Babys.
3. Später: Pipeline (`localPipeline.sh`), Tests ≥ 95 %, GitHub Actions, Docker/ghcr, README.
