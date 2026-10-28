// AskLisa: Lisa at home. The intro's HD Lisa (a scale2x of her 16x24 game sprite) with home poses and props,
// her room in the LPA GO! pixel style, and createStage(), which runs the live scene on one low-res canvas.
// Room art is in room pixels (rp); Lisa's HD pixels are 2 rp, the same ratio the intro uses for host vs set.
import * as A from './lpa-go-art.js';
import { clouds as cloudStrip } from './lpa-go-title.js';

const O = A.O, mix = A.mix;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
export const HW = 64, HH = 48, PAD = 16, RP = 2;
// the original 272-rp room sits in the middle of a wider one so a desktop window still sees walls, not void
const OX = 104;
export const ROOM = { W: 480, H: 204, WB: 150, FY: 174 };
export const PLANT_CX = OX + 42, TALK_X = OX + 136, CHAIR_X = OX + 206, SEAT_Y = 146;
const RIM_Y = 162;
const WIN = { x: OX + 16, y: 40, w: 44, h: 54 };
const CLOCK = { x: OX + 136, y: 30, r: 8 };
const TABLE_X = OX + 244, LAMP = { x: TABLE_X + 16, y: 106 };
const STAND_TOP = ROOM.FY - 96, SIT_TOP = SEAT_Y - 74;

// ---------------------------------------------------------------- Lisa
const LISA = A.CHARS.lisa;
const PAL = Object.assign(A.charPal(LISA), {
  X: '#7a2a30', E: '#1a1a1c', W: '#ffffff', B: '#ee9884', R: '#e2707a', m: '#b87a5c', a: '#c8963c', c: '#fffaf0',
  G: '#c8963c', g: '#efcd88', d: '#8a5a14', u: '#fffaf0', U: '#d9cdb4', F: '#9a5c32',
  Q: '#2c8c80', L: '#62c2b2', q: '#1c5c54', l: '#f6eed8'
});
// arm polylines on the 32x48 HD body grid (shoulder, elbow, hand); props ride on the hand
export const POSES = {
  idle: {},
  present: { r: [[24, 33], [29, 33], [33, 29]] },
  point: { r: [[24, 33], [30, 29], [31, 20]] },
  wave0: { r: [[24, 33], [29, 31], [30, 22]] },
  wave1: { r: [[24, 33], [29, 31], [34, 23]] },
  cheer: { r: [[24, 33], [29, 28], [31, 20]], l: [[7, 33], [2, 28], [0, 20]] },
  hip: { r: [[24, 33], [30, 36], [26, 40]], l: [[7, 33], [1, 36], [5, 40]] },
  think: { r: [[24, 33], [27, 34], [22, 28]] },
  listen: { r: [[24, 33], [30, 29], [29, 21]] },
  shrug: { r: [[24, 33], [30, 35], [34, 31]], l: [[7, 33], [1, 35], [-3, 31]] },
  giggle: { r: [[24, 33], [25, 36], [20, 29]], l: [[7, 33], [6, 36], [11, 29]] },
  stretch: { r: [[24, 33], [29, 28], [31, 20]], l: [[7, 33], [2, 28], [0, 20]] },
  water: { r: [[24, 33], [27, 35], [24, 30]], prop: 'can', at: [24, 30] },
  sip: { r: [[24, 33], [26, 37], [22, 35]], prop: 'mug', at: [22, 35] },
  sipUp: { r: [[24, 33], [27, 33], [21, 28]], prop: 'mug', at: [21, 28] },
  read: { r: [[24, 33], [25, 38], [22, 36]], l: [[7, 33], [6, 38], [9, 36]], prop: 'book', at: [15, 36], under: true },
  pet: { r: [[24, 33], [30, 37], [34, 42]] }
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
  const h = g.length, w = g[0].length, a = g.map(r => r.slice());
  for (let y = 0; y < h; y++) for (let x = 1; x < w - 1; x++) if (g[y][x] === 'o' && g[y][x + 1] === 'o' && g[y][x - 1] !== 'o') a[y][x] = g[y][x - 1];
  const b = a.map(r => r.slice());
  for (let y = 1; y < h - 1; y++) for (let x = 0; x < w; x++) if (a[y][x] === 'o' && a[y + 1][x] === 'o' && a[y - 1][x] !== 'o') b[y][x] = a[y - 1][x];
  return b;
}
function limb(g, pts, put) {
  const P = new Set(), paint = (x, y, c) => { put(x, y, c); P.add((x + PAD) + ',' + y); };
  let total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let run = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay), n = Math.ceil(L * 3);
    for (let k = 0; k <= n; k++) {
      const t = k / n, cx = ax + (bx - ax) * t, cy = ay + (by - ay) * t, c = (run + L * t) / total < 0.32 ? 'T' : 's';
      for (let y = Math.floor(cy - 2); y <= cy + 2; y++) for (let x = Math.floor(cx - 2); x <= cx + 2; x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= 1.7) paint(x, y, c);
    }
    run += L;
  }
  const [hx, hy] = pts[pts.length - 1];
  for (let y = hy - 3; y <= hy + 3; y++) for (let x = hx - 3; x <= hx + 3; x++) if ((x - hx) ** 2 + (y - hy) ** 2 <= 3.2) paint(x, y, 's');
  const edge = [];
  P.forEach(k => {
    const [x, y] = k.split(',').map(Number);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= HW || Y >= HH || P.has(X + ',' + Y)) return; if (g[Y][X] === '.' || Y < 28) edge.push([X, Y]); });
  });
  edge.forEach(([x, y]) => { g[y][x] = 'o'; });
}
const MUG = ['ooooooo..', 'oFFFFFo..', 'ouuuuuooo', 'oGGGGGo.o', 'ouuuuuooo', 'oUuuuUo..', '.ooooo...'];
const BOOK = ['.llllll..llllll.', 'oooooooooooooooo', 'oLLLLLLoqLLLLLLo', 'oQQQQQQoqQQQQQQo', 'oQQQQQQoqQQgGQQo', 'oQQQQQQoqQQGGQQo', 'oQQQQQQoqQQQQQQo', 'oqqqqqqoqqqqqqqo', 'oooooooooooooooo'];
const rowsAt = (rows, ox, oy) => { const out = []; rows.forEach((row, j) => row.split('').forEach((c, i) => { if (c !== '.') out.push([ox + i, oy + j, c]); })); return out; };
// a brass watering can, tipped forward to pour: rasterised from a little local model so the tilt reads cleanly
const TILT = 0.6;
function canCells(hx, hy) {
  const co = Math.cos(TILT), si = Math.sin(TILT), out = [];
  const seg = (lx, ly, x0, y0, x1, y1) => { const vx = x1 - x0, vy = y1 - y0, t = clamp(((lx - x0) * vx + (ly - y0) * vy) / (vx * vx + vy * vy), 0, 1); return Math.hypot(lx - x0 - vx * t, ly - y0 - vy * t); };
  for (let y = -5; y <= 13; y++) for (let x = -11; x <= 13; x++) {
    const lx = x * co + y * si, ly = -x * si + y * co;
    let c = null;
    const body = lx >= -3.6 && lx <= 4.6 && ly >= 2.4 && ly <= 8.2 && !((lx < -2.9 || lx > 3.9) && (ly < 3.1 || ly > 7.5));
    if (body) c = ly < 3.9 ? 'g' : ly > 6.9 ? 'd' : lx < -1.9 ? 'g' : 'G';
    else if (seg(lx, ly, 3.6, 6.6, 9.4, 3.4) <= 0.85) c = 'G';
    else if (Math.hypot(lx - 10.1, ly - 3) <= 1.5) c = 'd';
    else { const hr = Math.hypot(lx - 0.5, ly - 2.4); if (ly < 2.6 && hr >= 1.5 && hr <= 2.5) c = 'd'; }
    if (c) out.push([hx + x, hy + y, c]);
  }
  const ex = 11.4, ey = 2.6;
  return { cells: out, exit: [hx + 0.5 + ex * co - ey * si, hy + 0.5 + ex * si + ey * co] };
}
function stampCells(g, cells, outline) {
  const own = new Set();
  cells.forEach(([x, y, c]) => { const X = x + PAD; if (X < 0 || y < 0 || X >= HW || y >= HH) return; g[y][X] = c; own.add(X + ',' + y); });
  if (outline) own.forEach(k => {
    const [X, Y] = k.split(',').map(Number);
    [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const x2 = X + dx, y2 = Y + dy; if (x2 < 0 || y2 < 0 || x2 >= HW || y2 >= HH || own.has(x2 + ',' + y2)) return; g[y2][x2] = 'o'; });
  });
}
const EYES = [['sEEs', 'EWEE', 'EEEE', 'sEEs'], ['ssss', 'ssss', 'EEEE', 'ssss'], ['ssss', 'sEEs', 'EssE', 'ssss'], ['ssss', 'EEEE', 'EWEE', 'sEEs']];
const MOUTHS = [[['m..m', '.mm.'], 14], [['XXXX', '.XX.'], 14], [['XXXXXX', 'XRRRRX', '.XXXX.'], 13], [['.XX.', 'XRRX', '.XX.'], 14]];
export const POINTS = {};
// legs: 0 stand, 1 step, 2/3 a swinging foot. mouth: 0 smile, 1 talk, 2 open, 3 'o'. eyes: 0 open, 1 shut, 2 happy, 3 down.
function buildFrame(name, legs, mouth, eyes) {
  const pose = POSES[name] || POSES.idle;
  const r = A.charRows(LISA).map(s => s.split(''));
  for (let x = 4; x <= 11; x++) if (r[12][x] === 'm') r[12][x] = 's';
  if (legs === 1) for (let y = 22; y < 24; y++) for (let x = 0; x < 8; x++) r[y][x] = '.';
  if (legs >= 2) { const x0 = legs === 2 ? 3 : 9; for (let x = x0; x < x0 + 4; x++) { r[21][x] = r[22][x]; r[22][x] = r[23][x]; r[23][x] = '.'; } }
  if (pose.r) { for (let y = 16; y <= 18; y++) { r[y][12] = 'o'; r[y][13] = '.'; } r[15][13] = '.'; }
  if (pose.l) for (let y = 16; y <= 18; y++) { r[y][3] = 'o'; r[y][2] = '.'; }
  const g = thin(scale2x(r)).map(row => Array(PAD).fill('.').concat(row, Array(HW - PAD - row.length).fill('.')));
  const put = (x, y, c) => { x += PAD; if (x >= 0 && y >= 0 && x < HW && y < HH) g[y][x] = c; };
  [8, 20].forEach(ex => EYES[eyes].forEach((row, j) => row.split('').forEach((c, i) => put(ex + i, 18 + j, c))));
  for (let y = 24; y <= 26; y++) for (let x = 12; x <= 23; x++) if (g[y][x + PAD] !== 'o' && g[y][x + PAD] !== '.') put(x, y, 's');
  const [mr, mx] = MOUTHS[mouth]; mr.forEach((row, j) => row.split('').forEach((c, i) => { if (c !== '.') put(mx + i, 24 + j, c); }));
  [[8, 23], [9, 23], [22, 23], [23, 23]].forEach(([x, y]) => put(x, y, 'B'));
  ['oooo', 'oaao', 'occo', 'oooo'].forEach((row, j) => row.split('').forEach((c, i) => put(14 + i, 32 + j, c)));
  let prop = null;
  if (pose.prop) {
    const [hx, hy] = pose.at;
    if (pose.prop === 'can') { const k = canCells(hx, hy); prop = { cells: k.cells, outline: true }; POINTS[name] = { exit: [k.exit[0] + PAD, k.exit[1]] }; }
    else if (pose.prop === 'mug') { prop = { cells: rowsAt(MUG, hx - 7, hy - 3) }; POINTS[name] = { mug: [hx - 4 + PAD, hy - 3] }; }
    else prop = { cells: rowsAt(BOOK, hx - 8, hy - 4) };
  }
  if (prop && pose.under) stampCells(g, prop.cells, prop.outline);
  ['r', 'l'].forEach(side => { if (pose[side]) limb(g, pose[side], put); });
  if (prop && !pose.under) stampCells(g, prop.cells, prop.outline);
  const P = new A.Px(HW, HH); P.stamp(g.map(a => a.join('')), PAL, 0, 0);
  return P.c;
}
const FR = new Map();
// small prop icons for buttons, drawn from the same pixels Lisa holds
export function propIcon(kind) {
  const raw = kind === 'can' ? canCells(0, 0).cells : rowsAt(kind === 'mug' ? MUG : BOOK, 0, 0);
  const xs = raw.map(c => c[0]), ys = raw.map(c => c[1]), x0 = Math.min(...xs) - 1, y0 = Math.min(...ys) - 1;
  const w = Math.max(...xs) - x0 + 2, h = Math.max(...ys) - y0 + 2, g = Array.from({ length: h }, () => Array(w).fill('.'));
  const own = new Set(); raw.forEach(([x, y, c]) => { g[y - y0][x - x0] = c; own.add((x - x0) + ',' + (y - y0)); });
  if (kind === 'can') own.forEach(k => { const [x, y] = k.split(',').map(Number); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < w && Y < h && !own.has(X + ',' + Y)) g[Y][X] = 'o'; }); });
  const P = new A.Px(w, h); P.stamp(g.map(a => a.join('')), PAL, 0, 0);
  return { url: P.url(), w, h };
}
export function lisaFrame(pose, legs = 0, mouth = 0, eyes = 0) {
  const k = pose + '|' + legs + mouth + eyes;
  let c = FR.get(k); if (!c) { c = buildFrame(pose, legs, mouth, eyes); FR.set(k, c); }
  return c;
}
['water', 'sip', 'sipUp'].forEach(p => lisaFrame(p));
// she waters from her right, mirrored, so the rose sits over the pot
const WATER_X = Math.round(PLANT_CX + 1 + 64 - (HW - POINTS.water.exit[0]) * RP);

