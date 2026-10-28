// Ask Lisa: Donee Talk, a 75-second video in the LPA GO! format. Lisa lives in the Ask Lisa page on a desktop. She jumps
// out to the void deck to ask Mei Ling to be her donee, then talks it through with Ask Lisa on her phone.
// Built on animations-v3.jsx: one tree, every element keyed to T and CUES. Both rooms are the real lpa-lisa-room.js
// stage (desktop and phone layouts), stepped in fixed ticks so any frame can be rebuilt; the UI around them is redrawn.
(function () {
  const { useState, useEffect, useRef, useLayoutEffect } = React;
  const K = {
    bg: '#f6eed8', surface: '#efe4c8', text: '#2c2a3a', accent: '#c8963c', a100: 'rgba(200,150,60,0.16)', a300: '#e8c27e',
    a700: '#8a5a14', n700: '#6b6252', ink: '#2c2a3a', paper: '#fffaf0', divider: 'rgba(44,42,58,0.2)',
    head: '"Pixelify Sans", monospace', pix: '"Silkscreen", "Pixelify Sans", monospace'
  };
  const WIN = () => ({ boxShadow: '0 0 0 4px ' + K.paper + ', 0 0 0 8px ' + K.ink + ', 10px 10px 0 8px rgba(44,42,58,0.18)' });
  const MOTION = {
    enter: (T, a, d) => Easing.easeOutCubic(clamp((T - a) / (d || 0.6), 0, 1)),
    move: (T, a, b) => Easing.easeInOutCubic(clamp((T - a) / (b - a), 0, 1)),
    pop: (T, a, d) => Easing.easeOutBack(clamp((T - a) / (d || 0.45), 0, 1))
  };
  const lerp = (a, b, t) => a + (b - a) * t;
  const life = (T, a, b, fi, fo) => Math.min(MOTION.enter(T, a, fi || 0.5), 1 - MOTION.move(T, b - (fo || 0.4), b));
  const PIX = { imageRendering: 'pixelated', display: 'block', maxWidth: 'none' };
  const SILK = "'Silkscreen', monospace", PXF = "'Pixelify Sans', monospace";
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const MEAS = {};
  const measure = root => { if (root) root.querySelectorAll('[data-mo]').forEach(el => { MEAS[el.getAttribute('data-mo')] = { t: el.offsetTop, h: el.offsetHeight, l: el.offsetLeft, w: el.offsetWidth }; }); };

  const ORDER = ['Desktop', 'Why', 'Phone', 'Demo', 'Finale'];
  // the phone demo, in seconds from the start of its scene (greet: from the start of Phone)
  const PH = { greet: 1.4, tap1: 0.3, type1: [0.6, 4.4], send1: 4.6, ans1: 5.6, tap2: 15.6, type2: [15.8, 17.8], send2: 18.0, ans2: 18.9, swipe: [28.4, 28.9], tap3: 29.2, ans3: 30.0 };
  const Q2 = "She's afraid of making the wrong decision";
  const GREETING = "Hi! I'm Lisa. Thinking of asking someone you trust to be your donee? I can help you start that conversation.";
  const CH_ = { start: 'How do I start the conversation?', next: 'Next starter', worried: "They're worried about something", principles: 'Guiding principles' };
  const STARTERS_C = [CH_.start, CH_.worried, CH_.principles];
  const WORRIES = ['Will I have to pay for you?', 'What if I decide wrong?', "But you're still healthy!", 'Can I really cope?'];

  // Lisa's narration, in the dialogue box (times from the start of each scene)
  const LINES = [
    { s: 'Desktop', at: 1.4, end: 3.85, text: "Hi! I'm Lisa. This is Ask Lisa: Donee Talk." },
    { s: 'Desktop', at: 4.0, end: 8.3, text: "It helps you ask someone to be your donee. Come, I'll show you!" },
    { s: 'Why', at: 0.4, end: 3.2, text: 'Say I want to ask Mei Ling to be my donee.' },
    { s: 'Why', at: 8.3, end: 11.9, text: "Asking isn't easy. She has worries, and I don't know what to say." },
    { s: 'Phone', at: 0.3, end: 2.7, text: 'Ask Lisa works on my phone too.' },
    { s: 'Phone', at: 2.9, end: 5.0, text: 'Let me give you a demonstration!' },
    { s: 'Finale', at: 0.4, end: 5.4, text: 'Asking is easier when you know what to say and how to say it. Try Ask Lisa, on your computer or your phone!' }
  ];
  function lineAt(T, C) {
    for (const l of LINES) { const a = C[l.s] + l.at, b = C[l.s] + l.end; if (T >= a - 0.1 && T < b) return { at: a, until: b, text: l.text, n: Math.floor((T - a) * 46) }; }
    return null;
  }
  // what is said out loud at the void deck; Lisa's lines from the phone are the toolkit's words
  function buildSpeech(TK) {
    const q = id => TK.ITEMS[id].quote;
    return [
      { who: 'lisa', s: 'Why', at: 3.4, end: 5.5, text: 'Mei Ling, will you be my donee?' },
      { who: 'mei', s: 'Why', at: 5.6, end: 11.9, list: WORRIES },
      { who: 'lisa', s: 'Demo', at: 8.2, end: 12.0, text: q('S1'), card: 'S1' },
      { who: 'mei', s: 'Demo', at: 12.3, end: 15.3, text: 'What if I make the wrong decision for you?' },
      { who: 'lisa', s: 'Demo', at: 19.8, end: 25.8, text: q('W2'), card: 'W2' },
      { who: 'mei', s: 'Demo', at: 26.1, end: 28.3, text: 'Okay… but why me?' },
      { who: 'lisa', s: 'Demo', at: 31.6, end: 35.4, text: q('P1'), card: 'P1' },
      { who: 'mei', s: 'Demo', at: 35.7, end: 39.2, text: "Okay. Let's discuss the details." }
    ];
  }
  // the app's answers on the phone, as lpa-lisa-toolkit.js gives them without the model
  function buildPhone(TK) {
    const head = i => TK.SECTIONS[i].title.replace(/^\([ivx]+\)\s*/, ''), typeDur = t => Math.ceil(t.length / 2) * 0.034;
    const msgs = [
      { id: 'g', rel: 'Phone', at: PH.greet, text: GREETING, cards: [] },
      { id: 'a1', rel: 'Demo', at: PH.ans1, text: head(0), cards: ['S1'], next: [CH_.next, CH_.worried], pose: 'present', scroll: 'end' },
      { id: 'a2', rel: 'Demo', at: PH.ans2, text: 'You can say:', cards: ['W2'], next: [TK.ITEMS.W1.chip, TK.ITEMS.W3.chip, CH_.principles], pose: 'present', scroll: 'end' },
      { id: 'a3', rel: 'Demo', at: PH.ans3, text: head(2), cards: ['P1', 'P2', 'P3'], next: [CH_.start, CH_.worried], pose: 'point', scroll: 'P1' }
    ];
    msgs.forEach(m => { m.type = typeDur(m.text); });
    return msgs;
  }

  // a typist's rhythm: a beat after spaces, a longer one after punctuation
  function typeTimes(text, a, b) {
    const r = rng(29), w = [];
    for (let i = 0; i < text.length; i++) { const p = text[i - 1] || ''; w.push(0.7 + 0.6 * r() + (p === ' ' ? 0.35 : 0) + (/[,?.]/.test(p) ? 0.8 : 0)); }
    const tot = w.reduce((s, x) => s + x, 0); let acc = 0;
    return w.map(x => { const at = a + (b - a) * acc / tot; acc += x; return at; });
  }

  const BTN = { background: '#f6eed8', boxShadow: '0 0 0 3px #2c2a3a, 3px 3px 0 3px rgba(44,42,58,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  const Ico = {
    kit: <svg width="14" height="16" viewBox="0 0 14 16" shapeRendering="crispEdges"><path d="M1 1h12v14H1z" fill="#fffaf0" stroke="#2c2a3a" strokeWidth="2"></path><path d="M4 4h6v2H4zM4 8h6v1H4zM4 10h4v1H4z" fill="#c8963c"></path></svg>,
    sound: <svg width="18" height="16" viewBox="0 0 18 16" shapeRendering="crispEdges"><path d="M2 5h3l4-3v12l-4-3H2z" fill="#2c2a3a"></path><path d="M11 6h1v4h-1zM13 4h1v8h-1zM15 2h1v12h-1z" fill="#8a5a14"></path></svg>,
    send: <svg width="16" height="16" viewBox="0 0 16 16" shapeRendering="crispEdges"><path d="M2 7h7V3h1v1h1v1h1v1h1v1h1v2h-1v1h-1v1h-1v1h-1v1H9V9H2z" fill="#2c2a3a"></path></svg>,
    x: <svg width="12" height="12" viewBox="0 0 12 12" shapeRendering="crispEdges"><path d="M1 1h2v1h1v1h1v1h2V3h1V2h1V1h2v2h-1v1h-1v1H8v2h1v1h1v1h1v2H9v-1H8V9H7V8H5v1H4v1H3v1H1V9h1V8h1V7h1V5H3V4H2V3H1z" fill="#2c2a3a"></path></svg>,
    back: <svg width="12" height="14" viewBox="0 0 12 14" shapeRendering="crispEdges"><path d="M7 1h2v2H7zM5 3h2v2H5zM3 5h2v4H3zM5 9h2v2H5zM7 11h2v2H7z" fill="#6b6252"></path></svg>,
    fwd: <svg width="12" height="14" viewBox="0 0 12 14" shapeRendering="crispEdges"><path d="M3 1h2v2H3zM5 3h2v2H5zM7 5h2v4H7zM5 9h2v2H5zM3 11h2v2H3z" fill="#b8ad98"></path></svg>,
    lock: <svg width="12" height="14" viewBox="0 0 12 14" shapeRendering="crispEdges"><path d="M2 6h8v7H2z" fill="#6b6252"></path><path d="M3 6V3h1V2h4v1h1v3H8V3H4v3z" fill="#6b6252"></path><path d="M5 8h2v3H5z" fill="#fffaf0"></path></svg>
  };
  function Chrome() {
    return (
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1280, height: CH, background: K.surface, boxShadow: 'inset 0 -3px 0 ' + K.ink, fontFamily: PXF, color: K.ink }}>
        <div style={{ position: 'absolute', left: 18, top: 12, display: 'flex', gap: 10 }}>
          {['#e2707a', '#e8c27e', '#70d070'].map(c => <span key={c} style={{ width: 11, height: 11, background: c, boxShadow: '0 0 0 2px ' + K.ink }}></span>)}
        </div>
        <div style={{ position: 'absolute', left: 104, top: 5, width: 330, height: 26, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px', background: K.bg, boxShadow: '0 0 0 2px ' + K.ink }}>
          <span style={{ width: 10, height: 10, flex: 'none', background: K.accent, boxShadow: '0 0 0 2px ' + K.ink }}></span>
          <span style={{ fontSize: 14, lineHeight: '16px', whiteSpace: 'nowrap', overflow: 'hidden' }}>Ask Lisa · Talk to your donee</span>
        </div>
        <div style={{ position: 'absolute', left: 18, right: 18, top: 37, height: 26, display: 'flex', alignItems: 'center', gap: 14 }}>
          {Ico.back}{Ico.fwd}
          <div style={{ flex: 1, height: 26, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px', background: K.paper, boxShadow: '0 0 0 2px ' + K.ink }}>
            {Ico.lock}<span style={{ fontSize: 15, lineHeight: '18px', whiteSpace: 'nowrap' }}>asklisa.lpago.sg/donee-talk</span>
          </div>
        </div>
      </div>
    );
  }
  const dotO = (t, delay) => { const p = (((t - delay) % 1.1) + 1.1) % 1.1 / 1.1; return p < 0.35 ? 0.25 + 0.75 * p / 0.35 : p < 0.7 ? 1 - 0.75 * (p - 0.35) / 0.35 : 0.25; };
  // ---- the two rooms: the live Ask Lisa stage, stepped at 60 Hz from t = 0 ----
  function makeRoomSim(R, cfg) {
    const DT = 1 / 60;
    let st = null, cv = null, t = 0, ev = [], ei = 0, status = '', url = '', dirty = true, key = '';
    function reset() {
      cv = document.createElement('canvas'); status = '';
      st = R.createStage(cv, { layout: cfg.layout, tod: 'day', manual: true, clock: { h: 10, m: 10 }, growth: 6, onStatus: s => { status = s; } });
      st.resize(cfg.w, cfg.h, 0, 0, cfg.padR);
      t = 0; ei = 0; dirty = true;
    }
    const apply = () => { while (ei < ev.length && ev[ei][0] <= t + 1e-6) { ev[ei][1](st); ei++; dirty = true; } };
    return {
      events(k, list) { if (k !== key) { key = k; ev = list.slice().sort((a, b) => a[0] - b[0]); st = null; } },
      frame(T) {
        if (!st || T < t - 1e-6) reset();
        apply();
        let n = 0;
        while (t + DT <= T + 1e-6 && n < 20000) { st.step(DT); t += DT; n++; apply(); }
        if (n) dirty = true;
        if (dirty) { st.paint(); url = cv.toDataURL(); dirty = false; }
        return { url, status, w: cv.width, h: cv.height, tf: cv.style.transform || 'none' };
      }
    };
  }
  function deskEvents(C) {
    return [
      [C.Desktop + 1.4, st => { st.setMode('talk', 'present'); st.setTalking(true); }], [C.Desktop + 3.8, st => st.setTalking(false)],
      [C.Desktop + 4.1, st => st.setTalking(true)], [C.Desktop + 8.15, st => st.setTalking(false)],
      [C.Desktop + 8.2, st => st.setMode('hold')], [C.Why - 1.1, st => st.setHidden(true)],
      [C.Finale + 5.0, st => { st.setHidden(false); st.setMode('idle'); st.request('wave'); }]
    ];
  }
  function phoneEvents(C, msgs) {
    const d = x => C.Demo + x, g = msgs[0];
    const out = [[0, st => st.setMode('hold')],
      [C.Phone + g.at, st => { st.setMode('idle'); st.request('wave'); st.setTalking(true); }], [C.Phone + g.at + g.type, st => st.setTalking(false)],
      [d(PH.tap1), st => st.setMode('listen')], [d(PH.send1), st => st.setMode('think')],
      [d(PH.tap2), st => st.setMode('listen')], [d(PH.send2), st => st.setMode('think')], [d(PH.tap3), st => st.setMode('think')]];
    msgs.slice(1).forEach(m => out.push([d(m.at), st => { st.setMode('talk', m.pose); st.setTalking(true); }], [d(m.at + m.type), st => { st.setTalking(false); st.setMode('hold'); }]));
    return out;
  }
  function ensure(kit, C) {
    const k = ORDER.map(n => (+C[n]).toFixed(3)).join(',');
    if (kit.cueKey !== k) { kit.cueKey = k; kit.dsim.events(k, deskEvents(C)); kit.psim.events(k, phoneEvents(C, kit.pmsgs)); }
  }

  // ---- where things sit on the frame ----
  // the desktop page fills the frame; its browser bar sits above it, off the top
  const CH = 72, DFULL = { x: 0, y: 0, s: 1.5 };
  const deskRect = () => DFULL;
  const splitK = (T, C) => MOTION.move(T, C.Phone, C.Phone + 1.0);
  // the void deck: a 1920x1080 world, full frame for Why, then a panel beside the phone
  function plazaCam(T, C) {
    const slide = 1920 * (1 - Easing.easeOutCubic(clamp((T - (C.Why - 0.95)) / 0.8, 0, 1))), k = splitK(T, C);
    return { on: T >= C.Why - 0.95, clip: { x: lerp(0, 24, k) + slide, y: lerp(0, 24, k), w: lerp(1920, 1328, k), h: lerp(1080, 1032, k) }, ox: lerp(0, -236, k) + slide };
  }
  const LISA_W = { cx: 640, feet: 800 }, MEI_W = { cx: 1240, feet: 800 }, PS = 7;
  const PHONE = { x: 1380, y: 32, w: 516, h: 1016, s: 488 / 375 };
  const phoneX = (T, C) => lerp(1960, PHONE.x, Easing.easeOutCubic(clamp((T - (C.Phone + 0.5)) / 0.8, 0, 1)));

  // ---- what the two screens show at T ----
  function deskState(T, C, kit) {
    const fr = kit.dsim.frame(T), away = T >= C.Why - 1.1 && T < C.Finale + 5.0;
    return { room: fr, status: away ? 'Back soon' : (fr.status || 'Saying hi') };
  }
  function phoneState(T, C, kit) {
    const fr = kit.psim.frame(T), d = T - C.Demo, M = kit.pmsgs, abs = m => C[m.rel] + m.at;
    let cur = null; for (const m of M) if (T >= abs(m)) cur = m;
    let lastSend = null; for (const s of [PH.send1, PH.send2, PH.tap3]) if (d >= s) lastSend = C.Demo + s;
    const thinking = lastSend != null && (!cur || abs(cur) < lastSend);
    let shown = '', hidden = '', cards = [], typing = false, scroll = 0, ring = null;
    if (cur && !thinking) {
      const n = Math.min(cur.text.length, 2 * Math.floor((T - abs(cur)) / 0.034));
      shown = cur.text.slice(0, n); hidden = cur.text.slice(n); typing = n < cur.text.length;
      if (!typing) cards = cur.cards;
      const mc = MEAS['pb:' + cur.id], mx = mc ? Math.max(0, mc.h - 188) : 0, pk = cur.scroll && cur.scroll !== 'end' ? MEAS['pk:' + cur.scroll] : null;
      const tgt = cur.scroll === 'end' ? mx : pk ? clamp(pk.t, 0, mx) : 0;
      scroll = tgt * Easing.easeInOutCubic(clamp((T - (abs(cur) + cur.type + 0.4)) / 0.6, 0, 1));
      const sp = kit.speech.find(s => s.card && T >= C[s.s] + s.at - 0.3 && T < C[s.s] + s.end);
      if (sp && cur.cards.includes(sp.card)) ring = sp.card;
    }
    const busy = thinking || (typing && cur.id !== 'g');
    const chips = busy ? [] : (cur && cur.next ? cur.next : STARTERS_C);
    const c3 = MEAS['pch:2'], chipsMax = c3 ? Math.max(0, c3.l + c3.w - 347 + 6) : 120;
    const chipsX = cur && cur.id === 'a2' ? chipsMax * MOTION.move(d, PH.swipe[0], PH.swipe[1]) : 0;
    let text = '', lastKey = -9, ta = null;
    if (d >= PH.type1[0] && d < PH.send1) ta = [kit.typeQ1, kit.TK.HEADLINE];
    else if (d >= PH.type2[0] && d < PH.send2) ta = [kit.typeQ2, Q2];
    if (ta) { let n = 0; while (n < ta[0].length && ta[0][n] <= d) n++; text = ta[1].slice(0, n); lastKey = n ? ta[0][n - 1] : -9; }
    const f1 = d >= PH.tap1 && d < PH.send1, f2 = d >= PH.tap2 && d < PH.send2, tapAt = f1 ? PH.tap1 : PH.tap2;
    const chip3 = [14 + (c3 ? c3.l + c3.w / 2 : 260) - chipsMax, 664];
    const taps = [[PH.tap1, 158, 727], [PH.send1, 338, 727], [PH.tap2, 158, 727], [PH.send2, 338, 727], [PH.tap3, chip3[0], chip3[1]]]
      .map(([t, x, y]) => ({ u: d - t, x, y })).filter(q => q.u >= 0 && q.u < 0.5);
    return {
      room: fr, status: fr.status || 'All ears', bubble: thinking || !!cur, thinking, dotT: d, id: cur ? cur.id : '', shown, hidden, cards, scroll, ring,
      chips, chipsX, input: text, caret: (f1 || f2) && (d - lastKey < 0.45 || Math.floor((d - tapAt) / 0.53) % 2 === 0),
      sendO: text && !busy ? 1 : 0.55, sendDown: (d >= PH.send1 && d < PH.send1 + 0.14) || (d >= PH.send2 && d < PH.send2 + 0.14), taps
    };
  }

  function Card({ it, mo, ring }) {
    return (
      <div data-mo={mo} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', background: ring ? '#fbeccb' : '#f6eed8', boxShadow: ring ? '0 0 0 3px #c8963c, 0 0 0 6px #2c2a3a' : '0 0 0 2px #c8963c' }}>
        <span style={{ fontFamily: SILK, fontSize: 10, lineHeight: '13px', letterSpacing: '0.06em', color: '#8a5a14' }}>{it.kicker}</span>
        <span style={{ fontSize: 16, lineHeight: '22px', textWrap: 'pretty' }}>{it.quote}</span>
        {it.note ? <span style={{ fontSize: 13, lineHeight: '18px', color: '#6b6252', textWrap: 'pretty' }}>{it.note}</span> : null}
        <span style={{ alignSelf: 'flex-start', minHeight: 36, display: 'flex', alignItems: 'center', background: '#fffaf0', boxShadow: '0 0 0 2px #2c2a3a', padding: '0 12px', fontFamily: SILK, fontSize: 10 }}>Let's try this!</span>
      </div>
    );
  }
  const Badge = ({ status }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '7px 12px 7px 10px', background: '#f6eed8', boxShadow: '0 0 0 3px #2c2a3a, 4px 4px 0 3px rgba(44,42,58,0.18)', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, background: '#c8963c', boxShadow: '0 0 0 2px #2c2a3a', flex: 'none' }}></span>
        <span style={{ fontFamily: SILK, fontSize: 13, lineHeight: '14px', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>ASK LISA</span>
      </div>
      <span style={{ fontSize: 12, lineHeight: '14px', color: '#6b6252', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{status}</span>
    </div>
  );
  const Chip = ({ t, mo }) => <div data-mo={mo} style={{ flex: 'none', height: 44, padding: '0 14px', display: 'flex', alignItems: 'center', background: '#f6eed8', boxShadow: '0 0 0 2px #2c2a3a, 3px 3px 0 2px rgba(44,42,58,0.16)', fontSize: 15, lineHeight: '18px', whiteSpace: 'nowrap' }}>{t}</div>;
  function InputRow({ text, caret, sendO, sendDown }) {
    return (
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: 0, height: 46, boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '0 12px', background: '#fffaf0', boxShadow: '0 0 0 3px #2c2a3a, 4px 4px 0 3px rgba(44,42,58,0.18)' }}>
          <div style={{ flex: 1, minWidth: 0, height: 24, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
            {text ? <span style={{ flex: 'none', whiteSpace: 'pre', fontSize: 16, lineHeight: '20px' }}>{text}</span> : null}
            <span style={{ flex: 'none', width: 2, height: 19, marginLeft: 1, background: K.ink, opacity: caret ? 1 : 0 }}></span>
            {text ? null : <span style={{ flex: 'none', whiteSpace: 'nowrap', fontSize: 16, lineHeight: '20px', color: 'rgba(44,42,58,0.42)' }}>Ask Lisa, or type what they said…</span>}
            <span style={{ flex: '1 1 auto', minWidth: 0 }}></span>
          </div>
        </div>
        <div style={Object.assign({}, BTN, { width: 46, height: 46, flex: 'none', background: '#c8963c', boxShadow: '0 0 0 3px #2c2a3a, 4px 4px 0 3px rgba(44,42,58,0.18)', opacity: sendO, transform: sendDown ? 'translate(2px,2px)' : 'none' })}>{Ico.send}</div>
      </div>
    );
  }
  const RoomImg = ({ fr }) => fr.url ? <img src={fr.url} style={Object.assign({ position: 'absolute', left: 0, top: 0, width: fr.w * 3, height: fr.h * 3, transform: fr.tf }, PIX)} /> : null;
  function Actions({ kit, style }) {
    return [['can', 'Water'], ['mug', 'Tea'], ['book', 'Read']].map(([ic, label], i) => {
      const p = kit.icons[ic];
      return (
        <div key={ic} style={Object.assign({}, BTN, { position: 'absolute', top: style.top + i * 64, width: 50, height: 50, flexDirection: 'column', gap: 2 }, style.left != null ? { left: style.left } : { right: style.right })}>
          <img src={p.url} style={Object.assign({ width: p.w * 2, height: p.h * 2 }, PIX)} />
          <span style={{ fontFamily: SILK, fontSize: 8, lineHeight: '9px', color: '#6b6252' }}>{label}</span>
        </div>
      );
    });
  }

  // ---- the desktop page: DoneeTalkToolkit's desktop layout at 1280x720, with the greeting it shows on load ----
  function DeskView({ ds, kit }) {
    return (
      <div style={{ position: 'absolute', left: 0, top: CH, width: 1280, height: 720, overflow: 'hidden', background: '#e8dcc2', fontFamily: PXF, color: K.ink }}>
        <RoomImg fr={ds.room} />
        <div style={{ position: 'absolute', left: 14, top: 8 }}><Badge status={ds.status} /></div>
        <div style={Object.assign({}, BTN, { position: 'absolute', left: 698, top: 10, width: 108, height: 44, gap: 6, fontFamily: SILK, fontSize: 12 })}>{Ico.kit}<span>Toolkit</span></div>
        <div style={Object.assign({}, BTN, { position: 'absolute', left: 816, top: 10, width: 44, height: 44 })}>{Ico.sound}</div>
        <Actions kit={kit} style={{ left: 16, top: 288 }} />
        <div style={{ position: 'absolute', left: 878, top: 26, width: 384, height: 676, background: '#f6eed8', boxShadow: '0 0 0 3px #fffaf0, 0 0 0 6px #2c2a3a, 7px 7px 0 6px rgba(44,42,58,0.18)' }}>
          <div style={{ position: 'absolute', left: 14, right: 14, top: 24, fontSize: 15, lineHeight: '21px', textWrap: 'pretty' }}>{GREETING}</div>
          <div style={{ position: 'absolute', left: 14, top: -19, padding: '5px 12px', background: '#c8963c', boxShadow: '0 0 0 3px #2c2a3a', fontFamily: SILK, fontSize: 13, lineHeight: '14px', letterSpacing: '0.06em' }}>LPA LISA</div>
        </div>
        <div style={{ position: 'absolute', left: 892, right: 32, bottom: 30, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10, overflow: 'hidden', padding: '4px 4px 8px 4px', margin: '0 -4px' }}>{STARTERS_C.map(c => <Chip key={c} t={c} />)}</div>
          <InputRow text="" caret={false} sendO={0.55} />
        </div>
      </div>
    );
  }
  function Desktop({ T, C, kit }) {
    const late = T >= C.Finale + 5.6;
    if (!(T < C.Why - 0.12 || late)) return null;
    const B = deskRect(T, C), ds = deskState(T, C, kit), o = late ? MOTION.enter(T, C.Finale + 5.6, 1.0) : 1;
    const top = B.y - CH * B.s;
    return (
      <div style={{ position: 'absolute', inset: 0, opacity: o }}>
        <div style={{ position: 'absolute', left: B.x, top, width: 1280, height: 720 + CH, transform: 'scale(' + B.s + ')', transformOrigin: '0 0', overflow: 'hidden' }}>
          <Chrome />
          <DeskView ds={ds} kit={kit} />
        </div>
      </div>
    );
  }

  // ---- the phone: the same page in DoneeTalkToolkit's phone layout, 375x760 with the browser bar ----
  function PhoneView({ ph, kit }) {
    const ref = useRef(null);
    useLayoutEffect(() => measure(ref.current));
    const TK = kit.TK;
    return (
      <div ref={ref} style={{ position: 'relative', width: 375, height: 760, overflow: 'hidden', background: '#2c2a3a', fontFamily: PXF, color: K.ink }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 375, height: 24, boxSizing: 'border-box', padding: '0 18px', background: '#f7f5f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}>
          <span>9:41</span>
          <span style={{ display: 'flex', alignItems: 'flex-end', gap: 3 }}>
            {[5, 8, 11].map(hh => <span key={hh} style={{ width: 4, height: hh, background: K.ink }}></span>)}
            <span style={{ width: 20, height: 10, marginLeft: 6, boxShadow: '0 0 0 2px ' + K.ink, background: 'linear-gradient(90deg, #2c2a3a 70%, transparent 70%)' }}></span>
          </span>
        </div>
        <div style={{ position: 'absolute', left: 0, top: 24, width: 375, height: 40, background: '#f7f5f0', boxShadow: 'inset 0 -2px 0 ' + K.ink }}>
          <div style={{ position: 'absolute', left: 10, right: 10, top: 6, height: 26, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', background: '#ebe7de', boxShadow: '0 0 0 2px ' + K.ink }}>
            {Ico.lock}<span style={{ fontSize: 14, lineHeight: '16px', whiteSpace: 'nowrap' }}>asklisa.lpago.sg/donee-talk</span>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, top: 64, width: 375, height: 696, overflow: 'hidden', background: '#e8dcc2' }}>
          <RoomImg fr={ph.room} />
          <div style={{ position: 'absolute', left: 14, right: 14, top: 8, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <Badge status={ph.status} />
            <div style={{ display: 'flex', gap: 10, paddingTop: 2, flex: 'none' }}>
              <div style={Object.assign({}, BTN, { height: 44, padding: '0 12px', gap: 6, fontFamily: SILK, fontSize: 12 })}>{Ico.kit}<span>Toolkit</span></div>
              <div style={Object.assign({}, BTN, { width: 44, height: 44 })}><svg width="18" height="16" viewBox="0 0 18 16" shapeRendering="crispEdges"><path d="M2 2h14v9H9v2H8v1H6v-3H2z" fill="#fffaf0" stroke="#2c2a3a" strokeWidth="2"></path><path d="M5 5h8v1H5zM5 8h5v1H5z" fill="#8a5a14"></path></svg></div>
              <div style={Object.assign({}, BTN, { width: 44, height: 44 })}>{Ico.sound}</div>
            </div>
          </div>
          <Actions kit={kit} style={{ right: 14, top: 320 }} />
          {ph.bubble ? (
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 422, display: 'flex', flexDirection: 'column' }}>
              <div style={{ background: '#fffaf0', boxShadow: '0 0 0 3px #2c2a3a, 5px 5px 0 3px rgba(44,42,58,0.18)', padding: '12px 14px', maxHeight: 212, boxSizing: 'border-box', overflow: 'hidden' }}>
                {ph.thinking ? (
                  <div style={{ display: 'flex', gap: 7, padding: '4px 0' }}>{[0, 0.18, 0.36].map(dl => <span key={dl} style={{ width: 8, height: 8, background: '#8a5a14', opacity: dotO(ph.dotT, dl) }}></span>)}</div>
                ) : (
                  <div data-mo={'pb:' + ph.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 9, transform: ph.scroll ? 'translateY(' + (-ph.scroll) + 'px)' : 'none' }}>
                    <div style={{ fontSize: 15, lineHeight: '21px', textWrap: 'pretty' }}><span>{ph.shown}</span><span style={{ opacity: 0 }}>{ph.hidden}</span></div>
                    {ph.cards.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{ph.cards.map(id => <Card key={id} it={TK.item(id)} mo={'pk:' + id} ring={ph.ring === id} />)}</div> : null}
                  </div>
                )}
              </div>
              <div style={{ position: 'relative', left: 161, width: 26, height: 14, marginTop: -1 }}><svg width="26" height="14" viewBox="0 0 26 14" shapeRendering="crispEdges" style={{ display: 'block' }}><path d="M2 0h20v3h-3v3h-3v3h-3v3H9V0z" fill="#2c2a3a"></path><path d="M5 0h14v2h-3v3h-3v3h-2V0z" fill="#fffaf0"></path></svg></div>
            </div>
          ) : null}
          <div style={{ position: 'absolute', left: 14, right: 14, bottom: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ph.chips.length ? (
              <div style={{ overflow: 'hidden', padding: '4px 4px 8px 4px', margin: '0 -4px' }}>
                <div style={{ display: 'flex', gap: 10, transform: ph.chipsX ? 'translateX(' + (-ph.chipsX) + 'px)' : 'none' }}>{ph.chips.map((c, i) => <Chip key={c} t={c} mo={'pch:' + i} />)}</div>
              </div>
            ) : null}
            <InputRow text={ph.input} caret={ph.caret} sendO={ph.sendO} sendDown={ph.sendDown} />
          </div>
        </div>
      </div>
    );
  }
  function Phone({ T, C, kit }) {
    if (T < C.Phone + 0.5 || T >= C.Finale + 6.7) return null;
    const ph = phoneState(T, C, kit), x = phoneX(T, C), s = PHONE.s;
    return (
      <div style={{ position: 'absolute', left: x, top: PHONE.y, width: PHONE.w, height: PHONE.h, background: K.ink, boxShadow: '0 0 0 4px ' + K.paper + ', 0 0 0 8px ' + K.ink + ', 12px 12px 0 8px rgba(44,42,58,0.2)' }}>
        <div style={{ position: 'absolute', left: 14, top: 14, width: 488, height: 988, overflow: 'hidden' }}>
          <div style={{ width: 375, height: 760, transform: 'scale(' + s + ')', transformOrigin: '0 0' }}><PhoneView ph={ph} kit={kit} /></div>
          {ph.taps.map((q, i) => {
            const k = q.u / 0.5, sz = (18 + 56 * Easing.easeOutCubic(k));
            return <div key={i} style={{ position: 'absolute', left: q.x * s - sz / 2, top: q.y * s - sz / 2, width: sz, height: sz, boxShadow: '0 0 0 4px ' + K.paper + ', 0 0 0 7px ' + K.ink, opacity: 1 - k }}></div>;
          })}
        </div>
      </div>
    );
  }

  // ---- the void deck: Lisa and Mei Ling, in a 1920x1080 world ----
  function Person({ fr, cx, b, flip, T, talking, pose, ph, phone, squat }) {
    const s = PS, w = 44 * s, h = 48 * s, bob = talking ? -Math.abs(Math.sin(T * 7.5 + ph)) * 6 : Math.round(Math.sin(T * 2.2 + ph)) * 3;
    const mouth = talking ? [1, 2, 1, 0][Math.floor(T * 9 + ph * 3) % 4] : 0, blink = ((T + ph) % 3.1) < 0.13 ? 1 : 0;
    let p = pose; if (p === 'wave') p = 'wave' + (Math.floor(T * 5) % 2);
    const sq = squat || 1, sw = 2 - sq, top = b - h * sq + bob, left = cx - w * sw / 2;
    return (
      <React.Fragment>
        <div style={{ position: 'absolute', left: cx - 95, top: b - 14, width: 190, height: 24, borderRadius: '50%', background: 'rgba(45,43,43,0.2)' }}></div>
        <img src={fr[p][0][mouth][blink]} style={Object.assign({ position: 'absolute', left, top, width: w * sw, height: h * sq, transform: flip ? 'scaleX(-1)' : 'none' }, PIX)} />
        {phone ? (
          <div style={{ position: 'absolute', left: left + 39 * s - 24, top: top + 24 * s - 30, width: 48, height: 74, background: K.ink, boxShadow: '0 0 0 3px ' + K.paper + ', 0 0 0 6px ' + K.ink, transform: 'rotate(-6deg)' }}>
            <div style={{ position: 'absolute', left: 6, top: 8, right: 6, bottom: 12, background: '#a2d6f0', boxShadow: 'inset 0 6px 0 #d8f2ff' }}></div>
          </div>
        ) : null}
      </React.Fragment>
    );
  }
  const TAIL = <svg width="36" height="20" viewBox="0 0 26 14" shapeRendering="crispEdges" style={{ display: 'block' }}><path d="M2 0h20v3h-3v3h-3v3h-3v3H9V0z" fill="#2c2a3a"></path><path d="M5 0h14v2h-3v3h-3v3h-2V0z" fill="#fffaf0"></path></svg>;
  function Bubble({ x, tipY, w, o, sc, tail, flip, big, children }) {
    return (
      <div style={{ position: 'absolute', left: x, bottom: 1080 - tipY, width: w, opacity: o, transform: 'scale(' + sc + ')', transformOrigin: (tail + 18) + 'px 100%' }}>
        <div style={{ background: K.paper, boxShadow: '0 0 0 4px ' + K.ink + ', 6px 6px 0 4px rgba(44,42,58,0.18)', padding: '18px 26px', fontFamily: K.head, fontSize: big ? 42 : 34, lineHeight: big ? '54px' : '44px', color: K.ink, textWrap: 'pretty' }}>{children}</div>
        <div style={{ position: 'relative', left: tail, width: 36, marginTop: -2, transform: flip ? 'scaleX(-1)' : 'none' }}>{TAIL}</div>
      </div>
    );
  }
  function speechAt(T, C, kit) {
    return kit.speech.map(sp => {
      const a = C[sp.s] + sp.at, b = C[sp.s] + sp.end;
      if (T < a - 0.1 || T >= b) return null;
      const len = sp.text ? sp.text.length : 0, cps = Math.max(30, len / 2.0), n = clamp(Math.floor((T - a) * cps), 0, len);
      return Object.assign({ a, b, n, o: life(T, a - 0.05, b, 0.2, 0.25), sc: 0.85 + 0.15 * MOTION.pop(T, a - 0.05, 0.35), typing: sp.list ? sp.list.some((t, i) => T >= a + 0.2 + i * 0.6 && T < a + 0.75 + i * 0.6) : n < len }, sp);
    }).filter(Boolean);
  }
  function lisaPose(T, C) {
    const w = T - C.Why;
    if (T >= C.Finale) return { pose: T - C.Finale < 5.2 ? 'wave' : 'idle' };
    if (T >= C.Phone + 0.4) return { pose: 'present', phone: true };
    if (w >= 8.3) return { pose: 'think' };
    if (w >= 3.4 && w < 5.6) return { pose: 'present' };
    return { pose: 'idle' };
  }
  function meiPose(T, C) {
    const w = T - C.Why, d = T - C.Demo;
    if (T >= C.Finale) return T - C.Finale < 1.6 ? 'cheer' : 'idle';
    if (d >= 35.7) return 'present';
    if ((d >= 12.3 && d < 15.3) || (d >= 26.1 && d < 28.3)) return 'think';
    if (T >= C.Phone) return 'idle';
    return w >= 4.8 ? 'think' : 'idle';
  }
  function Plaza({ T, C, kit }) {
    const cam = plazaCam(T, C);
    if (!cam.on) return null;
    const cl = cam.clip, sp = speechAt(T, C, kit), L = lineAt(T, C), d = T - C.Demo, w = T - C.Why;
    const lisaTalk = sp.some(q => q.who === 'lisa' && q.typing) || (T >= C.Why - 0.2 && L && L.n < L.text.length);
    const meiTalk = sp.some(q => q.who === 'mei' && q.typing), lp = lisaPose(T, C), landed = T >= C.Why - 0.15;
    const lu = T - (C.Why - 0.15), sq = lu < 0.26 ? 1 - 0.18 * Math.sin(Math.PI * clamp(lu / 0.26, 0, 1)) : 1, dust = lu < 0.45 ? lu / 0.45 : -1;
    const head = LISA_W.feet - 48 * PS, q = life(w, 5.0, 5.8, 0.15, 0.2), qS = MOTION.pop(w, 5.0, 0.3);
    return (
      <div style={Object.assign({ position: 'absolute', left: cl.x, top: cl.y, width: cl.w, height: cl.h, overflow: 'hidden', background: K.ink }, WIN())}>
        <div style={{ position: 'absolute', left: cam.ox - cl.x, top: -cl.y, width: 1920, height: 1080 }}>
          <img src={kit.plaza.url} style={Object.assign({ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080 }, PIX)} />
          <Person fr={kit.people.meiLing} cx={MEI_W.cx} b={MEI_W.feet} flip T={T} talking={meiTalk} pose={meiPose(T, C)} ph={1.3} />
          {landed ? <Person fr={kit.lisaHD} cx={LISA_W.cx} b={LISA_W.feet} T={T} talking={lisaTalk} pose={lp.pose} phone={lp.phone} ph={0} squat={sq} /> : null}
          {landed && dust >= 0 && [-1, 1].map(sd => [0, 1, 2].map(k => {
            const sz = (16 - k * 3) * (1 - dust);
            return <div key={sd + '' + k} style={{ position: 'absolute', left: LISA_W.cx + sd * (70 + dust * (90 + k * 50)) - sz / 2, top: LISA_W.feet - 18 - dust * (18 + k * 16) - sz / 2, width: sz, height: sz, background: K.paper, boxShadow: '0 0 0 3px ' + K.ink, opacity: 1 - dust }}></div>;
          }))}
          {q > 0 && <div style={{ position: 'absolute', left: MEI_W.cx - 26, top: head - 84, width: 52, height: 62, opacity: q, transform: 'scale(' + qS + ')', transformOrigin: '50% 100%', background: K.paper, boxShadow: '0 0 0 4px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.head, fontWeight: 700, fontSize: 48, color: K.a700 }}>?</div>}
          {d >= 36.0 && d < 38.8 && [0, 1, 2].map(i => {
            const u = clamp((d - 36.0 - i * 0.35) / 2.0, 0, 1), sz = 44;
            return u > 0 ? <img key={i} src={kit.heart} style={Object.assign({ position: 'absolute', left: 900 + (i - 1) * 70 + Math.sin(u * 6 + i) * 12 - sz / 2, top: 470 - u * 220, width: sz, height: sz, opacity: Math.min(1, u * 5) * (1 - u) }, PIX)} /> : null;
          })}
          {sp.map((s, i) => {
            const me = s.who === 'mei', cx = me ? MEI_W.cx : LISA_W.cx, x = me ? cx - 380 : cx - 220, body = s.list
              ? s.list.map((t, j) => { const at = s.a + 0.2 + j * 0.6, k = MOTION.enter(T, at, 0.25); return T >= at ? <div key={t} style={{ height: 54 * k, overflow: 'hidden', opacity: k, whiteSpace: 'nowrap' }}>{t}</div> : null; })
              : <React.Fragment><span>{s.text.slice(0, s.n)}</span><span style={{ opacity: 0 }}>{s.text.slice(s.n)}</span></React.Fragment>;
            return <Bubble key={i} x={x} tipY={head - 14} w={600} o={s.o} sc={s.sc} tail={cx - x - 18} flip={me} big={s.list || s.text.length < 110}>{body}</Bubble>;
          })}
        </div>
      </div>
    );
  }
  // her one jump: out of the desktop page and onto the void deck
  function LisaLeap({ T, C, kit }) {
    const t0 = C.Why - 1.1, t1 = C.Why - 0.15;
    if (T < t0 || T >= t1) return null;
    const B = deskRect(T, C), cam = plazaCam(T, C), k = Easing.easeInOutSine((T - t0) / (t1 - t0));
    const A = { cx: B.x + 560 * B.s, b: B.y + 662 * B.s, w: 264 * B.s }, Z = { cx: LISA_W.cx + cam.ox, b: LISA_W.feet, w: 44 * PS };
    const cx = lerp(A.cx, Z.cx, k), b = lerp(A.b, Z.b, k) - Math.sin(Math.PI * k) * 260, w = lerp(A.w, Z.w, k), h = w * 48 / 44;
    return <img src={kit.lisaHD.cheer[0][0][0]} style={Object.assign({ position: 'absolute', left: cx - w / 2, top: b - h, width: w, height: h }, PIX)} />;
  }

  // ---- the dialogue box: Lisa's narration ----
  function Dialogue({ T, C }) {
    const L = lineAt(T, C);
    if (!L) return null;
    const o = Math.min(MOTION.enter(T, L.at - 0.1, 0.25), 1 - MOTION.move(T, L.until - 0.2, L.until));
    if (o <= 0) return null;
    const k = T >= C.Finale + 5.6 ? 0 : splitK(T, C), shown = L.text.slice(0, Math.max(0, L.n)), done = L.n >= L.text.length;
    // over the desktop page the box sits high, clear of Lisa and the chat panel
    const box = T < C.Why - 1 ? { left: 64, width: 1180, top: 130, height: 186 } : { left: lerp(160, 54, k), width: lerp(1600, 1268, k), top: lerp(846, 856, k), height: lerp(186, 170, k) };
    return (
      <div style={Object.assign({ position: 'absolute', opacity: o, transform: 'translateY(' + (1 - MOTION.enter(T, L.at - 0.1, 0.35)) * 24 + 'px)' }, box)}>
        <div style={Object.assign({ position: 'absolute', inset: 0, background: K.bg }, WIN())}></div>
        <div style={{ position: 'absolute', left: 36, top: -30, padding: '6px 18px', background: K.accent, boxShadow: '0 0 0 4px ' + K.ink, fontFamily: K.pix, fontSize: 28, lineHeight: '32px', color: K.ink }}>LPA Lisa</div>
        <div style={{ position: 'absolute', left: 48, right: 90, top: lerp(34, 30, k), fontFamily: K.head, fontSize: lerp(44, 40, k), lineHeight: lerp(60, 54, k) + 'px', color: K.text, textWrap: 'pretty', fontVariantLigatures: 'none' }}>
          <span>{shown}</span><span style={{ opacity: 0 }}>{L.text.slice(Math.max(0, L.n))}</span>
        </div>
        {done && <div style={{ position: 'absolute', right: 34, bottom: 24 + (Math.floor(T * 2.5) % 2) * 6, fontSize: 24, color: K.accent }}>▼</div>}
      </div>
    );
  }

  // ---- sound: one calm music bed for the whole video, dipped under the dialogue, and Lisa's voice-over (lpa-calm-audio.js) ----
  let SOUND = null;
  // Lisa's narration and both speech bubbles at the void deck; Mei Ling's four worries are one bubble
  function dialogueLines(C, kit) {
    const out = LINES.map(l => ({ who: 'Lisa', text: l.text, at: C[l.s] + l.at, end: C[l.s] + l.end }));
    for (const s of kit.speech) out.push({ who: s.who === 'mei' ? 'Mei Ling' : 'Lisa', text: s.list ? s.list.join(' / ') : s.text, at: C[s.s] + s.at + (s.list ? 0.2 : 0), end: C[s.s] + s.end });
    return out.sort((a, b) => a.at - b.at);
  }
  function SoundTrack({ C, kit }) {
    const { time, playing } = useComposition();
    useEffect(() => { if (SOUND) SOUND.update({ time, playing, lines: dialogueLines(C, kit) }); });
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
    const root = useRef(null);
    useEffect(() => { const el = root.current && root.current.closest('svg'); if (el) el.setAttribute('data-screen-label', 't=' + Math.floor(T) + 's'); });
    if (!kit) return <div ref={root} style={{ position: 'absolute', inset: 0, background: '#e8dcc2' }}></div>;
    const C = CUES, late = T >= C.Finale + 5.6;
    ensure(kit, C);
    return (
      <div ref={root} style={{ position: 'absolute', inset: 0, background: '#e8dcc2', overflow: 'hidden', fontFamily: K.head, color: K.text }}>
        {late ? null : <Desktop T={T} C={C} kit={kit} />}
        <Plaza T={T} C={C} kit={kit} />
        <Phone T={T} C={C} kit={kit} />
        <Dialogue T={T} C={C} />
        <LisaLeap T={T} C={C} kit={kit} />
        {late ? <Desktop T={T} C={C} kit={kit} /> : null}
        <SoundTrack T={T} C={C} kit={kit} />
      </div>
    );
  }

  const HEART = ['.oo.oo.', 'oRRoRRo', 'oRWRRRo', 'oRRRRRo', '.oRRRo.', '..oRo..', '...o...'];
  function heartImg() {
    const cv = document.createElement('canvas'); cv.width = 7; cv.height = 7; const g = cv.getContext('2d');
    HEART.forEach((r, y) => r.split('').forEach((c, x) => { if (c === '.') return; g.fillStyle = c === 'o' ? K.ink : c === 'W' ? '#ffd0d8' : '#e2707a'; g.fillRect(x, y, 1, 1); }));
    return cv.toDataURL();
  }
  function buildVideoKit(HK, R, TK0) {
    // the video's own wording; the Ask Lisa app keeps lpa-lisa-toolkit.js as is
    const ITEMS = Object.assign({}, TK0.ITEMS, {
      W2: Object.assign({}, TK0.ITEMS.W2, { quote: TK0.ITEMS.W2.quote.replace('and they guide you', 'and let them guide you') }),
      P1: Object.assign({}, TK0.ITEMS.P1, { quote: "I am asking because I trust you. I believe you will decide what's best for me." })
    });
    const TK = Object.assign({}, TK0, { ITEMS, HEADLINE: TK0.HEADLINE.replace('with trusted people', 'with someone I trust') });
    const host = HK.buildHostKit(), icons = {};
    ['can', 'mug', 'book'].forEach(k => { icons[k] = R.propIcon(k); });
    return Object.assign(host, {
      TK, icons, pmsgs: buildPhone(TK), speech: buildSpeech(TK),
      typeQ1: typeTimes(TK.HEADLINE, PH.type1[0], PH.type1[1]), typeQ2: typeTimes(Q2, PH.type2[0], PH.type2[1]),
      dsim: makeRoomSim(R, { layout: 'web', w: 1280, h: 720, padR: 408 }), psim: makeRoomSim(R, { layout: 'phone', w: 375, h: 696, padR: 0 }),
      people: HK.buildPeople(['meiLing']), plaza: HK.plazaScene(240, 135), heart: heartImg()
    });
  }
  function LpaDoneeTalkVideo3() {
    const [kit, setKit] = useState(null);
    const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { motionEditor: true });
    const [sound, setSound] = useState(null);
    useEffect(() => {
      const load = new Function('u', 'return import(u)'), url = p => new URL(p, document.baseURI).href;
      load(url('lpa-calm-audio.js'))
        .then(au => { SOUND = au.createDirector({ base: document.baseURI, scenes: window.OM_SCENES }); setSound(SOUND); })
        .catch(e => console.error('sound failed', e));
      Promise.all([load(url('lpa-go-intro-kit.js')), load(url('lpa-lisa-room.js')), load(url('lpa-lisa-toolkit.js')), document.fonts ? document.fonts.ready : null])
        .then(([HK, R, TK]) => setKit(buildVideoKit(HK, R, TK)))
        .catch(e => console.error('Donee Talk video kit failed', e));
    }, []);
    useEffect(() => { if (sound) sound.set({ vo: t.voice !== false, mus: t.music !== false, musLevel: (t.musLevel ?? 60) / 100, duck: (t.duck ?? 65) / 100 }); }, [sound, t.voice, t.music, t.musLevel, t.duck]);
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
  window.LpaDoneeTalkVideo3 = LpaDoneeTalkVideo3;
})();
