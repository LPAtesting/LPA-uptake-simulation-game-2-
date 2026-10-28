// Four heartland mini-games for LPA GO: the MRT seat scramble, the hawker
// chope, the chicken rice portion cut and the tray-return service. Each one owns its geometry, its
// rules and its board. The shell supplies keys, sprites and a persistent board
// object, draws whatever hud() returns, and none of these touch the week.

const VW = 576, VH = 384;
const R = (a, b) => a + Math.random() * (b - a);
const CL = (v, a, b) => Math.max(a, Math.min(b, v));
const pick = a => a[Math.floor(Math.random() * a.length)];

function shadow(ctx, x, y, rx) { ctx.fillStyle = 'rgba(18,20,28,0.3)'; ctx.beginPath(); ctx.ellipse(x, y + 1, rx, rx * 0.42, 0, 0, Math.PI * 2); ctx.fill(); }
function person(ctx, api, p, ring) {
  const sp = api.sprite(p.name), fr = Math.floor(p.anim || 0) % 2 ? 1 : 0;
  const img = p.dir === 'u' ? sp['b' + fr] : sp['f' + fr];
  shadow(ctx, p.x, p.y, 6);
  if (ring) { ctx.strokeStyle = ring; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, 7.5, 3.2, 0, 0, Math.PI * 2); ctx.stroke(); }
  const px = Math.round(p.x - 8), py = Math.round(p.y - 22);
  if (p.stun > 0) ctx.globalAlpha = 0.72;
  if (p.dir === 'l') { ctx.save(); ctx.translate(px + 16, py); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
  else ctx.drawImage(img, px, py);
  ctx.globalAlpha = 1;
}
function seated(ctx, api, name, x, y) {
  const sp = api.sprite(name);
  ctx.drawImage(sp.f0, 0, 0, 16, 18, Math.round(x - 8), Math.round(y - 17), 16, 18);
}
function steer(p, tx, ty, sp, dt) {
  const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy);
  if (d < 1.5) { p.anim = 0; return; }
  const s = Math.min(d, sp * dt); p.x += dx / d * s; p.y += dy / d * s;
  p.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'l' : 'r') : (dy < 0 ? 'u' : 'd');
  p.anim += dt * 10;
}
function drive(p, keys, sp, dt) {
  let mx = 0, my = 0;
  if (keys.l) mx--; if (keys.r) mx++; if (keys.u) my--; if (keys.d) my++;
  if (mx || my) {
    const m = Math.hypot(mx, my);
    p.x += mx / m * sp * dt; p.y += my / m * sp * dt;
    p.dir = (my && !mx) ? (my < 0 ? 'u' : 'd') : (mx < 0 ? 'l' : 'r');
    p.anim += dt * 10; return true;
  }
  p.anim = 0; return false;
}
// Bodies push each other out of the way; shove also costs the pair a moment.
function bump(list, r, shove) {
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    const a = list[i], b = list[j];
    if (a.out || b.out || a.sat || b.sat) continue;
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d < r && d > 0) {
      const k = (r - d) / 2 * (shove ? 1.4 : 1);
      a.x -= dx / d * k; a.y -= dy / d * k; b.x += dx / d * k; b.y += dy / d * k;
      if (shove) { a.stun = Math.max(a.stun || 0, 0.16); b.stun = Math.max(b.stun || 0, 0.16); }
    }
  }
}
function corona(ctx, x, y, r, t, hot) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.6), a = (hot ? 0.6 : 0.42) + pulse * 0.16;
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.42);
  const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  g.addColorStop(0, 'rgba(255,248,216,' + Math.min(0.95, a + 0.2) + ')');
  g.addColorStop(0.42, 'rgba(236,196,116,' + a * 0.6 + ')');
  g.addColorStop(1, 'rgba(217,173,98,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(255,246,212,' + (0.45 + pulse * 0.35) + ')'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.58, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function chev(ctx, x, y, t, col) {
  const bob = Math.round(Math.sin(t * 2.8) * 2), w = 7, ty = y + bob;
  ctx.fillStyle = 'rgba(26,22,14,0.5)';
  ctx.beginPath(); ctx.moveTo(x - w - 1, ty - 1); ctx.lineTo(x + w + 1, ty - 1); ctx.lineTo(x, ty + w + 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = col || '#f8ecbc';
  ctx.beginPath(); ctx.moveTo(x - w, ty); ctx.lineTo(x + w, ty); ctx.lineTo(x, ty + w); ctx.closePath(); ctx.fill();
}
function txt(ctx, s, x, y, col, size, align) {
  ctx.font = (size || 9) + 'px "Pixelify Sans", ui-monospace, monospace';
  ctx.textAlign = align || 'left'; ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.textAlign = 'left';
}
function bar(ctx, x, y, w, h, frac, col, label) {
  ctx.fillStyle = 'rgba(14,18,26,0.66)'; ctx.fillRect(x - 3, y - 3, w + 6, h + 6);
  ctx.fillStyle = '#12202c'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = col; ctx.fillRect(x, y, CL(frac, 0, 1) * w, h);
  ctx.strokeStyle = 'rgba(246,236,210,0.75)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  if (label) txt(ctx, label, x, y - 4, 'rgba(246,236,210,0.85)');
}

/* ------------------------------------------------------------------ MRT ---- */
// The ride home on the Tenang line, in a carriage laid out the way a real one
// is: longitudinal benches down both sides, three door pairs a side, priority
// seats at the four corners, poles beside the doors and a rail of hanging
// handles over the aisle. Two things are scored — whether you get a seat, and
// whether you behave once you have one.
const CAR = { X0: 80, X1: 496, Y0: 100, Y1: 292 };
const WALL = 22, PAD = 26;
const BT0 = CAR.Y0 + WALL, BT1 = BT0 + PAD;   // top bench band
const BB1 = CAR.Y1 - WALL, BB0 = BB1 - PAD;   // bottom bench band
const SIT = [BT1 - 3, BB0 + 19];              // where a seated body sits, per side
const AY0 = BT1 + 8, AY1 = BB0 - 8;           // the standing aisle
const DOORX = [164, 288, 412], DHW = 28;
const BAYS = [[91, 136, 2], [193, 260, 3], [316, 384, 3], [440, 485, 2]];
const POLEX = [141, 188, 265, 311, 388, 435];
const POLEY = [BT1 + 5, BB0 - 5];
const RAILY = [AY0 + 10, AY1 - 10];
const STOPS = ['Ketapang', 'Sungei Jelutong', 'Bukit Puteh', 'Simpang', 'Tenang'];
const SHORT = ['Ketapang', 'Jelutong', 'Bkt Puteh', 'Simpang', 'Tenang'];
const CROWD = ['shopperA', 'pupilA', 'pupilB', 'pupilC', 'kidB', 'kidC', 'jogger', 'customerA', 'officerA', 'officerB', 'officerC', 'vendorB', 'gymA', 'gymB', 'librarian', 'desmond', 'hafiz', 'stanley', 'dinesh', 'thilaga', 'nadia', 'carol', 'receptionist', 'cleaner', 'seamstress'];
const NEEDY = [['uncleA', 'Uncle'], ['auntieA', 'Auntie'], ['taichiA', 'Uncle'], ['taichiB', 'Auntie'], ['gekNeo', 'Auntie'], ['weeKiat', 'Uncle'], ['sarojini', 'Auntie']];
// the carriage's own palette: SMRT blue moquette, yellow priority trim, chrome
const MC = {
  floor: '#dde2e4', rib: '#d0d7da', aisle: '#e7ebec', thresh: '#e0b839',
  panel: '#edf1f2', panelD: '#c6cdd2', skin: '#aeb7bd', ink: '#39424a',
  seat: '#8ecae8', seatD: '#6eb0d6', seatE: '#4e92bd',
  pri: '#2f5da4', priD: '#23477f', arm: '#f0be1e',
  door: '#e8edef', doorE: '#9dafb7', red: '#bc3a2b',
  chrome: '#ccd6db', chromeHi: '#f5f9fa', glass: '#a9c6d6'
};
const GRAB = [];
POLEX.forEach(x => POLEY.forEach(y => GRAB.push({ x, y, pole: true })));
RAILY.forEach(y => { for (let x = CAR.X0 + 26; x < CAR.X1 - 20; x += 34) GRAB.push({ x, y, pole: false }); });
function nearGrab(p, max) {
  let best = null, bd = max || 26;
  GRAB.forEach(g => { const d = Math.hypot(g.x - p.x, g.y - p.y); if (d < bd) { bd = d; best = g; } });
  return best;
}
function standee(name, x, y, off, need) {
  const p = { name, x, y, dir: pick(['u', 'd', 'l', 'r']), anim: 0, st: 'stand', off, need: !!need, ph: R(0, 6), delay: 0, sp: R(84, 100) };
  p.hold = nearGrab(p, 34); return p;
}
function nearestDoor(p) { return DOORX.reduce((a, x) => Math.abs(x - p.x) < Math.abs(a - p.x) ? x : a, DOORX[0]); }
function sendOut(p) {
  const dx = nearestDoor(p), out = p.y < (AY0 + AY1) / 2;
  p.st = 'exit'; p.hold = null; p.delay = R(0.15, 0.9);
  p.tx = dx + R(-8, 8); p.ty = out ? CAR.Y0 - 26 : CAR.Y1 + 26;
}
function seatTarget(q) { return [q.x, q.side ? BB0 + 4 : BT1 - 4]; }
function sendToSeat(s, p, q) {
  const [tx, ty] = seatTarget(q);
  p.st = 'board'; p.seat = s.seats.indexOf(q); p.tx = tx; p.ty = ty;
}
function sendToFloor(p) {
  p.st = 'board'; p.seat = -1;
  const g = pick(GRAB.filter(k => !k.pole));
  p.tx = CL(g.x + R(-10, 10), CAR.X0 + 20, CAR.X1 - 20); p.ty = g.y + R(-6, 6);
}
function freeSeats(s) { return s.seats.filter(q => !q.who); }
function confine(p, esc) {
  p.x = CL(p.x, CAR.X0 + 16, CAR.X1 - 16);
  const well = DOORX.some(x => Math.abs(p.x - x) < DHW - 2);
  if (esc && well) { p.y = CL(p.y, CAR.Y0 - 30, CAR.Y1 + 30); return; }
  p.y = CL(p.y, well ? BT0 + 2 : AY0, well ? BB1 - 2 : AY1);
}
function stumble(s) {
  s.sway = 0; s.grace = 1.2; s.knocks++;
  const dir = s.lurch < 0 ? -1 : 1;
  s.me.x = CL(s.me.x + dir * 15, CAR.X0 + 16, CAR.X1 - 16);
  const near = s.crowd.find(p => p.st === 'stand' && Math.hypot(p.x - s.me.x, p.y - s.me.y) < 24);
  if (near) { near.x = CL(near.x + dir * 8, CAR.X0 + 16, CAR.X1 - 16); s.care--; s.msg = 'Knocked into someone · sorry sorry'; }
  else s.msg = 'Nearly went over · hold on to something';
}
// Musical chairs on rails. The train slows, everybody sitting gets up — your
// own seat included — and whatever is free when the doors open is fought over.
function everyoneUp(s) {
  if (s.seat >= 0) { s.seats[s.seat].who = null; s.seat = -1; }
  s.hold = null; s.pardon = false; s.sway = 0; s.grace = 1.4;
  s.me.x = 288; s.me.y = (AY0 + AY1) / 2; s.me.dir = 'u'; s.me.anim = 0;
  const taken = s.seats.filter(q => q.who);
  const riders = s.crowd.filter(p => p.st !== 'exit').length + 1;
  const k = CL(riders - 1 - Math.floor(Math.random() * 2), 1, taken.length);
  for (let i = 0; i < k; i++) {
    const q = pick(taken.filter(x => x.who));
    const p = standee(q.who, q.x, q.side ? BB0 - 4 : BT1 + 4, s.stop);
    q.who = null; p.st = 'wait'; p.delay = R(0.1, 0.6); p.hold = null;
    p.tx = nearestDoor(p) + R(-10, 10); p.ty = q.side ? BB1 - 8 : BT0 + 8;
    s.crowd.push(p);
  }
  s.msg = 'Everyone up · ' + freeSeats(s).length + ' seats back in play';
}
// whoever is standing goes for whatever is free, nearest first, with a stagger
function scramble(s) {
  const runners = s.crowd.filter(p => p.st === 'stand');
  freeSeats(s).forEach(q => {
    if (!runners.length) return;
    const p = runners.reduce((a, b) => Math.hypot(b.x - q.x, b.y - q.y) < Math.hypot(a.x - q.x, a.y - q.y) ? b : a);
    runners.splice(runners.indexOf(p), 1);
    p.delay = R(0.12, 0.85); p.sp = R(98, 126); sendToSeat(s, p, q);
  });
}
function station(s) {
  const st = s.stop, last = st === STOPS.length - 1;
  s.crowd.forEach(p => { if (p.st === 'wait' || p.st === 'waiting') sendOut(p); });
  if (last) {
    s.crowd.forEach(p => { if (p.st === 'stand') sendOut(p); });
    s.msg = 'Tenang · this is your stop'; return;
  }
  const room = 17 - s.crowd.filter(p => p.st === 'stand' || p.st === 'asking').length;
  const n = CL(2 + Math.floor(Math.random() * 4), 0, Math.max(0, room));
  for (let k = 0; k < n; k++) {
    const dx = pick(DOORX), top = Math.random() < 0.5;
    const p = standee(pick(CROWD), dx + R(-14, 14), top ? CAR.Y0 - 20 : CAR.Y1 + 20, st + 1 + Math.floor(Math.random() * 3));
    p.delay = R(0.1, 0.6); s.crowd.push(p);
  }
  scramble(s);
  // someone who needs the priority seat, walking slowly for it
  if (st >= 1 && !s.cue && Math.random() < 0.8) {
    const [nm, title] = pick(NEEDY), dx = pick(DOORX), top = Math.random() < 0.5;
    const p = standee(nm, dx + R(-10, 10), top ? CAR.Y0 - 18 : CAR.Y1 + 18, STOPS.length - 1, true);
    p.title = title; p.delay = R(0.9, 1.5); p.sp = 62; p.st = 'need';
    const q = s.seats.filter(x => x.pri).reduce((a, b) => Math.abs(b.x - p.x) < Math.abs(a.x - p.x) ? b : a);
    p.tx = q.x; p.ty = q.side ? BB0 + 4 : BT1 - 4;
    s.crowd.push(p);
  }
  const up = s.crowd.filter(p => p.st !== 'exit').length + 1;
  s.msg = STOPS[st] + ' · ' + freeSeats(s).length + ' seats, ' + up + ' standing';
}
function restation(s) {
  s.sway = 0; s.block = 0; s.blamed = false; s.grace = 2.2;
  if (s.cue) {
    const c = s.cue; s.care--; c.p.st = 'stand'; c.p.hold = nearGrab(c.p, 40); s.cue = null;
    s.msg = c.title + ' stands the whole way';
  }
  if (s.seat < 0) {
    s.me.x = 288; s.me.y = (AY0 + AY1) / 2; s.me.dir = 'u'; s.me.anim = 0;
    s.hold = nearGrab(s.me, 36);
  }
  const spots = GRAB.filter(g => !g.pole);
  s.crowd.filter(p => p.st === 'stand' || p.st === 'asking').forEach((p, i) => {
    const g = spots[(i * 3 + 1) % spots.length];
    p.st = 'stand'; p.x = CL(g.x + (i % 2 ? 7 : -7), CAR.X0 + 20, CAR.X1 - 20); p.y = g.y + (i % 2 ? 4 : -4);
    p.hold = g; p.anim = 0;
  });
}
function arriveAt(s, p) {
  if (p.st === 'exit') { p.gone = true; return; }
  if (p.st === 'wait') { p.st = 'waiting'; return; }
  if (p.st === 'ask') { p.st = 'asking'; return; }
  if (p.st === 'need') {
    const q = s.seats.find(x => x.pri && !x.who);
    if (q) { q.who = p.name; q.off = STOPS.length - 1; p.gone = true; return; }
    if (s.seat >= 0 && s.seats[s.seat].pri) {
      p.st = 'asking'; s.cue = { p, seat: s.seat, title: p.title, left: 9 };
      s.msg = p.title + ' is standing at your priority seat';
      return;
    }
    p.st = 'stand'; p.hold = nearGrab(p, 34); return;
  }
  const q = p.seat >= 0 ? s.seats[p.seat] : null;
  if (q && !q.who) { q.who = p.name; q.off = p.off; p.gone = true; return; }
  if (q) { const free = freeSeats(s); if (free.length && Math.random() < 0.75) { sendToSeat(s, p, free[0]); return; } }
  p.st = 'stand'; p.seat = -1; p.hold = nearGrab(p, 34);
}
function endRide(s, api, alighted, out) {
  const b = api.board, sat = s.marks.filter(Boolean).length;
  b.rides = (b.rides || 0) + 1;
  b.best = Math.max(b.best || 0, sat);
  b.care = Math.max(b.care || 0, s.care);
  s.over = { sat, care: s.care, knocks: s.knocks, alighted, out: out || null, played: s.marks.length };
  s.msg = ''; api.save();
}
function grade(o) {
  if (o.out) return o.sat === 0 ? 'Beaten to the first seat' : 'Out at ' + o.out;
  if (!o.alighted) return 'Rode straight past Tenang';
  return o.care > 0 ? 'A seat every station, and manners' : 'A seat every station, all the way to Tenang';
}
const mrt = {
  init() {
    const s = {
      id: 'mrt', t: 0, stop: 0, ph: 'depart', wait: 1.7, door: 0, lurch: -1, mag: 1,
      seats: [], crowd: [], marks: [], seat: -1, hold: null, sway: 0,
      care: 0, knocks: 0, satT: 0, rideT: 0, cue: null, block: 0, blamed: false, grace: 3, pardon: false,
      msg: 'Every stop the seats go back in play · no seat when the doors shut and you are out', over: null
    };
    [0, 1].forEach(side => BAYS.forEach((b, bi) => {
      const [x0, x1, n] = b, w = (x1 - x0) / n;
      for (let i = 0; i < n; i++) s.seats.push({
        x: Math.round(x0 + w * (i + 0.5)), y: SIT[side], w, side,
        pri: (bi === 0 && i === 0) || (bi === BAYS.length - 1 && i === n - 1), who: null, off: 0
      });
    }));
    s.seats.forEach(q => { q.who = pick(CROWD); q.off = 1 + Math.floor(Math.random() * 4); });
    pick(s.seats).who = null;
    for (let i = 0; i < 9; i++) s.crowd.push(standee(pick(CROWD), R(CAR.X0 + 40, CAR.X1 - 40), R(AY0 + 8, AY1 - 8), 1 + Math.floor(Math.random() * 4)));
    s.next = [[14, 0, -1], [36, 0, -1], [14, 1, -1], [36, 1, -1], [542, 0, 1], [564, 0, 1], [542, 1, 1], [564, 1, 1]]
      .filter(() => Math.random() < 0.8).map(([x, side, dir]) => ({ x, side, dir, name: pick(CROWD) }));
    s.plat = [36, 74, 112, 150, 188, 226].map(x => ({ x, name: pick(CROWD), dir: pick(['d', 'd', 'l', 'r']), ph: R(0, 6) }));
    s.me = { name: 'lisa', x: 288, y: (AY0 + AY1) / 2, dir: 'u', anim: 0, me: true };
    return s;
  },
  action(s) {
    if (s.over) return;
    if (s.seat >= 0) {
      const q = s.seats[s.seat];
      q.who = null; s.seat = -1;
      s.me.x = q.x; s.me.y = q.side ? BB0 - 14 : BT1 + 14; s.me.dir = q.side ? 'd' : 'u';
      s.msg = 'On your feet'; return;
    }
    const free = freeSeats(s).map(q => [Math.hypot(q.x - s.me.x, q.y - s.me.y), q]).sort((a, b) => a[0] - b[0])[0];
    if (free && free[0] < 34) {
      const q = free[1];
      q.who = 'lisa'; q.off = STOPS.length - 1; s.seat = s.seats.indexOf(q); s.hold = null; s.sway = 0;
      s.msg = q.pri ? 'Priority seat · yours till the next stop' : 'Seat · yours till the next stop';
      return;
    }
    if (s.hold) { s.hold = null; s.msg = 'Let go'; return; }
    const g = nearGrab(s.me, 36);
    if (g) { s.hold = g; s.msg = g.pole ? 'Holding the pole' : 'Holding the handle'; }
    else s.msg = 'Nothing to hold here';
  },
  tick(s, dt, api) {
    s.t += dt;
    if (s.over) return;
    const mv = s.ph === 'depart' || s.ph === 'ride' || s.ph === 'arrive';
    const last = s.stop === STOPS.length - 1;
    s.rideT += dt; if (s.seat >= 0) s.satT += dt;
    s.mag = s.ph === 'depart' ? CL(s.wait / 1.7, 0, 1) : s.ph === 'arrive' ? CL((2.4 - s.wait) / 2.4, 0, 1) : mv ? 0.16 : 0;
    s.lurch = s.ph === 'depart' ? -1 : s.ph === 'arrive' ? 1 : Math.sin(s.t * 2.1);
    // you
    if (s.seat < 0) {
      if (drive(s.me, api.keys, api.keys.shift ? 128 : 94, dt)) s.hold = null;
      if (s.hold && Math.hypot(s.hold.x - s.me.x, s.hold.y - s.me.y) > 30) s.hold = null;
      if (s.grace > 0) { s.grace -= dt; s.sway = 0; }
      else s.sway = CL(s.sway + dt * (mv ? (s.hold ? -1.4 : 0.06 + s.mag * 0.85) : -1.6), 0, 1);
      if (s.sway >= 1) stumble(s);
      confine(s.me, last && s.door > 0.5);
      if (last && s.door > 0.5 && (s.me.y < CAR.Y0 - 4 || s.me.y > CAR.Y1 + 4)) { endRide(s, api, true); return; }
    } else { s.sway = CL(s.sway - dt * 2, 0, 1); const q = s.seats[s.seat]; s.me.x = q.x; s.me.y = q.y; }
    // everyone else
    s.crowd.forEach(p => {
      p.ph += dt;
      if (p.delay > 0) { p.delay -= dt; return; }
      if (p.st === 'stand' || p.st === 'asking') { p.anim = 0; return; }
      steer(p, p.tx, p.ty, p.sp, dt);
      if (Math.hypot(p.tx - p.x, p.ty - p.y) < 2.5) arriveAt(s, p);
    });
    const bodies = s.crowd.filter(p => p.st === 'stand' || p.st === 'asking');
    if (s.seat < 0) bodies.push(s.me);
    bump(bodies, 13, false);
    bodies.forEach(p => {
      if (p !== s.me) confine(p);
      POLEX.forEach(px => POLEY.forEach(py => {
        const dx = p.x - px, dy = p.y - py, d = Math.hypot(dx, dy);
        if (d < 9 && d > 0) { p.x = px + dx / d * 9; p.y = py + dy / d * 9; }
      }));
    });
    s.crowd = s.crowd.filter(p => !p.gone);
    // someone standing over your seat
    if (s.cue) {
      const c = s.cue, q = s.seats[c.seat];
      c.left -= dt;
      if (c.p.gone) s.cue = null;
      else if (q.who !== 'lisa') {
        q.who = c.p.name; q.off = STOPS.length - 1; c.p.gone = true; s.cue = null;
        s.care++; s.pardon = true; s.msg = c.title + ' takes the seat · “thank you, ah”';
      } else if (c.left <= 0) {
        s.care--; c.p.st = 'stand'; c.p.hold = nearGrab(c.p, 40); s.cue = null;
        s.msg = c.title + ' stands the whole way';
      }
    }
    // standing in the doorway while people board
    if (s.door > 0.5 && s.seat < 0) {
      const well = DOORX.some(x => Math.abs(s.me.x - x) < DHW - 2) && (s.me.y < AY0 + 6 || s.me.y > AY1 - 6);
      if (well) {
        s.block += dt;
        if (s.block > 1.5 && !s.blamed) { s.care--; s.blamed = true; s.msg = 'You blocked the door the whole stop'; }
        else if (s.block > 0.5 && !s.blamed) s.msg = 'Move in please';
      } else s.block = Math.max(0, s.block - dt * 2);
    }
    // the train itself
    s.wait -= dt;
    if (s.ph === 'depart') {
      s.door = Math.max(0, s.door - dt * 2.4);
      if (s.wait <= 0) { s.ph = 'ride'; s.wait = 2.8; s.msg = 'Next station · ' + STOPS[s.stop] + ' · seats go back in play'; }
      return;
    }
    if (s.ph === 'ride') { if (s.wait <= 0) { s.ph = 'arrive'; s.wait = 2.4; everyoneUp(s); } return; }
    if (s.ph === 'arrive') { if (s.wait <= 0) { s.ph = 'open'; s.wait = last ? 7 : 5.6; s.blamed = false; s.block = 0; station(s); } return; }
    if (s.ph === 'open') {
      s.door = Math.min(1, s.door + dt * 2.2);
      if (s.wait <= 0) {
        s.ph = 'closing'; s.wait = 1.4;
        if (!last) s.marks.push(s.seat >= 0 || s.pardon);
        s.msg = s.seat >= 0 || s.pardon || last ? 'Doors closing' : 'Doors closing · no seat';
      }
      return;
    }
    if (s.ph === 'closing') {
      s.door = Math.max(0, s.door - dt * 1.7);
      if (s.wait <= 0) {
        if (last) { endRide(s, api, false); return; }
        if (s.seat < 0 && !s.pardon) { endRide(s, api, false, STOPS[s.stop]); return; }
        s.stop++; s.ph = 'depart'; s.wait = 1.7; s.msg = 'Next station · ' + STOPS[s.stop];
        restation(s);
      }
    }
  },
  draw(s, ctx, api) {
    const t = s.t, mv = s.ph === 'depart' || s.ph === 'ride' || s.ph === 'arrive';
    ctx.fillStyle = '#0d1014'; ctx.fillRect(0, 0, VW, VH);
    ctx.save();
    ctx.translate(Math.round(s.lurch * s.mag * 2 + Math.sin(t * 15) * s.mag * 1.2), Math.round(Math.sin(t * 19) * s.mag * 0.8));
    outside(ctx, s, t, mv, api);
    carShell(ctx, s, t, mv);
    carEnds(ctx, s, api, t, mv);
    benches(ctx, s);
    // the seats, then anyone in them
    let reach = null;
    if (s.seat < 0) s.seats.forEach(q => {
      if (q.who) return;
      const d = Math.hypot(q.x - s.me.x, q.y - s.me.y);
      if (d < 34 && (!reach || d < reach[0])) reach = [d, q];
    });
    s.seats.forEach(q => {
      if (q.who) seatedBody(ctx, api, q.who, q.x, q.y, !!q.side, q.who === 'lisa');
      else if (s.seat < 0) freeMark(ctx, q, t, !!reach && reach[1] === q);
    });
    POLEX.forEach(px => POLEY.forEach(py => pole(ctx, px, py)));
    const order = s.crowd.slice();
    if (s.seat < 0) order.push(s.me);
    order.sort((a, b) => a.y - b.y).forEach(p => {
      const sw = mv ? Math.sin(t * 9 + p.ph) * (0.5 + s.mag * 2.4) * (p.hold ? 0.3 : 1) : 0;
      const off = p.me ? Math.sin(t * 11) * (0.6 + s.sway * 3.4) + (mv ? s.lurch * s.mag * 1.6 : 0) : sw;
      person(ctx, api, { name: p.name, x: p.x + off, y: p.y, dir: p.dir, anim: p.anim, stun: 0 }, p.me ? '#e8c060' : null);
      if (p.need && (p.st === 'asking' || p.st === 'ask')) careCue(ctx, p, t);
    });
    if (s.hold) {
      ctx.strokeStyle = 'rgba(240,206,110,0.85)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(s.me.x, s.me.y - 14); ctx.lineTo(s.hold.x, s.hold.y); ctx.stroke();
      ctx.fillStyle = 'rgba(240,206,110,0.9)'; ctx.fillRect(s.hold.x - 2, s.hold.y - 2, 4, 4);
    }
    if (s.cue) { const q = s.seats[s.cue.seat]; corona(ctx, q.x, q.y - 4, 22, t, true); chev(ctx, q.x, q.y - 34, t, '#f3d0dc'); }
    rails(ctx, s, t);
    ctx.restore();
    gauges(ctx, s, t, mv);
  },
  hud(s, b) {
    const sat = s.marks.filter(Boolean).length;
    const stats = [['Station', Math.min(s.stop + 1, STOPS.length) + ' of ' + STOPS.length], ['Rounds', sat + ' won'], ['Care', (s.care > 0 ? '+' : '') + s.care]];
    const chips = s.marks.map((m, i) => [SHORT[i] + (m ? ' · sat' : ' · stood'), m]);
    const o = s.over;
    return {
      title: 'MRT · Tenang line', stats, chips, msg: s.msg,
      help: 'WASD to move · Space to take a seat or hold on · Escape to get off',
      end: !o ? null : {
        kicker: 'Musical chairs · five stations', title: grade(o),
        line: 'Rounds won ' + o.sat + ' of ' + (STOPS.length - 1) + ' · care ' + (o.care > 0 ? '+' : '') + o.care + ' · ' + o.knocks + ' stumbles · best today ' + (b.best || 0),
        note: o.out
          ? 'No seat when the doors shut, so Lisa gets off and waits for the next train. Nothing on this platform counts towards Legacy Day.'
          : o.alighted
            ? 'She walks up to Tenang Avenue. Nothing on this train counts towards Legacy Day.'
            : 'The doors closed with Lisa still inside. She rides on to the depot and walks back. Nothing here counts towards Legacy Day.',
        again: 'Ride again'
      }
    };
  }
};
// ---- the carriage, drawn ----
function outside(ctx, s, t, mv, api) {
  [[CAR.Y0, 0], [CAR.Y1, 1]].forEach(([edge, side]) => {
    const y0 = side ? edge : -8, y1 = side ? VH + 8 : edge, h = y1 - y0;
    if (!mv) {
      ctx.fillStyle = '#8e9699'; ctx.fillRect(-8, y0, VW + 16, h);
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let x = -8; x < VW + 8; x += 9) ctx.fillRect(x, y0 + ((x * 13) % Math.max(4, h - 2)), 4, 1);
      const ey = side ? y0 + 12 : y1 - 16;
      ctx.fillStyle = '#c9a02c'; ctx.fillRect(-8, ey, VW + 16, 5);
      ctx.fillStyle = 'rgba(120,92,16,0.55)'; for (let x = -6; x < VW + 8; x += 7) ctx.fillRect(x, ey + 1, 3, 3);
      const py = side ? y0 + 3 : y1 - 9;
      ctx.fillStyle = 'rgba(228,238,242,0.55)'; ctx.fillRect(-8, py, VW + 16, 6);
      ctx.fillStyle = 'rgba(146,164,174,0.85)';
      for (let x = -8; x < VW + 8; x += 36) ctx.fillRect(x, py, 2, 6);
      DOORX.forEach(dx => {
        const g = Math.round(s.door * 33);
        ctx.save(); ctx.beginPath(); ctx.rect(dx - DHW + 2, py - 2, DHW * 2 - 4, 10); ctx.clip();
        ctx.fillStyle = '#8e9699'; ctx.fillRect(dx - DHW + 2, py - 1, DHW * 2 - 4, 8);
        ctx.fillStyle = 'rgba(228,238,242,0.8)';
        ctx.fillRect(dx - DHW + 2 - g, py, DHW - 3, 6); ctx.fillRect(dx + 1 + g, py, DHW - 3, 6);
        ctx.restore();
      });
      if (!side) {
        s.plat.forEach(p => person(ctx, api, { name: p.name, x: p.x, y: 66 + Math.sin(t * 1.5 + p.ph), dir: p.dir, anim: 0, stun: 0 }, null));
        ctx.fillStyle = '#f4f6f6'; ctx.fillRect(398, 18, 146, 26);
        ctx.fillStyle = MC.red; ctx.fillRect(398, 18, 146, 4);
        ctx.strokeStyle = '#6e777c'; ctx.lineWidth = 1; ctx.strokeRect(398.5, 18.5, 145, 25);
        txt(ctx, STOPS[s.stop].toUpperCase(), 471, 38, '#26303a', 13, 'center');
      }
    } else {
      ctx.fillStyle = '#10151b'; ctx.fillRect(-8, y0, VW + 16, h);
      ctx.fillStyle = 'rgba(120,150,180,0.08)'; ctx.fillRect(-8, side ? y0 : y1 - 12, VW + 16, 12);
      for (let k = 0; k < 30; k++) {
        const sp = 520 + (k % 5) * 180, x = ((k * 61 + t * sp) % (VW + 140)) - 140;
        ctx.fillStyle = k % 4 ? 'rgba(148,178,208,0.16)' : 'rgba(210,190,140,0.2)';
        ctx.fillRect(x, y0 + 3 + ((k * 7) % Math.max(3, h - 6)), 40 + (k % 3) * 26, 2);
      }
    }
  });
}
function carShell(ctx, s, t, mv) {
  const W = CAR.X1 - CAR.X0;
  ctx.fillStyle = MC.floor; ctx.fillRect(CAR.X0, CAR.Y0, W, CAR.Y1 - CAR.Y0);
  // the walked-smooth aisle, with the fine vinyl ribs only where feet go
  ctx.fillStyle = MC.aisle; ctx.fillRect(CAR.X0 + 3, AY0 - 8, W - 6, AY1 - AY0 + 16);
  ctx.fillStyle = 'rgba(196,206,210,0.55)';
  for (let y = AY0 - 4; y < AY1 + 8; y += 12) ctx.fillRect(CAR.X0 + 8, y, W - 16, 1);
  // door wells and their yellow thresholds
  DOORX.forEach(dx => [0, 1].forEach(side => {
    const x0 = dx - DHW + 3, w = DHW * 2 - 6, y0 = side ? BB0 : BT0;
    ctx.fillStyle = '#d7dcdf'; ctx.fillRect(x0, y0, w, PAD);
    ctx.fillStyle = MC.thresh; ctx.fillRect(x0, side ? BB1 - 5 : BT0 + 1, w, 4);
    ctx.fillStyle = 'rgba(120,92,16,0.4)';
    for (let x = x0 + 1; x < x0 + w - 2; x += 6) ctx.fillRect(x, side ? BB1 - 4 : BT0 + 2, 3, 2);
  }));
  [0, 1].forEach(side => {
    const wy = side ? BB1 : CAR.Y0;
    ctx.fillStyle = MC.panel; ctx.fillRect(CAR.X0, wy, W, WALL);
    ctx.fillStyle = MC.skin; ctx.fillRect(CAR.X0, side ? wy + WALL - 4 : wy, W, 4);
    ctx.fillStyle = MC.panelD; ctx.fillRect(CAR.X0, side ? wy : wy + WALL - 1, W, 1);
    // windows over each bench run
    [BAYS[1], BAYS[2]].forEach(([x0, x1]) => {
      const gx = x0 + 4, gw = x1 - x0 - 8, gy = side ? wy + WALL - 19 : wy + 4;
      ctx.fillStyle = mv ? '#2b3b47' : MC.glass; ctx.fillRect(gx, gy, gw, 15);
      if (mv) for (let k = 0; k < 9; k++) {
        const x = CL(gx + ((k * 37 + t * 620) % (gw + 60)) - 30, gx, gx + gw);
        ctx.fillStyle = k % 3 ? 'rgba(150,186,210,0.26)' : 'rgba(214,196,150,0.28)';
        ctx.fillRect(x, gy + 2 + (k % 4) * 3, Math.min(28, gx + gw - x), 2);
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(gx, gy, gw, 4);
        ctx.fillStyle = 'rgba(70,90,100,0.2)'; ctx.fillRect(gx, gy + 11, gw, 4);
      }
      ctx.strokeStyle = '#8d979d'; ctx.lineWidth = 1; ctx.strokeRect(gx + 0.5, gy + 0.5, gw - 1, 14);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(gx + (gw >> 1), gy, 1, 15);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(gx + ((gw * 2 / 3) | 0), gy, 1, 15);
    });
    // doorways: two leaves sliding apart, rubber seal on the leading edge
    DOORX.forEach(dx => {
      const g = Math.round(s.door * 33), x0 = dx - DHW;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, wy, DHW * 2, WALL); ctx.clip();
      ctx.fillStyle = mv ? '#2f3d48' : '#7f888c'; ctx.fillRect(x0, wy, DHW * 2, WALL);
      [[x0 - g, 1], [dx + g, 0]].forEach(([lx, left]) => {
        ctx.fillStyle = MC.door; ctx.fillRect(lx, wy, DHW, WALL);
        ctx.fillStyle = mv ? '#3b4b56' : MC.glass; ctx.fillRect(lx + 5, side ? wy + 5 : wy + 6, DHW - 10, 17);
        ctx.strokeStyle = MC.doorE; ctx.lineWidth = 1; ctx.strokeRect(lx + 0.5, wy + 0.5, DHW - 1, WALL - 1);
        ctx.fillStyle = '#3c4349'; ctx.fillRect(left ? lx + DHW - 2 : lx, wy + 1, 2, WALL - 2);
      });
      ctx.restore();
    });
    [BAYS[0][1] - 26, BAYS[3][0] + 4].forEach(bx => {
      const by = side ? wy + WALL - 18 : wy + 4;
      ctx.fillStyle = '#f6f8f8'; ctx.fillRect(bx, by, 24, 14);
      ctx.strokeStyle = '#9aa4a9'; ctx.lineWidth = 1; ctx.strokeRect(bx + 0.5, by + 0.5, 23, 13);
      ctx.strokeStyle = MC.red; ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(bx + 3, by + 10); ctx.lineTo(bx + 10, by + 4); ctx.lineTo(bx + 21, by + 4); ctx.stroke();
      ctx.fillStyle = '#2e5aa0'; [[bx + 3, by + 10], [bx + 10, by + 4], [bx + 16, by + 4], [bx + 21, by + 4]].forEach(([px, py]) => ctx.fillRect(px - 1, py - 1, 2, 2));
    });
    if (side) {
      // the in-car display, over the middle door
      const dx = 254, dy = wy + 6;
      ctx.fillStyle = '#1c2228'; ctx.fillRect(dx, dy, 68, 13);
      ctx.strokeStyle = '#4a545c'; ctx.lineWidth = 1; ctx.strokeRect(dx + 0.5, dy + 0.5, 67, 12);
      const label = (mv ? '▸ ' : '· ') + STOPS[s.stop].toUpperCase();
      txt(ctx, label.slice(0, 14), dx + 34, dy + 9, '#f0b849', 8, 'center');
    }
    // show you care, over the four priority seats
    [BAYS[0][0] + 2, BAYS[3][1] - 20].forEach(nx => {
      const ny = side ? wy + WALL - 18 : wy + 4;
      ctx.fillStyle = '#f2c7d4'; ctx.fillRect(nx, ny, 18, 14);
      ctx.strokeStyle = '#c98da0'; ctx.lineWidth = 1; ctx.strokeRect(nx + 0.5, ny + 0.5, 17, 13);
      ctx.fillStyle = '#8c5468'; ctx.fillRect(nx + 3, ny + 4, 12, 2); ctx.fillRect(nx + 3, ny + 8, 8, 2);
    });
  });
}
// Past both ends: the gangway bellows and the next carriage through it, so the
// train reads as a train. Everything beyond our end wall sits under a wash.
const ENDS = [{ car: [0, 52], gap: [52, 72], wall: [72, 80], dir: -1 },
              { wall: [496, 504], gap: [504, 524], car: [524, VW], dir: 1 }];
