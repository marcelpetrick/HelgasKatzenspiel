// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/** Cooking at the stove: recipes from groceries, with a pan or a pot, eaten (or drunk) at the table. */

import type { Gear, Grocery, Wardrobe } from './shop';

export interface Recipe {
  id: string;
  name: string;
  icon: string;
  needs: Partial<Record<Grocery, number>>;
  /** The pan or the pot, if the dish is cooked at all. */
  tool: Gear | null;
  /** Soup and eggs are eaten with cutlery; bread and apples with the fingers. */
  cutlery: boolean;
  /** Colour of the food on the plate, or of the drink in the cup. */
  color: string;
  /** Drinks come in a cup and are drunk, not eaten. */
  drink?: boolean;
}

export const RECIPES: readonly Recipe[] = [
  { id: 'spiegelei', name: 'Spiegelei', icon: '🍳', needs: { egg: 1 }, tool: 'pan', cutlery: true, color: '#ffd23f' },
  { id: 'omelett', name: 'Gemüse-Omelett', icon: '🥚', needs: { egg: 2, tomato: 1, leek: 1 }, tool: 'pan', cutlery: true, color: '#ffe27a' },
  { id: 'lauchsuppe', name: 'Lauchsuppe', icon: '🍲', needs: { leek: 1, tomato: 1 }, tool: 'pot', cutlery: true, color: '#9ccf5a' },
  { id: 'tomatensalat', name: 'Tomatensalat', icon: '🥗', needs: { tomato: 2 }, tool: null, cutlery: true, color: '#ff5a4e' },
  { id: 'kaesebrot', name: 'Käsebrot', icon: '🥪', needs: { bread: 1, cheese: 1 }, tool: null, cutlery: false, color: '#e8b75a' },
  { id: 'obstteller', name: 'Apfelschnitze', icon: '🍎', needs: { apple: 1 }, tool: null, cutlery: false, color: '#ff6b6b' },
  { id: 'kakao', name: 'Heißer Kakao', icon: '☕', needs: { dairy: 1, cocoa: 1 }, tool: 'pot', cutlery: false, color: '#8b5a3c', drink: true },
  { id: 'orangensaft', name: 'Orangensaft', icon: '🧃', needs: { orange: 2 }, tool: null, cutlery: false, color: '#ffa531', drink: true },
];

export function recipe(id: string): Recipe | undefined {
  return RECIPES.find((r) => r.id === id);
}

/** What is still missing to cook this: groceries and tools. Empty means it can be cooked. */
export function missing(w: Wardrobe, r: Recipe): string[] {
  const out: string[] = [];
  for (const [g, n] of Object.entries(r.needs) as [Grocery, number][]) if (w.pantry[g] < n) out.push(g);
  if (r.tool && !w.gear.includes(r.tool)) out.push(r.tool);
  return out;
}

/** Use up the groceries for a recipe; false (and nothing used) when something is missing. */
export function cook(w: Wardrobe, r: Recipe): boolean {
  if (missing(w, r).length > 0) return false;
  for (const [g, n] of Object.entries(r.needs) as [Grocery, number][]) w.pantry[g] -= n;
  return true;
}

/** How long a good meal lets the girl fly twice as high. */
export const MEAL_BOOST_TIME = 60;
