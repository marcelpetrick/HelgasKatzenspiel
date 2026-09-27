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
    ['K', 'Katzenladen 🛍️'],
  ] as const,
  supplies: {
    food: 'Futter',
    treat: 'Leckerli',
    yarn: 'Wollknäuel',
  },
  shop: {
    title: '🛍️ Katzenladen',
    close: 'Schließen (K)',
    tabClothes: '👗 Kleidung',
    tabCats: '🐱 Für Katzen',
    free: 'gratis',
    buy: 'Kaufen',
    wear: 'Anziehen',
    wearing: 'Angezogen ✓',
    owned: 'Hast du schon ✓',
    have: (n: number) => `Im Schrank: ${n}`,
    bought: (name: string) => `${name} gekauft! 🎉`,
    tooPoor: 'Dafür reichen deine Münzen noch nicht. Streichle mehr Katzen! 💕',
    useHint: 'Tipp: Stell dich zu einer Katze und drück 1 für Futter, 2 für ein Leckerli, 3 wirft das Wollknäuel.',
  },
};
