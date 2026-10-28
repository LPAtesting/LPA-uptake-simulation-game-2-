import { Px, Mask, O, mix, house, HP1, HP2, HP4, hdb, HB1, HB2, HB3, TREE, TREE_PAL, tree, bush, boat, pier, railH, lamp, bench, chr, tiny, tinyW, grass, flowers, flowerbed, plots, well, coop, chicken, clothesline, SAND, WATER, koi, sign } from './lpa-go-art.js';

// ---------- wordmark ----------
const G9 = {
  L: ['##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '#######', '#######'],
  P: ['######.', '#######', '##...##', '##...##', '#######', '######.', '##.....', '##.....', '##.....'],
  A: ['..###..', '.#####.', '##...##', '##...##', '#######', '#######', '##...##', '##...##', '##...##'],
  G: ['.#####.', '#######', '##...##', '##.....', '##..###', '##..###', '##...##', '#######', '.#####.'],
  O: ['.#####.', '#######', '##...##', '##...##', '##...##', '##...##', '##...##', '#######', '.#####.'],
  '!': ['###', '###', '###', '###', '###', '###', '...', '###', '###'],
  ' ': ['....', '....', '....', '....', '....', '....', '....', '....', '....']
};
const GOLD = { hi: '#ffe9b0', lt: '#f3ca62', base: '#d99c2c', dk: '#a86a1c', deep: '#6f400e' };
const LEAF = { hi: '#e2f8bc', lt: '#a2e26e', base: '#66bb40', dk: '#3d8b2a', deep: '#24601c' };
const INK = '#241c2e', RIM = '#f7f0e1', SHA = 'rgba(26,20,14,0.34)';

function dil(m, w, h, n) {
  let a = m;
  for (let k = 0; k < n; k++) {
    const b = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!a[y * w + x]) continue;
      b[y * w + x] = 1;
      if (x > 0) b[y * w + x - 1] = 1; if (x < w - 1) b[y * w + x + 1] = 1;
      if (y > 0) b[(y - 1) * w + x] = 1; if (y < h - 1) b[(y + 1) * w + x] = 1;
    }
    a = b;
  }
  return a;
}
function sub(a, b) { const o = new Uint8Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] && !b[i] ? 1 : 0; return o; }
function shift(m, w, h, dx, dy) { const o = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { if (!m[y * w + x]) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < w && ny < h) o[ny * w + nx] = 1; } return o; }
function paint(P, m, w, h, fn) { for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (m[y * w + x]) { const c = typeof fn === 'function' ? fn(x, y) : fn; if (c) P.p(x, y, c); } }

function measure(txt, s) { let w = 0; for (const ch of txt) { const g = G9[ch]; if (!g) continue; w += g[0].length * s + s; } return w - s; }

