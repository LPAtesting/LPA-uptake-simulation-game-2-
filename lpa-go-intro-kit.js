// Assets and live mini-game footage for the LPA GO! intro video.
// Everything visible is returned as data URLs (a live <canvas> exports blank).
import * as A from './lpa-go-art.js';
import { logo, scene, clouds, bird } from './lpa-go-title.js';
let GAMES = null, CUTS = null;
import { NPCS, CARDS } from './lpa-go-script.js';
import * as SCRIPT from './lpa-go-script.js';

const EXTRA = {
  stanley: { hair: '#2b2220', skin: '#f1c9a5', shirt: '#f4f1ea', pants: '#3a3a3a', shoes: '#2b2220' },
  dinesh: { hair: '#1e1a1a', cap: '#2c9c8c', skin: '#8a5a3c', shirt: '#2c9c8c', pants: '#2f2f2f', shoes: '#2b2220', style: 'cap' },
  hafiz: { hair: '#1e1a1a', cap: '#2b2220', skin: '#b57a4e', shirt: '#e8a030', pants: '#3a3a3a', shoes: '#2b2220', style: 'cap' },
  desmond: { hair: '#3a3a3a', skin: '#f1c9a5', shirt: '#3e6fa8', pants: '#2f2f2f', shoes: '#2b2220' },
  wilson: { hair: '#4a4a4a', skin: '#f1c9a5', shirt: '#7a7a8a', pants: '#2b2220', shoes: '#2b2220', extra: 'chair' },
  thilaga: { hair: '#2b2220', skin: '#8a5a3c', shirt: '#a0408a', pants: '#a0408a', shoes: '#2b2220', style: 'bun' },
  pupilA: { hair: '#1e1a1a', skin: '#f1c9a5', shirt: '#f4f1ea', pants: '#2c5c9c', shoes: '#2b2220' },
  pupilB: { hair: '#2b2220', skin: '#b57a4e', shirt: '#f4f1ea', pants: '#2c5c9c', shoes: '#2b2220', style: 'long' },
  pupilC: { hair: '#3a2a25', skin: '#c98a5e', shirt: '#f4f1ea', pants: '#2c5c9c', shoes: '#2b2220', style: 'bun' },
  gymA: { hair: '#1e1a1a', skin: '#b57a4e', shirt: '#e8a030', pants: '#2f2f2f', shoes: '#f4f1ea' },
  gymB: { hair: '#2b2220', skin: '#f1c9a5', shirt: '#2c9c8c', pants: '#3a3a3a', shoes: '#f4f1ea', style: 'long' },
  jogger: { hair: '#1e1a1a', cap: '#d94f3d', skin: '#e8b98f', shirt: '#3e8fd0', pants: '#f4f1ea', shoes: '#2b2220', style: 'cap' },
  sweeper: { hair: '#8a8a8a', skin: '#b57a4e', shirt: '#7a7a8a', pants: '#3a3a3a', shoes: '#2b2220', style: 'bald' },
  taichiA: { hair: '#c9c9c9', skin: '#f1c9a5', shirt: '#f4f1ea', pants: '#f4f1ea', shoes: '#2b2220', style: 'bald' },
  taichiB: { hair: '#e0e0e0', skin: '#e8b98f', shirt: '#f4f1ea', pants: '#f4f1ea', shoes: '#2b2220', style: 'bun' },
  kidA: { hair: '#1e1a1a', skin: '#e8b98f', shirt: '#d94f3d', pants: '#2c5c9c', shoes: '#f4f1ea' },
  kidB: { hair: '#2b2220', cap: '#3e8fd0', skin: '#b57a4e', shirt: '#f8d048', pants: '#3a3a3a', shoes: '#f4f1ea', style: 'cap' },
  kidC: { hair: '#3a2a25', skin: '#f1c9a5', shirt: '#a0408a', pants: '#3a3a3a', shoes: '#f4f1ea', style: 'long' },
  vendorA: { hair: '#8a8a8a', skin: '#e8b98f', shirt: '#f4f1ea', pants: '#3a3a3a', shoes: '#2b2220', style: 'bald' },
  vendorB: { hair: '#4a3328', skin: '#f1c9a5', shirt: '#2c9c8c', pants: '#3a3a3a', shoes: '#2b2220', style: 'bun' },
  vendorC: { hair: '#1e1a1a', cap: '#d94f3d', skin: '#b57a4e', shirt: '#d94f3d', pants: '#2f2f2f', shoes: '#2b2220', style: 'cap' },
  vendorD: { hair: '#2b2220', skin: '#c98a5e', shirt: '#48a068', pants: '#3a3a3a', shoes: '#2b2220' },
  uncleA: { hair: '#c9c9c9', skin: '#e8b98f', shirt: '#f4f1ea', pants: '#6b6b6b', shoes: '#2b2220' },
  auntieA: { hair: '#4a4a4a', skin: '#f1c9a5', shirt: '#f06888', pants: '#4a4a55', shoes: '#2b2220', style: 'bun' },
  shopperA: { hair: '#6b4a2a', skin: '#f1c9a5', shirt: '#f8d048', pants: '#3e6fa8', shoes: '#f4f1ea', style: 'long' },
  librarian: { hair: '#2b2220', skin: '#e8b98f', shirt: '#2c5c9c', pants: '#3a3a3a', shoes: '#2b2220', style: 'bun' },
  receptionist: { hair: '#3a2a25', skin: '#f1c9a5', shirt: '#c46a8a', pants: '#3a3a3a', shoes: '#2b2220', style: 'long' },
  seamstress: { hair: '#7a4f8a', skin: '#c98a5e', shirt: '#7a4f8a', pants: '#3a3a55', shoes: '#2b2220', style: 'scarf' },
  customerA: { hair: '#1e1a1a', skin: '#b57a4e', shirt: '#7a8a5a', pants: '#2f2f2f', shoes: '#2b2220' },
  officerA: { hair: '#2b2220', skin: '#f1c9a5', shirt: '#3e6fa8', pants: '#3a3a3a', shoes: '#2b2220', style: 'long' },
  officerB: { hair: '#4a4a4a', skin: '#e8b98f', shirt: '#f4f1ea', pants: '#2f2f2f', shoes: '#2b2220' },
  officerC: { hair: '#1e1a1a', skin: '#8a5a3c', shirt: '#48a068', pants: '#3a3a3a', shoes: '#2b2220', style: 'bun' },
  officerD: { hair: '#3a2a25', skin: '#c98a5e', shirt: '#c46a8a', pants: '#3a3a3a', shoes: '#2b2220', style: 'scarf' },
  cleaner: { hair: '#8a8a8a', skin: '#b57a4e', shirt: '#3e8fd0', pants: '#3a3a3a', shoes: '#2b2220', style: 'cap', cap: '#3e8fd0' }
};
Object.keys(EXTRA).forEach(k => { if (!A.CHARS[k]) A.CHARS[k] = EXTRA[k]; });
// Andy over the years, for the capacity scene
const AGED = {
  andy45: { hair: '#4a4444', skin: '#e0b088', shirt: '#b8503f', pants: '#2f2f2f', shoes: '#3a3a3a' },
  andy68: { hair: '#a0a0a0', skin: '#d8a880', shirt: '#7a8a9a', pants: '#4a4a55', shoes: '#2b2220', style: 'bald' },
  andy82: { hair: '#e6e6e6', skin: '#d0a078', shirt: '#e5e0d0', pants: '#6b6b6b', shoes: '#2b2220', style: 'bald', extra: 'chair' }
};
Object.keys(AGED).forEach(k => { A.CHARS[k] = AGED[k]; });
const CHAIR = ['..oGGGGGGGGGGo..', '.oGgGGGGGGGGgGo.', 'oGGoGGGGGGGGoGGo', 'oGGoGGGGGGGGoGGo', '.oGGoooooooGGGo.', '..oo........oo..'];

