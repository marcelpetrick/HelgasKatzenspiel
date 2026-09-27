// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import './ui/styles.css';
import { App } from './app';

const canvas = document.querySelector<HTMLCanvasElement>('#stage');
const ui = document.querySelector<HTMLElement>('#ui');
if (!canvas || !ui) throw new Error('index.html is missing #stage or #ui');
const app = new App(canvas, ui);

/** Hook for automated browser tests and screenshots. */
(window as unknown as { __katzen: unknown }).__katzen = {
  app,
  start: () => {
    app.start(ui);
  },
};
