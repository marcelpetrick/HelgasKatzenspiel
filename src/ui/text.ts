// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Focus } from '../core/game';
import { recipe } from '../core/kitchen';
import type { Grocery, Gear, Supply } from '../core/shop';
import type { Building, SpotId } from '../core/world';

const SPOT_ACTIONS: Record<SpotId, string> = {
  exit: '↑ oder Enter: nach draußen gehen 🌳',
  bowls: 'Enter: Milch und Futter hinstellen 🥛',
  fridge: 'Enter: Kühlschrank durchsuchen',
  cupboard: 'Enter: Küchenschrank durchsuchen',
  stove: 'Enter: am Herd kochen 🍳',
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
  stove: 'Herd',
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
    ['Enter', 'streicheln · benutzen · aufheben'],
    ['N', 'Katze hochnehmen / absetzen'],
    ['R', 'Katze in den Rucksack 🎒'],
    ['1 4', 'Napf mit Futter / Milch hinstellen'],
    ['2 3 5', 'Leckerli · Spielzeug werfen · Federwedel'],
    ['Z', 'zaubern ✨'],
    ['V', 'Verstecken spielen 🙈'],
    ['K M F', 'Laden · meine Katzen · meine Figur'],
    ['S T H', 'speichern · Ton · Hilfe aus'],
    ['Esc', 'Menü schließen'],
  ] as const,
  help: 'H: Hilfe',
  toyNames: { yarn: 'Wollknäuel', ball: 'Glöckchenball', mouse: 'Spielzeugmaus' } as Record<string, string>,
  prompt(f: Focus, carrying: boolean, meal: string | null = null): string {
    if (!f) return '';
    if (f.kind === 'cat')
      return f.cat.mood === 'carried'
        ? `Enter: ${f.cat.name} kuscheln 💕 · N: absetzen`
        : `Enter: ${f.cat.name} streicheln 💕${carrying ? '' : ' · N: hochnehmen'}`;
    if (f.kind === 'door') return DOOR_ACTIONS[f.building.id];
    if (f.kind === 'toy') return `Enter: ${TEXT.toyNames[f.toy.kind] ?? 'Spielzeug'} aufheben`;
    if (f.spot.id === 'table' && meal) {
      const r = recipe(meal);
      if (r) return `Enter: ${r.name} ${r.drink ? 'trinken' : 'essen'} ${r.icon}`;
    }
    return SPOT_ACTIONS[f.spot.id];
  },
  noSupply: (s: Supply) =>
    ({ food: 'Kein Katzenfutter mehr', treat: 'Keine Leckerli mehr', milk: 'Keine Milch mehr' })[s] + ' — im Katzenladen (K) gibt es neues!',
  noToy: (reason: 'none' | 'lying') =>
    reason === 'none'
      ? 'Du hast noch kein Spielzeug. Im Katzenladen (K) gibt es welches!'
      : 'Deine Spielzeuge liegen alle auf dem Boden — geh hin und heb sie mit Enter auf.',
  noBackpack: 'Du hast keinen Rucksack an. Kauf einen im Katzenladen (K) und zieh ihn an!',
  backpackFull: 'Der Rucksack ist voll — drei Katzen passen hinein.',
  backpackIn: (name: string) => `${name} sitzt jetzt im Rucksack! 🎒`,
  squabble: (a: string, b: string) => `${a} und ${b} streiten sich ums Futter! 😾`,
  seekStart: 'Augen zu! Die Katzen verstecken sich … 1, 2, 3 …',
  seekGo: 'Ich komme! Such die Katzen hinter den Büschen! 🙈',
  seekFound: (name: string, left: number) => (left === 0 ? `${name} gefunden!` : `${name} gefunden! Noch ${left} versteckt.`),
  seekDone: (coins: number) => `Alle gefunden! 🎉 Du bekommst ${coins} Münzen.`,
  seekStop: 'Verstecken beendet.',
  seekNoCats: 'Zum Verstecken müssen Katzen draußen im Garten sein.',
  seeking: (found: number, of: number) => `🙈 Verstecken: ${found} von ${of} gefunden`,
  cooked: (id: string) =>
    recipe(id)?.drink ? `${recipe(id)?.name} steht auf dem Tisch! Zum Wohl! 🥤` : `${recipe(id)?.name ?? 'Essen'} steht auf dem Tisch! Guten Appetit! 🍽️`,
  meal: (id: string, ok: boolean) =>
    ok
      ? `${recipe(id)?.drink ? 'Mmh, was für ein' : 'Lecker,'} ${recipe(id)?.name ?? 'das Essen'}! 😋 Jetzt kannst du eine Minute lang doppelt so hoch fliegen!`
      : 'Ohne Besteck geht das nicht — kauf Besteck im Katzenladen (K)! 🍴',
  groceries: {
    tomato: 'Tomate',
    leek: 'Lauch',
    egg: 'Ei',
    bread: 'Brot',
    cheese: 'Käse',
    apple: 'Apfel',
    dairy: 'Milch',
    cocoa: 'Kakaopulver',
    orange: 'Orange',
  } satisfies Record<Grocery, string>,
  gearNames: { backpack: 'Rucksack', pan: 'Bratpfanne', pot: 'Kochtopf', cutlery: 'Besteck' } satisfies Record<Gear, string>,
  searched: (spot: SpotId, found: number) =>
    found === 0
      ? `Im ${SPOT_NAMES[spot]} ist gerade nichts. Später nochmal schauen!`
      : `${found === 1 ? 'Eine Münze' : `${found} Münzen`} im ${SPOT_NAMES[spot]} gefunden! 🪙`,
  bowls(milk: boolean, food: boolean, noFood: boolean): string {
    if (food) return 'Milch und Futter stehen bereit! Die Katzen kommen gleich. 🥛🥫';
    if (noFood) return milk ? 'Milch steht bereit! 🥛 Futter gibt es im Katzenladen (K).' : 'Kein Futter mehr — kauf welches im Katzenladen (K).';
    return milk ? 'Milch steht bereit! 🥛' : 'Die Schüsseln sind schon voll.';
  },
  coinFaster: (perCoin: number) =>
    perCoin === 1
      ? 'Deine Katzen sind überglücklich! Jetzt gibt es für jedes Herz eine Münze. 💖🪙'
      : `Deine Katzen sind so glücklich! Jetzt gibt es schon alle ${perCoin} Herzen eine Münze. 💖🪙`,
  kitten: (name: string) => `Ein Katzenbaby ist da! Es heißt ${name}. 🍼🐱`,
  newCat: (name: string) => `${name} wohnt jetzt bei dir! 🎉`,
  saved: 'Gespeichert! 💾 Beim nächsten Mal geht es genau hier weiter.',
  supplies: {
    food: 'Futter',
    treat: 'Leckerli',
    yarn: 'Wollknäuel',
    milk: 'Milch',
    toys: 'Spielzeug',
    feather: 'Federwedel',
    backpack: 'Rucksack',
  },
  shop: {
    title: '🛍️ Katzenladen',
    wardrobeTitle: '👗 Anziehschrank',
    close: 'Schließen (Esc)',
    tabClothes: '👗 Kleidung',
    tabCats: '🐱 Für Katzen',
    tabDeco: '🏠 Deko',
    tabKitchen: '🍅 Küche',
    takeOff: 'Ausziehen',
    kitchenHint:
      'In der Küche am Herd kannst du kochen: Spiegelei, Omelett, Lauchsuppe, Tomatensalat, Käsebrot und Apfelschnitze — und zum Trinken Kakao und Orangensaft. Danach am Tisch essen und trinken!',
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
      'Tipp: 1 stellt einen Napf mit Futter hin, 4 einen Napf mit Milch — die Katzen kommen angerannt! 2 gibt der Katze neben dir ein Leckerli. 3 wirft ein Spielzeug, 5 wedelt mit dem Federwedel, R steckt die Katze auf deinem Arm in den Rucksack.',
    newCat: 'Neue Katze',
    newCatDesc: 'Eine neue Katze zieht bei dir ein',
    tooManyCats: 'Mehr Katzen passen gerade nicht ins Haus.',
  },
  school: {
    title: '✏️ Schule',
    close: 'Schließen (Esc)',
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
  cook: {
    title: '🍳 Kochen',
    close: 'Fertig (Esc)',
    cook: 'Kochen',
    hint: 'Zutaten und Küchensachen gibt es im Katzenladen (K) unter „Küche“. Essen und Trinken kommen auf den Tisch — dort mit Enter essen oder trinken.',
    busy: 'Auf dem Tisch steht schon ein Essen. Iss es zuerst auf!',
    missing: 'Dafür fehlt noch etwas — schau im Katzenladen (K) unter „Küche“.',
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
    grown: (percent: number) => `vom Streicheln und Füttern ${percent} % größer geworden 🌱`,
    love: (n: number) => `${n} Herzen bekommen`,
    where: (house: boolean) => (house ? 'im Haus 🏠' : 'im Garten 🌳'),
  },
};
