// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Game } from '../core/game';
import { restore, snapshot } from '../core/save';

const KEY = 'helgas-katzenspiel/save';
/** Before whole-game saves existed only the wardrobe was kept; it is still picked up. */
const OLD_KEY = 'helgas-katzenspiel/wardrobe';
/** Where the tabs of this game tell each other which one is playing. */
const CHANNEL = 'helgas-katzenspiel/tabs';
const CLAIM_LOCK = 'helgas-katzenspiel/claim';
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

/** Raw save revision, captured before loading so a later handoff can detect a newer save. */
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

/**
 * Only one tab may keep the game, or two tabs would keep overwriting each other with their own state and
 * a "Neues Spiel" in one would be undone by the other. The tab that starts playing last takes over: the
 * others hear it, or see the save being forgotten, and `onElsewhere` tells them to stop saving.
 */
export type ClaimResult = 'fresh' | 'updated' | 'denied';

/** Hand over the latest save before the next tab builds its game from it. */
export function guardTabs(onElsewhere: (reason: 'claim' | 'reset' | 'leave') => boolean): { claim: (loadedRevision: string) => Promise<ClaimResult> } {
  const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL);
  let playing = false;
  let stopped = false;
  let releasePlay: (() => void) | null = null;
  let pending: { id: string; abort: AbortController } | null = null;
  if (channel)
    channel.onmessage = (event: MessageEvent<unknown>) => {
      const message = event.data;
      if (typeof message !== 'object' || message === null || !('type' in message)) return;
      if (message.type === 'claim' && 'id' in message && typeof message.id === 'string' && playing) {
        const saved = onElsewhere('claim');
        if (saved) releasePlay?.();
        else channel.postMessage({ type: 'denied', to: message.id });
      } else if (message.type === 'denied' && 'to' in message && message.to === pending?.id) {
        pending?.abort.abort();
      }
    };
  window.addEventListener('storage', (e) => {
    // A null key means all of the storage was cleared.
    if ((e.key === KEY || e.key === null) && e.newValue === null) {
      stopped = true;
      pending?.abort.abort();
      pending = null;
      onElsewhere('reset');
      releasePlay?.();
    }
  });
  window.addEventListener('pagehide', () => {
    stopped = true;
    pending?.abort.abort();
    if (playing) onElsewhere('leave');
    releasePlay?.();
  });
  // A page restored from the back/forward cache no longer owns the play lock.
  window.addEventListener('pageshow', () => {
    if (stopped) window.location.reload();
  });

  const acquirePlay = (signal: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
      void navigator.locks
        .request(PLAY_LOCK, { signal }, async () => {
          await new Promise<void>((release) => {
            playing = true;
            releasePlay = () => {
              playing = false;
              releasePlay = null;
              release();
            };
            resolve();
          });
        })
        .catch(reject);
    });

  return {
    claim: (loadedRevision) => {
      if (stopped) return Promise.resolve('denied');
      if (playing) return Promise.resolve('fresh');
      if (!channel || !Reflect.has(navigator, 'locks')) {
        channel?.postMessage({ type: 'claim', id: `${Date.now()}-${Math.random()}` });
        playing = true;
        return Promise.resolve(saveRevision() === loadedRevision ? 'fresh' : 'updated');
      }
      return navigator.locks.request(CLAIM_LOCK, async () => {
        if (stopped) return 'denied';
        const id = `${Date.now()}-${Math.random()}`;
        const abort = new AbortController();
        pending = { id, abort };
        channel.postMessage({ type: 'claim', id });
        try {
          await acquirePlay(abort.signal);
        } catch {
          pending = null;
          return 'denied';
        }
        pending = null;
        // A reset or pagehide can happen while the lock request is pending.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (stopped) {
          releasePlay?.();
          return 'denied';
        }
        return saveRevision() === loadedRevision ? 'fresh' : 'updated';
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
