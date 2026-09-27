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
12. Niedliche Geräusche für alle Aktionen: streicheln, Münzen, Herzen, zaubern, springen, fressen …

## Das Mädchen

13. Genau ein Mädchen, das ganz viele Katzen hat.
14. Figuren-Editor: Haarfarbe, Haarlänge, Gesicht, Hautfarbe, Oberteil, Unterteil.
15. Haarschmuck: Katzenohren-Haarreif, Spangen, Schleifen; dazu Ohrringe und Nagellack.

## Welt

16. Eine Landschaft mit Katzen und ein Haus im gleichen Stil. Ganz viele Blumen.
17. Ins Haus hineingehen. Im Haus: Küche, Bad, Anziehschrank. Die Katzen brauchen viel Platz.
18. Ein Kaufladen, in den das Mädchen hineingehen kann: Kleidung, Katzenfutter, Leckerlis, Spielzeug.

## Katzen

19. Beim Streicheln erscheinen kleine Herzchen — die Katzen freuen sich.
20. In der Küche Milch und Futter hinstellen, darüber freuen sich die Katzen auch.
21. Aussehen der Katzen ist wählbar: Farbe (auch grün, blau, lila …), Größe (klein bis groß), Namen
    selbst aussuchen.
22. Katzen wachsen, wenn man gut auf sie aufpasst und sie füttert.
23. Mit 100 € kann man eine neue Katze kaufen; viele Katzen bekommen Babys.
24. Spielzeug für die Katzen, mit den Katzen spielen.
25. Wenn die Katzen viel fressen, werden sie runder und größer.

- Füttern sieht man: Das Mädchen stellt einen Napf hin, alle Katzen kommen angerannt, wollen schnell
  fressen und streiten sich manchmal.
- Spielzeug (Wollknäuel, Ball, Maus, Federwedel) liegt einfach auf dem Boden; die Katzen spielen damit.
- Ein Rucksack (10 Münzen) zum Anziehen, sichtbar am Mädchen; Katzen hochheben und hineinstecken.
- Frisuren: ein Zopf, zwei Zöpfe, Pippi Langstrumpf, ganz kurz; Haarfarben blond, braun, schwarz …;
  Katzenohren-Haarreif oder anderer Haarreif.
- Ein viel größeres Spielfeld ohne Absperrung — weit weg vom Haus bis an den Strand. Verstecken spielen.
- Im Laden Lebensmittel (Tomaten, Lauch, Eier …), Bratpfanne und Besteck kaufen; kochen und essen.

## Münzen & Schule

26. In der Schule Rechenaufgaben lösen; gut rechnen und gute Noten bringen Münzen.
27. Je mehr Herzen die Katzen machen, desto schneller findet man Münzen.
28. Münzen tauchen auf, wenn sich Katzen freuen — auf dem Küchentisch, in Schüsseln, im Bad, im Anziehschrank.
29. Mit Münzen kauft man Futter, Trinken, Spielzeug, Kleidung und Deko fürs Haus.

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
- [x] Kaufmenü (K): Kleidung, Futter (1), Leckerli (2), Wollknäuel (3), Milch zum Trinken (4).
- [x] Pipeline (`localPipeline.sh`), Linting, Tests ≥ 95 %, E2E, GitHub-Actions-Workflow, README.
- [x] Speichern (S) und Laden des ganzen Spielstands; beim Verlassen der Seite wird auch gespeichert.
- [x] Nach hinten/vorne laufen (↑ ↓).
- [x] Katze hochnehmen (N) und mit ihr fliegen.
- [x] Katzen-Editor (M): Name, zwölf Farben (auch Grün, Blau, Lila), Größe von winzig bis riesig.
- [x] Kaufladen-Gebäude zum Hineingehen.
- [x] Ins Haus gehen: Küche (Milch und Futter in die Schüsseln), Flur, Bad, Schlafzimmer mit
      Anziehschrank; Münzen in Schüsseln, auf dem Tisch, auf der Badewanne und in den Schränken.
- [x] Figuren-Editor (F): Hautfarbe, Haarfarbe, Frisur (Haarlänge), Augen, Mund, Sommersprossen.
- [x] Haarschmuck (Katzenohren, Schleifen, Spangen), Ohrringe und Nagellack im Laden.
- [x] Schule: Rechenaufgaben in drei Stufen, Zeugnis mit Note 1–6, Münzen für gute Noten; danach
      nach Hause gehen.
- [x] Neue Katze für 100 Münzen; Katzenbabys, wenn viele Katzen glücklich sind; Babys wachsen.
- [x] Katzen werden vom Fressen runder; mit dem Wollknäuel spielen macht sie wieder schlanker.
- [x] Deko fürs Haus: Kratzbaum, Kissen, Blumentöpfe, Katzenbild, Herzteppich, Lichterkette.
- [x] Niedliche Geräusche für alle Aktionen (T schaltet den Ton aus).
- [x] Docker-Image (nginx), Veröffentlichung auf ghcr, Pushen nach GitHub und Releases.
- [x] Näpfe (1 Futter, 4 Milch): Katzen rennen hin, fressen nacheinander, streiten manchmal.
- [x] Spielzeug bleibt liegen (Wollknäuel, Glöckchenball, Spielzeugmaus), Enter hebt es auf;
      Federwedel (5).
- [x] Rucksack: kaufen, anziehen, sichtbar; R steckt bis zu drei Katzen hinein.
- [x] Frisuren Ein Zopf, Pippi Langstrumpf, Ganz kurz; Haarreif ohne Ohren und Blumen-Haarreif.
- [x] Riesige Welt: Wiese, Wald, Strand mit Meer, Palmen und Sonnenschirm.
- [x] Verstecken (V) hinter den Büschen, Münzen fürs Finden.
- [x] Kochen: Lebensmittel und Küchensachen im Laden, sechs Rezepte am Herd, am Tisch essen,
      danach doppelt so hoch fliegen.
- [x] Fehler aus der Selbstprüfung behoben (Wände, Türen im Flug, Schul-Timer, Tastatur in Menüs,
      Lautstärke, Schilder, Speichern der Zähler).
- [x] Große Katzen wachsen weiter, wenn man sie streichelt und füttert (bis 25 % größer).
- [x] Je mehr Herzen, desto schneller Münzen: erst alle 3 Herzen, ab 60 Herzen alle 2, ab 250 für jedes.
- [x] Münzen tauchen auch am Anziehschrank auf.
- [x] Getränke für das Mädchen: Kakao und Orangensaft in der Küche machen und trinken.
- [x] Hosen als Unterteil: Jeanshose, rosa Leggings, grüne Latzhose.
- [x] HUD: „H: Hilfe“ bleibt sichtbar, Esc steht in der Liste; Klick-Geräusch für H, T und Esc.
- [x] Katzenladen zum Hineingehen: vier Regale (Kleidung, Für Katzen, Küche, Deko), eine Tür und eine
      Verkäuferkatze an der Kasse; Enter am Regal öffnet die passende Seite. K geht weiterhin überall.
- [x] Laden nachgebessert: Regale und Kasse sind fest, ↑ gedrückt halten führt nicht gleich wieder
      hinein, gekaufte Katzen warten draußen vor der Tür.
- [x] Namensschilder der Katzen liegen unter den Tafeln (Tastenliste, Vorräte), nicht darüber.
- [x] Eigene Ports (Spiel 5273, Test 4273); die Pipeline installiert nur neu, wenn sich die
      Abhängigkeiten wirklich ändern, damit das laufende Spiel nicht kaputtgeht.
