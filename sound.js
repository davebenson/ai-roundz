// Generative sound effects: everything is synthesized with the Web Audio API
// (oscillators and filtered noise), no samples. Browsers only allow audio
// after a user gesture, so call sfx.unlock() from an input handler.
class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.last = {};   // name -> time of last play, for throttling
  }
  unlock() {
    if (!this.ctx) {
      const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!AC) return;
      const c = this.ctx = new AC();
      this.master = c.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      // A compressor keeps a pile of simultaneous explosions from clipping.
      const comp = c.createDynamicsCompressor();
      this.master.connect(comp);
      comp.connect(c.destination);
      // Two seconds of white noise, shared by every noise-based effect.
      this.noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const data = this.noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.5;
  }
  // True if `name` may play now; also rate-limits it to once per `minMs`.
  ok(name, minMs = 0) {
    if (!this.ctx || this.ctx.state !== 'running' || this.muted) return false;
    const now = performance.now();
    if (now - (this.last[name] ?? -Infinity) < minMs) return false;
    this.last[name] = now;
    return true;
  }

  // White noise with an exponential decay, optionally through a filter whose
  // cutoff sweeps from f0 to f1.
  noise(dur, { gain = 0.5, filter = null, f0 = 1000, f1 = f0, q = 1, at = 0 } = {}) {
    const c = this.ctx;
    const t = c.currentTime + at;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuf;
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    if (filter) {
      const f = c.createBiquadFilter();
      f.type = filter;
      f.Q.value = q;
      f.frequency.setValueAtTime(f0, t);
      f.frequency.exponentialRampToValueAtTime(f1, t + dur);
      src.connect(f);
      f.connect(g);
    } else {
      src.connect(g);
    }
    g.connect(this.master);
    src.start(t, Math.random() * 1.5);
    src.stop(t + dur);
  }
  // An oscillator gliding from f0 to f1 with an exponential decay.
  tone(type, f0, f1, dur, gain = 0.2, at = 0) {
    const c = this.ctx;
    const t = c.currentTime + at;
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t);
    osc.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(t + dur);
  }

  playerShot() {
    if (!this.ok('playerShot')) return;
    this.noise(0.12, { gain: 0.35 });
  }
  enemyShot() {
    if (!this.ok('enemyShot', 40)) return;
    this.tone('square', 700, 250, 0.12, 0.08);
  }
  bigShot() {
    if (!this.ok('bigShot', 40)) return;
    this.tone('sawtooth', 160, 60, 0.3, 0.2);
    this.noise(0.2, { gain: 0.2, filter: 'lowpass', f0: 800, f1: 100 });
  }
  explosion() {
    if (!this.ok('explosion', 60)) return;
    this.noise(0.4, { gain: 0.5, filter: 'lowpass', f0: 2500, f1: 150 });
  }
  bigExplosion() {
    if (!this.ok('bigExplosion', 100)) return;
    this.noise(0.9, { gain: 0.7, filter: 'lowpass', f0: 1800, f1: 60 });
    this.tone('sine', 120, 30, 0.8, 0.5);
  }
  playerDeath() {
    if (!this.ok('playerDeath', 100)) return;
    this.noise(1.0, { gain: 0.7, filter: 'lowpass', f0: 2000, f1: 60 });
    this.tone('sawtooth', 420, 50, 0.8, 0.25);
  }
  // A teleporter fading out (falling) or back in (rising).
  blink(appear) {
    if (!this.ok('blink', 30)) return;
    this.tone('sine', appear ? 300 : 1200, appear ? 1200 : 300, 0.15, 0.08);
  }
  // A boomerang launching: a short airy sweep.
  whoosh() {
    if (!this.ok('whoosh', 80)) return;
    this.noise(0.4, { gain: 0.2, filter: 'bandpass', f0: 400, f1: 1800, q: 3 });
  }
  pop() {
    if (!this.ok('pop', 40)) return;
    this.tone('sine', 900, 200, 0.1, 0.25);
    this.noise(0.06, { gain: 0.2, filter: 'bandpass', f0: 3000, f1: 1500, q: 2 });
  }
  // A sine note with an ADSR envelope. Times are in seconds; `s` is the
  // sustain level as a fraction of the peak, held for `hold` seconds.
  note(freq, { gain = 0.15, a = 0.01, d = 0.08, s = 0.5, hold = 0.12, r = 0.35 } = {}) {
    if (!this.ok('note' + freq, 80)) return;
    const c = this.ctx;
    const t = c.currentTime;
    const end = t + a + d + hold + r;
    const osc = c.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + a);                       // attack
    g.gain.linearRampToValueAtTime(gain * s, t + a + d);               // decay
    g.gain.setValueAtTime(gain * s, t + a + d + hold);                 // sustain
    g.gain.linearRampToValueAtTime(0, end);                            // release
    osc.connect(g);
    g.connect(this.master);
    osc.start(t);
    osc.stop(end);
  }
  shell() {
    if (!this.ok('shell', 50)) return;
    this.tone('triangle', 220, 80, 0.1, 0.12);
    this.noise(0.05, { gain: 0.15, filter: 'lowpass', f0: 1200, f1: 300 });
  }
  drip() {
    if (!this.ok('drip', 40)) return;
    this.tone('sine', 1400, 600, 0.06, 0.08);
  }
  cannon() {
    if (!this.ok('cannon', 40)) return;
    this.noise(0.25, { gain: 0.4, filter: 'lowpass', f0: 700, f1: 80 });
    this.tone('sine', 110, 40, 0.25, 0.3);
  }
  // A chain splitting in two.
  crack() {
    if (!this.ok('crack', 40)) return;
    this.noise(0.08, { gain: 0.35, filter: 'bandpass', f0: 2500, f1: 800, q: 3 });
    this.tone('triangle', 700, 300, 0.12, 0.12);
  }
  bump() {
    if (!this.ok('bump', 50)) return;
    this.tone('sine', 320, 140, 0.1, 0.2);
  }
  // Metallic clang: a few inharmonic partials with a quick decay.
  clang() {
    if (!this.ok('clang', 60)) return;
    this.tone('sine', 520, 510, 0.35, 0.2);
    this.tone('sine', 835, 825, 0.25, 0.12);
    this.tone('sine', 1370, 1350, 0.15, 0.08);
  }
  arpeggio(type, freqs, step, gain) {
    freqs.forEach((f, i) => this.tone(type, f, f * 0.99, 0.25, gain, i * step));
  }
  roundStart() {
    if (!this.ok('jingle')) return;
    this.arpeggio('triangle', [440, 554, 659], 0.1, 0.15);
  }
  win() {
    if (!this.ok('jingle')) return;
    this.arpeggio('triangle', [523, 659, 784, 1047], 0.12, 0.2);
  }
  gameOver() {
    if (!this.ok('jingle')) return;
    this.arpeggio('sawtooth', [392, 330, 262, 196], 0.25, 0.1);
  }
}

const sfx = new Sfx();
