// LPA GO! intro video — Lisa steps out of her own title screen and walks the viewer through the game.
// Built on animations-v3.jsx: one tree, every element keyed to T and CUES.
(function () {
  const { useState, useEffect } = React;

  // Design tokens, resolved to literals so the exported svg carries them.
  // Pixel-game palette: JRPG windows in deep indigo, cream type, gold marks.
  function readTokens() {
    return {
      bg: '#f6eed8', surface: '#efe4c8', text: '#2c2a3a', accent: '#c8963c', a100: 'rgba(200,150,60,0.16)', a300: '#e8c27e',
      a700: '#8a5a14', n300: '#d8ccb0', n700: '#6b6252', n900: '#2c2a3a', divider: 'rgba(44,42,58,0.2)', shadow: 'none', shadowMd: 'none', r: '0px',
      ink: '#2c2a3a', paper: '#fffaf0', head: '"Pixelify Sans", monospace', body: '"Pixelify Sans", monospace', pix: '"Silkscreen", "Pixelify Sans", monospace'
    };
  }
  const WIN = () => ({ boxShadow: '0 0 0 4px ' + K.paper + ', 0 0 0 8px ' + K.ink + ', 10px 10px 0 8px rgba(44,42,58,0.18)' });
  let K = null;

  // ---- the three motion helpers ----
  const MOTION = {
    enter: (T, a, d) => Easing.easeOutCubic(clamp((T - a) / (d || 0.6), 0, 1)),
    move: (T, a, b) => Easing.easeInOutCubic(clamp((T - a) / (b - a), 0, 1)),
    pop: (T, a, d) => Easing.easeOutBack(clamp((T - a) / (d || 0.45), 0, 1))
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  // opacity for an element living between a and b
  const life = (T, a, b, fi, fo) => Math.min(MOTION.enter(T, a, fi || 0.5), 1 - MOTION.move(T, b - (fo || 0.4), b));
  const rise = (T, a, px) => ({ opacity: MOTION.enter(T, a, 0.6), transform: 'translateY(' + ((1 - MOTION.enter(T, a, 0.7)) * (px || 24)) + 'px)' });
  const PIX = { imageRendering: 'pixelated', display: 'block', maxWidth: 'none' };

  const LABELS = { Title: '01 · Title screen', Hello: '02 · Hello', Host: '03 · Your host', Capacity: '04 · Why now', Plan: '05 · The whole game', Town: '06 · Tenang', Neighbours: '07 · The neighbours', Talk: '08 · The conversation', Demo: '09 · Live demo', Week: '10 · The week', Games: '11 · Side games', Sports: '12 · Sport', Recap: '13 · Cheat sheet', Finale: '14 · Your turn' };
  const ORDER = ['Title', 'Hello', 'Host', 'Capacity', 'Plan', 'Town', 'Neighbours', 'Talk', 'Demo', 'Week', 'Games', 'Sports', 'Recap', 'Finale'];

  const LINES = [
    ['Hello', 1.0, 'Wait. Before you press Start.'],
    ['Hello', 6.2, "Hi! I'm Lisa. Around Tenang they call me LPA Lisa."],
    ['Hello', 10.4, 'This is my game. Well, my week, really.'],
    ['Host', 0.2, "I'm a social-work student on placement at the Tenang Community Club."],
    ['Host', 6.4, 'My job this week is to get my neighbours to make a Lasting Power of Attorney.'],
    ['Capacity', 0.2, "Why the rush? Take Andy. He's twenty-three."],
    ['Capacity', 3.4, 'The years go by. Forty-five. Sixty-eight. Eighty-two.'],
    ['Capacity', 9.2, 'One day he may lose mental capacity, and can no longer decide for himself.'],
    ['Capacity', 13.6, "By then it's too late to make an LPA. So I start this week."],
    ['Plan', 0.2, 'Here is the whole game on one page.'],
    ['Plan', 3.6, 'Walk around Tenang and find a neighbour. Five of them want a game before they talk.'],
    ['Plan', 8.6, 'Each chat can clear one Doubt. Three Doubts means three chats.'],
    ['Plan', 14.0, "After the third, they take a flyer and they're booked. Then I find the next one."],
    ['Plan', 20.4, 'The clock never waits. When the week runs out, Legacy Day begins.'],
    ['Town', 0.2, 'This is Tenang. Kampung houses on one side, HDB blocks and a hawker centre on the other.'],
    ['Town', 7.2, 'On Sunday at 09:00 the CC holds Legacy Day, with a doctor and a lawyer on site to certify.'],
    ['Town', 14.2, 'I have six days to get twelve neighbours there.'],
    ['Neighbours', 0.2, 'Twelve neighbours, from Andy, 23, to Fauzi, 59.'],
    ['Neighbours', 6.2, "Each of them has three Doubts: the reasons they haven't made one yet."],
    ['Neighbours', 13.2, "Let's go and find Andy."],
    ['Talk', 0.2, 'Find a neighbour, walk up, press A. The clock runs while I walk, and stops while we talk.'],
    ['Talk', 7.2, 'Then I pick one of three replies. One convinces. One is true but misses the point. One is a myth.'],
    ['Talk', 15.2, 'A myth backfires. I lose thirty minutes, and they need space until the next phase.'],
    ['Talk', 22.4, 'Next phase, the same Doubt is waiting. The right answer clears it and unlocks a Fact Card, cited to the law.'],
    ['Talk', 31.2, 'Three good chats later, Andy takes a flyer and pins his name on the CC noticeboard.'],
    ['Demo', 0.2, "Let's convince someone now!", 2.3],
    ['Week', 0.2, 'One day here is six real minutes: morning, midday, evening and night.'],
    ['Week', 6.2, 'Nobody waits for me. Andy is at the gym most of the day. My Notebook keeps a hint of where everyone was seen.'],
    ['Week', 12.2, 'The week has news of its own. And my bed at home skips straight to the next morning.'],
    ['Week', 17.8, 'Pick a pace. Kampung gives hints, Heartland is the standard, Kiasu is short and harsh.'],
    ['Games', 0.2, "Five neighbours won't talk LPA until we've played their game. Each one fits who they are."],
    ['Games', 4.2, 'The MRT. Seats come and go every station, like capacity. Giving up the priority seat is what a donee does.'],
    ['Games', 13.2, "The hawker centre. Chope a table before the music stops. An LPA only counts if you sign while you still can."],
    ['Games', 22.2, 'Chicken rice. Even pieces, clear of the bone, as ordered. A donee shares out your money by your rules.'],
    ['Games', 31.2, 'Tray return. Remind people in time and they clear up themselves. A plan works when people know about it.'],
    ['Games', 40.2, 'Fishing. Pull while she runs and the line snaps. Pressure backfires with people too.'],
    ['Games', 43.7, 'Whoa! Heads up!'],
    ['Games', 46.1, "Sorry! A glitch in the fishing game. That fish wasn't meant to leave the jetty."],
    ['Sports', 0.2, "Sport is the one part that's optional. Step into a glowing marker and it's your match."],
    ['Sports', 3.6, 'Football on the school field, basketball in the Sports Hall, badminton doubles on court 1. WASD is all you need.'],
    ['Sports', 13.0, "None of it counts toward Sunday. It's just Tenang being Tenang."],
    ['Recap', 0.2, 'One last look before you start.'],
    ['Recap', 2.8, 'Watch above their heads. Question marks are Doubts left, a cloud means not now, a tick means booked.'],
    ['Recap', 11.0, 'Six booked is Bronze, nine is Silver, twelve is Gold. No backfires at all for Platinum.'],
    ['Recap', 17.2, "There's no game over. Legacy Day happens with whoever turns up."],
    ['Finale', 0.2, 'Six days. Twelve neighbours. You choose what I say.']
  ];

  // plate rectangles for the title screen (16:9)
  const R_FULL = { cx: 960, cy: 540, w: 1920 }, R_STAGE = { cx: 960, cy: 470, w: 1180 }, R_CONTENT = { cx: 1132, cy: 475, w: 1140 };
  const rect = r => ({ x: r.cx - r.w / 2, y: r.cy - r.w * 9 / 32, w: r.w, h: r.w * 9 / 16 });
  const mixR = (a, b, t) => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), w: lerp(a.w, b.w, t) });
  const HOST = { cx: 236, bottom: 1032, s: 14 };
  const HD = { w: 44, h: 48, px: 6, s: 7 };
  const JUMPS = ['Host', 'Capacity', 'Plan', 'Town', 'Neighbours', 'Talk', 'Week', 'Games', 'Sports', 'Recap'];
  const DRIFT = { Host: 0, Capacity: -14, Plan: 26, Town: -18, Neighbours: 12, Talk: -22, Week: 18, Games: -20, Sports: 10, Recap: 0 };
  // scene changes alternate: a hop, then a push where she shoves the old scene off to the right
  // how she changes each slide: hand push, a hip bump (still facing us), or a gentle kick
  const PUSH = { Plan: 'push', Neighbours: 'back', Week: 'push', Sports: 'kick' };
  const REACH = { push: [300, 64], back: [326, 44], kick: [304, 26] };
  function sceneMove(T, C) {
    let dx = 0;
    for (const n of JUMPS) {
      const d = DRIFT[n];
      if (PUSH[n]) {
        const u = T - (C[n] - 1.1), home = HOST.cx + dx, to = HOST.cx + d, kind = PUSH[n], [PUSH_CX, PUSH_REACH] = REACH[kind];
        if (u < 0) break;
        if (u >= 1.9) { dx = d; continue; }
        if (u < 0.45) return { y: 0, sq: 1, dx: lerp(home, PUSH_CX, Easing.easeInOutSine(u / 0.45)) - HOST.cx, walk: true, land: -1 };
        if (u < 1.15) {
          const k = (u - 0.45) / 0.7;
          if (kind === 'back') { const b = Math.sin(Math.PI * clamp((k - 0.12) / 0.5, 0, 1)); return { y: b * 14, sq: 1 - 0.08 * Math.sin(Math.PI * clamp(k / 0.14, 0, 1)), dx: PUSH_CX + PUSH_REACH * b - HOST.cx, pose: 'hip', lean: -b * 11, land: -1 }; }
          if (kind === 'kick') { const on = k > 0.22 && k < 0.8, f = Math.sin(Math.PI * clamp((k - 0.22) / 0.58, 0, 1)); return { y: on ? f * 6 : 0, sq: k < 0.22 ? 1 - 0.07 * Math.sin(Math.PI * k / 0.22) : 1, dx: PUSH_CX + PUSH_REACH * f - HOST.cx, pose: on ? 'kick' : 'idle', lean: on ? f * 5 : 0, land: -1 }; }
          return { y: 0, sq: 1 - 0.04 * Math.sin(Math.PI * k), dx: PUSH_CX + PUSH_REACH * Easing.easeInOutCubic(k) - HOST.cx, pose: 'push', lean: Math.sin(Math.PI * Math.min(1, k * 1.3)) * 9, land: -1 };
        }
        const k = (u - 1.15) / 0.75;
        return { y: 0, sq: 1, dx: lerp(PUSH_CX + PUSH_REACH, to, Easing.easeInOutSine(k)) - HOST.cx, walk: k < 0.95, land: -1 };
      }
      const u = T - (C[n] - 0.5);
      if (u < 0) break;
      if (u >= 1.2) { dx = d; continue; }
      if (u < 0.18) return { y: 0, sq: 1 - 0.16 * Math.sin(Math.PI * u / 0.18), air: false, dx, land: -1 };
      if (u < 0.9) { const k = (u - 0.18) / 0.72; return { y: Math.sin(Math.PI * k) * 200, sq: 1 + 0.07 * Math.sin(Math.PI * k), air: true, dx: lerp(dx, d, Easing.easeInOutCubic(k)), land: -1 }; }
      return { y: 0, sq: 1 - 0.18 * Math.sin(Math.PI * clamp((u - 0.9) / 0.26, 0, 1)), air: false, dx: d, land: u - 0.9 };
    }
    return { y: 0, sq: 1, air: false, dx, land: -1 };
  }
  // offset for a scene being shoved out (at its end) or sliding in behind her hand (at its start)
  function shoveX(T, C, n) {
    const i = ORDER.indexOf(n), next = ORDER[i + 1];
    let x = 0;
    if (PUSH[n]) x -= 140 * (1 - Easing.easeOutCubic(clamp((T - C[n]) / 0.7, 0, 1)));
    if (next && PUSH[next]) x += 220 * Easing.easeInCubic(clamp((T - (C[next] - 0.62)) / 0.72, 0, 1));
    return x;
  }
  const Shove = ({ T, C, n, children }) => {
    const x = shoveX(T, C, n);
    return x === 0 ? children : <div style={{ position: 'absolute', inset: 0, transform: 'translateX(' + x + 'px)' }}>{children}</div>;
  };
  function linePose(L, C) {
    const ln = LINES[L.i];
    if (/^Hi/.test(ln[2]) || ln[0] === 'Finale') return 'wave';
    if (/^Wait/.test(ln[2])) return 'point';
    if (/\?/.test(ln[2])) return 'think';
    if (/!$/.test(ln[2])) return 'cheer';
    return ['present', 'point', 'present', 'present', 'point'][L.i % 5];
  }

  function Plate({ x, y, w, h, opacity, children, mat }) {
    return (
      <div style={Object.assign({ position: 'absolute', left: x, top: y, width: w, height: h, opacity, boxSizing: 'border-box', overflow: 'hidden', background: K.ink }, mat === 0 ? {} : WIN())}>
        {children}
      </div>
    );
  }
  const Kicker = ({ children, style }) => <div style={Object.assign({ fontFamily: K.pix, fontSize: 24, lineHeight: '30px', letterSpacing: '0.02em', textTransform: 'uppercase', color: K.a700 }, style)}>{children}</div>;

  // ---- header ----
  function Header({ T, CUES }) {
    return (
      <div style={{ position: 'absolute', left: 96, right: 96, top: 44, height: 64, opacity: Math.min(MOTION.enter(T, CUES.Hello + 0.2, 0.6), 1 - MOTION.move(T, CUES.Finale + 5.0, CUES.Finale + 5.8)) * (1 - demoCover(T, CUES)) }}>
        <div style={Object.assign({ position: 'absolute', left: 0, top: 0, height: 64, display: 'flex', alignItems: 'center', gap: 22, padding: '0 22px', background: K.bg }, WIN())}>
          <span style={{ fontFamily: K.head, fontWeight: 700, fontSize: 40, color: K.text }}>LPA GO!</span>
          <span style={{ fontFamily: K.pix, fontSize: 24, color: K.a700 }}>Six days to Legacy Day</span>
        </div>
        <div style={Object.assign({ position: 'absolute', right: 0, top: 0, height: 64, width: 470, background: K.bg }, WIN())}></div>
        {ORDER.map((n, i) => {
          const a = CUES[n], b = i < ORDER.length - 1 ? CUES[ORDER[i + 1]] : 1e9;
          const o = T < a - 0.3 || T > b + 0.3 ? 0 : Math.min(MOTION.enter(T, a, 0.5), 1 - MOTION.move(T, b - 0.2, b + 0.1));
          return <div key={n} style={{ position: 'absolute', right: 22, top: 17, opacity: o, fontFamily: K.pix, fontSize: 24, lineHeight: '30px', textTransform: 'uppercase', color: K.text }}>{LABELS[n]}</div>;
        })}
      </div>
    );
  }

  // ---- the title screen plate, which Lisa leaves and later returns to ----
  function titleRect(T, C) {
    let r = mixR(R_FULL, R_STAGE, MOTION.move(T, C.Hello + 0.1, C.Hello + 1.1));
    r = mixR(r, R_CONTENT, MOTION.move(T, C.Hello + 5.0, C.Hello + 6.3));
    if (T > C.Host) r = R_CONTENT;
    if (T > C.Finale - 1) r = mixR(R_CONTENT, R_FULL, MOTION.move(T, C.Finale + 5.0, C.Finale + 6.3));
    return rect(r);
  }
  // 1 = looking at the town, 0 = up at the sky; opens on the sky and ends there for the loop
  function titleTilt(T, C) { return MOTION.move(T, 0.6, 5.0) - (T > C.Finale ? MOTION.move(T, C.Finale + 6.4, C.Finale + 8.8) : 0); }
  function ContentWindow({ T, C }) {
    const o = Math.min(MOTION.enter(T, C.Host - 0.8, 0.6), 1 - MOTION.move(T, C.Finale + 4.8, C.Finale + 5.4));
    if (o <= 0) return null;
    return <div style={Object.assign({ position: 'absolute', left: 440, top: 150, width: 1384, height: 650, background: K.bg, opacity: o }, WIN())}></div>;
  }
  function TitlePlate({ T, C, kit }) {
    const R = titleRect(T, C), s = R.w / kit.title.w;
    const op = T < C.Host + 0.5 ? 1 - MOTION.move(T, C.Host - 0.8, C.Host - 0.1) : MOTION.enter(T, C.Finale - 0.4, 0.8);
    if (op <= 0) return null;
    const offY = -titleTilt(T, C) * (kit.title.h - kit.title.w * 9 / 16) * s;
    const lg = kit.logo, lw = lg.w * s * 0.72, drop = MOTION.pop(T, 4.6, 0.8);
    const endLogo = T > C.Finale - 1 ? Math.min(MOTION.pop(T, C.Finale + 0.4, 0.8), 1 - MOTION.move(T, C.Finale + 6.6, C.Finale + 7.6)) : 1;
    const cx = -((T * 7) % 480) * s, fx = (T * 34) % 900 - 160;
    return (
      <Plate x={R.x} y={R.y} w={R.w} h={R.h} opacity={op} mat={R.w > 1900 ? 0 : 1}>
        <div style={{ position: 'absolute', left: 0, top: offY, width: R.w, height: kit.title.h * s }}>
          <img src={kit.title.url} style={Object.assign({ width: '100%', height: '100%' }, PIX)} />
          {[0, 1].map(i => <img key={i} src={kit.clouds} style={Object.assign({ position: 'absolute', left: cx + i * 480 * s, top: 10 * s, width: 480 * s, height: 40 * s, opacity: 0.9 }, PIX)} />)}
          {[0, 1, 2].map(i => <img key={'b' + i} src={kit.birds[Math.floor(T * 5 + i) % 2]} style={Object.assign({ position: 'absolute', left: (fx - i * 14) * s, top: (40 + i * 7 + Math.sin(T * 2 + i) * 2) * s, width: 7 * s, height: 5 * s }, PIX)} />)}
        </div>
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src={lg.url} style={Object.assign({ position: 'absolute', left: (R.w - lw) / 2 - 6, top: R.h * 0.07 - (1 - drop) * 120, width: lw, opacity: Math.min(drop, endLogo) }, PIX)} />
        </div>
      </Plate>
    );
  }
  function PressStart({ T, C }) {
    const o = Math.max(life(T, 5.6, C.Hello + 0.4), T > C.Finale + 6 ? life(T, C.Finale + 6.2, C.Finale + 7.8) : 0);
    const blink = Math.floor(T * 1.6) % 2 ? 1 : 0.35;
    if (o <= 0) return null;
    return <div style={{ position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', opacity: o * blink, fontFamily: K.pix, fontSize: 48, color: K.paper, textShadow: '4px 4px 0 ' + K.ink + ', -4px 0 0 ' + K.ink + ', 0 -4px 0 ' + K.ink + ', 4px 0 0 ' + K.ink + ', 0 4px 0 ' + K.ink }}>Press Start</div>;
  }

  // ---- the fish gag: one leaps out of the fishing plate at the viewer, Lisa catches it and throws it off ----
  const GAG_AT = 43.6, GAG_JUMP = 180;
  function gagLisa(u) {
    if (u < 0.2 || u > 2.35) return null;
    if (u < 0.35) return { y: 0, sq: 1 - 0.14 * Math.sin(Math.PI * (u - 0.2) / 0.15), pose: 'cheer', land: -1 };
    if (u < 0.7) return { y: GAG_JUMP * Easing.easeOutCubic((u - 0.35) / 0.35), sq: 1.05, air: true, pose: 'cheer', land: -1 };
    if (u < 0.95) return { y: GAG_JUMP, sq: 1, air: true, pose: 'cheer', land: -1 };
    if (u < 1.25) return { y: GAG_JUMP * (1 - Easing.easeInCubic((u - 0.95) / 0.3)), sq: 1, air: true, pose: 'cheer', land: -1 };
    if (u < 1.9) return { y: 0, sq: 1 - 0.16 * Math.sin(Math.PI * clamp((u - 1.25) / 0.26, 0, 1)), pose: 'cheer', land: u - 1.25 };
    return { y: 0, sq: 1, pose: 'push', lean: -Math.sin(Math.PI * clamp((u - 1.9) / 0.45, 0, 1)) * 10, land: -1 };
  }
  // the fish is the jetty game's own sprite, handed off from the plate the frame it breaks the surface
  function FishGag({ T, C, kit }) {
    const FG = kit.fishGag, u = T - (C.Games + GAG_AT);
    if (!FG || u < 0 || u > 3.0) return null;
    const z = 1 + 0.02 * ((GAG_AT - 40) / 9), U0 = 1.5 * z, U1 = 9;
    const sx = 1344 + (FG.x * 1.5 - 432) * z, sy = 464 + (FG.y * 1.5 - 288) * z;
    const hx = HOST.cx + DRIFT.Games, top = HOST.bottom - HD.h * HD.s;
    const G = gagLisa(u), ly = G ? G.y : 0, held = [hx - 4, top - ly - 36];
    const wag = Math.sin(T * (u < 2.1 ? 22 : 30)) * 1.6, art = FG.art[wag < -0.35 ? 1 : wag > 0.35 ? 2 : 0];
    let x, y, U, rot;
    if (u < 0.7) {
      const p = Easing.easeInQuad(u / 0.7);
      x = lerp(sx, held[0], p); y = lerp(sy, top - GAG_JUMP - 36, p) - Math.sin(Math.PI * p) * 50; U = lerp(U0, U1, Easing.easeOutQuad(u / 0.7)); rot = lerp(0.8, 0, p) + Math.sin(u * 26) * 0.12;
    } else if (u < 2.1) {
      const back = u > 1.9 ? Math.sin(Math.PI / 2 * (u - 1.9) / 0.2) * 34 : 0, grab = clamp((u - 0.7) / 0.12, 0, 1);
      x = held[0] + back; y = held[1] - back * 0.6; U = U1 * (1 + 0.08 * (1 - grab)); rot = Math.sin(u * 38) * 0.14;
    } else {
      const p = Easing.easeOutQuad((u - 2.1) / 0.9);
      x = lerp(held[0] + 34, -460, p); y = lerp(held[1] - 20, -380, p) - Math.sin(Math.PI * p) * 140; U = U1; rot = -13 * p;
    }
    const W = FG.W * U, H = FG.H * U;
    const sp = u < 0.5 ? u / 0.5 : -1;
    return (
      <React.Fragment>
        {sp >= 0 && [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const ang = Math.PI * (0.12 + i * 0.1), d = (6 + sp * 34) * U0 * (0.6 + (i % 3) * 0.2), sz = 2 * U0 * (1 - sp * 0.6);
          return <div key={i} style={{ position: 'absolute', left: sx + Math.cos(ang) * d - sz / 2, top: sy + 4 * U0 - Math.sin(ang) * d * 1.3 + sp * sp * 30 * U0 - sz / 2, width: sz, height: sz, background: 'rgb(226,240,252)', opacity: 1 - sp }}></div>;
        })}
        <img src={art} style={Object.assign({ position: 'absolute', left: x - W / 2, top: y - H / 2, width: W, height: H, transform: 'rotate(' + rot + 'rad)' }, PIX)} />
      </React.Fragment>
    );
  }

  // ---- Lisa ----
  function lineAt(T, C) {
    let cur = null;
    for (let i = 0; i < LINES.length; i++) { const at = C[LINES[i][0]] + LINES[i][1]; if (T >= at) cur = { i, at, text: LINES[i][2] }; }
    if (!cur) return null;
    const nx = LINES[cur.i + 1], ln = LINES[cur.i];
    let until = nx ? C[nx[0]] + nx[1] - 0.25 : C.Finale + 4.6;
    if (ln[3]) until = Math.min(until, cur.at + ln[3]);
    cur.until = until; cur.n = Math.floor((T - cur.at) * 46); cur.typing = cur.n < cur.text.length && T < until;
    return cur;
  }
  function Lisa({ T, C, kit }) {
    const R = titleRect(T, C), s = R.w / kit.title.w, sp = kit.title.lisa, ps = s / 2;
    // in the plate: her spot on the lane
    const hop = T > C.Hello + 0.6 && T < C.Hello + 1.1 ? Math.sin(Math.PI * (T - C.Hello - 0.6) / 0.5) * 5 : 0;
    const offY = -titleTilt(T, C) * (kit.title.h - kit.title.w * 9 / 16) * s;
    const inP = { x: R.x + sp.x * s - HD.px * ps, y: R.y + offY + (sp.y - hop) * s, w: HD.w * ps };
    const j = MOTION.move(T, C.Hello + 5.0, C.Hello + 6.1) - MOTION.move(T, C.Finale + 5.0, C.Finale + 6.2);
    const hosted = j > 0.5, L = lineAt(T, C), talking = L && L.typing;
    let J = sceneMove(T, C);
    const G = gagLisa(T - (C.Games + GAG_AT));
    if (G && hosted) J = Object.assign({}, J, G);
    // narrating: syllable bounce, a sway, a little hop on each new line
    const hostW = HD.w * HD.s, hostH = HD.h * HD.s;
    const bob = talking ? -Math.abs(Math.sin(T * 7.5)) * 7 : Math.round(Math.sin(T * 2.4)) * 3;
    const sway = talking ? Math.sin(T * 1.7) * 10 : 0;
    const lineHop = L && !J.air ? Math.sin(Math.PI * clamp((T - L.at) / 0.34, 0, 1)) * 18 : 0;
    const out = { x: HOST.cx - hostW / 2 + J.dx + sway, y: HOST.bottom - hostH + bob - lineHop - J.y, w: hostW };
    const arc = Math.sin(Math.PI * clamp(j, 0, 1)) * 220;
    let squat = T > C.Hello + 4.6 && T < C.Hello + 5.05 ? 1 - 0.1 * Math.sin(Math.PI * (T - C.Hello - 4.6) / 0.45) : 1;
    if (hosted) squat *= J.sq;
    if (hosted) squat *= demoCrouch(T, C);
    let x = lerp(inP.x, out.x, j), w = lerp(inP.w, out.w, j), y = lerp(inP.y, out.y, j) - arc, h = w * HD.h / HD.w;
    const DL = hosted ? demoLeap(T, C, x + w / 2, y + h, w) : null;
    if (DL === false) return null;
    if (DL) { w = DL.w; h = w * HD.h / HD.w; x = DL.cx - w / 2; y = DL.b - h; squat = 1; }
    const mouth = talking ? [1, 2, 1, 0][Math.floor(T * 9) % 4] : 0;
    const walking = !DL && ((j > 0.02 && j < 0.98) || (hosted && J.walk));
    let pose = 'idle';
    if (hosted && J.pose) pose = J.pose;
    else if ((j > 0.02 && j < 0.98) || (hosted && J.air)) pose = 'cheer';
    else if (L && T < L.until - 0.35) pose = linePose(L, C);
    if (DL) pose = 'cheer';
    if (pose === 'wave') pose = 'wave' + (Math.floor(T * 5) % 2);
    const blink = ((T + 0.7) % 3.4) < 0.13 ? 1 : 0;
    const frame = kit.lisaHD[pose][walking ? Math.floor(T * 8) % 2 : 0][mouth][blink];
    const lift = hosted ? J.y + arc : arc;
    const hopShadow = hosted && !DL ? clamp(1 - lift / 280, 0.25, 1) : 0;
    const cx = x + w / 2, sw = 2 - squat;
    const dust = hosted && !DL && J.land >= 0 && J.land < 0.45 ? J.land / 0.45 : -1;
    // surprise mark over her head, in the plate
    const bang = life(T, C.Hello + 0.6, C.Hello + 3.0, 0.2, 0.3), bangS = MOTION.pop(T, C.Hello + 0.6, 0.3);
    return (
      <React.Fragment>
        {hopShadow > 0 && <div style={{ position: 'absolute', left: cx - 100, top: HOST.bottom - 16, width: 200, height: 26, borderRadius: '50%', background: 'rgba(45,43,43,0.18)', opacity: hopShadow, transform: 'scale(' + (0.5 + 0.5 * hopShadow) + ')' }}></div>}
        {dust >= 0 && [-1, 1].map(sd => [0, 1, 2].map(k => {
          const sz = (16 - k * 3) * (1 - dust);
          return <div key={sd + '' + k} style={{ position: 'absolute', left: cx + sd * (70 + dust * (90 + k * 50)) - sz / 2, top: HOST.bottom - 18 - dust * (18 + k * 16) - sz / 2, width: sz, height: sz, background: K.paper, boxShadow: '0 0 0 3px ' + K.ink, opacity: 1 - dust }}></div>;
        }))}
        <img src={frame} style={Object.assign({ position: 'absolute', left: cx - w * sw / 2, top: y + h * (1 - squat), width: w * sw, height: h * squat, transformOrigin: '50% 100%', transform: hosted && J.lean ? 'skewX(' + (-J.lean) + 'deg)' : 'none' }, PIX)} />
        {bang > 0 && <div style={{ position: 'absolute', left: inP.x + inP.w / 2 - 22, top: inP.y - 64, width: 44, height: 52, opacity: bang, transform: 'scale(' + bangS + ')', transformOrigin: '50% 100%', background: K.bg, border: '3px solid ' + K.n900, borderRadius: K.r, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.head, fontSize: 44, fontWeight: 600, color: K.a700 }}>!</div>}
      </React.Fragment>
    );
  }

  // ---- the dialogue box: the one caption element ----
  function Dialogue({ T, C }) {
    const o = life(T, C.Hello + 0.6, C.Finale + 5.0, 0.4, 0.5) * (1 - demoCover(T, C));
    if (o <= 0) return null;
    const L = lineAt(T, C);
    const lo = L ? Math.min(1, 1 - MOTION.move(T, L.until - 0.15, L.until)) : 0;
    const shown = L ? L.text.slice(0, Math.max(0, L.n)) : '';
    const done = L && !L.typing;
    return (
      <div style={{ position: 'absolute', left: 400, right: 96, top: 846, height: 186, opacity: o, transform: 'translateY(' + (1 - MOTION.enter(T, C.Hello + 0.6, 0.5)) * 30 + 'px)' }}>
        <div style={Object.assign({ position: 'absolute', inset: 0, background: K.bg }, WIN())}></div>
        <div style={{ position: 'absolute', left: 36, top: -30, padding: '6px 18px', background: K.accent, boxShadow: '0 0 0 4px ' + K.ink, fontFamily: K.pix, fontSize: 28, lineHeight: '32px', color: K.ink }}>LPA Lisa</div>
        <div style={{ position: 'absolute', left: 48, right: 90, top: 34, fontFamily: K.body, fontSize: 42, lineHeight: '58px', color: K.text, opacity: lo, textWrap: 'pretty', fontVariantLigatures: 'none' }}>
          <span>{shown}</span><span style={{ opacity: 0 }}>{L ? L.text.slice(Math.max(0, L.n)) : ''}</span>
        </div>
        {done && <div style={{ position: 'absolute', right: 34, bottom: 24 + (Math.floor(T * 2.5) % 2) * 6, fontSize: 24, color: K.accent, opacity: lo }}>▼</div>}
      </div>
    );
  }

  // ---- 03 host card ----
  function HostCard({ T, C }) {
    const a = C.Host, o = life(T, a - 0.3, C.Capacity + 0.1);
    if (o <= 0) return null;
    const drift = -14 * MOTION.move(T, a, C.Capacity);
    return (
      <div style={{ position: 'absolute', left: 490, right: 146, top: 200, height: 580, opacity: o, transform: 'translateX(' + drift + 'px)', display: 'grid', gridTemplateColumns: '1fr 1px 1fr', columnGap: 72 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div style={rise(T, a - 0.2)}><Kicker>Placement · Tenang Community Club</Kicker></div>
          <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 132, lineHeight: '132px', color: K.text }, rise(T, a, 40))}>Lisa Lim</div>
          <div style={Object.assign({ fontFamily: K.head, fontSize: 48, lineHeight: '52px', color: K.a700, marginTop: -10 }, rise(T, a + 0.2, 24))}>a.k.a. “LPA Lisa”</div>
          <div style={Object.assign({ fontFamily: K.body, fontSize: 36, lineHeight: '50px', color: K.text }, rise(T, a + 0.4))}>24 · Social-work student</div>
          <div style={Object.assign({ fontFamily: K.body, fontSize: 30, lineHeight: '44px', color: K.n700, maxWidth: '22ch' }, rise(T, a + 0.8))}>Persuades and refers. Never certifies.</div>
        </div>
        <div style={{ background: K.divider, transform: 'scaleY(' + MOTION.move(T, a - 0.2, a + 1.0) + ')', transformOrigin: 'top' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, paddingTop: 8 }}>
          <div style={rise(T, a + 6.6)}><Kicker>What she is asking for</Kicker></div>
          <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 60, lineHeight: '66px', color: K.text }, rise(T, a + 6.9, 30))}>Lasting Power of Attorney</div>
          <div style={Object.assign({ fontFamily: K.body, fontSize: 32, lineHeight: '48px', color: K.text, textWrap: 'pretty' }, rise(T, a + 7.4))}>A legal document naming who can decide for you if you ever lose mental capacity.</div>
          <div style={Object.assign({ fontFamily: K.body, fontSize: 32, lineHeight: '48px', color: K.text, textWrap: 'pretty', borderTop: '1px solid ' + K.divider, paddingTop: 22 }, rise(T, a + 8.6))}>You can make one from 21, but only while you still have capacity.</div>
        </div>
      </div>
    );
  }

  // ---- 04 why now: Andy grows old and loses capacity ----
  const AGE_AT = age => 3.6 + (age - 23) / 59 * 4.8;
  function Capacity({ T, C, kit }) {
    const a = C.Capacity, b = C.Plan, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (o <= 0) return null;
    const lt = T - a, AG = kit.andyAges, Z = 4.4, ox = 60, oy = 68, ax = 42, ay = 30;
    const age = Math.round(23 + 59 * clamp((lt - 3.6) / 4.8, 0, 1));
    const gi = AG.reduce((acc, g, i) => (age >= g[0] ? i : acc), 0);
    const pop = gi ? MOTION.pop(T, a + AGE_AT(AG[gi][0]), 0.35) : 1;
    const noCap = life(T, a + 9.6, b + 0.1, 0.3, 0.3), noS = MOTION.pop(T, a + 9.6, 0.4);
    const dim = 0.28 * clamp((lt - 3.6) / 4.8, 0, 1);
    const bob = gi < 3 ? Math.round(Math.sin(T * 2.2)) * 2 : 0;
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
        <Plate x={490} y={196} w={440} h={330} opacity={MOTION.enter(T, a + 0.2, 0.5)}>
          <img src={kit.plaza.url} style={Object.assign({ position: 'absolute', left: -ox * Z, top: -oy * Z, width: kit.plaza.w * Z, height: kit.plaza.h * Z }, PIX)} />
          <div style={{ position: 'absolute', inset: 0, background: '#6a5a40', opacity: dim }}></div>
          <img src={AG[gi][1]} style={Object.assign({ position: 'absolute', left: ax * Z, top: ay * Z + bob, width: 16 * Z, height: 24 * Z, transformOrigin: '50% 100%', transform: 'scale(' + (0.85 + 0.15 * pop) + ')' }, PIX)} />
          {noCap > 0 && <div style={{ position: 'absolute', left: (ax + 8) * Z, top: ay * Z - 52, transform: 'translateX(-50%) scale(' + noS + ')', transformOrigin: '50% 100%', opacity: noCap, whiteSpace: 'nowrap', padding: '4px 14px', background: '#dcd7cd', boxShadow: '0 0 0 3px ' + K.ink, fontFamily: K.pix, fontSize: 24, color: K.ink }}>No capacity</div>}
          <div style={{ position: 'absolute', left: 10, top: 10, display: 'flex', alignItems: 'baseline', gap: 12, padding: '4px 12px', background: K.bg, border: '1px solid ' + (lt >= 9.6 ? BAD : K.divider), borderRadius: '2px', whiteSpace: 'nowrap', opacity: MOTION.enter(T, a + 0.6, 0.4) }}>
            <span style={{ fontFamily: K.pix, fontSize: 24, color: K.a700, fontFeatureSettings: '"tnum" 1' }}>AGE {age}</span>
            <span style={{ fontFamily: K.body, fontSize: 24, color: K.text }}>{lt < 3.6 ? 'Today' : lt < 9.6 ? 'Years go by' : 'Too late for an LPA'}</span>
          </div>
        </Plate>
        <div style={{ position: 'absolute', left: 986, right: 146, top: 196, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={rise(T, a + 0.2)}><Kicker>Why it can't wait</Kicker></div>
          <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 64, lineHeight: '68px', color: K.text }, rise(T, a + 0.4, 24))}>Capacity doesn't wait</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: 18, marginTop: 6 }}>
            {AG.map((g, i) => {
              const reached = i <= gi && (i === 0 || lt >= AGE_AT(g[0])), on = i === gi, p = i ? MOTION.pop(T, a + AGE_AT(g[0]), 0.4) : MOTION.pop(T, a + 0.8, 0.4);
              return (
                <div key={g[0]} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: reached ? 1 : 0.3 }}>
                  <div style={{ padding: '10px 22px 4px', background: '#70d070', boxShadow: '0 0 0 4px #3c9a48, 0 0 0 7px ' + K.ink, transform: 'scale(' + (reached ? 0.9 + 0.1 * p : 0.9) + ')' }}><img src={g[1]} style={Object.assign({ width: 64, height: 96 }, PIX)} /></div>
                  <div style={{ fontFamily: K.head, fontSize: 34, lineHeight: '36px', color: K.text, fontFeatureSettings: '"tnum" 1', borderBottom: '1px solid ' + (on ? K.accent : 'transparent'), paddingBottom: 4 }}>{g[0]}</div>
                  {i === 3 && <div style={{ fontFamily: K.body, fontSize: 24, color: K.n700, opacity: noCap }}>No capacity</div>}
                </div>
              );
            })}
          </div>
          <div style={Object.assign({ borderTop: '1px solid ' + K.divider, paddingTop: 18, fontFamily: K.body, fontSize: 28, lineHeight: '40px', color: K.text, textWrap: 'pretty' }, rise(T, a + 13.8, 14))}>An LPA can only be made while you still have capacity. Andy can make his today.</div>
        </div>
      </div>
    );
  }

  // ---- 04 the town pan ----
  function Town({ T, C, kit }) {
    const a = C.Town, b = C.Neighbours, o = life(T, a, b + 0.1, 0.6, 0.6);
    if (o <= 0) return null;
    const box = { x: 440, y: 150, w: 1384, h: 650 }, s = box.h / kit.town.h, sw = kit.town.w * s;
    const pan = -(sw - box.w) * MOTION.move(T, a - 0.2, b - 0.4);
    const poster = life(T, a + 7.4, a + 14.0), figs = life(T, a + 14.4, b + 0.1);
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
        <Plate x={box.x} y={box.y} w={box.w} h={box.h} mat={0}>
          <div style={{ position: 'absolute', left: pan, top: 0, width: sw, height: box.h }}>
            <img src={kit.town.url} style={Object.assign({ width: sw, height: box.h }, PIX)} />
            {kit.town.labels.map((l, i) => {
              const sx = l.x * s + pan + box.x;
              const on = clamp((sx - 520) / 220, 0, 1) * clamp((1800 - sx) / 220, 0, 1);
              return <div key={i} style={{ position: 'absolute', left: l.x * s, top: l.y * s - 54, transform: 'translateX(-50%) translateY(' + (1 - on) * 14 + 'px)', opacity: on, whiteSpace: 'nowrap', padding: '4px 12px', background: K.bg, boxShadow: '0 0 0 3px ' + K.accent + ', 0 0 0 6px ' + K.ink, fontFamily: K.pix, fontSize: 24, color: K.text }}>{l.t}</div>;
            })}
          </div>
        </Plate>
        {poster > 0 && (
          <div style={{ position: 'absolute', left: 1180, top: 196, width: 580, padding: '30px 38px', boxSizing: 'border-box', background: K.bg, boxShadow: WIN().boxShadow, opacity: poster, transform: 'translateY(' + (1 - MOTION.enter(T, a + 7.4, 0.7)) * 30 + 'px) rotate(-0.6deg)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Kicker>Kampung noticeboard</Kicker>
            <div style={{ fontFamily: K.head, fontSize: 64, lineHeight: '64px', color: K.text }}>Tenang Legacy Day</div>
            <div style={{ fontFamily: K.body, fontSize: 30, lineHeight: '42px', color: K.text, borderTop: '1px solid ' + K.divider, paddingTop: 14, fontFeatureSettings: '"tnum" 1' }}>Sunday 09:00 · Tenang Community Club</div>
            <div style={{ fontFamily: K.body, fontSize: 26, lineHeight: '38px', color: K.n700, textWrap: 'pretty' }}>An OPG-accredited GP and a practising lawyer on site, volunteers for the online application, free kopi.</div>
          </div>
        )}
        {figs > 0 && (
          <div style={{ position: 'absolute', left: 1180, top: 196, width: 580, padding: '30px 38px', boxSizing: 'border-box', background: K.bg, boxShadow: WIN().boxShadow, opacity: figs, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', columnGap: 34 }}>
            {[['6', 'days'], null, ['12', 'neighbours']].map((f, i) => f ? (
              <div key={i} style={Object.assign({ display: 'flex', flexDirection: 'column', gap: 4 }, rise(T, a + 14.6 + i * 0.35, 20))}>
                <div style={{ fontFamily: K.head, fontSize: 140, lineHeight: '130px', color: K.text, fontFeatureSettings: '"tnum" 1' }}>{f[0]}</div>
                <Kicker>{f[1]}</Kicker>
              </div>) : <div key={i} style={{ background: K.divider }}></div>)}
          </div>
        )}
      </div>
    );
  }

  // ---- 05 the neighbours ----
  function Neighbours({ T, C, kit }) {
    const a = C.Neighbours, b = C.Talk, o = life(T, a, b + 0.1, 0.4, 0.5);
    if (o <= 0) return null;
    const focus = MOTION.move(T, a + 6.2, a + 6.9), andy = kit.neighbours[0];
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
        <div style={{ position: 'absolute', left: 490, width: 1300, top: 176, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', rowGap: 12 }}>
          {kit.neighbours.map((n, i) => {
            const t0 = a + 0.3 + i * 0.22, pp = MOTION.pop(T, t0, 0.5), dim = i === 0 ? 1 : 1 - 0.65 * focus * (1 - MOTION.move(T, a + 13.2, a + 13.8) * 0);
            const bob = Math.sin(T * 2.2 + i * 0.9) * 3;
            return (
              <div key={n.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: Math.min(1, MOTION.enter(T, t0, 0.3)) * dim, transform: 'translateY(' + ((1 - pp) * 30) + 'px) scale(' + (0.7 + 0.3 * pp) + ')' }}>
                <div style={{ padding: '10px 22px 4px', background: '#70d070', boxShadow: '0 0 0 4px #3c9a48, 0 0 0 7px ' + K.ink }}><img src={n.url} style={Object.assign({ width: 64, height: 96, transform: 'translateY(' + bob + 'px)' }, PIX)} /></div>
                <div style={{ fontFamily: K.head, fontSize: 34, lineHeight: '36px', color: K.text, borderBottom: '1px solid ' + (i === 0 && focus > 0.5 ? K.accent : 'transparent'), paddingBottom: 4 }}>{n.name}</div>
                <div style={{ fontFamily: K.body, fontSize: 24, color: K.n700, fontFeatureSettings: '"tnum" 1' }}>{n.age}</div>
              </div>
            );
          })}
        </div>
        {focus > 0 && (
          <div style={{ position: 'absolute', left: 500, width: 1280, top: 628, opacity: focus, borderTop: '1px solid ' + K.divider, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 26 }}>
              <Kicker>Andy's Doubts</Kicker>
              <div style={{ fontFamily: K.body, fontSize: 24, color: K.n700 }}>{andy.job}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', columnGap: 48 }}>
              {andy.doubts.map((d, k) => (
                <div key={k} style={Object.assign({ fontFamily: K.body, fontSize: 28, lineHeight: '36px', color: K.text }, rise(T, a + 6.6 + k * 0.5, 16))}>“{d}”</div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- 06 the conversation, played on the plaza ----
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const PHASE = h => h < 6 ? 'Night' : h < 11 ? 'Morning' : h < 15 ? 'Midday' : h < 20 ? 'Evening' : 'Night';
  const ramp = (x, s, e) => clamp((x - s) / (e - s), 0, 1);
  function HudClock({ m, status, hot, o, flash }) {
    const d = Math.min(6, Math.floor(m / 1440)), mm = Math.floor(m % 1440), hh = Math.floor(mm / 60);
    const t = String(hh).padStart(2, '0') + ':' + String(mm % 60).padStart(2, '0');
    return (
      <div style={{ position: 'absolute', left: 10, bottom: 10, opacity: o }}>
        {flash > 0 && <div style={{ position: 'absolute', left: 8, bottom: '100%', marginBottom: 8 + (1 - flash) * 12, whiteSpace: 'nowrap', padding: '2px 10px', background: K.bg, border: '1px solid ' + BAD, fontFamily: K.pix, fontSize: 24, color: BAD, opacity: flash }}>+30 min</div>}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '4px 12px', background: K.bg, border: '1px solid ' + (hot ? BAD : K.divider), borderRadius: '2px', whiteSpace: 'nowrap' }}>
          <span style={{ fontFamily: K.pix, fontSize: 24, color: K.a700, fontFeatureSettings: '"tnum" 1' }}>{DAYS[d].slice(0, 3).toUpperCase()} {t}</span>
          <span style={{ fontFamily: K.body, fontSize: 24, color: K.text }}>{status}</span>
        </div>
      </div>
    );
  }
  // in-game minutes: 4 per real second while walking, frozen in chat, skips between phases
  function talkMin(lt) {
    const r = 4, p1 = 480 + 3.6 * r, p2 = p1 + 30, q = p2 + 3.6 * r, mid = 11 * 60 + 5, tue = 1440 + 16 * 60 + 20;
    if (lt < 3.6) return 480 + Math.max(0, lt) * r;
    if (lt < 16.4) return p1;
    if (lt < 18.4) return p2;
    if (lt < 22.0) return p2 + (lt - 18.4) * r;
    if (lt < 23.0) return lerp(q, mid, Easing.easeInOutCubic((lt - 22.0) / 1.0));
    if (lt < 31.4) return mid;
    if (lt < 32.6) return lerp(mid, tue, Easing.easeInOutCubic((lt - 31.4) / 1.2));
    return tue + (lt - 32.6) * r;
  }
  function Talk({ T, C, kit }) {
    const a = C.Talk, b = C.Demo + 2.5, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (o <= 0) return null;
    const lt = T - a, pz = kit.plaza, ps = 440 / pz.w, enc = kit.andy.enc;
    const wk = MOTION.move(T, a + 0.6, a + 2.8), lx = lerp(22, 76, wk), ly = lerp(124, 92, wk), walking = wk > 0 && wk < 1;
    const lisaSrc = kit.lisaHost[walking ? Math.floor(T * 8) % 2 : 0][0];
    const aBtn = life(T, a + 3.0, a + 6.8, 0.2, 0.3), aS = MOTION.pop(T, a + 3.0, 0.3);
    const out = MOTION.move(T, a + 18.6, a + 20.2), ax = lt >= 22.4 ? 100 : lerp(100, 214, out), aWalk = out > 0 && out < 1 && lt < 22.4;
    const aO = lt < 20.2 ? 1 : lt < 22.4 ? 0 : MOTION.enter(T, a + 22.4, 0.4);
    const andySrc = aWalk && Math.floor(T * 8) % 2 ? kit.andy.f1 : kit.andy.f0;
    const dip = (s0, e0) => lt > s0 && lt < e0 ? Math.sin(Math.PI * (lt - s0) / (e0 - s0)) : 0;
    const shade = Math.max(dip(22.0, 23.0), dip(31.4, 32.6)) * 0.85;
    const pips = [a + 24.3, a + 32.4, a + 32.8], filled = pips.filter(p => T >= p).length;
    const cloud = life(T, a + 16.8, a + 20.2, 0.2, 0.3), cloudS = MOTION.pop(T, a + 16.8, 0.4);
    const booked = lt >= 33.2, tick = booked ? MOTION.pop(T, a + 33.2, 0.4) : 0;
    const qO = lt < 1.0 || cloud > 0 || booked || (lt >= 20.2 && lt < 22.8) ? 0 : 1;
    const flyer = lt >= 32.8 && lt < 33.2 ? lerp((lx + 10) * ps, (ax + 2) * ps, MOTION.move(T, a + 32.8, a + 33.2)) : null;
    const status = lt < 3.6 ? 'Walking' : lt < 16.4 ? 'Paused · in chat' : lt < 18.6 ? 'Backfire' : lt < 22.0 ? 'Walking' : lt < 23.0 ? 'Next phase' : lt < 31.4 ? 'Paused · in chat' : lt < 32.6 ? 'Two chats later' : 'Walking';
    const flash = life(T, a + 16.4, a + 18.2, 0.15, 0.4);
    const pick = lt >= 15.6 && lt < 20.8 ? 2 : lt >= 24.0 ? 0 : -1;
    const panelO = MOTION.enter(T, a + 3.6, 0.5) * (lt < 21.0 ? 1 - MOTION.move(T, a + 20.2, a + 20.7) : MOTION.enter(T, a + 22.6, 0.4));
    const cur = lt < 9.6 ? 0 : lt < 12.0 ? 1 : lt < 20 ? 2 : 0, curOn = MOTION.enter(T, a + 6.9, 0.3);
    const said = pick === 2 ? enc.opts[2].re : pick === 0 ? enc.opts[0].re : enc.open;
    const saidO = pick === 2 ? MOTION.enter(T, a + 15.8, 0.5) : pick === 0 ? MOTION.enter(T, a + 24.2, 0.5) : 1;
    const G = [['✔ Convince · clears a Doubt', K.a700], ['◐ Neutral · true, but off the point', K.n700], ['✘ Backfire · a myth · 30 minutes lost', K.n700]];
    const reveal = [a + 7.6, a + 10.0, a + 12.4];
    const card = life(T, a + 24.6, b + 0.1);
    const head = (ax + 8) * ps, top = 92 * ps;
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
        <Plate x={480} y={180} w={440} h={330}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: 440, height: 330 }}>
            <img src={pz.url} style={Object.assign({ width: 440, height: 330 }, PIX)} />
            <img src={lisaSrc} style={Object.assign({ position: 'absolute', left: lx * ps, top: ly * ps, width: 16 * ps, height: 24 * ps }, PIX)} />
            {aO > 0 && <img src={andySrc} style={Object.assign({ position: 'absolute', left: ax * ps, top: top, width: 16 * ps, height: 24 * ps, opacity: aO, transform: aWalk ? 'none' : 'scaleX(-1)' }, PIX)} />}
            {qO > 0 && filled < 3 && <div style={{ position: 'absolute', left: head, top: top - 32, transform: 'translateX(-50%)', display: 'flex', gap: 4 }}>{Array.from({ length: 3 - filled }, (_, k) => <div key={k} style={{ width: 16, height: 20, background: '#f3ca62', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.pix, fontSize: 16, color: K.ink }}>?</div>)}</div>}
            {cloud > 0 && <div style={{ position: 'absolute', left: head, top: top - 44, padding: '2px 12px', background: '#dcd7cd', boxShadow: '0 0 0 3px ' + K.ink, opacity: cloud, transform: 'translateX(-50%) scale(' + cloudS + ')', transformOrigin: '50% 100%', fontFamily: K.pix, fontSize: 28, lineHeight: '30px', color: K.ink }}>···</div>}
            {tick > 0 && <div style={{ position: 'absolute', left: head - 16, top: top - 42, width: 32, height: 32, transform: 'scale(' + tick + ')', background: '#70d070', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: K.ink }}>✓</div>}
            {flyer != null && <div style={{ position: 'absolute', left: flyer, top: top + 24, width: 18, height: 22, background: K.paper, boxShadow: '0 0 0 3px ' + K.ink }}><div style={{ margin: '4px 3px 0', height: 4, background: K.accent }}></div></div>}
            {aBtn > 0 && <div style={{ position: 'absolute', left: 84 * ps - 18, top: top - 50, width: 36, height: 36, borderRadius: '50%', background: K.bg, border: '3px solid ' + K.n900, opacity: aBtn, transform: 'scale(' + aS + ')', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.head, fontWeight: 600, fontSize: 26, color: K.text }}>A</div>}
            {shade > 0 && <div style={{ position: 'absolute', inset: 0, background: K.ink, opacity: shade }}></div>}
            <div style={{ position: 'absolute', left: 10, top: 10, display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px', background: K.bg, border: '1px solid ' + K.divider, borderRadius: '2px', opacity: MOTION.enter(T, a + 3.4, 0.4) }}>
              <span style={{ fontFamily: K.body, fontSize: 24, color: K.text }}>Andy</span>
              {pips.map((pt, k) => { const f = MOTION.pop(T, pt, 0.4); return <span key={k} style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid ' + K.accent, background: f > 0.5 ? K.accent : 'transparent', transform: 'scale(' + (1 + 0.3 * Math.sin(Math.PI * clamp(f, 0, 1))) + ')' }}></span>; })}
            </div>
            {lt > 33.2 && <div style={{ position: 'absolute', right: 12, top: 10, padding: '4px 12px', background: K.bg, border: '1px solid ' + K.accent, borderRadius: '2px', fontFamily: K.body, fontSize: 24, color: K.a700, transform: 'scale(' + MOTION.pop(T, a + 33.4, 0.4) + ')' }}>Booked</div>}
            <HudClock m={talkMin(lt)} status={status} hot={lt >= 16.4 && lt < 18.6} flash={flash} o={MOTION.enter(T, a + 0.4, 0.4)} />
          </div>
        </Plate>
        <div style={{ position: 'absolute', left: 480, top: 540, width: 440, opacity: card, transform: 'translateY(' + (1 - MOTION.enter(T, a + 24.6, 0.6)) * 30 + 'px)', padding: '14px 20px', boxSizing: 'border-box', background: K.bg, boxShadow: '0 0 0 4px ' + K.accent + ', 0 0 0 8px ' + K.ink, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Kicker>Fact Card · {kit.card.id}</Kicker>
          <div style={{ fontFamily: K.body, fontSize: 22, lineHeight: '29px', color: K.text, textWrap: 'pretty' }}>{kit.card.t}</div>
          <div style={{ fontFamily: K.body, fontSize: 24, color: K.n700, fontStyle: 'italic' }}>{kit.card.s}</div>
        </div>
        {panelO > 0 && (
          <div style={{ position: 'absolute', left: 962, right: 136, top: 180, opacity: panelO, transform: 'translateY(' + (1 - MOTION.enter(T, a + 3.6, 0.6)) * 20 + 'px)', background: K.bg, padding: '22px 32px', boxShadow: WIN().boxShadow }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, minHeight: 96 }}>
              <span style={{ flex: 'none', fontFamily: K.head, fontSize: 32, border: '1px solid ' + K.accent, borderRadius: '2px', padding: '0 12px', color: K.a700 }}>Andy</span>
              <p key={pick} style={{ margin: 0, fontFamily: K.body, fontSize: 24, lineHeight: '32px', color: K.text, opacity: saidO }}>“{said}”</p>
            </div>
            {enc.opts.map((op, k) => {
              const rv = MOTION.enter(T, reveal[k], 0.4), sel = k === pick, dimmed = pick >= 0 && !sel, bad = sel && k === 2;
              return (
                <div key={k} style={{ position: 'relative', display: 'flex', gap: 18, alignItems: 'flex-start', padding: '10px 10px', marginTop: k ? 0 : 8, borderTop: '1px solid ' + K.divider, outline: sel ? '2px solid ' + (bad ? BAD : K.accent) : 'none', background: sel ? (bad ? 'color-mix(in oklab, ' + BAD + ' 14%, ' + K.bg + ')' : K.a100) : 'transparent', opacity: dimmed ? 0.4 : 1 }}>
                  <span style={{ flex: 'none', width: 28, fontSize: 26, lineHeight: '34px', color: K.accent, opacity: cur === k && pick < 0 ? curOn : 0 }}>▸</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ margin: 0, fontFamily: K.body, fontSize: 24, lineHeight: '30px', color: K.text, textWrap: 'pretty' }}>“{op.t}”</p>
                    <div style={{ fontFamily: K.body, fontSize: 24, letterSpacing: '0.06em', textTransform: 'uppercase', color: bad ? BAD : G[k][1], opacity: rv, transform: 'translateX(' + (1 - rv) * -12 + 'px)', height: rv > 0 ? 'auto' : 0 }}>{G[k][0]}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---- 09 live demo: Lisa jumps into the real game and convinces Dinesh, all three Doubts ----
  const DW = { x: 440, y: 150, w: 1384, h: 650 }, PB = { w: 1168, h: 784 }, D_IN = 3.9;
  const DEMO_CUTS = ['', 'Monday night \u00b7 Blk 5 void deck', 'Tuesday evening \u00b7 Hawker Centre'];
  let DKIT = null;
  const pS = z => lerp(Math.min(DW.w / PB.w, DW.h / PB.h), 1080 / PB.h, z);
  const toScr = (px, py, z) => { const s = pS(z), cx = lerp(DW.x + DW.w / 2, 960, z), cy = lerp(DW.y + DW.h / 2, 540, z); return { x: cx - PB.w / 2 * s + (8 + px) * s, y: cy - PB.h / 2 * s + (8 + py) * s, s }; };
  function demoCover(T, C) { return C.Demo == null ? 0 : MOTION.enter(T, C.Demo + 3.0, 0.4) * (1 - MOTION.move(T, C.Week - 4.4, C.Week - 4.0)); }
  function demoCrouch(T, C) { const u = T - (C.Demo + 1.95); return u > 0 && u < 0.25 ? 1 - 0.16 * Math.sin(Math.PI * u / 0.25) : 1; }
  // host Lisa's leap into the game and back out; false while she is inside it
  function demoLeap(T, C, hcx, hb, hw) {
    const sim = DKIT && DKIT.demoSim;
    if (C.Demo == null || !sim) return null;
    const t0 = C.Demo + 2.2, t1 = C.Week - 3.3;
    if (T < t0 || T >= t1 + 1.0) return null;
    const inU = (T - t0) / 0.9, outU = (T - t1) / 1.0;
    if (inU >= 1 && outU < 0) return false;
    const tgt = L => { const q = toScr(L.x, L.feet, 0); return { cx: q.x, b: q.y, w: L.sc * 22 * q.s }; };
    const H = { cx: hcx, b: hb, w: hw };
    const [A, B, p] = inU < 1 ? [H, tgt(sim.startLisa), inU] : [tgt(sim.endLisa), H, outU];
    const k = Easing.easeInOutSine(clamp(p, 0, 1));
    return { cx: lerp(A.cx, B.cx, k), b: lerp(A.b, B.b, k) - Math.sin(Math.PI * k) * 300, w: lerp(A.w, B.w, k) };
  }
  // the game's own frame and HTML overlay, at its native 1152x768
  function GamePanel({ fr }) {
    const u = fr.ui || {}, on = v => v === 'none' ? 'none' : v, box = { background: 'var(--color-surface)', border: '2px solid var(--color-neutral-900)', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' };
    return (
      <div style={{ position: 'relative', boxSizing: 'border-box', width: PB.w, height: PB.h, border: '8px solid var(--color-surface)', outline: '1px solid ' + (u.frameRule || 'rgba(236,228,214,0.18)'), boxShadow: 'var(--shadow-sm)', background: '#1a1c28', overflow: 'hidden', color: 'var(--color-text)', fontFamily: 'var(--font-body)', '--font-heading': "'Pixelify Sans', ui-monospace, monospace" }}>
        <img src={fr.url} style={Object.assign({ position: 'absolute', left: 0, top: 0, width: 1152, height: 768 }, PIX)} />
        <div style={Object.assign({ position: 'absolute', left: 10, top: 10, display: on(u.worldHudOn), flexDirection: 'column', gap: 4, padding: '6px 10px' }, box)}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, whiteSpace: 'nowrap' }}><span style={{ fontFamily: 'var(--font-heading)', fontSize: 20, lineHeight: 1 }}>{u.dayLabel}</span><span style={{ fontSize: 12, fontFeatureSettings: '"tnum" 1', color: 'var(--color-neutral-700)' }}>{u.clockLabel} · {u.phaseLabel}</span></div>
          <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-accent-700)', whiteSpace: 'nowrap' }}>{u.countdown}</div>
        </div>
        <div style={Object.assign({ position: 'absolute', right: 10, top: 10, display: on(u.worldHudOn), alignItems: 'baseline', gap: 8, padding: '6px 12px' }, box)}>
          <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>Booked</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, lineHeight: 1, fontFeatureSettings: '"tnum" 1', color: 'var(--color-accent-700)' }}>{u.booked}<span style={{ color: 'var(--color-neutral-600)' }}>/{u.total}</span></span>
        </div>
        <div style={Object.assign({ position: 'absolute', right: 10, top: 54, display: on(u.worldHudOn), alignItems: 'center', gap: 7, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 11px', color: 'var(--color-accent-700)' }, box)}>Missions <span style={{ fontFeatureSettings: '"tnum" 1' }}>{u.missionsLabel}</span></div>
        <div style={{ position: 'absolute', left: 10, bottom: 10, display: on(u.zoneOn), fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'var(--color-surface)', border: '2px solid var(--color-neutral-900)', borderRadius: 'var(--radius-sm)', padding: '4px 10px' }}>{u.zoneName}</div>
        <div style={{ position: 'absolute', right: 10, bottom: 10, maxWidth: '52%', display: on(u.hintOn), fontSize: 12, lineHeight: 1.4, background: 'var(--color-surface)', border: '2px solid var(--color-neutral-900)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', color: u.hintInk }}>{u.hint}</div>
        <div style={{ position: 'absolute', left: 12, right: 12, bottom: 12, display: on(u.dlgOn), flexDirection: 'column', background: 'var(--color-surface)', border: '3px solid var(--color-neutral-900)', borderRadius: 'var(--radius-md)', padding: '14px 20px 12px', boxShadow: 'var(--shadow-md)', maxHeight: '78%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {fr.port ? <img src={fr.port} style={Object.assign({ flex: 'none', width: 112, height: 98, border: '2px solid var(--color-neutral-900)', borderRadius: 'var(--radius-sm)', background: '#f4ecd8' }, PIX)} /> : <div style={{ flex: 'none', width: 112, height: 98 }}></div>}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ flex: 'none', whiteSpace: 'nowrap', fontFamily: 'var(--font-heading)', fontSize: 20, lineHeight: 1.2, border: '1px solid var(--color-accent)', borderRadius: 'var(--radius-sm)', padding: '2px 10px', color: 'var(--color-accent-700)' }}>{u.speaker}</span>
                <span style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-neutral-700)' }}>{u.encWhere}</span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.5, margin: '10px 0 0', fontStyle: 'italic', textWrap: 'pretty' }}>{u.openLine}</p>
            </div>
          </div>
          <div style={{ display: on(u.optsOn), flexDirection: 'column', marginTop: 10, borderTop: '1px solid var(--color-divider)' }}>
            {(u.opts || []).map((o, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 8px', borderBottom: '1px solid var(--color-divider)', background: o.bg }}>
                <span style={{ flex: 'none', width: 14, fontSize: 15, color: 'var(--color-accent)' }}>{o.cur}</span>
                <p style={{ fontSize: 14, lineHeight: 1.45, margin: 0, textWrap: 'pretty' }}>{o.t}</p>
              </div>
            ))}
          </div>
          <div style={{ display: on(u.reactOn), flexDirection: 'column', gap: 8, marginTop: 10, borderTop: '1px solid var(--color-divider)', paddingTop: 10 }}>
            <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: u.gradeInk }}>{u.gradeLabel}</div>
            <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0, fontStyle: 'italic', textWrap: 'pretty' }}>{u.reactLine}</p>
            <p style={{ display: on(u.lisaOn), fontSize: 14, lineHeight: 1.5, margin: 0, textWrap: 'pretty' }}><span style={{ color: 'var(--color-accent-700)' }}>Lisa:</span> {u.lisaLine}</p>
            <div style={{ display: on(u.whyOn), fontSize: 12, lineHeight: 1.4, color: 'var(--color-neutral-700)' }}>{u.why}</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--color-neutral-700)' }}>Enter to continue</span>
              <span className="btn btn-primary" style={{ fontSize: 13, padding: '6px 14px' }}>Continue ▸</span>
            </div>
          </div>
        </div>
        {fr.fade > 0 && <div style={{ position: 'absolute', inset: 0, background: '#0c0d14', opacity: fr.fade }}></div>}
        {fr.fade > 0.5 && fr.cut > 0 && <div style={{ position: 'absolute', left: 0, right: 0, top: 360, textAlign: 'center', fontFamily: "'Pixelify Sans', monospace", fontSize: 28, color: '#ece4d6', opacity: (fr.fade - 0.5) * 2 }}>{DEMO_CUTS[fr.cut]}</div>}
      </div>
    );
  }
  function Demo({ T, C, kit }) {
    const a = C.Demo, W = C.Week, sim = kit.demoSim;
    DKIT = kit;
    if (a == null || !sim || T < a + 2.2 || T > W - 2.8) return null;
    const lt = T - a, t1 = W - 3.3;
    const fr = sim(Math.max(0, lt - D_IN), lt < 3.1 || T >= t1);
    const vis = MOTION.enter(T, a + 2.2, 0.3) * (1 - MOTION.move(T, W - 3.2, W - 2.8));
    const z = MOTION.move(T, a + 3.1, a + 3.9) - MOTION.move(T, W - 4.2, W - 3.4);
    const q = toScr(-8, -8, z);
    return (
      <React.Fragment>
        <div style={{ position: 'absolute', inset: 0, background: '#3c4152', opacity: z * vis }}></div>
        <div style={{ position: 'absolute', left: q.x, top: q.y, width: PB.w, height: PB.h, transform: 'scale(' + q.s + ')', transformOrigin: '0 0', opacity: vis }}><GamePanel fr={fr} /></div>
      </React.Fragment>
    );
  }

  // ---- 08 side games, played live ----
  const GAMES = [
    { id: 'mrt', at: 4, pre: 1.2, n: 'MRT · Tenang line', w: 'Wilson', m: 'Capacity comes and goes. A donee stands in only while you can’t.', r: ['Five stations, Ketapang to Tenang.', 'Every stop the seats go back in play. No seat when the doors shut and you are out.', 'Give the priority seat to someone who needs it.'] },
    { id: 'chope', at: 13, pre: 0.6, n: 'Hawker Centre · chope', w: 'Mei Ling', m: 'Sign while you still have capacity. After that it’s too late.', r: ['Music on: circle the tables.', 'Music stops: first to a table drops a tissue packet.', 'One table fewer each round, five rounds.'] },
    { id: 'chop', at: 22, pre: 0.4, n: 'Chicken rice · chop to order', w: 'Hafiz', m: 'Your donee divides your money by your rules, not theirs.', r: ['Slide the cleaver and cut the order into pieces.', 'Even pieces score higher. Cutting through bone costs time.', 'Graded A to D, with tips.'] },
    { id: 'tray', at: 31, pre: 7, n: 'Hawker Centre · tray return', w: 'Nadia', m: 'Make the plan in time, and tell the people who’ll need it.', r: ['Remind diners to clear up as their plate empties.', 'Ask too early and they forget.', 'Carry loose trays to a trolley before the crow dives.'] },
    { id: 'fishing', sim: 'fishGag', at: 40, pre: 0.4, n: 'Fishing · Tenang jetty', w: 'Fauzi', m: 'Nobody signs under pressure. Ease off and let them decide.', r: ['A and D walk the deck; W and S cast in and out.', 'Hold the float on the ripples until she bites.', 'Hold S to reel. Let go when she runs, or the line snaps.'] }
  ];
  function Games({ T, C, kit }) {
    const a = C.Games, b = C.Sports, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (o <= 0) return null;
    const lt = T - a;
    const gi = GAMES.reduce((acc, g, i) => (lt >= g.at ? i : acc), -1);
    const g = gi >= 0 ? GAMES[gi] : GAMES[0];
    const sports = false;
    const plateOn = MOTION.enter(T, a + 2.2, 0.8) * (1 - MOTION.move(T, b - 0.6, b));
    const pre = g.id === 'fishing' && kit.fishGag ? kit.fishGag.t - (GAG_AT - g.at) : g.pre;
    const simT = gi >= 0 ? lt - g.at + pre : lt - 2.2 + pre - 1.8;
    const fr = plateOn > 0 ? kit.sims[g.sim || g.id](Math.max(0, simT)) : null;
    const gs = gi >= 0 ? g.at : 0, ge = gi >= 0 && gi < GAMES.length - 1 ? GAMES[gi + 1].at : b - a;
    const colO = gi >= 0 && !sports ? Math.min(MOTION.enter(T, a + gs, 0.5), 1 - MOTION.move(T, a + ge - 0.3, a + ge)) : 0;
    const introO = life(T, a + 0.3, a + 4.0);
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
        {introO > 0 && (
          <div style={{ position: 'absolute', left: 490, top: 196, width: 380, opacity: introO, display: 'flex', flexDirection: 'column', gap: 22 }}>
            <Kicker>Around town</Kicker>
            <div style={{ fontFamily: K.head, fontSize: 80, lineHeight: '80px', color: K.text }}>Play first</div>
            <div style={{ fontFamily: K.body, fontSize: 26, lineHeight: '38px', color: K.n700 }}>Five neighbours play one game with Lisa before the first Doubt. Its rule is the first Fact Card.</div>
          </div>
        )}
        {colO > 0 && (
          <div key={g.id} style={{ position: 'absolute', left: 490, top: 196, width: 380, opacity: colO, display: 'flex', flexDirection: 'column', gap: 22 }}>
            <Kicker style={rise(T, a + gs + 0.1, 12)}>{String(gi + 1).padStart(2, '0')} / {String(GAMES.length).padStart(2, '0')} · with {g.w}</Kicker>
            <div style={Object.assign({ fontFamily: K.head, fontSize: 52, lineHeight: '56px', color: K.text }, rise(T, a + gs + 0.25, 20))}>{g.n}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, borderTop: '1px solid ' + K.divider, paddingTop: 18 }}>
              {g.r.map((r, k) => <div key={k} style={Object.assign({ fontFamily: K.body, fontSize: 24, lineHeight: '34px', color: K.text, textWrap: 'pretty', display: 'flex', gap: 10 }, rise(T, a + gs + 0.6 + k * 0.5, 12))}><span style={{ color: K.accent }}>•</span><span>{r}</span></div>)}
            </div>
            <div style={Object.assign({ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid ' + K.divider, paddingTop: 18 }, rise(T, a + gs + 2.4, 12))}>
              <Kicker>The LPA point</Kicker>
              <div style={{ fontFamily: K.head, fontStyle: 'italic', fontSize: 32, lineHeight: '38px', color: K.a700, textWrap: 'pretty' }}>{g.m}</div>
            </div>
          </div>
        )}
        {plateOn > 0 && fr && (
          <React.Fragment>
            <Plate x={912} y={176} w={864} h={576} opacity={plateOn}>
              <img src={fr.url} style={Object.assign({ width: 864, height: 576, transform: 'scale(' + (1 + 0.02 * ((lt - gs) / 9)) + ')' }, PIX)} />
            </Plate>
            <div style={{ position: 'absolute', left: 912, width: 864, top: 766, display: 'flex', justifyContent: 'space-between', gap: 20, opacity: plateOn * (gi >= 0 ? 1 : 0), fontFamily: K.body, fontSize: 24, color: K.n700 }}>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic' }}>{fr.hud ? fr.hud.msg : ''}</span>
              <span style={{ flex: 'none', letterSpacing: '0.08em', textTransform: 'uppercase', color: K.a700 }}>Live play</span>
            </div>
          </React.Fragment>
        )}
      </div>
    );
  }

  // ---- 08 the week: one day on the plaza, news, pace ----
  function Week({ T, C, kit }) {
    const a = C.Week, b = C.Games, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (o <= 0) return null;
    const lt = T - a, p1 = life(T, a, a + 12.0, 0.5, 0.4), p2 = life(T, a + 12.0, b + 0.1, 0.5, 0.4);
    const andy = kit.neighbours[0], pz = kit.plaza, ps = 440 / pz.w;
    const wm = 360 + clamp(lt - 1.0, 0, 10.8) * 1440 / 10.8, hr = (wm % 1440) / 60;
    const ph = lt < 1.0 ? -1 : kit.andyPhase.findIndex(p => p[0] === PHASE(Math.floor(hr)));
    const goOut = ramp(hr, 15, 16.5), back = ramp(hr, 20, 21.5), ax = lerp(100, 214, goOut - back);
    const aWalk = (goOut > 0 && goOut < 1) || (back > 0 && back < 1);
    const andySrc = aWalk && Math.floor(T * 8) % 2 ? kit.andy.f1 : kit.andy.f0;
    const eve = ramp(hr, 14, 16) * (1 - ramp(hr, 18, 20)), night = hr >= 12 ? ramp(hr, 18, 20.5) : 1 - ramp(hr, 5, 7);
    const news = [['Wednesday evening', 'Uncle Tan collapses at the plaza. No LPA, so the family needs a court order.'], ['Friday night', 'Ah Gong\u2019s deputyship papers. \u201cWe never knew what Pa wanted.\u201d'], ['Any night', 'Lisa\u2019s bed at home skips to the next morning.']];
    const pace = [['Kampung', 'Notebook hints in dialogue. A backfire costs no time.'], ['Heartland', 'The standard game. Hints off; a backfire costs thirty minutes.'], ['Kiasu', 'Five-minute days, and a Fate Event on Thursday: one unbooked neighbour loses capacity.']];
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
        {p1 > 0 && (
          <div style={{ position: 'absolute', inset: 0, opacity: p1 }}>
            <Plate x={490} y={196} w={440} h={330} opacity={MOTION.enter(T, a + 0.2, 0.5)}>
              <img src={pz.url} style={Object.assign({ width: 440, height: 330 }, PIX)} />
              <img src={andySrc} style={Object.assign({ position: 'absolute', left: ax * ps, top: 92 * ps, width: 16 * ps, height: 24 * ps, transform: back > 0 && back < 1 ? 'scaleX(-1)' : 'none' }, PIX)} />
              <div style={{ position: 'absolute', inset: 0, background: '#e0782f', opacity: eve * 0.24 }}></div>
              <div style={{ position: 'absolute', inset: 0, background: '#1c2150', opacity: night * 0.55 }}></div>
              <HudClock m={wm} status="1 day = 6 real min" o={MOTION.enter(T, a + 0.6, 0.4)} />
            </Plate>
            <div style={Object.assign({ position: 'absolute', left: 490, top: 550, width: 440, fontFamily: K.head, fontSize: 36, lineHeight: '40px', color: K.text }, rise(T, a + 0.6, 12))}>Andy, {andy.age}</div>
            <div style={{ position: 'absolute', left: 986, right: 146, top: 196, display: 'flex', flexDirection: 'column', gap: 22 }}>
              <div style={rise(T, a + 0.2)}><Kicker>A day in Tenang</Kicker></div>
              <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 64, lineHeight: '68px', color: K.text }, rise(T, a + 0.4, 24))}>Everyone keeps a routine</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: 18, marginTop: 6 }}>
                {kit.andyPhase.map((p, i) => {
                  const on = i === ph;
                  return (
                    <div key={p[0]} style={Object.assign({ padding: '16px 18px', minHeight: 118, boxSizing: 'border-box', border: '1px solid ' + (on ? K.accent : K.divider), background: on ? K.a100 : 'transparent', display: 'flex', flexDirection: 'column', gap: 6 }, rise(T, a + 0.8 + i * 0.2, 14))}>
                      <div style={{ fontFamily: K.head, fontSize: 36, lineHeight: '40px', color: K.text }}>{p[0]}</div>
                      <div style={{ fontFamily: K.body, fontSize: 24, lineHeight: '30px', color: on ? K.a700 : K.n700 }}>{p[1]}</div>
                    </div>
                  );
                })}
              </div>
              <div style={Object.assign({ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid ' + K.divider, paddingTop: 18 }, rise(T, a + 6.6, 14))}>
                <Kicker>Lisa's Notebook</Kicker>
                <div style={{ fontFamily: K.body, fontSize: 28, lineHeight: '38px', color: K.text }}>Hint · seen at the Sports Hall gym in the mornings.</div>
              </div>
            </div>
          </div>
        )}
        {p2 > 0 && (
          <div style={{ position: 'absolute', left: 490, right: 146, top: 196, opacity: p2, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', columnGap: 56 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={rise(T, a + 12.2)}><Kicker>Around the week</Kicker></div>
              <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 52, lineHeight: '56px', color: K.text }, rise(T, a + 12.4, 20))}>News of its own</div>
              {news.map((n, i) => (
                <div key={n[0]} style={Object.assign({ borderTop: '1px solid ' + K.divider, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }, rise(T, a + 12.8 + i * 0.5, 14))}>
                  <div style={{ fontFamily: K.pix, fontSize: 24, textTransform: 'uppercase', color: K.a700 }}>{n[0]}</div>
                  <div style={{ fontFamily: K.body, fontSize: 26, lineHeight: '34px', color: K.text, textWrap: 'pretty' }}>{n[1]}</div>
                </div>
              ))}
            </div>
            <div style={{ background: K.divider, transform: 'scaleY(' + MOTION.move(T, a + 12.4, a + 13.4) + ')', transformOrigin: 'top' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={rise(T, a + 17.8)}><Kicker>Pace · chosen on the title screen</Kicker></div>
              <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 52, lineHeight: '56px', color: K.text }, rise(T, a + 18.0, 20))}>Three ways to play</div>
              {pace.map((p, i) => (
                <div key={p[0]} style={Object.assign({ borderTop: '1px solid ' + (i === 1 ? K.accent : K.divider), paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }, rise(T, a + 18.4 + i * 0.6, 14))}>
                  <div style={{ fontFamily: K.head, fontSize: 36, lineHeight: '40px', color: K.text }}>{p[0]}{i === 1 ? <span style={{ fontFamily: K.body, fontSize: 24, color: K.a700 }}> · default</span> : null}</div>
                  <div style={{ fontFamily: K.body, fontSize: 26, lineHeight: '34px', color: K.text, textWrap: 'pretty' }}>{p[1]}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- 10 sport, played live by the game's own match code ----
  const SPORTS_V = [
    { id: 'football', at: 3, pre: 2.2, n: 'Football · school field', us: 'Lisa + 2', them: 'Aidil + 2', r: ['Three a side, first to three goals.', 'WASD moves Lisa. Reach the ball and she plays it.', 'Aidil keeps a ball on the field after school.'] },
    { id: 'basketball', at: 11, pre: 1.5, n: 'Basketball · sports hall', us: 'Lisa + 2', them: 'The regulars', r: ['Three a side, first to twelve.', 'Twos inside the arc, threes from outside it.', 'Drive to the hoop and Lisa shoots on her own.'] },
    { id: 'badminton', at: 19, pre: 1.0, n: 'Badminton · court 1', us: 'Lisa + 1', them: 'Court 1 pair', r: ['Doubles, first to eleven.', 'Get under the shuttle and Lisa clears the net.', 'Let it land on your side and the point goes over.'] }
  ];
  const SP_RULE = { football: 'Three a side · first to three', basketball: 'Three a side · first to twelve', badminton: 'Doubles · first to eleven' };
  function Sports({ T, C, kit }) {
    const a = C.Sports, b = C.Recap, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (o <= 0) return null;
    const lt = T - a, PW = 408, PH = 272, GAP = 31, PY = 318;
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
        <div style={Object.assign({ position: 'absolute', left: 490, top: 176, width: 1286, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }, rise(T, a + 0.3, 16))}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <Kicker>Around town</Kicker>
            <div style={{ fontFamily: K.head, fontSize: 80, lineHeight: '80px', color: K.text }}>Sport</div>
          </div>
          <div style={{ width: 560, display: 'flex', flexDirection: 'column', gap: 6 }}><span style={{ fontFamily: K.body, fontSize: 20, letterSpacing: '0.08em', textTransform: 'uppercase', color: K.a700 }}>Live play · all three courts</span><div style={{ fontFamily: K.body, fontSize: 26, lineHeight: '38px', color: K.n700, textWrap: 'pretty' }}>Step into a glowing marker and press Enter. WASD is the only control.</div></div>
        </div>
        {SPORTS_V.map((g, k) => {
          const t0 = 1.0 + k * 0.45, x = 490 + k * (PW + GAP);
          const on = MOTION.enter(T, a + t0, 0.6) * (1 - MOTION.move(T, b - 0.6, b));
          if (on <= 0) return null;
          const fr = kit.sims[g.id](Math.max(0, lt - t0 + g.pre)), hud = (fr && fr.hud) || {};
          return (
            <React.Fragment key={g.id}>
              <Plate x={x} y={PY} w={PW} h={PH} opacity={on}>
                {fr && <img src={fr.url} style={Object.assign({ width: PW, height: PH }, PIX)} />}
              </Plate>
              <div style={{ position: 'absolute', left: x, top: PY + PH + 18, width: PW, opacity: on, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontFamily: K.head, fontSize: 36, lineHeight: '40px', color: K.text }}>{g.n.split(' · ')[0]}</span>
                  <span style={{ fontFamily: K.head, fontSize: 36, lineHeight: '40px', color: K.text, fontFeatureSettings: '"tnum" 1' }}>{hud.a || 0} – {hud.b || 0}</span>
                </div>
                <div style={{ borderTop: '1px solid ' + K.divider, paddingTop: 8, fontFamily: K.body, fontSize: 22, lineHeight: '30px', color: K.n700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{SP_RULE[g.id]}</div>
                <div style={{ fontFamily: K.body, fontSize: 22, lineHeight: '30px', color: K.n700, fontStyle: 'italic', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minHeight: 30 }}>{hud.msg || ''}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // ---- diagram kit: nodes, decision diamonds, drawn arrows ----
  const BAD = '#c85a48';
  const DIA = { position: 'absolute', left: 490, top: 186, width: 1284, height: 600 };
  function FNode({ T, at, x, y, w, h, t, s, hl, col, center }) {
    const o = MOTION.enter(T, at, 0.3), p = MOTION.pop(T, at, 0.45);
    if (o <= 0) return null;
    const c = col || K.accent;
    return (
      <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box', padding: '12px 16px', opacity: o, transform: 'scale(' + (0.8 + 0.2 * p) + ')', background: hl ? K.a100 : K.paper, border: '3px solid ' + (hl ? c : K.ink), boxShadow: hl ? '0 0 0 3px ' + c + ', 6px 6px 0 3px rgba(44,42,58,0.18)' : '6px 6px 0 0 rgba(44,42,58,0.14)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: center ? 'center' : 'flex-start', textAlign: center ? 'center' : 'left', gap: 4 }}>
        <div style={{ fontFamily: K.head, fontWeight: 600, fontSize: 32, lineHeight: '36px', color: col && col !== K.accent ? col : K.text }}>{t}</div>
        {s && <div style={{ fontFamily: K.body, fontSize: 24, lineHeight: '28px', color: hl ? K.text : K.n700, textWrap: 'pretty' }}>{s}</div>}
      </div>
    );
  }
  function Diamond({ T, at, cx, cy, w, h, t, s, hl }) {
    const o = MOTION.enter(T, at, 0.3), p = MOTION.pop(T, at, 0.45);
    if (o <= 0) return null;
    const pts = (w / 2) + ',3 ' + (w - 3) + ',' + (h / 2) + ' ' + (w / 2) + ',' + (h - 3) + ' 3,' + (h / 2);
    return (
      <div style={{ position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, opacity: o, transform: 'scale(' + (0.8 + 0.2 * p) + ')' }}>
        <svg width={w} height={h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          <polygon points={pts} fill={hl ? '#f3dfb4' : K.paper} stroke={hl ? K.accent : K.ink} strokeWidth={hl ? 5 : 3} strokeLinejoin="miter" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 2 }}>
          <div style={{ fontFamily: K.head, fontWeight: 600, fontSize: 30, lineHeight: '32px', color: K.text }}>{t}</div>
          {s && <div style={{ fontFamily: K.body, fontSize: 24, lineHeight: '26px', color: K.n700 }}>{s}</div>}
        </div>
      </div>
    );
  }
  function Arrows({ T, list }) {
    return (
      <svg width="1284" height="600" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
        {list.map((r, i) => {
          const p = MOTION.move(T, r.at, r.at + (r.d || 0.6));
          if (p <= 0) return null;
          const n = r.pts.length, e = r.pts[n - 1], q = r.pts[n - 2], ang = Math.atan2(e[1] - q[1], e[0] - q[0]) * 180 / Math.PI;
          const c = r.hl ? (r.col || K.accent) : K.ink;
          return (
            <g key={i}>
              <polyline points={r.pts.map(v => v.join(',')).join(' ')} fill="none" stroke={c} strokeWidth={r.hl ? 5 : 3} strokeLinejoin="miter" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - p} />
              {r.head !== false && <polygon points="2,0 -14,-9 -14,9" fill={c} transform={'translate(' + e[0] + ',' + e[1] + ') rotate(' + ang + ')'} opacity={p > 0.97 ? 1 : 0} />}
            </g>
          );
        })}
      </svg>
    );
  }
  const FLabel = ({ T, at, x, y, children, col }) => {
    const o = MOTION.enter(T, at, 0.4);
    return o > 0 ? <div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%,-50%)', opacity: o, whiteSpace: 'nowrap', padding: '2px 12px', background: K.bg, fontFamily: K.body, fontSize: 24, lineHeight: '30px', color: col || K.a700 }}>{children}</div> : null;
  };

  // ---- 04 the whole game as one flow ----
  function Plan({ T, C, kit }) {
    const a = C.Plan, b = C.Town, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (o <= 0) return null;
    const lt = T - a, on = (s, e) => lt >= s && lt < e;
    const X = i => Math.round(i * 268.5), NW = 210;
    const N = [
      ['Explore', 'Find someone not booked', 3.8, [3.6, 5.6]],
      ['Play', 'Their game, if they ask', 4.4, [5.6, 8.6]],
      ['Talk', 'One Doubt per chat · ×3', 5.0, [8.6, 14.0]],
      ['Flyer', 'Handed over after Doubt 3', 5.6, [14.0, 15.8]],
      ['Booked', 'Name on the CC board', 6.2, [15.8, 17.2]]
    ];
    const arrows = N.slice(1).map((n, i) => ({ pts: [[X(i) + NW, 225], [X(i + 1), 225]], at: a + n[2] - 0.35, d: 0.35, hl: on(n[3][0], n[3][1]) }));
    arrows.push({ pts: [[X(4) + 105, 150], [X(4) + 105, 84], [X(1) + 105, 84], [X(1) + 105, 150]], at: a + 17.2, d: 1.1, hl: on(17.2, 20.4) });
    // the live demo lane: mini Lisa walks the steps with a neighbour
    const path = (keys) => { if (lt <= keys[0][0]) return keys[0][1]; for (let i = 1; i < keys.length; i++) if (lt < keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], (lt - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0])); return keys[keys.length - 1][1]; };
    const LK = [[3.6, -30], [5.6, X(1) + 20], [7.4, X(1) + 130], [8.6, X(2) + 50], [14.0, X(2) + 50], [14.8, X(3) + 50], [17.4, X(3) + 50], [19.8, X(1) + 60]];
    const NK = [[0, X(2) + 130], [14.0, X(2) + 130], [14.8, X(3) + 130], [15.8, X(3) + 130], [16.6, X(4) + 110]];
    const lx = path(LK), nx = path(NK), lx2 = path(LK.map(k => [k[0] + 0.05, k[1]]));
    const lWalk = Math.abs(lx2 - lx) > 0.01, nWalk = (lt > 14.0 && lt < 14.8) || (lt > 15.8 && lt < 16.6);
    const lBack = lt > 17.4 && lt < 19.8, talking = lt > 8.8 && lt < 13.6;
    const lisaF = kit.lisaHost[lWalk ? Math.floor(T * 8) % 2 : 0][talking ? [1, 2, 1, 0][Math.floor(T * 9) % 4] : 0];
    const laneO = MOTION.enter(T, a + 3.4, 0.5), nO = MOTION.enter(T, a + 5.0, 0.5);
    const GY = 336, SW = 48, SH = 72, nBob = nWalk ? Math.round(Math.sin(T * 16)) * 3 : 0;
    const doubts = lt < 7.4 || lt > 13.4 ? 0 : 3 - [10.0, 11.6, 13.2].filter(t => lt >= t).length;
    const bang = life(T, a + 7.4, a + 8.4, 0.15, 0.25), bangS = MOTION.pop(T, a + 7.4, 0.3);
    const flyer = lt < 14.9 ? null : lt < 15.4 ? lerp(lx + 36, nx + 8, MOTION.move(T, a + 14.9, a + 15.4)) : lt < 16.6 ? nx + 8 : null;
    const tick = lt >= 16.6 ? MOTION.pop(T, a + 16.6, 0.4) : 0;
    const dots = talking ? '···'.slice(0, 1 + Math.floor(T * 3) % 3) : '';
    arrows.push({ pts: [[880, 520], [930, 520]], at: a + 22.4, d: 0.3, hl: lt >= 22.4 });
    const tl = MOTION.enter(T, a + 20.4, 0.5), mk = MOTION.move(T, a + 20.8, a + 22.4);
    return (
      <div style={Object.assign({}, DIA, { opacity: o })}>
        <div style={rise(T, a + 0.3)}><Kicker>How the game works</Kicker></div>
        {N.map((n, i) => <FNode key={n[0]} T={T} at={a + n[2]} x={X(i)} y={150} w={NW} h={150} t={n[0]} s={n[1]} hl={on(n[3][0], n[3][1])} />)}
        <Arrows T={T} list={arrows} />
        <FLabel T={T} at={a + 17.8} x={(X(1) + X(4)) / 2 + 105} y={84}>Next neighbour · up to twelve</FLabel>
        {laneO > 0 && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1284, height: 430, opacity: laneO, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: GY + SH + 2, height: 3, background: K.n300 }}></div>
            <div style={{ position: 'absolute', left: X(4) + 160, top: GY + 22, width: 44, height: 36, background: '#8a5a30', boxShadow: '0 0 0 3px ' + K.ink }}><div style={{ margin: '6px auto 0', width: 30, height: 18, background: K.paper }}></div></div>
            <div style={{ position: 'absolute', left: X(4) + 179, top: GY + 58, width: 6, height: 20, background: K.ink }}></div>
            {nO > 0 && <img src={kit.andy.f0} style={Object.assign({ position: 'absolute', left: nx, top: GY + nBob, width: SW, height: SH, opacity: nO, transform: nWalk ? 'none' : 'scaleX(-1)' }, PIX)} />}
            <img src={lisaF} style={Object.assign({ position: 'absolute', left: lx, top: GY, width: SW, height: SH, transform: lBack ? 'scaleX(-1)' : 'none' }, PIX)} />
            {doubts > 0 && <div style={{ position: 'absolute', left: nx + SW / 2, top: GY - 44, transform: 'translateX(-50%)', display: 'flex', gap: 6 }}>{Array.from({ length: doubts }, (_, k) => <div key={k} style={{ width: 20, height: 26, background: '#f3ca62', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.pix, fontSize: 18, color: K.ink }}>?</div>)}</div>}
            {bang > 0 && <div style={{ position: 'absolute', left: lx + SW / 2 - 14, top: GY - 46, width: 28, height: 34, opacity: bang, transform: 'scale(' + bangS + ')', transformOrigin: '50% 100%', background: K.paper, boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.pix, fontSize: 24, color: K.a700 }}>!</div>}
            {dots && <div style={{ position: 'absolute', left: lx + SW / 2 - 24, top: GY - 42, width: 48, height: 28, background: K.paper, boxShadow: '0 0 0 3px ' + K.ink, fontFamily: K.pix, fontSize: 20, lineHeight: '24px', textAlign: 'center', color: K.ink }}>{dots}</div>}
            {flyer != null && <div style={{ position: 'absolute', left: flyer, top: GY + 30, width: 18, height: 22, background: K.paper, boxShadow: '0 0 0 3px ' + K.ink }}><div style={{ margin: '4px 3px 0', height: 4, background: K.accent }}></div></div>}
            {tick > 0 && <div style={{ position: 'absolute', left: nx + SW / 2 - 16, top: GY - 44, width: 32, height: 32, transform: 'scale(' + tick + ')', background: '#70d070', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: K.ink }}>✓</div>}
          </div>
        )}
        {tl > 0 && (
          <div style={{ position: 'absolute', left: 0, top: 440, width: 880, height: 150, opacity: tl }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 80, height: 3, background: K.ink }}></div>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d, i) => (
              <div key={d} style={{ position: 'absolute', left: i * 880 / 7, top: 30, width: 880 / 7, height: 62, borderLeft: '3px solid ' + K.ink, paddingLeft: 10, boxSizing: 'border-box', fontFamily: K.pix, fontSize: 24, color: i === 6 ? K.a700 : K.n700 }}>{d}</div>
            ))}
            <div style={{ position: 'absolute', left: mk * 880 * (6.375 / 7) - 12, top: 69, width: 24, height: 24, background: K.accent, boxShadow: '0 0 0 3px ' + K.ink }}></div>
            <div style={{ position: 'absolute', left: 0, top: 104, fontFamily: K.body, fontSize: 24, color: K.n700, fontFeatureSettings: '"tnum" 1' }}>Monday 06:00 · the clock runs while you walk</div>
          </div>
        )}
        <FNode T={T} at={a + 22.6} x={930} y={450} w={354} h={140} t="Legacy Day" s="Sunday 09:00 · your medal is how many came" hl={lt >= 22.6} />
      </div>
    );
  }

  // ---- 13 cheat sheet ----
  function Recap({ T, C, kit }) {
    const a = C.Recap, b = C.Finale, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (o <= 0) return null;
    const lt = T - a;
    const Q = k => <div key={k} style={{ width: 26, height: 32, background: '#f3ca62', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.pix, fontSize: 24, color: K.ink }}>?</div>;
    const signs = [
      [[Q(0), Q(1), Q(2)], 'Three Doubts to go', 'Not met yet, or just begun', 3.2],
      [[Q(0)], 'One Doubt left', 'One more good chat', 4.6],
      [[<div key="c" style={{ padding: '0 10px', height: 32, background: '#dcd7cd', boxShadow: '0 0 0 3px ' + K.ink, fontFamily: K.pix, fontSize: 24, lineHeight: '28px', color: K.ink }}>···</div>], 'Cooling off', 'Back next phase', 6.6],
      [[<div key="k" style={{ width: 32, height: 32, background: '#70d070', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: K.ink }}>✓</div>], 'Booked', 'Coming to Legacy Day', 8.4]
    ];
const fill = MOTION.move(T, a + 11.4, a + 15.8), marks = [[6, 'Bronze'], [9, 'Silver'], [12, 'Gold']];
    const bob = i => Math.round(Math.sin(T * 2.2 + i)) * 2;
    return (
      <div style={Object.assign({}, DIA, { opacity: o })}>
        <div style={rise(T, a + 2.8)}><Kicker>Read the signs</Kicker></div>
        <div style={{ position: 'absolute', left: 0, top: 50, width: 560, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {signs.map((s, i) => (
            <div key={i} style={Object.assign({ display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', height: 118, borderTop: i ? '1px solid ' + K.divider : 'none' }, rise(T, a + s[3], 14))}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', gap: 8, transform: 'translateY(' + bob(i) + 'px)' }}>{s[0]}</div>
                <img src={kit.neighbours[i + 1].url} style={Object.assign({ width: 40, height: 60 }, PIX)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontFamily: K.head, fontWeight: 600, fontSize: 34, lineHeight: '38px', color: K.text }}>{s[1]}</div>
                <div style={{ fontFamily: K.body, fontSize: 24, lineHeight: '30px', color: K.n700 }}>{s[2]}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', left: 604, top: 0, width: 1, height: 590, background: K.divider, transform: 'scaleY(' + MOTION.move(T, a + 2.8, a + 4.0) + ')', transformOrigin: 'top' }}></div>
        <div style={Object.assign({ position: 'absolute', left: 660, top: 0 }, rise(T, a + 11.0))}><Kicker>Medals on Legacy Day</Kicker></div>
        {lt >= 11.0 && (
          <div style={{ position: 'absolute', left: 660, top: 60, width: 624, height: 200, opacity: MOTION.enter(T, a + 11.1, 0.5) }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 50, height: 24, border: '3px solid ' + K.ink, background: K.paper }}></div>
            <div style={{ position: 'absolute', left: 3, top: 53, height: 24, width: 618 * fill, background: K.accent }}></div>
            <div style={{ position: 'absolute', left: 0, top: 0, fontFamily: K.pix, fontSize: 24, color: K.n700 }}>0</div>
            {marks.map(m => {
              const x = 624 * m[0] / 12, hit = fill * 12 >= m[0] - 0.01;
              return (
                <React.Fragment key={m[1]}>
                  <div style={{ position: 'absolute', left: x - 1.5, top: 40, width: 3, height: 44, background: K.ink }}></div>
                  <div style={{ position: 'absolute', left: x, top: 0, transform: 'translateX(-50%)', fontFamily: K.pix, fontSize: 24, color: K.text, fontFeatureSettings: '"tnum" 1' }}>{m[0]}</div>
                  <div style={{ position: 'absolute', left: x, top: 96, transform: 'translateX(-50%) scale(' + (hit ? 0.9 + 0.1 * MOTION.pop(T, a + 11.4 + 4.4 * m[0] / 12, 0.4) : 1) + ')', padding: '2px 12px', border: '2px solid ' + (hit ? K.accent : K.divider), background: hit ? K.a100 : 'transparent', fontFamily: K.head, fontWeight: 600, fontSize: 30, lineHeight: '36px', color: K.text }}>{m[1]}</div>
                </React.Fragment>
              );
            })}
            <div style={Object.assign({ position: 'absolute', left: 0, top: 168, fontFamily: K.body, fontSize: 24, color: K.a700, whiteSpace: 'nowrap' }, rise(T, a + 16.0, 10))}>Platinum · all twelve with no backfires</div>
          </div>
        )}
        <div style={Object.assign({ position: 'absolute', left: 660, top: 310, width: 624, borderTop: '1px solid ' + K.divider, paddingTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }, rise(T, a + 17.4, 14))}>
          <Kicker>No game over</Kicker>
          <div style={{ fontFamily: K.body, fontSize: 30, lineHeight: '44px', color: K.text, textWrap: 'pretty' }}>Legacy Day goes ahead with whoever came. The rest get an epilogue card.</div>
        </div>
      </div>
    );
  }

  function Piece({ kit }) {
    const { T, CUES } = useComposition();
    const root = React.useRef(null);
    React.useEffect(() => { const el = root.current && root.current.closest('svg'); if (el) el.setAttribute('data-screen-label', 't=' + Math.floor(T) + 's'); });
    if (!kit) return <div ref={root} style={{ position: 'absolute', inset: 0, background: '#f3f2f2' }}></div>;
    const C = CUES;
    return (
      <div ref={root} style={{ position: 'absolute', inset: 0, background: '#e8dcc2', overflow: 'hidden', fontFamily: K.body, color: K.text }}>
        <div style={{ position: 'absolute', left: kit.room.win.x * 4, top: kit.room.win.y * 4, width: kit.room.win.w * 4, height: kit.room.win.h * 4, overflow: 'hidden', background: 'linear-gradient(#8ecae9, #c9e7f5)' }}>
          {[0, 1].map(i => <img key={i} src={kit.clouds} style={Object.assign({ position: 'absolute', left: -((T * 6) % 960) + i * 960, top: 40, width: 960, height: 80 }, PIX)} />)}
        </div>
        <img src={kit.room.url} style={Object.assign({ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080 }, PIX)} />
        <ContentWindow T={T} C={C} />
        <Header T={T} CUES={C} />
        <Shove T={T} C={C} n="Host"><HostCard T={T} C={C} /></Shove>
        <Shove T={T} C={C} n="Capacity"><Capacity T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Plan"><Plan T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Town"><Town T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Neighbours"><Neighbours T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Talk"><Talk T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Week"><Week T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Games"><Games T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Sports"><Sports T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Recap"><Recap T={T} C={C} kit={kit} /></Shove>
        <Demo T={T} C={C} kit={kit} />
        <TitlePlate T={T} C={C} kit={kit} />
        <PressStart T={T} C={C} />
        <Dialogue T={T} C={C} />
        <Lisa T={T} C={C} kit={kit} />
        <FishGag T={T} C={C} kit={kit} />
      </div>
    );
  }

  function LpaIntroVideo() {
    const [kit, setKit] = useState(null);
    const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { motionEditor: true });
    useEffect(() => {
      K = readTokens();
      const load = new Function('u', 'return import(u)');
      Promise.all([load(new URL('lpa-go-intro-kit.js', document.baseURI).href), document.fonts ? document.fonts.ready : null])
        .then(([m]) => m.buildKit()).then(setKit)
        .catch(e => console.error('intro kit failed', e));
    }, []);
    if (!K) K = readTokens();
    return (
      <React.Fragment>
        <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={K.bg}>
          <Piece kit={kit} />
        </CompositionStage>
        <TweaksPanel>
          <TweakSection label="Timeline" />
          <TweakToggle label="Motion editor" value={t.motionEditor} onChange={v => setTweak('motionEditor', v)} />
        </TweaksPanel>
      </React.Fragment>
    );
  }
  window.LpaIntroVideo = LpaIntroVideo;
})();
