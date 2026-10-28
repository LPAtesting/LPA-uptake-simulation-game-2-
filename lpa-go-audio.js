// LPA GO! intro — sound. Lisa's voice-over (Chatterbox clips listed in assets/vo/manifest.json) played against
// the timeline, over procedural ambience beds and an original chiptune score, both rendered once at load, mixed per
// scene and ducked under her lines. The offline mixdown uses this same module, so the preview and the export match.
export const SR = 24000, LOOP = 24;
const XF = 1.5, DUR = LOOP + XF, N = Math.round(DUR * SR), BED_RMS = 0.03;

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
class Biquad {
  constructor(type, f, q) { this.x1 = this.x2 = this.y1 = this.y2 = 0; if (type) this.set(type, f, q); }
  set(type, f, q) {
    const w = 2 * Math.PI * Math.min(f, SR * 0.45) / SR, c = Math.cos(w), al = Math.sin(w) / (2 * (q || 0.707)), a0 = 1 + al;
    const b = type === 'lp' ? [(1 - c) / 2, 1 - c, (1 - c) / 2] : type === 'hp' ? [(1 + c) / 2, -(1 + c), (1 + c) / 2] : [al, 0, -al];
    this.b0 = b[0] / a0; this.b1 = b[1] / a0; this.b2 = b[2] / a0; this.a1 = -2 * c / a0; this.a2 = (1 - al) / a0;
    return this;
  }
  run(x) { const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2; this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y; return y; }
}
const bq = (type, f, q) => new Biquad(type, f, q);
function noise(r, kind) {
  if (kind === 'pink') { let b0 = 0, b1 = 0, b2 = 0; return () => { const w = r() * 2 - 1; b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913; return (b0 + b1 + b2 + w * 0.1848) * 0.2; }; }
  if (kind === 'brown') { let b = 0; return () => { b = (b + 0.02 * (r() * 2 - 1)) / 1.02; return b * 3.5; }; }
  return () => r() * 2 - 1;
}
// smooth random 0..1 over time
function slow(r, period) { const p = Array.from({ length: Math.ceil(DUR / period) + 3 }, () => r()); return t => { const x = t / period, i = Math.floor(x), k = (1 - Math.cos(Math.PI * (x - i))) / 2; return p[i] * (1 - k) + p[i + 1] * k; }; }
// Poisson event times
function times(r, rate, end, start) { const out = []; let t = (start || 0) - Math.log(1 - r()) / rate; while (t < end) { out.push(t); t -= Math.log(1 - r()) / rate; } return out; }
const ramp = a => (u, d) => Math.max(0, Math.min(1, u / a, (d - u) / a));
const hit = (a, k) => (u, d) => (u < a ? u / a : Math.exp(-(u - a) / k)) * Math.max(0, Math.min(1, (d - u) / 0.004));
// add a tone: f is Hz or u => Hz, env(u, d), harm = partial amplitudes [1st, 2nd, ...]
function tone(x, t0, d, f, env, harm) {
  const i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(x.length, Math.round((t0 + d) * SR)), H = harm || [1], fn = typeof f === 'function';
  let ph = 0;
  for (let i = i0; i < i1; i++) {
    const u = (i - i0) / SR; ph += 2 * Math.PI * (fn ? f(u) : f) / SR;
    let s = 0; for (let h = 0; h < H.length; h++) if (H[h]) s += H[h] * Math.sin(ph * (h + 1));
    x[i] += s * env(u, d);
  }
}
function burst(x, r, t0, d, filt, env, amp) {
  const n = noise(r), i0 = Math.max(0, Math.round(t0 * SR)), i1 = Math.min(x.length, Math.round((t0 + d) * SR));
  for (let i = i0; i < i1; i++) x[i] += filt.run(n()) * env((i - i0) / SR, d) * amp;
}
function filt(x, type, f, q) { const b = bq(type, f, q); for (let i = 0; i < x.length; i++) x[i] = b.run(x[i]); return x; }
function space(x, taps) { const y = Float32Array.from(x); for (const [ms, g] of taps) { const d = Math.round(ms * SR / 1000); for (let i = d; i < x.length; i++) y[i] += x[i - d] * g; } return y; }

