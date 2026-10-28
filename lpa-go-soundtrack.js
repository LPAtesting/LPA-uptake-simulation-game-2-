// LPA GO! soundtrack: the 31 loops and 9 stings from the LPA GO Music repo, as 16-bit stereo
// WAV at 24 kHz in assets/music. The game names the loop it wants every frame (or null for
// silence); this loads it on demand, crossfades to it and loops it seamlessly. Stings play once
// over the loop, which ducks under them. Cue names are the game's own ids: rooms, mini-games, sports.

const LOOPS = {
  title: '01-title', morning: '02-morning', tenang: '03-tenang', evening: '04-evening', night: '05-night',
  kopitiam: '06-kopitiam', hawker: '07-hawker', mart: '08-minimart', library: '09-library', cc: '10-cc',
  depot: '11-boutique', council: '12-council', lawfirm: '13-lawfirm', hall: '14-hall', school: '15-school',
  doubt: '16-doubt', notebook: '17-notebook', news: '18-news', fate: '19-fate',
  mrt: '20-mrt', chope: '21-chope', scramble: '22-scramble', chop: '23-chop', tray: '24-tray', jetty: '25-jetty', reel: '26-reel',
  football: '27-football', basketball: '28-basketball', badminton: '29-badminton', legacy: '30-legacy', legacyQuiet: '31-legacyQuiet'
};
const STINGS = { booked: '32-booked', good: '33-good', okay: '34-okay', backfire: '35-backfire', win: '36-win', lose: '37-lose', catch: '38-catch', card: '39-card', newday: '40-newday' };
const STING_FILES = new Set(Object.values(STINGS));
// the title theme loops from bar 3: two bars of 4/4 at 132 bpm
const LOOP_FROM = { title: 2 * 240 / 132 };
// places pick up where they left off; games, events and the title start from the top
const RESUME = new Set(['morning', 'tenang', 'evening', 'night', 'kopitiam', 'hawker', 'mart', 'library', 'cc', 'depot', 'council', 'lawfirm', 'hall', 'school', 'doubt', 'notebook', 'jetty']);
// what usually comes next, fetched early so the switch is instant
const NEXT = { chope: 'scramble', jetty: 'reel' };
const FADE = 0.8, GAIN = 1.8, DUCK = 0.3, KEEP = 8, PREF = 'lpa-go-music';

