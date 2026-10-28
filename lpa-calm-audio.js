// LPA GO! videos: sound, second pass. One soft, continuous music bed loops under the whole video and dips while any
// line of dialogue is on screen; Lisa's voice-over clips (assets/vo/manifest.json) play on their lines when the WAVs
// exist. No ambience and no cue changes. The bed is original: F major, 88 bpm, sixteen bars of warm pad, music-box
// arpeggio and round bass, with a sparse tune over bars 9-16. Rendered once at load; it repeats every LOOP seconds.
export const SR = 24000;
const BPM = 88, S16 = 15 / BPM, BAR = 16 * S16, BARS = 16, TAIL = 4, SCORE_RMS = 0.06;
export const LOOP = BARS * BAR;

const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const ss = x => { x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); };
const panG = p => [Math.cos((p + 1) * Math.PI / 4), Math.sin((p + 1) * Math.PI / 4)];
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midi = s => { const m = /^([A-G])(b?)(\d)$/.exec(s); return 12 * (+m[3] + 1) + PC[m[1]] - (m[2] ? 1 : 0); };

// one bar each: [bass root, pad voicing, arpeggio tones low to high] (MIDI)
const F = [41, [57, 60, 64], [65, 69, 72, 76, 77]], Dm = [38, [57, 60, 65], [65, 69, 72, 74, 77]], Bb = [46, [57, 62, 65], [65, 69, 70, 74, 77]];
const C9s = [48, [58, 62, 65], [65, 67, 70, 72, 74]], Am = [45, [55, 60, 64], [64, 67, 69, 72, 76]], Cj = [48, [55, 60, 64], [64, 67, 72, 76, 79]];
const Gm = [43, [58, 62, 65], [65, 67, 70, 74, 79]], FA = [45, [57, 60, 64], [65, 69, 72, 76, 77]];
const CHART = [F, Dm, Bb, C9s, F, Am, Bb, Cj, Dm, Am, Bb, FA, Gm, Am, Bb, C9s];
// the arpeggio in sixteenths, a 3-3-2 lilt; bars 1-4 leave two notes out, bars 9-16 sit back under the tune
const ARP = { at: [0, 3, 6, 8, 11, 14], idx: [0, 2, 3, 1, 2, 4], vel: [0.85, 0.55, 0.65, 0.7, 0.55, 0.6], pan: [-0.2, 0.15, 0.25, -0.1, 0.1, 0.2] };
const TUNE = 'A5:8 F5:4 G5:4 E5:12 r:4 F5:8 D5:4 F5:4 E5:8 C5:8 D5:8 Bb4:4 D5:4 C5:8 E5:8 D5:12 r:4 C5:8 r:8';
const PAD = { a: 0.9, r: 1.8, h2: 0.22, h3: 0.07 };
const BASS = { a: 0.025, r: 0.35, sus: 0.6, dk: 0.6, h2: 0.3, h3: 0.1 };
const FLUTE = { a: 0.1, r: 0.5, sus: 0.75, dk: 0.7, h2: 0.12, h3: 0.03, vib: [0.35, 0.004, 4.8] };