// ---------------------------------------------------------------- the room
function wall(P) {
  const { W } = ROOM;
  for (let y = 0; y < 128; y++) P.r(0, y, W, 1, y % 2 ? '#eadfc6' : '#e8dcc2');
  for (let x = 10; x < W; x += 20) P.vl(x, 8, 119, '#e2d5b9');
  for (let y = 16; y < 122; y += 12) for (let x = 20; x < W; x += 20) P.p(x, y + ((x / 20) % 2) * 6, '#dccfb2');
  P.r(0, 0, W, 5, '#d8ccb0'); P.hl(0, 5, W, '#c4b696'); P.hl(0, 6, W, '#f4ecd8'); P.hl(0, 7, W, '#ddd0b4');
  P.r(0, 127, W, 21, '#c9a878'); P.hl(0, 127, W, '#8e7148'); P.hl(0, 128, W, '#e4c99e'); P.hl(0, 129, W, '#d4b486'); P.hl(0, 131, W, '#a88a5e');
  for (let x = 5; x + 22 < W; x += 27) { P.r(x, 134, 22, 11, '#c29f72'); P.box(x, 134, 22, 11, '#a88a5e'); P.hl(x + 1, 143, 20, '#d9bd92'); P.vl(x + 20, 135, 9, '#d9bd92'); }
  P.r(0, 146, W, 4, '#8e7148'); P.hl(0, 146, W, '#b4946a'); P.hl(0, 149, W, '#6e5636');
  P.r(0, 0, 2, 150, '#d2c4a6'); P.r(W - 2, 0, 2, 150, '#d2c4a6');
}
function floor(P) {
  const { W, H, WB } = ROOM;
  for (let y = WB; y < H; y++) P.r(0, y, W, 1, Math.floor((y - WB) / 7) % 2 ? '#c4a374' : '#bc9a6c');
  for (let k = 0; WB + k * 7 < H; k++) {
    const y = WB + k * 7; P.hl(0, y, W, '#a68558');
    for (let x = (k % 2) * 23 + 9; x < W; x += 46) P.vl(x, y + 1, 6, '#a68558');
    for (let x = (k * 13) % 29 + 3; x < W; x += 29) P.hl(x, y + 3, 3, '#caa97c');
  }
  P.hl(0, WB, W, '#7e6444'); P.hl(0, WB + 1, W, '#98784e');
}
function rug(P, x, y, w, h) {
  P.r(x, y, w, h, '#b85a48'); P.box(x, y, w, h, '#7c3a30');
  P.box(x + 2, y + 2, w - 4, h - 4, '#ecc77e'); P.r(x + 3, y + 3, w - 6, h - 6, '#a44e40');
  const cy = y + (h >> 1);
  for (let dx = x + 9; dx < x + w - 6; dx += 12) {
    for (let j = -4; j <= 4; j++) { const hw = 4 - Math.abs(j); P.p(dx - hw, cy + j, '#ecc77e'); P.p(dx + hw, cy + j, '#ecc77e'); }
    P.p(dx, cy, '#f6eed8');
  }
  for (let fx = x + 1; fx < x + w - 1; fx += 2) { P.p(fx, y - 1, '#efe4c8'); P.p(fx, y + h, '#efe4c8'); }
}
function windowFrame(P) {
  const { x, y, w, h } = WIN, C = '#f6f0de', S = '#cfc3a6';
  P.g.clearRect(x, y, w, h);
  P.r(x - 3, y - 3, w + 6, 3, C); P.r(x - 3, y + h, w + 6, 3, C); P.r(x - 3, y, 3, h, C); P.r(x + w, y, 3, h, C);
  P.box(x - 4, y - 4, w + 8, h + 8, O); P.hl(x - 3, y - 3, w + 6, '#fffaf0');
  P.hl(x, y, w, 'rgba(120,100,70,0.35)'); P.vl(x, y, h, 'rgba(120,100,70,0.25)');
  P.r(x + (w >> 1) - 1, y, 2, h, C); P.vl(x + (w >> 1) + 1, y, h, S);
  P.r(x, y + (h >> 1) - 1, w, 2, C); P.hl(x, y + (h >> 1) + 1, w, S);
  for (let i = 0; i < 9; i++) { P.p(x + 3 + i, y + 12 - i, 'rgba(255,255,255,0.38)'); P.p(x + 5 + i, y + 12 - i, 'rgba(255,255,255,0.2)'); P.p(x + (w >> 1) + 4 + i, y + h - 4 - i, 'rgba(255,255,255,0.22)'); }
  const sy = y + h + 4;
  P.r(x - 8, sy, w + 16, 4, C); P.box(x - 8, sy, w + 16, 4, O); P.hl(x - 7, sy + 1, w + 14, '#fffaf0'); P.hl(x - 7, sy + 2, w + 14, '#e8dcc2');
  P.hl(x - 7, sy + 4, w + 14, '#d6c8aa'); P.hl(x - 6, sy + 5, w + 12, '#e0d3b8');
}
function curtains(P) {
  const { x, y, w, h } = WIN, top = y - 8, bot = y + h + 18, tie = y + 36;
  [[x - 14, 1], [x + w + 4, -1]].forEach(([cx, side]) => {
    for (let yy = top; yy < bot; yy++) {
      const d = Math.abs(yy - tie), pinch = d < 9 ? Math.round((9 - d) * 0.45) : 0;
      const wd = 11 - pinch + (yy > tie ? Math.min(3, Math.floor((yy - tie) / 7)) : 0);
      const x0 = side > 0 ? cx : cx + 11 - wd;
      P.r(x0, yy, wd, 1, '#c98f6e');
      for (let fx = x0 + 2; fx < x0 + wd - 1; fx += 3) P.p(fx, yy, '#b27a5c');
      P.p(x0 + (side > 0 ? 1 : wd - 2), yy, '#dba584');
      P.p(x0, yy, '#8e5c44'); P.p(x0 + wd - 1, yy, '#8e5c44');
    }
    P.hl(side > 0 ? cx : cx + 11 - 14, bot, 14, '#8e5c44');
    const tx = side > 0 ? cx + 1 : cx + 3;
    P.r(tx, tie - 1, 7, 3, '#c8963c'); P.box(tx, tie - 1, 7, 3, '#8a5a14'); P.p(tx + 3, tie, '#efcd88');
  });
  P.r(x - 18, top - 3, w + 36, 2, '#8a6a48'); P.hl(x - 18, top - 3, w + 36, '#a8865e');
  [x - 20, x + w + 16].forEach(fx => { P.r(fx, top - 4, 4, 4, '#c8963c'); P.box(fx, top - 4, 4, 4, '#6a4a2a'); });
}
function picture(P, x, y) {
  P.p(x + 10, y - 3, O); P.p(x + 9, y - 2, O); P.p(x + 11, y - 2, O); P.p(x + 8, y - 1, O); P.p(x + 12, y - 1, O);
  P.r(x, y, 22, 18, '#8a5a30'); P.box(x, y, 22, 18, O); P.box(x + 1, y + 1, 20, 16, '#b07a48'); P.hl(x + 1, y + 1, 20, '#c89060');
  const ix = x + 3, iy = y + 3, iw = 16, ih = 12;
  P.r(ix, iy, iw, ih, '#a2d6f0'); P.r(ix, iy, iw, 3, '#8ecae9'); P.r(ix + 2, iy + 2, 2, 2, '#f8e070');
  for (let i = 0; i < iw; i++) { const hgt = Math.round(4 + 1.6 * Math.sin(i / 2.6)); P.vl(ix + i, iy + ih - hgt, hgt, i % 3 ? '#5cc45c' : '#46a84e'); }
  P.r(ix + 9, iy + 5, 5, 4, '#e8d8b0'); P.r(ix + 8, iy + 4, 7, 1, '#d8863c'); P.r(ix + 9, iy + 3, 5, 1, '#d8863c'); P.p(ix + 11, iy + 7, '#6a3a20'); P.p(ix + 11, iy + 8, '#6a3a20');
  P.box(ix - 1, iy - 1, iw + 2, ih + 2, '#5a3a20');
}
function clockFace(P) {
  const { x, y, r } = CLOCK;
  for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) {
    const d = Math.hypot(i, j);
    if (d <= r - 1.6) P.p(x + i, y + j, '#fffaf0'); else if (d <= r - 0.2) P.p(x + i, y + j, '#c8963c'); else if (d <= r + 0.8) P.p(x + i, y + j, O);
  }
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = Math.hypot(i, j); if (d > r - 1.6 && d <= r - 0.2 && i < 0 && j < 0) P.p(x + i, y + j, '#efcd88'); }
  [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(([dx, dy]) => P.p(x + dx * (r - 3), y + dy * (r - 3), '#8a8270'));
  P.hl(x - r + 2, y + r + 2, 2 * r - 3, '#ddd0b4');
}
function corkboard(P, x, y) {
  P.r(x, y, 26, 21, '#c49a64'); P.box(x, y, 26, 21, '#6e4e2e'); P.box(x + 1, y + 1, 24, 19, '#a87e4a');
  for (let i = 0; i < 34; i++) P.p(x + 2 + (i * 7) % 22, y + 2 + (i * 5) % 17, '#b48a56');
  [[x + 3, y + 3, 8, 9, '#f6f0de'], [x + 12, y + 3, 12, 8, '#efcd88'], [x + 4, y + 13, 9, 6, '#cfe0ec'], [x + 15, y + 12, 7, 7, '#f4c8d8']].forEach(([nx, ny, nw, nh, c], i) => {
    P.r(nx, ny, nw, nh, c); P.hl(nx + 1, ny + nh, nw, 'rgba(60,40,20,0.25)'); P.p(nx + (nw >> 1), ny + 1, '#c84848');
    if (i !== 1) for (let ly = ny + 3; ly < ny + nh - 1; ly += 2) P.hl(nx + 1, ly, nw - 3, '#b8ad98');
  });
  A.tiny(P, x + 13, y + 5, 'LPA', '#8a5a14');
}
function shelf(P, x, y, w) {
  let bx = x + 3;
  [[5, 14, '#c84848'], [4, 12, '#3c88c0'], [5, 15, '#2c8c80'], [3, 11, '#e8c27e'], [4, 13, '#6d4cb5'], [5, 12, '#d8863c']].forEach(([bw, bh, c]) => {
    P.r(bx, y - bh, bw, bh, c); P.box(bx, y - bh, bw, bh, O); P.vl(bx + 1, y - bh + 1, bh - 2, mix(c, 0.3, 'w')); P.hl(bx + 1, y - bh + 3, bw - 2, mix(c, 0.35, 'd')); bx += bw - 1;
  });
  const fx = bx + 4; P.r(fx, y - 11, 10, 11, '#c8963c'); P.box(fx, y - 11, 10, 11, O); P.r(fx + 2, y - 9, 6, 7, '#a2d6f0');
  P.r(fx + 3, y - 7, 2, 2, '#191a3a'); P.r(fx + 3, y - 5, 2, 3, '#c8d2d7'); P.r(fx + 5, y - 6, 2, 2, '#3a2a25'); P.r(fx + 5, y - 4, 2, 2, '#d94f3d');
  const px = x + w - 13;
  P.r(px, y - 7, 9, 7, '#c47a4e'); P.box(px, y - 7, 9, 7, O); P.hl(px + 1, y - 6, 7, '#e09a6a');
  A.ellipse(P, px + 4, y - 9, 5, 3, '#46a84e', '#2e7a3c', '#8ce07a');
  for (let k = 0; k < 3; k++) {
    const vx = px + 1 + k * 3;
    for (let j = 0; j < 9 + k * 6; j++) {
      const lx = vx + Math.round(Math.sin(j / 2 + k) * 1.2);
      P.p(lx, y + 3 + j, '#2e7a3c');
      if (j % 4 === 2) { P.p(lx - 1, y + 3 + j, '#62c85c'); P.p(lx + 1, y + 3 + j, '#46a84e'); }
    }
  }
  P.r(x, y, w, 3, '#8a5a30'); P.box(x, y, w, 3, O); P.hl(x + 1, y, w - 2, '#b07a48');
  [x + 6, x + w - 9].forEach(b => { P.r(b, y + 3, 3, 4, '#6a4426'); P.box(b, y + 3, 3, 4, O); });
  P.hl(x + 1, y + 3, w - 2, '#d6c8aa');
}
function sideTable(P, x) {
  const ty = 128;
  [x + 3, x + 18].forEach(lx => { P.r(lx, ty + 8, 3, 34, '#7a4a28'); P.vl(lx, ty + 8, 34, O); P.vl(lx + 2, ty + 8, 34, O); P.vl(lx + 1, ty + 8, 33, '#9a6a3c'); P.hl(lx, ty + 42, 3, O); });
  P.r(x + 2, ty + 3, 20, 5, '#7a4a28'); P.box(x + 2, ty + 3, 20, 5, O); P.r(x + 10, ty + 5, 4, 1, '#c8963c');
  P.r(x, ty, 24, 3, '#8a5a30'); P.box(x, ty, 24, 3, O); P.hl(x + 1, ty, 22, '#b07a48');
  for (let i = x + 1; i < x + 23; i += 2) P.p(i, ty + 44, 'rgba(60,40,20,0.22)');
}
const CH = { b: '#4a9a88', l: '#6cb8a8', h: '#9ad8c8', d: '#2f7464', dd: '#22584c', leg: '#6a4426' };
function chairBack(P, cx) {
  const x = cx - 34, top = 102, seat = SEAT_Y;
  for (let i = x + 2; i < x + 66; i++) if (i % 2 === 0) P.p(i, seat + 25, 'rgba(60,40,20,0.28)');
  A.rrect(P, x + 6, top, 56, seat - top + 8, 10, O);
  A.rrect(P, x + 7, top + 1, 54, seat - top + 6, 9, CH.b);
  A.rrect(P, x + 10, top + 2, 48, 4, 3, CH.l); P.hl(x + 16, top + 2, 36, CH.h);
  for (let sx = x + 16; sx < x + 56; sx += 9) for (let yy = top + 7; yy < seat - 1; yy++) { P.p(sx, yy, CH.d); if (yy % 3 === 0) P.p(sx + 1, yy, CH.l); }
  P.r(x + 8, seat, 52, 9, CH.b); P.box(x + 8, seat, 52, 9, O); P.hl(x + 9, seat + 1, 50, CH.h); P.hl(x + 9, seat + 2, 50, CH.l); P.hl(x + 9, seat + 7, 50, CH.d);
  P.r(x + 3, seat + 9, 62, 12, CH.d); P.box(x + 3, seat + 9, 62, 12, O); P.hl(x + 4, seat + 10, 60, CH.b);
  for (let sx = x + 8; sx < x + 62; sx += 6) P.vl(sx, seat + 12, 8, CH.dd);
  [x + 7, x + 58].forEach(lx => { P.r(lx, seat + 21, 3, 4, CH.leg); P.box(lx, seat + 21, 3, 4, O); });
}
function chairArms(P, cx) {
  const x = cx - 34, top = 126, bot = 167;
  [x, x + 56].forEach((ax, k) => {
    A.rrect(P, ax, top, 12, bot - top, 5, O);
    A.rrect(P, ax + 1, top + 1, 10, bot - top - 2, 4, CH.b);
    A.rrect(P, ax + 1, top + 1, 10, 8, 4, CH.l); P.hl(ax + 3, top + 2, 6, CH.h);
    P.hl(ax + 2, top + 9, 8, CH.d);
    P.vl(k ? ax + 9 : ax + 2, top + 10, bot - top - 13, k ? CH.d : CH.l);
    P.hl(ax + 2, bot - 3, 8, CH.dd);
  });
}
function buildPlant(stage) {
  const P = new A.Px(ROOM.W, ROOM.H), cx = PLANT_CX, rim = RIM_Y;
  const LEAVES = [[-9, -8], [9, -10], [-2, -17], [-14, -20], [13, -24], [-6, -29], [6, -34], [-12, -33], [1, -41], [15, -37]];
  const GR = [['#46a84e', '#2e7a3c', '#8ce07a'], ['#5cba54', '#2e7a3c', '#a4ec8c'], ['#3c9a48', '#24603a', '#7cd070']];
  const n = Math.min(LEAVES.length, 4 + stage + (stage >> 1) * 2);
  const stem = (x0, y0, x1, y1) => { const k = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= k; i++) { const t = i / k, bow = Math.sin(Math.PI * t) * (x1 > x0 ? -1.5 : 1.5); P.p(Math.round(x0 + (x1 - x0) * t + bow), Math.round(y0 + (y1 - y0) * t), '#2e6a34'); } };
  for (let i = 0; i < n; i++) { const [dx, dy] = LEAVES[i]; stem(cx, rim, cx + dx, rim + dy + 3); }
  for (let i = 0; i < n; i++) {
    const [dx, dy] = LEAVES[i], lx = cx + dx, ly = rim + dy, [f, e, h] = GR[i % 3], s = dx < -2 ? -1 : dx > 2 ? 1 : 0;
    A.ellipse(P, lx, ly, 6, 4, f, e, h);
    P.p(lx + s * 6 + (s ? s : 0), ly + (s ? 0 : -4), e);
    for (let k = -3; k <= 3; k++) P.p(lx + k, ly + Math.round(k * s * 0.3), mix(f, 0.25, 'd'));
  }
  P.r(cx - 11, rim, 22, 4, '#c47a4e'); P.box(cx - 11, rim, 22, 4, O); P.hl(cx - 10, rim + 1, 20, '#e09a6a'); P.hl(cx - 9, rim, 18, '#4a3020');
  for (let y = rim + 4; y < rim + 16; y++) { const ins = Math.floor((y - rim - 4) / 5); P.r(cx - 10 + ins, y, 20 - ins * 2, 1, '#b86a42'); P.p(cx - 10 + ins, y, O); P.p(cx + 9 - ins, y, O); P.p(cx - 8 + ins, y, '#d08458'); }
  P.hl(cx - 8, rim + 16, 16, O);
  for (let i = cx - 10; i < cx + 12; i += 2) P.p(i, rim + 17, 'rgba(60,40,20,0.28)');
  return P.c;
}
function door(P, x) {
  const top = 50, bot = 150, w = 40;
  P.r(x - 4, top - 4, w + 8, bot - top + 4, '#f6f0de'); P.box(x - 5, top - 5, w + 10, bot - top + 5, O); P.hl(x - 4, top - 4, w + 8, '#fffaf0');
  P.r(x, top, w, bot - top, '#9a6a3c'); P.box(x, top, w, bot - top, O);
  [[x + 5, top + 6, 13, 34], [x + 22, top + 6, 13, 34], [x + 5, top + 48, 13, 40], [x + 22, top + 48, 13, 40]].forEach(([px, py, pw, ph]) => { P.r(px, py, pw, ph, '#8a5a30'); P.box(px, py, pw, ph, '#6a4426'); P.hl(px + 1, py + ph - 1, pw - 2, '#b07a48'); P.vl(px + pw - 1, py + 1, ph - 2, '#b07a48'); });
  P.r(x + w - 8, top + 52, 4, 3, '#c8963c'); P.box(x + w - 8, top + 52, 4, 3, '#8a5a14'); P.p(x + w - 7, top + 52, '#efcd88');
  P.r(x - 2, bot + 6, w + 4, 8, '#7a8a5a'); P.box(x - 2, bot + 6, w + 4, 8, '#4f5c3a'); for (let i = x + 1; i < x + w; i += 3) P.vl(i, bot + 8, 4, '#8f9e6c');
  for (let i = 0; i < 3; i++) { const hx = x + w + 14 + i * 7; P.r(hx, 70, 2, 3, '#8a5a14'); }
  P.r(x + w + 12, 68, 24, 2, '#8a5a30'); P.box(x + w + 12, 68, 24, 2, O);
  P.r(x + w + 13, 73, 7, 18, '#c8963c'); P.box(x + w + 13, 73, 7, 18, O); P.r(x + w + 27, 73, 6, 14, '#3c88c0'); P.box(x + w + 27, 73, 6, 14, O);
}
function bookcase(P, x) {
  const top = 58, bot = 170, w = 52;
  for (let i = x + 1; i < x + w; i += 2) P.p(i, bot, 'rgba(60,40,20,0.28)');
  P.r(x, top, w, bot - top, '#7a4a28'); P.box(x, top, w, bot - top, O); P.r(x + 3, top + 3, w - 6, bot - top - 6, '#5a3620');
  const COLS = ['#c84848', '#3c88c0', '#2c8c80', '#e8c27e', '#6d4cb5', '#d8863c', '#48a068', '#f6eed8'];
  for (let s = 0; s < 4; s++) {
    const sy = top + 30 + s * 26;
    let bx = x + 4, k = s * 3;
    while (bx < x + w - 8) { const bw = 3 + ((k * 7) % 3), bh = 15 + ((k * 5) % 7), c = COLS[k % COLS.length]; if ((k * 11) % 9 !== 4) { P.r(bx, sy - bh, bw, bh, c); P.box(bx, sy - bh, bw, bh, O); P.vl(bx + 1, sy - bh + 1, bh - 2, mix(c, 0.3, 'w')); } bx += bw + ((k * 3) % 4 === 0 ? 3 : 0); k++; }
    P.r(x + 3, sy, w - 6, 3, '#8a5a30'); P.hl(x + 3, sy, w - 6, '#b07a48'); P.hl(x + 3, sy + 3, w - 6, O);
  }
  P.hl(x + 1, top + 1, w - 2, '#9a6a3c');
  A.ellipse(P, x + 12, top - 5, 7, 4, '#46a84e', '#2e7a3c', '#8ce07a'); P.r(x + 8, top - 4, 9, 4, '#c47a4e'); P.box(x + 8, top - 4, 9, 4, O);
  P.r(x + 30, top - 9, 12, 9, '#c8963c'); P.box(x + 30, top - 9, 12, 9, O); P.r(x + 32, top - 7, 8, 5, '#a2d6f0');
}
function buildRoom() {
  const P = new A.Px(ROOM.W, ROOM.H);
  wall(P); floor(P);
  door(P, 26); bookcase(P, OX + 286);
  rug(P, OX + 92, 160, 90, 26);
  windowFrame(P); curtains(P);
  A.potPlant(P, WIN.x + 3, 93); A.potPlant(P, WIN.x + WIN.w - 10, 93);
  picture(P, OX + 84, 44); clockFace(P); corkboard(P, OX + 152, 50);
  shelf(P, OX + 182, 64, 56);
  sideTable(P, TABLE_X);
  chairBack(P, CHAIR_X);
  return P.c;
}
const SKY = {
  morning: { ramp: ['#8cc4ea', '#a6d2ee', '#c2e0f0', '#dcecf0', '#f2e8d2'], block: '#b4c6d6', lit: '#e2ecf4', tree: '#4aa050' },
  day: { ramp: ['#4f9edc', '#62ade2', '#77bce8', '#8ecae9', '#a2d6f0'], block: '#a4bed4', lit: '#d8e8f4', tree: '#3c9a48' },
  evening: { ramp: ['#4c5a9c', '#7a68a8', '#c07a9a', '#e8957a', '#f4b47a'], block: '#7a5e80', lit: '#f8d890', tree: '#3c4a3c' },
  night: { ramp: ['#10163a', '#162048', '#1c2a56', '#223262', '#283a6a'], block: '#1a2044', lit: '#f3d99c', tree: '#14301e' }
};
function buildSky(tod) {
  const k = SKY[tod], P = new A.Px(WIN.w, WIN.h), band = WIN.h / k.ramp.length;
  for (let y = 0; y < WIN.h; y++) { const t = y / band, i = Math.min(k.ramp.length - 1, Math.floor(t)), f = t - i; for (let x = 0; x < WIN.w; x++) P.p(x, y, f > 0.72 && i < k.ramp.length - 1 && (x + y) % 2 === 0 ? k.ramp[i + 1] : k.ramp[i]); }
  if (tod === 'night') {
    for (let i = 0; i < 16; i++) P.p((i * 17 + 5) % WIN.w, (i * 11 + 3) % 30, i % 3 ? '#9aa8e0' : '#ffffff');
    A.ellipse(P, 33, 10, 4, 4, '#f6eed8', '#d8ccb0', null); A.ellipse(P, 35, 9, 3, 3, SKY.night.ramp[0], SKY.night.ramp[0], null);
  }
  if (tod === 'evening') A.ellipse(P, 10, 40, 5, 5, '#f8d070', '#f0a860', null);
  return P.c;
}
function buildSkyline(tod) {
  const k = SKY[tod], P = new A.Px(WIN.w, WIN.h);
  [[-2, 21, 12], [9, 29, 10], [21, 17, 13], [33, 25, 13]].forEach(([bx, bh, bw], i) => {
    const y0 = WIN.h - bh;
    P.r(bx, y0, bw, bh, k.block); P.hl(bx, y0, bw, mix(k.block, 0.18, 'w')); P.vl(bx + bw - 1, y0, bh, mix(k.block, 0.15, 'd'));
    for (let wy = y0 + 3; wy < WIN.h - 4; wy += 3) for (let wx = bx + 2; wx < bx + bw - 2; wx += 3) if (((wx * 7 + wy * 3 + i) % 5) < (tod === 'night' ? 2 : tod === 'evening' ? 3 : 4)) P.p(wx, wy, k.lit);
  });
  for (let x = 0; x < WIN.w; x++) { const h = 3 + Math.round(1.4 * Math.sin(x / 2.3) + Math.sin(x / 5.1)); P.vl(x, WIN.h - h, h, k.tree); }
  return P.c;
}
function buildGlow() {
  const R = 46, P = new A.Px(R * 2, R * 2);
  for (let y = 0; y < R * 2; y++) for (let x = 0; x < R * 2; x++) {
    const d = Math.hypot(x - R, y - R) / R; if (d > 1) continue;
    const lvl = d < 0.34 ? 3 : d < 0.66 ? 2 : 1;
    if (lvl === 1 && (x + y) % 2) continue;
    P.p(x, y, 'rgba(255,214,140,' + [0, 0.12, 0.15, 0.2][lvl] + ')');
  }
  return P.c;
}
function buildSunPatch() {
  const P = new A.Px(ROOM.W, ROOM.H);
  for (let y = 152; y < 176; y++) { const k = y - 152, x0 = WIN.x + 8 + Math.round(k * 1.1), x1 = WIN.x + WIN.w + 6 + Math.round(k * 1.1); for (let x = x0; x < x1; x++) if ((x + y) % 2 === 0 && !(Math.abs(x - (WIN.x + WIN.w / 2 + 8 + k * 1.1)) < 1.5)) P.p(x, y, 'rgba(255,240,200,0.3)'); }
  return P.c;
}
function buildShadow(w = 44, h = 7) {
  const P = new A.Px(w, h), cx = w / 2 - 0.5, rx = w / 2 - 1, cy = (h - 1) / 2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const d = ((x - cx) / rx) ** 2 + ((y - cy) / cy) ** 2; if (d <= 1 && (d < 0.55 || (x + y) % 2 === 0)) P.p(x, y, 'rgba(80,50,30,0.26)'); }
  return P.c;
}