const LAYERS = {
  air(r) {  // breeze
    const x = new Float32Array(N), n = noise(r, 'pink'), lp = bq('lp', 900), g = slow(r, 3.2);
    for (let i = 0; i < N; i++) x[i] = lp.run(n()) * (0.45 + 0.55 * g(i / SR));
    return x;
  },
  birds(r) {  // koel, spotted dove, sunbirds, bulbul
    const x = new Float32Array(N);
    [0.5 + r() * 3, 12.5 + r() * 3].forEach(s0 => {
      let f = 720 + r() * 120, t = s0, gap = 0.8; const n = 5 + Math.floor(r() * 3), a = 0.5 + r() * 0.3;
      for (let k = 0; k < n && t < DUR - 1; k++) {
        const F = f;
        tone(x, t, 0.11, u => F * (1 + 0.4 * u), ramp(0.015), [a, a * 0.25, a * 0.06]);
        tone(x, t + 0.16, 0.26, u => F * (1.2 + 0.85 * u), ramp(0.03), [a, a * 0.22, a * 0.05]);
        f *= 1.04; t += gap; gap *= 0.95;
      }
    });
    for (const t of times(r, 0.12, DUR - 2)) {
      const f = 470 + r() * 60, a = 0.22;
      tone(x, t, 0.22, u => f * (1 + 0.06 * Math.sin(Math.PI * u / 0.22)), ramp(0.04), [a, a * 0.1]);
      tone(x, t + 0.3, 0.45, f * 0.92, (u, d) => ramp(0.05)(u, d) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 22 * u)), [a, a * 0.1]);
      tone(x, t + 0.85, 0.3, f * 0.86, ramp(0.05), [a * 0.8, a * 0.08]);
    }
    for (const t of times(r, 0.3, DUR - 1)) {
      const k = 3 + Math.floor(r() * 6), base = 4200 + r() * 1800, up = r() < 0.5; let tt = t;
      for (let j = 0; j < k; j++) { const d = 0.035 + r() * 0.05, a = 0.1 + r() * 0.1; tone(x, tt, d, up ? u => base * (1 + 0.35 * u / d) : u => base * (1.3 - 0.35 * u / d), ramp(0.008), [a]); tt += 0.09 + r() * 0.06; }
    }
    for (const t of times(r, 0.14, DUR - 1.5)) {
      let tt = t; const k = 4 + Math.floor(r() * 3);
      for (let j = 0; j < k; j++) { const f0 = 1500 + r() * 1200, f1 = f0 * (0.8 + r() * 0.5), d = 0.07 + r() * 0.07; tone(x, tt, d, u => f0 + (f1 - f0) * u / d, ramp(0.012), [0.18, 0.03]); tt += d + 0.02 + r() * 0.05; }
    }
    filt(x, 'lp', 6500);
    return space(x, [[31, 0.28], [67, 0.16], [113, 0.08]]);
  },
  insects(r) {  // tropical cicadas
    const x = new Float32Array(N), n = noise(r);
    [[5200, 140, 7, 0], [4400, 95, 5, 0.35], [6100, 190, 8, 0]].forEach(([fc, am, q, steady]) => {
      const bp = bq('bp', fc * (0.95 + r() * 0.1), q), sw = []; let t = r() * 3;
      while (t < DUR) { const d = 3 + r() * 6; sw.push([t, d]); t += d + 1 + r() * 4; }
      for (let i = 0; i < N; i++) {
        const tt = i / SR; let e = steady;
        for (const [a, d] of sw) if (tt >= a && tt < a + d) { const u = (tt - a) / d; e = Math.max(e, Math.min(1, u * 4, (1 - u) * 3)); }
        x[i] += bp.run(n()) * e * (0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(2 * Math.PI * am * tt), 3));
      }
    });
    return x;
  },
  crickets(r) {  // night: crickets, a house gecko, frogs
    const x = new Float32Array(N);
    for (let c = 0; c < 4; c++) {
      const f = 4100 + r() * 900, p = 0.42 + r() * 0.45, k = 3 + Math.floor(r() * 2), a = 0.15 + r() * 0.3;
      let t = r() * p; while (t < DUR - 0.2) { for (let j = 0; j < k; j++) tone(x, t + j * 0.028, 0.016, f, (u, d) => Math.sin(Math.PI * u / d), [a, a * 0.08]); t += p * (0.94 + r() * 0.12); }
    }
    for (const t of times(r, 0.06, DUR - 2)) { const k = 5 + Math.floor(r() * 3), fc = 2300 + r() * 500; for (let j = 0; j < k; j++) burst(x, r, t + j * 0.15, 0.025, bq('bp', fc, 4), hit(0.001, 0.005), 0.9 * (1 - j / (k + 2))); }
    for (const t of times(r, 0.25, DUR - 1)) { const f = 330 + r() * 120; tone(x, t, 0.09, u => f * (1 - 0.6 * u / 0.09), (u, d) => ramp(0.01)(u, d) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 55 * u)), [0.12, 0.06, 0.03]); }
    filt(x, 'lp', 7000);
    return space(x, [[23, 0.2], [57, 0.12]]);
  },
  traffic(r) {  // distant road: rumble, cars passing, a motorbike
    const x = new Float32Array(N), b = noise(r, 'brown'), lp = bq('lp', 170), sw = slow(r, 4);
    for (let i = 0; i < N; i++) x[i] = lp.run(b()) * (0.55 + 0.45 * sw(i / SR));
    for (const t of times(r, 0.22, DUR - 3)) {
      const d = 3.5 + r() * 3.5, a = 0.5 + r() * 0.7, f0 = 650 + r() * 300, bp = new Biquad(), n = noise(r, 'pink'), i0 = Math.round(t * SR), i1 = Math.min(N, Math.round((t + d) * SR));
      for (let i = i0; i < i1; i++) { const u = (i - i0) / (i1 - i0); if ((i - i0) % 32 === 0) bp.set('bp', f0 * (1 - 0.45 * u), 1.2); x[i] += bp.run(n()) * a * Math.sin(Math.PI * u) ** 2; }
    }
    for (const t of times(r, 0.05, DUR - 6)) {
      const d = 5, i0 = Math.round(t * SR), i1 = Math.min(N, i0 + d * SR), lpm = bq('lp', 700); let ph = 0;
      for (let i = i0; i < i1; i++) { const u = (i - i0) / (d * SR); ph += 78 * (1 + 0.07 * Math.tanh((0.5 - u) * 8)) / SR; x[i] += lpm.run(2 * (ph % 1) - 1) * 0.18 * Math.sin(Math.PI * u) ** 2; }
    }
    return filt(x, 'lp', 1400);
  },
  murmur(r) {  // hawker-centre crowd: formant-filtered voices, far off
    const x = new Float32Array(N), V = [[700, 1200], [300, 2200], [500, 1750], [400, 850], [620, 1050], [350, 1950], [450, 1400]];
    for (let v = 0; v < 16; v++) {
      const fem = r() < 0.5, f0b = fem ? 175 + r() * 60 : 100 + r() * 35, amp = 0.25 + r() * 0.75, f1 = new Biquad(), f2 = new Biquad();
      let ph = 0, t = r() * 2;
      while (t < DUR) {
        const end = Math.min(DUR, t + 1 + r() * 2.5); let s = t, f0 = f0b * (0.9 + r() * 0.2);
        while (s < end) {
          const d = 0.13 + r() * 0.15, vw = V[Math.floor(r() * V.length)], i0 = Math.round(s * SR), i1 = Math.min(N, Math.round((s + d) * SR)), loud = 0.5 + r() * 0.5, fa = f0, fb = f0 * (0.92 + r() * 0.16);
          f1.set('bp', vw[0] * (fem ? 1.15 : 1), 6); f2.set('bp', vw[1] * (fem ? 1.12 : 1), 8);
          for (let i = i0; i < i1; i++) { const u = (i - i0) / Math.max(1, i1 - i0); ph += (fa + (fb - fa) * u) / SR; const src = 2 * (ph % 1) - 1; x[i] += (f1.run(src) + 0.55 * f2.run(src)) * Math.sin(Math.PI * u) * loud * amp; }
          f0 = fb; s += d + (r() < 0.2 ? 0.08 + r() * 0.12 : 0.01);
        }
        t = end + 0.35 + r() * 1.3;
      }
    }
    const n = noise(r, 'pink'), lp = bq('lp', 600); for (let i = 0; i < N; i++) x[i] += lp.run(n()) * 0.12;
    filt(x, 'lp', 2600); filt(x, 'hp', 140);
    return space(x, [[19, 0.4], [41, 0.3], [73, 0.22], [117, 0.14], [171, 0.08]]);
  },
  clatter(r) {  // crockery, trays, a cleaver, a wok
    const x = new Float32Array(N);
    const clink = (t, a) => { const k = 3 + Math.floor(r() * 2); for (let j = 0; j < k; j++) { const f = 2100 + r() * 4600, d = 0.04 + r() * 0.12, g = a / k * (1 + r()); tone(x, t, d * 5, f, hit(0.001, d), [g]); } };
    for (const t of times(r, 1.3, DUR - 0.7)) clink(t, 0.25 + r() * 0.35);
    for (const t of times(r, 0.7, DUR - 0.3)) { const f = 850 + r() * 600; tone(x, t, 0.2, f, hit(0.001, 0.035), [0.35, 0.1]); burst(x, r, t, 0.02, bq('hp', 1500), hit(0.0005, 0.004), 0.25); }
    for (const t of times(r, 0.09, DUR - 1.2)) for (let j = 0; j < 7; j++) clink(t + r() * 0.5, 0.5);
    for (const t of times(r, 0.1, DUR - 3)) {
      const k = 4 + Math.floor(r() * 5), gap = 0.28 + r() * 0.08;
      for (let j = 0; j < k; j++) { const tt = t + j * gap; tone(x, tt, 0.18, u => 160 * (1 - 0.3 * u / 0.18), hit(0.001, 0.04), [0.7]); burst(x, r, tt, 0.03, bq('hp', 1200), hit(0.0005, 0.008), 0.5); }
    }
    for (const t of times(r, 0.06, DUR - 3)) {
      const d = 1.5 + r(), hp = bq('hp', 2200), n = noise(r), i0 = Math.round(t * SR), i1 = Math.min(N, i0 + Math.round(d * SR));
      for (let i = i0; i < i1; i++) { const u = (i - i0) / (i1 - i0); x[i] += hp.run(n()) * (r() < 0.003 ? 3 : 0.35) * Math.min(1, u * 10, (1 - u) * 3) * 0.3; }
    }
    for (const t of times(r, 0.08, DUR - 1)) tone(x, t, 0.9, 690, hit(0.001, 0.2), [0.3, 0, 0.12, 0, 0.06]);
    filt(x, 'lp', 7500);
    return space(x, [[17, 0.35], [39, 0.25], [83, 0.15], [131, 0.08]]);
  },
  rain(r) {  // evening rain: hiss, drops, a gutter dripping
    const x = new Float32Array(N), n = noise(r), hp = bq('hp', 900), lp = bq('lp', 6500), b = noise(r, 'brown'), lpb = bq('lp', 260), g = slow(r, 5);
    for (let i = 0; i < N; i++) x[i] = lp.run(hp.run(n())) * 0.35 * (0.8 + 0.2 * g(i / SR)) + lpb.run(b()) * 0.25;
    for (const t of times(r, 70, DUR - 0.05)) { const f = 2500 + r() * 3500, a = 0.05 * -Math.log(1 - r() * 0.999); tone(x, t, 0.02, f, hit(0.0003, 0.003), [a]); }
    for (const t of times(r, 5, DUR - 0.05)) { const f = 1000 + r() * 1200, a = 0.1 + r() * 0.15; tone(x, t, 0.04, f, hit(0.0005, 0.007), [a]); }
    let t = r(); while (t < DUR - 0.1) { tone(x, t, 0.06, u => 700 * (1 + 12 * u), hit(0.002, 0.012), [0.12]); t += 0.85 + r() * 0.3; }
    return x;
  },
  train(r) {  // MRT carriage: rumble, wheels over joints, the inverter whine pulling away and braking
    const x = new Float32Array(N), b = noise(r, 'brown'), p = noise(r, 'pink'), w = noise(r), lpb = bq('lp', 120), lpp = bq('lp', 420), hpv = bq('hp', 1600);
    const speed = t => { const c = t % LOOP; return c < 7 ? c / 7 : c < 14 ? 1 : c < 20 ? 1 - (c - 14) / 6 : 0; };
    let ph = 0, ph2 = 0;
    for (let i = 0; i < N; i++) {
      const s = speed(i / SR), f = 170 + 900 * s * (0.75 + 0.25 * ((s * 3) % 1)); ph += f / SR; ph2 += 2 * f / SR;
      const whine = (Math.sin(2 * Math.PI * ph) * 0.03 + Math.sin(2 * Math.PI * ph2) * 0.012) * (s > 0.02 && s < 0.98 ? 1 : 0.3) * Math.min(1, s * 8);
      x[i] = lpb.run(b()) * (0.5 + 0.5 * s) + lpp.run(p()) * (0.15 + 0.2 * s) + hpv.run(w()) * 0.04 + whine;
    }
    let t = 0.3;
    while (t < DUR - 0.5) {
      const s = speed(t);
      if (s > 0.08) { for (const o of [0, 0.11]) { tone(x, t + o, 0.14, 85, hit(0.001, 0.035), [0.45 * s]); burst(x, r, t + o, 0.04, bq('bp', 700, 1.5), hit(0.0005, 0.01), 0.3 * s); } t += 0.62 / Math.max(0.25, s) * (0.95 + r() * 0.1); }
      else t += 0.25;
    }
    return x;
  },
  water(r) {  // jetty: lapping waves, slaps on the piles, bubbles, a bumboat far off
    const x = new Float32Array(N), p = noise(r, 'pink'), lp = bq('lp', 650), waves = [];
    let t = r(); while (t < DUR) { waves.push([t, 0.7 + r() * 0.5]); t += 2.1 + r() * 1.5; }
    for (let i = 0; i < N; i++) { const tt = i / SR; let e = 0.18; for (const [a, g] of waves) { const u = tt - a; if (u > 0 && u < 2.4) e += g * (u < 0.35 ? u / 0.35 : Math.exp(-(u - 0.35) / 0.6)); } x[i] = lp.run(p()) * e; }
    for (const [a, g] of waves) burst(x, r, a + 0.3, 0.3, bq('bp', 1100 + r() * 500, 1.3), hit(0.004, 0.07), 0.6 * g);
    for (const tt of times(r, 1.4, DUR - 0.1)) { const f = 450 + r() * 500, d = 0.03 + r() * 0.04; tone(x, tt, d, u => f * (1 + 1.6 * u / d), ramp(0.004), [0.12 + r() * 0.08]); }
    const bt = 4 + r() * 6, bd = 12, lpe = bq('lp', 260); let ph = 0;
    for (let i = Math.round(bt * SR); i < Math.min(N, Math.round((bt + bd) * SR)); i++) { const u = (i / SR - bt) / bd; ph += 52 / SR; x[i] += lpe.run((2 * (ph % 1) - 1) * (0.5 + 0.5 * Math.sin(2 * Math.PI * 7.5 * i / SR))) * 0.12 * Math.sin(Math.PI * u) ** 2; }
    return space(x, [[29, 0.2], [61, 0.1]]);
  },
  court(r) {  // sports court: dribbles, squeaks, shuttle hits, kicks, one whistle
    const x = new Float32Array(N);
    let t = r() * 2;
    while (t < DUR - 4) { const k = 4 + Math.floor(r() * 7), gp = 0.42 + r() * 0.12; for (let j = 0; j < k; j++) { const tt = t + j * gp; tone(x, tt, 0.35, u => 115 * (1 - 0.15 * u), hit(0.001, 0.06), [0.6, 0.12]); tone(x, tt, 0.5, 345, hit(0.001, 0.11), [0.12]); burst(x, r, tt, 0.02, bq('hp', 1800), hit(0.0003, 0.004), 0.25); } t += k * gp + 1.5 + r() * 3; }
    for (const tt of times(r, 0.35, DUR - 0.3)) { const f = 2000 + r() * 1500, d = 0.07 + r() * 0.07, dir = r() < 0.5 ? 1 : -1; tone(x, tt, d, u => f + dir * 420 * u / d + 60 * Math.sin(2 * Math.PI * 32 * u), ramp(0.01), [0.14, 0.04]); }
    let s = 2 + r() * 3;
    while (s < DUR - 3) { const k = 3 + Math.floor(r() * 6); for (let j = 0; j < k; j++) { const tt = s + j * (0.75 + r() * 0.2), fp = 3200 + r() * 300; burst(x, r, tt, 0.015, bq('hp', 2200), hit(0.0002, 0.003), 0.35); tone(x, tt, 0.1, fp, hit(0.0005, 0.02), [0.08]); } s += k * 0.85 + 3 + r() * 4; }
    for (const tt of times(r, 0.15, DUR - 0.5)) { tone(x, tt, 0.45, u => 75 * (1 - 0.2 * u), hit(0.001, 0.09), [0.55, 0.15]); burst(x, r, tt, 0.04, bq('bp', 900, 1), hit(0.0005, 0.012), 0.35); }
    tone(x, 6 + r() * 10, 0.65, u => 2950 + 120 * Math.sin(2 * Math.PI * 28 * u), ramp(0.03), [0.1, 0.02]);
    filt(x, 'lp', 7000);
    return space(x, [[41, 0.22], [97, 0.12]]);
  },
  room(r) {  // indoors: ceiling fan, the town faint through the window
    const x = new Float32Array(N), p = noise(r, 'pink'), lp = bq('lp', 480), b = noise(r, 'brown'), lpb = bq('lp', 140);
    for (let i = 0; i < N; i++) { const t = i / SR; x[i] = lp.run(p()) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 2.5 * t)) * 0.8 + Math.sin(2 * Math.PI * 100 * t) * 0.018 + Math.sin(2 * Math.PI * 150 * t) * 0.008 + lpb.run(b()) * 0.25; }
    return x;
  }
};
export const BEDS = Object.keys(LAYERS);
// relative loudness of each bed at mix gain 1
export const TRIM = { air: 0.8, birds: 0.85, insects: 0.45, crickets: 0.5, traffic: 1, murmur: 1, clatter: 0.75, rain: 0.9, train: 1, water: 1, court: 0.8, room: 0.65 };
// a seamless LOOP-second bed, normalised
export function renderBed(name) {
  const x = LAYERS[name](rng(7919 + BEDS.indexOf(name) * 104729)), L = LOOP * SR, X = Math.round(XF * SR), y = new Float32Array(L);
  for (let i = 0; i < L; i++) y[i] = x[i];
  for (let i = 0; i < X; i++) { const k = i / X; y[i] = x[i] * Math.sin(k * Math.PI / 2) + x[L + i] * Math.cos(k * Math.PI / 2); }
  let s = 0; for (let i = 0; i < L; i++) s += y[i] * y[i];
  const g = BED_RMS / Math.sqrt(s / L + 1e-12); for (let i = 0; i < L; i++) y[i] *= g;
  return y;
}

