<!-- SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# AGENTS.md — Hinweise für KI-Agenten

## Wer und was

- Helgas Katzenspiel ist ein Browserspiel für ein Kind, gebaut zusammen mit ihrem Papa.
- **Mit den Nutzern wird Deutsch gesprochen**, einfach und kindgerecht. Code, Kommentare und
  Commit-Messages sind Englisch.
- Die Spieloberfläche ist Deutsch (niedlich, kindgerecht). Alle Sätze, Hinweise und Schilder stehen in
  `src/ui/text.ts`; nur die Namen der Dinge (Katalog, Rezepte, Frisuren, Katzenfarben, Räume) stehen als
  Daten neben ihren Regeln in `src/core`.
- Jede neue Aktion bekommt ein Geräusch (`src/audio.ts`) und, wenn nötig, einen Hinweis im HUD.
- Die Anforderungen stehen in [`visions.md`](visions.md). Neue Wünsche dort eintragen, bevor sie
  umgesetzt werden.
- Freundlich, niedlich, bunt: keine Waffen, kein Blut, kein Kampf, kein Krieg. Erstmal nur Katzen
  (keine Hamster, keine Hunde).
- Optische Vorlage ist Allium Assault (`~/repos/AlliumAssault`): gleicher Babylon.js-Aufbau
  (Deep-Imports, ACES-Tonemapping, Glow, Nebel, Glas-Panels, Schrift Fredoka).

## Befehle

```sh
npm install          # Abhängigkeiten (exakt gepinnte Versionen)
npm run dev          # Dev-Server, http://localhost:5273 (eigener Port, strictPort)
./localPipeline.sh   # komplette Prüfung: Lint, Format, Typen, Tests+Coverage, Build, E2E
npm test             # nur Unit-Tests (Vitest)
npm run e2e          # nur Browser-Tests (Playwright)
npm run format       # Formatierung automatisch reparieren
node scripts/screenshot.mjs [url]  # README-Screenshots neu aufnehmen
scripts/docker-check.sh            # Docker-Image bauen und prüfen
```

## Aufbau

- `src/core/` — Spielregeln ohne Babylon und DOM, alle unit-getestet:
  - `world.ts` Weltaufbau: drei Orte (Garten, Haus, Laden), Gebäude, Türen, Schränke, Regale,
  - `game.ts` Mädchen, Katzen, Münzen, Füttern, Tragen, Babys,
  - `shop.ts` Katalog und Kleiderschrank, `look.ts` Aussehen des Mädchens,
  - `cats.ts` Katzenfarben und -namen, `school.ts` Rechenaufgaben und Noten, `kitchen.ts` Rezepte,
    `save.ts` Speichern (Version 2; Version 1 wird noch gelesen).
- `src/render/` — Babylon-Szene: Landschaft mit Wald und Strand, Haus und Hausinneres, Laden und
  Ladeninneres (`shopInterior.ts`), Schule, Mädchen, Katzen, Näpfe und Spielzeug (`props.ts`), Effekte.
- `src/ui/` — DOM-Overlay (HUD, Startbildschirm, Menüs für Laden, Katzen, Figur, Schule, Kochen), Texte,
  CSS, `localStorage`.
- `src/audio.ts` — niedliche Geräusche, synthetisch mit Web Audio.
- `src/app.ts` — Tastatur, Spielschleife, verbindet alles.
- `tests/` — Vitest-Tests für `src/core`.
- `e2e/` — Playwright-Tests im echten Browser (Hook: `window.__katzen`).

Babylon immer per Deep-Import einbinden (`@babylonjs/core/…`), nie über das Paket-Root. Fehlende
Seiteneffekte (z. B. `Meshes/instancedMesh`, `Lights/Shadows/shadowGeneratorSceneComponent`)
explizit importieren.

## Arbeitsweise

- Direkt auf `main`, atomare Commits, Conventional Commits.
- Jeder Commit hebt die Version in `package.json` an: Patch für Kleines, Minor für neue Features.
- Vor jedem Commit: `./localPipeline.sh` muss grün sein (GitHub Actions führt dasselbe aus).
- Coverage von `src/core` ≥ 95 %; neue Regeln gehören nach `src/core` und bekommen Tests.
- Neue Dateien bekommen den SPDX-Header (GPL-3.0-or-later, Marcel Petrick).
- Pushen nach `main` ist erlaubt, wenn die Pipeline grün ist. Releases entstehen über Tags `vX.Y.Z`
  (Workflow `release.yml`); das Docker-Image landet auf ghcr (`docker.yml`).
- Das Spiel nur dann in Firefox öffnen, wenn der Nutzer es ausdrücklich sagt — nie von selbst zwischendurch.