// ---- sprites, as the game builds them ----
const SP = {};
function rowsFor(d, mouth) {
  const body = A.charRows(d).map(s => s.split(''));
  if (mouth != null) A.charFace(d, mouth).forEach((r, y) => { body[y] = r.split(''); });
  if (d.extra === 'chair') CHAIR.forEach((r, i) => { body[18 + i] = r.split(''); });
  return body;
}
function build(rows, pal) { const P = new A.Px(16, 24); P.stamp(rows.map(a => a.join('')), pal, 0, 0); return P.c; }
export function sprite(name) {
  if (SP[name]) return SP[name];
  const d = A.CHARS[name] || A.CHARS.uncleA;
  const pal = Object.assign(A.charPal(d), { G: '#5a5e6a', g: '#8a8e9a', X: '#7a2a30' });
  const rows = rowsFor(d);
  const step = rows.map(a => a.slice()); if (d.extra !== 'chair') for (let y = 22; y < 24; y++) for (let x = 0; x < 8; x++) step[y][x] = '.';
  const back = rows.map(a => a.slice()); for (let y = 7; y <= 11; y++) for (let x = 0; x < 16; x++) if ('swem'.includes(back[y][x])) back[y][x] = 'H';
  const backStep = back.map(a => a.slice()); if (d.extra !== 'chair') for (let y = 22; y < 24; y++) for (let x = 0; x < 8; x++) backStep[y][x] = '.';
  return SP[name] = { f0: build(rows, pal), f1: build(step, pal), b0: build(back, pal), b1: build(backStep, pal) };
}
// Lisa as the host: [walk frame][mouth] data URLs
function hostFrames(name) {
  const d = A.CHARS[name], pal = Object.assign(A.charPal(d), { X: '#7a2a30' });
  return [0, 1].map(w => [0, 1, 2].map(m => {
    const r = rowsFor(d, m);
    if (w) for (let y = 22; y < 24; y++) for (let x = 0; x < 8; x++) r[y][x] = '.';
    return build(r, pal).toDataURL();
  }));
}