// ---- which beds play where (authored time T, cues C, and marks the intro computes from its own choreography) ----
const MIX = {
  kampung: { air: 0.5, birds: 1, insects: 0.45, traffic: 0.25 },
  hello: { room: 0.4, air: 0.35, birds: 0.8, insects: 0.3, traffic: 0.2 },
  room: { room: 0.8, birds: 0.35, air: 0.15, traffic: 0.18 },
  town: { room: 0.25, air: 0.4, birds: 0.75, insects: 0.3, traffic: 0.6, murmur: 0.25 },
  hawker: { air: 0.25, murmur: 1, clatter: 0.8, birds: 0.12, traffic: 0.15 },
  night: { air: 0.4, crickets: 1, traffic: 0.3 },
  rainy: { air: 0.15, murmur: 0.75, clatter: 0.45, rain: 1 },
  plaza: { room: 0.2, air: 0.4, birds: 0.8, traffic: 0.45, murmur: 0.3, insects: 0.3 },
  mrt: { room: 0.15, train: 1 },
  chope: { room: 0.15, murmur: 1, clatter: 0.55 },
  chop: { room: 0.15, murmur: 0.8, clatter: 0.95 },
  tray: { room: 0.15, murmur: 0.9, clatter: 1 },
  jetty: { room: 0.15, water: 1, air: 0.5, birds: 0.25 },
  court: { room: 0.15, court: 1, birds: 0.45, traffic: 0.3, air: 0.35 },
  quiet: { room: 0.7, birds: 0.25, air: 0.12, traffic: 0.12 }
};
export function bedMix(T, C, k) {
  const at = (v, d) => v == null || !isFinite(v) ? NaN : v + (d || 0), g = k.games || [];
  const seq = [[-1, 'kampung', 0], [C.Hello + 0.2, 'hello', 1], [C.Host - 0.8, 'room', 0.8], [C.Town - 0.4, 'town', 1], [C.Neighbours - 0.4, 'room', 1],
    [at(k.demoIn), 'hawker', 0.8], [at(k.cut1, -0.4), 'night', 0.8], [at(k.cut2, -0.4), 'rainy', 0.8], [at(k.demoOut), 'plaza', 1],
    [C.Games - 0.3, 'quiet', 0.8], [at(g[0], -0.2), 'mrt', 0.6], [at(g[1], -0.3), 'chope', 0.6], [at(g[2], -0.3), 'chop', 0.6], [at(g[3], -0.3), 'tray', 0.6], [at(g[4], -0.3), 'jetty', 0.6],
    [C.Sports - 0.3, 'court', 0.8], [C.Recap - 0.3, 'quiet', 1], [C.Finale - 0.4, 'hello', 1], [C.Finale + 5, 'kampung', 1.5]].filter(s => isFinite(s[0]));
  let j = 0; for (let i = 0; i < seq.length; i++) if (T >= seq[i][0]) j = i;
  const cur = MIX[seq[j][1]], prev = j > 0 ? MIX[seq[j - 1][1]] : cur, p = seq[j][2] > 0 ? Math.min(1, Math.max(0, (T - seq[j][0]) / seq[j][2])) : 1, e = p * p * (3 - 2 * p), out = {};
  for (const n of BEDS) out[n] = (prev[n] || 0) * (1 - e) + (cur[n] || 0) * e;
  return out;
}

