// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

import { afterEach, describe, expect, it, vi } from 'vitest';
import { SchoolMenu } from '../src/ui/schoolMenu';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('school menu keyboard answers', () => {
  it('cannot activate a detached answer after the classroom is closed', () => {
    const click = vi.fn();
    const button = { disabled: false, click } as unknown as HTMLButtonElement;
    const remove = vi.fn();
    const clearTimeout = vi.fn();
    vi.stubGlobal('window', { clearTimeout });
    const menu = Object.create(SchoolMenu.prototype) as SchoolMenu;
    Object.assign(menu, {
      answers: [button],
      nextTimer: 42,
      root: { classList: { remove } },
    });

    menu.key('Digit1');
    expect(click).toHaveBeenCalledOnce();

    menu.close();
    menu.isOpen = true; // The class picker is now open again, with no answer buttons.
    menu.key('Digit1');
    expect(click).toHaveBeenCalledOnce();
    expect(clearTimeout).toHaveBeenCalledWith(42);
    expect(remove).toHaveBeenCalledWith('open');
  });
});