// A chunky pixel wordmark: cream sticker rim, hard ink outline, bevelled gold/leaf fill, offset shadow.
export function logo(s, tagline) {
  const txt = 'LPA GO!', lw = measure(txt, s), lh = 9 * s;
  const rib = tagline !== false;
  const pad = 4 * Math.max(1, Math.round(s / 5)), sx = Math.round(s * 0.8), sy = Math.round(s * 1.1);
  const ribH = rib ? Math.max(14, Math.round(s * 3.4)) : 0, gap = rib ? Math.round(s * 1.6) : 0;
  const W = lw + pad * 2 + sx, H = pad * 2 + lh + gap + ribH + sy;
  const P = new Px(W, H);
  const m = new Uint8Array(W * H), tone = new Uint8Array(W * H);
  let cx = pad, y0 = pad;
  for (const ch of txt) {
    const g = G9[ch]; if (!g) continue;
    const pal = cx > pad + lw * 0.5 ? 2 : 1;
    for (let j = 0; j < 9; j++) for (let i = 0; i < g[j].length; i++) {
      if (g[j][i] !== '#') continue;
      for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) {
        const px = cx + i * s + dx, py = y0 + j * s + dy;
        m[py * W + px] = 1; tone[py * W + px] = pal;
      }
    }
    cx += g[0].length * s + s;
  }
  const out = dil(m, W, H, Math.max(2, Math.round(s * 0.6)));
  const rim = sub(dil(out, W, H, 1), out);
  paint(P, shift(dil(out, W, H, 1), W, H, sx, sy), W, H, SHA);
  paint(P, rim, W, H, RIM);
  paint(P, sub(out, m), W, H, INK);
  paint(P, m, W, H, (x, y) => {
    const pal = tone[y * W + x] === 2 ? LEAF : GOLD;
    const up = y > 0 && m[(y - 1) * W + x], dn = y < H - 1 && m[(y + 1) * W + x];
    if (!up) return pal.hi;
    if (!dn) return pal.deep;
    const t = (y - y0) / lh;
    if (y - y0 < s * 1.6) return pal.lt;
    if (!(y > 1 && m[(y - 2) * W + x])) return pal.lt;
    if (t > 0.82) return pal.deep;
    if (t > 0.6) return pal.dk;
    return pal.base;
  });
  // banner under the wordmark
  if (!rib) return P;
  const bw = Math.round(lw * 0.78), bx = pad + Math.round((lw - bw) / 2), by = pad + lh + gap;
  const tail = Math.round(ribH * 0.55);
  const bm = new Uint8Array(W * H);
  for (let y = 0; y < ribH; y++) for (let x = 0; x < bw; x++) bm[(by + y) * W + bx + x] = 1;
  for (let i = 0; i < tail; i++) {
    const hh = ribH - 2 * Math.max(0, tail - 1 - i);
    for (let y = 0; y < hh; y++) {
      const yy = by + Math.max(0, tail - 1 - i) + y;
      bm[yy * W + bx - tail + i] = 1; bm[yy * W + bx + bw + tail - 1 - i] = 1;
    }
  }
  const bout = dil(bm, W, H, Math.max(1, Math.round(s * 0.4)));
  paint(P, shift(bout, W, H, sx, sy), W, H, SHA);
  paint(P, sub(dil(bout, W, H, 1), bout), W, H, RIM);
  paint(P, sub(bout, bm), W, H, INK);
  paint(P, bm, W, H, (x, y) => (y - by) < 2 ? '#3a2f45' : (y - by) > ribH - 3 ? '#181322' : '#2a2136');
  const k = Math.max(2, Math.round(s * 0.4));
  const words = (tagline || 'KNOCK TALK BOOK').split(' ');
  const tw = words.reduce((a, w2) => a + tinyW(w2), 0) + (words.length - 1) * 4;
  const T2 = new Px(tw + 2, 7);
  let tx = 0;
  words.forEach((w2, i) => { tiny(T2, tx, 1, w2, GOLD.lt); tx += tinyW(w2); if (i < words.length - 1) { T2.r(tx + 1, 3, 2, 2, GOLD.base); tx += 4; } });
  P.g.imageSmoothingEnabled = false;
  P.g.drawImage(T2.c, bx + Math.round((bw - tw * k) / 2), by + Math.round((ribH - 7 * k) / 2) + 1, (tw + 2) * k, 7 * k);
  return P;
}

// ---------- title vista ----------
function vgrad(P, x, y, w, h, ramp) {
  const n = ramp.length, band = h / n;
  for (let j = 0; j < h; j++) {
    const t = j / band, i = Math.min(n - 1, Math.floor(t)), f = t - i;
    for (let i2 = 0; i2 < w; i2++) {
      let c = ramp[i];
      if (f > 0.86 && i < n - 1 && ((x + i2 + j) % 2 === 0)) c = ramp[i + 1];
      else if (f < 0.14 && i > 0 && ((x + i2 + j) % 2 === 1)) c = ramp[i - 1];
      P.p(x + i2, y + j, c);
    }
  }
}
function cloud(P, x, y, w, h) {
  const lo = '#f4fbff', mid = '#dceaf6', dk = '#bcd2e6';
  for (let j = 0; j < h; j++) {
    const inset = Math.round(Math.abs(j - h * 0.45) * (w * 0.16));
    P.r(x + inset, y + j, Math.max(2, w - inset * 2), 1, j < 2 ? lo : j > h - 3 ? dk : mid);
  }
  P.r(x + Math.round(w * 0.3), y - 2, Math.round(w * 0.34), 2, lo);
  P.r(x + Math.round(w * 0.58), y - 1, Math.round(w * 0.2), 1, lo);
}
export function clouds(w, h) {
  const P = new Px(w, h);
  [[10, 16, 46, 9], [96, 8, 34, 7], [168, 22, 58, 10], [258, 10, 40, 8], [330, 20, 50, 9], [410, 12, 36, 7]].forEach(([x, y, cw, ch]) => cloud(P, x, y, cw, ch));
  return P;
}
export function bird(flap) {
  const P = new Px(7, 5);
  if (flap) { P.p(1, 1, O); P.p(2, 2, O); P.p(3, 3, O); P.p(4, 2, O); P.p(5, 1, O); }
  else { P.p(0, 3, O); P.p(1, 2, O); P.p(2, 2, O); P.p(3, 3, O); P.p(4, 2, O); P.p(5, 2, O); P.p(6, 3, O); }
  return P;
}

