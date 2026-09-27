// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { loadWardrobe, type Wardrobe } from '../core/shop';

const KEY = 'helgas-katzenspiel/wardrobe';

/** The saved wardrobe from this browser, or a fresh one. Storage may be blocked; that is fine. */
export function loadSaved(): Wardrobe {
  try {
    const raw = localStorage.getItem(KEY);
    return loadWardrobe(raw ? JSON.parse(raw) : null);
  } catch {
    return loadWardrobe(null);
  }
}

let last = '';

/** Write the wardrobe if anything changed since the last save. */
export function save(w: Wardrobe): void {
  const json = JSON.stringify(w);
  if (json === last) return;
  last = json;
  try {
    localStorage.setItem(KEY, json);
  } catch {
    // Private windows may refuse storage; the game simply does not remember then.
  }
}
