// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Focus } from '../core/game';
import type { Building, SpotId } from '../core/world';

const SPOT_ACTIONS: Record<SpotId, string> = {
  exit: '↑ oder Enter: nach draußen gehen 🌳',
  bowls: 'Enter: Milch und Futter hinstellen 🥛',
  fridge: 'Enter: Kühlschrank durchsuchen',
  cupboard: 'Enter: Küchenschrank durchsuchen',
  table: 'Hier auf dem Tisch liegen manchmal Münzen',
  bathtub: 'Auf der Badewanne liegen manchmal Münzen 🛁',
  bathCabinet: 'Enter: Badschrank durchsuchen',
  wardrobe: 'Enter: Anziehschrank öffnen 👗',
  bed: 'Das Bett — gemütlich! 💤',
};

const DOOR_ACTIONS: Record<Building['id'], string> = {
  house: '↑ oder Enter: ins Haus gehen 🏠',
  shop: '↑ oder Enter: in den Katzenladen gehen 🛍️',
  school: '↑ oder Enter: in die Schule gehen ✏️',
};

const SPOT_NAMES: Record<SpotId, string> = {
  exit: 'Haustür',
  bowls: 'Schüsseln',
  fridge: 'Kühlschrank',
  cupboard: 'Küchenschrank',
  table: 'Tisch',
  bathtub: 'Badewanne',
  bathCabinet: 'Badschrank',
  wardrobe: 'Anziehschrank',
  bed: 'Bett',
};