// Lisa at double resolution: scale2x on the letter grid, 1px outlines, drawn eyes, blush, ID card and posable arms.
// Returns frames[pose][walk][mouth][blink] as data URLs, 44x48 (6px pad each side).
const HD_POSES = {
  idle: {}, present: { r: [[24, 33], [29, 33], [33, 29]] }, point: { r: [[24, 33], [30, 29], [31, 20]] },
  wave0: { r: [[24, 33], [29, 31], [30, 22]] }, wave1: { r: [[24, 33], [29, 31], [34, 23]] },
  cheer: { r: [[24, 33], [29, 28], [31, 20]], l: [[7, 33], [2, 28], [0, 20]] },
  push: { r: [[24, 32], [31, 31], [36, 30]] }, hip: { r: [[24, 33], [30, 36], [26, 40]], l: [[7, 33], [1, 36], [5, 40]] },
  kick: { leg: [[21, 41], [28, 42], [35, 40]] }, think: { r: [[24, 33], [27, 34], [22, 28]] }
};
function scale2x(g) {
  const h = g.length, w = g[0].length, at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h) ? '.' : g[y][x];
  const o = Array.from({ length: h * 2 }, () => Array(w * 2).fill('.'));
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const E = at(x, y), B = at(x, y - 1), D = at(x - 1, y), F = at(x + 1, y), H = at(x, y + 1);
    o[2 * y][2 * x] = D === B && B !== F && D !== H ? D : E;
    o[2 * y][2 * x + 1] = B === F && B !== D && F !== H ? F : E;
    o[2 * y + 1][2 * x] = D === H && D !== B && H !== F ? D : E;
    o[2 * y + 1][2 * x + 1] = H === F && D !== H && B !== F ? F : E;
  }
  return o;
}
function thin(g) {
  const h = g.length, w = g[0].length;
  let a = g.map(r => r.slice());
  for (let y = 0; y < h; y++) for (let x = 1; x < w - 1; x++) if (g[y][x] === 'o' && g[y][x + 1] === 'o' && g[y][x - 1] !== 'o') a[y][x] = g[y][x - 1];
  const b = a.map(r => r.slice());
  for (let y = 1; y < h - 1; y++) for (let x = 0; x < w; x++) if (a[y][x] === 'o' && a[y + 1][x] === 'o' && a[y - 1][x] !== 'o') b[y][x] = a[y - 1][x];
  return b;
}
function hostHD(name, noCard) {
  const d = A.CHARS[name], PX = 6, W = 44, H = 48;
  const pal = Object.assign(A.charPal(d), { X: '#7a2a30', E: '#1a1a1c', W: '#ffffff', B: '#ee9884', R: '#e2707a', m: '#b87a5c', a: '#c8963c', c: '#fffaf0' });
  const out = {};
  Object.keys(HD_POSES).forEach(pk => {
    const pose = HD_POSES[pk];
    out[pk] = [0, 1].map(walk => [0, 1, 2].map(mouth => [0, 1].map(blink => {
      const r = rowsFor(d);
      for (let x = 4; x <= 11; x++) if (r[12][x] === 'm') r[12][x] = 's';
      if (walk) for (let y = 22; y < 24; y++) for (let x = 0; x < 8; x++) r[y][x] = '.';
      if (pose.r) { for (let y = 16; y <= 18; y++) { r[y][12] = 'o'; r[y][13] = '.'; } r[15][13] = '.'; }
      if (pose.l) for (let y = 16; y <= 18; y++) { r[y][3] = 'o'; r[y][2] = '.'; }
      if (pose.leg) { for (let y = 21; y <= 23; y++) for (let x = 9; x <= 12; x++) r[y][x] = '.'; r[21][9] = 'o'; }
      if (pose.back) { for (let y = 1; y <= 12; y++) for (let x = 0; x < 16; x++) if ('smewXyH'.includes(r[y][x]) && r[y][x] !== '.') r[y][x] = y > 2 && y % 3 === 0 && x > 3 && x < 12 && x % 4 === 1 ? 'h' : 'H'; for (let y = 13; y <= 17; y++) for (let x = 0; x < 16; x++) if (r[y][x] === 'y') r[y][x] = 'T'; }
      let g = thin(scale2x(r)).map(row => Array(PX).fill('.').concat(row, Array(W - PX - row.length).fill('.')));
      const put = (x, y, c) => { x += PX; if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
      if (!pose.back) [8, 20].forEach(ex => {
        const rows = blink ? ['ssss', 'ssss', 'EEEE', 'ssss'] : ['sEEs', 'EWEE', 'EEEE', 'sEEs'];
        rows.forEach((row, j) => row.split('').forEach((c, i) => put(ex + i, 18 + j, c)));
      });
      if (!pose.back) for (let y = 24; y <= 26; y++) for (let x = 12; x <= 23; x++) if (g[y][x + PX] !== 'o' && g[y][x + PX] !== '.') put(x, y, 's');
      if (!pose.back) [[['m..m', '.mm.'], 16], [['XXXX', '.XX.'], 16], [['XXXXXX', 'XRRRRX', '.XXXX.'], 15]][mouth][0].forEach((row, j) => row.split('').forEach((c, i) => { if (c !== '.') put([14, 14, 13][mouth] + i, 24 + j, c); }));
      if (!pose.back) [[8, 23], [9, 23], [22, 23], [23, 23]].forEach(([x, y]) => put(x, y, 'B'));
      if (!pose.back && !noCard) ['oooo', 'oaao', 'occo', 'oooo'].forEach((row, j) => row.split('').forEach((c, i) => put(14 + i, 32 + j, c)));
      ['r', 'l', 'leg'].forEach(side => {
        const pts = pose[side]; if (!pts) return;
        const isLeg = side === 'leg', R2 = isLeg ? 4.2 : 1.7;
        const P = new Set(), paint = (x, y, c) => { put(x, y, c); P.add((x + PX) + ',' + y); };
        let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        let run = 0;
        for (let i = 1; i < pts.length; i++) {
          const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay), n = Math.ceil(L * 3);
          for (let k = 0; k <= n; k++) {
            const t = k / n, cx = ax + (bx - ax) * t, cy = ay + (by - ay) * t, f = (run + L * t) / total, c = isLeg ? (f > 0.78 ? 'k' : 'P') : f < 0.32 ? 'T' : 's';
            for (let y = Math.floor(cy - 2); y <= cy + 2; y++) for (let x = Math.floor(cx - 2); x <= cx + 2; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= R2) paint(x, y, c);
          }
          run += L;
        }
        const [hx, hy] = pts[pts.length - 1];
        for (let y = hy - 3; y <= hy + 3; y++) for (let x = hx - 3; x <= hx + 3; x++) if ((x - hx) ** 2 + (y - hy) ** 2 <= (isLeg ? 5 : 3.2)) paint(x, y, isLeg ? 'k' : 's');
        const edge = [];
        P.forEach(k => { const [x, y] = k.split(',').map(Number); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H || P.has(X + ',' + Y)) return; if (g[Y][X] === '.' || Y < 28 || isLeg) edge.push([X, Y]); }); });
        edge.forEach(([x, y]) => { g[y][x] = 'o'; });
      });
      const Pc = new A.Px(W, H); Pc.stamp(g.map(a => a.join('')), pal, 0, 0);
      return Pc.c.toDataURL();
    })));
  });
  return out;
}

// ---- title vista, without the baked-in Lisa so the live one can leave it ----
function titleScene() {
  const L = A.CHARS.lisa, orig = A.Px.prototype.stamp;
  A.Px.prototype.stamp = function (rows, pal, x, y) { if (pal && pal.H === L.hair && pal.P === L.pants && pal.T === L.shirt) return; return orig.call(this, rows, pal, x, y); };
  let P; try { P = scene(576, 432); } finally { A.Px.prototype.stamp = orig; }
  const ox = Math.round((576 - 480) / 2), oy = 432 - 320;
  return { url: P.url(), w: 576, h: 432, lisa: { x: ox + 116, y: oy + 258 } };
}

// ---- a wide strip of Tenang for the pan ----
function townStrip() {
  const W = 1400, H = 300, P = new A.Px(W, H);
  A.grass(P, 0, 0, W, H);
  A.forestRow(P, -8, -8, W); A.forestRow(P, 8, 0, W);
  const sand = new A.Mask(W, H); sand.rect(0, 236, 440, 20); sand.rect(196, 226, 20, 74); sand.draw(P, A.SAND, '#c8ae70');
  const pav = new A.Mask(W, H); pav.rect(430, 222, W - 430, 16); pav.rect(430, 270, W - 430, 30); pav.draw(P, A.PAVE, '#a09c8c');
  A.roadH(P, 430, 238, W - 430, 32);
  A.zebraV(P, 700, 238, 12, 32); A.zebraV(P, 1110, 238, 12, 32);
  A.lawn(P, 20, 110, 140, 40); A.flowers(P, 24, 112, 132, 36, 10);
  A.plots(P, 250, 100, 120, 40); A.fenceH(P, 250, 140, 120);
  A.house(P, 20, 168, A.HP2); A.house(P, 100, 172, A.HP1); A.house(P, 226, 170, A.HP4); A.house(P, 312, 174, A.HP3);
  A.well(P, 176, 256); A.coop(P, 380, 196); A.clothesline(P, 30, 262, 60);
  A.pond(P, 120, 280, 40, 12);
  A.tree(P, 84, 176); A.tree(P, 206, 150); A.tree(P, 292, 180); A.tree(P, 404, 150, 'palm');
  A.cc(P, 444, 150);
  A.kopitiam(P, 574, 170); A.mart(P, 670, 178);
  A.hdb(P, 744, 120, 56, 12, A.HB1); A.hdb(P, 810, 106, 50, 14, A.HB2);
  A.hawker(P, 880, 182);
  A.mrtExit(P, 994, 206);
  A.sportsHall(P, 1036, 176);
  A.schoolBlock(P, 1120, 140);
  A.hdb(P, 1236, 120, 56, 12, A.HB3); A.hdb(P, 1304, 136, 50, 10, A.HB1);
  A.tree(P, 1370, 180); A.tree(P, 1024, 150, 'rain');
  [470, 560, 660, 760, 860, 980, 1100, 1220, 1340].forEach(x => A.lamp(P, x, 244 + 30));
  A.busStop(P, 1180, 274);
  A.bench(P, 520, 282); A.bench(P, 900, 282);
  A.fountain(P, 610, 262);
  A.chr(P, 'fauzi', 154, 238); A.chr(P, 'gekNeo', 300, 244); A.chr(P, 'nadia', 486, 226); A.chr(P, 'danial', 504, 228);
  A.chr(P, 'meiLing', 690, 224); A.chr(P, 'suzanne', 800, 276); A.chr(P, 'carol', 940, 276); A.chr(P, 'andy', 1070, 226); A.chr(P, 'weeKiat', 1150, 276); A.chr(P, 'sarojini', 1290, 226);
  const labels = [
    { x: 190, y: 150, t: 'Kampung' }, { x: 500, y: 140, t: 'Community Club' }, { x: 614, y: 160, t: 'Kopitiam' },
    { x: 800, y: 96, t: 'HDB blocks' }, { x: 928, y: 172, t: 'Hawker Centre' }, { x: 1006, y: 196, t: 'MRT' },
    { x: 1068, y: 166, t: 'Sports Hall' }, { x: 1168, y: 130, t: 'Tenang Primary' }
  ];
  return { url: P.url(), w: W, h: H, labels };
}

