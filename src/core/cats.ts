// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/** How cats can look: coat colours, sizes and names. Chosen in the "Meine Katzen" editor. */

export interface Coat {
  id: string;
  name: string;
  fur: string;
  /** Belly, muzzle and paws. */
  patch: string;
  /** A second patch colour for calico-style coats. */
  spots?: string;
  eye: string;
}

export const COATS: readonly Coat[] = [
  { id: 'orange', name: 'Orange', fur: '#f5a54a', patch: '#ffe2b8', eye: '#6fcf5f' },
  { id: 'grau', name: 'Grau', fur: '#9ea6b3', patch: '#dfe3ea', eye: '#ffc93c' },
  { id: 'schwarz', name: 'Schwarz', fur: '#34303a', patch: '#4a4552', eye: '#ffd23f' },
  { id: 'weiss', name: 'Weiß', fur: '#f7f4ef', patch: '#ffd9e4', eye: '#4fb3ff' },
  { id: 'creme', name: 'Creme', fur: '#f1d9b0', patch: '#fff3dc', eye: '#7ad07a' },
  { id: 'dreifarbig', name: 'Dreifarbig', fur: '#fbf7f0', patch: '#f09a3e', spots: '#3a3438', eye: '#8fd35a' },
  { id: 'gruen', name: 'Grün', fur: '#6fd36a', patch: '#d8f7c8', eye: '#ffde59' },
  { id: 'blau', name: 'Blau', fur: '#5ea8ff', patch: '#d6e9ff', eye: '#ffe066' },
  { id: 'lila', name: 'Lila', fur: '#b388ff', patch: '#eadcff', eye: '#7cf0c0' },
  { id: 'rosa', name: 'Rosa', fur: '#ff9fc6', patch: '#ffe0ee', eye: '#5ec8ff' },
  { id: 'tuerkis', name: 'Türkis', fur: '#3fd0d4', patch: '#d3f8f8', eye: '#ff9fc6' },
  { id: 'gold', name: 'Gold', fur: '#ffc83d', patch: '#fff0b8', eye: '#56b0ff' },
];

export const MIN_SIZE = 0.6;
export const MAX_SIZE = 1.6;
export const MAX_NAME_LENGTH = 16;

export const SIZE_NAMES: readonly { upTo: number; name: string }[] = [
  { upTo: 0.75, name: 'winzig' },
  { upTo: 0.95, name: 'klein' },
  { upTo: 1.15, name: 'mittel' },
  { upTo: 1.4, name: 'groß' },
  { upTo: Infinity, name: 'riesig' },
];

export function coat(id: string): Coat {
  return COATS.find((c) => c.id === id) ?? COATS[0];
}

export function sizeName(size: number): string {
  return (SIZE_NAMES.find((s) => size <= s.upTo) ?? SIZE_NAMES[SIZE_NAMES.length - 1]).name;
}

export function clampSize(size: number): number {
  return Number.isFinite(size) ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, size)) : 1;
}

/** A tidy cat name: trimmed, not too long, and never empty. */
export function cleanName(name: string, fallback: string): string {
  const n = name.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH);
  return n.length > 0 ? n : fallback;
}

export const DEFAULT_NAMES = ['Mimi', 'Minka', 'Felix', 'Luna', 'Tiger', 'Schnurri', 'Moritz', 'Kitty', 'Flocke', 'Pünktchen', 'Samtpfote', 'Krümel'];