// a soft tone from one rotating phasor (2nd and 3rd partials by identity), into L/R and the reverb send W
function tone(L, R, W, send, t0, d, m, o, amp, pan) {
  const i0 = Math.max(0, Math.round(t0 * SR)), n = Math.min(L.length - i0, Math.round((d + o.r) * SR)), [gl, gr] = panG(pan), th = 2 * Math.PI * hz(m) / SR;
  let c = 1, s = 0, cr = Math.cos(th), sr = Math.sin(th);
  for (let j = 0; j < n; j++) {
    const u = j / SR;
    let e = u < o.a ? ss(u / o.a) : 1;
    if (o.dk) e *= o.sus + (1 - o.sus) * Math.exp(-u / o.dk);
    if (u > d) e *= 1 - ss((u - d) / o.r);
    if (o.vib && (j & 15) === 0) { const w = th * (1 + o.vib[1] * ss((u - o.vib[0]) / 0.4) * Math.sin(2 * Math.PI * o.vib[2] * u)); cr = Math.cos(w); sr = Math.sin(w); }
    const c2 = c * cr - s * sr; s = s * cr + c * sr; c = c2;
    if ((j & 1023) === 1023) { const k = 1 / Math.sqrt(c * c + s * s); c *= k; s *= k; }
    const v = (s + o.h2 * 2 * s * c + o.h3 * s * (3 - 4 * s * s)) * e * amp;
    L[i0 + j] += v * gl; R[i0 + j] += v * gr; if (W) W[i0 + j] += v * send;
  }
}
// a music-box tine: four partials, each with its own decay
function bell(L, R, W, send, t0, m, amp, pan) {
  const f = hz(m), i0 = Math.max(0, Math.round(t0 * SR)), n = Math.min(L.length - i0, Math.round(3 * SR)), [gl, gr] = panG(pan), A = Math.round(0.004 * SR), Z = Math.round(0.5 * SR);
  const P = [[1, 1, 1.1], [2, 0.2, 0.42], [3, 0.06, 0.2], [4.2, 0.035, 0.09]].filter(q => f * q[0] < SR * 0.45)
    .map(([r, a, k]) => { const th = 2 * Math.PI * f * r / SR; return { c: 1, s: 0, cr: Math.cos(th), sr: Math.sin(th), e: a, dk: Math.exp(-1 / (k * SR)) }; });
  for (let j = 0; j < n; j++) {
    let v = 0;
    for (const q of P) { const c = q.c * q.cr - q.s * q.sr; q.s = q.s * q.cr + q.c * q.sr; q.c = c; q.e *= q.dk; v += q.e * q.s; }
    v *= amp * (j < A ? j / A : 1) * (j > n - Z ? (n - j) / Z : 1);
    L[i0 + j] += v * gl; R[i0 + j] += v * gr; W[i0 + j] += v * send;
  }
}
// a small room: four damped combs and two allpasses per side
function verb(x, sp) {
  const n = x.length, y = new Float32Array(n);
  for (const d0 of [607, 646, 695, 738]) {
    const d = d0 + sp, buf = new Float32Array(d); let k = 0, lp = 0;
    for (let i = 0; i < n; i++) { const o = buf[k]; lp = o * 0.65 + lp * 0.35; buf[k] = x[i] * 0.06 + lp * 0.83; y[i] += o; if (++k === d) k = 0; }
  }
  for (const d0 of [302, 240]) {
    const d = d0 + (sp >> 1), buf = new Float32Array(d); let k = 0;
    for (let i = 0; i < n; i++) { const o = buf[k], v = y[i]; buf[k] = v + o * 0.5; y[i] = o - v; if (++k === d) k = 0; }
  }
  return y;
}
// the bed as stereo samples, exactly LOOP seconds, seamless end to start
export async function renderScore(tick) {
  const pause = tick || (() => null), n = Math.round((LOOP + TAIL) * SR), N = Math.round(LOOP * SR);
  const L = new Float32Array(n), R = new Float32Array(n), W = new Float32Array(n), r = rng(20261027);
  // pad: each voice holds through the bars where its note stays, two copies a few cents apart
  for (let v = 0; v < 3; v++) {
    for (let b0 = 0, b = 1; b <= BARS; b++) {
      if (b < BARS && CHART[b][1][v] === CHART[b0][1][v]) continue;
      for (const dt of [-0.04, 0.04]) tone(L, R, W, 0.15, b0 * BAR, (b - b0) * BAR, CHART[b0][1][v] + dt, PAD, 0.045, dt * 9);
      b0 = b;
    }
  }
  await pause();
  // bass: the root, then a soft fifth on beat four
  CHART.forEach(([root], b) => {
    tone(L, R, null, 0, b * BAR, 11 * S16, root, BASS, 0.18, 0);
    tone(L, R, null, 0, b * BAR + 12 * S16, 3.5 * S16, root >= 45 ? root - 5 : root + 7, BASS, 0.12, 0);
  });
  CHART.forEach(([, , tones], b) => ARP.at.forEach((s, k) => {
    if (b < 4 && (k === 1 || k === 4)) return;
    const t = b * BAR + s * S16 + (r() - 0.5) * 0.01, vel = ARP.vel[k] * (b >= 8 ? 0.72 : 1) * (0.94 + r() * 0.12);
    bell(L, R, W, 0.5, t, tones[ARP.idx[k]], 0.21 * vel, ARP.pan[k]);
  }));
  await pause();
  let p = 8 * 16;
  for (const tk of TUNE.split(' ')) { const [nm, l] = tk.split(':'); if (nm !== 'r') tone(L, R, W, 0.4, p * S16, +l * S16 * 0.92, midi(nm), FLUTE, 0.1, -0.12); p += +l; }
  await pause();
  const wl = verb(W, 0), wr = verb(W, 13);
  for (let i = 0; i < n; i++) { L[i] += wl[i] * 0.45; R[i] += wr[i] * 0.45; }
  // fold the ringing tail back onto the start so the loop is seamless, then set the level
  for (let i = N; i < n; i++) { L[i - N] += L[i]; R[i - N] += R[i]; }
  const out = [L.subarray(0, N), R.subarray(0, N)];
  let e = 0; for (const y of out) for (let i = 0; i < N; i++) e += y[i] * y[i];
  const g = SCORE_RMS / Math.sqrt(e / (2 * N) + 1e-12);
  for (const y of out) for (let i = 0; i < N; i++) { const v = y[i] * g, a = Math.abs(v); y[i] = a > 0.7 ? Math.sign(v) * (0.7 + 0.3 * Math.tanh((a - 0.7) / 0.3)) : v; }
  return { L: out[0], R: out[1] };
}

