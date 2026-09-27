// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/** How the girl herself looks: skin, hair, face. Chosen for free in the figure editor (F). */

export interface Choice<T extends string = string> {
  id: T;
  name: string;
}

export interface ColorChoice extends Choice {
  color: string;
}

export type HairStyle = 'zoepfe' | 'kurz' | 'lang' | 'pferdeschwanz' | 'dutt';
export type Eyes = 'rund' | 'glitzer' | 'froh';
export type Mouth = 'laecheln' | 'offen' | 'katze';

export interface Look {
  skin: string;
  hair: string;
  hairStyle: HairStyle;
  eyes: Eyes;
  mouth: Mouth;
  freckles: boolean;
}

export const SKINS: readonly ColorChoice[] = [
  { id: 'hell', name: 'Hell', color: '#ffe3d3' },
  { id: 'pfirsich', name: 'Pfirsich', color: '#ffd2b5' },
  { id: 'honig', name: 'Honig', color: '#e8b48a' },
  { id: 'karamell', name: 'Karamell', color: '#c98a5f' },
  { id: 'kakao', name: 'Kakao', color: '#8d5a3b' },
  { id: 'schoko', name: 'Schoko', color: '#5e3a26' },
];

export const HAIR_COLORS: readonly ColorChoice[] = [
  { id: 'braun', name: 'Braun', color: '#8a4b2a' },
  { id: 'dunkelbraun', name: 'Dunkelbraun', color: '#4a2a1a' },
  { id: 'blond', name: 'Blond', color: '#f2cf6b' },
  { id: 'rot', name: 'Rot', color: '#d2582a' },
  { id: 'schwarz', name: 'Schwarz', color: '#231c24' },
  { id: 'rosa', name: 'Rosa', color: '#ff8fc8' },
  { id: 'lila', name: 'Lila', color: '#9b6bff' },
  { id: 'blau', name: 'Blau', color: '#4aa3ff' },
];

export const HAIR_STYLES: readonly Choice<HairStyle>[] = [
  { id: 'zoepfe', name: 'Zöpfe' },
  { id: 'kurz', name: 'Kurz' },
  { id: 'lang', name: 'Lang' },
  { id: 'pferdeschwanz', name: 'Pferdeschwanz' },
  { id: 'dutt', name: 'Dutt' },
];

export const EYES: readonly Choice<Eyes>[] = [
  { id: 'rund', name: 'Kulleraugen' },
  { id: 'glitzer', name: 'Glitzeraugen' },
  { id: 'froh', name: 'Fröhlich' },
];

export const MOUTHS: readonly Choice<Mouth>[] = [
  { id: 'laecheln', name: 'Lächeln' },
  { id: 'offen', name: 'Staunen' },
  { id: 'katze', name: 'Katzenmund' },
];

export const DEFAULT_LOOK: Look = {
  skin: SKINS[1].color,
  hair: HAIR_COLORS[0].color,
  hairStyle: 'zoepfe',
  eyes: 'rund',
  mouth: 'laecheln',
  freckles: false,
};

const pick = <T extends string>(list: readonly Choice<T>[], v: unknown, fallback: T): T => list.find((c) => c.id === v)?.id ?? fallback;
const pickColor = (list: readonly ColorChoice[], v: unknown, fallback: string): string => list.find((c) => c.color === v)?.color ?? fallback;

/** A look from saved data, with anything unknown replaced by the default. */
export function cleanLook(raw: unknown): Look {
  const r = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  return {
    skin: pickColor(SKINS, r.skin, DEFAULT_LOOK.skin),
    hair: pickColor(HAIR_COLORS, r.hair, DEFAULT_LOOK.hair),
    hairStyle: pick(HAIR_STYLES, r.hairStyle, DEFAULT_LOOK.hairStyle),
    eyes: pick(EYES, r.eyes, DEFAULT_LOOK.eyes),
    mouth: pick(MOUTHS, r.mouth, DEFAULT_LOOK.mouth),
    freckles: r.freckles === true,
  };
}