// ---- the encounter plate: a corner of the plaza, sprites added live ----
function plaza() {
  const W = 200, H = 150, P = new A.Px(W, H);
  const pav = new A.Mask(W, H); pav.rect(0, 0, W, H); pav.draw(P, A.PAVE, '#a09c8c');
  A.sportsHall(P, 68, 4);
  A.lawn(P, 8, 60, 44, 40); A.flowers(P, 10, 62, 40, 36, 5);
  A.tree(P, 14, 20); A.tree(P, 160, 60, 'rain'); A.bench(P, 150, 120); A.cooler(P, 40, 110); A.lamp(P, 176, 90); A.bin(P, 60, 118);
  return { url: P.url(), w: W, h: H };
}

// ---- live mini-games, seeded and driven by an autopilot ----
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function toward(k, me, tx, ty, dead) { const d = dead || 3, dx = tx - me.x, dy = ty - me.y; k.l = dx < -d; k.r = dx > d; k.u = dy < -d; k.d = dy > d; return Math.hypot(dx, dy); }
const TR_RACKS = [{ x: 508, y: 338 }, { x: 168, y: 334 }];
const PILOT = {
  mrt(s, k, G, api) {
    if (s.over) return;
    if (s.seat >= 0) { if (s.cue) G.action(s, api); Object.assign(k, { l: 0, r: 0, u: 0, d: 0 }); return; }
    const free = s.seats.filter(q => !q.who);
    if (!free.length) { Object.assign(k, { l: 0, r: 0, u: 0, d: 0 }); return; }
    const q = free.reduce((a, b) => Math.hypot(b.x - s.me.x, b.y - s.me.y) < Math.hypot(a.x - s.me.x, a.y - s.me.y) ? b : a);
    if (toward(k, s.me, q.x, q.y) < 30) G.action(s, api);
  },
  chope(s, k) {
    const live = 6 - s.round, tbl = s.tbl.slice(0, live);
    if (s.ph === 'music') { const a = s.t * 1.1; toward(k, s.me, 288 + Math.cos(a) * 120, 190 + Math.sin(a) * 70, 6); return; }
    if (s.ph === 'scramble' && !s.me.sat) {
      const free = tbl.filter(q => !q.by); if (!free.length) return;
      const g = free.reduce((a, q) => Math.hypot(q.x - s.me.x, q.y - s.me.y) < Math.hypot(a.x - s.me.x, a.y - s.me.y) ? q : a);
      toward(k, s.me, g.x, g.y + 14, 2); return;
    }
    Object.assign(k, { l: 0, r: 0, u: 0, d: 0 });
  },
  chop(s, k, G, api) {
    if (s.ph === 'graded') { s.pw = (s.pw || 0) + 1 / 30; if (s.pw > 2.2) { s.pw = 0; G.action(s, api); } k.l = k.r = 0; return; }
    const tgt = chopTarget(s, s.cuts.length + 1);
    const dx = tgt - s.cur;
    k.l = dx < -0.006; k.r = dx > 0.006; k.shift = Math.abs(dx) < 0.05;
    if (Math.abs(dx) <= 0.006) { s.hold = (s.hold || 0) + 1 / 30; if (s.hold > 0.25) { s.hold = 0; G.action(s, api); } }
  },
  tray(s, k, G, api) {
    if (s.over) return;
    const me = s.me;
    if (me.hold.length) { const rk = TR_RACKS.reduce((a, b) => Math.hypot(b.x - me.x, b.y - me.y) < Math.hypot(a.x - me.x, a.y - me.y) ? b : a); if (toward(k, me, rk.x, rk.y - 18) < 30) G.action(s, api); return; }
    const loose = s.trays.filter(q => q.st === 'loose');
    if (loose.length) { const q = loose[0]; if (toward(k, me, q.x, q.y + 12) < 24) G.action(s, api); return; }
    const ready = s.diners.filter(p => p.st === 'eat' && !p.rem && p.eat / p.span <= s.win);
    if (ready.length) { const p = ready[0]; if (toward(k, me, p.x, p.y + 10) < 26) G.action(s, api); return; }
    toward(k, me, 362, 300, 6);
  }
};
// equal-weight cut positions, nudged off the bone
function chopTarget(s, i) {
  const C = CUTS.CUTS[s.cut], tot = CUTS.area(C.f, 0, 1), want = i / s.n * tot;
  let lo = 0, hi = 1;
  for (let it = 0; it < 30; it++) { const m = (lo + hi) / 2; if (CUTS.area(C.f, 0, m) < want) lo = m; else hi = m; }
  let x = (lo + hi) / 2;
  if (CUTS.inBone(C, x)) { const z = C.bone.find(b => x > b[0] && x < b[1]); x = (x - z[0] < z[1] - x) ? z[0] - 0.004 : z[1] + 0.004; }
  return Math.min(0.95, Math.max(0.05, x));
}
export function gameSim(id, seed) {
  const G = GAMES[id], cv = document.createElement('canvas'); cv.width = 1152; cv.height = 768;
  const ctx = cv.getContext('2d');
  let st = null, lastF = -1, lastUrl = '', lastHud = null;
  const keys = { l: 0, r: 0, u: 0, d: 0, shift: 0 };
  const api = { keys, sprite, board: {}, save() { } };
  const withRand = (r, fn) => { const m = Math.random; Math.random = r; try { return fn(); } finally { Math.random = m; } };
  const reset = () => { const r = rng(seed); api.board = {}; Object.assign(keys, { l: 0, r: 0, u: 0, d: 0, shift: 0 }); st = { r, f: 0, s: withRand(r, () => G.init(api)) }; };
  return function frameAt(t) {
    const f = Math.max(0, Math.floor(t * 30));
    if (f === lastF) return { url: lastUrl, hud: lastHud };
    if (!st || f < st.f) reset();
    withRand(st.r, () => { while (st.f < f) { PILOT[id](st.s, keys, G, api); G.tick(st.s, 1 / 30, api); st.f++; } });
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, 1152, 768);
    ctx.imageSmoothingEnabled = false; ctx.setTransform(2, 0, 0, 2, 0, 0);
    withRand(st.r, () => G.draw(st.s, ctx, api));
    lastF = f; lastUrl = cv.toDataURL('image/jpeg', 0.86);
    try { lastHud = G.hud(st.s, api.board); } catch (e) { lastHud = null; }
    return { url: lastUrl, hud: lastHud };
  };
}