// ---- timing ----
// authored time to playback time, honouring per-section retimes ("nat" = authored length, "dur" = played length)
export function playbackMap(scenesJson) {
  let ps = 0, as = 0;
  const secs = JSON.parse(scenesJson).map(s => { const nat = s.nat > 0 ? s.nat : s.dur, o = { as, nat, ps, dur: s.dur }; ps += s.dur; as += nat; return o; });
  return A => { for (const s of secs) if (A < s.as + s.nat) return s.ps + Math.max(0, A - s.as) * (s.nat > 0 ? s.dur / s.nat : 0); const l = secs[secs.length - 1]; return l.ps + l.dur; };
}
// when each voice clip plays: at its line, never on top of the previous clip
function voiceSchedule(lines, clips, toPlay) {
  const out = []; let end = -1;
  for (const l of lines) { const b = clips[l.text]; if (!b) continue; const s = Math.max(toPlay(l.at) + 0.05, end + 0.12); out.push({ s, d: b.duration, b }); end = s + b.duration; }
  return out;
}
// the dialogue as it plays: speaker, start and end in seconds of playback, text
export function cueSheet(lines, toPlay) {
  return lines.map((l, i) => ({ n: i + 1, who: l.who || 'Lisa', start: +toPlay(l.at).toFixed(3), end: +toPlay(l.end).toFixed(3), text: l.text }));
}
// the music dips 0.35 s before a line and comes back 0.9 s after it; gaps under 2 s stay dipped so it never pumps
const ATT = 0.35, REL = 0.9, MERGE = 2, FIN = 1.5, FOUT = 3;
export function dipSpans(sheet, voice) {
  const s = sheet.map(d => [d.start, d.end]).concat(voice.map(q => [q.s, q.s + q.d])).sort((a, b) => a[0] - b[0]), out = [];
  for (const [a, b] of s) { const l = out[out.length - 1]; if (l && a - l[1] < MERGE) l[1] = Math.max(l[1], b); else out.push([a, b]); }
  return out;
}
export function dipAt(t, spans) {
  let e = 0;
  for (const [a, b] of spans) { if (t < a - ATT) break; e = Math.max(e, t < a ? ss((t - a + ATT) / ATT) : t <= b ? 1 : 1 - ss((t - b) / REL)); }
  return e;
}
// in at the top of the video, out at the end, so the loop back to the start is silent
export const fadeAt = (t, total) => ss(t / FIN) * ss((total - t) / FOUT);