/** Every text the player sees. The game speaks German. */
export const TEXT = {
  title: 'Helgas Katzenspiel',
  tagline: 'Streichle deine Katzen, zaubere Glitzer und sammle Münzen!',
  start: 'Los geht’s!',
  startHint: 'oder Enter drücken',
  continueGame: 'Weiterspielen',
  newGame: 'Neues Spiel beginnen',
  newGameConfirm: 'Wirklich ganz von vorne anfangen? Alle Katzen, Münzen und Sachen sind dann weg.',
  saveFailed: 'Speichern klappt in diesem Browserfenster leider nicht.',
  muted: (off: boolean) => (off ? 'Ton aus 🔇' : 'Ton an 🔊'),
  hearts: 'Herzen',
  coins: 'Münzen',
  catsCount: (n: number) => (n === 1 ? '1 Katze' : `${n} Katzen`),
  garden: 'Im Garten',
  inHouse: (room: string) => `Im Haus · ${room}`,
  controls: [
    ['← → ↑ ↓', 'laufen'],
    ['Leertaste', 'springen · halten = fliegen'],
    ['Enter', 'streicheln · benutzen'],
    ['N', 'Katze hochnehmen / absetzen'],
    ['Z', 'zaubern ✨'],
    ['K', 'Katzenladen 🛍️'],
    ['M', 'meine Katzen ✏️'],
    ['F', 'meine Figur 👧'],
    ['S', 'speichern 💾'],
    ['T', 'Ton an/aus 🔊'],
  ] as const,
  prompt(f: Focus, carrying: boolean): string {
    if (!f) return '';
    if (f.kind === 'cat')
      return f.cat.mood === 'carried'
        ? `Enter: ${f.cat.name} kuscheln 💕 · N: absetzen`
        : `Enter: ${f.cat.name} streicheln 💕${carrying ? '' : ' · N: hochnehmen'}`;
    if (f.kind === 'door') return DOOR_ACTIONS[f.building.id];
    return SPOT_ACTIONS[f.spot.id];
  },
  searched: (spot: SpotId, found: number) =>
    found === 0
      ? `Im ${SPOT_NAMES[spot]} ist gerade nichts. Später nochmal schauen!`
      : `${found === 1 ? 'Eine Münze' : `${found} Münzen`} im ${SPOT_NAMES[spot]} gefunden! 🪙`,
  bowls(milk: boolean, food: boolean, noFood: boolean): string {
    if (food) return 'Milch und Futter stehen bereit! Die Katzen kommen gleich. 🥛🥫';
    if (noFood) return milk ? 'Milch steht bereit! 🥛 Futter gibt es im Katzenladen (K).' : 'Kein Futter mehr — kauf welches im Katzenladen (K).';
    return milk ? 'Milch steht bereit! 🥛' : 'Die Schüsseln sind schon voll.';
  },
  kitten: (name: string) => `Ein Katzenbaby ist da! Es heißt ${name}. 🍼🐱`,
  newCat: (name: string) => `${name} wohnt jetzt bei dir! 🎉`,
  saved: 'Gespeichert! 💾 Beim nächsten Mal geht es genau hier weiter.',
  supplies: {
    food: 'Futter',
    treat: 'Leckerli',
    yarn: 'Wollknäuel',
  },
  shop: {
    title: '🛍️ Katzenladen',
    wardrobeTitle: '👗 Anziehschrank',
    close: 'Schließen (Esc)',
    tabClothes: '👗 Kleidung',
    tabCats: '🐱 Für Katzen',
    tabDeco: '🏠 Deko',
    decoHint: 'Deko macht das Haus gemütlich. Je schöner das Haus, desto schneller tauchen Münzen in den Schränken auf!',
    free: 'gratis',
    buy: 'Kaufen',
    wear: 'Anziehen',
    wearing: 'Angezogen ✓',
    owned: 'Hast du schon ✓',
    have: (n: number) => `Im Schrank: ${n}`,
    bought: (name: string) => `${name} gekauft! 🎉`,
    tooPoor: 'Dafür reichen deine Münzen noch nicht. Streichle mehr Katzen! 💕',
    useHint:
      'Tipp: Stell dich zu einer Katze und drück 1 für Futter, 2 für ein Leckerli, 3 wirft das Wollknäuel. Futter kannst du auch in der Küche in die Schüssel tun.',
    newCat: 'Neue Katze',
    newCatDesc: 'Eine neue Katze zieht bei dir ein',
    tooManyCats: 'Mehr Katzen passen gerade nicht ins Haus.',
  },
  school: {
    title: '✏️ Schule',
    close: 'Nach Hause (Esc)',
    intro: 'Guten Morgen! Wie schwer sollen die Rechenaufgaben heute sein?',
    progress: (n: number, of: number) => `Aufgabe ${n} von ${of}`,
    right: 'Richtig! Super gerechnet! ⭐',
    wrong: (answer: number) => `Fast! Richtig ist ${answer}. Beim nächsten Mal klappt’s! 💪`,
    report: '📜 Zeugnis',
    score: (right: number, of: number) => `${right} von ${of} Aufgaben richtig`,
    coins: (n: number) => `Du bekommst ${n} Münzen! 🪙`,
    noCoins: 'Diesmal gibt es noch keine Münzen. Üben macht schlau!',
    again: 'Nochmal rechnen',
    home: 'Nach Hause gehen',
  },
  figure: {
    title: '👧 Meine Figur',
    close: 'Fertig (Esc)',
    skin: 'Hautfarbe',
    hair: 'Haarfarbe',
    hairStyle: 'Frisur',
    eyes: 'Augen',
    mouth: 'Mund',
    freckles: 'Sommersprossen',
    frecklesOn: 'Mit Sommersprossen ✓',
    frecklesOff: 'Ohne Sommersprossen',
    hint: 'Kleidung, Haarschmuck, Ohrringe und Nagellack gibt es im Katzenladen (K). Was du schon hast, liegt im Anziehschrank im Schlafzimmer.',
  },
  catsMenu: {
    title: '✏️ Meine Katzen',
    close: 'Fertig (Esc)',
    name: 'Name',
    color: 'Farbe',
    size: 'Größe',
    kitten: (percent: number) => `Katzenbaby · ${percent} % gewachsen`,
    love: (n: number) => `${n} Herzen bekommen`,
    where: (house: boolean) => (house ? 'im Haus 🏠' : 'im Garten 🌳'),
  },
};