// ---------------------------------------------------------------- the cat
// a ginger tabby in room pixels, built from a small rig (body, legs, tail, head) so each pose is a handful of numbers
const CAT_PAL = { k: '#e8954e', K: '#bf642c', h: '#f6c48e', w: '#fff4e2', W: '#dcc7a8', n: '#f09aa2', e: '#2c2a3a' };
const CGW = 46, CGH = 30, CGX = 23, CGY = 29;
export const CAT_Y = 181;
const BOWL_X = OX + 110, NAP_X = OX + 166, CAT_X0 = OX + 20, CAT_X1 = OX + 300;
const TAIL_UP = [[[-7, -9], [-10, -11], [-12, -14], [-12, -18], [-10, -20]], [[-7, -9], [-10, -11], [-11, -14], [-10, -18], [-8, -19]]];
const TAIL_SIT = [[[-7, -4], [-9, -2], [-6, -1], [0, -1], [5, -1], [8, -2]], [[-7, -4], [-9, -2], [-6, -1], [0, -1], [5, -1], [7, -3]]];
const GAIT = [2, 0, -2, 0], LIFT = [0, 0, 0, 1];
// pose: walk (a = gait frame, -1 stands), sit (a = looking up), groom/eat (a = bob), loaf, sleep (a = breath), stretch. b = tail swish.
// eye: o open, u up, h happy, c closed
function catArt(pose, a, b, eye, mouth) {
  const layers = []; let ly = null;
  const layer = ol => { ly = { m: new Map(), ol: !!ol }; layers.push(ly); };
  const put = (x, y, c) => { x = Math.round(x) + CGX; y = Math.round(y) + CGY; if (x >= 0 && y >= 0 && x < CGW && y < CGH) ly.m.set(y * CGW + x, c); };
  const ell = (cx, cy, rx, ry, c, ang) => {
    const co = Math.cos(ang || 0), si = Math.sin(ang || 0), R = Math.ceil(Math.max(rx, ry)) + 1;
    for (let y = Math.floor(cy) - R; y <= Math.ceil(cy) + R; y++) for (let x = Math.floor(cx) - R; x <= Math.ceil(cx) + R; x++) {
      const dx = x - cx, dy = y - cy, u = (dx * co + dy * si) / rx, v = (-dx * si + dy * co) / ry;
      if (u * u + v * v <= 1) put(x, y, typeof c === 'function' ? c(u, v) : c);
    }
  };
  const stroke = (pts, r, col) => {
    let run = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.ceil(L * 3));
      for (let k = 0; k <= n; k++) {
        const t = k / n, cx = ax + (bx - ax) * t, cy = ay + (by - ay) * t, c = typeof col === 'function' ? col(run + L * t) : col;
        for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) put(x, y, c);
      }
      run += L;
    }
  };
  const stripe = (x, n) => { const X = Math.round(x) + CGX; for (let y = 0; y < CGH; y++) if (ly.m.has(y * CGW + X)) { for (let j = 0; j < n; j++) ly.m.set((y + j) * CGW + X, 'K'); return; } };
  const ring = d => Math.floor(d / 2.4) % 2 ? 'K' : 'k';
  const fur = (u, v) => v < -0.6 ? 'h' : 'k';
  const leg = (x, y0, dx, lift, c, foot) => { stroke([[x, y0], [x + dx, -1 - lift]], 0.72, c); put(x + dx - 0.5, -1 - lift, foot); put(x + dx + 0.5, -1 - lift, foot); };
  const head = (hx, hy, f, fold) => {
    [-1, 1].forEach(d => { const t0 = hy - 6 + (fold ? 1 : 0); for (let j = 0; j < 4; j++) for (let i = 0; i <= Math.min(j, 2); i++) put(hx + d * (4 - i), t0 + j, 'k'); put(hx + d * 3, t0 + 2, 'n'); });
    ell(hx, hy, 5, 4.2, 'k');
    put(hx - 5, hy + 1, 'k'); put(hx + 5, hy + 1, 'k'); put(hx - 1 + f, hy - 3, 'K'); put(hx + 1 + f, hy - 3, 'K');
    ell(hx + f, hy + 2, 2.2, 1.2, 'w');
    const ex = [hx - 2 + f, hx + 2 + f];
    if (eye === 'o') ex.forEach(x => { put(x, hy - 1, 'e'); put(x, hy, 'e'); });
    else if (eye === 'u') ex.forEach(x => { put(x, hy - 2, 'e'); put(x, hy - 1, 'e'); });
    else if (eye === 'h') ex.forEach(x => { put(x - 1, hy, 'e'); put(x, hy - 1, 'e'); put(x + 1, hy, 'e'); });
    else ex.forEach((x, i) => { put(x, hy, 'e'); put(x + (i ? 1 : -1), hy, 'e'); });
    put(hx + f, hy + 1, 'n');
    if (mouth) { put(hx + f, hy + 2, 'e'); put(hx + f, hy + 3, 'n'); }
  };
  if (pose === 'walk') {
    const st = a < 0, A0 = st ? 0 : GAIT[a], AL = st ? 0 : LIFT[a], B0 = st ? 0 : GAIT[(a + 2) % 4], BL = st ? 0 : LIFT[(a + 2) % 4];
    layer(); stroke(TAIL_UP[b], 0.8, ring); leg(-4.5, -6, B0, BL, 'K', 'W'); leg(6.5, -6, A0, AL, 'K', 'W');
    layer(true); ell(0, -8, 8.5, 3.5, fur); [-6, -3, 0, 3].forEach(x => stripe(x, 2)); ell(6, -6, 2, 1.5, 'w');
    layer(); leg(-6.5, -6, A0, AL, 'k', 'w'); leg(4.5, -6, B0, BL, 'k', 'w');
    layer(true); head(10, -12, 1);
  } else if (pose === 'sit' || pose === 'groom') {
    const g = pose === 'groom';
    layer(); ell(-3, -4.5, 5.5, 4.3, fur); ell(1, -9, 4, 5.5, fur, -0.2); [-7, -5, -3].forEach(x => stripe(x, 2)); ell(3, -8.5, 1.8, 3, 'w');
    layer(true); stroke(TAIL_SIT[b], 0.8, ring);
    layer(); leg(1.5, -6, 0, 0, 'K', 'W'); if (!g) leg(4.5, -6, 0, 0, 'k', 'w');
    layer(true); head(3, !g && a ? -16 : -15, 1);
    if (g) { layer(true); stroke([[4.5, -7], [6.5, -10], [6, -12 + a]], 0.72, 'k'); ell(6, -12.5 + a, 1.3, 1.1, 'w'); if (a) put(5, -11, 'n'); }
  } else if (pose === 'loaf') {
    layer(); stroke([[-8, -3], [-12, -2], [-15, -2], [-17, -3 - b]], 0.8, ring);
    layer(true); ell(-1, -4.5, 9.5, 4, fur); [-6, -3, 0].forEach(x => stripe(x, 2));
    layer(true); ell(10.5, -1.5, 2.6, 1.1, 'w');
    layer(true); head(8, -8, 1);
  } else if (pose === 'sleep') {
    const ry = 4.4 + a * 0.6;
    layer(); ell(0, -0.6 - ry, 9, ry, fur); [-6, -3, 0, 3].forEach(x => stripe(x, 2));
    layer(true); stroke([[-8, -2], [-5, -1], [0, -1], [5, -1], [9, -1], [11, -2]], 0.8, ring);
    layer(true); head(6, -6, 0, true);
  } else if (pose === 'eat') {
    layer(); stroke([[-7, -9], [-11, -11], [-13, -14], [-12, -17]], 0.8, ring); leg(-4.5, -6, 0, 0, 'K', 'W'); leg(6.5, -5, 0, 0, 'K', 'W');
    layer(true); ell(-1, -8, 8.5, 3.5, fur, 0.15); [-5, -2, 1].forEach(x => stripe(x, 2));
    layer(); leg(-6.5, -6, 0, 0, 'k', 'w'); leg(4.5, -5, 0, 0, 'k', 'w');
    layer(true); head(9, -6 + a, 1);
  } else if (pose === 'stretch') {
    layer(); stroke(TAIL_UP[0], 0.8, ring); leg(-4.5, -7, 0, 0, 'K', 'W'); stroke([[3, -4], [9, -1]], 0.72, 'K'); put(9, -1, 'W'); put(10, -1, 'W');
    layer(true); ell(-1, -8, 8.5, 3.3, fur, 0.38); [-5, -2].forEach(x => stripe(x, 2));
    layer(); leg(-6.5, -7, 0, 0, 'k', 'w'); stroke([[5, -4], [11, -1]], 0.72, 'k'); put(11, -1, 'w'); put(12, -1, 'w');
    layer(true); head(9, -6, 1);
  }
  const N = CGW * CGH, out = new Array(N).fill('.');
  const nb = k => { const x = k % CGW, r = []; if (x > 0) r.push(k - 1); if (x < CGW - 1) r.push(k + 1); if (k >= CGW) r.push(k - CGW); if (k + CGW < N) r.push(k + CGW); return r; };
  layers.forEach(l => {
    if (l.ol) l.m.forEach((c, k) => nb(k).forEach(j => { if (!l.m.has(j) && out[j] !== '.') out[j] = 'o'; }));
    l.m.forEach((c, k) => { out[k] = c; });
  });
  const fin = out.slice();
  for (let k = 0; k < N; k++) if (out[k] === '.' && nb(k).some(j => out[j] !== '.')) fin[k] = 'o';
  const rows = []; for (let y = 0; y < CGH; y++) rows.push(fin.slice(y * CGW, (y + 1) * CGW).join(''));
  const P = new A.Px(CGW, CGH); P.stamp(rows, CAT_PAL, 0, 0);
  return P.c;
}
const CATFR = new Map();
export function catFrame(k) { const key = k.join('|'); let c = CATFR.get(key); if (!c) { c = catArt(...k); CATFR.set(key, c); } return c; }
const BOWL = ['..oooooooo..', '.oFfFfFFfFo.', 'oBBBBBBBBBBo', 'obbbbbbbbbbo', '.obbbbbbbbo.', '..oooooooo..'];
function buildBowl() { const P = new A.Px(12, 6); P.stamp(BOWL, { F: '#9a5c32', f: '#c8864c', B: '#7cb8e4', b: '#3c88c0' }, 0, 0); return P.c; }
const CAT_ROUTINE = ['visit', 'wander', 'eat', 'loaf', 'visit', 'groom', 'nap', 'wander'];