async function loadGames() {
  if (GAMES) return;
  const src = await (await fetch(new URL('lpa-go-games.js', document.baseURI).href)).text();
  const url = URL.createObjectURL(new Blob([src + '\nexport const __chop = { CUTS, area, inBone };\n'], { type: 'text/javascript' }));
  const m = await import(url); GAMES = m.GAMES; CUTS = m.__chop;
}
// the stage: a dithered daytime sky over a strip of kampung grass
function skyStage() {
  const W = 480, H = 270, P = new A.Px(W, H), ramp = ['#4f9edc', '#62ade2', '#77bce8', '#8ecae9', '#a2d6f0', '#b7e0f2', '#c9e7f5'], G = 236, band = G / ramp.length;
  for (let y = 0; y < G; y++) { const t = y / band, i = Math.min(ramp.length - 1, Math.floor(t)), f = t - i; for (let x = 0; x < W; x++) { let c = ramp[i]; if (f > 0.8 && i < ramp.length - 1 && (x + y) % 2 === 0) c = ramp[i + 1]; P.p(x, y, c); } }
  for (let x = -8; x < W; x += 15) A.tree(P, x, G - 18 + ((x * 7) % 5));
  A.grass(P, 0, G, W, H - G);
  const sand = new A.Mask(W, H); sand.rect(0, G + 22, W, 6); sand.draw(P, A.SAND, '#c8ae70');
  A.flowers(P, 0, G + 4, W, 14, 26);
  return P.url();
}
// a quiet classroom: beige wall, a window of sky, wooden floor
function room() {
  const W = 480, H = 270, P = new A.Px(W, H), O = A.O;
  for (let y = 0; y < 196; y++) P.r(0, y, W, 1, y % 2 ? '#eadfc6' : '#e8dcc2');
  for (let x = 0; x < W; x += 24) P.r(x, 12, 1, 172, '#e1d4b8');
  P.r(0, 0, W, 10, '#d8ccb0'); P.hl(0, 10, W, '#c4b696');
  for (let x = 40; x < W; x += 120) { P.r(x, 2, 44, 5, '#f6f0de'); P.box(x, 2, 44, 5, '#bfb295'); }
  // wainscot
  P.r(0, 172, W, 24, '#c9a878'); P.hl(0, 172, W, '#a88a5e'); P.hl(0, 173, W, '#dcc096'); P.hl(0, 195, W, '#8e7148');
  for (let x = 6; x < W; x += 30) P.box(x, 177, 24, 15, '#b8966a');
  // floor
  for (let y = 196; y < H; y++) P.r(0, y, W, 1, (Math.floor((y - 196) / 6) % 2) ? '#c7a67a' : '#bf9d70');
  for (let y = 196; y < H; y += 6) { P.hl(0, y, W, '#a9895e'); for (let x = ((y / 6) % 2) * 20; x < W; x += 40) P.r(x, y, 1, 6, '#a9895e'); }
  // window with frame and curtains (sky drawn live behind it)
  const wx = 14, wy = 30, ww = 84, wh = 80;
  P.g.clearRect(wx, wy, ww, wh);
  P.box(wx - 1, wy - 1, ww + 2, wh + 2, O); P.r(wx - 3, wy + wh + 1, ww + 6, 3, '#f6f0de'); P.box(wx - 3, wy + wh + 1, ww + 6, 3, '#bfb295');
  P.r(wx + ww / 2 - 1, wy, 2, wh, '#f6f0de'); P.r(wx, wy + wh / 2 - 1, ww, 2, '#f6f0de');
  [[wx - 8, 10], [wx + ww - 2, 10]].forEach(([cx, cw]) => { P.r(cx, wy - 4, cw, wh + 10, '#c98f6e'); for (let x = cx + 2; x < cx + cw; x += 3) P.r(x, wy - 4, 1, wh + 10, '#b27a5c'); P.box(cx, wy - 4, cw, wh + 10, '#8e5c44'); });
  P.r(wx - 12, wy - 7, ww + 24, 3, '#8a6a48');
  // wall clock
  // notice board on the right wall
  P.r(462, 60, 30, 70, '#b88a58'); P.box(462, 60, 30, 70, '#7a5a36');
  [[466, 66, '#f6f0de'], [468, 92, '#f3d28c'], [466, 112, '#cfe0ec']].forEach(([x, y, c]) => { P.r(x, y, 12, 14, c); P.p(x + 5, y + 1, '#c84848'); });
  // a plant and a row of desk backs on the floor
  A.potPlant(P, 110, 212); A.potPlant(P, 118, 214);
  return { url: P.url(), win: { x: wx, y: wy, w: ww, h: wh } };
}