function carEnds(ctx, s, api, t, mv) {
  const gy0 = (AY0 + AY1) / 2 - 20, GH = 40;
  ENDS.forEach(E => {
    const [cx0, cx1] = E.car, [gx0, gx1] = E.gap, [wx0] = E.wall;
    // the next carriage: same fittings, seen end-on down the train
    ctx.fillStyle = MC.floor; ctx.fillRect(cx0, CAR.Y0, cx1 - cx0, CAR.Y1 - CAR.Y0);
    ctx.fillStyle = MC.aisle; ctx.fillRect(cx0, AY0 - 8, cx1 - cx0, AY1 - AY0 + 16);
    [0, 1].forEach(side => {
      const wy = side ? BB1 : CAR.Y0, by = side ? BB0 : BT0;
      ctx.fillStyle = MC.panel; ctx.fillRect(cx0, wy, cx1 - cx0, WALL);
      ctx.fillStyle = MC.skin; ctx.fillRect(cx0, side ? wy + WALL - 4 : wy, cx1 - cx0, 4);
      ctx.fillStyle = mv ? '#2b3b47' : MC.glass;
      ctx.fillRect(cx0 + 5, side ? wy + WALL - 18 : wy + 4, cx1 - cx0 - 12, 14);
      ctx.strokeStyle = '#8d979d'; ctx.lineWidth = 1;
      ctx.strokeRect(cx0 + 5.5, (side ? wy + WALL - 18 : wy + 4) + 0.5, cx1 - cx0 - 13, 13);
      ctx.fillStyle = MC.seat; ctx.fillRect(cx0, by, cx1 - cx0, PAD);
      ctx.fillStyle = MC.seatD; ctx.fillRect(cx0, side ? by + PAD - 10 : by, cx1 - cx0, 10);
      ctx.fillStyle = MC.seatE; ctx.fillRect(cx0, side ? by : by + PAD - 2, cx1 - cx0, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      for (let x = cx0 + 12; x < cx1 - 4; x += 22) ctx.fillRect(x, by, 1, PAD);
    });
    s.next.filter(p => p.dir === E.dir).forEach(p => seatedBody(ctx, api, p.name, p.x, SIT[p.side], !!p.side, false));
    pole(ctx, E.dir < 0 ? cx0 + 14 : cx1 - 14, POLEY[0]);
    pole(ctx, E.dir < 0 ? cx0 + 14 : cx1 - 14, POLEY[1]);
    ctx.fillStyle = 'rgba(12,18,24,0.24)'; ctx.fillRect(cx0, CAR.Y0, cx1 - cx0, CAR.Y1 - CAR.Y0);
    // the bellows between the cars
    ctx.fillStyle = '#464f57'; ctx.fillRect(gx0, CAR.Y0, gx1 - gx0, CAR.Y1 - CAR.Y0);
    ctx.fillStyle = '#586470';
    for (let x = gx0 + 2; x < gx1 - 1; x += 4) ctx.fillRect(x, CAR.Y0, 1, CAR.Y1 - CAR.Y0);
    ctx.fillStyle = '#9aa2a6'; ctx.fillRect(gx0, gy0, gx1 - gx0, GH);
    ctx.fillStyle = '#7f8890';
    for (let x = gx0 + 3; x < gx1 - 1; x += 5) ctx.fillRect(x, gy0, 2, GH);
    ctx.fillStyle = MC.chrome; ctx.fillRect(gx0, gy0 - 2, gx1 - gx0, 2); ctx.fillRect(gx0, gy0 + GH, gx1 - gx0, 2);
    // our own end wall, with its gangway door
    ctx.fillStyle = MC.panel; ctx.fillRect(wx0, CAR.Y0, 8, CAR.Y1 - CAR.Y0);
    ctx.fillStyle = MC.panelD; ctx.fillRect(E.dir < 0 ? wx0 : wx0 + 7, CAR.Y0, 1, CAR.Y1 - CAR.Y0);
    ctx.fillStyle = MC.skin; ctx.fillRect(wx0, CAR.Y0, 8, 3); ctx.fillRect(wx0, CAR.Y1 - 3, 8, 3);
    ctx.fillStyle = 'rgba(30,40,48,0.5)'; ctx.fillRect(wx0 + 1, gy0, 6, GH);
    ctx.fillStyle = MC.chrome; ctx.fillRect(wx0 + (E.dir < 0 ? 7 : 0), gy0 - 4, 1, GH + 8);
    ctx.fillStyle = MC.thresh; ctx.fillRect(wx0 + 1, gy0 + GH - 2, 6, 2);
  });
  ctx.strokeStyle = '#6a747a'; ctx.lineWidth = 2;
  ctx.strokeRect(-2, CAR.Y0 + 1, VW + 4, CAR.Y1 - CAR.Y0 - 2);
}
function benches(ctx, s) {
  s.seats.forEach(q => {
    const x = Math.round(q.x - q.w / 2), w = Math.round(q.w), y0 = q.side ? BB0 : BT0;
    ctx.fillStyle = q.pri ? MC.pri : MC.seat; ctx.fillRect(x, y0, w, PAD);
    ctx.fillStyle = q.pri ? MC.priD : MC.seatD; ctx.fillRect(x, q.side ? y0 + PAD - 11 : y0, w, 11);
    ctx.fillStyle = q.pri ? '#1b3768' : MC.seatE; ctx.fillRect(x, q.side ? y0 : y0 + PAD - 2, w, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fillRect(x, y0, 1, PAD);
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(x + 2, q.side ? y0 + 4 : y0 + 13, w - 4, 1);
    ctx.fillStyle = q.pri ? 'rgba(255,255,255,0.1)' : 'rgba(78,146,189,0.22)';
    for (let dy = y0 + (q.side ? 6 : 15); dy < y0 + PAD - (q.side ? 14 : 4); dy += 6)
      for (let dx = x + 4; dx < x + w - 4; dx += 7) ctx.fillRect(dx, dy, 2, 2);
    if (q.pri) {
      ctx.fillStyle = MC.arm;
      ctx.fillRect(q.x > 288 ? x + w - 3 : x, y0 + (q.side ? 4 : PAD - 18), 3, 14);
    }
  });
  [0, 1].forEach(side => BAYS.forEach(([x0, x1]) => {
    const y0 = (side ? BB0 : BT0) + (side ? 3 : PAD - 17);
    ctx.fillStyle = MC.arm; ctx.fillRect(x0 - 3, y0, 3, 14); ctx.fillRect(x1, y0, 3, 14);
  }));
}
function seatedBody(ctx, api, name, x, y, back, me) {
  const sp = api.sprite(name), img = back ? sp.b0 : sp.f0;
  ctx.fillStyle = 'rgba(24,34,44,0.16)'; ctx.fillRect(Math.round(x - 7), Math.round(y - 2), 14, 3);
  ctx.drawImage(img, 0, 0, 16, 18, Math.round(x - 8), Math.round(y - 17), 16, 18);
  if (me) {
    ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 1;
    ctx.strokeRect(Math.round(x - 8) + 0.5, Math.round(y - 18) + 0.5, 15, 19);
  }
}
function freeMark(ctx, q, t, hot) {
  if (hot) { corona(ctx, q.x, q.y - 5, 17, t, true); chev(ctx, q.x, q.y - 28, t); return; }
  const a = 0.3 + 0.18 * Math.sin(t * 2.2 + q.x * 0.08), y = q.y - 25;
  ctx.fillStyle = 'rgba(28,24,16,0.3)';
  ctx.beginPath(); ctx.moveTo(q.x - 5, y - 1); ctx.lineTo(q.x + 5, y - 1); ctx.lineTo(q.x, y + 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,248,214,' + a + ')';
  ctx.beginPath(); ctx.moveTo(q.x - 4, y); ctx.lineTo(q.x + 4, y); ctx.lineTo(q.x, y + 4); ctx.closePath(); ctx.fill();
}
function pole(ctx, x, y) {
  // a floor-to-ceiling pole: base ring on the floor, shaft leaning up the screen
  ctx.fillStyle = 'rgba(24,30,36,0.18)';
  ctx.beginPath(); ctx.ellipse(x + 3, y + 3, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(52,64,74,0.5)'; ctx.fillRect(x - 3, y - 26, 6, 26);
  ctx.fillStyle = MC.chrome; ctx.fillRect(x - 2, y - 26, 4, 26);
  ctx.fillStyle = MC.chromeHi; ctx.fillRect(x - 1, y - 26, 2, 26);
  ctx.fillStyle = MC.chrome; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = MC.chromeHi; ctx.beginPath(); ctx.arc(x - 1.2, y - 1.4, 2.1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(88,102,114,0.85)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.stroke();
}
function rails(ctx, s, t) {
  RAILY.forEach((ry, i) => {
    ctx.fillStyle = 'rgba(58,70,78,0.18)'; ctx.fillRect(CAR.X0 + 20, ry + 2, CAR.X1 - CAR.X0 - 40, 1);
    ctx.fillStyle = 'rgba(198,212,222,0.55)'; ctx.fillRect(CAR.X0 + 20, ry - 1, CAR.X1 - CAR.X0 - 40, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(CAR.X0 + 20, ry - 1, CAR.X1 - CAR.X0 - 40, 1);
    for (let x = CAR.X0 + 26; x < CAR.X1 - 20; x += 34) handle(ctx, x + Math.sin(t * 2.4 + x * 0.05 + i * 1.7) * (0.8 + s.mag * 3.2), ry);
  });
}
function handle(ctx, x, y) {
  // a strap and a triangular grip, hanging over the aisle
  ctx.fillStyle = 'rgba(52,64,72,0.28)'; ctx.fillRect(x + 1, y + 4, 2, 10);
  ctx.fillStyle = '#5f6d76'; ctx.fillRect(x - 2, y, 4, 8);
  ctx.fillStyle = '#eef3f5'; ctx.fillRect(x - 1, y, 2, 8);
  ctx.fillStyle = '#5f6d76';
  ctx.beginPath(); ctx.moveTo(x - 5, y + 6); ctx.lineTo(x + 5, y + 6); ctx.lineTo(x, y + 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#eff4f6';
  ctx.beginPath(); ctx.moveTo(x - 4, y + 7); ctx.lineTo(x + 4, y + 7); ctx.lineTo(x, y + 13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(126,142,152,0.8)';
  ctx.beginPath(); ctx.moveTo(x - 2.2, y + 8.4); ctx.lineTo(x + 2.2, y + 8.4); ctx.lineTo(x, y + 11.4); ctx.closePath(); ctx.fill();
}
function careCue(ctx, p, t) {
  const y = p.y - 30 + Math.sin(t * 3) * 1.5;
  ctx.fillStyle = '#f7f1e3'; ctx.fillRect(p.x - 9, y - 9, 18, 13);
  ctx.strokeStyle = '#8c5468'; ctx.lineWidth = 1; ctx.strokeRect(p.x - 8.5, y - 8.5, 17, 12);
  ctx.fillStyle = '#c0485f';
  ctx.fillRect(p.x - 3, y - 6, 2, 2); ctx.fillRect(p.x + 1, y - 6, 2, 2);
  ctx.fillRect(p.x - 4, y - 4, 8, 2); ctx.fillRect(p.x - 3, y - 2, 6, 2); ctx.fillRect(p.x - 1, y, 2, 2);
}
function gauges(ctx, s, t, mv) {
  if (s.over) return;
  if (s.seat < 0) bar(ctx, 26, 366, 118, 8, 1 - s.sway, s.sway > 0.7 ? '#e2553c' : s.hold ? '#7fb98e' : '#e8a848', s.hold ? 'HOLDING ON' : 'BALANCE');
  if (s.ph === 'open') bar(ctx, VW - 144, 366, 118, 8, CL(s.wait / (s.stop === STOPS.length - 1 ? 7.5 : 5.6), 0, 1), s.wait < 2 ? '#e2553c' : '#e8a848', 'DOORS');
  else if (mv) txt(ctx, s.ph === 'arrive' ? 'SLOWING' : 'RUNNING', VW - 26, 374, 'rgba(246,236,210,0.7)', 9, 'right');
  if (s.stop === STOPS.length - 1 && s.door > 0.4) txt(ctx, 'TENANG · STEP OUT THROUGH ANY DOOR', VW / 2, 374, '#f3d08a', 10, 'center');
  else txt(ctx, 'TENANG LINE · WESTBOUND', VW / 2, 374, 'rgba(246,236,210,0.55)', 9, 'center');
}

/* ---------------------------------------------------------------- CHOPE ---- */
// Musical chairs with tissue packets. Trays and uncles wander across your run.
const HCG = { X0: 104, X1: 472, Y0: 76, Y1: 318 };
const TABLES = [[168, 134], [288, 124], [408, 134], [216, 244], [360, 244]];
const CHOPE_RIVALS = ['auntieA', 'uncleA', 'shopperA', 'customerA', 'vendorD'];
const STALLS = [
  { n: '01', name: 'KOPI · TEH', c: '#c8412c', d: '#8f2a1a' },
  { n: '02', name: 'MEE POK TA', c: '#e0a02c', d: '#a06c14' },
  { n: '03', name: 'NASI PADANG', c: '#2f7a4e', d: '#1d5334' },
  { n: '04', name: 'CHICKEN RICE', c: '#2b6cae', d: '#1a4574' },
  { n: '05', name: 'SATAY · BBQ', c: '#a8413f', d: '#72272a' }
];
const SW = VW / 5;

// The pavilion is drawn once into an offscreen canvas; only steam and lamp glow move.
function chopeBg() {
  const c = document.createElement('canvas'); c.width = VW; c.height = VH;
  const x = c.getContext('2d');
  const G = '#2f5740', GL = '#437a58', GD = '#1d3a2a';
  x.fillStyle = '#2a2f2b'; x.fillRect(0, 0, VW, VH);

  // vaulted ceiling with its ribbed panels
  x.fillStyle = '#ded9c9'; x.fillRect(0, 0, VW, 34);
  for (let i = 0; i < VW; i += 10) { x.fillStyle = 'rgba(255,255,255,0.22)'; x.fillRect(i, 0, 5, 34); }
  x.fillStyle = 'rgba(40,48,42,0.18)'; x.fillRect(0, 0, VW, 6);
  // cast-iron trusses: apex, rafters, king post, lattice
  for (let bx = -48; bx < VW + 48; bx += 96) {
    x.strokeStyle = G; x.lineWidth = 3;
    x.beginPath(); x.moveTo(bx, 32); x.lineTo(bx + 48, 6); x.lineTo(bx + 96, 32); x.stroke();
    x.strokeStyle = GL; x.lineWidth = 1;
    x.beginPath(); x.moveTo(bx + 48, 8); x.lineTo(bx + 48, 30); x.stroke();
    for (let k = 1; k <= 3; k++) {
      const px = bx + k * 12, py = 32 - k * 5;
      x.beginPath(); x.moveTo(px, 31); x.lineTo(px + 8, py); x.stroke();
      x.beginPath(); x.moveTo(bx + 96 - k * 12, 31); x.lineTo(bx + 96 - k * 12 - 8, py); x.stroke();
    }
    x.fillStyle = GL; x.beginPath(); x.arc(bx + 48, 6, 2.5, 0, Math.PI * 2); x.fill();
  }
  x.fillStyle = G; x.fillRect(0, 30, VW, 4);
  x.fillStyle = GD; x.fillRect(0, 34, VW, 2);
  for (let i = 4; i < VW; i += 12) { x.fillStyle = 'rgba(200,220,206,0.35)'; x.fillRect(i, 31, 2, 2); }

  // stall row: signboard, lit menu panel, counter
  STALLS.forEach((st, i) => {
    const sx = Math.round(i * SW), w = Math.round(SW);
    x.fillStyle = '#3c423c'; x.fillRect(sx, 36, w, 40);
    x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(sx + w - 3, 36, 3, 40);
    x.fillStyle = st.c; x.fillRect(sx + 3, 37, w - 6, 13);
    x.fillStyle = st.d; x.fillRect(sx + 3, 48, w - 6, 2);
    txt(x, st.name, sx + 8 + (w - 8) / 2, 47, '#fff6e4', 9, 'center');
    x.fillStyle = '#f2e8d2'; x.beginPath(); x.arc(sx + 10, 43.5, 5, 0, Math.PI * 2); x.fill();
    txt(x, st.n, sx + 10, 47, st.d, 8, 'center');
    // backlit photo menu
    x.fillStyle = '#f4efdf'; x.fillRect(sx + 4, 52, w - 8, 14);
    for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) {
      x.fillStyle = ['#d98b3a', '#b8452f', '#6f9a4a', '#d9c04a', '#8a5a3a'][(k + r * 2 + i) % 5];
      x.fillRect(sx + 7 + k * 20, 54 + r * 7, 8, 5);
      x.fillStyle = 'rgba(70,58,44,0.35)'; x.fillRect(sx + 17 + k * 20, 55 + r * 7, 8, 1);
      x.fillRect(sx + 17 + k * 20, 57 + r * 7, 5, 1);
    }
    x.strokeStyle = '#8e8676'; x.lineWidth = 1; x.strokeRect(sx + 4.5, 52.5, w - 9, 13);
    // counter, glass case, pots
    x.fillStyle = '#7d5a38'; x.fillRect(sx + 2, 66, w - 4, 10);
    x.fillStyle = '#9a7048'; x.fillRect(sx + 2, 66, w - 4, 3);
    x.fillStyle = 'rgba(226,240,246,0.5)'; x.fillRect(sx + 8, 68, 30, 7);
    x.strokeStyle = '#cfd8d6'; x.strokeRect(sx + 8.5, 68.5, 29, 6);
    x.fillStyle = '#3f4a4c'; x.beginPath(); x.ellipse(sx + 86, 71, 8, 4, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#5d6a6c'; x.beginPath(); x.ellipse(sx + 86, 70, 8, 3.4, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#2f3436'; x.fillRect(sx + 60, 68, 4, 8); x.fillRect(sx + 66, 70, 3, 6);
  });

  // terracotta floor, warmer inside the dining square
  x.fillStyle = '#8a7361'; x.fillRect(0, 76, VW, VH - 76);
  for (let gy = 76; gy < VH; gy += 16) for (let gx = 0; gx < VW; gx += 16) {
    x.fillStyle = ((gx + gy) / 16) % 2 ? 'rgba(255,240,220,0.05)' : 'rgba(40,28,20,0.06)';
    x.fillRect(gx, gy, 16, 16);
  }
  x.fillStyle = '#b39273'; x.fillRect(HCG.X0, HCG.Y0, HCG.X1 - HCG.X0, HCG.Y1 - HCG.Y0);
  x.strokeStyle = 'rgba(94,70,52,0.34)'; x.lineWidth = 1;
  for (let gx = HCG.X0; gx <= HCG.X1; gx += 16) { x.beginPath(); x.moveTo(gx + 0.5, HCG.Y0); x.lineTo(gx + 0.5, HCG.Y1); x.stroke(); }
  for (let gy = HCG.Y0; gy <= HCG.Y1; gy += 16) { x.beginPath(); x.moveTo(HCG.X0, gy + 0.5); x.lineTo(HCG.X1, gy + 0.5); x.stroke(); }
  for (let k = 0; k < 40; k++) { const gx = HCG.X0 + ((k * 61) % (HCG.X1 - HCG.X0)), gy = HCG.Y0 + ((k * 97) % (HCG.Y1 - HCG.Y0)); x.fillStyle = 'rgba(122,96,70,0.18)'; x.fillRect(gx, gy, 16, 16); }
  x.strokeStyle = 'rgba(58,44,32,0.45)'; x.lineWidth = 2; x.strokeRect(HCG.X0 - 1, HCG.Y0 - 1, HCG.X1 - HCG.X0 + 2, HCG.Y1 - HCG.Y0 + 2);

  // cast-iron columns down both flanks
  [26, VW - 26].forEach(cx => {
    x.fillStyle = 'rgba(20,24,20,0.28)'; x.beginPath(); x.ellipse(cx, 330, 16, 6, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = G; x.fillRect(cx - 5, 36, 10, 294);
    x.fillStyle = GL; x.fillRect(cx - 5, 36, 3, 294);
    x.fillStyle = GD; x.fillRect(cx + 2, 36, 3, 294);
    x.fillStyle = G; x.fillRect(cx - 11, 36, 22, 8); x.fillRect(cx - 9, 44, 18, 4);
    x.fillStyle = GL; x.fillRect(cx - 11, 36, 22, 2);
    x.fillStyle = G; x.fillRect(cx - 12, 322, 24, 10); x.fillStyle = GD; x.fillRect(cx - 12, 330, 24, 2);
    for (let k = 0; k < 5; k++) { x.fillStyle = 'rgba(200,220,206,0.22)'; x.fillRect(cx - 4, 60 + k * 54, 8, 2); }
  });

  // floor shadow under the stall row, then the odds and ends of a lunch hall
  const sh = x.createLinearGradient(0, 76, 0, 96);
  sh.addColorStop(0, 'rgba(28,20,14,0.38)'); sh.addColorStop(1, 'rgba(28,20,14,0)');
  x.fillStyle = sh; x.fillRect(0, 76, VW, 20);
  const stool = (px, py) => {
    for (let k = 3; k >= 0; k--) {
      x.fillStyle = k % 2 ? '#a8382c' : '#bf4436'; x.beginPath(); x.ellipse(px, py - k * 5, 10, 5, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(60,20,14,0.35)'; x.fillRect(px - 10, py - k * 5, 20, 2);
    }
  };
  x.fillStyle = 'rgba(20,24,20,0.24)'; x.beginPath(); x.ellipse(62, 356, 14, 5, 0, 0, Math.PI * 2); x.fill();
  stool(62, 354);
  // tray-return trolley
  x.fillStyle = 'rgba(20,24,20,0.24)'; x.beginPath(); x.ellipse(VW - 66, 358, 18, 6, 0, 0, Math.PI * 2); x.fill();
  x.fillStyle = '#4a5157'; x.fillRect(VW - 84, 330, 36, 26);
  x.fillStyle = '#5e666c'; x.fillRect(VW - 84, 330, 36, 4);
  x.fillStyle = '#39403f'; x.fillRect(VW - 80, 338, 28, 3); x.fillRect(VW - 80, 346, 28, 3);
  txt(x, 'TRAY', VW - 66, 336, '#c9d2cf', 8, 'center');
  // potted palms at the column feet
  [[26, 352], [VW - 26, 352]].forEach(([px, py]) => {
    x.fillStyle = 'rgba(20,24,20,0.24)'; x.beginPath(); x.ellipse(px, py + 6, 13, 5, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#2f6a42'; [[-9, -13], [0, -18], [9, -13], [-5, -8], [6, -9]].forEach(([dx, dy]) => {
      x.beginPath(); x.ellipse(px + dx, py + dy, 5, 8, dx * 0.06, 0, Math.PI * 2); x.fill();
    });
    x.fillStyle = '#8a5a3c'; x.fillRect(px - 9, py - 4, 18, 10);
    x.fillStyle = '#a06c48'; x.fillRect(px - 9, py - 4, 18, 3);
  });
  return c;
}

const chope = {
  init() {
    const s = { id: 'chope', t: 0, round: 1, ph: 'music', wait: R(2.4, 4.2), span: 0, msg: 'Music is on · circle the tables', over: null };
    s.span = s.wait;
    s.tbl = TABLES.map(([x, y]) => ({ x, y, by: null }));
    s.me = { name: 'lisa', x: 288, y: 192, dir: 'd', anim: 0, stun: 0, out: false, me: true };
    s.rivals = CHOPE_RIVALS.map((n, i) => ({ name: n, x: 142 + i * 60, y: 184 + (i % 2) * 38, dir: 'd', anim: 0, stun: 0, out: false, orb: R(0, 6.2) }));
    s.all = [s.me].concat(s.rivals);
    s.trays = [{ x: 60, y: 168, v: 62 }, { x: 520, y: 288, v: -68 }];
    s.uncles = [{ name: 'taichiA', x: 200, y: 100, v: 44, dir: 'd', anim: 0, stun: 0 }, { name: 'sweeper', x: 400, y: 300, v: -48, dir: 'u', anim: 0, stun: 0 }];
    return s;
  },
  live(s) { return 6 - s.round; },
  tick(s, dt, api) {
    s.t += dt;
    if (s.over) return;
    const live = chope.live(s), tbl = s.tbl.slice(0, live);
    s.all.forEach(p => { if (p.stun > 0) p.stun -= dt; });
    // trays glide, uncles walk, both knock you off your run
    s.trays.forEach(tr => { tr.x += tr.v * dt; if (tr.x > HCG.X1 + 44) tr.x = HCG.X0 - 44; if (tr.x < HCG.X0 - 44) tr.x = HCG.X1 + 44; });
    s.uncles.forEach(u => {
      u.y += u.v * dt; u.anim += dt * 6;
      if (u.y > HCG.Y1 - 20) { u.y = HCG.Y1 - 20; u.v = -u.v; u.dir = 'u'; }
      if (u.y < HCG.Y0 + 30) { u.y = HCG.Y0 + 30; u.v = -u.v; u.dir = 'd'; }
    });
    const knock = (p) => {
      s.trays.forEach(tr => { if (Math.abs(p.x - tr.x) < 16 && Math.abs(p.y - tr.y) < 12) { p.stun = Math.max(p.stun, 0.3); p.y += p.y < tr.y ? -6 : 6; } });
      s.uncles.forEach(u => { if (Math.hypot(p.x - u.x, p.y - u.y) < 13) { p.stun = Math.max(p.stun, 0.3); const d = Math.hypot(p.x - u.x, p.y - u.y) || 1; p.x += (p.x - u.x) / d * 5; p.y += (p.y - u.y) / d * 5; } });
    };
    if (s.ph === 'music' || s.ph === 'scramble') {
      if (s.me.stun <= 0) drive(s.me, api.keys, api.keys.shift ? 146 : 112, dt);
      s.rivals.forEach(p => {
        if (p.out || p.stun > 0) return;
        if (s.ph === 'music') { p.orb += dt * R(0.7, 1.1); const c = tbl[Math.floor((p.orb / 1.8) % live)] || tbl[0]; steer(p, c.x + Math.cos(p.orb) * 40, c.y + Math.sin(p.orb) * 26, 84, dt); }
        else {
          const free = tbl.filter(q => !q.by);
          if (!free.length) return;
          const g = free.reduce((a, q) => Math.hypot(q.x - p.x, q.y - p.y) < Math.hypot(a.x - p.x, a.y - p.y) ? q : a);
          steer(p, g.x, g.y + 16, R(90, 104), dt);
        }
      });
      bump(s.all, 12, true);
      s.all.forEach(p => { if (p.out) return; p.x = CL(p.x, HCG.X0 + 12, HCG.X1 - 12); p.y = CL(p.y, HCG.Y0 + 24, HCG.Y1 - 16); knock(p); });
    }
    if (s.ph === 'music') {
      s.wait -= dt;
      if (s.wait <= 0) { s.ph = 'scramble'; s.wait = 5; s.msg = 'Music stops · chope a table'; }
      return;
    }
    if (s.ph === 'scramble') {
      s.all.forEach(p => {
        if (p.out || p.sat) return;
        const hit = tbl.find(q => !q.by && Math.hypot(p.x - q.x, p.y - (q.y + 14)) < 20);
        if (hit) { hit.by = p; p.sat = hit; if (p.me) { s.msg = 'Tissue packet down · table is yours'; } }
      });
      s.wait -= dt;
      if (tbl.every(q => q.by) || s.wait <= 0) {
        s.ph = 'result'; s.wait = 1.5;
        s.all.forEach(p => { if (!p.out && !p.sat) { p.out = true; if (p.me) s.msg = 'No table · you are out'; } });
        if (!s.me.sat) { const b = api.board; b.games = (b.games || 0) + 1; b.best = Math.max(b.best || 0, s.round - 1); s.over = { won: false, round: s.round }; api.save(); }
        else if (live === 1) { const b = api.board; b.games = (b.games || 0) + 1; b.wins = (b.wins || 0) + 1; b.best = Math.max(b.best || 0, 5); s.over = { won: true, round: s.round }; api.save(); }
      }
      return;
    }
    if (s.ph === 'result') {
      s.wait -= dt;
      if (s.wait > 0 || s.over) return;
      s.round++;
      s.tbl.forEach(q => q.by = null);
      s.all.forEach((p, i) => { p.sat = null; if (!p.out) { p.x = 142 + i * 56; p.y = 196 + (i % 2) * 32; p.stun = 0; } });
      s.ph = 'music'; s.wait = R(2.2, 4); s.span = s.wait;
      s.msg = 'Round ' + s.round + ' · ' + chope.live(s) + ' tables left';
    }
  },
  draw(s, ctx, api) {
    const t = s.t, live = chope.live(s);
    if (!s.bgc) s.bgc = chopeBg();
    ctx.drawImage(s.bgc, 0, 0);
    // pendant lamps swing a little light over the hall
    for (let i = 0; i < 6; i++) {
      const lx = 48 + i * 96, fl = 0.82 + 0.18 * Math.sin(t * 1.7 + i);
      ctx.strokeStyle = '#2a3a30'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx, 8); ctx.lineTo(lx, 16); ctx.stroke();
      ctx.fillStyle = '#31513c'; ctx.beginPath(); ctx.moveTo(lx - 7, 24); ctx.lineTo(lx + 7, 24); ctx.lineTo(lx + 3, 16); ctx.lineTo(lx - 3, 16); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = fl; ctx.fillStyle = '#f7dc9a'; ctx.beginPath(); ctx.ellipse(lx, 25, 5, 2.4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.16 * fl; ctx.beginPath(); ctx.ellipse(lx, 30, 13, 8, 0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
    }
    // steam off the stall pots
    for (let i = 0; i < 5; i++) {
      const px = Math.round(i * SW) + 86;
      for (let k = 0; k < 3; k++) {
        const ph = ((t * 0.42) + k * 0.34 + i * 0.19) % 1;
        ctx.globalAlpha = 0.3 * (1 - ph); ctx.fillStyle = '#f4f1e6';
        ctx.beginPath(); ctx.ellipse(px + Math.sin((ph + i) * 5.2) * 4, 68 - ph * 20, 3 + ph * 4, 2 + ph * 2.4, 0, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    s.tbl.forEach((q, i) => {
      const on = i < live;
      ctx.globalAlpha = on ? 1 : 0.3;
      [[-24, 0], [24, 0], [0, -18], [0, 18]].forEach(([ox, oy]) => { ctx.fillStyle = '#6f757c'; ctx.beginPath(); ctx.ellipse(q.x + ox, q.y + oy, 7, 4, 0, 0, Math.PI * 2); ctx.fill(); });
      shadow(ctx, q.x, q.y + 12, 22);
      ctx.fillStyle = '#e6e2d6'; ctx.beginPath(); ctx.ellipse(q.x, q.y, 26, 15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#9aa0a4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(q.x, q.y, 26, 15, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(150,156,160,0.5)'; ctx.beginPath(); ctx.ellipse(q.x - 7, q.y - 3, 9, 4, 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      if (on && !q.by && s.ph === 'scramble') corona(ctx, q.x, q.y + 12, 24, t, true);
      if (q.by) { ctx.fillStyle = '#f6f4ee'; ctx.fillRect(Math.round(q.x) - 5, Math.round(q.y) - 3, 11, 7); ctx.fillStyle = '#c83838'; ctx.fillRect(Math.round(q.x) - 5, Math.round(q.y) - 1, 11, 2); ctx.strokeStyle = '#8d8f88'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(q.x) - 4.5, Math.round(q.y) - 2.5, 10, 6); }
    });
    s.trays.forEach(tr => {
      shadow(ctx, tr.x, tr.y + 6, 12);
      ctx.fillStyle = '#8d5f3a'; ctx.fillRect(Math.round(tr.x) - 13, Math.round(tr.y) - 6, 26, 12);
      ctx.strokeStyle = '#5f3f26'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(tr.x) - 12.5, Math.round(tr.y) - 5.5, 25, 11);
      ctx.fillStyle = '#f2efe6'; ctx.beginPath(); ctx.ellipse(tr.x - 5, tr.y, 5, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(tr.x + 6, tr.y, 4, 2.5, 0, 0, Math.PI * 2); ctx.fill();
    });
    s.uncles.forEach(u => person(ctx, api, u, null));
    s.all.slice().sort((a, b) => a.y - b.y).forEach(p => {
      if (p.out) { ctx.globalAlpha = 0.45; person(ctx, api, p, null); ctx.globalAlpha = 1; return; }
      person(ctx, api, p, p.me ? '#e8c060' : 'rgba(158,176,206,0.6)');
    });
    if (s.ph === 'music') bar(ctx, 214, 352, 148, 8, s.wait / s.span, '#d9ad62', 'MUSIC');
    else if (s.ph === 'scramble') bar(ctx, 214, 352, 148, 8, s.wait / 5, '#e2553c', 'CHOPE NOW');
  },
  hud(s, b) {
    const live = chope.live(s);
    const stats = [['Round', String(s.round)], ['Tables', live + ' for ' + s.all.filter(p => !p.out).length], ['Best', 'round ' + (b.best || 0)]];
    return {
      title: 'Hawker Centre · chope the table', stats,
      chips: [[s.ph === 'music' ? 'Music on' : s.ph === 'scramble' ? 'Music stopped' : 'Between rounds', s.ph === 'scramble'], ['Wins ' + (b.wins || 0), false]],
      msg: s.msg, help: 'WASD to move · Shift to squeeze past · tissue goes down by itself · Escape to leave',
      end: !s.over ? null : {
        kicker: 'Hawker Centre · lunch rush', title: s.over.won ? 'The last table is yours' : 'Out in round ' + s.over.round,
        line: s.over.won ? 'Five rounds, five tables gone, one tissue packet left standing' : 'Rounds survived · ' + (s.over.round - 1) + ' · best today round ' + (b.best || 0),
        note: 'The auntie clears the trays and it starts again. Nothing here counts towards Legacy Day.', again: 'Another round'
      }
    };
  }
};

/* ----------------------------------------------------------------- CHOP ---- */
// Chicken rice to order. Three cuts come off the poached bird — breast, thigh,
// wing — and each is chopped to the count on the ticket, then read as it lands:
// overlapping slices on a melamine plate with sauce, cucumber and a braised
// egg. Even portions score; bone splinters and the queue take it back.
const GA = (x, mu, c) => Math.exp(-Math.pow((x - mu) / c, 2));
const WJ1 = 0.254, WJ2 = 0.524;
// A wing is a fat drumette, a slimmer flat and a small tip, notched at the two
// joints; a thigh is domed on top and flat underneath with a knuckle at the end.
const wingUp = x => 0.14 + 0.72 * GA(x, 0.19, 0.17) + 0.5 * GA(x, 0.5, 0.16) + 0.16 * GA(x, 0.82, 0.14) - 0.08 * GA(x, WJ1, 0.035) - 0.06 * GA(x, WJ2, 0.035);
const wingDn = x => 0.22 + 0.3 * GA(x, 0.19, 0.17) + 0.14 * GA(x, 0.5, 0.17) + 0.02 * GA(x, 0.82, 0.14) - 0.04 * GA(x, WJ1, 0.035) - 0.03 * GA(x, WJ2, 0.035);
const thighUp = x => 0.20 + 0.86 * GA(x, 0.30, 0.25) + 0.30 * GA(x, 0.66, 0.13) + 0.26 * GA(x, 0.93, 0.07);
const legUp = x => 0.12 + 1.0 * GA(x, 0.28, 0.24) + 0.22 * GA(x, 0.94, 0.06);
const legDn = x => 0.12 + 0.72 * GA(x, 0.30, 0.25) + 0.20 * GA(x, 0.94, 0.06);
const thighDn = x => 0.30 + 0.46 * GA(x, 0.34, 0.24) + 0.10 * GA(x, 0.72, 0.16) + 0.16 * GA(x, 0.95, 0.06);
const CUTS = {
  Breast: {
    g: 250, pcs: [6, 7, 8, 9], time: 18, bone: [], ask: 'lean, off the bone',
    f: x => 0.22 + 0.86 * Math.exp(-Math.pow((x - 0.31) / 0.4, 2)) - 0.2 * Math.pow(x, 2.2),
    m: x => -0.18 * Math.sin(Math.PI * Math.pow(x, 0.9))
  },
  Thigh: {
    g: 215, pcs: [5, 6, 7], time: 16, bone: [[0.46, 0.70], [0.78, 0.99]], ask: 'dark meat, chop through',
    fUp: thighUp, fDn: thighDn, f: x => (thighUp(x) + thighDn(x)) / 2,
    m: x => 0.12 * Math.sin(Math.PI * Math.pow(x, 1.2))
  },
  Leg: {
    g: 140, pcs: [3, 4], time: 14, bone: [[0.5, 0.99]], ask: 'drumstick, meat end first',
    fUp: legUp, fDn: legDn, f: x => (legUp(x) + legDn(x)) / 2, bare: x => x > 0.86,
    m: x => 0.1 * Math.sin(Math.PI * x)
  },
  Wing: {
    g: 115, pcs: [3, 4], time: 14, bone: [[0.03, 0.21], [0.30, 0.48], [0.57, 0.96]], ask: 'find the two joints',
    joints: [WJ1, WJ2],
    fUp: wingUp, fDn: wingDn, f: x => (wingUp(x) + wingDn(x)) / 2,
    m: x => x < 0.3 ? 0 : 0.36 * (x - 0.3)
  }
};
const CB = { X0: 146, X1: 474, Y: 226, H: 68 };
const PLATE = { cx: 292, cy: 230, rx: 212, ry: 98 };
const GRADES = [[92, 'A', 'Uncle nods', 2], [84, 'B', 'Good enough for the queue', 1], [72, 'C', 'Somebody gets the small one', 0.5], [0, 'D', 'Auntie is counting', 0]];
const TAU = Math.PI * 2;
function area(f, a, b) { const n = 160, d = (b - a) / n; let s = 0; for (let i = 0; i < n; i++) s += f(a + d * (i + 0.5)) * d; return s; }
function inBone(C, x) { return C.bone.some(z => x > z[0] && x < z[1]); }
function ell(ctx, x, y, rx, ry, col, rot) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); ctx.fill(); }

// ---- the plate and what else is on it ----
// Everything here is drawn flat: two or three tones a shape, one dark outline,
// no gradients — the food reads at a glance the way an illustrated menu does.
function dish(ctx) {
  const P = PLATE;
  ell(ctx, P.cx, P.cy + 11, P.rx + 2, P.ry, 'rgba(12,14,18,0.38)');
  ell(ctx, P.cx, P.cy, P.rx, P.ry, '#c3d1da');
  ctx.strokeStyle = '#78889a'; ctx.lineWidth = 2.4;
  ctx.beginPath(); ctx.ellipse(P.cx, P.cy, P.rx, P.ry, 0, 0, TAU); ctx.stroke();
  ell(ctx, P.cx, P.cy - 2, P.rx - 12, P.ry - 11, '#eef3f6');
  ctx.strokeStyle = '#9fb0bd'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.ellipse(P.cx, P.cy - 2, P.rx - 12, P.ry - 11, 0, 0, TAU); ctx.stroke();
  ell(ctx, P.cx, P.cy - 3, P.rx - 30, P.ry - 26, '#fbfdfe');
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(P.cx, P.cy - 2, P.rx - 20, P.ry - 18, 0, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke();
}
function wavy(ctx, x, y, rx, ry, amp, freq, rot) {
  const N = 48, r = rot || 0;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const a = i / N * TAU, k = 1 + amp * Math.sin(a * freq);
    const px = Math.cos(a) * rx * k, py = Math.sin(a) * ry * k;
    const qx = x + px * Math.cos(r) - py * Math.sin(r), qy = y + px * Math.sin(r) + py * Math.cos(r);
    if (i) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy);
  }
  ctx.closePath();
}
// A slice of cucumber: scalloped skin, pale flesh, a rosette of seeds.
function cuke(ctx, x, y, rot) {
  const R = 24, r = rot || 0;
  ell(ctx, x, y + 6, R, R * 0.6, 'rgba(24,34,18,0.26)', r);
  wavy(ctx, x, y, R, R * 0.62, 0.045, 9, r); ctx.fillStyle = '#3e7a2c'; ctx.fill();
  ctx.strokeStyle = '#24501a'; ctx.lineWidth = 2; ctx.stroke();
  ell(ctx, x, y, R - 4, (R - 4) * 0.62, '#8fc95c', r);
  ell(ctx, x, y, R - 10, (R - 10) * 0.62, '#cfeaa8', r);
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + 0.5, sx = x + Math.cos(a) * (R - 14.5) * Math.cos(r) - Math.sin(a) * (R - 14.5) * 0.62 * Math.sin(r);
    const sy = y + Math.cos(a) * (R - 14.5) * Math.sin(r) + Math.sin(a) * (R - 14.5) * 0.62 * Math.cos(r);
    ell(ctx, sx, sy, 3.2, 2, '#f2f9e2', a + r);
    ell(ctx, sx, sy, 1.9, 1.1, '#b7d98a', a + r);
  }
  ell(ctx, x - R * 0.34, y - R * 0.22, R * 0.28, R * 0.1, 'rgba(255,255,255,0.35)', r - 0.3);
}
// A condiment saucer. Chilli carries seeds, soy carries a sheen.
function saucer(ctx, x, y, sauce, rim, kind, sc) {
  const k = sc || 1;
  ell(ctx, x, y + 6 * k, 25 * k, 9 * k, 'rgba(0,0,0,0.34)');
  ell(ctx, x, y, 25 * k, 11.5 * k, '#f2f5f7');
  ell(ctx, x, y + 0.5 * k, 20 * k, 8.6 * k, '#e2e8ec');
  ctx.strokeStyle = rim; ctx.lineWidth = 2 * k;
  ctx.beginPath(); ctx.ellipse(x, y, 25 * k, 11.5 * k, 0, 0, TAU); ctx.stroke();
  wavy(ctx, x, y + 1 * k, 14 * k, 6 * k, 0.05, 7, 0); ctx.fillStyle = sauce; ctx.fill();
  if (kind === 'chilli') {
    ell(ctx, x - 4 * k, y, 1.5 * k, 1 * k, '#8d1f12'); ell(ctx, x + 3 * k, y + 2 * k, 1.5 * k, 1 * k, '#8d1f12');
    ell(ctx, x + 6 * k, y - 1.4 * k, 1.3 * k, 0.9 * k, '#f3b04e'); ell(ctx, x - 1 * k, y + 2.6 * k, 1.3 * k, 0.9 * k, '#f3b04e');
  } else if (kind === 'ginger') {
    ell(ctx, x - 5 * k, y + 0.6 * k, 2.4 * k, 1.2 * k, '#cfe08a'); ell(ctx, x + 2 * k, y + 2 * k, 2.2 * k, 1.1 * k, '#cfe08a');
    ell(ctx, x + 6 * k, y - 0.6 * k, 2 * k, 1 * k, '#e7f0b6');
  }
  ell(ctx, x - 5 * k, y - 1.6 * k, 4.6 * k, 1.7 * k, 'rgba(255,255,255,0.4)', -0.2);
}
// A Chinese chopper seen side on: steel blade with a honed bevel along the
// edge, brass collar, hardwood handle. The edge sits on the guide line.
function cleaver(ctx, x, by) {
  const BW = 56, BH = 42, L0 = Math.round(x - BW / 2), R1 = L0 + BW, TOP = by - BH, HY = TOP + 8;
  ctx.fillStyle = 'rgba(16,20,26,0.28)'; ctx.fillRect(L0 + 7, by + 2, BW + 26, 5);
  // handle behind the blade: brass collar, hardwood scales, two rivets
  ctx.fillStyle = '#6a4a26'; ctx.fillRect(R1 + 4, HY + 2, 40, 18);
  ctx.fillStyle = '#8b5e33'; ctx.fillRect(R1 + 4, HY + 2, 38, 15);
  ctx.fillStyle = '#a9763f'; ctx.fillRect(R1 + 6, HY + 2, 34, 4);
  ctx.fillStyle = '#4e351d'; ctx.fillRect(R1 + 6, HY + 17, 36, 3);
  ctx.fillStyle = '#5e3d1f'; ctx.fillRect(R1 + 42, HY + 5, 3, 12);
  ctx.fillStyle = '#cdb389'; ctx.fillRect(R1 + 16, HY + 9, 4, 3); ctx.fillRect(R1 + 30, HY + 9, 4, 3);
  ctx.fillStyle = '#b08a3c'; ctx.fillRect(R1 - 2, HY, 8, 22);
  ctx.fillStyle = '#dcbc72'; ctx.fillRect(R1 - 2, HY, 8, 4);
  ctx.fillStyle = '#7d5f24'; ctx.fillRect(R1 - 2, HY + 19, 8, 3);
  // blade: near-rectangular, corners eased, the edge dead straight along the bottom
  ctx.beginPath();
  ctx.moveTo(L0 + 4, TOP); ctx.lineTo(R1, TOP); ctx.lineTo(R1, by);
  ctx.lineTo(L0 + 4, by); ctx.quadraticCurveTo(L0, by, L0, by - 5);
  ctx.lineTo(L0, TOP + 4); ctx.quadraticCurveTo(L0, TOP, L0 + 4, TOP);
  ctx.closePath();
  ctx.save(); ctx.clip();
  ctx.fillStyle = '#a9b6c1'; ctx.fillRect(L0 - 2, TOP - 2, BW + 6, BH + 6);
  ctx.fillStyle = '#93a2af'; ctx.fillRect(L0 - 2, TOP - 2, BW + 6, 16);
  ctx.fillStyle = '#d7e0e8'; ctx.fillRect(L0 - 2, TOP, BW + 6, 3);
  ctx.fillStyle = '#6f7d8a'; ctx.fillRect(L0 - 2, TOP + 3, BW + 6, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(L0 - 2, TOP + 18, BW + 6, 7);
  ctx.fillStyle = '#eef4f8'; ctx.fillRect(L0 + 4, TOP + 19, 9, 2); ctx.fillRect(L0 + 16, TOP + 19, 4, 2);
  ctx.fillStyle = 'rgba(96,110,124,0.3)';
  ctx.fillRect(L0 + 13, TOP + 9, 1, BH - 24); ctx.fillRect(L0 + 34, TOP + 12, 1, BH - 28);
  ctx.fillStyle = '#7b8895'; ctx.fillRect(L0 - 2, by - 12, BW + 6, 2);
  ctx.fillStyle = '#dae5ed'; ctx.fillRect(L0 - 2, by - 10, BW + 6, 7);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(L0 - 2, by - 3, BW + 6, 3);
  ctx.restore();
  ctx.lineWidth = 2; ctx.strokeStyle = '#5b6771'; ctx.stroke();
}
function boneFace(ctx, x, y) {
  ell(ctx, x, y || 0, 4, 5, '#8a5a24');
  ell(ctx, x, y || 0, 3, 4, '#f7efdb');
  ell(ctx, x, y || 0, 1.5, 2.2, '#cf9382');
}

// The cut of chicken: one whole piece, flat-shaded — pale flesh below, a band
// of golden skin along the top, one brown outline round the lot. Chopping does
// not move it; it only leaves lines on it.
const SWEEP = 22;
function pcY(C, x) { return CB.Y + (x - 0.5) * SWEEP + (C.m ? C.m(x) : 0) * CB.H; }
function taper(x) { return Math.sqrt(Math.min(1, x / 0.07)) * Math.sqrt(Math.min(1, (1 - x) / 0.07)); }
function pcU(C, x) { return Math.max(0.6, (C.fUp || C.f)(x) * taper(x) * CB.H); }
function pcD(C, x) { return Math.max(0.6, (C.fDn || C.f)(x) * taper(x) * CB.H); }
function piecePath(ctx, C, grow) {
  const L = CB.X1 - CB.X0, N = 80, g = grow || 0;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) { const x = i / N; ctx.lineTo(CB.X0 + x * L, pcY(C, x) - pcU(C, x) - g); }
  for (let i = N; i >= 0; i--) { const x = i / N; ctx.lineTo(CB.X0 + x * L, pcY(C, x) + pcD(C, x) + g); }
  ctx.closePath();
}
function alongPath(ctx, C, k) {
  const L = CB.X1 - CB.X0, N = 48;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) {
    const x = i / N, y = pcY(C, x) + k * (k < 0 ? pcU(C, x) : pcD(C, x)), px = CB.X0 + x * L;
    if (i) ctx.lineTo(px, y); else ctx.moveTo(px, y);
  }
}
function bandPath(ctx, C, k0, k1) {
  const L = CB.X1 - CB.X0, N = 60;
  ctx.beginPath();
  for (let i = 0; i <= N; i++) { const x = i / N; ctx.lineTo(CB.X0 + x * L, pcY(C, x) + k0 * (k0 < 0 ? pcU(C, x) : pcD(C, x))); }
  for (let i = N; i >= 0; i--) { const x = i / N; ctx.lineTo(CB.X0 + x * L, pcY(C, x) + k1 * (k1 < 0 ? pcU(C, x) : pcD(C, x))); }
  ctx.closePath();
}
// The piece is rasterised onto a 2px grid once per cut and cached: one-cell
// brown outline, gold skin along the top with a lit rim, cream flesh shading
// down to the plate, dithered where the tones meet, bare bone where a cut has
// it. Chops are drawn on the same grid so they sit in the pixels.
const PX = 2, PAL = {
  out: '#6b3f12', skin: '#e9a232', skinHi: '#f8cc62', skinDk: '#c9781c',
  flesh: '#fbead0', fleshSh: '#f0d6a6', fleshDk: '#d9b47a', bone: '#f3ead6', boneSh: '#cfc2a6'
};
const pieceCache = {};
function pieceIn(C, x, y) {
  if (x < CB.X0 || x > CB.X1) return false;
  const u = (x - CB.X0) / (CB.X1 - CB.X0), cy = pcY(C, u);
  return y >= cy - pcU(C, u) && y <= cy + pcD(C, u);
}
function pieceBitmap(C, key) {
  if (pieceCache[key]) return pieceCache[key];
  const c = document.createElement('canvas'); c.width = VW; c.height = VH;
  const g = c.getContext('2d'), L = CB.X1 - CB.X0;
  const y0 = Math.floor((CB.Y - CB.H * 1.7) / PX) * PX, y1 = CB.Y + CB.H * 1.7, x0 = Math.floor((CB.X0 - 8) / PX) * PX, x1 = CB.X1 + 8;
  g.fillStyle = 'rgba(32,26,14,0.32)';
  for (let gy = y0; gy < y1 + 12; gy += PX) for (let gx = x0; gx < x1 + 12; gx += PX)
    if (pieceIn(C, gx + 1 - 6, gy + 1 - 10)) g.fillRect(gx, gy, PX, PX);
  for (let gy = y0; gy < y1; gy += PX) for (let gx = x0; gx < x1; gx += PX) {
    const x = gx + 1, y = gy + 1;
    if (!pieceIn(C, x, y)) continue;
    const u = (x - CB.X0) / L, cy = pcY(C, u), hu = pcU(C, u), hd = pcD(C, u);
    const rel = y < cy ? -(cy - y) / hu : (y - cy) / hd, chk = ((gx + gy) / PX) % 2 === 0;
    const edge = !pieceIn(C, x - PX, y) || !pieceIn(C, x + PX, y) || !pieceIn(C, x, y - PX) || !pieceIn(C, x, y + PX);
    let col;
    if (edge) col = PAL.out;
    else if (C.bare && C.bare(u)) col = rel < -0.3 ? PAL.bone : rel > 0.45 ? PAL.boneSh : (chk && rel > 0.1 ? PAL.boneSh : PAL.bone);
    else if (rel < -0.78) col = PAL.skinHi;
    else if (rel < -0.66) col = chk ? PAL.skinHi : PAL.skin;
    else if (rel < -0.34) col = PAL.skin;
    else if (rel < -0.22) col = chk ? PAL.skin : PAL.skinDk;
    else if (rel < -0.14) col = PAL.skinDk;
    else if (rel < 0.28) col = PAL.flesh;
    else if (rel < 0.4) col = chk ? PAL.flesh : PAL.fleshSh;
    else if (rel < 0.7) col = PAL.fleshSh;
    else if (rel < 0.82) col = chk ? PAL.fleshSh : PAL.fleshDk;
    else col = PAL.fleshDk;
    // a lit rim just under the skin, broken into dashes
    if (!edge && rel > -0.14 && rel < -0.02 && Math.floor(gx / (PX * 5)) % 3 !== 1) col = '#fff6e0';
    g.fillStyle = col; g.fillRect(gx, gy, PX, PX);
  }
  (C.joints || []).forEach(j => {
    const px = Math.floor((CB.X0 + j * L) / PX) * PX, cy = pcY(C, j);
    g.fillStyle = 'rgba(107,63,18,0.55)';
    for (let gy = Math.floor((cy - pcU(C, j)) / PX) * PX + PX * 2; gy < cy + pcD(C, j) - PX * 2; gy += PX * 2) g.fillRect(px, gy, PX, PX);
  });
  pieceCache[key] = c; return c;
}
function meatPiece(ctx, C, key) { ctx.drawImage(pieceBitmap(C, key), 0, 0); }
// A chop on the same grid: a dark channel with the pale cut face beside it.
function cutLine(ctx, C, x, bone) {
  const L = CB.X1 - CB.X0, px = CB.X0 + x * L, cy = pcY(C, x), hu = pcU(C, x), hd = pcD(C, x), lean = 3;
  const top = cy - hu, bot = cy + hd;
  for (let gy = Math.floor(top / PX) * PX; gy < bot; gy += PX) {
    const y = gy + 1, t = (y - top) / (bot - top), lx = px + lean * (1 - 2 * t), gx = Math.floor(lx / PX) * PX;
    if (!pieceIn(C, gx + 1, y)) continue;
    ctx.fillStyle = PAL.out; ctx.fillRect(gx, gy, PX, PX);
    if (pieceIn(C, gx + PX + 1, y) && pieceIn(C, gx + PX * 2 + 1, y)) { ctx.fillStyle = '#fff3d6'; ctx.fillRect(gx + PX, gy, PX, PX); }
    if (pieceIn(C, gx - PX + 1, y) && pieceIn(C, gx - PX * 2 + 1, y) && ((gx + gy) / PX) % 2 === 0) { ctx.fillStyle = 'rgba(107,63,18,0.35)'; ctx.fillRect(gx - PX, gy, PX, PX); }
  }
  if (bone) {
    const bx = Math.floor(px / PX) * PX, by = Math.floor(cy / PX) * PX;
    ctx.fillStyle = PAL.out; ctx.fillRect(bx - PX * 2, by - PX * 2, PX * 5, PX * 5);
    ctx.fillStyle = PAL.bone; ctx.fillRect(bx - PX, by - PX, PX * 3, PX * 3);
    ctx.fillStyle = '#d19a8c'; ctx.fillRect(bx, by, PX, PX);
  }
}

const chop = {
  init() { const s = { id: 'chop', t: 0, last: [], streak: 0, off: [], swing: 0, flash: 0, shake: 0, hit: 0.5 }; chop.order(s); return s; },
  order(s) {
    s.cut = pick(Object.keys(CUTS)); const C = CUTS[s.cut];
    s.n = pick(C.pcs);
    s.cuts = []; s.bad = []; s.cur = 0.5; s.ph = 'cut'; s.grade = null; s.off = [];
    s.time = C.time + (s.n - 4) * 1.4; s.span = s.time;
    s.table = 4 + Math.floor(Math.random() * 28);
    s.msg = 'Order up · ' + s.cut.toLowerCase() + ', ' + s.n + ' pieces';
  },
  tick(s, dt, api) {
    s.t += dt;
    s.swing = Math.max(0, s.swing - dt); s.flash = Math.max(0, s.flash - dt); s.shake = Math.max(0, s.shake - dt);
    if (s.ph !== 'cut') return;
    s.time -= dt;
    if (s.time <= 0) { s.time = 0; chop.grade(s, api, true); return; }
    const sp = (api.keys.shift ? 0.085 : 0.3) * dt;
    if (api.keys.l) s.cur -= sp;
    if (api.keys.r) s.cur += sp;
    s.cur = CL(s.cur, 0.05, 0.95);
  },
  action(s, api) {
    if (s.ph === 'graded') { chop.order(s); return; }
    if (s.cuts.some(c => Math.abs(c - s.cur) < 0.03)) { s.msg = 'Too close to the last cut'; s.shake = 0.16; return; }
    const C = CUTS[s.cut], bone = inBone(C, s.cur);
    s.cuts.push(s.cur); s.cuts.sort((a, b) => a - b);
    if (bone) { s.bad.push(s.cur); s.time = Math.max(0.8, s.time - 1.4); }
    s.hit = s.cur; s.swing = 0.26; s.flash = 0.2; s.shake = bone ? 0.22 : 0.1;
    const left = s.n - 1 - s.cuts.length;
    if (left <= 0) { chop.grade(s, api, false); return; }
    s.msg = bone ? 'Through the bone · slow going' : left + ' more cut' + (left === 1 ? '' : 's');
  },
  grade(s, api, walked) {
    const C = CUTS[s.cut], f = C.f, tot = area(f, 0, 1), bd = [0].concat(s.cuts, [1]), parts = [];
    for (let i = 0; i < bd.length - 1; i++) parts.push(area(f, bd[i], bd[i + 1]) / tot);
    const mn = Math.min.apply(null, parts), mx = Math.max.apply(null, parts);
    const even = Math.round(mn / mx * 100), short = s.n - parts.length;
    const timeB = walked ? 0 : Math.round(CL(s.time / s.span, 0, 1) * 6);
    const pct = Math.round(CL(even - Math.min(12, s.bad.length * 4) - short * 10 + timeB, 0, 100));
    const g = GRADES.find(r => pct >= r[0]), tip = walked ? 0 : g[3];
    s.grade = {
      pct, even, letter: g[1], note: g[2], tip, parts, walked, timeB, short, bad: s.bad.length,
      grams: parts.map(v => Math.round(v * C.g))
    };
    s.ph = 'graded';
    s.msg = walked ? 'Queue moved on · ' + short + ' piece' + (short === 1 ? '' : 's') + ' short' : g[2] + ' · ' + pct + '%';
    const b = api.board;
    b.served = (b.served || 0) + 1; b.sum = (b.sum || 0) + pct; b.avg = Math.round(b.sum / b.served);
    b.tips = Math.round(((b.tips || 0) + tip) * 100) / 100;
    s.streak = pct >= 84 ? s.streak + 1 : 0;
    b.streak = Math.max(b.streak || 0, s.streak);
    if (!b.best || pct > b.best.pct) b.best = { cut: s.cut, n: s.n, pct };
    s.last.unshift(g[1] + ' · ' + pct + '%'); s.last = s.last.slice(0, 3);
    api.save();
  },
  draw(s, ctx, api) {
    const C = CUTS[s.cut], L = CB.X1 - CB.X0, t = s.t;
    const sh = s.shake > 0 ? Math.sin(t * 74) * s.shake * 7 : 0;
    // the stall: tiled wall, steel counter, two saucers and the queue behind
    ctx.fillStyle = '#23262c'; ctx.fillRect(0, 0, VW, VH);
    ctx.fillStyle = '#2e333b'; ctx.fillRect(0, 0, VW, 104);
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    for (let x = 0; x < VW; x += 32) ctx.fillRect(x, 0, 1, 104);
    for (let y = 0; y < 104; y += 32) ctx.fillRect(0, y, VW, 1);
    if (api && api.sprite) {
      [['auntieA', 452], ['uncleA', 498]].forEach(([n, x], i) => {
        const sp = api.sprite(n); if (!sp) return;
        const bob = s.time / s.span < 0.35 ? Math.round(Math.sin(t * 6 + i * 2) * 1.4) : 0;
        ctx.globalAlpha = 0.9; ctx.drawImage(sp.f0, x, 52 + bob); ctx.globalAlpha = 1;
      });
    }
    ctx.fillStyle = '#3b414a'; ctx.fillRect(0, 104, VW, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(0, 112, VW, 2);
    saucer(ctx, 38, 118, '#d2402a', '#c94a34', 'chilli', 1.5);
    saucer(ctx, 536, 124, '#2c1a0a', '#7b8a96', 'soy', 1.5);
    saucer(ctx, 536, 340, '#d9e08c', '#7b8a96', 'ginger', 1.5);
    ctx.save(); ctx.translate(0, sh);
    dish(ctx);
    // sauce pooled under the chicken, garnish laid behind it
    wavy(ctx, 300, CB.Y + 26, 188, 56, 0.05, 5, 0); ctx.fillStyle = '#7a5319'; ctx.fill();
    wavy(ctx, 300, CB.Y + 25, 184, 53, 0.05, 5, 0); ctx.fillStyle = '#b8822c'; ctx.fill();
    ell(ctx, 232, CB.Y + 52, 60, 10, 'rgba(244,214,150,0.4)', -0.05);
    ell(ctx, 400, CB.Y + 58, 30, 7, 'rgba(244,214,150,0.3)', 0.08);
    // the cut of chicken, whole, with the chops marked on it
    const bd = [0].concat(s.cuts, [1]);
    meatPiece(ctx, C, s.cut);
    s.cuts.forEach(c => cutLine(ctx, C, c, inBone(C, c)));
    cuke(ctx, 118, 262, 0.26); cuke(ctx, 118, 224, 0.1); cuke(ctx, 126, 188, -0.06); cuke(ctx, 142, 156, -0.2);
    // the cleaver, its guide line and what the line is about to go through
    if (s.ph === 'cut') {
      const x = Math.round(CB.X0 + s.cur * L), bone = inBone(C, s.cur);
      const drop = s.swing > 0 ? Math.sin((1 - s.swing / 0.26) * Math.PI) * 44 : 0;
      ctx.fillStyle = bone ? 'rgba(226,85,60,0.5)' : 'rgba(255,255,255,0.4)';
      for (let y = CB.Y - CB.H - 14; y < CB.Y + CB.H + 14; y += 6) ctx.fillRect(x, y, 1, 3);
      const by = 128 + drop;
      cleaver(ctx, x, by);
      txt(ctx, s.cuts.length + '/' + (s.n - 1), x, by - 50, '#f6d9a0', 10, 'center');
      if (bone) txt(ctx, 'BONE', x, by - 62, '#e2553c', 9, 'center');
      else if (C.bone.length) txt(ctx, 'CLEAN', x, by - 62, '#8fce7a', 9, 'center');
    }
    if (s.flash > 0) {
      const fx = Math.round(CB.X0 + s.hit * L);
      ctx.fillStyle = 'rgba(255,248,226,' + (s.flash / 0.2 * 0.8).toFixed(2) + ')';
      ctx.fillRect(fx - 1, CB.Y - CB.H - 6, 3, CB.H * 2 + 12);
    }
    // weights once it is graded
    if (s.grade) {
      const mnv = Math.min.apply(null, s.grade.parts);
      s.grade.grams.forEach((gr, i) => {
        const mid = (bd[i] + bd[i + 1]) / 2 * L + CB.X0;
        ctx.fillStyle = 'rgba(38,28,14,0.78)'; ctx.fillRect(mid - 15, CB.Y + CB.H + 2, 30, 14);
        txt(ctx, gr + 'g', mid, CB.Y + CB.H + 13, s.grade.parts[i] === mnv ? '#ffb09a' : '#fff3d6', 10, 'center');
      });
    }
    ctx.restore();
    // the ticket, the queue clock and the result slip
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(16, 16, 156, 66);
    ctx.fillStyle = '#f3ead6'; ctx.fillRect(14, 12, 156, 66);
    ctx.fillStyle = '#c8412c'; ctx.fillRect(14, 12, 156, 5);
    txt(ctx, 'TABLE ' + s.table + ' · ORDER', 24, 32, '#8b7a5e', 9);
    txt(ctx, s.cut.toUpperCase() + ' × ' + s.n, 24, 52, '#2b2118', 17);
    txt(ctx, C.ask, 24, 68, '#6d5c44', 9);
    bar(ctx, 404, 40, 152, 9, s.time / s.span, s.time / s.span < 0.3 ? '#e2553c' : '#d9ad62', 'QUEUE');
    if (s.streak > 1) txt(ctx, 'STREAK ×' + s.streak, 556, 70, '#8fce7a', 10, 'right');
    if (s.grade) {
      const g = s.grade;
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(198, 22, 200, 62);
      ctx.fillStyle = '#f3ead6'; ctx.fillRect(196, 18, 200, 62);
      ctx.fillStyle = g.letter === 'A' ? '#3f7a3a' : g.letter === 'D' ? '#c8412c' : '#b68235';
      ctx.fillRect(196, 18, 200, 4);
      txt(ctx, g.letter, 212, 62, '#2b2118', 34);
      txt(ctx, g.pct + '% to order', 252, 44, '#2b2118', 13);
      txt(ctx, g.even + '% even' + (g.bad ? ' · ' + g.bad + ' bone' : '') + (g.timeB ? ' · +' + g.timeB : ''), 252, 58, '#6d5c44', 9);
      txt(ctx, g.tip ? 'Tip $' + g.tip.toFixed(2) : g.walked ? 'No tip · walked' : 'No tip', 252, 72, g.tip ? '#3f7a3a' : '#a33321', 9);
      txt(ctx, 'ENTER FOR THE NEXT ORDER', 288, 356, 'rgba(246,236,210,0.8)', 10, 'center');
    }
  },
  hud(s, b) {
    const C = CUTS[s.cut];
    return {
      title: 'Chicken rice · chop to order',
      stats: [['Order', s.cut + ' × ' + s.n], ['Served', String(b.served || 0)], ['Average', (b.avg || 0) + '%']],
      chips: [[s.streak > 1 ? 'Streak ×' + s.streak : C.ask, s.streak > 1], ['Tips $' + (b.tips || 0).toFixed(2), false]]
        .concat(b.best ? [['Best ' + b.best.pct + '%', false]] : []),
      msg: s.msg, help: 'A · D slides the cleaver · Shift for fine · Enter chops · Escape to leave',
      end: null
    };
  }
};

/* ----------------------------------------------------------------- TRAY ---- */
// The same hall, one service later. People sit in ones and twos, eat at their
// own pace and get up at their own time; every finished meal leaves a tray.
// Catch someone while they are still at the table and they clear it on the way
// out. Miss them and the tray is yours to carry. A crow works the same gap
// from the roof beams and only ever goes for a tray nobody is sitting at.
const TR_G = { X0: 120, X1: 528, Y0: 118, Y1: 356 };
const TR_RACKS = [{ x: 508, y: 338, bg: true }, { x: 168, y: 334, bg: false }];
const TR_TABLES = [[302, 170], [422, 170], [302, 262], [422, 262]];
const TR_EXIT = [196, 386];
// the rest of the section: two tables nobody has taken all service, and one
// table of regulars who finished long ago and are only sitting and talking
const TR_SCENE = [
  { x: 132, y: 168, who: [] },
  { x: 132, y: 264, who: [] },
  { x: 212, y: 216, who: [['uncleA', -33, 7], ['gekNeo', 33, 7]] }
];
function trNearRack(x, y) { return TR_RACKS.reduce((a, b) => Math.hypot(b.x - x, b.y - y) < Math.hypot(a.x - x, a.y - y) ? b : a); }
function trTrolley(ctx, r) {
  ctx.fillStyle = 'rgba(20,24,20,0.24)'; ctx.beginPath(); ctx.ellipse(r.x, r.y + 20, 18, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#4a5157'; ctx.fillRect(r.x - 18, r.y - 8, 36, 26);
  ctx.fillStyle = '#5e666c'; ctx.fillRect(r.x - 18, r.y - 8, 36, 4);
  ctx.fillStyle = '#39403f'; ctx.fillRect(r.x - 14, r.y, 28, 3); ctx.fillRect(r.x - 14, r.y + 8, 28, 3);
  txt(ctx, 'TRAY', r.x, r.y - 2, '#c9d2cf', 8, 'center');
}
const TR_EATERS = ['shopperA', 'customerA', 'uncleA', 'auntieA', 'pupilA', 'vendorB', 'officerA', 'gymA', 'librarian', 'taichiA', 'gekNeo', 'weeKiat', 'sarojini', 'jogger', 'seamstress', 'receptionist', 'officerC', 'pupilB'];
const TR_MEALS = [
  { t: '#b8452f', b: '#f2e8d2', f: '#c67a2c' },
  { t: '#2f6a4a', b: '#efe9d6', f: '#8f9c46' },
  { t: '#2b6cae', b: '#f4eedc', f: '#d9b34a' },
  { t: '#8a5a3c', b: '#f0e6cf', f: '#a8402f' }
];
const TR_NOD = ['Ok ok.', 'Will return.', 'Sure, sure.', 'Ya lah, later I bring.'];
const TR_NO = ['Later lah.', 'Auntie will clear what.', 'Busy now.'];
let TR_BG = null;

function trSeat(tb, i) { return [tb.x + (i ? 33 : -33), tb.y + 7]; }
function trSlot(tb, i) { return [tb.x + (i ? 15 : -15), tb.y - 1]; }
function trLoose(s) { return s.trays.filter(q => q.st === 'loose'); }
function trFar(s, x, y) { return Math.hypot(s.me.x - x, s.me.y - y); }
function trNewCrow(i, lvl) { return { x: 300 + i * 90, y: 170 + i * 40, alt: 78, ph: 'circle', orb: R(0, 6.2), rx: R(96, 132), ry: R(50, 74), wait: lvl > 1 ? R(1.6, 3.2) : R(3.4, 5), tgt: null, dive: null, face: 1 }; }
function trFlee(c, turn) { if (c.tgt) c.tgt.mark = null; c.tgt = null; c.dive = null; c.ph = 'flee'; if (turn) c.face = -c.face; }
function trSay(p, line) { p.say = line; p.sayT = 1.6; }
// tables are solid for Lisa only: she rounds them, the diners take the short way
function trPush(s, p) {
  s.tables.concat(TR_SCENE).forEach(tb => {
    const dx = (p.x - tb.x) / 31, dy = (p.y - tb.y - 2) / 17, d = Math.hypot(dx, dy);
    if (d < 1 && d > 0.02) { const k = 1 - d; p.x += dx / d * k * 31; p.y += dy / d * k * 17; }
  });
}
function trCrowTick(s, c, dt) {
  if (c.ph === 'circle') {
    c.orb += dt * 0.78;
    const tx = 380 + Math.cos(c.orb) * c.rx, ty = 214 + Math.sin(c.orb) * c.ry, e = Math.min(1, dt * 2.6);
    c.face = tx < c.x ? -1 : 1;
    c.x += (tx - c.x) * e; c.y += (ty - c.y) * e; c.alt += (78 - c.alt) * Math.min(1, dt * 2);
    c.wait -= dt;
    if (c.wait > 0) return;
    const opts = trLoose(s).filter(q => q.age > (s.lvl > 1 ? 0.9 : 2.2) && !q.mark);
    if (!opts.length) { c.wait = 0.35; return; }
    // it takes the tray furthest from Lisa, the way they always do
    const tgt = opts.reduce((a, b) => trFar(s, b.x, b.y) > trFar(s, a.x, a.y) ? b : a);
    tgt.mark = c; c.tgt = tgt; c.ph = 'dive';
    c.dive = { k: 0, dur: Math.max(1.9, 4 - s.lvl * 0.45), sx: c.x, sy: c.y, alt0: c.alt };
    return;
  }
  if (c.ph === 'dive') {
    const tr = c.tgt, d = c.dive;
    if (!tr || tr.st !== 'loose') { trFlee(c); return; }
    if (trFar(s, tr.x, tr.y) < 38) { s.scares++; trFlee(c, true); return; }
    d.k = Math.min(1, d.k + dt / d.dur);
    const e = d.k * d.k * (3 - 2 * d.k);
    c.x = d.sx + (tr.x - d.sx) * e; c.y = d.sy + (tr.y + 5 - d.sy) * e;
    c.alt = d.alt0 * Math.pow(1 - d.k, 1.3);
    c.face = tr.x < d.sx ? -1 : 1;
    if (d.k >= 1) { c.ph = 'peck'; c.alt = 0; c.wait = 0.55; }
    return;
  }
  if (c.ph === 'peck') {
    const tr = c.tgt;
    if (!tr || tr.st !== 'loose') { trFlee(c); return; }
    if (trFar(s, tr.x, tr.y) < 26) { s.saves++; s.msg = 'Shooed it off the table · that was close'; trFlee(c, true); return; }
    c.wait -= dt;
    if (c.wait <= 0) { s.over = { won: false }; s.msg = 'The crow got to the tray first'; }
    return;
  }
  c.alt = Math.min(78, c.alt + 160 * dt); c.x += c.face * 44 * dt; c.y -= 24 * dt;
  if (c.alt >= 78) { c.ph = 'circle'; c.wait = R(1.3, 2.6) + (s.lvl > 1 ? 0 : 1.4); c.orb = Math.atan2(c.y - 214, c.x - 380); }
}
function trDrawTray(ctx, tr, t) {
  const x = Math.round(tr.x), y = Math.round(tr.y), m = tr.meal;
  if (tr.st === 'loose') {
    corona(ctx, x, y + 3, 26, t, true);
    const pulse = 0.55 + 0.45 * Math.sin(t * 3.4);
    ctx.strokeStyle = 'rgba(244,182,74,' + (0.5 + pulse * 0.5) + ')'; ctx.lineWidth = 2;
    ctx.strokeRect(x - 12.5, y - 8.5, 25, 15);
  }
  ctx.fillStyle = 'rgba(20,20,24,0.24)'; ctx.fillRect(x - 10, y + 5, 20, 3);
  ctx.fillStyle = m.t; ctx.fillRect(x - 10, y - 6, 20, 11);
  ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x - 10, y - 6, 20, 2);
  ctx.strokeStyle = 'rgba(38,30,22,0.55)'; ctx.lineWidth = 1; ctx.strokeRect(x - 9.5, y - 5.5, 19, 10);
  ell(ctx, x - 3, y - 1, 6, 3.8, m.b); ell(ctx, x - 3, y - 1, 3.8, 2.2, tr.st === 'eating' ? m.f : 'rgba(150,120,80,0.75)');
  ctx.fillStyle = '#efe4cc'; ctx.fillRect(x + 4, y - 4, 2, 7); ctx.fillRect(x + 7, y - 4, 2, 7);
  if (tr.st === 'loose') { ctx.fillStyle = 'rgba(120,92,58,0.8)'; ctx.fillRect(x - 8, y + 2, 2, 1); ctx.fillRect(x + 1, y + 3, 2, 1); ctx.fillRect(x - 5, y - 4, 1, 1); }
}
// A house crow, side on: sooty body, grey nape and breast, heavy hooked bill.
// Flying it shows a far wing behind the body and a near wing over it, both
// with fingered primaries; on the table it folds down, tail cocked, and stabs.
const CRW = { ink: '#101318', body: '#1d212a', hi: '#333b48', nape: '#6d7483', beak: '#23262d', leg: '#33373f', eye: '#efe2bb' };
function trWing(ctx, k, far) {
  const lift = k * 8, s = far ? 0.86 : 1, y0 = far ? -3.4 : -1.2;
  ctx.beginPath();
  ctx.moveTo(0, y0);
  ctx.quadraticCurveTo(-5 * s, y0 - 3 - lift * 0.5, -12 * s, y0 - 1 - lift);
  ctx.lineTo(-16 * s, y0 + 1.4 - lift * 0.92);
  ctx.lineTo(-11.6 * s, y0 + 1 - lift * 0.8);
  ctx.lineTo(-13.6 * s, y0 + 3.6 - lift * 0.74);
  ctx.lineTo(-9.4 * s, y0 + 2.6 - lift * 0.62);
  ctx.lineTo(-10.4 * s, y0 + 5.4 - lift * 0.5);
  ctx.quadraticCurveTo(-5 * s, y0 + 4 - lift * 0.3, 0, y0 + 3);
  ctx.closePath(); ctx.fill();
}
function trCrow(ctx, c, t) {
  const bx = Math.round(c.x), by = Math.round(c.y - c.alt), k = CL(1 - c.alt / 90, 0.2, 1);
  ctx.fillStyle = 'rgba(16,18,24,' + (0.09 + 0.24 * k) + ')';
  ctx.beginPath(); ctx.ellipse(c.x, c.y, 5 + 8 * k, (5 + 8 * k) * 0.42, 0, 0, TAU); ctx.fill();
  const down = c.ph === 'peck';
  const flap = Math.sin(t * (c.ph === 'dive' ? 14 : 7.5));
  const stab = down ? Math.pow(Math.abs(Math.sin(t * 9)), 1.6) : 0;
  ctx.save();
  ctx.translate(bx, by - (down ? 6 : 1));
  ctx.scale(c.face, 1);
  if (c.ph === 'dive') ctx.rotate(0.3);
  if (!down) {
    ctx.fillStyle = CRW.ink; trWing(ctx, -flap * 0.7, true);
    ctx.fillStyle = CRW.body;
    ctx.beginPath(); ctx.moveTo(-4, -1); ctx.lineTo(-15, 0.6); ctx.lineTo(-14.4, 2.2); ctx.lineTo(-15, 3.6); ctx.lineTo(-3, 3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, 0.4, 8, 4.2, -0.08, 0, TAU); ctx.fill();
    ctx.fillStyle = CRW.nape;
    ctx.beginPath(); ctx.moveTo(2.4, -3.4); ctx.quadraticCurveTo(6.4, -3.2, 7.2, -1); ctx.quadraticCurveTo(5.6, 2.4, 1.6, 2.6); ctx.quadraticCurveTo(3, -0.4, 2.4, -3.4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRW.body;
    ctx.beginPath(); ctx.ellipse(6.6, -4.2, 3.1, 2.8, -0.16, 0, TAU); ctx.fill();
    ctx.fillStyle = CRW.beak;
    ctx.beginPath(); ctx.moveTo(8.4, -5.4); ctx.quadraticCurveTo(12.4, -4.6, 15.2, -3.2); ctx.lineTo(14.2, -2.3); ctx.quadraticCurveTo(11.6, -2.6, 8.4, -2.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(12,14,18,0.6)'; ctx.fillRect(8.4, -3.5, 5.4, 0.6);
    ctx.fillStyle = CRW.eye; ctx.fillRect(7, -5.3, 1.5, 1.4);
    ctx.fillStyle = CRW.ink; ctx.fillRect(7.5, -5, 0.9, 1);
    ctx.fillStyle = CRW.hi; trWing(ctx, flap, false);
    ctx.fillStyle = 'rgba(122,136,158,0.3)';
    ctx.beginPath(); ctx.moveTo(-1, -1.6); ctx.quadraticCurveTo(-5, -3 - flap * 4, -10, -1.4 - flap * 7); ctx.lineTo(-8.6, 0.2 - flap * 6); ctx.quadraticCurveTo(-4, -0.8, -0.6, 0); ctx.closePath(); ctx.fill();
  } else {
    ctx.fillStyle = CRW.body;
    ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(-11.6, -6.6); ctx.lineTo(-10.4, -4.6); ctx.lineTo(-3, 0.6); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -0.4, 6.6, 4.4, 0.14, 0, TAU); ctx.fill();
    ctx.fillStyle = CRW.hi;
    ctx.beginPath(); ctx.moveTo(-5, -3); ctx.quadraticCurveTo(1, -4, 4.6, -1.2); ctx.quadraticCurveTo(0, 1.2, -6, -0.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRW.ink;
    ctx.beginPath(); ctx.moveTo(-6, -1); ctx.lineTo(-10, 1); ctx.lineTo(-5.6, 0.8); ctx.closePath(); ctx.fill();
    const hx = 5.6 + stab * 2.4, hy = -4.4 + stab * 6;
    ctx.fillStyle = CRW.nape;
    ctx.beginPath(); ctx.moveTo(1.6, -2.8); ctx.quadraticCurveTo(hx - 1.6, hy + 0.4, hx - 0.6, hy + 2.4); ctx.quadraticCurveTo(2.6, hy + 3.4, 0.6, 0.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRW.body;
    ctx.beginPath(); ctx.ellipse(hx, hy, 3.1, 2.8, 0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = CRW.beak;
    ctx.beginPath(); ctx.moveTo(hx + 1.6, hy - 1.4); ctx.quadraticCurveTo(hx + 5, hy + 0.2 + stab, hx + 7.6, hy + 1.8 + stab * 1.3); ctx.lineTo(hx + 6.4, hy + 2.6 + stab * 1.3); ctx.quadraticCurveTo(hx + 4, hy + 1.4 + stab, hx + 1.8, hy + 1.2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = CRW.eye; ctx.fillRect(hx - 0.2, hy - 1.5, 1.5, 1.4);
    ctx.fillStyle = CRW.ink; ctx.fillRect(hx + 0.3, hy - 1.2, 0.9, 1);
    ctx.fillStyle = CRW.leg; ctx.fillRect(-1.6, 3, 1.5, 4.2); ctx.fillRect(1.8, 3, 1.5, 4.2);
    ctx.fillRect(-3.2, 6.6, 4.2, 1.4); ctx.fillRect(0.8, 6.6, 4.2, 1.4);
  }
  ctx.restore();
}
function trBubble(ctx, x, y, line) {
  ctx.font = '9px "Pixelify Sans", ui-monospace, monospace';
  const w = Math.ceil(ctx.measureText(line).width) + 10;
  ctx.fillStyle = '#f7f1e3'; ctx.fillRect(Math.round(x - w / 2), Math.round(y - 11), w, 13);
  ctx.strokeStyle = 'rgba(40,34,24,0.7)'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(x - w / 2) + 0.5, Math.round(y - 10.5), w - 1, 12);
  ctx.fillStyle = '#f7f1e3'; ctx.fillRect(Math.round(x) - 2, Math.round(y) + 1, 4, 3);
  txt(ctx, line, x, y - 1, '#2b2620', 9, 'center');
}
function trTick(ctx, x, y, t) {
  const yy = y + Math.round(Math.sin(t * 3) * 1.5);
  ctx.fillStyle = 'rgba(30,44,32,0.55)'; ctx.beginPath(); ctx.arc(x, yy, 6, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8fd4a0'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 3, yy); ctx.lineTo(x - 1, yy + 2.6); ctx.lineTo(x + 3.2, yy - 2.6); ctx.stroke();
  ctx.lineCap = 'butt';
}

const tray = {
  init(api) {
    const lvl = Math.min(4, ((api && api.board && api.board.wins) || 0) + 1);
    const s = {
      id: 'tray', t: 0, lvl, over: null, spawned: 0, done: 0, byThem: 0, byMe: 0,
      reminded: 0, left: 0, saves: 0, scares: 0, next: 1.4, cd: 0,
      // the first service is a quiet one: few people in at a time, long meals,
      // a generous window to ask and a crow that takes its time coming down
      total: 6 + lvl * 2, cap: 2 + lvl, win: lvl > 1 ? 0.6 : 0.72,
      msg: 'Lunch crowd coming in · remind them while they are still sitting',
      tables: TR_TABLES.map(([x, y]) => ({ x, y, seats: [{ who: null }, { who: null }] })),
      diners: [], trays: [], crows: [],
      me: { name: 'lisa', x: 362, y: 330, dir: 'u', anim: 0, me: true, hold: [] }
    };
    for (let i = 0; i < Math.min(3, lvl); i++) s.crows.push(trNewCrow(i, lvl));
    return s;
  },
  tick(s, dt, api) {
    s.t += dt;
    if (s.cd > 0) s.cd -= dt;
    if (!s.over) {
      drive(s.me, api.keys, s.me.hold.length ? 104 : 118, dt);
      s.me.x = CL(s.me.x, TR_G.X0, TR_G.X1); s.me.y = CL(s.me.y, TR_G.Y0, TR_G.Y1);
      trPush(s, s.me);
      // the queue at the stalls feeds the room: one sits down whenever there is room
      s.next -= dt;
      if (s.spawned < s.total && s.next <= 0) {
        const free = [];
        // nobody sits at a dirty place: a tray left behind holds the seat hostage
        s.tables.forEach(tb => tb.seats.forEach((q, i) => {
          if (q.who) return;
          if (s.trays.some(r => r.st !== 'held' && r.tb === tb && r.si === i)) return;
          free.push([tb, i]);
        }));
        const busy = s.diners.filter(p => p.st === 'walk' || p.st === 'eat').length;
        if (free.length && busy < s.cap) {
          const [tb, i] = pick(free);
          const p = { name: pick(TR_EATERS), x: R(280, 470), y: 84, dir: 'd', anim: 0, st: 'walk', tb, si: i, rem: false, stub: Math.random() < (s.lvl > 1 ? 0.3 : 0.16) ? 1 : 0, say: '', sayT: 0 };
          tb.seats[i].who = p; s.diners.push(p); s.spawned++;
          s.next = Math.max(0.9, R(2.2, 3.6) - s.lvl * 0.2);
        } else s.next = 0.4;
      }
      s.diners.forEach(p => {
        if (p.sayT > 0) p.sayT -= dt;
        if (p.st === 'walk') {
          const [tx, ty] = trSeat(p.tb, p.si);
          steer(p, tx, ty, 64, dt);
          if (Math.hypot(tx - p.x, ty - p.y) < 2) {
            p.st = 'eat'; p.eat = R(11, 20) - s.lvl * 1.4; p.span = p.eat; p.dir = p.si ? 'l' : 'r';
            const [mx, my] = trSlot(p.tb, p.si);
            p.tray = { x: mx, y: my, st: 'eating', age: 0, meal: pick(TR_MEALS), by: p, mark: null, tb: p.tb, si: p.si };
            s.trays.push(p.tray);
          }
        } else if (p.st === 'eat') {
          p.eat -= dt; p.anim = 0;
          if (p.eat <= 0) {
            p.tb.seats[p.si].who = null;
            const [tx, ty] = trSeat(p.tb, p.si);
            p.x = tx; p.y = ty + 8;
            if (p.rem) { p.st = 'carry'; p.tray.st = 'held'; trSay(p, 'Returning · thanks ah'); }
            else { p.st = 'exit'; p.tray.st = 'loose'; p.tray.age = 0; p.tray = null; s.left++; s.msg = 'Somebody walked off · that tray is yours now'; }
          }
        } else if (p.st === 'carry') {
          const rk = p.rk || (p.rk = trNearRack(p.x, p.y));
          const tx = rk.x - 16, ty = rk.y - 4;
          steer(p, tx, ty, 68, dt);
          if (Math.hypot(tx - p.x, ty - p.y) < 3) {
            s.trays = s.trays.filter(q => q !== p.tray); p.tray = null;
            s.byThem++; s.done++; p.st = 'exit';
            s.msg = 'Cleared their own tray · ' + s.done + ' of ' + s.total;
          }
        } else if (p.st === 'exit') {
          steer(p, TR_EXIT[0], TR_EXIT[1], 72, dt);
          if (p.y > 372 || Math.hypot(TR_EXIT[0] - p.x, TR_EXIT[1] - p.y) < 6) p.gone = true;
        }
      });
      s.diners = s.diners.filter(p => !p.gone);
      bump(s.diners.filter(p => p.st !== 'eat').concat([s.me]), 11, false);
      s.trays.forEach(q => {
        if (q.st === 'loose') q.age += dt;
        if (q.st === 'held') {
          const h = q.by, k = h.hold ? Math.max(0, h.hold.indexOf(q)) : 0;
          q.x = h.x; q.y = h.y - 25 - k * 6;
        }
      });
      s.crows.forEach(c => trCrowTick(s, c, dt));
      if (!s.over && s.spawned >= s.total && !s.trays.length && !s.diners.length) s.over = { won: true };
    }
    if (s.over && !s.over.logged) {
      s.over.logged = true;
      const b = api.board;
      b.games = (b.games || 0) + 1;
      b.best = Math.max(b.best || 0, s.done);
      if (s.over.won) b.wins = (b.wins || 0) + 1;
      api.save();
    }
  },
  action(s, api) {
    if (s.over || s.cd > 0) return;
    s.cd = 0.18;
    const me = s.me;
    const rk = trNearRack(me.x, me.y);
    if (me.hold.length && Math.hypot(me.x - rk.x, me.y - rk.y) < 36) {
      const n = me.hold.length;
      s.trays = s.trays.filter(q => me.hold.indexOf(q) < 0);
      me.hold = []; s.byMe += n; s.done += n;
      s.msg = (n > 1 ? 'Both racked' : 'Racked') + ' · ' + s.done + ' of ' + s.total + ' cleared';
      return;
    }
    const loose = trLoose(s).filter(q => Math.hypot(me.x - q.x, me.y - q.y) < 30);
    if (loose.length && me.hold.length < 2) {
      const q = loose.reduce((a, b) => Math.hypot(me.x - b.x, me.y - b.y) < Math.hypot(me.x - a.x, me.y - a.y) ? b : a);
      q.st = 'held'; q.by = me; if (q.mark) { trFlee(q.mark, true); }
      q.mark = null; me.hold.push(q);
      s.msg = me.hold.length > 1 ? 'Two trays · take them to a trolley' : 'Tray in hand · nearest trolley will do';
      return;
    }
    const near = s.diners.filter(p => p.st === 'eat' && !p.rem && Math.hypot(me.x - p.x, me.y - p.y) < 34);
    if (near.length) {
      const p = near.reduce((a, b) => Math.hypot(me.x - b.x, me.y - b.y) < Math.hypot(me.x - a.x, me.y - a.y) ? b : a);
      // ask too early and it is forgotten by the time the plate is empty
      if (p.eat / p.span > s.win) { trSay(p, 'Still eating leh.'); s.msg = 'Too early · wait until the bar turns amber'; return; }
      if (p.stub > 0) { p.stub--; trSay(p, pick(TR_NO)); s.msg = 'Not having it · ask again'; return; }
      p.rem = true; s.reminded++; trSay(p, pick(TR_NOD));
      s.msg = 'Reminded · they will clear it themselves';
      return;
    }
    if (me.hold.length) { s.msg = 'Rack it at either trolley'; return; }
    s.msg = 'Nobody in reach · stand beside a table';
  },
  draw(s, ctx, api) {
    const t = s.t;
    if (!TR_BG) TR_BG = chopeBg();
    ctx.drawImage(TR_BG, 0, 0);
    for (let i = 0; i < 6; i++) {
      const lx = 48 + i * 96, fl = 0.82 + 0.18 * Math.sin(t * 1.7 + i);
      ctx.fillStyle = '#31513c'; ctx.beginPath(); ctx.moveTo(lx - 7, 24); ctx.lineTo(lx + 7, 24); ctx.lineTo(lx + 3, 16); ctx.lineTo(lx - 3, 16); ctx.closePath(); ctx.fill();
      ctx.globalAlpha = fl; ctx.fillStyle = '#f7dc9a'; ctx.beginPath(); ctx.ellipse(lx, 25, 5, 2.4, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.14 * fl; ctx.beginPath(); ctx.ellipse(lx, 30, 13, 8, 0, 0, TAU); ctx.fill();
      ctx.globalAlpha = 1;
    }
    const carrying = s.me.hold.length;
    TR_SCENE.forEach(sc => {
      [[-34, 5], [34, 5], [0, -15], [0, 21]].forEach(([ox, oy]) => {
        ctx.fillStyle = 'rgba(20,24,20,0.2)'; ctx.beginPath(); ctx.ellipse(sc.x + ox, sc.y + oy + 3, 8, 3.4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#bf4436'; ctx.beginPath(); ctx.ellipse(sc.x + ox, sc.y + oy, 8, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(60,20,14,0.3)'; ctx.fillRect(sc.x + ox - 8, sc.y + oy, 16, 2);
      });
      shadow(ctx, sc.x, sc.y + 11, 24);
      ctx.fillStyle = '#e6e2d6'; ctx.beginPath(); ctx.ellipse(sc.x, sc.y, 30, 16, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#9aa0a4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(sc.x, sc.y, 30, 16, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(150,156,160,0.45)'; ctx.beginPath(); ctx.ellipse(sc.x - 8, sc.y - 4, 10, 4, 0.4, 0, TAU); ctx.fill();
      sc.who.forEach(([nm, ox, oy]) => seated(ctx, api, nm, sc.x + ox, sc.y + oy));
    });
    TR_RACKS.forEach(r => {
      if (!r.bg) trTrolley(ctx, r);
      if (carrying) { corona(ctx, r.x, r.y + 14, 26, t, true); chev(ctx, r.x, r.y - 34, t); }
      txt(ctx, 'RETURN HERE', r.x, r.y + 30, carrying ? '#f8e6b0' : 'rgba(240,232,212,0.5)', 9, 'center');
    });
    s.tables.forEach(tb => {
      [[-34, 5], [34, 5], [0, -15], [0, 21]].forEach(([ox, oy]) => {
        ctx.fillStyle = 'rgba(20,24,20,0.2)'; ctx.beginPath(); ctx.ellipse(tb.x + ox, tb.y + oy + 3, 8, 3.4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#bf4436'; ctx.beginPath(); ctx.ellipse(tb.x + ox, tb.y + oy, 8, 4, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(60,20,14,0.3)'; ctx.fillRect(tb.x + ox - 8, tb.y + oy, 16, 2);
      });
      shadow(ctx, tb.x, tb.y + 11, 24);
      ctx.fillStyle = '#e6e2d6'; ctx.beginPath(); ctx.ellipse(tb.x, tb.y, 30, 16, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#9aa0a4'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(tb.x, tb.y, 30, 16, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = 'rgba(150,156,160,0.45)'; ctx.beginPath(); ctx.ellipse(tb.x - 8, tb.y - 4, 10, 4, 0.4, 0, TAU); ctx.fill();
    });
    s.trays.filter(q => q.st !== 'held').forEach(q => trDrawTray(ctx, q, t));
    const bodies = s.diners.map(p => ({ y: p.y, p })).concat([{ y: s.me.y, p: s.me }]);
    bodies.sort((a, b) => a.y - b.y).forEach(({ p }) => {
      if (p.me) { person(ctx, api, p, '#e8c060'); return; }
      if (p.st === 'eat') {
        seated(ctx, api, p.name, p.x, p.y);
        const [mx, my] = trSlot(p.tb, p.si);
        if (p.rem) trTick(ctx, p.x, p.y - 28, t);
        bar(ctx, Math.round(p.x) - 14, Math.round(p.y) + 6, 28, 4, CL(p.eat / p.span, 0, 1), p.rem ? '#7fb98e' : p.eat / p.span > s.win ? '#6c8496' : '#e8a848');
        if (mx && my) { /* tray drawn with the table layer */ }
      } else person(ctx, api, p, p.rem ? 'rgba(143,212,160,0.6)' : null);
      if (p.sayT > 0) trBubble(ctx, p.x, p.y - 30, p.say);
    });
    s.trays.filter(q => q.st === 'held').forEach(q => trDrawTray(ctx, q, t));
    s.crows.forEach(c => { if (c.tgt && (c.ph === 'dive' || c.ph === 'peck')) chev(ctx, c.tgt.x, c.tgt.y - 32, t, '#ef7a5a'); });
    s.crows.forEach(c => trCrow(ctx, c, t));
    bar(ctx, 214, 366, 148, 8, s.done / s.total, '#7fb98e', 'SERVICE');
    const hot = s.crows.filter(c => c.ph === 'dive' || c.ph === 'peck').sort((a, b) => (b.dive ? b.dive.k : 1) - (a.dive ? a.dive.k : 1))[0];
    if (hot) bar(ctx, 26, 366, 118, 8, hot.ph === 'peck' ? 1 : hot.dive.k, '#e2553c', 'CROW COMING DOWN');
    else txt(ctx, 'ENTER · REMIND, PICK UP, RACK', 26, 374, 'rgba(246,236,210,0.6)', 9);
    const loose = trLoose(s).length;
    if (loose) txt(ctx, loose + (loose > 1 ? ' TRAYS SITTING OUT' : ' TRAY SITTING OUT'), VW - 26, 374, '#f3d08a', 9, 'right');
  },
  hud(s, b) {
    const diving = s.crows.some(c => c.ph === 'dive' || c.ph === 'peck');
    const eating = s.diners.filter(p => p.st === 'eat').length;
    const ready = s.diners.filter(p => p.st === 'eat' && !p.rem && p.eat / p.span <= s.win).length;
    return {
      title: 'Hawker Centre · return your tray',
      stats: [['Cleared', s.done + '/' + s.total], ['They took', String(s.byThem)], ['You carried', String(s.byMe)]],
      chips: [[diving ? 'Crow coming down' : 'Crow circling', diving], [eating + ' eating · ' + ready + ' ready to ask', ready > 0], ['Carrying ' + s.me.hold.length, s.me.hold.length > 0]],
      msg: s.msg,
      help: 'WASD to move · Enter to ask a diner once the bar under them turns amber, to pick up a tray left behind, and to rack it at either trolley · stand over a tray to scare the crow off · Escape to leave',
      end: !s.over ? null : {
        kicker: 'Hawker Centre · lunch service',
        title: s.over.won ? 'Every tray went back' : 'The crow got there first',
        line: s.over.won
          ? s.byThem + ' cleared their own · you carried ' + s.byMe + ' · ' + s.saves + ' shooed off the table'
          : 'Cleared ' + s.done + ' of ' + s.total + ' · ' + s.byThem + ' returned by the people you reminded · best today ' + (b.best || 0),
        note: 'The auntie wipes the table down and the next lot sits. Nothing here counts towards Legacy Day.',
        again: 'Another service'
      }
    };
  }
};

export const GAMES = { mrt, chope, chop, tray };
export const BYE = {
  mrt: 'She steps off early. The seats go back in play without her.',
  chope: 'The tissue packets stay where they are. Lunch crowd thins out by two.',
  chop: 'Uncle takes the cleaver back. “Next time you chop, I watch.”',
  tray: 'The lunch crowd carries on. What is left on the tables is between them and the crows.'
};