export function scene(w, h) {
  const P = new Px(w, h);
  // The composition is authored on a 480x320 block: centre it and pin it to the
  // bottom so a taller or wider viewport gains sky and shoulder, not empty grass.
  const ox = Math.round((w - 480) / 2), oy = h - 320, HOR = 146 + oy, LAND = 176 + oy;
  vgrad(P, 0, 0, w, HOR, ['#4f9edc', '#77bce8', '#a2d6f0', '#c9e7f5', '#e9f5fc']);
  // morning sun, clear of the wordmark
  const sx = ox + 428, sy = 42;
  for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) { const d = Math.sqrt(x * x + y * y); if (d > 16 || d <= 11) continue; if ((sx + x + sy + y) % 2) continue; P.p(sx + x, sy + y, d > 13.5 ? '#dcecf8' : '#f4e9c6'); }
  for (let y = -11; y <= 11; y++) for (let x = -11; x <= 11; x++) { const d = Math.sqrt(x * x + y * y); if (d > 11) continue; P.p(sx + x, sy + y, d > 9.4 ? '#f7dfa2' : d > 6 ? '#fdf0c2' : '#fffbe8'); }

  const sea = new Mask(w, h); sea.rect(0, HOR, w, LAND - HOR + 2); sea.draw(P, WATER, '#2c68b8'); sea.rim(P, '#e4d8a8');
  for (let i = 0; i < 30; i++) { const x = (i * 53 + 11) % (w - 16), y = HOR + 3 + ((i * 29) % (LAND - HOR - 2)); P.r(x, y, 5 + (i % 3) * 3, 1, '#a6d8f4'); }
  boat(P, ox + 44, HOR + 12); boat(P, ox + 306, HOR + 4); boat(P, w - 64, HOR + 16); koi(P, ox + 214, HOR + 14); koi(P, ox + 396, HOR + 12); koi(P, 18, HOR + 6);

  grass(P, 0, LAND - 2, w, h - LAND + 2);
  const shore = new Mask(w, h); shore.rect(0, LAND - 2, w, 7); shore.draw(P, SAND, '#c8ae70');
  const sand = new Mask(w, h);
  [[0, oy + 268, w, 18], [ox + 200, oy + 200, 18, 70]].forEach(r => sand.rect(...r));
  sand.draw(P, SAND, '#c8ae70');

  // the town along the shore: kampung houses on the wings, blocks in the middle
  house(P, ox + 6, oy + 150, HP2); house(P, ox + 68, oy + 158, HP1);
  tree(P, ox + 126, oy + 170); tree(P, ox + 146, oy + 180); tree(P, ox + 164, oy + 174);
  hdb(P, ox + 178, oy + 118, 54, 10, HB1); hdb(P, ox + 238, oy + 106, 46, 12, HB2); hdb(P, ox + 290, oy + 128, 50, 8, HB3);
  tree(P, ox + 344, oy + 172); house(P, ox + 362, oy + 154, HP4); tree(P, ox + 422, oy + 168); tree(P, ox + 442, oy + 178); tree(P, ox + 332, oy + 182);
  tree(P, 8, oy + 176); tree(P, w - 26, oy + 170); tree(P, w - 46, oy + 182);
  lamp(P, ox + 236, oy + 212); lamp(P, ox + 368, oy + 210); bench(P, ox + 284, oy + 214); bench(P, ox + 408, oy + 222);
  bush(P, ox + 96, oy + 216); bush(P, ox + 116, oy + 222); bush(P, ox + 232, oy + 210); bush(P, ox + 340, oy + 204); bush(P, ox + 392, oy + 208); bush(P, ox + 462, oy + 216);
  bush(P, 10, oy + 214); bush(P, w - 30, oy + 212);

  // kampung dooryard in the near foreground
  clothesline(P, ox + 14, oy + 200, 46);
  plots(P, ox + 92, oy + 232, 44, 22);
  well(P, ox + 26, oy + 244);
  coop(P, ox + 58, oy + 232); chicken(P, ox + 84, oy + 252); chicken(P, ox + 44, oy + 258, 1); chicken(P, ox + 32, oy + 268);
  sign(P, ox + 174, oy + 244);
  flowers(P, ox + 100, oy + 264, 44, 20, 5); flowers(P, ox + 290, oy + 292, 170, 24, 12); flowers(P, ox, oy + 190, 96, 10, 4); flowers(P, ox + 30, oy + 292, 150, 24, 10);
  flowers(P, 0, oy + 300, w, 18, 14);
  bench(P, ox + 176, oy + 296); bush(P, ox + 122, oy + 300); bush(P, ox + 210, oy + 292); bush(P, ox + 424, oy + 300);
  tree(P, ox, oy + 294); tree(P, ox + 458, oy + 292);

  // Lisa and three neighbours coming up the lane, flyers in hand
  chr(P, 'fauzi', ox + 84, oy + 260); chr(P, 'lisa', ox + 116, oy + 258); chr(P, 'meiLing', ox + 144, oy + 262); chr(P, 'sarojini', ox + 198, oy + 222);
  P.r(ox + 124, oy + 266, 4, 5, '#f6efe1'); P.box(ox + 124, oy + 266, 4, 5, O);
  return P;
}