// ---- sport: the game's own match and fishing code, run headless ----
let GC = null;
async function loadGameClass() {
  if (GC) return;
  const src = await (await fetch(new URL('LPA GO Game.dc.html', document.baseURI).href)).text();
  const m = src.match(/<script type="text\/x-dc" data-dc-script[^>]*>([\s\S]*?)<\/script>/);
  const perf = { t: 0, now() { return this.t * 1000; } };
  class Stub { constructor(p) { this.props = p || {}; } setState() { } forceUpdate() { } }
  const out = new Function('DCLogic', 'React', 'performance', m[1] + '\nreturn { Component, SPORTS, EXTRA_CHARS, FISH };')(Stub, window.React, perf);
  Object.keys(out.EXTRA_CHARS).forEach(k => { if (!A.CHARS[k]) A.CHARS[k] = out.EXTRA_CHARS[k]; });
  GC = Object.assign(out, { perf });
}
function sportPilot(id, o, k) {
  Object.assign(k, { l: 0, r: 0, u: 0, d: 0 });
  if (id === 'fishing') {
    const f = o.fs; if (!f || f.ph === 'fly' || f.ph === 'result') return;
    if (f.ph === 'cast') { const dx = f.sx - 12 - f.x, dy = f.sy - f.fy; k.l = dx < -3; k.r = dx > 3; k.u = dy < -3; k.d = dy > 3; return; }
    k.d = f.surge <= 0 && f.ten < 72; return;
  }
  const F = o.fb; if (!F || F.freeze > 0) return;
  const me = F.mine[0], b = F.ball, S = GC.SPORTS[id];
  let tx = b.x - 4, ty = b.y;
  if (id === 'badminton') { const L = o.mtLandPoint(F), mid = (S.X0 + S.X1) / 2; if (L.x < mid) { tx = L.x - 4; ty = L.y; } else { tx = S.X0 + (mid - S.X0) * 0.55; ty = (S.Y0 + S.Y1) / 2; } }
  else if (b.car && b.car !== me && b.car.side > 0) { tx = b.x + 40; ty = b.y + (b.y < (S.Y0 + S.Y1) / 2 ? 30 : -30); }
  const dx = tx - me.x, dy = ty - me.y; k.l = dx < -3; k.r = dx > 3; k.u = dy < -3; k.d = dy > 3;
}
export function sportSim(id, seed, opt) {
  const natRand = Math.random;
  const cv = document.createElement('canvas'); cv.width = 1152; cv.height = 768;
  let o = null, st = null, lastF = -1, lastUrl = '', lastHud = null, warned = false;
  const withRand = (r, fn) => { const mr = Math.random; Math.random = r; try { return fn(); } finally { Math.random = mr; } };
  const start = () => { if (id === 'fishing') o.startFish(); else o.startMatch(id); };
  const reset = () => {
    const r = rng(seed);
    o = new GC.Component({}); o.A = A; o.canvasRef = { current: cv }; o.g = { flags: {}, fish: null, tally: {}, mini: {} };
    o.setHint = () => { }; o.save = () => { }; o.setState = () => { };
    GC.perf.t = 0; st = { r, f: 0 };
    withRand(r, start);
    if (opt && opt.gag) {
      // the intro's gag: the first catch never reaches the pail, it leaves the screen instead
      const bite = o.fsBite.bind(o), stow = o.fsStow.bind(o), fly = o.fsFly.bind(o);
      let n = 0;
      o.fsBite = () => { bite(); const f = o.fs; if (n === 0 && f.fish && f.fish.junk) { const d = GC.FISH[f.ssp]; f.fish = { name: d.n, kg: +((d.min + d.max) / 2).toFixed(1), pull: d.pull, spec: d, L: d.L, col: d.col }; } };
      o.fsStow = () => { if (n === 0) { n = 1; const f = o.fs; if (o.g.fish) o.g.fish.count = Math.max(0, o.g.fish.count - 1); f.fly = null; f.ph = 'result'; f.wait = 1.8; f.msg = 'It got away'; f.msgT = 2.4; return; } stow(); };
      o.fsFly = (ctx, t) => { if (n) fly(ctx, t); };
    }
  };
  const frameAt = function (t) {
    const f = Math.max(0, Math.floor(t * 30));
    if (f === lastF) return { url: lastUrl, hud: lastHud };
    if (!st || f < st.f) reset();
    try {
      withRand(st.r, () => {
        while (st.f < f) {
          GC.perf.t = st.f / 30; sportPilot(id, o, o.keys);
          if (id === 'fishing') o.fsTick(1 / 30); else { o.fbTick(1 / 30); if (o.fb && o.fb.over) start(); }
          st.f++;
        }
        GC.perf.t = st.f / 30;
        if (id === 'fishing') o.fsDraw(); else o.fbDraw();
      });
    } catch (e) { if (!warned) { warned = true; console.error('sport sim', id, e); } }
    lastF = f; lastUrl = cv.toDataURL('image/jpeg', 0.86);
    if (id === 'fishing') { const fs = o.fs || {}, fc = o.g.fish; lastHud = { msg: fs.msg || '', score: (fc ? fc.count : 0) + ' landed' }; }
    else { const F = o.fb || {}; lastHud = { msg: F.msg || '', a: F.a || 0, b: F.b || 0 }; }
    return { url: lastUrl, hud: lastHud };
  };
  // when the first catch breaks the surface, and the game's own sprite for it
  frameAt.firstFly = () => {
    reset(); let fl = null;
    withRand(st.r, () => { while (st.f < 1800) { GC.perf.t = st.f / 30; sportPilot(id, o, o.keys); if (o.fs.ph === 'fight') withRand(natRand, () => o.fsDraw()); o.fsTick(1 / 30); st.f++; if (o.fs.ph === 'fly') { fl = o.fs.fly; break; } } });
    let res = null;
    if (fl && fl.item.spec) {
      const art = [0, 1, 2].map(fr => o.fishPix(fl.item.spec, fr));
      res = { t: st.f / 30, x: fl.x0, y: fl.y0, W: art[0].width, H: art[0].height, name: fl.item.name, art: art.map(c => c.toDataURL()) };
    }
    st = null; lastF = -1; return res;
  };
  return frameAt;
}