// ---- live playback in the preview ----
export function createDirector({ base, scenes }) {
  const url = p => new URL(p, base).href, toPlay = playbackMap(scenes), TOTAL = JSON.parse(scenes).reduce((s, c) => s + c.dur, 0);
  const S = { vo: true, mus: true, musLevel: 0.6, duck: 0.65, needsGesture: false, clips: 0, sheet: [] };
  const subs = new Set(), emit = () => subs.forEach(f => f(S)), clips = {}, asked = new Set();
  let ctx = null, voBus = null, musBus = null, cur = null, done = -1, sched = [], spans = [], key = '', logged = '', lastTime = null, score = null, bed = null;
  const dec = new OfflineAudioContext(1, 1, SR);
  const manifest = fetch(url('assets/vo/manifest.json')).then(r => r.ok ? r.json() : null).catch(() => null);
  // fetch only the clips this video's lines use
  function want(lines) {
    manifest.then(m => {
      if (!m) return;
      // a later entry for the same text is a newer take and replaces the earlier one
      const pick = new Map();
      for (const l of m.lines) if (lines.some(x => x.text === l.text)) pick.set(l.text, l);
      for (const l of pick.values()) {
        if (asked.has(l.id)) continue;
        asked.add(l.id);
        fetch(url('assets/vo/' + (l.file || l.id + '.wav'))).then(r => r.ok ? r.arrayBuffer() : null).then(ab => ab ? dec.decodeAudioData(ab) : null)
          .then(b => { if (b) { clips[l.text] = b; key = ''; S.clips++; emit(); } }).catch(() => { });
      }
    });
  }
  (async () => {
    await new Promise(r => setTimeout(r, 60));
    const c = await renderScore(() => new Promise(r => setTimeout(r, 0)));
    const b = new AudioBuffer({ length: c.L.length, sampleRate: SR, numberOfChannels: 2 });
    b.copyToChannel(c.L, 0); b.copyToChannel(c.R, 1); score = b;
  })().catch(e => console.error('music bed', e));
  function ensure() {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const lim = ctx.createDynamicsCompressor(); lim.threshold.value = -8; lim.ratio.value = 8; lim.attack.value = 0.003; lim.release.value = 0.2; lim.connect(ctx.destination);
    voBus = ctx.createGain(); voBus.connect(lim); musBus = ctx.createGain(); musBus.gain.value = 0; musBus.connect(lim);
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
  // the bed: one looping source, its place read off the timeline; a scrub, the video looping or drift restarts it in place
  function stopBed() {
    if (!bed) return;
    const t = ctx.currentTime, m = bed; bed = null;
    m.g.gain.cancelScheduledValues(t); m.g.gain.setValueAtTime(m.g.gain.value, t); m.g.gain.setTargetAtTime(0, t, 0.06);
    try { m.src.stop(t + 0.5); } catch (e) { }
  }
  function startBed(time) {
    const at = ctx.currentTime + 0.02, src = ctx.createBufferSource(), g = ctx.createGain(), D = score.duration;
    src.buffer = score; src.loop = true; src.loopStart = 0; src.loopEnd = D; src.connect(g); g.connect(musBus);
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(1, at + 0.25);
    src.start(at, ((time % D) + D) % D);
    bed = { src, g, t0: at - time };
  }
  return {
    state: S,
    subscribe(f) { subs.add(f); f(S); return () => subs.delete(f); },
    set(o) { Object.assign(S, o); if (ctx) { if (!S.vo) stopVoice(); if (!S.mus) stopBed(); } emit(); },
    resume() { ensure(); return ctx.resume().then(() => { S.needsGesture = false; emit(); }); },
    // lines: [{ who, text, at, end }] in authored time, at = when the line appears, end = when it leaves the screen
    update({ time, playing, lines }) {
      const k2 = lines.map(l => l.at.toFixed(2) + '-' + l.end.toFixed(2)).join(',') + '|' + S.clips;
      if (k2 !== key) {
        key = k2; want(lines);
        const sheet = cueSheet(lines, toPlay);
        sched = voiceSchedule(lines, clips, toPlay); spans = dipSpans(sheet, sched);
        const log = JSON.stringify(sheet);
        if (log !== logged) { logged = log; S.sheet = sheet; window.LPA_DIALOGUE = sheet; console.info('LPA dialogue', log); }
      }
      const jump = lastTime != null && Math.abs(time - lastTime) > 0.6; lastTime = time;
      if (!playing) {
        if (ctx) { stopVoice(); stopBed(); musBus.gain.setTargetAtTime(0, ctx.currentTime, 0.05); }
        if (S.needsGesture) { S.needsGesture = false; emit(); }
        return;
      }
      ensure();
      if (ctx.state !== 'running') { ctx.resume().catch(() => { }); if (!S.needsGesture) { S.needsGesture = true; emit(); } return; }
      if (S.needsGesture) { S.needsGesture = false; emit(); }
      const now = ctx.currentTime;
      let k = -1; for (let i = 0; i < sched.length; i++) if (time >= sched[i].s && time < sched[i].s + sched[i].d) { k = i; break; }
      if (!S.vo) k = -1;
      if (jump || k !== done) done = -1;
      if (cur && (k !== cur.i || Math.abs((now - cur.t0) - (time - sched[k].s)) > 0.3)) stopVoice();
      if (k >= 0 && !cur && k !== done && time - sched[k].s < sched[k].d - 0.08) startVoice(k, time - sched[k].s);
      if (S.mus && score) {
        if (bed && (jump || Math.abs(now - bed.t0 - time) > 0.3)) stopBed();
        if (!bed) startBed(time);
      } else if (bed) stopBed();
      musBus.gain.setTargetAtTime(S.mus ? S.musLevel * fadeAt(time, TOTAL) * (1 - (S.vo ? S.duck : 0) * dipAt(time, spans)) : 0, now, 0.05);
    }
  };
}
