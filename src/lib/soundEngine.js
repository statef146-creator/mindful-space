/* =========================================================
   Soothing sounds synthesised live with the Web Audio API.
   No mp3 files to 404 — rain, ocean, wind, om and noise are
   generated from filtered noise + slow LFOs, so they always
   play (and loop forever) as long as the tab is open.
   ========================================================= */
function noiseSource(ctx, type) {
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  if (type === 'white') {
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  } else if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
  } else { // pink (Paul Kellet approximation)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759;
      b2 = 0.96900 * b2 + w * 0.1538520; b3 = 0.86650 * b3 + w * 0.3104856;
      b4 = 0.55000 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.0168980;
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
      b6 = w * 0.115926;
    }
  }
  const src = ctx.createBufferSource();
  src.buffer = buf; src.loop = true;
  return src;
}
const filter = (ctx, type, freq, q = 1) => {
  const f = ctx.createBiquadFilter();
  f.type = type; f.frequency.value = freq; f.Q.value = q;
  return f;
};
const lfo = (ctx, rate, depth, target) => {
  const o = ctx.createOscillator(); o.frequency.value = rate;
  const g = ctx.createGain(); g.gain.value = depth;
  o.connect(g); g.connect(target); o.start();
  return o;
};

export const SFX = {
  rain: {
    em: '🌧️', name: 'Soft Rain', desc: 'gentle steady rainfall', vol: 0.45,
    build(ctx, out) {
      const s = noiseSource(ctx, 'white');
      const lp = filter(ctx, 'lowpass', 1100), hp = filter(ctx, 'highpass', 250);
      s.connect(lp); lp.connect(hp); hp.connect(out); s.start();
      return { stop: () => s.stop() };
    },
  },
  ocean: {
    em: '🌊', name: 'Ocean Waves', desc: 'slow rolling surf', vol: 0.5,
    build(ctx, out) {
      const s = noiseSource(ctx, 'brown');
      const lp = filter(ctx, 'lowpass', 520);
      s.connect(lp); lp.connect(out);
      const l = lfo(ctx, 0.08, 0.3, out.gain); s.start();
      return { stop: () => { s.stop(); l.stop(); } };
    },
  },
  wind: {
    em: '🍃', name: 'Forest Wind', desc: 'wind drifting through trees', vol: 0.5,
    build(ctx, out) {
      const s = noiseSource(ctx, 'pink');
      const bp = filter(ctx, 'bandpass', 550, 0.6);
      s.connect(bp); bp.connect(out);
      const l = lfo(ctx, 0.09, 280, bp.frequency); s.start();
      return { stop: () => { s.stop(); l.stop(); } };
    },
  },
  om: {
    em: '🕉️', name: 'Om Drone', desc: 'warm meditative hum', vol: 0.32,
    build(ctx, out) {
      const oscs = [[96, 0.5], [144, 0.28], [192, 0.16]].map(([f, g]) => {
        const o = ctx.createOscillator(); o.frequency.value = f;
        const og = ctx.createGain(); og.gain.value = g;
        o.connect(og); og.connect(out); o.start(); return o;
      });
      const l = lfo(ctx, 0.12, 0.08, out.gain);
      return { stop: () => { oscs.forEach((o) => o.stop()); l.stop(); } };
    },
  },
  white: {
    em: '☁️', name: 'White Noise', desc: 'pure even hush', vol: 0.16,
    build(ctx, out) {
      const s = noiseSource(ctx, 'white');
      s.connect(out); s.start();
      return { stop: () => s.stop() };
    },
  },
  deep: {
    em: '🌙', name: 'Deep Rest', desc: 'low warm blanket of sound', vol: 0.5,
    build(ctx, out) {
      const s = noiseSource(ctx, 'brown');
      const lp = filter(ctx, 'lowpass', 320);
      s.connect(lp); lp.connect(out); s.start();
      return { stop: () => s.stop() };
    },
  },
};

class Engine {
  constructor() { this.ctx = null; this.master = null; this.nodes = null; this.current = null; }
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  play(name, vol) {
    this.stop();
    this.ensure();                       // created on a user gesture → autoplay-safe
    const out = this.ctx.createGain();
    out.gain.value = vol != null ? vol : SFX[name].vol;
    out.connect(this.master);
    const handle = SFX[name].build(this.ctx, out);
    this.nodes = { out, handle };
    this.current = name;
  }
  setVol(v) { if (this.nodes) this.nodes.out.gain.setTargetAtTime(v, this.ctx.currentTime, 0.05); }
  stop() {
    if (!this.nodes) return;
    try { this.nodes.handle.stop(); } catch { /* already stopped */ }
    try { this.nodes.out.disconnect(); } catch { /* noop */ }
    this.nodes = null; this.current = null;
  }
}
export const sound = new Engine();