// ---- the live demo: the game's own overworld and dialogue, run headless and piloted ----
const phaseOfM = m => { const h = (m % 1440) / 60; return h >= 6 && h < 11 ? 'M' : h >= 11 && h < 15 ? 'D' : h >= 15 && h < 20 ? 'E' : 'N'; };
const DENC = [
  { time: 8 * 60 + 31, room: 'hawker', sel: [0, 1, 2, 1, 0] },
  { time: 21 * 60 + 4, room: null, sel: [0, 1, 0] },
  { time: 1440 + 18 * 60 + 22, room: 'hawker', sel: [0, 1, 2, 0] }
];
export const DEMO_CUTS = ['', 'Monday night · Blk 5 void deck', 'Tuesday evening · Hawker Centre'];
export function demoSim() {
  const cv = document.createElement('canvas'); cv.width = 1152; cv.height = 768;
  const port = document.createElement('canvas'); port.width = 112; port.height = 98;
  const o = new GC.Component({});
  let ver = 0;
  o.state = Object.assign({}, o.state, { screen: 'play' });
  o.setState = u => { Object.assign(o.state, typeof u === 'function' ? u(o.state) : u); ver++; };
  o.save = () => { }; o.canvasRef = { current: cv }; o.portRef = { current: port };
  o.A = A; o.S = SCRIPT; o.GM = { GAMES };
  GC.perf.t = 0;
  o.cars = ['#d84848', '#f0f0f0', '#3c88c0', '#e8a030'].map(c => ({ n: A.carSprite(c, 'n'), s: A.carSprite(c, 's'), e: A.carSprite(c, 'e'), w: A.carSprite(c, 'w') }));
  o.buildMap(); o.buildRooms(); o.icons = o.buildIcons(); o.portraits = {}; o.speakT = 0;
  const sp0 = o.sprite.bind(o), bc = () => { const c = document.createElement('canvas'); c.width = 16; c.height = 24; return c; };
  const blank = { f0: bc(), f1: bc(), b0: bc(), b1: bc(), url: '' };
  let hide = false; o.sprite = n => hide && n === 'lisa' ? blank : sp0(n);
  const def = SCRIPT.NPCS.find(n => n.id === 'dinesh');
  const withRand = (r, fn) => { const m = Math.random; Math.random = r; try { return fn(); } finally { Math.random = m; } };
  let st = null;
  const route = (room, goal, want, from) => {
    const G = o.grid(room), W = G.w, H = G.h, p = o.g.player, dist = new Int16Array(W * H).fill(-1), prev = new Int32Array(W * H).fill(-1);
    const g0 = goal[1] * W + goal[0], q = [g0]; dist[g0] = 0;
    while (q.length) {
      const c = q.shift(), x = c % W, y = (c / W) | 0; if (dist[c] >= want) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const k = ny * W + nx; if (dist[k] >= 0 || !o.free(nx, ny, p, room)) continue; dist[k] = dist[c] + 1; prev[k] = c; q.push(k); }
    }
    let best = g0, bs = -1e9, md = 0; for (let k = 0; k < W * H; k++) if (dist[k] > md) md = dist[k];
    for (let k = 0; k < W * H; k++) if (dist[k] === md) { const sc = -Math.abs(((k / W) | 0) - goal[1]) * 10 + Math.abs((k % W) - goal[0]); if (sc > bs) { bs = sc; best = k; } }
    if (from) { const fk = from[1] * W + from[0]; if (dist[fk] >= 0) best = fk; }
    const path = []; for (let k = best; k >= 0; k = prev[k]) path.push([k % W, (k / W) | 0]);
    return path;
  };
  const place = (path) => { const p = o.g.player, [x, y] = path[0]; p.tx = p.ttx = x; p.ty = p.tty = y; p.px = x * 16; p.py = y * 16; p.moving = false; if (path[1]) p.dir = path[1][0] > x ? 'r' : path[1][0] < x ? 'l' : path[1][1] > y ? 'd' : 'u'; };
  const setup = i => {
    const g = o.g, e = DENC[i], n = g.npcs.dinesh, p = g.player;
    st.i = i; g.time = e.time; g.hintT = 0; o.setState({ dlg: null, hint: '' });
    Object.assign(n, { cleared: i, met: i > 0, warm: true, coolUntil: -1, booked: false });
    Object.values(g.npcs).forEach(x => { x.vis = false; x.phase = null; });
    p.room = e.room; p.out = { tx: 58, ty: 19 };
    o.moveNpcs(0, phaseOfM(g.time)); n.wait = 1e9; n.dir = 'd';
    const side = [[-1, 0, 'r'], [1, 0, 'l'], [0, 1, 'u'], [0, -1, 'd']].find(([dx, dy]) => o.free(n.tx + dx, n.ty + dy, p, p.room)) || [0, 1, 'u'];
    st.goal = [n.tx + side[0], n.ty + side[1]]; st.face = side[2];
    st.path = route(p.room, st.goal, 6); place(st.path); st.stuck = 0;
  };
  const go = (ph, now) => { st.ph = ph; st.at = now; if (st.marks) st.marks.push([st.i, ph, now]); };
  const pilot = now => {
    const g = o.g, p = g.player, k = o.keys, d = o.state.dlg, u = now - st.at;
    Object.assign(k, { u: false, d: false, l: false, r: false, shift: false });
    if (st.ph === 'pre') { if (u > 0.7) go('walk', now); }
    else if (st.ph === 'walk') {
      const idx = st.path.findIndex(q => q[0] === p.ttx && q[1] === p.tty), nx = idx >= 0 ? st.path[idx + 1] : null, cur = st.path[idx];
      if (nx) { k[nx[0] > cur[0] ? 'r' : nx[0] < cur[0] ? 'l' : nx[1] > cur[1] ? 'd' : 'u'] = true; if (!p.moving) { st.stuck += 1 / 30; if (st.stuck > 0.8) { st.path = route(p.room, st.goal, 99, [p.tx, p.ty]); st.stuck = 0; } } else st.stuck = 0; }
      else if (!p.moving) { p.dir = st.face; go('face', now); }
    }
    else if (st.ph === 'face') { if (u > 0.4) { o.action(); if (!o.state.dlg) console.warn('demo: talk did not open'); go('open', now); } }
    else if (st.ph === 'open') { if (d && u > d.open.length / 17 + 1.4) go('menu', now); }
    else if (st.ph === 'menu') {
      const seq = DENC[st.i].sel, j = Math.min(seq.length - 1, Math.floor(u / 0.85));
      if (d && d.sel !== seq[j]) o.setState({ dlg: Object.assign({}, d, { sel: seq[j] }) });
      if (u > seq.length * 0.85 + 0.5) { o.action(); const op = def.enc[st.i].opts[0]; st.rd = (op.re.length + (op.lisa || '').length) / 17 + 2.0; go('react', now); }
    }
    else if (st.ph === 'react') { if (u > st.rd) { o.action(); go('after', now); } }
    else if (st.ph === 'after') { if (u > (st.i === 2 ? 5.5 : 2.6)) { if (st.i < 2) { st.did = false; go('cut', now); } else { go('end', now); st.endAt = now; } } }
    else if (st.ph === 'cut') { const v = u / 1.8; st.fade = Math.sin(Math.PI * Math.min(1, v)); if (v >= 0.5 && !st.did) { st.did = true; setup(st.i + 1); } if (v >= 1) { st.fade = 0; go('pre', now); } }
  };
  const reset = () => {
    const r = rng(33); GC.perf.t = 0;
    st = { r, f: 0, ph: 'pre', at: 0, i: 0, fade: 0 };
    withRand(r, () => { o.reset(false); o.state.screen = 'play'; o.keys = {}; o.speakT = 0; setup(0); });
  };
  const step = f => { withRand(st.r, () => { while (st.f < f) { const now = st.f / 30; GC.perf.t = now; pilot(now); o.tick(1 / 30); st.f++; } }); };
  const lisaAt = () => {
    const p = o.g.player, G = o.grid(p.room), mw = G.w * 16, mh = G.h * 16, SC = p.room ? 3 : 2, vw = Math.round(1152 / SC), vh = Math.round(768 / SC);
    const camX = mw <= vw ? -Math.floor((vw - mw) / 2) : Math.round(Math.max(0, Math.min(mw - vw, p.px + 8 - vw / 2)));
    const camY = mh <= vh ? -Math.floor((vh - mh) / 2) : Math.round(Math.max(0, Math.min(mh - vh, p.py + 12 - vh / 2)));
    return { x: (p.px + 8 - camX) * SC, feet: (p.py - camY + 16) * SC, sc: SC };
  };
  // dry run: how long the whole demo plays, and where Lisa stands at either end
  reset(); st.marks = [[0, 'pre', 0]]; const startLisa = lisaAt();
  while (st.ph !== 'end' && st.f < 30 * 200) step(st.f + 30);
  const total = st.endAt || st.f / 30, endLisa = lisaAt(), marks = st.marks;
  st = null;
  let lastKey = '', last = null, lastVer = -1, ui = null;
  const frameAt = (t, hideLisa) => {
    const f = Math.max(0, Math.floor(t * 30)), key = f + '|' + !!hideLisa;
    if (key === lastKey) return last;
    if (!st || f < st.f) { reset(); lastVer = -1; }
    try {
      step(f);
      hide = !!hideLisa;
      withRand(st.r, () => { GC.perf.t = st.f / 30; o.draw(); });
      hide = false;
      if (ver !== lastVer) { lastVer = ver; ui = o.renderVals(); }
    } catch (e) { console.error('demo sim', e); }
    const cut = st.ph === 'cut' ? (st.did ? st.i : st.i + 1) : 0;
    last = { url: cv.toDataURL('image/jpeg', 0.88), port: o.state.dlg ? port.toDataURL() : null, ui, fade: st.fade || 0, cut, lisa: lisaAt() };
    lastKey = key; return last;
  };
  frameAt.total = total; frameAt.startLisa = startLisa; frameAt.endLisa = endLisa; frameAt.marks = marks;
  console.log('demo sim total', total.toFixed(2));
  return frameAt;
}

