// SPDX-FileCopyrightText: 2026 Marcel Petrick <mail@marcelpetrick.it>
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * Cute sound effects, synthesised with the Web Audio API — no sound files. Every sound is a few
 * oscillators or a burst of noise with an envelope. The audio context starts on the first key press
 * or click, because browsers do not allow sound before the player has done something.
 */

type Wave = OscillatorType;

export type SoundName =
  | 'meow'
  | 'purr'
  | 'heart'
  | 'coin'
  | 'magic'
  | 'jump'
  | 'land'
  | 'twinkle'
  | 'door'
  | 'shopBell'
  | 'buy'
  | 'nope'
  | 'eat'
  | 'pour'
  | 'pickUp'
  | 'putDown'
  | 'kitten'
  | 'found'
  | 'empty'
  | 'throw'
  | 'save'
  | 'click';

export class Sound {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  muted = false;

  /** Create the audio context; call from a key or click handler. Safe to call often. */
  unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    try {
      this.ctx = new AudioContext();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate;
    this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
    return this.muted;
  }

  /** One note: a wave gliding from `f0` to `f1`, with a quick attack and a soft decay. */
  private tone(wave: Wave, f0: number, f1: number, at: number, length: number, volume: number, filter?: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = wave;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + Math.min(0.02, length / 4));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    let out: AudioNode = osc;
    if (filter) {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = filter;
      osc.connect(lp);
      out = lp;
    }
    out.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }

  /** A burst of filtered noise, for whooshes and pours. */
  private hiss(at: number, length: number, volume: number, from: number, to: number, type: BiquadFilterType = 'bandpass'): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.noise) return;
    const t = ctx.currentTime + at;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.Q.value = 1.5;
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + length * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t);
    src.stop(t + length + 0.05);
  }

  /** "Miau": a voice that rises and falls, shaped by a sweeping formant filter. */
  private meow(at: number, pitch: number, length = 0.42): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(pitch * 0.9, t);
    osc.frequency.linearRampToValueAtTime(pitch * 1.35, t + length * 0.35);
    osc.frequency.linearRampToValueAtTime(pitch * 0.8, t + length);
    const formant = ctx.createBiquadFilter();
    formant.type = 'bandpass';
    formant.Q.value = 4;
    formant.frequency.setValueAtTime(900, t);
    formant.frequency.linearRampToValueAtTime(2200, t + length * 0.35);
    formant.frequency.linearRampToValueAtTime(1100, t + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.5, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(formant).connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }

  /** A soft purr: a low buzz pulsing about 25 times a second. */
  private purr(at: number, length: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + at;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 55;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    const pulse = ctx.createGain();
    pulse.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 24;
    const depth = ctx.createGain();
    depth.gain.value = 0.5;
    lfo.connect(depth).connect(pulse.gain);
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(0.35, t + 0.15);
    env.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(lp).connect(pulse).connect(env).connect(this.master);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + length + 0.05);
    lfo.stop(t + length + 0.05);
  }

  private notes(freqs: readonly number[], step: number, wave: Wave, length: number, volume: number): void {
    freqs.forEach((f, i) => {
      this.tone(wave, f, f, i * step, length, volume);
    });
  }

  play(name: SoundName): void {
    if (!this.ctx || this.muted) return;
    const r = Math.random();
    switch (name) {
      case 'meow':
        this.meow(0, 520 + r * 180);
        break;
      case 'purr':
        this.purr(0, 1.1);
        break;
      case 'heart':
        this.tone('sine', 880 + r * 200, 1500 + r * 200, 0, 0.14, 0.18);
        break;
      case 'coin':
        this.tone('square', 988, 988, 0, 0.08, 0.1, 3000);
        this.tone('square', 1319, 1319, 0.07, 0.35, 0.1, 3000);
        break;
      case 'magic': {
        const scale = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637];
        scale.forEach((f, i) => {
          this.tone(i % 2 ? 'sine' : 'triangle', f, f * 1.01, i * 0.05, 0.4, 0.12);
        });
        this.hiss(0, 0.6, 0.05, 4000, 9000, 'highpass');
        break;
      }
      case 'jump':
        this.tone('sine', 280, 620, 0, 0.18, 0.25);
        break;
      case 'land':
        this.tone('sine', 160, 70, 0, 0.12, 0.2);
        break;
      case 'twinkle':
        this.tone('sine', 1800 + r * 1400, 2600 + r * 800, 0, 0.18, 0.05);
        break;
      case 'door':
        this.tone('sine', 659, 659, 0, 0.7, 0.2);
        this.tone('sine', 523, 523, 0.35, 0.9, 0.2);
        break;
      case 'shopBell':
        this.notes([1568, 2093, 2637], 0.07, 'triangle', 0.5, 0.14);
        break;
      case 'buy':
        this.hiss(0, 0.12, 0.12, 3000, 6000);
        this.notes([1319, 1760, 2637], 0.06, 'square', 0.25, 0.07);
        break;
      case 'nope':
        this.tone('triangle', 330, 300, 0, 0.18, 0.15);
        this.tone('triangle', 262, 240, 0.16, 0.25, 0.15);
        break;
      case 'eat':
        for (let i = 0; i < 3; i++) this.tone('square', 190 + i * 15, 120, i * 0.16, 0.1, 0.12, 700);
        break;
      case 'pour':
        this.hiss(0, 0.7, 0.12, 700, 2400);
        break;
      case 'pickUp':
        this.tone('sine', 500, 1000, 0, 0.2, 0.2);
        this.meow(0.12, 750, 0.3);
        break;
      case 'putDown':
        this.tone('sine', 900, 450, 0, 0.2, 0.18);
        break;
      case 'kitten':
        this.meow(0, 950, 0.3);
        this.meow(0.35, 1050, 0.25);
        this.notes([1047, 1319, 1568, 2093], 0.12, 'sine', 0.6, 0.1);
        break;
      case 'found':
        this.notes([988, 1319, 1976], 0.08, 'square', 0.25, 0.08);
        break;
      case 'empty':
        this.tone('sine', 440, 330, 0, 0.25, 0.12);
        break;
      case 'throw':
        this.hiss(0, 0.35, 0.15, 500, 3000);
        break;
      case 'save':
        this.notes([523, 659, 784, 1047], 0.1, 'triangle', 0.4, 0.15);
        break;
      case 'click':
        this.tone('sine', 1200, 900, 0, 0.05, 0.08);
        break;
    }
  }
}
