// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Game } from '../core/game';
import { restore, snapshot } from '../core/save';

const KEY = 'helgas-katzenspiel/save';
/** Before whole-game saves existed only the wardrobe was kept; it is still picked up. */
const OLD_KEY = 'helgas-katzenspiel/wardrobe';
const PLAY_LOCK = 'helgas-katzenspiel/playing';

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

/** Raw save revision, captured before loading so a later start can detect a newer save. */
export function saveRevision(): string {
  try {
    return `${localStorage.getItem(KEY) ?? ''}\u0000${localStorage.getItem(OLD_KEY) ?? ''}`;
  } catch {
    return '';
  }
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

export type ClaimResult = 'fresh' | 'updated' | 'busy' | 'unavailable';

/** Keep the exclusive play lock until this page leaves. Another tab gets an immediate busy result. */
export function guardTabs(onLeave: () => void): { claim: (loadedRevision: string) => Promise<ClaimResult> } {
  let playing = false;
  let stopped = false;
  let releasePlay: (() => void) | null = null;

  window.addEventListener('pagehide', () => {
    stopped = true;
    if (playing) onLeave();
    releasePlay?.();
  });
  // A page restored from the back/forward cache must reload before it may play again.
  window.addEventListener('pageshow', () => {
    if (stopped) window.location.reload();
  });

  return {
    claim: (loadedRevision) => {
      if (stopped) return Promise.resolve('busy');
      if (playing) return Promise.resolve(saveRevision() === loadedRevision ? 'fresh' : 'updated');
      if (!Reflect.has(navigator, 'locks')) return Promise.resolve('unavailable');

      return new Promise<ClaimResult>((resolve) => {
        void navigator.locks
          .request(PLAY_LOCK, { ifAvailable: true }, async (lock) => {
            if (!lock || stopped) {
              resolve('busy');
              return;
            }
            await new Promise<void>((release) => {
              playing = true;
              releasePlay = () => {
                playing = false;
                releasePlay = null;
                release();
              };
              resolve(saveRevision() === loadedRevision ? 'fresh' : 'updated');
            });
          })
          .catch(() => {
            resolve('unavailable');
          });
      });
    },
  };
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