export class Soundtrack {
  constructor(base) {
    this.base = base; this.bufs = new Map(); this.used = []; this.pos = {}; this.cur = null; this.cue = undefined; this.st = null;
    let on = true; try { on = localStorage.getItem(PREF) !== 'off'; } catch (e) { }
    this.on = on;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.out = this.ctx.createGain(); this.out.gain.value = on ? GAIN : 0; this.out.connect(this.ctx.destination);
    this.bus = this.ctx.createGain(); this.bus.connect(this.out);
    // browsers hold audio until the first key or tap; the tab going hidden pauses it
    this.sync = this.sync.bind(this);
    ['pointerdown', 'keydown', 'touchend'].forEach(t => window.addEventListener(t, this.sync, true));
    document.addEventListener('visibilitychange', this.sync);
    Object.values(STINGS).forEach(n => this.load(n));
  }
  sync() {
    const c = this.ctx; if (!c) return;
    clearTimeout(this.hold);
    if (this.on && !document.hidden) { if (c.state !== 'running') c.resume().catch(() => { }); }
    else if (c.state === 'running') this.hold = setTimeout(() => c.suspend().catch(() => { }), 120);
  }
  toggle() {
    this.on = !this.on; try { localStorage.setItem(PREF, this.on ? 'on' : 'off'); } catch (e) { }
    if (this.ctx) { this.out.gain.setTargetAtTime(this.on ? GAIN : 0, this.ctx.currentTime, 0.02); this.sync(); }
    return this.on;
  }
  dispose() {
    ['pointerdown', 'keydown', 'touchend'].forEach(t => window.removeEventListener(t, this.sync, true));
    document.removeEventListener('visibilitychange', this.sync); clearTimeout(this.hold);
    if (this.ctx) this.ctx.close().catch(() => { });
  }
  // ---- loading ----
  load(name) {
    let e = this.bufs.get(name);
    if (!e) {
      e = { buf: null };
      e.p = fetch(this.base + name + '.wav').then(r => { if (!r.ok) throw new Error(name + '.wav: HTTP ' + r.status); return r.arrayBuffer(); })
        .then(ab => this.pcm(ab) || this.ctx.decodeAudioData(ab))
        .then(b => (e.buf = b), err => { console.warn('music', err); return null; });
      this.bufs.set(name, e);
    }
    const i = this.used.indexOf(name); if (i >= 0) this.used.splice(i, 1); this.used.push(name);
    this.trim();
    return e.p;
  }
  // keep every sting and the last few loops decoded; the rest fall back to the HTTP cache
  trim() {
    const live = new Set([this.cue && LOOPS[this.cue], this.cur && LOOPS[this.cur.cue]]);
    let extra = this.used.filter(n => !STING_FILES.has(n)).length - KEEP;
    for (const n of this.used.slice()) {
      if (extra <= 0) break;
      if (STING_FILES.has(n) || live.has(n)) continue;
      this.bufs.delete(n); this.used.splice(this.used.indexOf(n), 1); extra--;
    }
  }
  // 16-bit PCM straight into a buffer at the file's own 24 kHz: half the memory of
  // decodeAudioData, which resamples to the device rate. Anything else goes to the browser.
  pcm(ab) {
    const v = new DataView(ab), L = ab.byteLength;
    if (L < 44 || v.getUint32(0) !== 0x52494646 || v.getUint32(8) !== 0x57415645) return null;
    let fmt = null;
    for (let at = 12; at + 8 <= L;) {
      const id = v.getUint32(at), size = v.getUint32(at + 4, true), body = at + 8;
      if (id === 0x666d7420) fmt = { tag: v.getUint16(body, true), ch: v.getUint16(body + 2, true), sr: v.getUint32(body + 4, true), bits: v.getUint16(body + 14, true) };
      else if (id === 0x64617461) {
        if (!fmt || fmt.tag !== 1 || fmt.bits !== 16) return null;
        const step = 2 * fmt.ch, n = Math.floor(Math.min(size, L - body) / step), b = this.ctx.createBuffer(fmt.ch, n, fmt.sr);
        for (let c = 0; c < fmt.ch; c++) { const d = b.getChannelData(c); for (let i = 0, o = body + c * 2; i < n; i++, o += step) d[i] = v.getInt16(o, true) / 32768; }
        return b;
      }
      at = body + size + (size & 1);
    }
    return null;
  }
  // ---- playing ----
  // Called every frame; only a change of cue does anything. cut drops the old loop dead.
  want(cue, cut) {
    if (cue === this.cue) return;
    this.cue = cue;
    if (!this.ctx) return;
    this.stop(cut ? 0.012 : FADE);
    if (!cue || !LOOPS[cue]) return;
    if (NEXT[cue]) this.load(LOOPS[NEXT[cue]]);
    this.load(LOOPS[cue]).then(buf => { if (buf && this.cue === cue && !this.cur) this.start(cue, buf, cut ? 0 : FADE); });
  }
  start(cue, buf, fade) {
    const c = this.ctx, now = c.currentTime, src = c.createBufferSource(), g = c.createGain(), from = LOOP_FROM[cue] || 0;
    src.buffer = buf; src.loop = true; src.loopStart = from; src.loopEnd = buf.duration;
    const at = RESUME.has(cue) ? this.pos[cue] || 0 : 0;
    g.gain.setValueAtTime(fade ? 0 : 1, now); if (fade) g.gain.linearRampToValueAtTime(1, now + fade);
    src.connect(g); g.connect(this.bus); src.start(now, at);
    this.cur = { cue, src, g, t0: now, at, from, len: buf.duration };
  }
  stop(fade) {
    const k = this.cur; if (!k) return; this.cur = null;
    const now = this.ctx.currentTime;
    if (RESUME.has(k.cue)) { let p = k.at + now - k.t0; if (p >= k.len) p = k.from + (p - k.from) % (k.len - k.from); this.pos[k.cue] = p; }
    k.g.gain.cancelScheduledValues(now); k.g.gain.setValueAtTime(k.g.gain.value, now); k.g.gain.linearRampToValueAtTime(0, now + fade);
    k.src.stop(now + fade + 0.02);
  }
  // A one-shot over the loop. Dropped if muted, or if it is not ready in time: late is worse than missing.
  sting(id) {
    const name = STINGS[id]; if (!name || !this.ctx || !this.on || this.ctx.state !== 'running') return;
    const asked = performance.now();
    this.load(name).then(buf => {
      if (!buf || performance.now() - asked > 400) return;
      const c = this.ctx, now = c.currentTime, src = c.createBufferSource(), g = c.createGain();
      if (this.st && this.st.end > now) { this.st.g.gain.setTargetAtTime(0, now, 0.015); this.st.src.stop(now + 0.1); }
      src.buffer = buf; src.connect(g); g.connect(this.out); src.start(now);
      const b = this.bus.gain, end = now + buf.duration;
      this.st = { src, g, end };
      b.cancelScheduledValues(now); b.setValueAtTime(b.value, now); b.linearRampToValueAtTime(DUCK, now + 0.08);
      b.setValueAtTime(DUCK, Math.max(now + 0.1, end - 0.6)); b.linearRampToValueAtTime(1, end + 0.4);
    });
  }
}
