// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/** Every text the player sees. The game speaks German. */
export const TEXT = {
  title: 'Helgas Katzenspiel',
  tagline: 'Streichle deine Katzen, zaubere Glitzer und sammle Münzen!',
  start: 'Los geht’s!',
  startHint: 'oder Enter drücken',
  hearts: 'Herzen',
  coins: 'Münzen',
  catsCount: (n: number) => (n === 1 ? '1 Katze' : `${n} Katzen`),
  petPrompt: (name: string) => `Enter: ${name} streicheln 💕`,
  controls: [
    ['← →', 'laufen'],
    ['Leertaste', 'springen · halten = fliegen'],
    ['Enter', 'Katze streicheln'],
    ['Z', 'zaubern ✨'],
  ] as const,
};