// authored time → playback time, honouring per-section retimes ("nat" = authored length, "dur" = played length)
export function playbackMap(scenesJson) {
  let ps = 0, as = 0;
  const secs = JSON.parse(scenesJson).map(s => { const nat = s.nat > 0 ? s.nat : s.dur, o = { as, nat, ps, dur: s.dur }; ps += s.dur; as += nat; return o; });
  return A => { for (const s of secs) if (A < s.as + s.nat) return s.ps + Math.max(0, A - s.as) * (s.nat > 0 ? s.dur / s.nat : 0); const l = secs[secs.length - 1]; return l.ps + l.dur; };
}
// when each voice clip plays: at its line's cue, never on top of the previous clip
export function voiceSchedule(lines, clips, toPlay) {
  const out = []; let end = -1;
  for (const l of lines) { const b = clips[l.text]; if (!b) continue; const s = Math.max(toPlay(l.at) + 0.05, end + 0.12); out.push({ s, d: b.duration, b, text: l.text }); end = s + b.duration; }
  return out;
}
export const DUCK = 0.55;

// ---- music: seven original cues in the manner of an 8-bit handheld RPG (pulse leads with delayed vibrato and an
// echo voice, a 4-bit wave-table bass, LFSR noise drums), with kompang hand drums in the Tenang theme. One cue per
// scene; Lisa cuts the title music short when she interrupts, and it stops again with the chope game's music. ----
export const MUSIC_RMS = 0.045, MDUCK = 0.45;
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, SC = [0, 2, 4, 5, 7, 9, 11];
const acc = s => s === '#' ? 1 : s === 'b' ? -1 : 0, hz = m => 440 * Math.pow(2, (m - 69) / 12);
const midi = s => { const m = /^([A-G])([#b]?)(\d)$/.exec(s); return 12 * (+m[3] + 1) + PC[m[1]] + acc(m[2]); };
// "E5:4 G5:2 r:2 …": pitch and length in sixteenths; bar lines are for reading only
function melody(str) { let p = 0; const out = []; for (const t of str.split(/[\s|]+/)) { if (!t) continue; const [n, d] = t.split(':'); if (n !== 'r') out.push({ p, len: +d, m: midi(n) }); p += +d; } out.steps = p; return out; }
const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], m6: [0, 3, 7, 9], sus4: [0, 5, 7] };
// "C | Dm7 G | A/C#": one bar per |, chords in a bar share it
function chordList(str) {
  const out = [];
  str.split('|').forEach((bar, b) => {
    const cs = bar.trim().split(/\s+/);
    cs.forEach((c, i) => {
      const [h, sl] = c.split('/'), m = /^([A-G])([#b]?)(.*)$/.exec(h), root = (PC[m[1]] + acc(m[2]) + 12) % 12;
      out.push({ p: b * 16 + i * 16 / cs.length, root, iv: QUAL[m[3]], bass: sl ? (PC[sl[0]] + acc(sl.slice(1)) + 12) % 12 : root });
    });
  });
  return out;
}
const isTone = (ch, n) => ch.iv.some(v => ((n - ch.root - v) % 12 + 12) % 12 === 0);
// second voice: a diatonic third under the tune, or the nearest chord tone under it where a beat needs one
function harmNote(q, ch, key) {
  const pc = ((q.m - key) % 12 + 12) % 12, i = SC.indexOf(pc), t = i < 0 ? null : q.m - ((pc - SC[(i + 5) % 7] + 12) % 12);
  if (t != null && (isTone(ch, t) || (q.p % 4 && q.len < 4))) return t;
  for (let n = q.m - 3; n > q.m - 10; n--) if (isTone(ch, n)) return n;
  return t != null ? t : q.m - 4;
}
// bass degrees: R root (or the slash note), F fifth, O octave, 3 third; roots sit between E2 and D#3
function bassNote(ch, dg) {
  const r = 40 + ((ch.bass - 4 + 12) % 12), up = v => r + ((ch.root + v - ch.bass + 24) % 12);
  return dg === 'F' ? up(7) : dg === 'O' ? r + 12 : dg === '3' ? up(ch.iv[1]) : r;
}
const blep = (t, dt) => t < dt ? (t /= dt, t + t - t * t - 1) : t > 1 - dt ? (t = (t - 1) / dt, t * t + t + t + 1) : 0;
const WAVE = Array.from({ length: 32 }, (_, i) => (i < 16 ? i : 31 - i) / 7.5 - 1);
const panG = p => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];
function voice(L, R, pan, t0, d, m, o, vol) {
  const f0 = hz(m), rel = o.r, i0 = Math.round(t0 * SR), n = Math.min(L.length - i0, Math.round((d + rel) * SR)), [gl, gr] = panG(pan);
  const du = o.duty || 0.5, dc = 2 * du - 1, vib = o.vib, arp = o.arp;
  let ph = 0;
  for (let j = 0; j < n; j++) {
    const u = j / SR;
    let e = u < o.a ? u / o.a : o.s + (1 - o.s) * Math.exp(-(u - o.a) / o.d);
    if (u > d) e *= 1 - (u - d) / rel;
    let f = f0;
    if (arp) f *= arp[Math.floor(u / o.ar) % arp.length];
    if (vib && u > vib[0]) f *= 1 + 0.0578 * vib[1] * Math.min(1, (u - vib[0]) / 0.15) * Math.sin(2 * Math.PI * vib[2] * (u - vib[0]));
    const dt = f / SR; ph += dt; if (ph >= 1) ph -= 1;
    const v = o.w === 'pulse' ? (ph < du ? 1 : -1) - dc + blep(ph, dt) - blep((ph - du + 1) % 1, dt)
      : o.w === 'wave' ? WAVE[(ph * 32) | 0] : Math.sin(2 * Math.PI * ph) + 0.22 * Math.sin(4 * Math.PI * ph) + 0.08 * Math.sin(6 * Math.PI * ph);
    const s = v * e * vol; L[i0 + j] += s * gl; R[i0 + j] += s * gr;
  }
}
// a celesta / music-box tine: four partials on rotating phasors, each with its own decay
function bell(L, R, pan, t0, d, m, o, vol) {
  const f = hz(m), i0 = Math.round(t0 * SR), n = Math.min(L.length - i0, Math.round((d + o.ring) * SR)), [gl, gr] = panG(pan);
  const P = [[1, 1, 1.5], [2, 0.38, 0.55], [3, 0.12, 0.3], [4.2, 0.07, 0.14]].filter(p => f * p[0] < SR * 0.45)
    .map(([r, a, k]) => { const th = 2 * Math.PI * f * r / SR; return { c: 1, s: 0, cr: Math.cos(th), sr: Math.sin(th), e: a, dk: Math.exp(-1 / (k * SR)) }; });
  const damp = Math.exp(-1 / (0.35 * SR)), off = (d + 0.4) * SR; let g = 1;
  for (let j = 0; j < n; j++) {
    let v = 0;
    for (const q of P) { const c = q.c * q.cr - q.s * q.sr; q.s = q.s * q.cr + q.c * q.sr; q.c = c; q.e *= q.dk; v += q.e * q.s; }
    if (j > off) g *= damp;
    const s = v * g * Math.min(1, j / 48) * vol; L[i0 + j] += s * gl; R[i0 + j] += s * gr;
  }
}
function lfsr(short) { let r = 0x7fff; return () => { const b = (r ^ (r >> 1)) & 1; r = (r >> 1) | (b << 14); if (short) r = (r & ~0x40) | (b << 6); return r & 1 ? -1 : 1; }; }
// k kick, s snare, r rim, h/o closed and open hat, c crash; d/p kompang dung (open) and pak (slap); t/u clock tick and tock
const DLEN = { k: 0.25, s: 0.28, r: 0.06, h: 0.06, o: 0.3, c: 1.6, d: 0.4, p: 0.16, t: 0.06, u: 0.06 };
const DPAN = { h: 0.25, o: 0.25, c: -0.2, d: -0.25, p: 0.25, t: 0.15, u: -0.15 };
const DV = { k: 0.9, s: 0.5, r: 0.45, h: 0.2, o: 0.18, c: 0.32, d: 0.65, p: 0.5, t: 0.3, u: 0.3 };
function drum(L, R, k, t0, vol) {
  const i0 = Math.round(t0 * SR), n = Math.min(L.length - i0, Math.round(DLEN[k] * SR)), [gl, gr] = panG(DPAN[k] || 0);
  const nz = lfsr(k === 'h' || k === 'o'), bp = k === 'p' ? bq('bp', 1900, 1.3) : null, tau = k === 'h' ? 0.016 : k === 'o' ? 0.08 : 0.45;
  let ph = 0, prev = 0;
  for (let j = 0; j < n; j++) {
    const u = j / SR; let v;
    if (k === 'k') { ph += (48 + 120 * Math.exp(-u / 0.022)) / SR; v = Math.sin(2 * Math.PI * ph) * Math.exp(-u / 0.11) + (u < 0.004 ? nz() * 0.3 * (1 - u / 0.004) : 0); }
    else if (k === 's') v = nz() * 0.75 * Math.exp(-u / 0.08) + Math.sin(2 * Math.PI * 190 * u) * 0.4 * Math.exp(-u / 0.03);
    else if (k === 'r') v = nz() * 0.5 * Math.exp(-u / 0.012) + Math.sin(2 * Math.PI * 1150 * u) * 0.5 * Math.exp(-u / 0.01);
    else if (k === 'h' || k === 'o' || k === 'c') { const x = nz(); v = (x - prev) * 0.5 * Math.exp(-u / tau); prev = x; }
    else if (k === 'd') { ph += 158 * (1 + 0.3 * Math.exp(-u / 0.018)) / SR; v = Math.sin(2 * Math.PI * ph) * Math.exp(-u / 0.13); }
    else if (k === 'p') v = bp.run(nz()) * 1.6 * Math.exp(-u / 0.03) + Math.sin(2 * Math.PI * 390 * u) * 0.3 * Math.exp(-u / 0.018);
    else { const f = k === 't' ? 2500 : 1900; v = (Math.sin(2 * Math.PI * f * u) + 0.4 * Math.sin(2 * Math.PI * f * 1.48 * u)) * Math.exp(-u / 0.011); }
    L[i0 + j] += v * vol * gl; R[i0 + j] += v * vol * gr;
  }
}
const INS = {
  lead25: { w: 'pulse', duty: 0.25, a: 0.004, d: 0.12, s: 0.7, r: 0.05, vib: [0.22, 0.2, 5.6] },
  lead50: { w: 'pulse', duty: 0.5, a: 0.004, d: 0.16, s: 0.6, r: 0.05, vib: [0.26, 0.16, 5.2] },
  lead12: { w: 'pulse', duty: 0.125, a: 0.003, d: 0.08, s: 0.6, r: 0.03, vib: [0.2, 0.18, 6] },
  harm12: { w: 'pulse', duty: 0.125, a: 0.004, d: 0.12, s: 0.6, r: 0.05 },
  piano: { w: 'pulse', duty: 0.5, a: 0.003, d: 0.5, s: 0, r: 0.2 },
  stab: { w: 'pulse', duty: 0.25, a: 0.002, d: 0.06, s: 0.35, r: 0.03, ar: 0.021 },
  broken: { w: 'pulse', duty: 0.125, a: 0.002, d: 0.06, s: 0.4, r: 0.04 },
  bass: { w: 'wave', a: 0.003, d: 0.25, s: 0.85, r: 0.02 },
  pad: { w: 'soft', a: 0.45, d: 0.6, s: 0.85, r: 0.9 },
  bell: { w: 'bell', ring: 1.1 },
  bellLong: { w: 'bell', ring: 2.4 }
};
const OCT8 = [[0, 2, 'R'], [2, 2, 'O'], [4, 2, 'R'], [6, 2, 'O'], [8, 2, 'R'], [10, 2, 'O'], [12, 2, 'R'], [14, 2, 'O']];
const TRES = [[0, 3, 'R'], [3, 3, 'F'], [6, 2, 'O'], [8, 3, 'R'], [11, 3, 'F'], [14, 2, 'O']];
const BEAT = { k: 'x.......x.x.....', s: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }, FILL = { k: 'x.......x.x.....', s: '....x.......x.xx', h: 'x.x.x.x.x.x.....' }, CRASH = Object.assign({ c: 'x...............' }, BEAT);
const TOWN = {
  bpm: 112, key: 'C', bars: 16, chords: 'C | Am | F | G | C | Am | Dm7 G | C | F | G | Em7 | Am | F | G | Dm7 G7 | C',
  lead: 'E5:4 G5:2 A5:2 G5:4 E5:4 | D5:2 E5:2 C5:4 A4:8 | C5:4 D5:2 F5:2 A5:4 G5:4 | G5:6 E5:2 D5:8 | E5:4 G5:2 A5:2 C6:4 A5:4 | G5:2 A5:2 G5:2 E5:2 D5:4 C5:4 | D5:4 E5:2 D5:2 C5:2 A4:2 G4:4 | C5:8 r:4 E5:2 G5:2 | A5:3 G5:1 A5:2 C6:2 A5:4 G5:4 | G5:3 E5:1 G5:2 A5:2 G5:4 D5:4 | E5:3 D5:1 E5:2 G5:2 E5:4 D5:4 | C5:4 D5:2 E5:2 A4:8 | F5:4 E5:2 D5:2 C5:4 A4:4 | D5:4 E5:2 G5:2 A5:4 G5:4 | F5:3 E5:1 D5:2 C5:2 D5:4 B4:4 | C5:8 G4:2 A4:2 C5:2 D5:2'
};
const CUES = {
  // LPA GO!, the title theme: "L-P-A" is a three-note pickup, "GO!" the leap that lands on the bar
  title: {
    bpm: 132, key: 'D', bars: 10, intro: 2, chords: 'D | C A | D | A/C# | Bm | G A | D | G | Em7 A7 | D',
    lead: 'D5:3 D5:3 F#5:2 A5:8 | C5:3 C5:3 E5:2 G5:2 A4:2 B4:2 D5:2 | A5:6 G5:2 F#5:4 D5:4 | E5:6 F#5:2 E5:2 B4:2 C#5:2 E5:2 | B5:6 A5:2 F#5:4 D5:4 | E5:3 F#5:1 G5:4 F#5:2 A4:2 B4:2 D5:2 | A5:6 G5:2 F#5:4 A5:4 | B5:6 A5:2 G5:4 B5:4 | D6:4 C#6:2 B5:2 A5:4 G5:2 E5:2 | D5:8 r:2 A4:2 B4:2 D5:2',
    parts: [
      { k: 'lead', ins: 'lead25', vol: 0.5, pan: -0.08, echo: [1, 0.3, 0.4] },
      { k: 'harm', ins: 'harm12', vol: 0.2, pan: 0.3 },
      { k: 'bass', ins: 'bass', vol: 0.42, gate: 0.8, seq: 'F G A A A A A A A A', pats: { A: OCT8, F: [[0, 3, 'R'], [3, 3, 'R'], [6, 2, 'R'], [8, 8, 'R']], G: [[0, 3, 'R'], [3, 3, 'R'], [6, 2, 'R'], [8, 2, 'R'], [10, 2, 'R'], [12, 2, 'O'], [14, 2, 'F']] } },
      { k: 'drums', vol: 0.5, seq: 'F G C A A B C A A B', pats: { F: { k: 'x..x..x.x.......', s: '..........xxxxxx', c: 'x...............' }, G: { k: 'x..x..x.x.......', s: '..........x.xxxx' }, A: BEAT, B: FILL, C: CRASH } }
    ]
  },
  // Lisa's theme: a swung, bouncy walk for when she is explaining
  host: {
    bpm: 108, swing: 0.6, key: 'G', bars: 16, chords: 'G | Em | Am7 | D7 | G | Em | C D7 | G | C | G/B | Am7 | D7 | Bm7 | E7 | Am7 D7 | G',
    lead: 'D5:2 B4:2 D5:2 G5:4 r:2 F#5:2 G5:2 | A5:3 G5:1 E5:4 r:4 B4:2 D5:2 | E5:2 C5:2 E5:2 A5:4 r:2 G5:2 A5:2 | B5:3 A5:1 F#5:4 r:2 D5:2 E5:2 F#5:2 | G5:2 D5:2 B4:2 D5:2 G5:4 B5:4 | A5:3 G5:1 F#5:2 E5:2 D5:4 r:4 | E5:2 G5:2 C6:4 B5:2 A5:2 F#5:2 D5:2 | G5:4 r:4 D5:2 G5:2 r:4 | E5:6 D5:2 C5:4 E5:4 | D5:6 C5:2 B4:4 D5:4 | C5:4 E5:4 A5:4 G5:4 | F#5:6 E5:2 D5:4 r:4 | D5:2 F#5:2 A5:2 B5:4 r:2 A5:2 B5:2 | G#5:3 F#5:1 E5:4 r:4 D5:2 E5:2 | C6:2 B5:2 A5:2 G5:2 F#5:2 E5:2 D5:2 C5:2 | B4:2 D5:2 G5:4 r:8',
    parts: [
      { k: 'lead', ins: 'lead50', vol: 0.4, gate: 0.78 },
      { k: 'stab', ins: 'stab', vol: 0.12, pan: 0.3, oct: 4, at: [2, 6, 10, 14], len: 1 },
      { k: 'bass', ins: 'bass', vol: 0.4, gate: 0.7, pats: { A: [[0, 3, 'R'], [4, 3, 'F'], [8, 3, 'O'], [12, 3, 'F']] } },
      { k: 'drums', vol: 0.32, seq: 'A A A A A A A B A A A A A A A B', pats: { A: { k: 'x.......x.......', r: '....x.......x...', h: 'x.x.x.x.x.x.x.x.' }, B: { k: 'x.......x.......', r: '....x.......x.x.', h: 'x.x.x.x.x.x.x...' } } }
    ]
  },
  // why now: the title tune slowed onto a music box, a clock ticking under the years, the minor iv where capacity goes
  capacity: {
    bpm: 84, key: 'D', bars: 5, loop: false, tail: 3.2, level: 0.85, chords: 'Dmaj7 | A/C# | Bm7 | Gm6 | Asus4 A',
    lead: 'r:4 A5:2 B5:2 D6:8 | A6:6 G6:2 F#6:4 E6:4 | F#6:6 E6:2 D6:4 B5:4 | Bb5:6 A5:2 G5:4 Bb5:4 | D6:8 C#6:8',
    parts: [
      { k: 'lead', ins: 'bellLong', vol: 0.5 },
      { k: 'lead', ins: 'piano', vol: 0.1, shift: -12, gate: 1 },
      { k: 'pad', ins: 'pad', vol: 0.06, oct: 4 },
      { k: 'bass', ins: 'bass', vol: 0.22, gate: 0.97, pats: { A: [[0, 16, 'R']] } },
      { k: 'drums', vol: 0.3, seq: 'T T T - -', pats: { T: { t: 'x.......x.......', u: '....x.......x...' } } }
    ]
  },
  // Tenang: a pentatonic town theme. Soft while she introduces the town; the band and the kompang join once she is in the game
  town: Object.assign({
    level: 0.9, parts: [
      { k: 'lead', ins: 'lead50', vol: 0.38, gate: 0.88 },
      { k: 'broken', ins: 'broken', vol: 0.09, pan: 0.35, oct: 4, every: 2, pat: [0, 1, 2, 1] },
      { k: 'bass', ins: 'bass', vol: 0.34, gate: 0.75, pats: { A: [[0, 6, 'R'], [8, 6, 'F']] } },
      { k: 'drums', vol: 0.25, pats: { A: { h: '..x...x...x...x.' } } }
    ]
  }, TOWN),
  townFull: Object.assign({
    level: 1.1, parts: [
      { k: 'lead', ins: 'lead25', vol: 0.45, pan: -0.08, echo: [1, 0.28, 0.4] },
      { k: 'harm', ins: 'harm12', vol: 0.15, pan: 0.3 },
      { k: 'lead', ins: 'bell', vol: 0.16, shift: 12, bars: [8, 16], pan: -0.3 },
      { k: 'bass', ins: 'bass', vol: 0.4, gate: 0.8, pats: { A: TRES } },
      { k: 'drums', vol: 0.45, seq: 'A A A A A A A B A A A A A A A B', pats: { A: { d: 'x.....x.x.......', p: '....x......x.x..', h: '..x...x...x...x.' }, B: { d: 'x.....x.x.....x.', p: '....x......xxx.x', h: '..x...x...x.....' } } }
    ]
  }, TOWN),
  // play first: an oom-pah minigame tune
  games: {
    bpm: 152, key: 'F', bars: 16, chords: 'F | F | Bb | C7 | F | D7 | Gm C7 | F | Bb | F/C | G7 | C7 | F | D7 | Gm7 C7 | F',
    lead: 'C5:2 F5:2 A5:2 r:2 G#5:1 A5:1 C6:2 A5:2 r:2 | G5:2 F5:2 D5:2 F5:2 C5:4 r:4 | D5:2 F5:2 Bb5:2 r:2 A5:1 Bb5:1 D6:2 Bb5:2 r:2 | C6:2 Bb5:2 G5:2 E5:2 C5:4 r:4 | C5:2 F5:2 A5:2 r:2 G#5:1 A5:1 C6:2 F6:2 r:2 | F#5:2 A5:2 D6:2 C6:2 A5:2 F#5:2 D5:4 | Bb5:2 A5:2 G5:2 D5:2 E5:2 F5:2 G5:2 Bb5:2 | A5:4 F5:2 C5:2 F5:4 r:4 | D6:3 C6:1 Bb5:2 F5:2 D5:2 F5:2 Bb5:4 | A5:3 G5:1 F5:2 C5:2 A4:2 C5:2 F5:4 | G5:2 B4:2 D5:2 F5:2 G5:2 A5:2 B5:4 | C6:2 r:2 C6:2 Bb5:2 G5:2 E5:2 C5:4 | C5:2 F5:2 A5:2 r:2 G#5:1 A5:1 C6:2 A5:2 r:2 | D6:2 C6:2 A5:2 F#5:2 G5:2 A5:2 D5:4 | Bb5:2 A5:2 G5:2 F5:2 E5:2 C5:2 E5:2 G5:2 | F5:2 r:2 C5:2 r:2 F5:4 r:4',
    parts: [
      { k: 'lead', ins: 'lead12', vol: 0.55, gate: 0.6, pan: -0.05 },
      { k: 'stab', ins: 'stab', vol: 0.16, pan: 0.3, oct: 4, at: [2, 6, 10, 14], len: 1.2 },
      { k: 'bass', ins: 'bass', vol: 0.42, gate: 0.65, pats: { A: [[0, 2, 'R'], [4, 2, 'F'], [8, 2, 'R'], [12, 2, 'F']] } },
      { k: 'drums', vol: 0.45, seq: 'C A A B A A A B C A A B A A A B', pats: { A: BEAT, B: FILL, C: CRASH } }
    ]
  },
  // your turn: the title theme again, out on the bVI-bVII-I cadence
  finale: {
    bpm: 132, key: 'D', bars: 5, loop: false, tail: 2.5, chords: 'D | D | G | Bb C | D',
    lead: 'r:10 A4:2 B4:2 D5:2 | A5:6 G5:2 F#5:4 D5:4 | B5:6 A5:2 G5:4 D6:4 | F5:2 Bb5:2 D6:4 G5:2 C6:2 E6:4 | D6:12 r:4',
    parts: [
      { k: 'lead', ins: 'lead25', vol: 0.5, pan: -0.08, echo: [1, 0.3, 0.4] },
      { k: 'harm', ins: 'harm12', vol: 0.2, pan: 0.3 },
      { k: 'bass', ins: 'bass', vol: 0.42, gate: 0.8, seq: 'P A A A E', pats: { P: [[10, 2, 'R'], [12, 2, 'F'], [14, 2, 'O']], A: OCT8, E: [[0, 12, 'R']] } },
      { k: 'drums', vol: 0.5, seq: 'R C A B E', pats: { R: { s: '........xxxxxxxx' }, A: BEAT, B: FILL, C: CRASH, E: { k: 'x...............', c: 'x...............' } } }
    ]
  }
};
export const CUE_NAMES = Object.keys(CUES);
// a cue as stereo samples: looping cues fold their ringing tail back onto the loop start so the seam is seamless
export function renderCue(name) {
  const c = CUES[name], beat = 60 / c.bpm, sw = c.swing || 0, loop = c.loop !== false;
  const tAt = p => { const b = Math.floor(p / 4), f = p / 4 - b; return (b + (sw ? (f < 0.5 ? f * 2 * sw : sw + (f - 0.5) * 2 * (1 - sw)) : f)) * beat; };
  const steps = c.bars * 16, len = tAt(steps), n = Math.ceil((len + (loop ? 2.5 : c.tail || 3)) * SR);
  const L = new Float32Array(n), R = new Float32Array(n), CH = chordList(c.chords), tune = melody(c.lead), key = PC[c.key];
  const chAt = p => { let k = CH[0]; for (const q of CH) if (q.p <= p + 1e-6) k = q; return k; };
  const play = (q, o, vol, pan, gate, dly) => { const t0 = tAt(q.p) + (dly || 0), d = Math.max(0.03, (tAt(q.p + q.len) - tAt(q.p)) * gate); (o.w === 'bell' ? bell : voice)(L, R, pan, t0, d, q.m, o, vol); };
  for (const pt of c.parts) {
    const o = INS[pt.ins], vol = pt.vol, pan = pt.pan || 0, gate = pt.gate || 0.9, ids = pt.seq ? pt.seq.split(' ') : [], id = b => ids[b] || 'A';
    if (pt.k === 'lead' || pt.k === 'harm') for (const q of tune) {
      if (pt.bars && (q.p < pt.bars[0] * 16 || q.p >= pt.bars[1] * 16)) continue;
      const nq = { p: q.p, len: q.len, m: pt.k === 'harm' ? harmNote(q, chAt(q.p), key) : q.m + (pt.shift || 0) };
      play(nq, o, vol, pan, gate);
      if (pt.echo) play(nq, o, vol * pt.echo[1], pt.echo[2], gate, pt.echo[0] * beat / 4);
    }
    else if (pt.k === 'bass') { for (let b = 0; b < c.bars; b++) for (const [s, l, dg] of pt.pats[id(b)] || []) play({ p: b * 16 + s, len: l, m: bassNote(chAt(b * 16 + s), dg) }, o, vol, pan, gate); }
    else if (pt.k === 'stab') { for (let b = 0; b < c.bars; b++) for (const s of pt.at) { const ch = chAt(b * 16 + s); play({ p: b * 16 + s, len: pt.len, m: 12 * (pt.oct + 1) + ch.root }, Object.assign({}, o, { arp: ch.iv.map(v => Math.pow(2, v / 12)) }), vol, pan, 1); } }
    else if (pt.k === 'broken') { for (let s = 0, i = 0; s < steps; s += pt.every, i++) { const ch = chAt(s), tn = ch.iv.length > 3 ? ch.iv : ch.iv.concat(12); play({ p: s, len: pt.every, m: 12 * (pt.oct + 1) + ch.root + tn[pt.pat[i % pt.pat.length] % tn.length] }, o, vol, pan, gate); } }
    else if (pt.k === 'pad') CH.forEach((ch, i) => { const end = i + 1 < CH.length ? CH[i + 1].p : steps; ch.iv.forEach(v => play({ p: ch.p, len: end - ch.p, m: 12 * (pt.oct + 1) + ch.root + v }, o, vol, pan, 1)); });
    else if (pt.k === 'drums') for (let b = 0; b < c.bars; b++) { const P = pt.pats[id(b)]; if (P) for (const ln in P) for (let s = 0; s < 16; s++) if (P[ln][s] === 'x') drum(L, R, ln, tAt(b * 16 + s), vol * DV[ln]); }
  }
  const ls = tAt((c.intro || 0) * 16), e = Math.round(len * SR);
  let N = n;
  if (loop) { const s0 = Math.round(ls * SR); for (let i = e; i < n; i++) { L[s0 + i - e] += L[i]; R[s0 + i - e] += R[i]; } N = e; }
  const out = [L.subarray(0, N), R.subarray(0, N)];
  let s = 0; for (const y of out) { filt(y, 'hp', 35); filt(y, 'lp', 7000); for (let i = 0; i < N; i++) s += y[i] * y[i]; }
  const g = MUSIC_RMS * (c.level || 1) / Math.sqrt(s / (2 * N) + 1e-12);
  for (const y of out) for (let i = 0; i < N; i++) { const v = y[i] * g, a = Math.abs(v); y[i] = a > 0.6 ? Math.sign(v) * (0.6 + 0.4 * Math.tanh((a - 0.6) / 0.4)) : v; }
  return { L: out[0], R: out[1], ls, le: N / SR, loop };
}
// which cue plays where: [authored time it takes over, cue, where the cue's bar 1 sits, bars to skip in]
export function musicCue(T, C, k) {
  const seq = [[-1, 'title', 0], [C.Hello + 0.7, null], [C.Hello + 4.4, 'host', C.Hello + 4.4], [C.Capacity, 'capacity', C.Capacity], [C.Town, 'town', C.Town],
    [k.demoIn, 'townFull', C.Town], [C.Week, 'host', C.Week, 8], [C.Games, 'games', C.Games], [C.Recap, 'host', C.Recap], [C.Finale, 'finale', C.Finale]].filter(s => isFinite(s[0]));
  let j = 0; for (let i = 0; i < seq.length; i++) if (T >= seq[i][0]) j = i;
  const [, name, at, bars] = seq[j];
  return name ? { name, at, skip: (bars || 0) * 240 / CUES[name].bpm, hush: name === 'games' && !!k.hush } : { stop: true };
}

// ---- live playback in the preview ----
export function createDirector({ base, scenes }) {
  const url = p => new URL(p, base).href, toPlay = playbackMap(scenes), S = { vo: true, amb: true, level: 0.7, mus: true, musLevel: 0.6, needsGesture: false, clips: 0 };
  const subs = new Set(), emit = () => subs.forEach(f => f(S)), clips = {}, beds = {}, nodes = {}, tunes = {};
  let ctx = null, voBus = null, bedBus = null, musBus = null, cur = null, tune = null, done = -1, sched = [], key = '', lastTime = null, stopT = 0;
  const dec = new OfflineAudioContext(1, 1, SR);
  fetch(url('assets/vo/manifest.json')).then(r => r.ok ? r.json() : null).then(m => {
    if (!m) return;
    m.lines.forEach(l => fetch(url('assets/vo/' + l.id + '.wav')).then(r => r.ok ? r.arrayBuffer() : null).then(ab => ab ? dec.decodeAudioData(ab) : null)
      .then(b => { if (b) { clips[l.text] = b; key = ''; S.clips++; emit(); } }).catch(() => { }));
  }).catch(() => { });
  (async () => {
    const tick = () => new Promise(r => setTimeout(r, 30));
    const cue = n => {
      try { const c = renderCue(n), b = new AudioBuffer({ length: c.L.length, sampleRate: SR, numberOfChannels: 2 }); b.copyToChannel(c.L, 0); b.copyToChannel(c.R, 1); tunes[n] = { b, ls: c.ls, le: c.le, loop: c.loop }; }
      catch (e) { console.error('music cue', n, e); }
    };
    for (const n of ['title', 'host']) { await tick(); cue(n); }
    for (const n of BEDS) {
      await tick();
      const y = renderBed(n), b = new AudioBuffer({ length: y.length, sampleRate: SR, numberOfChannels: 1 }); b.copyToChannel(y, 0); beds[n] = b;
    }
    for (const n of CUE_NAMES) if (!tunes[n]) { await tick(); cue(n); }
  })();
  function ensure() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -8; lim.ratio.value = 8; lim.attack.value = 0.003; lim.release.value = 0.2; lim.connect(ctx.destination);
    voBus = ctx.createGain(); voBus.connect(lim); bedBus = ctx.createGain(); bedBus.gain.value = 0; bedBus.connect(lim); musBus = ctx.createGain(); musBus.gain.value = 0; musBus.connect(lim);
    const wake = () => { if (ctx.state !== 'running') ctx.resume().then(emit).catch(() => { }); };
    window.addEventListener('pointerdown', wake, true); window.addEventListener('keydown', wake, true);
  }
  function stopVoice() { if (!cur) return; const t = ctx.currentTime; cur.g.gain.cancelScheduledValues(t); cur.g.gain.setTargetAtTime(0, t, 0.015); try { cur.src.stop(t + 0.08); } catch (e) { } cur = null; }
  function startVoice(i, off) {
    const q = sched[i], at = ctx.currentTime + 0.02, o = Math.max(0, off), src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = q.b; src.connect(g); g.connect(voBus);
    g.gain.setValueAtTime(o > 0.05 ? 0 : 1, at); if (o > 0.05) g.gain.linearRampToValueAtTime(1, at + 0.04);
    src.start(at, o); const c = { i, src, g, t0: at - o }; cur = c;
    src.onended = () => { if (cur === c) { cur = null; done = i; } };
  }
  // music: one cue at a time, its position read off the timeline; a cue change, scrub or drift restarts it in place.
  // tape > 0 winds it down like a tape stop instead of fading it
  function stopTune(tape) {
    if (!tune) return;
    const t = ctx.currentTime, m = tune; tune = null;
    m.g.gain.cancelScheduledValues(t); m.g.gain.setValueAtTime(m.g.gain.value, t);
    if (tape) { m.src.playbackRate.setValueAtTime(1, t); m.src.playbackRate.exponentialRampToValueAtTime(0.1, t + tape); m.g.gain.setTargetAtTime(0, t + tape * 0.45, tape * 0.2); }
    else m.g.gain.setTargetAtTime(0, t, 0.12);
    try { m.src.stop(t + tape + 0.8); } catch (e) { }
  }
  function startTune(name, off, fresh, k) {
    const q = tunes[name];
    if (!q || (!q.loop && off >= q.b.duration - 0.05)) return;
    const at = ctx.currentTime + 0.02, src = ctx.createBufferSource(), g = ctx.createGain(), o = Math.max(0, off);
    src.buffer = q.b; if (q.loop) { src.loop = true; src.loopStart = q.ls; src.loopEnd = q.le; }
    src.connect(g); g.connect(musBus);
    g.gain.setValueAtTime(fresh ? 1 : 0, at); if (!fresh) g.gain.linearRampToValueAtTime(1, at + 0.4);
    src.start(at, q.loop && o >= q.le ? q.ls + (o - q.ls) % (q.le - q.ls) : o);
    tune = { k, src, g, t0: at - o };
  }
  function startBeds(time) {
    for (const n in beds) if (!nodes[n]) {
      const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = beds[n]; src.loop = true; g.gain.value = 0; src.connect(g); g.connect(bedBus);
      src.start(ctx.currentTime + 0.02, ((time % LOOP) + LOOP) % LOOP); nodes[n] = { src, g };
    }
  }
  function stopBeds() { for (const n in nodes) { try { nodes[n].src.stop(); } catch (e) { } nodes[n].g.disconnect(); delete nodes[n]; } }
  return {
    state: S,
    subscribe(f) { subs.add(f); f(S); return () => subs.delete(f); },
    set(o) { Object.assign(S, o); if (ctx) { if (!S.vo) stopVoice(); if (!S.mus) stopTune(0); } emit(); },
    resume() { ensure(); return ctx.resume().then(() => { S.needsGesture = false; emit(); }); },
    update({ time, playing, lines, mix, music }) {
      const k2 = lines.map(l => l.at.toFixed(2)).join(',') + '|' + S.clips;
      if (k2 !== key) { key = k2; sched = voiceSchedule(lines, clips, toPlay); }
      const jump = lastTime != null && Math.abs(time - lastTime) > 0.6; lastTime = time;
      if (!playing) {
        if (ctx) { stopVoice(); stopTune(0); bedBus.gain.setTargetAtTime(0, ctx.currentTime, 0.05); clearTimeout(stopT); stopT = setTimeout(stopBeds, 400); }
        if (S.needsGesture) { S.needsGesture = false; emit(); }
        return;
      }
      clearTimeout(stopT); ensure();
      if (ctx.state !== 'running') { ctx.resume().catch(() => { }); if (!S.needsGesture) { S.needsGesture = true; emit(); } return; }
      if (S.needsGesture) { S.needsGesture = false; emit(); }
      const now = ctx.currentTime;
      let k = -1; for (let i = 0; i < sched.length; i++) if (time >= sched[i].s && time < sched[i].s + sched[i].d) { k = i; break; }
      if (!S.vo) k = -1;
      if (jump || k !== done) done = -1;
      if (cur && (k !== cur.i || Math.abs((now - cur.t0) - (time - sched[k].s)) > 0.3)) stopVoice();
      if (k >= 0 && !cur && k !== done && time - sched[k].s < sched[k].d - 0.08) startVoice(k, time - sched[k].s);
      if (S.amb && mix) { startBeds(time); for (const n in nodes) nodes[n].g.gain.setTargetAtTime((mix[n] || 0) * (TRIM[n] || 1), now, 0.25); }
      const talking = S.vo && sched.some(q => time > q.s - 0.25 && time < q.s + q.d + 0.2);
      bedBus.gain.setTargetAtTime(S.amb ? S.level * (talking ? DUCK : 1) : 0, now, 0.15);
      const mu = S.mus && music && !music.stop ? music : null, mk = mu ? mu.name + '@' + mu.at.toFixed(2) : '', off = mu ? time - toPlay(mu.at) + (mu.skip || 0) : 0;
      if (tune && (tune.k !== mk || mu.hush)) stopTune(!jump && music && (music.stop || music.hush) ? (music.hush ? 0.35 : 0.6) : 0);
      else if (tune && Math.abs(now - tune.t0 - off) > 0.3) stopTune(0);
      if (!tune && mu && !mu.hush && off > -0.05) startTune(mu.name, off, off - (mu.skip || 0) < 0.12, mk);
      musBus.gain.setTargetAtTime(S.mus ? S.musLevel * (talking ? MDUCK : 1) : 0, now, 0.12);
    }
  };
}