// ---------------------------------------------------------------- little sprites drawn straight onto the stage
const HEART_S = ['x.x', 'xxx', '.x.'];
const HEART = ['.x.x.', 'xxxxx', 'xxxxx', '.xxx.', '..x..'], ZED = ['xxxx', '..x.', '.x..', 'xxxx'];
function bits(ctx, rows, x, y, c) { ctx.fillStyle = c; rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === 'x') ctx.fillRect(x + i, y + j, 1, 1); }); }
function pxLine(ctx, x0, y0, x1, y1) {
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (;;) { ctx.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function drawMark(ctx, kind, x, y, t) {
  const w = kind === '…' ? 17 : 13, h = 13, x0 = Math.round(x - w / 2), y0 = Math.round(y - h - 3);
  ctx.fillStyle = O; ctx.fillRect(x0, y0, w, h); ctx.fillRect(x0 + (w >> 1) - 2, y0 + h, 5, 1); ctx.fillRect(x0 + (w >> 1) - 1, y0 + h + 1, 3, 1); ctx.fillRect(x0 + (w >> 1), y0 + h + 2, 1, 1);
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(x0 + 1, y0 + 1, w - 2, h - 2); ctx.fillRect(x0 + (w >> 1) - 1, y0 + h - 1, 3, 1); ctx.fillRect(x0 + (w >> 1), y0 + h, 1, 1);
  ctx.fillStyle = '#c8963c'; ctx.fillRect(x0 + 1, y0 + h - 2, w - 2, 1);
  ctx.fillStyle = '#8a5a14';
  if (kind === '!') { ctx.fillRect(x0 + 5, y0 + 2, 3, 5); ctx.fillRect(x0 + 6, y0 + 7, 1, 1); ctx.fillRect(x0 + 5, y0 + 8, 3, 2); }
  else if (kind === '?') { ctx.fillRect(x0 + 4, y0 + 2, 5, 1); ctx.fillRect(x0 + 3, y0 + 3, 2, 1); ctx.fillRect(x0 + 8, y0 + 3, 2, 2); ctx.fillRect(x0 + 6, y0 + 5, 3, 1); ctx.fillRect(x0 + 5, y0 + 6, 2, 1); ctx.fillRect(x0 + 5, y0 + 8, 2, 2); }
  else for (let i = 0; i < 3; i++) { ctx.fillStyle = Math.floor(t * 3.2) % 4 > i ? '#8a5a14' : '#d8ccb0'; ctx.fillRect(x0 + 3 + i * 4, y0 + 5, 3, 3); }
}

// ---------------------------------------------------------------- the live stage
// o: { layout: 'bubble'|'log'|'closeup', tod: 'live'|'morning'|'day'|'evening'|'night', onStatus(text), onEvent(e), onFrame(anchor) }
const PLANS = {
  wave: () => [{ walk: TALK_X }, { pose: 'wave', dur: 2.4, mouth: 1, status: 'Saying hi' }, { pose: 'idle', dur: 1.6, status: 'Pottering about' }],
  stand: () => [{ walk: TALK_X, status: 'Pottering about' }, { pose: 'idle', dur: 3 + Math.random() * 2.5, status: 'Pottering about' }],
  water: () => [{ walk: WATER_X, status: 'Off to water the money plant' }, { face: -1 }, { pose: 'water', dur: 6, fx: 'water', status: 'Watering the money plant' }, { face: 1 }, { pose: 'cheer', dur: 1.1, eyes: 2, mouth: 2, fx: 'grow', status: 'Watering the money plant' }],
  rest: () => [{ walk: CHAIR_X, status: 'Heading for the armchair' }, { sit: 1 },
    { pose: 'sip', dur: 2.6, swing: 1, fx: 'steam', status: 'Tea break' }, { pose: 'sipUp', dur: 1.5, eyes: 1, status: 'Tea break' }, { pose: 'sip', dur: 2.4, swing: 1, fx: 'steam', status: 'Tea break' },
    { pose: 'read', dur: 7, eyes: 3, swing: 1, status: 'Reading' },
    { pose: 'idle', dur: 6, eyes: 1, mouth: 3, fx: 'zzz', status: 'Dozing off' },
    { pose: 'stretch', dur: 1.4, eyes: 1, mouth: 2, status: 'Stretching' }, { sit: 0 }],
  tea: () => [{ walk: CHAIR_X, status: 'Heading for the armchair' }, { sit: 1 },
    { pose: 'sip', dur: 2.4, swing: 1, fx: 'steam', status: 'Tea break' }, { pose: 'sipUp', dur: 1.5, eyes: 1, status: 'Tea break' }, { pose: 'sip', dur: 2.6, swing: 1, fx: 'steam', status: 'Tea break' }, { pose: 'sipUp', dur: 1.4, eyes: 1, status: 'Tea break' }, { pose: 'sip', dur: 2.2, swing: 1, fx: 'steam', status: 'Tea break' }, { sit: 0 }],
  read: () => [{ walk: CHAIR_X, status: 'Heading for the armchair' }, { sit: 1 }, { pose: 'read', dur: 10, eyes: 3, swing: 1, status: 'Reading' }, { pose: 'stretch', dur: 1.2, eyes: 1, mouth: 2, status: 'Stretching' }, { sit: 0 }]
};
const ROUTINE = ['water', 'stand', 'rest', 'stand'];
const SPEED = 44;
export const STATUS = { listen: 'Listening', think: 'Thinking', talk: 'Explaining', hold: 'All ears' };

export function createStage(canvas, o) {
  o = o || {};
  const ctx = canvas.getContext('2d');
  const roomC = buildRoom(), armsP = new A.Px(ROOM.W, ROOM.H); chairArms(armsP, CHAIR_X);
  const sunC = buildSunPatch(), shadowC = buildShadow(), cloudsC = cloudStrip(480, 40).c;
  const plants = [], skies = {}, lines = {};
  const S = { w: 1, h: 1, z: 5, camX: TALK_X - 40, camY: 0, vw: 1, vh: 1, layout: o.layout || 'bubble', tod: o.tod || 'live', st: 0, sb: 0, padR: 0, zoom: +o.zoom || 0 };
  const L = { x: TALK_X, face: 1, seated: 0, sit: null, walking: false };
  let plan = PLANS.wave(), step = 0, stepT = 0, routineI = 0, mode = 'idle', modeT = 0, talkPose = 'present', talking = false, mouthOv = null;
  let react = null, mark = null, status = '', T = 0, last = performance.now(), raf = 0, lampFlip = false, fxT = 0, todNow = 'day', todAt = -1;
  // o.manual: no animation loop; the caller drives it with step(dt) and paint() (videos). o.clock {h, m} pins the wall clock
  let growth = 0, hidden = false; if (o.growth != null) growth = +o.growth || 0; else try { growth = +localStorage.getItem('asklisa:plant') || 0; } catch (e) { }
  const parts = [];

  const cur = () => plan[step] || {};
  const say = s => { if (s && s !== status) { status = s; o.onStatus && o.onStatus(s); } };
  function begin() { stepT = 0; fxT = 0; const s = cur(); if (mode === 'idle') say(s.status); if (s.fx === 'grow') grow(); if (s.sit != null) L.sit = { to: s.sit, t: 0 }; }
  function setPlan(p, keepSeat) { if (L.seated && !keepSeat && !(p[0] && p[0].sit === 0)) p.unshift({ sit: 0 }); plan = p; step = 0; begin(); }
  function nextPlan() {
    if (mode !== 'idle') { plan = attendPlan(); step = 0; begin(); return; }
    plan = PLANS[ROUTINE[routineI++ % ROUTINE.length]](); step = 0; begin();
  }
  function advance() { step++; if (step >= plan.length) nextPlan(); else begin(); }
  function attendPlan() { const p = []; if (L.seated) p.push({ sit: 0 }); p.push({ walk: TALK_X }, { face: 1 }, { attend: 1 }); return p; }
  function grow() {
    growth++; if (!o.manual) try { localStorage.setItem('asklisa:plant', String(growth)); } catch (e) { }
    for (let i = 0; i < 7; i++) parts.push({ k: 'spark', x: PLANT_CX - 14 + Math.random() * 28, y: RIM_Y - 10 - Math.random() * 32, vx: 0, vy: -4, t: -i * 0.07, life: 0.9 });
  }
  const plantStage = () => Math.min(4, Math.floor(growth / 2));
  function tod() {
    if (S.tod !== 'live') return S.tod;
    if (T - todAt > 5 || todAt < 0) { todAt = T; const d = new Date(), h = d.getHours() + d.getMinutes() / 60; todNow = h >= 6.5 && h < 10 ? 'morning' : h >= 10 && h < 17.5 ? 'day' : h >= 17.5 && h < 19.5 ? 'evening' : 'night'; }
    return todNow;
  }
  const lampOn = () => ((tod() === 'night' || tod() === 'evening') !== lampFlip);
  function lisaTop() {
    if (L.sit) { const k = clamp(L.sit.t / 0.5, 0, 1), a = L.sit.to ? STAND_TOP : SIT_TOP, b = L.sit.to ? SIT_TOP : STAND_TOP; return lerp(a, b, ease(k)) - Math.sin(Math.PI * k) * 10; }
    let hop = 0;
    if (L.walking && Math.floor(T * 7) % 2) hop = 1;
    if (react && react.t < 0.36) hop += Math.sin(Math.PI * react.t / 0.36) * (L.seated ? 3 : 7);
    return (L.seated ? SIT_TOP : STAND_TOP) - hop;
  }
  function framePoint(pt) { const left = Math.round(L.x) - 64, top = Math.round(lisaTop()); return [left + (L.face < 0 ? HW - pt[0] : pt[0]) * RP, top + pt[1] * RP]; }
  function look() {
    const s = cur(); let pose = 'idle', eyes = 0, mouth = 0, legs = 0;
    if (s.pose) { pose = s.pose; eyes = s.eyes || 0; mouth = s.mouth || 0; }
    if (s.attend) {
      if (mode === 'listen') pose = modeT < 2.6 ? 'listen' : 'idle';
      else if (mode === 'think') pose = 'think';
      else if (mode === 'talk') pose = Math.floor(modeT / 2.6) % 2 === 0 ? talkPose : 'idle';
    }
    if (pose === 'wave') pose = 'wave' + (Math.floor(T * 5) % 2);
    if (L.walking) legs = Math.floor(T * 7) % 2;
    else if (L.seated && s.swing) legs = 2 + (Math.floor(T * 2.4) % 2);
    if (mouthOv != null) mouth = mouthOv; else if (talking) mouth = [1, 2, 1, 0][Math.floor(T * 9) % 4];
    if (!eyes && ((T + 0.7) % 3.4) < 0.13) eyes = 1;
    if (react) { if (react.kind === 'giggle') { pose = L.seated && cur().prop ? pose : 'giggle'; eyes = 2; mouth = 2; } else { eyes = 0; mouth = 3; } }
    return { pose, legs, mouth, eyes };
  }
  function update(dt) {
    T += dt; modeT += dt; stepT += dt; fxT += dt;
    if (react && (react.t += dt) > react.dur) react = null;
    if (mark && (mark.t += dt) > mark.dur) mark = null;
    const s = cur();
    L.walking = false;
    if (s.walk != null) {
      const dx = s.walk - L.x;
      if (Math.abs(dx) < 0.6) { L.x = s.walk; advance(); }
      else { L.walking = true; L.x += Math.sign(dx) * Math.min(Math.abs(dx), SPEED * dt); }
    } else if (s.sit != null) {
      if (!L.sit) L.sit = { to: s.sit, t: 0 };
      L.sit.t += dt;
      if (L.sit.t >= 0.5) { L.seated = s.sit; L.sit = null; advance(); }
    } else if (s.face != null) { L.face = s.face; advance(); }
    else if (s.attend) { if (mode === 'idle') nextPlan(); }
    else if (s.pose) {
      if (s.fx === 'water' && fxT > 0.06) { fxT = 0; const [ex, ey] = framePoint(POINTS.water.exit); parts.push({ k: 'drop', x: ex + (Math.random() - 0.5), y: ey, vx: L.face * 3, vy: 18, t: 0, life: 2 }); }
      if (s.fx === 'steam' && fxT > 0.32) { fxT = 0; const [mx, my] = framePoint(POINTS.sip.mug); parts.push({ k: 'steam', x: mx + (Math.random() - 0.5) * 4, y: my - 1, vx: 0, vy: -9, t: 0, life: 1.5, ph: Math.random() * 6 }); }
      if (s.fx === 'zzz' && fxT > 1.3) { fxT = 0; parts.push({ k: 'zed', x: L.x + 14, y: lisaTop() + 16, vx: 7, vy: -10, t: 0, life: 2.2 }); }
      if (stepT >= s.dur) advance();
    }
    if (react && react.kind === 'giggle' && react.t < dt * 1.5) for (let i = 0; i < 3; i++) parts.push({ k: 'heart', x: L.x - 14 + i * 12, y: lisaTop() + 8, vx: (i - 1) * 5, vy: -16, t: -i * 0.12, life: 1.1 });
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i]; p.t += dt; if (p.t < 0) continue;
      if (p.k === 'drop') { p.vy += 170 * dt; if (p.y >= RIM_Y) { parts.splice(i, 1); parts.push({ k: 'splash', x: p.x, y: RIM_Y - 1, t: 0, life: 0.16, vx: 0, vy: 0 }); continue; } }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.t > p.life) parts.splice(i, 1);
    }
    if (C.on) catUpdate(dt);
    let fx = L.x;
    if (s.pose === 'water' || (s.walk === WATER_X && Math.abs(L.x - WATER_X) < 30)) fx = (L.x + PLANT_CX) / 2 + 4;
    if (L.seated || (s.walk === CHAIR_X && Math.abs(L.x - CHAIR_X) < 30)) fx = CHAIR_X + 6;
    const tx = ROOM.W >= S.vw ? clamp(fx - (S.w - S.padR) / S.z / 2, 0, ROOM.W - S.vw) : (ROOM.W - S.vw) / 2;
    S.camX += (tx - S.camX) * Math.min(1, dt * 2.6);
  }
  function draw() {
    const z = S.z, cx0 = Math.floor(S.camX), cy0 = Math.floor(S.camY), td = tod();
    canvas.style.transform = 'translate(' + (-(S.camX - cx0) * z).toFixed(2) + 'px,' + (-(S.camY - cy0) * z).toFixed(2) + 'px)';
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#bc9a6c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.translate(-cx0, -cy0);
    const cw = canvas.width, chh = canvas.height;
    if (cy0 < 0) {
      // a tall desktop window sees above the room: carry the wallpaper up and move the cornice to the top
      for (let y = cy0; y < 8; y++) { ctx.fillStyle = (y & 1) ? '#eadfc6' : '#e8dcc2'; ctx.fillRect(cx0, y, cw, 1); }
      ctx.fillStyle = '#e2d5b9'; for (let x = 10; x < ROOM.W; x += 20) ctx.fillRect(x, cy0 + 8, 1, 8 - (cy0 + 8));
      ctx.fillStyle = '#dccfb2'; for (let y = 16 - 12 * Math.ceil((16 - cy0) / 12); y < 8; y += 12) for (let x = 20; x < ROOM.W; x += 20) if (y > cy0 + 8) ctx.fillRect(x, y + ((x / 20) % 2) * 6, 1, 1);
      ctx.fillStyle = '#d8ccb0'; ctx.fillRect(cx0, cy0, cw, 5); ctx.fillStyle = '#c4b696'; ctx.fillRect(cx0, cy0 + 5, cw, 1); ctx.fillStyle = '#f4ecd8'; ctx.fillRect(cx0, cy0 + 6, cw, 1); ctx.fillStyle = '#ddd0b4'; ctx.fillRect(cx0, cy0 + 7, cw, 1);
    }
    [[cx0, Math.max(0, -cx0)], [ROOM.W, Math.max(0, cx0 + cw - ROOM.W)]].forEach(([x0, ww]) => { if (ww <= 0) return; ctx.fillStyle = '#e8dcc2'; ctx.fillRect(x0, 0, ww, 127); ctx.fillStyle = '#c9a878'; ctx.fillRect(x0, 127, ww, 23); ctx.fillStyle = '#8e7148'; ctx.fillRect(x0, 146, ww, 4); });
    if (cy0 + chh > ROOM.H) { ctx.fillStyle = '#bc9a6c'; ctx.fillRect(cx0, ROOM.H, cw, cy0 + chh - ROOM.H); }
    ctx.drawImage(skies[td] || (skies[td] = buildSky(td)), WIN.x, WIN.y);
    if (td !== 'night') { ctx.save(); ctx.beginPath(); ctx.rect(WIN.x, WIN.y, WIN.w, WIN.h); ctx.clip(); const off = Math.floor((T * 1.6) % 480); ctx.globalAlpha = td === 'evening' ? 0.7 : 1; ctx.drawImage(cloudsC, WIN.x - off, WIN.y + 1); ctx.drawImage(cloudsC, WIN.x - off + 480, WIN.y + 1); ctx.restore(); }
    ctx.drawImage(lines[td] || (lines[td] = buildSkyline(td)), WIN.x, WIN.y);
    if (cy0 < 0) ctx.drawImage(roomC, 0, 8, ROOM.W, ROOM.H - 8, 0, 8, ROOM.W, ROOM.H - 8); else ctx.drawImage(roomC, 0, 0);
    if (td === 'day' || td === 'morning') ctx.drawImage(sunC, 0, 0);
    const d = new Date(), mm = o.clock ? o.clock.m : d.getMinutes() + d.getSeconds() / 60, hh = o.clock ? (o.clock.h % 12) + o.clock.m / 60 : (d.getHours() % 12) + mm / 60;
    ctx.fillStyle = O; pxLine(ctx, CLOCK.x, CLOCK.y, CLOCK.x + Math.sin(hh / 6 * Math.PI) * 3.4, CLOCK.y - Math.cos(hh / 6 * Math.PI) * 3.4);
    ctx.fillStyle = '#3c3a4a'; pxLine(ctx, CLOCK.x, CLOCK.y, CLOCK.x + Math.sin(mm / 30 * Math.PI) * 5.4, CLOCK.y - Math.cos(mm / 30 * Math.PI) * 5.4);
    ctx.fillStyle = '#c84848'; ctx.fillRect(CLOCK.x, CLOCK.y, 1, 1);
    const lit = lampOn(), lx = LAMP.x, ly = LAMP.y;
    for (let j = 0; j < 10; j++) { const hw = 4 + Math.round(j * 0.35); ctx.fillStyle = lit ? (j < 2 ? '#fff6d0' : '#f8e0a0') : (j < 2 ? '#f6f0de' : '#e8dcc2'); ctx.fillRect(lx - hw, ly + j, hw * 2, 1); ctx.fillStyle = O; ctx.fillRect(lx - hw, ly + j, 1, 1); ctx.fillRect(lx + hw - 1, ly + j, 1, 1); }
    ctx.fillStyle = O; ctx.fillRect(lx - 4, ly, 8, 1); ctx.fillRect(lx - 7, ly + 10, 14, 1);
    ctx.fillStyle = '#8a5a14'; ctx.fillRect(lx - 1, ly + 11, 2, 9); ctx.fillStyle = '#c8963c'; ctx.fillRect(lx - 4, ly + 20, 8, 2); ctx.fillStyle = O; ctx.fillRect(lx - 5, ly + 20, 1, 2); ctx.fillRect(lx + 4, ly + 20, 1, 2); ctx.fillRect(lx - 4, ly + 22, 8, 1);
    const sNow = cur();
    if (!(sNow.pose === 'sip' || sNow.pose === 'sipUp')) { const mx = TABLE_X + 3, my = 121; ctx.fillStyle = O; ctx.fillRect(mx, my, 6, 7); ctx.fillRect(mx + 6, my + 2, 2, 3); ctx.fillStyle = '#fffaf0'; ctx.fillRect(mx + 1, my + 1, 4, 5); ctx.fillStyle = '#c8963c'; ctx.fillRect(mx + 1, my + 3, 4, 1); ctx.fillStyle = '#fffaf0'; ctx.fillRect(mx + 6, my + 3, 1, 1); }
    const st = plantStage(); ctx.drawImage(plants[st] || (plants[st] = buildPlant(st)), 0, 0);
    const seatedNow = L.seated ? !(L.sit && L.sit.t > 0.25) : !!(L.sit && L.sit.t > 0.25);
    if (!seatedNow) { ctx.drawImage(armsP.c, 0, 0); if (!hidden) { const sh = clamp(1 - (STAND_TOP - lisaTop()) / 30, 0.4, 1); ctx.drawImage(shadowC, Math.round(L.x - 22 * sh), ROOM.FY - 4, Math.round(44 * sh), 7); } }
    const catOn = C.on && !hidden, catBack = catOn && !seatedNow && (C.plan[C.step] || {}).act === 'beg';
    if (catBack) drawCat();
    const lk = look(), fr = lisaFrame(lk.pose, lk.legs, lk.mouth, lk.eyes), top = Math.round(lisaTop()), left = Math.round(L.x) - 64;
    if (hidden) { }
    else if (L.face < 0) { ctx.save(); ctx.translate(left + HW * RP, top); ctx.scale(-1, 1); ctx.drawImage(fr, 0, 0, HW * RP, HH * RP); ctx.restore(); }
    else ctx.drawImage(fr, left, top, HW * RP, HH * RP);
    if (seatedNow) ctx.drawImage(armsP.c, 0, 0);
    if (catOn) { if (!catBack) drawCat(); ctx.drawImage(bowlC, BOWL_X - 6, CAT_Y - 4); }
    parts.forEach(p => {
      if (p.t < 0) return;
      const x = Math.round(p.x), y = Math.round(p.y);
      if (p.k === 'drop') { ctx.fillStyle = '#5cb4ec'; ctx.fillRect(x, y, 1, 2); ctx.fillStyle = '#d8f2ff'; ctx.fillRect(x, y, 1, 1); }
      else if (p.k === 'splash') { ctx.fillStyle = '#a8dcf8'; ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); }
      else if (p.k === 'spark') { if (Math.floor(p.t * 10) % 2) return; ctx.fillStyle = '#f8e070'; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); ctx.fillStyle = '#fffaf0'; ctx.fillRect(x, y, 1, 1); }
      else if (p.k === 'steam') { ctx.fillStyle = 'rgba(255,255,255,' + (0.8 * (1 - p.t / p.life)).toFixed(2) + ')'; ctx.fillRect(Math.round(p.x + Math.sin(p.t * 5 + p.ph) * 1.4), y, 1, 1); }
      else if (p.k === 'zed') { bits(ctx, ZED, x, y, '#fffaf0'); bits(ctx, ZED, x + 1, y + 1, '#6b6252'); }
      else if (p.k === 'sheart') { bits(ctx, HEART_S, x, y + 1, '#2c2a3a'); bits(ctx, HEART_S, x, y, '#e2707a'); }
      else if (p.k === 'heart') { bits(ctx, HEART, x, y, '#2c2a3a'); bits(ctx, HEART, x, y - 1, '#e2707a'); ctx.fillStyle = '#ffd0d8'; ctx.fillRect(x + 1, y, 1, 1); }
    });
    const m = mark || (mode === 'think' ? { kind: '…', t: modeT } : null);
    if (m && !hidden && !(react && react.kind === 'giggle')) drawMark(ctx, m.kind, Math.round(L.x), top + 2, m.t);
    if (td === 'night' || td === 'evening') {
      ctx.fillStyle = td === 'night' ? 'rgba(24,28,70,0.24)' : 'rgba(255,140,80,0.07)'; ctx.fillRect(cx0, cy0, canvas.width, canvas.height);
    }
    if (lit) { const gr = ctx.createRadialGradient(lx, ly + 8, 2, lx, ly + 8, 60); gr.addColorStop(0, 'rgba(255,210,130,0.28)'); gr.addColorStop(1, 'rgba(255,210,130,0)'); ctx.fillStyle = gr; ctx.fillRect(lx - 60, ly - 52, 120, 120); }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    o.onFrame && o.onFrame({ x: (L.x - S.camX) * z, head: (lisaTop() + 2 - S.camY) * z, z, seated: L.seated });
  }
  function loop(now) {
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000)); last = now;
    update(dt); draw();
    raf = requestAnimationFrame(loop);
  }
  function hit(px, py) {
    const rx = S.camX + px / S.z, ry = S.camY + py / S.z, top = lisaTop();
    if (C.on && !hidden && Math.abs(rx - C.x) < 13 && ry > CAT_Y - 24 && ry < CAT_Y + 3) return 'cat';
    if (Math.abs(rx - L.x) < 26 && ry > top + 2 && ry < top + 96) return ry < top + 56 ? 'head' : 'body';
    if (Math.abs(rx - PLANT_CX) < 17 && ry > RIM_Y - 46 && ry < RIM_Y + 18) return 'plant';
    if (Math.abs(rx - CHAIR_X) < 35 && ry > 100 && ry < 172) return 'chair';
    if (Math.hypot(rx - CLOCK.x, ry - CLOCK.y) < CLOCK.r + 3) return 'clock';
    if (rx > TABLE_X && rx < TABLE_X + 26 && ry > 100 && ry < 172) return 'lamp';
    if (rx > WIN.x - 4 && rx < WIN.x + WIN.w + 4 && ry > WIN.y - 4 && ry < WIN.y + WIN.h + 6) return 'window';
    return null;
  }
  // the cat runs its own little routine and drops in on Lisa: rubs past her legs, sits by her for a pet, or waits by the armchair
  const catShadowC = buildShadow(22, 5), bowlC = buildBowl();
  const C = { on: o.cat != null ? !!o.cat : !o.manual, x: NAP_X, face: -1, plan: [{ act: 'sleep', dur: 9 }, { act: 'stretch', dur: 1.6 }, { act: 'sit', dur: 1.2 }], step: 0, t: 0, fxT: 0, ri: 0, gait: 0, walking: false, hop: null };
  const rnd = (a, b) => a + Math.random() * (b - a), inRoom = x => clamp(x, CAT_X0, CAT_X1);
  const near = () => inRoom(L.x + (Math.random() < 0.5 ? -1 : 1) * rnd(34, 72));
  const canPet = () => mode === 'idle' && !L.seated && !L.sit && !L.walking && !react && cur().pose === 'idle';
  const CAT = {
    wander: () => [{ walk: near() }, { act: 'sit', dur: rnd(3, 6) }].concat(Math.random() < 0.5 ? [{ act: 'groom', dur: rnd(2.5, 4) }, { act: 'sit', dur: 1.5 }] : []),
    loaf: () => [{ walk: near() }, { act: 'sit', dur: 1.2 }, { act: 'loaf', dur: rnd(8, 13) }, { act: 'sit', dur: 1 }],
    groom: () => [{ act: 'sit', dur: 1 }, { act: 'groom', dur: rnd(3.5, 5) }, { act: 'sit', dur: 2 }],
    nap: () => [{ walk: NAP_X }, { face: -1 }, { act: 'loaf', dur: 2.5 }, { act: 'sleep', dur: rnd(16, 26) }, { act: 'stretch', dur: 1.6 }, { act: 'groom', dur: 2.5 }],
    eat: () => [{ walk: BOWL_X - 10 }, { face: 1 }, { act: 'eat', dur: rnd(6, 9) }, { act: 'sit', dur: 1 }, { act: 'groom', dur: 3 }],
    visit: () => {
      if (L.seated || L.sit || cur().sit === 1 || cur().walk === CHAIR_X) return [{ walk: () => inRoom(CHAIR_X + 24) }, { face: -1 }, { act: 'beg', dur: rnd(4, 6) }, { act: 'loaf', dur: rnd(6, 9) }];
      const sd = inRoom(L.x + L.face * 39) === L.x + L.face * 39 ? L.face : -L.face;
      return [{ walk: () => inRoom(L.x - sd * 28) }, { walk: () => inRoom(L.x + sd * 39), rub: 1 }, { face: -sd }, { act: 'beg', dur: rnd(5, 7) }, { act: 'sit', dur: 1.5 }];
    }
  };
  function catBegin() { C.t = 0; C.fxT = 0; }
  function catNext() { C.plan = CAT[CAT_ROUTINE[C.ri++ % CAT_ROUTINE.length]](); C.step = 0; catBegin(); }
  function catAdvance() { if (++C.step >= C.plan.length) catNext(); else catBegin(); }
  function catHead() {
    const s = C.plan[C.step] || {}, off = { walk: [10, -12], eat: [9, -6], stretch: [9, -6], loaf: [8, -8], sleep: [6, -6] }[C.walking ? 'walk' : s.act] || [3, -16];
    return [C.x + C.face * off[0], CAT_Y + off[1]];
  }
  function catHearts(n) { const [hx, hy] = catHead(); for (let i = 0; i < n; i++) { const k = i - (n - 1) / 2; parts.push({ k: 'sheart', x: hx - 1 + k * 5, y: hy - 10, vx: k * 5, vy: -11, t: -i * 0.15, life: 1 }); } }
  function catUpdate(dt) {
    C.t += dt; C.fxT += dt; C.walking = false;
    if (C.hop && (C.hop.t += dt) > 0.4) C.hop = null;
    const s = C.plan[C.step];
    if (!s) return catNext();
    if (s.walk != null) {
      const to = typeof s.walk === 'function' ? s.walk() : s.walk, dx = to - C.x;
      if (Math.abs(dx) < 0.6 || C.t > 14) { if (C.t <= 14) C.x = to; catAdvance(); }
      else { const v = Math.min(Math.abs(dx), (s.rub ? 13 : 25) * dt); C.walking = true; C.face = Math.sign(dx); C.x += C.face * v; C.gait += v / 3; }
      if (s.rub && !s.gig && Math.abs(C.x - L.x) < 6) { s.gig = 1; if (canPet()) react = { kind: 'giggle', t: 0, dur: 1.1 }; catHearts(1); }
      return;
    }
    if (s.face != null) { C.face = s.face; return catAdvance(); }
    if (s.act === 'beg') {
      if (!s.asked) { s.asked = 1; if (canPet() && Math.abs(Math.abs(C.x - L.x) - 39) < 5) { setPlan([{ face: Math.sign(C.x - L.x) }, { pose: 'pet', dur: 3.8, eyes: 3, status: 'Petting the cat' }, { pose: 'idle', dur: 0.8 }, { face: 1 }]); s.pet = 1; } }
      const petting = cur().pose === 'pet';
      if (petting && C.fxT > 0.75) { C.fxT = 0; catHearts(1); }
      if (!s.pet && !s.meowed && C.t > 1.4) { s.meowed = 1; catHearts(1); }
      if (s.pet) { if (!petting && C.t > 1.5) catAdvance(); return; }
    }
    if (s.act === 'sleep' && C.fxT > 1.7) { C.fxT = 0; const [hx, hy] = catHead(); parts.push({ k: 'zed', x: hx + C.face * 3, y: hy - 7, vx: C.face * 4, vy: -7, t: 0, life: 2 }); }
    if (C.t >= s.dur) catAdvance();
  }
  function catLook() {
    const s = C.plan[C.step] || {}, blink = ((T + 0.4) % 4.1) < 0.14, sway = Math.floor(T * 1.2) % 2;
    if (C.walking) return ['walk', Math.floor(C.gait) % 4, Math.floor(C.gait / 2) % 2, s.rub ? 'h' : 'o', 0];
    switch (s.act) {
      case 'sleep': return ['sleep', Math.floor(T * 0.9) % 2, 0, 'c', 0];
      case 'loaf': return ['loaf', 0, sway, blink || C.t > 3.5 ? 'c' : 'o', 0];
      case 'eat': return ['eat', Math.floor(T * 3.4) % 2, 0, 'c', 0];
      case 'groom': return ['groom', Math.floor(T * 3) % 2, sway, 'c', 0];
      case 'stretch': return ['stretch', 0, 0, 'c', 1];
      case 'meow': return ['sit', 1, sway, 'h', 1];
      case 'beg': return ['sit', 1, sway, cur().pose === 'pet' ? 'h' : blink ? 'c' : 'u', 0];
      default: return ['sit', 0, sway, blink ? 'c' : 'o', 0];
    }
  }
  function drawCat() {
    const fr = catFrame(catLook()), X = Math.round(C.x), top = CAT_Y - CGY - (C.hop ? Math.round(Math.sin(Math.PI * C.hop.t / 0.4) * 4) : 0);
    ctx.drawImage(catShadowC, X - 11, CAT_Y - 3);
    if (C.face < 0) { ctx.save(); ctx.translate(X + CGX + 1, top); ctx.scale(-1, 1); ctx.drawImage(fr, 0, 0); ctx.restore(); }
    else ctx.drawImage(fr, X - CGX, top);
  }
  function catPoke() {
    const s = C.plan[C.step] || {};
    catHearts(2);
    if (s.act === 'sleep' || s.act === 'loaf') { C.plan = [{ act: 'stretch', dur: 1.4 }, { act: 'meow', dur: 1 }, { act: 'sit', dur: 2.5 }]; C.step = 0; catBegin(); }
    else if (s.act !== 'eat' && s.act !== 'beg') { C.hop = { t: 0 }; C.plan = [{ act: 'meow', dur: 1 }, { act: 'sit', dur: 2.5 }]; C.step = 0; catBegin(); }
  }
  const api = {
    resize(w, h, st, sb, padR) {
      S.w = w; S.h = h; S.st = +st || 0; S.sb = +sb || 0; S.padR = +padR || 0;
      const use = h - S.st - S.sb, Z = S.zoom; let z, feet;
      // the on-screen keyboard shrinks a phone's window: Lisa keeps the size she had at full height
      if (w !== S.lastW) { S.lastW = w; S.maxUse = 0; }
      S.maxUse = Math.max(S.maxUse || 0, use);
      if (S.layout === 'room') { z = Math.max(1, Math.floor(Math.min(w / ROOM.W, h / ROOM.H))); feet = ROOM.FY * z; }
      else if (S.layout === 'phone') { z = Z || clamp(Math.round(S.maxUse * 0.41 / 96 * 2) / 2, 2.5, 4); feet = S.st + use - 124 - Math.round(S.maxUse * (+o.lift || 0)); }
      else if (S.layout === 'web') { z = Z || clamp(Math.round(use * 0.4 / 96), 3, 6); feet = S.st + use - 58; }
      else if (S.layout === 'log') { z = Z || 3; feet = S.st + Math.round(use * 0.56) - 8; }
      else if (S.layout === 'closeup') { z = Z || (use < 640 ? 4 : 5); feet = S.st + 30 + 96 * z; }
      else { z = Z || (use < 640 ? 3 : 4); feet = S.st + use - 58; }
      S.z = z; S.vw = w / z; S.vh = h / z;
      const cw = Math.ceil(S.vw) + 1, ch = Math.ceil(S.vh) + 1;
      if (canvas.width !== cw) canvas.width = cw; if (canvas.height !== ch) canvas.height = ch;
      canvas.style.width = cw * z + 'px'; canvas.style.height = ch * z + 'px';
      S.camY = ROOM.FY - feet / z;
      S.camX = ROOM.W >= S.vw ? clamp(S.camX, 0, ROOM.W - S.vw) : (ROOM.W - S.vw) / 2;
      return { z, feet, head: feet - 94 * z, lisaH: 96 * z };
    },
    setLayout(l) { S.layout = l; return api.resize(S.w, S.h, S.st, S.sb, S.padR); },
    setZoom(z) { S.zoom = +z || 0; return api.resize(S.w, S.h, S.st, S.sb, S.padR); },
    setTod(t) { S.tod = t || 'live'; todAt = -1; },
    setMode(m, pose) {
      if (pose) talkPose = pose;
      if (m === mode) return;
      const was = mode; mode = m; modeT = 0;
      if (m === 'idle') { mark = null; if (cur().attend) nextPlan(); say(cur().status || 'Pottering about'); return; }
      if (was === 'idle' || !plan.some(s => s.attend)) setPlan(attendPlan());
      if (m === 'listen') mark = { kind: '!', t: 0, dur: 1 };
      if (m === 'talk' || m === 'hold') mark = null;
      say(STATUS[m]);
    },
    setTalking(on) { talking = !!on; },
    // a video driving the mouth from its voice clip: 0-3 as in MOUTHS, null hands it back
    setMouth(m) { mouthOv = m == null ? null : m; },
    arrived() { return !!cur().attend; },
    request(name) {
      if (mode !== 'idle' || !PLANS[name]) return false;
      if (L.seated && (name === 'rest' || name === 'tea' || name === 'read')) { setPlan(PLANS[name]().slice(2), true); return true; }
      setPlan(PLANS[name]()); return true;
    },
    tap(px, py) {
      const h = hit(px, py);
      if (h === 'head' || h === 'body') { react = { kind: h === 'head' ? 'surprise' : 'giggle', t: 0, dur: 1.1 }; if (h === 'head') mark = { kind: '!', t: 0, dur: 0.9 }; }
      else if (h === 'plant') api.request('water');
      else if (h === 'chair') api.request('rest');
      else if (h === 'lamp') lampFlip = !lampFlip;
      else if (h === 'cat') catPoke();
      if (h) o.onEvent && o.onEvent({ type: 'tap', target: h });
      return h;
    },
    get mode() { return mode; },
    step(dt) { update(dt); },
    paint() { draw(); },
    setHidden(v) { hidden = !!v; },
    destroy() { cancelAnimationFrame(raf); }
  };
  begin();
  if (!o.manual) raf = requestAnimationFrame(loop);
  return api;
}
