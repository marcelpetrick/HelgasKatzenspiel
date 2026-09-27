<!-- SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# AGENTS.md — Hinweise für KI-Agenten

## Wer und was

- Helgas Katzenspiel ist ein Browserspiel für ein Kind, gebaut zusammen mit ihrem Papa.
- **Mit den Nutzern wird Deutsch gesprochen**, einfach und kindgerecht. Code, Kommentare und
  Commit-Messages sind Englisch.
- Die Spieloberfläche ist Deutsch; alle sichtbaren Texte stehen in `src/ui/text.ts`.
- Die Anforderungen stehen in [`visions.md`](visions.md). Neue Wünsche dort eintragen, bevor sie
  umgesetzt werden.
- Freundlich, niedlich, bunt: keine Waffen, kein Blut, kein Kampf, kein Krieg. Erstmal nur Katzen
  (keine Hamster, keine Hunde).
- Optische Vorlage ist Allium Assault (`~/repos/AlliumAssault`): gleicher Babylon.js-Aufbau
  (Deep-Imports, ACES-Tonemapping, Glow, Nebel, Glas-Panels, Schrift Fredoka).

## Befehle

```sh
npm install        # Abhängigkeiten (exakt gepinnte Versionen)
npm run dev        # Dev-Server, http://localhost:5173
npm test           # Unit-Tests (Vitest)
npm run typecheck  # TypeScript strict
npm run build      # Typecheck + Produktions-Build nach dist/
```

## Aufbau

- `src/core/` — Spielregeln ohne Babylon und DOM (Laufen, Springen, Fliegen, Streicheln, Zaubern,
  Münzen, Katzen-Verhalten). Hier gehört jede Regel hin, und hier wird sie unit-getestet.
- `src/render/` — Babylon-Szene: Landschaft, Haus, Mädchen, Katzen, Effekte, Kamera.
- `src/ui/` — DOM-Overlay (HUD, Startbildschirm), Texte, CSS.
- `src/app.ts` — Tastatur, Spielschleife, verbindet alles.
- `tests/` — Vitest-Tests für `src/core`.

Babylon immer per Deep-Import einbinden (`@babylonjs/core/…`), nie über das Paket-Root. Fehlende
Seiteneffekte (z. B. `Meshes/instancedMesh`, `Lights/Shadows/shadowGeneratorSceneComponent`)
explizit importieren.

## Arbeitsweise

- Direkt auf `main`, atomare Commits, Conventional Commits.
- Jeder Commit hebt die Version in `package.json` an: Patch für Kleines, Minor für neue Features.
- Vor jedem Commit: `npm run build` und `npm test` müssen grün sein.
- Neue Dateien bekommen den SPDX-Header (GPL-3.0-or-later, Marcel Petrick).
- Geplant, aber noch nicht da: `localPipeline.sh`, Coverage ≥ 95 %, Playwright-E2E, GitHub
  Actions, Docker/ghcr, README mit Badges und Screenshot.
