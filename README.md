<!-- SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# 🐱 Helgas Katzenspiel

[![CI](https://github.com/marcelpetrick/HelgasKatzenspiel/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/marcelpetrick/HelgasKatzenspiel/actions/workflows/ci.yml)
[![License: GPL v3 or later](https://img.shields.io/badge/license-GPL--3.0--or--later-blue.svg)](LICENSE)
[![Coverage ≥ 95 %](https://img.shields.io/badge/coverage-%E2%89%A595%25-brightgreen.svg)](vite.config.ts)
[![Babylon.js](https://img.shields.io/github/package-json/dependency-version/marcelpetrick/HelgasKatzenspiel/@babylonjs/core?label=Babylon.js&color=bb464b)](https://www.babylonjs.com/)
[![TypeScript](https://img.shields.io/github/package-json/dependency-version/marcelpetrick/HelgasKatzenspiel/dev/typescript?label=TypeScript&logo=typescript&logoColor=white&color=3178c6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/github/package-json/dependency-version/marcelpetrick/HelgasKatzenspiel/dev/vite?label=Vite&logo=vite&logoColor=white&color=646cff)](https://vite.dev/)
[![Vitest](https://img.shields.io/github/package-json/dependency-version/marcelpetrick/HelgasKatzenspiel/dev/vitest?label=Vitest&logo=vitest&logoColor=white&color=6e9f18)](https://vitest.dev/)
[![Playwright](https://img.shields.io/github/package-json/dependency-version/marcelpetrick/HelgasKatzenspiel/dev/@playwright/test?label=Playwright&logo=playwright&color=2ead33)](https://playwright.dev/)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-5fa04e.svg?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

A cute, colourful 3D browser game about a little girl and her many cats — pet them, feed them, throw
them a yarn ball, fly and cast sparkly spells, collect coins and go shopping. No weapons, no
fighting: just hearts. The game speaks German.

_Ein niedliches, buntes Browserspiel: Ein Mädchen streichelt und versorgt ganz viele Katzen, zaubert,
fliegt, sammelt Münzen und kauft im Katzenladen ein._

It is designed together with Helga, who decides what goes in; her wishes are collected in
[`visions.md`](visions.md). The look follows [Allium Assault](https://github.com/marcelpetrick/AlliumAssault).

**Author: Marcel Petrick <mail@marcelpetrick.it>** · **License: GPLv3 or later, see [`LICENSE`](LICENSE).**
**Note: this project is generated with AI.**

<p align="center">
  <img src="docs/screenshots/play.jpg" alt="The girl petting the cat Mimi on a flowery meadow; pink hearts rise above them" width="100%">
</p>

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/title.jpg" alt="Title screen: Helgas Katzenspiel, Los geht’s!"></td>
    <td width="50%"><img src="docs/screenshots/shop.jpg" alt="The cat shop with clothes in many colours"></td>
  </tr>
</table>

## How to play

| Key      | Action                                                    |
| -------- | --------------------------------------------------------- |
| ← →      | walk                                                      |
| Space    | jump — **hold** to fly, let go to float down              |
| Enter    | pet the cat you are standing next to (hearts!)            |
| Z (or Y) | cast a spell: sparkles, and every cat nearby is delighted |
| K        | open / close the cat shop (clothes, food, treats, toys)   |
| 1 / 2    | give the nearest cat food / a treat (bought in the shop)  |
| 3        | throw the yarn ball — the cats chase it                   |

Every three hearts a happy cat drops a coin; walk over coins to collect them. Coins buy clothes for
the girl and food, treats and a yarn ball for the cats. Clothes, supplies and coins are remembered
in the browser (`localStorage`).

## Setup

Requires Node.js 24.

```sh
npm install
npm run dev        # http://localhost:5173
```

`npm run build` writes a static site to `dist/`; `npm run preview` serves it on port 4173.

## Testing and the pipeline

```sh
./localPipeline.sh           # everything; must be green before every commit
./localPipeline.sh --no-e2e  # skip the browser tests
```

| Stage     | What it checks                                                     |
| --------- | ------------------------------------------------------------------ |
| install   | `npm ci` when dependencies are missing or stale                    |
| eslint    | type-aware `typescript-eslint` strict rules                        |
| prettier  | formatting                                                         |
| stylelint | CSS                                                                |
| markdown  | markdownlint                                                       |
| typecheck | `tsc --noEmit`, strict                                             |
| coverage  | Vitest unit tests of the game rules in `src/core`, ≥ 95 % enforced |
| build     | Vite production build                                              |
| e2e       | Playwright in headless Chromium against the built game             |

GitHub Actions ([`ci.yml`](.github/workflows/ci.yml)) runs the same script on every push to `main`.

Single steps: `npm test`, `npm run coverage`, `npm run lint`, `npm run typecheck`, `npm run e2e`,
`npm run format` (auto-fix formatting).

## Scripts

| Script                                             | Purpose                                                                                         |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`localPipeline.sh`](localPipeline.sh)             | The full quality gate described above; `--help` lists the stages.                               |
| [`scripts/screenshot.mjs`](scripts/screenshot.mjs) | Takes the README screenshots from a running game: `node scripts/screenshot.mjs [url] [outDir]`. |

## Project layout

```text
src/core/    game rules without Babylon or the DOM (unit tested)
src/render/  Babylon.js scene: landscape, house, girl, cats, effects
src/ui/      HUD, title screen, shop, German texts, saving
e2e/         Playwright browser tests
tests/       Vitest unit tests
```

## Versioning

Semantic versioning in `package.json`: every commit bumps the patch version, new features bump the
minor version. Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## License

Copyright © 2026 Marcel Petrick. Licensed under the GNU General Public License v3.0 or later — see
[`LICENSE`](LICENSE).
