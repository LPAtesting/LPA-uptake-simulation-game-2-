// LPA GO! intro video, 4-minute cut — Lisa steps out of her own title screen and walks the viewer through the game.
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

  const LABELS = { Title: '01 · Title screen', Hello: '02 · Hello', Host: '03 · Your host', Town: '04 · Tenang', Capacity: '05 · Why now', Neighbours: '06 · The neighbours', Demo: '07 · Live demo', Week: '08 · The week', Games: '09 · Side games', Sports: '10 · Sport', Recap: '11 · Cheat sheet', Share: '12 · Share', Finale: '13 · Your turn' };
  // the town and the Legacy Day deadline come first; Andy's story answers "why the rush?" and ends back at today
  const ORDER = ['Title', 'Hello', 'Host', 'Town', 'Capacity', 'Neighbours', 'Demo', 'Week', 'Games', 'Sports', 'Recap', 'Share', 'Finale'];
  // side games: where each game starts (each slot fits its voice line), the push-in rate, and the moment the fish leaps out of the fifth
  const G_AT = [3.2, 10.7, 17.1, 22.7, 28.3], G_SLOT = 5.6, GAG_AT = G_AT[4] + 5.8;
  // why now, keyed to the voice-over: the count starts on "The years go by" and each age lands on its number,
  // "No capacity" lands on the word, and once "too late" has been said the years wind back to 23
  const CAP = { ages: [[4.8, 23], [6.1, 45], [7.35, 68], [8.5, 82]], noCap: 11.7, late: 14.85, rew: 17.9, rewD: 1.2 };

  // each line is timed to its ElevenLabs take (assets/vo/lisa-el-NN.wav), so no clip has to wait for the one before
  const BASE_LINES = [
    ['Hello', 0.9, 'Wait. Before you press Start.'],
    ['Hello', 4.6, "Hi! I'm Lisa. Around Tenang they call me LPA Lisa."],
    ['Host', 0.2, "I'm a social-work student on placement at the Tenang Community Club."],
    ['Host', 4.3, 'My job this week is to get my neighbours to make a Lasting Power of Attorney.'],
    ['Town', 0.2, 'This is Tenang: kampung houses, HDB blocks and a hawker centre.'],
    ['Town', 6.25, 'On Sunday at 09:00 our CC is holding Legacy Day, with a doctor and lawyer coming to certify LPAs for us.'],
    ['Town', 13.75, 'I have six days to get twelve neighbours there.'],
    ['Capacity', 0.4, "Why the rush? Take Andy. He's twenty-three."],
    ['Capacity', 4.2, 'The years go by. Forty-five. Sixty-eight. Eighty-two.'],
    ['Capacity', 9.65, 'One day he may lose mental capacity, and can no longer decide for himself.'],
    ['Capacity', CAP.late, "By then it's too late to make an LPA.", 3.1],
    ['Neighbours', 0.2, 'Twelve neighbours, from Andy, 23, to Fauzi, 59.'],
    ['Neighbours', 4.95, "Each has three Doubts: the reasons they haven't made one yet."],
    ['Neighbours', 8.9, "Clear all three and they're booked. Let's try Dinesh."],
    ['Demo', 0.2, 'In I go!', 2.3],
    ['Week', 0.2, 'One day here is six real minutes, and everyone keeps a routine.'],
    ['Week', 4.6, 'My Notebook keeps a hint of where everyone was seen.'],
    ['Week', 7.95, "Let's see what's on this week!"],
    ['Week', 9.75, 'Pick a pace. Kampung gives hints, Heartland is the standard, Kiasu is short and harsh.'],
    ['Games', 0.2, 'Five neighbours want a game before they talk.'],
    ['Games', G_AT[0] + 0.2, 'The MRT. Seats come and go, like capacity. Giving up the priority seat is what a donee does.'],
    ['Games', G_AT[1] + 0.2, 'The hawker centre. Chope a table before the music stops: choose your donee while you still can.'],
    ['Games', G_AT[2] + 0.2, 'Chicken rice, cut as ordered. A donee shares out your money by your rules.'],
    ['Games', G_AT[3] + 0.2, 'Tray return. Remind people in time. A plan works when people know about it.'],
    ['Games', G_AT[4] + 0.2, 'Fishing. Pull too hard and the line snaps. Pressure backfires with people too.'],
    ['Games', GAG_AT + 0.1, 'Whoa! Heads up!'],
    ['Games', GAG_AT + 2.5, "Sorry! A glitch in the fishing game. That fish wasn't meant to leave the jetty."],
    ['Sports', 0.2, 'Sports are optional: football, basketball and badminton. Step into a glowing marker to play.'],
    ['Recap', 0.2, 'Watch above their heads. Question marks are Doubts left, a cloud means not now, a tick means booked.'],
    ['Recap', 7.15, 'Six booked is Bronze, nine is Silver, twelve is Gold. No backfires at all for Platinum.'],
    ['Share', 0.2, 'Proud of your week? You can share your progress any time.'],
    ['Share', 5.6, 'Send your card to a group chat, or post it to your story.'],
    ['Share', 10.4, 'Then race your friends to Platinum. Can you get all twelve there without a single backfire?']
  ];
  // the demo's commentary lines are timed off the game run and spliced in once the kit loads
  let LINES = BASE_LINES;

  // plate rectangles for the title screen (16:9)
  const R_FULL = { cx: 960, cy: 540, w: 1920 }, R_STAGE = { cx: 960, cy: 470, w: 1180 }, R_CONTENT = { cx: 1132, cy: 475, w: 1140 };
  const rect = r => ({ x: r.cx - r.w / 2, y: r.cy - r.w * 9 / 32, w: r.w, h: r.w * 9 / 16 });
  const mixR = (a, b, t) => ({ cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), w: lerp(a.w, b.w, t) });
  const HOST = { cx: 236, bottom: 1032, s: 14 };
  const HD = { w: 44, h: 48, px: 6, s: 7 };
  const JUMPS = ['Host', 'Town', 'Capacity', 'Neighbours', 'Week', 'Games', 'Sports', 'Recap', 'Share'];
  const DRIFT = { Host: 0, Town: 22, Capacity: -14, Neighbours: -16, Week: 18, Games: -20, Sports: 10, Recap: -12, Share: 0 };
  // scene changes alternate: a hop, then a push where she shoves the old scene off to the right
  // how she changes each slide: hand push, a hip bump (still facing us), or a gentle kick
  const PUSH = { Town: 'push', Week: 'push', Sports: 'kick', Share: 'back' };
  // into Andy's story she just walks over, no hop before the sad part; the hop out of it lifts the mood again
  const STROLL = { Capacity: 0.9 };
  const REACH = { push: [300, 64], back: [326, 44], kick: [304, 26] };
  function sceneMove(T, C) {
    let dx = 0;
    for (const n of JUMPS) {
      const d = DRIFT[n];
      if (STROLL[n]) {
        const u = T - (C[n] - 0.6), D = STROLL[n];
        if (u < 0) break;
        if (u >= D) { dx = d; continue; }
        return { y: 0, sq: 1, dx: lerp(dx, d, Easing.easeInOutSine(u / D)), walk: true, land: -1 };
      }
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
    r = mixR(r, R_CONTENT, MOTION.move(T, C.Hello + 3.4, C.Hello + 4.7));
    if (T > C.Host) r = R_CONTENT;
    if (T > C.Finale - 1) r = mixR(R_CONTENT, R_FULL, MOTION.move(T, C.Finale + 5.0, C.Finale + 6.3));
    return rect(r);
  }
  // 1 = looking at the town, 0 = up at the sky; opens on the sky and ends there for the loop
  function titleTilt(T, C) { return MOTION.move(T, 0.4, 3.8) - (T > C.Finale ? MOTION.move(T, C.Finale + 6.4, C.Finale + 8.8) : 0); }
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
    const lg = kit.logo, lw = lg.w * s * 0.72, drop = MOTION.pop(T, 3.4, 0.8);
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
    const o = Math.max(life(T, 4.2, C.Hello + 0.4), T > C.Finale + 6 ? life(T, C.Finale + 6.2, C.Finale + 7.8) : 0);
    const blink = Math.floor(T * 1.6) % 2 ? 1 : 0.35;
    if (o <= 0) return null;
    return <div style={{ position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', opacity: o * blink, fontFamily: K.pix, fontSize: 48, color: K.paper, textShadow: '4px 4px 0 ' + K.ink + ', -4px 0 0 ' + K.ink + ', 0 -4px 0 ' + K.ink + ', 4px 0 0 ' + K.ink + ', 0 4px 0 ' + K.ink }}>Press Start</div>;
  }

  // ---- the fish gag: one leaps out of the fishing plate at the viewer, Lisa catches it and throws it off ----
  const GAG_JUMP = 180;
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
    const z = 1 + 0.02 * ((GAG_AT - G_AT[4]) / G_SLOT), U0 = 1.5 * z, U1 = 9;
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
    if (ln[4]) until = Math.min(until, C[ln[4][0]] + ln[4][1]);
    cur.until = until; cur.next = nx ? C[nx[0]] + nx[1] : null; cur.n = Math.floor((T - cur.at) * 46); cur.typing = cur.n < cur.text.length && T < until;
    return cur;
  }
  function Lisa({ T, C, kit }) {
    const R = titleRect(T, C), s = R.w / kit.title.w, sp = kit.title.lisa, ps = s / 2;
    // in the plate: her spot on the lane
    const hop = T > C.Hello + 0.6 && T < C.Hello + 1.1 ? Math.sin(Math.PI * (T - C.Hello - 0.6) / 0.5) * 5 : 0;
    const offY = -titleTilt(T, C) * (kit.title.h - kit.title.w * 9 / 16) * s;
    const inP = { x: R.x + sp.x * s - HD.px * ps, y: R.y + offY + (sp.y - hop) * s, w: HD.w * ps };
    const j = MOTION.move(T, C.Hello + 3.4, C.Hello + 4.5) - MOTION.move(T, C.Finale + 5.0, C.Finale + 6.2);
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
    let squat = T > C.Hello + 3.0 && T < C.Hello + 3.45 ? 1 - 0.1 * Math.sin(Math.PI * (T - C.Hello - 3.0) / 0.45) : 1;
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
    const bang = life(T, C.Hello + 0.6, C.Hello + 2.8, 0.2, 0.3), bangS = MOTION.pop(T, C.Hello + 0.6, 0.3);
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
  // during the full-screen demo it rides at the top of the frame and only shows while Lisa comments
  function Dialogue({ T, C }) {
    const base = life(T, C.Hello + 0.6, C.Finale + 5.0, 0.4, 0.5);
    if (base <= 0) return null;
    const L = lineAt(T, C), dc = demoCover(T, C), top = dc > 0.5;
    const lo = L ? Math.min(1, 1 - MOTION.move(T, L.until - 0.15, L.until)) : 0;
    // in a long pause between lines (the rewind after Andy's story) the box steps away and returns with the next line
    const away = !top && L && L.next != null && L.next - L.until > 1.2 ? Math.min(MOTION.move(T, L.until, L.until + 0.35), 1 - MOTION.move(T, L.next - 0.45, L.next - 0.1)) : 0;
    const o = top ? base * (2 * dc - 1) * (L ? Math.min(lo, MOTION.enter(T, L.at - 0.05, 0.25)) : 0) : base * (1 - 2 * dc) * (1 - away);
    if (o <= 0) return null;
    const shown = L ? L.text.slice(0, Math.max(0, L.n)) : '';
    const done = L && !L.typing;
    const box = top ? { left: 520, width: 880, top: 46, height: 126 } : { left: 400, right: 96, top: 846, height: 186, transform: 'translateY(' + (1 - MOTION.enter(T, C.Hello + 0.6, 0.5)) * 30 + 'px)' };
    const tx = top ? { left: 34, right: 64, top: 24, fontSize: 30, lineHeight: '40px' } : { left: 48, right: 90, top: 34, fontSize: 42, lineHeight: '58px' };
    return (
      <div style={Object.assign({ position: 'absolute', opacity: o }, box)}>
        <div style={Object.assign({ position: 'absolute', inset: 0, background: K.bg }, WIN())}></div>
        <div style={{ position: 'absolute', left: top ? 26 : 36, top: top ? -26 : -30, padding: top ? '4px 14px' : '6px 18px', background: K.accent, boxShadow: '0 0 0 4px ' + K.ink, fontFamily: K.pix, fontSize: top ? 24 : 28, lineHeight: top ? '28px' : '32px', color: K.ink }}>LPA Lisa</div>
        <div style={Object.assign({ position: 'absolute', fontFamily: K.body, color: K.text, opacity: lo, textWrap: 'pretty', fontVariantLigatures: 'none' }, tx)}>
          <span>{shown}</span><span style={{ opacity: 0 }}>{L ? L.text.slice(Math.max(0, L.n)) : ''}</span>
        </div>
        {done && <div style={{ position: 'absolute', right: top ? 24 : 34, bottom: (top ? 14 : 24) + (Math.floor(T * 2.5) % 2) * 6, fontSize: 24, color: K.accent, opacity: lo }}>▼</div>}
      </div>
    );
  }

  // ---- 03 host card ----
  function HostCard({ T, C }) {
    const a = C.Host, o = life(T, a - 0.3, C.Town + 0.1);
    if (o <= 0) return null;
    const drift = -14 * MOTION.move(T, a, C.Town);
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
          <div style={rise(T, a + 4.3)}><Kicker>What she is asking for</Kicker></div>
          <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 60, lineHeight: '66px', color: K.text }, rise(T, a + 4.6, 30))}>Lasting Power of Attorney</div>
          <div style={Object.assign({ fontFamily: K.body, fontSize: 32, lineHeight: '48px', color: K.text, textWrap: 'pretty' }, rise(T, a + 5.1))}>A legal document naming who can decide for you if you ever lose mental capacity.</div>
          <div style={Object.assign({ fontFamily: K.body, fontSize: 32, lineHeight: '48px', color: K.text, textWrap: 'pretty', borderTop: '1px solid ' + K.divider, paddingTop: 22 }, rise(T, a + 6.3))}>You can make one from 21, but only while you still have capacity.</div>
        </div>
      </div>
    );
  }

  // ---- 05 why now: Andy grows old and loses capacity, then the years wind back to today ----
  // Andy's age at scene time lt: up through the CAP keys, then eased back down to 23 during the rewind
  function capAge(lt) {
    if (lt >= CAP.rew) return 82 - 59 * Easing.easeInOutCubic(clamp((lt - CAP.rew) / CAP.rewD, 0, 1));
    const k = CAP.ages;
    if (lt <= k[0][0]) return 23;
    for (let i = 1; i < k.length; i++) if (lt < k[i][0]) return lerp(k[i - 1][1], k[i][1], (lt - k[i - 1][0]) / (k[i][0] - k[i - 1][0]));
    return 82;
  }
  // the moment the rewind passes an age on its way back
  function rewAt(age) {
    const q = (82 - age) / 59; let lo = 0, hi = 1;
    for (let n = 0; n < 16; n++) { const m = (lo + hi) / 2; if (Easing.easeInOutCubic(m) < q) lo = m; else hi = m; }
    return CAP.rew + CAP.rewD * lo;
  }
  function Capacity({ T, C, kit }) {
    const a = C.Capacity, b = C.Neighbours, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (o <= 0) return null;
    const lt = T - a, AG = kit.andyAges, Z = 4.4, ox = 60, oy = 68, ax = 42, ay = 30;
    const ageF = capAge(lt), age = Math.round(ageF), back = lt >= CAP.rew, landed = lt >= CAP.rew + CAP.rewD;
    const gi = AG.reduce((acc, g, i) => (age >= g[0] ? i : acc), 0);
    // the sprite pops each time it changes, on the way up and on the way back
    const chg = back ? rewAt(gi < 3 ? AG[gi + 1][0] - 0.5 : 82) : gi ? CAP.ages[gi][0] : -1;
    const pop = chg >= 0 ? MOTION.pop(T, a + chg, 0.35) : 1;
    const noCap = life(T, a + CAP.noCap, a + CAP.rew + 0.35, 0.3, 0.3), noS = MOTION.pop(T, a + CAP.noCap, 0.4);
    const dim = 0.28 * (ageF - 23) / 59, red = lt >= CAP.noCap && !back;
    const rw = life(T, a + CAP.rew, a + CAP.rew + CAP.rewD + 0.3, 0.15, 0.3);
    const tag = lt < CAP.ages[0][0] || landed ? 'Today' : back ? 'Rewind' : lt < CAP.late ? 'Years go by' : 'Too late for an LPA';
    const bob = gi < 3 ? Math.round(Math.sin(T * 2.2)) * 2 : 0;
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
        <Plate x={490} y={196} w={440} h={330} opacity={MOTION.enter(T, a + 0.2, 0.5)}>
          <img src={kit.plaza.url} style={Object.assign({ position: 'absolute', left: -ox * Z, top: -oy * Z, width: kit.plaza.w * Z, height: kit.plaza.h * Z }, PIX)} />
          <div style={{ position: 'absolute', inset: 0, background: '#6a5a40', opacity: dim }}></div>
          <img src={AG[gi][1]} style={Object.assign({ position: 'absolute', left: ax * Z, top: ay * Z + bob, width: 16 * Z, height: 24 * Z, transformOrigin: '50% 100%', transform: 'scale(' + (0.85 + 0.15 * pop) + ')' }, PIX)} />
          {noCap > 0 && <div style={{ position: 'absolute', left: (ax + 8) * Z, top: ay * Z - 52, transform: 'translateX(-50%) scale(' + noS + ')', transformOrigin: '50% 100%', opacity: noCap, whiteSpace: 'nowrap', padding: '4px 14px', background: '#dcd7cd', boxShadow: '0 0 0 3px ' + K.ink, fontFamily: K.pix, fontSize: 24, color: K.ink }}>No capacity</div>}
          {rw > 0 && [0, 1, 2].map(i => <div key={'rw' + i} style={{ position: 'absolute', left: 0, right: 0, top: 330 - ((T * 760 + i * 118) % 354), height: 6, background: K.paper, opacity: 0.32 * rw }}></div>)}
          <div style={{ position: 'absolute', left: 10, top: 10, display: 'flex', alignItems: 'baseline', gap: 12, padding: '4px 12px', background: K.bg, border: '1px solid ' + (red ? BAD : K.divider), borderRadius: '2px', whiteSpace: 'nowrap', opacity: MOTION.enter(T, a + 0.6, 0.4) }}>
            <span style={{ fontFamily: K.pix, fontSize: 24, color: K.a700, fontFeatureSettings: '"tnum" 1' }}>AGE {age}</span>
            <span style={{ fontFamily: K.body, fontSize: 24, color: K.text }}>{tag}</span>
          </div>
          {rw > 0 && <div style={{ position: 'absolute', right: 10, top: 10, padding: '4px 12px', background: K.bg, border: '1px solid ' + K.accent, borderRadius: '2px', opacity: rw, fontSize: 24, lineHeight: '30px', color: K.accent }}>◂◂</div>}
        </Plate>
        <div style={{ position: 'absolute', left: 986, right: 146, top: 196, display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={rise(T, a + 0.2)}><Kicker>Why it can't wait</Kicker></div>
          <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 64, lineHeight: '68px', color: K.text }, rise(T, a + 0.4, 24))}>Capacity doesn't wait</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', columnGap: 18, marginTop: 6 }}>
            {AG.map((g, i) => {
              const reached = i <= gi, on = i === gi, p = i ? MOTION.pop(T, a + CAP.ages[i][0], 0.4) : MOTION.pop(T, a + (back ? CAP.rew + CAP.rewD - 0.2 : 0.8), 0.4);
              return (
                <div key={g[0]} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: reached ? 1 : 0.3 }}>
                  <div style={{ padding: '10px 22px 4px', background: '#70d070', boxShadow: '0 0 0 4px #3c9a48, 0 0 0 7px ' + K.ink, transform: 'scale(' + (reached ? 0.9 + 0.1 * p : 0.9) + ')' }}><img src={g[1]} style={Object.assign({ width: 64, height: 96 }, PIX)} /></div>
                  <div style={{ fontFamily: K.head, fontSize: 34, lineHeight: '36px', color: K.text, fontFeatureSettings: '"tnum" 1', borderBottom: '1px solid ' + (on ? K.accent : 'transparent'), paddingBottom: 4 }}>{g[0]}</div>
                  {i === 3 && <div style={{ fontFamily: K.body, fontSize: 24, color: K.n700, opacity: noCap }}>No capacity</div>}
                </div>
              );
            })}
          </div>
          <div style={Object.assign({ borderTop: '1px solid ' + K.divider, paddingTop: 18, fontFamily: K.body, fontSize: 28, lineHeight: '40px', color: K.text, textWrap: 'pretty' }, rise(T, a + CAP.late + 0.2, 14))}>An LPA can only be made while you still have capacity. <span style={{ color: K.a700, opacity: MOTION.enter(T, a + CAP.rew + CAP.rewD - 0.1, 0.5) }}>Andy can make his today.</span></div>
        </div>
      </div>
    );
  }

  // ---- 04 the town pan ----
  function Town({ T, C, kit }) {
    const a = C.Town, b = C.Capacity, o = life(T, a, b + 0.1, 0.6, 0.6);
    if (o <= 0) return null;
    const box = { x: 440, y: 150, w: 1384, h: 650 }, s = box.h / kit.town.h, sw = kit.town.w * s;
    const pan = -(sw - box.w) * MOTION.move(T, a - 0.2, b - 0.4);
    const poster = life(T, a + 6.2, a + 13.75), figs = life(T, a + 14.0, b + 0.1);
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
          <div style={{ position: 'absolute', left: 1180, top: 196, width: 580, padding: '30px 38px', boxSizing: 'border-box', background: K.bg, boxShadow: WIN().boxShadow, opacity: poster, transform: 'translateY(' + (1 - MOTION.enter(T, a + 6.2, 0.7)) * 30 + 'px) rotate(-0.6deg)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Kicker>Kampung noticeboard</Kicker>
            <div style={{ fontFamily: K.head, fontSize: 64, lineHeight: '64px', color: K.text }}>Tenang Legacy Day</div>
            <div style={{ fontFamily: K.body, fontSize: 30, lineHeight: '42px', color: K.text, borderTop: '1px solid ' + K.divider, paddingTop: 14, fontFeatureSettings: '"tnum" 1' }}>Sunday 09:00 · Tenang Community Club</div>
            <div style={{ fontFamily: K.body, fontSize: 26, lineHeight: '38px', color: K.n700, textWrap: 'pretty' }}>An OPG-accredited GP and a practising lawyer on site, volunteers for the online application, free kopi.</div>
          </div>
        )}
        {figs > 0 && (
          <div style={{ position: 'absolute', left: 1180, top: 196, width: 580, padding: '30px 38px', boxSizing: 'border-box', background: K.bg, boxShadow: WIN().boxShadow, opacity: figs, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', columnGap: 34 }}>
            {[['6', 'days'], null, ['12', 'neighbours']].map((f, i) => f ? (
              <div key={i} style={Object.assign({ display: 'flex', flexDirection: 'column', gap: 4 }, rise(T, a + 14.2 + i * 0.4, 20))}>
                <div style={{ fontFamily: K.head, fontSize: 140, lineHeight: '130px', color: K.text, fontFeatureSettings: '"tnum" 1' }}>{f[0]}</div>
                <Kicker>{f[1]}</Kicker>
              </div>) : <div key={i} style={{ background: K.divider }}></div>)}
          </div>
        )}
      </div>
    );
  }

  // ---- 06 the neighbours ----
  function Neighbours({ T, C, kit }) {
    const a = C.Neighbours, b = C.Demo + 2.4, o = life(T, a, b + 0.1, 0.4, 0.5);
    if (o <= 0) return null;
    const FOC = 2, focus = MOTION.move(T, a + 4.95, a + 5.65), who = kit.neighbours[FOC];
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
        <div style={{ position: 'absolute', left: 490, width: 1300, top: 176, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', rowGap: 12 }}>
          {kit.neighbours.map((n, i) => {
            const t0 = a + 0.3 + i * 0.16, pp = MOTION.pop(T, t0, 0.5), dim = i === FOC ? 1 : 1 - 0.65 * focus;
            const bob = Math.sin(T * 2.2 + i * 0.9) * 3;
            return (
              <div key={n.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, opacity: Math.min(1, MOTION.enter(T, t0, 0.3)) * dim, transform: 'translateY(' + ((1 - pp) * 30) + 'px) scale(' + (0.7 + 0.3 * pp) + ')' }}>
                <div style={{ padding: '10px 22px 4px', background: '#70d070', boxShadow: '0 0 0 4px #3c9a48, 0 0 0 7px ' + K.ink }}><img src={n.url} style={Object.assign({ width: 64, height: 96, transform: 'translateY(' + bob + 'px)' }, PIX)} /></div>
                <div style={{ fontFamily: K.head, fontSize: 34, lineHeight: '36px', color: K.text, borderBottom: '1px solid ' + (i === FOC && focus > 0.5 ? K.accent : 'transparent'), paddingBottom: 4 }}>{n.name}</div>
                <div style={{ fontFamily: K.body, fontSize: 24, color: K.n700, fontFeatureSettings: '"tnum" 1' }}>{n.age}</div>
              </div>
            );
          })}
        </div>
        {focus > 0 && (
          <div style={{ position: 'absolute', left: 500, width: 1280, top: 628, opacity: focus, borderTop: '1px solid ' + K.divider, paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 26 }}>
              <Kicker>{who.name}'s Doubts</Kicker>
              <div style={{ fontFamily: K.body, fontSize: 24, color: K.n700 }}>{who.job}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', columnGap: 48 }}>
              {who.doubts.map((d, k) => (
                <div key={k} style={Object.assign({ fontFamily: K.body, fontSize: 28, lineHeight: '36px', color: K.text }, rise(T, a + 5.4 + k * 0.45, 16))}>“{d}”</div>
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
  // ---- 09 live demo: Lisa jumps into the real game and convinces Dinesh, all three Doubts ----
  const DW = { x: 440, y: 150, w: 1384, h: 650 }, PB = { w: 1168, h: 784 }, D_IN = 3.9;
  const DEMO_CUTS = ['', 'Monday night \u00b7 Blk 5 void deck', 'Tuesday evening \u00b7 Hawker Centre'];
  let DKIT = null;
  // walking, facing and the beat after the first two chats are fast-forwarded (about 2x, sized so the
  // run fills the Demo scene exactly); every line of dialogue plays at 1x
  const FF = { pre: 1, walk: 1, face: 1, after: 1 };
  let WARP = null;
  function buildWarp(sim, target) {
    const mk = sim.marks || [[0, 'pre', 0]], seg = [], runs = [], fastPh = m => FF[m[1]] && !(m[1] === 'after' && m[0] === 2);
    const end = k => k + 1 < mk.length ? mk[k + 1][2] : sim.total;
    let F = 0, v = 0;
    mk.forEach((m, k) => { if (fastPh(m)) F += Math.max(0, end(k) - m[2]); });
    const fsp = F > 0 ? clamp(F / Math.max(0.01, target - (sim.total - F)), 1.5, 3) : 1;
    mk.forEach((m, k) => {
      const s0 = m[2], s1 = end(k), sp = fastPh(m) ? fsp : 1;
      if (s1 > s0) { seg.push({ i: m[0], ph: m[1], s0, s1, sp, v0: v, v1: v + (s1 - s0) / sp }); v += (s1 - s0) / sp; }
    });
    seg.forEach(g => { const r = runs[runs.length - 1]; if (g.sp > 1) { if (r && r.v1 === g.v0) r.v1 = g.v1; else runs.push({ v0: g.v0, v1: g.v1 }); } });
    return {
      target, sp: fsp, len: v,
      at: (i, ph) => { const g = seg.find(q => q.i === i && q.ph === ph); return g ? g.v0 : null; },
      toSim: t => { if (t <= 0) return 0; for (const g of seg) if (t < g.v1) return g.s0 + (t - g.v0) * g.sp; return sim.total + (t - v); },
      fast: t => { for (const r of runs) if (t >= r.v0 && t < r.v1) return clamp(Math.min((t - r.v0) / 0.15, (r.v1 - t) / 0.15), 0, 1); return 0; }
    };
  }
  // what the Talk scene used to explain, said over the live run
  function withDemoLines(base, W) {
    const v = (i, ph) => { const x = W.at(i, ph); return x == null ? null : D_IN + x; };
    const out = [], add = (t, text, end, abs) => { if (t != null) out.push(['Demo', t, text, end != null ? Math.max(1.5, end - t) : 0, abs]); };
    const o0 = v(0, 'open'), m0 = v(0, 'menu'), a0 = v(0, 'after'), a1 = v(1, 'after'), a2 = v(2, 'after');
    add(3.6, 'The clock runs while I walk, and stops while we talk.', o0 != null ? o0 + 2.2 : null);
    add(m0 != null ? m0 + 0.5 : null, 'Of the three replies, one is right, one misses the point and one is a myth.', v(0, 'react') != null ? v(0, 'react') + 0.75 : null);
    add(a0 != null ? a0 + 0.4 : null, 'The right reply clears a Doubt and unlocks a Fact Card.', v(1, 'open'));
    // the longest take: it starts while the backfire is still on screen and runs into the next chat's opening
    const o2 = v(2, 'open');
    add(a1 != null ? a1 - 0.8 : null, 'A myth backfires! I lose thirty minutes, and he needs space till the next phase.', o2 != null ? o2 + 1.4 : null);
    add(a2 != null ? a2 + 0.3 : null, "Third Doubt cleared. Dinesh takes a flyer, and he's booked!", null, ['Week', -4.5]);
    const i = base.findIndex(l => l[0] === 'Demo');
    return base.slice(0, i + 1).concat(out, base.slice(i + 1));
  }
  // the conversation inside the game, voiced and shorter than the on-screen text. Audio only: the game's own
  // dialogue box is the caption. [chat, phase it is timed from, offset, speaker, words, seconds allowed]
  const GAME_TALK = [
    [0, 'open', 1.7, 'Dinesh', "Hi, I'm Dinesh. I deliver food, so I'm quite busy.", 4.0],
    [0, 'react', 0.8, 'Lisa', 'Sunday at the CC. Free, doctor and lawyer on site.', 3.3],
    [0, 'react', 4.25, 'Dinesh', "Oh, that's easy. Find me tonight, we can talk more.", 3.4],
    [1, 'open', 0.15, 'Dinesh', "OK, I'm here. But I only rent a room. Is an LPA for me?", 5.9],
    [1, 'menu', 1.75, 'Lisa', "It's a cash-flow document. In hospital, a donee runs your account.", 4.6],
    [1, 'react', 3.4, 'Dinesh', 'Oh, I see. Can my brother be my donee?', 3.1],
    [1, 'react', 8.0, 'Lisa', "Yes, if he's twenty-one and not bankrupt.", 2.9],
    [2, 'open', 1.1, 'Dinesh', "I asked my brother. He said if anything happens, he'll just handle it.", 4.3],
    [2, 'menu', 2.6, 'Lisa', "He means it, but the bank won't accept 'just handle'. An LPA, they will.", 5.3],
    [2, 'react', 4.2, 'Dinesh', "Oh, I didn't know. OK, I'll come on Sunday.", 2.8]
  ];
  let TALK = [];
  function ensureWarp(kit, C) {
    if (!kit.demoSim || !(C.Week > C.Demo)) return;
    const target = C.Week - C.Demo - D_IN - 3.3;
    if (WARP && WARP.target === target) return;
    WARP = buildWarp(kit.demoSim, target);
    LINES = withDemoLines(BASE_LINES, WARP);
    TALK = GAME_TALK.map(g => { const x = WARP.at(g[0], g[1]); return x == null ? null : { who: g[3], text: g[4], at: D_IN + x + g[2], d: g[5] }; }).filter(Boolean);
  }
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
    const fr = sim(WARP ? WARP.toSim(lt - D_IN) : Math.max(0, lt - D_IN), lt < 3.1 || T >= t1);
    const vis = MOTION.enter(T, a + 2.2, 0.3) * (1 - MOTION.move(T, W - 3.2, W - 2.8));
    const z = MOTION.move(T, a + 3.1, a + 3.9) - MOTION.move(T, W - 4.2, W - 3.4);
    const q = toScr(-8, -8, z), ff = WARP ? WARP.fast(lt - D_IN) * clamp(z * 2 - 1, 0, 1) : 0;
    return (
      <React.Fragment>
        <div style={{ position: 'absolute', inset: 0, background: '#3c4152', opacity: z * vis }}></div>
        <div style={{ position: 'absolute', left: q.x, top: q.y, width: PB.w, height: PB.h, transform: 'scale(' + q.s + ')', transformOrigin: '0 0', opacity: vis }}><GamePanel fr={fr} /></div>
        {ff > 0 && (
          <div style={Object.assign({ position: 'absolute', left: 24, top: 56, width: 108, padding: '10px 0 8px', boxSizing: 'border-box', background: K.bg, opacity: ff, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }, WIN())}>
            <span style={{ fontSize: 28, lineHeight: '30px', color: K.accent }}>▸▸</span>
            <span style={{ fontFamily: K.pix, fontSize: 32, lineHeight: '36px', color: K.text }}>{Math.round(WARP.sp * 10) / 10}×</span>
          </div>
        )}
      </React.Fragment>
    );
  }

  // ---- 08 side games, played live ----
  const GAMES = [
    { id: 'mrt', at: G_AT[0], pre: 1.2, n: 'MRT · Tenang line', w: 'Wilson', m: 'Capacity comes and goes. A donee stands in only while you can’t.', r: ['Five stations, Ketapang to Tenang.', 'Every stop the seats go back in play. No seat when the doors shut and you are out.', 'Give the priority seat to someone who needs it.'] },
    { id: 'chope', at: G_AT[1], pre: 0.6, n: 'Hawker Centre · chope', w: 'Mei Ling', m: 'Sign while you still have capacity. After that it’s too late.', r: ['Music on: circle the tables.', 'Music stops: first to a table drops a tissue packet.', 'One table fewer each round, five rounds.'] },
    { id: 'chop', at: G_AT[2], pre: 0.4, n: 'Chicken rice · chop to order', w: 'Hafiz', m: 'Your donee divides your money by your rules, not theirs.', r: ['Slide the cleaver and cut the order into pieces.', 'Even pieces score higher. Cutting through bone costs time.', 'Graded A to D, with tips.'] },
    { id: 'tray', at: G_AT[3], pre: 7, n: 'Hawker Centre · tray return', w: 'Nadia', m: 'Make the plan in time, and tell the people who’ll need it.', r: ['Remind diners to clear up as their plate empties.', 'Ask too early and they forget.', 'Carry loose trays to a trolley before the crow dives.'] },
    { id: 'fishing', sim: 'fishGag', at: G_AT[4], pre: 0.4, n: 'Fishing · Tenang jetty', w: 'Fauzi', m: 'Nobody signs under pressure. Ease off and let them decide.', r: ['A and D walk the deck; W and S cast in and out.', 'Hold the float on the ripples until she bites.', 'Hold S to reel. Let go when she runs, or the line snaps.'] }
  ];
  function Games({ T, C, kit }) {
    const a = C.Games, b = C.Sports, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (o <= 0) return null;
    const lt = T - a;
    const gi = GAMES.reduce((acc, g, i) => (lt >= g.at ? i : acc), -1);
    const g = gi >= 0 ? GAMES[gi] : GAMES[0];
    const sports = false;
    const plateOn = MOTION.enter(T, a + 1.0, 0.8) * (1 - MOTION.move(T, b - 0.6, b));
    const pre = g.id === 'fishing' && kit.fishGag ? kit.fishGag.t - (GAG_AT - g.at) : g.pre;
    const simT = lt - g.at + pre;
    const fr = plateOn > 0 ? kit.sims[g.sim || g.id](Math.max(0, simT)) : null;
    const gs = gi >= 0 ? g.at : 0, ge = gi >= 0 && gi < GAMES.length - 1 ? GAMES[gi + 1].at : b - a;
    const colO = gi >= 0 && !sports ? Math.min(MOTION.enter(T, a + gs, 0.5), 1 - MOTION.move(T, a + ge - 0.3, a + ge)) : 0;
    const introO = life(T, a + 0.3, a + G_AT[0] + 0.2);
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
          <div key={g.id} style={{ position: 'absolute', left: 490, top: 186, width: 400, opacity: colO, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Kicker style={rise(T, a + gs + 0.1, 12)}>{String(gi + 1).padStart(2, '0')} / {String(GAMES.length).padStart(2, '0')} · with {g.w}</Kicker>
            <div style={Object.assign({ fontFamily: K.head, fontSize: 44, lineHeight: '48px', color: K.text, textWrap: 'balance' }, rise(T, a + gs + 0.25, 20))}>{g.n}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid ' + K.divider, paddingTop: 14 }}>
              {g.r.map((r, k) => <div key={k} style={Object.assign({ fontFamily: K.body, fontSize: 24, lineHeight: '31px', color: K.text, textWrap: 'pretty', display: 'flex', gap: 10 }, rise(T, a + gs + 0.4 + k * 0.35, 12))}><span style={{ color: K.accent }}>•</span><span>{r}</span></div>)}
            </div>
            <div style={Object.assign({ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid ' + K.divider, paddingTop: 14 }, rise(T, a + gs + 1.6, 12))}>
              <Kicker>The LPA point</Kicker>
              <div style={{ fontFamily: K.head, fontStyle: 'italic', fontSize: 28, lineHeight: '34px', color: K.a700, textWrap: 'pretty' }}>{g.m}</div>
            </div>
          </div>
        )}
        {plateOn > 0 && fr && (
          <React.Fragment>
            <Plate x={912} y={176} w={864} h={576} opacity={plateOn}>
              <img src={fr.url} style={Object.assign({ width: 864, height: 576, transform: 'scale(' + (1 + 0.02 * ((lt - gs) / G_SLOT)) + ')' }, PIX)} />
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
    const lt = T - a, p1 = life(T, a, a + 7.95, 0.5, 0.4), p2 = life(T, a + 7.95, b + 0.1, 0.5, 0.4);
    const andy = kit.neighbours[0], pz = kit.plaza, ps = 440 / pz.w;
    const wm = 360 + clamp(lt - 0.8, 0, 6.8) * 1440 / 6.8, hr = (wm % 1440) / 60;
    const ph = lt < 0.8 ? -1 : kit.andyPhase.findIndex(p => p[0] === PHASE(Math.floor(hr)));
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
              <div style={Object.assign({ display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid ' + K.divider, paddingTop: 18 }, rise(T, a + 4.6, 14))}>
                <Kicker>Lisa's Notebook</Kicker>
                <div style={{ fontFamily: K.body, fontSize: 28, lineHeight: '38px', color: K.text }}>Hint · seen at the Sports Hall gym in the mornings.</div>
              </div>
            </div>
          </div>
        )}
        {p2 > 0 && (
          <div style={{ position: 'absolute', left: 490, right: 146, top: 196, opacity: p2, display: 'grid', gridTemplateColumns: '1fr 1px 1fr', columnGap: 56 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={rise(T, a + 8.15)}><Kicker>Around the week</Kicker></div>
              <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 52, lineHeight: '56px', color: K.text }, rise(T, a + 8.35, 20))}>What's on this week</div>
              {news.map((n, i) => (
                <div key={n[0]} style={Object.assign({ borderTop: '1px solid ' + K.divider, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }, rise(T, a + 8.75 + i * 0.4, 14))}>
                  <div style={{ fontFamily: K.pix, fontSize: 24, textTransform: 'uppercase', color: K.a700 }}>{n[0]}</div>
                  <div style={{ fontFamily: K.body, fontSize: 26, lineHeight: '34px', color: K.text, textWrap: 'pretty' }}>{n[1]}</div>
                </div>
              ))}
            </div>
            <div style={{ background: K.divider, transform: 'scaleY(' + MOTION.move(T, a + 8.35, a + 9.35) + ')', transformOrigin: 'top' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={rise(T, a + 9.75)}><Kicker>Pace · chosen on the title screen</Kicker></div>
              <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 52, lineHeight: '56px', color: K.text }, rise(T, a + 9.95, 20))}>Three ways to play</div>
              {pace.map((p, i) => (
                <div key={p[0]} style={Object.assign({ borderTop: '1px solid ' + (i === 1 ? K.accent : K.divider), paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 4 }, rise(T, a + [10.75, 12.25, 13.85][i], 14))}>
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
          const t0 = 0.8 + k * 0.35, x = 490 + k * (PW + GAP);
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
  // the medal bar fills on the voice-over: each medal lights as she names it
  const RC_FILL = [[7.5, 0], [8.5, 6], [10.0, 9], [11.6, 12]];
  function rcFill(lt) {
    if (lt <= RC_FILL[0][0]) return 0;
    for (let i = 1; i < RC_FILL.length; i++) { const [t0, v0] = RC_FILL[i - 1], [t1, v1] = RC_FILL[i]; if (lt < t1) return lerp(v0, v1, Easing.easeInOutSine((lt - t0) / (t1 - t0))) / 12; }
    return 1;
  }
  // ---- 11 cheat sheet ----
  function Recap({ T, C, kit }) {
    const a = C.Recap, b = C.Share, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (o <= 0) return null;
    const lt = T - a;
    const Q = k => <div key={k} style={{ width: 26, height: 32, background: '#f3ca62', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.pix, fontSize: 24, color: K.ink }}>?</div>;
    const signs = [
      [[Q(0), Q(1), Q(2)], 'Three Doubts to go', 'Not met yet, or just begun', 1.7],
      [[Q(0)], 'One Doubt left', 'One more good chat', 2.5],
      [[<div key="c" style={{ padding: '0 10px', height: 32, background: '#dcd7cd', boxShadow: '0 0 0 3px ' + K.ink, fontFamily: K.pix, fontSize: 24, lineHeight: '28px', color: K.ink }}>···</div>], 'Cooling off', 'Back next phase', 3.6],
      [[<div key="k" style={{ width: 32, height: 32, background: '#70d070', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: K.ink }}>✓</div>], 'Booked', 'Coming to Legacy Day', 5.3]
    ];
const fill = rcFill(lt), marks = [[6, 'Bronze'], [9, 'Silver'], [12, 'Gold']];
    const bob = i => Math.round(Math.sin(T * 2.2 + i)) * 2;
    return (
      <div style={Object.assign({}, DIA, { opacity: o })}>
        <div style={rise(T, a + 0.4)}><Kicker>Read the signs</Kicker></div>
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
        <div style={{ position: 'absolute', left: 604, top: 0, width: 1, height: 590, background: K.divider, transform: 'scaleY(' + MOTION.move(T, a + 0.4, a + 1.6) + ')', transformOrigin: 'top' }}></div>
        <div style={Object.assign({ position: 'absolute', left: 660, top: 0 }, rise(T, a + 7.2))}><Kicker>Medals on Legacy Day</Kicker></div>
        {lt >= 7.2 && (
          <div style={{ position: 'absolute', left: 660, top: 60, width: 624, height: 200, opacity: MOTION.enter(T, a + 7.3, 0.5) }}>
            <div style={{ position: 'absolute', left: 0, right: 0, top: 50, height: 24, border: '3px solid ' + K.ink, background: K.paper }}></div>
            <div style={{ position: 'absolute', left: 3, top: 53, height: 24, width: 618 * fill, background: K.accent }}></div>
            <div style={{ position: 'absolute', left: 0, top: 0, fontFamily: K.pix, fontSize: 24, color: K.n700 }}>0</div>
            {marks.map(m => {
              const x = 624 * m[0] / 12, hit = fill * 12 >= m[0] - 0.01;
              return (
                <React.Fragment key={m[1]}>
                  <div style={{ position: 'absolute', left: x - 1.5, top: 40, width: 3, height: 44, background: K.ink }}></div>
                  <div style={{ position: 'absolute', left: x, top: 0, transform: 'translateX(-50%)', fontFamily: K.pix, fontSize: 24, color: K.text, fontFeatureSettings: '"tnum" 1' }}>{m[0]}</div>
                  <div style={{ position: 'absolute', left: x, top: 96, transform: 'translateX(-50%) scale(' + (hit ? 0.9 + 0.1 * MOTION.pop(T, a + RC_FILL.find(q => q[1] === m[0])[0], 0.4) : 1) + ')', padding: '2px 12px', border: '2px solid ' + (hit ? K.accent : K.divider), background: hit ? K.a100 : 'transparent', fontFamily: K.head, fontWeight: 600, fontSize: 30, lineHeight: '36px', color: K.text }}>{m[1]}</div>
                </React.Fragment>
              );
            })}
            <div style={Object.assign({ position: 'absolute', left: 0, top: 168, fontFamily: K.body, fontSize: 24, color: K.a700, whiteSpace: 'nowrap' }, rise(T, a + 12.45, 10))}>Platinum · all twelve with no backfires</div>
          </div>
        )}
        <div style={Object.assign({ position: 'absolute', left: 660, top: 310, width: 624, borderTop: '1px solid ' + K.divider, paddingTop: 28, display: 'flex', flexDirection: 'column', gap: 12 }, rise(T, a + 13.5, 14))}>
          <Kicker>No game over</Kicker>
          <div style={{ fontFamily: K.body, fontSize: 30, lineHeight: '44px', color: K.text, textWrap: 'pretty' }}>Legacy Day goes ahead with whoever came. The rest get an epilogue card.</div>
        </div>
      </div>
    );
  }

  // ---- 12 share: a progress card sent to a friends' chat ----
  const SH_BOOKED = [0, 1, 2, 3, 4, 5, 11];
  const SH_TO = ['WhatsApp', 'Telegram', 'Instagram story', 'Copy link'];
  const SH_CHAT = [[11.6, 'Wei Ming', 'Wah, 7 already?'], [13.1, 'Priya', 'Gold for me tonight.'], [14.6, 'Mum', 'Send me the link!']];
  const SH_PHONE = { x: 1392, y: 162, w: 380, h: 630 }, SH_MINI = 0.3, SH_VH = 509;
  function ShareCard({ T, a, kit, x, y, s }) {
    const ticks = SH_BOOKED.map((ni, k) => a + 1.4 + k * 0.2), n = ticks.filter(t => T >= t).length;
    const fill = MOTION.move(T, a + 2.9, a + 3.8) * 7 / 12, press = T > a + 5.9 && T < a + 6.25;
    const cur = T > a + 4.6 && T < a + 5.95 && Math.floor(T * 2.5) % 2 === 0;
    return (
      <div style={Object.assign({ position: 'absolute', left: x, top: y, width: 560, height: 560, boxSizing: 'border-box', padding: '26px 30px', background: K.bg, display: 'flex', flexDirection: 'column', gap: 14, transformOrigin: '0 0', transform: s ? 'scale(' + s + ')' : 'none' }, WIN())}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Kicker>Day 4 of 6</Kicker>
          <span style={{ fontFamily: K.head, fontWeight: 700, fontSize: 30, lineHeight: '32px', color: K.text }}>LPA GO!</span>
        </div>
        <div style={{ fontFamily: K.head, fontWeight: 600, fontSize: 56, lineHeight: '60px', color: K.text, fontFeatureSettings: '"tnum" 1' }}>{n} of 12 booked</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', rowGap: 8 }}>
          {kit.neighbours.map((nb, i) => {
            const k = SH_BOOKED.indexOf(i), on = MOTION.pop(T, a + 0.6 + i * 0.06, 0.45), tk = k >= 0 ? MOTION.pop(T, ticks[k], 0.4) : 0;
            return (
              <div key={nb.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: clamp(on * 1.5, 0, 1), transform: 'translateY(' + (1 - on) * 16 + 'px)' }}>
                <div style={{ height: 30, display: 'flex', alignItems: 'flex-end' }}>
                  {k >= 0
                    ? (tk > 0 && <div style={{ width: 28, height: 28, transform: 'scale(' + tk + ')', background: '#70d070', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: K.ink }}>✓</div>)
                    : <div style={{ width: 22, height: 26, background: '#f3ca62', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.pix, fontSize: 18, color: K.ink }}>?</div>}
                </div>
                <img src={nb.url} style={Object.assign({ width: 48, height: 72, opacity: k >= 0 ? 1 : 0.55 }, PIX)} />
              </div>
            );
          })}
        </div>
        <div style={{ position: 'relative', height: 70, marginTop: 6 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 8, height: 16, border: '3px solid ' + K.ink, background: K.paper }}></div>
          <div style={{ position: 'absolute', left: 3, top: 11, height: 16, width: 494 * fill, background: K.accent }}></div>
          {[[6, 'Bronze'], [9, 'Silver'], [12, 'Gold']].map(m => {
            const px = 500 * m[0] / 12, hit = fill * 12 >= m[0] - 0.01, last = m[0] === 12;
            return (
              <React.Fragment key={m[1]}>
                <div style={{ position: 'absolute', left: px - 1.5, top: 2, width: 3, height: 34, background: K.ink }}></div>
                <div style={Object.assign({ position: 'absolute', top: 40, padding: '0 8px', border: '2px solid ' + (hit ? K.accent : K.divider), background: hit ? K.a100 : 'transparent', fontFamily: K.body, fontSize: 24, lineHeight: '26px', color: K.text, whiteSpace: 'nowrap', transform: hit ? 'scale(' + (0.9 + 0.1 * MOTION.pop(T, a + 2.9 + 0.9 * m[0] / 7, 0.4)) + ')' : 'none' }, last ? { right: 0 } : { left: px, marginLeft: -44 })}>{m[1]}</div>
              </React.Fragment>
            );
          })}
        </div>
        <div style={{ marginTop: 'auto', borderTop: '1px solid ' + K.divider, paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: MOTION.enter(T, a + 4.1, 0.5) }}>
          <span style={{ fontFamily: K.body, fontSize: 24, color: K.n700 }}>Fact Cards 11 · Heartland</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 24, color: K.accent, opacity: cur ? 1 : 0 }}>▸</span>
            <span style={{ padding: '4px 18px', background: press ? K.a300 : K.bg, boxShadow: '0 0 0 3px ' + K.accent + ', 0 0 0 6px ' + K.ink, fontFamily: K.pix, fontSize: 24, lineHeight: '30px', color: K.text, transform: press ? 'translateY(2px)' : 'none' }}>Share</span>
          </div>
        </div>
      </div>
    );
  }
  function Share({ T, C, kit }) {
    const a = C.Share, b = C.Finale, o = life(T, a, b + 0.1, 0.5, 0.5);
    if (!(o > 0)) return null;
    const P = SH_PHONE, ph = MOTION.enter(T, a + 7.4, 0.6);
    const sheetP = MOTION.pop(T, a + 6.1, 0.4), sheetO = Math.min(MOTION.enter(T, a + 6.1, 0.2), 1 - MOTION.move(T, a + 8.1, a + 8.4));
    const row = T < a + 6.9 ? 0 : T < a + 7.3 ? 1 : 0, picked = T >= a + 7.7;
    const fp = MOTION.move(T, a + 8.3, a + 9.2), flying = T >= a + 8.3 && T < a + 9.25;
    // the thread stacks from the bottom; each new message slides up and lifts the rest
    const msgs = [{ t: 9.2, own: true, h: 226 }].concat(SH_CHAT.map(c => ({ t: c[0], name: c[1], text: c[2], h: 80 })));
    const pos = [];
    let yb = SH_VH - 12;
    for (let k = msgs.length - 1; k >= 0; k--) {
      const m = msgs[k], p = m.own ? (T >= a + m.t ? 1 : 0) : MOTION.move(T, a + m.t, a + m.t + 0.35);
      pos[k] = { top: yb - m.h * p, p };
      yb -= (m.h + 12) * p;
    }
    const typing = SH_CHAT.find(c => T > a + c[0] - 0.9 && T < a + c[0]);
    const tx = P.x + 14 + 162, ty = P.y + 30 + 69 + (SH_VH - 12 - 226) + 10;
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, opacity: o }}>
        <div style={rise(T, a + 0.1, 30)}><ShareCard T={T} a={a} kit={kit} x={490} y={184} /></div>
        {sheetO > 0 && (
          <div style={Object.assign({ position: 'absolute', left: 1006, top: 384, width: 356, boxSizing: 'border-box', padding: '18px 22px 10px', background: K.bg, opacity: sheetO, transform: 'scale(' + (0.86 + 0.14 * sheetP) + ')', transformOrigin: '0% 100%' }, WIN())}>
            <Kicker>Share to</Kicker>
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8 }}>
              {SH_TO.map((t, k) => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 52, padding: '0 8px', borderTop: '1px solid ' + K.divider, background: picked && k === 0 ? K.a100 : 'transparent', outline: picked && k === 0 ? '2px solid ' + K.accent : 'none', opacity: MOTION.enter(T, a + 6.2 + k * 0.08, 0.25) }}>
                  <span style={{ width: 20, fontSize: 24, color: K.accent, opacity: k === row ? 1 : 0 }}>▸</span>
                  <span style={{ fontFamily: K.body, fontSize: 26, color: K.text, whiteSpace: 'nowrap' }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {ph > 0 && (
          <div style={{ position: 'absolute', left: P.x, top: P.y, width: P.w, height: P.h, background: K.ink, boxShadow: '10px 10px 0 0 rgba(44,42,58,0.18)', opacity: ph, transform: 'translateY(' + (1 - ph) * 40 + 'px)' }}>
            <div style={{ position: 'absolute', left: 160, top: 12, width: 60, height: 6, background: '#55536a' }}></div>
            <div style={{ position: 'absolute', left: 14, top: 30, width: 352, height: 578, background: K.paper, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, width: 352, height: 66, boxSizing: 'border-box', background: K.surface, borderBottom: '3px solid ' + K.ink, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
                <span style={{ fontFamily: K.body, fontSize: 32, color: K.text }}>‹</span>
                <div style={{ flex: 'none', width: 40, height: 40, background: K.a300, boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.pix, fontSize: 24, color: K.ink }}>K</div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontFamily: K.body, fontSize: 26, lineHeight: '28px', color: K.text, whiteSpace: 'nowrap' }}>Kopi kakis</span>
                  <span style={{ fontFamily: K.body, fontSize: 24, lineHeight: '26px', color: typing ? K.a700 : K.n700, whiteSpace: 'nowrap' }}>{typing ? typing[1] + ' is typing…' : '5 members'}</span>
                </div>
              </div>
              <div style={{ position: 'absolute', left: 0, top: 69, width: 352, height: SH_VH, overflow: 'hidden' }}>
                {msgs.map((m, k) => {
                  const q = pos[k];
                  if (q.p <= 0) return null;
                  if (m.own) return (
                    <div key="own" style={{ position: 'absolute', left: 152, top: q.top, width: 188, height: m.h, boxSizing: 'border-box', padding: 10, background: '#f3dfb4', boxShadow: '0 0 0 3px ' + K.accent + ', 0 0 0 6px ' + K.ink, opacity: MOTION.enter(T, a + m.t, 0.15) }}>
                      <div style={{ position: 'relative', width: 168, height: 168 }}><ShareCard T={T} a={a} kit={kit} x={0} y={0} s={SH_MINI} /></div>
                      <div style={{ marginTop: 8, fontFamily: K.body, fontSize: 24, lineHeight: '30px', color: K.text }}>Beat that?</div>
                    </div>
                  );
                  return (
                    <div key={k} style={{ position: 'absolute', left: 15, top: q.top, height: m.h, boxSizing: 'border-box', padding: '10px 16px', background: K.bg, boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', flexDirection: 'column', gap: 4, whiteSpace: 'nowrap', opacity: clamp(q.p * 1.6, 0, 1) }}>
                      <span style={{ fontFamily: K.pix, fontSize: 24, lineHeight: '26px', textTransform: 'uppercase', color: K.a700 }}>{m.name}</span>
                      <span style={{ fontFamily: K.body, fontSize: 24, lineHeight: '30px', color: K.text }}>{m.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {flying && <ShareCard T={T} a={a} kit={kit} x={lerp(490, tx, fp)} y={lerp(184, ty, fp) - Math.sin(Math.PI * fp) * 120} s={lerp(1, SH_MINI, fp)} />}
      </div>
    );
  }

  // ---- sound: one calm music bed for the whole video, dipped under the dialogue, and Lisa's voice-over (lpa-calm-audio.js) ----
  let SOUND = null;
  // every line of the dialogue box, with the moment it leaves the screen (the rule lineAt uses)
  function dialogueLines(C) {
    const talk = C.Demo == null ? [] : TALK.map(q => ({ who: q.who, text: q.text, at: C.Demo + q.at, end: C.Demo + q.at + q.d }));
    return LINES.map((ln, i) => {
      const at = C[ln[0]] + ln[1], nx = LINES[i + 1];
      let end = nx ? C[nx[0]] + nx[1] - 0.25 : C.Finale + 4.6;
      if (ln[3]) end = Math.min(end, at + ln[3]);
      if (ln[4]) end = Math.min(end, C[ln[4][0]] + ln[4][1]);
      return { who: 'Lisa', text: ln[2], at, end };
    }).concat(talk).sort((x, y) => x.at - y.at);
  }
  function SoundTrack({ C }) {
    const { time, playing } = useComposition();
    useEffect(() => { if (SOUND) SOUND.update({ time, playing, lines: dialogueLines(C) }); });
    return null;
  }
  function SoundChip({ dir }) {
    const [s, setS] = useState(null);
    useEffect(() => dir ? dir.subscribe(v => setS(Object.assign({}, v))) : undefined, [dir]);
    if (!s || !s.needsGesture) return null;
    return <button onClick={() => dir.resume()} style={{ position: 'fixed', left: 16, top: 16, zIndex: 20, padding: '8px 14px', background: K.bg, color: K.text, border: 'none', boxShadow: '0 0 0 3px ' + K.ink, fontFamily: K.pix, fontSize: 14, letterSpacing: '0.04em', textTransform: 'uppercase', cursor: 'pointer' }}>Click for sound</button>;
  }

  function Piece({ kit }) {
    const { T, CUES } = useComposition();
    const root = React.useRef(null);
    React.useEffect(() => { const el = root.current && root.current.closest('svg'); if (el) el.setAttribute('data-screen-label', 't=' + Math.floor(T) + 's'); });
    if (!kit) return <div ref={root} style={{ position: 'absolute', inset: 0, background: '#f3f2f2' }}></div>;
    const C = CUES;
    ensureWarp(kit, C);
    return (
      <div ref={root} style={{ position: 'absolute', inset: 0, background: '#e8dcc2', overflow: 'hidden', fontFamily: K.body, color: K.text }}>
        <div style={{ position: 'absolute', left: kit.room.win.x * 4, top: kit.room.win.y * 4, width: kit.room.win.w * 4, height: kit.room.win.h * 4, overflow: 'hidden', background: 'linear-gradient(#8ecae9, #c9e7f5)' }}>
          {[0, 1].map(i => <img key={i} src={kit.clouds} style={Object.assign({ position: 'absolute', left: -((T * 6) % 960) + i * 960, top: 40, width: 960, height: 80 }, PIX)} />)}
        </div>
        <img src={kit.room.url} style={Object.assign({ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080 }, PIX)} />
        <ContentWindow T={T} C={C} />
        <Header T={T} CUES={C} />
        <Shove T={T} C={C} n="Host"><HostCard T={T} C={C} /></Shove>
        <Shove T={T} C={C} n="Town"><Town T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Capacity"><Capacity T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Neighbours"><Neighbours T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Week"><Week T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Games"><Games T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Sports"><Sports T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Recap"><Recap T={T} C={C} kit={kit} /></Shove>
        <Shove T={T} C={C} n="Share"><Share T={T} C={C} kit={kit} /></Shove>
        <Demo T={T} C={C} kit={kit} />
        <TitlePlate T={T} C={C} kit={kit} />
        <PressStart T={T} C={C} />
        <Dialogue T={T} C={C} />
        <Lisa T={T} C={C} kit={kit} />
        <FishGag T={T} C={C} kit={kit} />
        <SoundTrack T={T} C={C} />
      </div>
    );
  }

  function LpaIntroVideo() {
    const [kit, setKit] = useState(null);
    const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { motionEditor: true });
    const [sound, setSound] = useState(null);
    useEffect(() => {
      K = readTokens();
      const load = new Function('u', 'return import(u)');
      load(new URL('lpa-calm-audio.js', document.baseURI).href)
        .then(au => { SOUND = au.createDirector({ base: document.baseURI, scenes: window.OM_SCENES }); setSound(SOUND); })
        .catch(e => console.error('sound failed', e));
      Promise.all([load(new URL('lpa-go-intro-kit.js', document.baseURI).href), document.fonts ? document.fonts.ready : null])
        .then(([m]) => m.buildKit()).then(setKit)
        .catch(e => console.error('intro kit failed', e));
    }, []);
    useEffect(() => { if (sound) sound.set({ vo: t.voice !== false, mus: t.music !== false, musLevel: (t.musLevel ?? 60) / 100, duck: (t.duck ?? 65) / 100 }); }, [sound, t.voice, t.music, t.musLevel, t.duck]);
    if (!K) K = readTokens();
    return (
      <React.Fragment>
        <CompositionStage width={1920} height={1080} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} bg={K.bg}>
          <Piece kit={kit} />
        </CompositionStage>
        <TweaksPanel>
          <TweakSection label="Timeline" />
          <TweakToggle label="Motion editor" value={t.motionEditor} onChange={v => setTweak('motionEditor', v)} />
          <TweakSection label="Sound" />
          <TweakToggle label="Lisa's voice-over" value={t.voice !== false} onChange={v => setTweak('voice', v)} />
          <TweakToggle label="Music" value={t.music !== false} onChange={v => setTweak('music', v)} />
          <TweakSlider label="Music level" value={t.musLevel ?? 60} min={0} max={100} step={5} unit="%" onChange={v => setTweak('musLevel', v)} />
          <TweakSlider label="Music dip under dialogue" value={t.duck ?? 65} min={0} max={90} step={5} unit="%" onChange={v => setTweak('duck', v)} />
        </TweaksPanel>
        <SoundChip dir={sound} />
      </React.Fragment>
    );
  }
  window.LpaIntroVideo = LpaIntroVideo;
})();
