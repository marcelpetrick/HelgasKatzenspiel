// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Game } from '../core/game';
import { restore, snapshot } from '../core/save';

const KEY = 'helgas-katzenspiel/save';
/** Before whole-game saves existed only the wardrobe was kept; it is still picked up. */
const OLD_KEY = 'helgas-katzenspiel/wardrobe';

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

/** Is there a saved game in this browser? */
export function hasSave(): boolean {
  return read(KEY) !== null || read(OLD_KEY) !== null;
}

/** The saved game from this browser, or a fresh one. Storage may be blocked; that is fine. */
export function loadGame(): Game {
  const saved = read(KEY);
  if (saved !== null) return restore(saved);
  const wardrobe = read(OLD_KEY);
  return restore(wardrobe === null ? null : { wardrobe });
}

/** Save the whole game; false when the browser refuses (e.g. a private window). */
export function saveGame(game: Game): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot(game)));
    return true;
  } catch {
    return false;
  }
}

/** Forget the saved game, for "Neues Spiel". */
export function clearSave(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(OLD_KEY);
  } catch {
    // Nothing stored, nothing to forget.
  }
}
