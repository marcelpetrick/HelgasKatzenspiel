<!-- SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it> -->
<!-- SPDX-License-Identifier: GPL-3.0-or-later -->

# 🐱 Helgas Katzenspiel

[![CI](https://github.com/marcelpetrick/HelgasKatzenspiel/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/marcelpetrick/HelgasKatzenspiel/actions/workflows/ci.yml)
[![Docker](https://github.com/marcelpetrick/HelgasKatzenspiel/actions/workflows/docker.yml/badge.svg?branch=main)](https://github.com/marcelpetrick/HelgasKatzenspiel/actions/workflows/docker.yml)
[![Release](https://img.shields.io/github/v/release/marcelpetrick/HelgasKatzenspiel?sort=semver)](https://github.com/marcelpetrick/HelgasKatzenspiel/releases/latest)
[![License: GPL v3 or later](https://img.shields.io/badge/license-GPL--3.0--or--later-blue.svg)](LICENSE)
[![Coverage ≥ 95 %](https://img.shields.io/badge/coverage-%E2%89%A595%25-brightgreen.svg)](vite.config.ts)
[![Babylon.js](https://img.shields.io/github/package-json/dependency-version/marcelpetrick/HelgasKatzenspiel/@babylonjs/core?label=Babylon.js&color=bb464b)](https://www.babylonjs.com/)
[![TypeScript](https://img.shields.io/github/package-json/dependency-version/marcelpetrick/HelgasKatzenspiel/dev/typescript?label=TypeScript&logo=typescript&logoColor=white&color=3178c6)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/github/package-json/dependency-version/marcelpetrick/HelgasKatzenspiel/dev/vite?label=Vite&logo=vite&logoColor=white&color=646cff)](https://vite.dev/)
[![Vitest](https://img.shields.io/github/package-json/dependency-version/marcelpetrick/HelgasKatzenspiel/dev/vitest?label=Vitest&logo=vitest&logoColor=white&color=6e9f18)](https://vitest.dev/)
[![Playwright](https://img.shields.io/github/package-json/dependency-version/marcelpetrick/HelgasKatzenspiel/dev/@playwright/test?label=Playwright&logo=playwright&color=2ead33)](https://playwright.dev/)
[![Node.js 24](https://img.shields.io/badge/Node.js-24-5fa04e.svg?logo=nodedotjs&logoColor=white)](https://nodejs.org/)

A cute, colourful 3D browser game about a little girl and her many cats. Pet them, feed them,
carry them around and fly with them, go to school for coins, go shopping, dress up and decorate the
house. No weapons, no fighting: just hearts. The game speaks German.

_Ein niedliches, buntes Browserspiel: Ein Mädchen streichelt und versorgt ganz viele Katzen, zaubert,
fliegt, geht zur Schule, verdient Münzen, kauft im Katzenladen ein und schmückt ihr Haus._

It is designed together with Helga, who decides what goes in; her wishes are collected in
[`visions.md`](visions.md). The look follows [Allium Assault](https://github.com/marcelpetrick/AlliumAssault).

**Author: Marcel Petrick <mail@marcelpetrick.it>** · **License: GPLv3 or later, see [`LICENSE`](LICENSE).**
**Note: this project is generated with AI.**

<p align="center">
  <img src="docs/screenshots/play.jpg" alt="The girl with a backpack has put down a bowl; the cats come running to eat" width="100%">
</p>

<table>
  <tr>
    <td width="50%"><img src="docs/screenshots/house.jpg" alt="The kitchen: cats walking to the milk and food bowls"></td>
    <td width="50%"><img src="docs/screenshots/school.jpg" alt="School: a sum with four answers to choose from"></td>
  </tr>
  <tr>
    <td width="50%"><img src="docs/screenshots/beach.jpg" alt="The beach at the end of the garden: sand, palms, a sunshade and the sea"></td>
    <td width="50%"><img src="docs/screenshots/shop.jpg" alt="The cat shop with clothes in many colours"></td>
  </tr>
</table>

## How to play

| Key       | Action                                                                               |
| --------- | ------------------------------------------------------------------------------------ |
| ← →       | walk                                                                                 |
| ↑ ↓       | walk further back / to the front; ↑ at a door goes in                                |
| Space     | jump — **hold** to fly, let go to float down                                         |
| Enter     | pet the cat next to you, pick up a toy, or use a door, cupboard, bowl, stove, table  |
| N         | pick up the nearest cat, or put it down — you can fly with it                        |
| R         | put the cat in your arms into the backpack (up to three), or take one out again      |
| 1 / 4     | put down a bowl of food / milk — the cats come running, eat in turn, and squabble    |
| 2         | give the cat next to you a treat                                                     |
| 3 / 5     | throw a toy (yarn ball, bell ball, toy mouse) / wave the feather wand                |
| Z (or Y)  | cast a spell: sparkles, and every cat nearby is delighted                            |
| V         | hide-and-seek: the cats hide behind the bushes, walk past a bush to find them        |
| K         | the cat shop: clothes, jewellery, a backpack, cat things, kitchen things, decoration |
| M / F     | "Meine Katzen" (name, colour, size) / "Meine Figur" (skin, hair, hairstyle, face)    |
| S / T / H | save the whole game / sound on or off / hide the list of keys                        |
| Esc       | close a menu                                                                         |

**The world.** A long garden: the school on the left, the girl's house and the cat shop, a meadow,
a wood with hiding bushes, and far to the right a beach with the sea, palm trees and a sunshade.
Walk up into a door to go in. The house has a kitchen (bowls, stove, table), a hall, a bathroom and
a bedroom with the wardrobe.

**Coins.** Every three hearts a happy cat drops a coin — after 60 hearts every two, after 250 every
heart; walk over coins to collect them. Indoors they turn up on the table, in the bowls, on the tub and
at the wardrobe. At school,
five sums earn a German grade (1–6) and up to 30 coins. Cupboards in the house hide coins that refill
over time — faster the more the house is decorated. Cats that empty a kitchen bowl leave a coin in
it, and finding every cat at hide-and-seek pays two coins per cat.

**Cats.** Food makes cats rounder; chasing toys slims them down again. Thrown toys stay on the floor,
and cats play with them by themselves. A new cat costs 100 coins. With four or more cats, happy
grown-ups have kittens, which grow up with every heart. Grown cats keep growing slowly when they are
petted and fed, up to a quarter bigger.

**Cooking.** Buy groceries (tomato, leek, egg, bread, cheese, apple, milk, cocoa, oranges), a pan, a
pot and cutlery. At the stove, cook a fried egg, an omelette, leek soup, tomato salad, a cheese
sandwich or apple slices, or make hot cocoa or orange juice; eat or drink it at the table, and for a
minute the girl can fly twice as high.

**Sound.** Every action has a small synthesized sound — meows, purrs, a squabbling hiss, coin
plings, sparkles, a doorbell, a shop bell — made with the Web Audio API, no sound files.

## Setup

Requires Node.js 24.

```sh
npm install
npm run dev        # http://localhost:5273
```

`npm run build` writes a static site to `dist/`; `npm run preview` serves it on port 4273.

## Docker

The image builds the game with Node 24 and serves the static files with nginx.

```sh
docker build -t helgas-katzenspiel .
docker run --rm -p 8080:80 helgas-katzenspiel      # open http://localhost:8080
```

Every push to `main` publishes `ghcr.io/marcelpetrick/helgas-katzenspiel:latest` (plus `main` and
`sha-<commit>`); every release tag publishes the version, e.g. `:0.10.0`. The repository is private, so the
package is too: `docker login ghcr.io` with a token that has `read:packages` before pulling.
[`scripts/docker-check.sh`](scripts/docker-check.sh) builds the image and proves it serves the page
and its bundle.

## Releases

Pushing a tag `vX.Y.Z` that matches `package.json` runs the whole pipeline and publishes a GitHub
release with the zipped static site (`helgas-katzenspiel-X.Y.Z-web.zip` plus its SHA-256). Unzip it
and serve the folder with any static web server.

## Testing and the pipeline

```sh
./localPipeline.sh           # everything; must be green before every commit
./localPipeline.sh --no-e2e  # skip the browser tests
```

| Stage     | What it checks                                                       |
| --------- | -------------------------------------------------------------------- |
| install   | `npm ci` when dependencies are missing or stale                      |
| eslint    | type-aware `typescript-eslint` strict rules                          |
| prettier  | formatting                                                           |
| stylelint | CSS                                                                  |
| markdown  | markdownlint                                                         |
| typecheck | `tsc --noEmit`, strict                                               |
| coverage  | Vitest unit tests of the game rules in `src/core`, ≥ 95 % enforced   |
| build     | Vite production build                                                |
| e2e       | Playwright in headless Chromium against the built game               |
| docker    | builds the image and checks it serves the game (`--no-docker` skips) |

GitHub Actions runs the same script: [`ci.yml`](.github/workflows/ci.yml) on every push,
[`docker.yml`](.github/workflows/docker.yml) builds and publishes the image, and
[`release.yml`](.github/workflows/release.yml) makes releases from tags.

Single steps: `npm test`, `npm run coverage`, `npm run lint`, `npm run typecheck`, `npm run e2e`,
`npm run format` (auto-fix formatting).

## Scripts

| Script                                               | Purpose                                                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| [`localPipeline.sh`](localPipeline.sh)               | The full quality gate described above; `--help` lists the stages.                                                  |
| [`scripts/docker-check.sh`](scripts/docker-check.sh) | Builds the Docker image, starts it on a free port and checks the page and bundle: `scripts/docker-check.sh [tag]`. |
| [`scripts/screenshot.mjs`](scripts/screenshot.mjs)   | Takes the README screenshots from a running game: `node scripts/screenshot.mjs [url] [outDir]`.                    |

## Project layout

```text
src/core/    game rules without Babylon or the DOM (unit tested): world layout, cats, shop,
             school, kitchen, the girl's look, saving
src/render/  Babylon.js scene: garden, house interior, shop, school, girl, cats, effects
src/ui/      HUD, title screen, menus (shop, cats, figure, school), German texts, storage
src/audio.ts synthesized sound effects
e2e/         Playwright browser tests
tests/       Vitest unit tests
```

## Versioning

Semantic versioning in `package.json`: every commit bumps the patch version, new features bump the
minor version. Commits follow [Conventional Commits](https://www.conventionalcommits.org/).

## License

Copyright © 2026 Marcel Petrick. Licensed under the GNU General Public License v3.0 or later — see
[`LICENSE`](LICENSE).