// just what a host-led video needs: Lisa's HD host frames, the classroom set and its clouds
export function buildHostKit() {
  return { lisaHD: hostHD('lisa'), room: room(), clouds: clouds(480, 40).url() };
}
// neighbours at Lisa's HD size and poses (no staff card)
export function buildPeople(names) { const out = {}; names.forEach(n => { out[n] = hostHD(n, true); }); return out; }
// the void deck plaza in front of a kopitiam and an HDB block, 245x131, for scenes at 6x
export function plazaScene(W = 245, H = 131) {
  const P = new A.Px(W, H);
  const ramp = ['#4f9edc', '#62ade2', '#77bce8', '#8ecae9', '#a2d6f0', '#b7e0f2'], G = 72, band = G / ramp.length;
  for (let y = 0; y < G; y++) { const t = y / band, i = Math.min(ramp.length - 1, Math.floor(t)), f = t - i; for (let x = 0; x < W; x++) P.p(x, y, f > 0.8 && i < ramp.length - 1 && (x + y) % 2 === 0 ? ramp[i + 1] : ramp[i]); }
  A.forestRow(P, 40, -8, W);
  A.grass(P, 0, 60, W, 16);
  A.hdb(P, 150, 2, 60, 7, A.HB2);
  A.kopitiam(P, 10, 24);
  A.tree(P, 98, 44); A.tree(P, 226, 50, 'rain');
  const pav = new A.Mask(W, H); pav.rect(0, 76, W, H - 76); pav.draw(P, A.PAVE, '#a09c8c');
  A.lamp(P, 130, 50);
  A.bench(P, 106, 84); A.potPlant(P, 96, 82); A.potPlant(P, 136, 82);
  return { url: P.url(), w: W, h: H };
}

export async function buildKit() {
  await loadGames(); await loadGameClass();
  const lisaHost = hostFrames('lisa');
  const neighbours = NPCS.map(n => ({ id: n.id, name: n.name, age: n.age, job: n.job, doubts: n.doubts, url: sprite(n.id).f0.toDataURL() }));
  const andy = NPCS.find(n => n.id === 'andy');
  const andySp = sprite('andy');
  const kit = {
    lisaHost, lisaHD: hostHD('lisa'), title: titleScene(), sky: skyStage(), room: room(), clouds: clouds(480, 40).url(), birds: [bird(0).url(), bird(1).url()], logo: (() => { const P = logo(6); return { url: P.url(), w: P.w, h: P.h }; })(),
    town: townStrip(), plaza: plaza(), neighbours,
    andyAges: [[23, andySp.f0.toDataURL()], [45, sprite('andy45').f0.toDataURL()], [68, sprite('andy68').f0.toDataURL()], [82, sprite('andy82').f0.toDataURL()]],
    andy: { enc: andy.enc[0], done: andy.done, f0: andySp.f0.toDataURL(), f1: andySp.f1.toDataURL() },
    card: { id: 'C-02', t: CARDS['C-02'].t, s: CARDS['C-02'].s },
    sports: [['Football', 'School field · 3 v 3', 'kidA'], ['Basketball', 'Sports Hall · 3 v 3', 'andy'], ['Badminton', 'Sports Hall · 2 v 2 doubles', 'gymB'], ['Fishing', 'Tenang jetty · ten species', 'fauzi']].map(([n, d, c]) => ({ n, d, url: sprite(c).f0.toDataURL() })),
    sims: { mrt: gameSim('mrt', 11), chope: gameSim('chope', 7), chop: gameSim('chop', 5), tray: gameSim('tray', 3), football: sportSim('football', 21), basketball: sportSim('basketball', 9), badminton: sportSim('badminton', 4), fishing: sportSim('fishing', 17), fishGag: sportSim('fishing', 17, { gag: true }) },
    andyPhase: [['Morning', 'Sports Hall gym'], ['Midday', 'Sports Hall gym'], ['Evening', 'Ketapang Boutique'], ['Night', 'Sports Hall gym']]
  };
  try { kit.demoSim = demoSim(); } catch (e) { console.error('demo sim', e); kit.demoSim = null; }
  try { kit.fishGag = kit.sims.fishGag.firstFly(); } catch (e) { console.error('fish gag probe', e); kit.fishGag = null; }
  return kit;
}
