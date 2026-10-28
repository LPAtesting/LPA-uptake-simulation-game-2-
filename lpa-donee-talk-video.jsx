// Ask Lisa: Donee Talk, a 90-second video in the LPA GO! format. Lisa introduces the toolkit page from outside it,
// then jumps in for a live demo: someone types a question and she answers with the toolkit, word for word.
// Built on animations-v3.jsx: one tree, every element keyed to T and CUES. The page's room is the real
// lpa-lisa-room.js stage, stepped in fixed ticks so any frame can be rebuilt; its chat UI is redrawn here.
(function () {
  const { useState, useEffect, useRef, useLayoutEffect } = React;
  const K = {
    bg: '#f6eed8', surface: '#efe4c8', text: '#2c2a3a', accent: '#c8963c', a100: 'rgba(200,150,60,0.16)', a300: '#e8c27e',
    a700: '#8a5a14', n300: '#d8ccb0', n700: '#6b6252', ink: '#2c2a3a', paper: '#fffaf0', divider: 'rgba(44,42,58,0.2)',
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
  const rise = (T, a, px) => ({ opacity: MOTION.enter(T, a, 0.6), transform: 'translateY(' + ((1 - MOTION.enter(T, a, 0.7)) * (px || 24)) + 'px)' });
  const PIX = { imageRendering: 'pixelated', display: 'block', maxWidth: 'none' };
  const SILK = "'Silkscreen', monospace", PXF = "'Pixelify Sans', monospace";
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const Kicker = ({ children, style }) => <div style={Object.assign({ fontFamily: K.pix, fontSize: 24, lineHeight: '30px', letterSpacing: '0.02em', textTransform: 'uppercase', color: K.a700 }, style)}>{children}</div>;

  const ORDER = ['Page', 'Why', 'Ask', 'Demo', 'Finale'];
  const LABELS = { Page: '01 · The page', Why: '02 · Why it helps', Ask: '03 · How it works', Demo: '04 · Live demo', Finale: '05 · Your turn' };
  // the demo, in seconds from the start of its scene
  const D = { leap: 2.2, land: 3.1, greet: 3.3, click: 5.7, typeA: 6.0, typeB: 10.6, send: 11.3, answer: 12.5, out: 39.7 };
  const GREETING = "Hi! I'm Lisa. Thinking of asking someone you trust to be your donee? I can help you start that conversation.";
  const STARTERS_C = ['How do I start the conversation?', "They're worried about something", 'Guiding principles'];
  const NEXT_C = ['They worry about caring for me or paying', "They're afraid of the wrong decision"];

  // Lisa's lines. top: said from inside the page, shown at the top of the frame
  const LINES = [
    { s: 'Page', at: 3.3, text: "Hi! I'm Lisa. This is my web page, Ask Lisa: Donee Talk.", pose: 'wave' },
    { s: 'Why', at: 0.7, text: 'It helps you ask someone you trust to be your donee.', pose: 'present' },
    { s: 'Why', at: 4.5, text: 'Your donee makes decisions for you if you ever lose mental capacity.', pose: 'point' },
    { s: 'Why', at: 8.9, text: "Asking is a big conversation, and many people don't know how to start.", pose: 'present' },
    { s: 'Why', at: 13.1, text: 'And the person you ask may have worries of their own.', pose: 'think' },
    { s: 'Ask', at: 0.5, text: 'Type your question, or what they said to you.', pose: 'point' },
    { s: 'Ask', at: 4.0, text: 'I answer with lines from the toolkit, word for word.', pose: 'present' },
    { s: 'Ask', at: 7.7, text: 'Starters for the talk, replies to their worries, and principles.', pose: 'present' },
    { s: 'Ask', at: 11.4, text: 'Copy any line to use it. The whole toolkit is always here.', pose: 'point' },
    { s: 'Demo', at: 0.3, text: 'Let me show you. In I go!', pose: 'cheer', dur: 2.0 },
    { s: 'Demo', at: 5.0, text: 'Say you want to ask someone. Type your question.', top: true, end: 11.0 },
    { s: 'Demo', at: 12.6, text: 'Five conversation starters, to open the talk.', top: true, end: 23.4 },
    { s: 'Demo', at: 23.9, text: "If they have worries, there's a reply for each.", top: true, end: 33.0 },
    { s: 'Demo', at: 33.5, text: 'And three principles to guide the conversation.', top: true, end: 37.6 },
    { s: 'Finale', at: 0.3, text: 'Asking is easier when you know what to say. Try Ask Lisa!', pose: 'present' },
    { s: 'Finale', at: 4.9, text: 'So, who will you ask?', pose: 'point' }
  ];
  function lineAt(T, C) {
    let cur = null;
    for (let i = 0; i < LINES.length; i++) { const at = C[LINES[i].s] + LINES[i].at; if (T >= at) cur = { i, at }; }
    if (!cur) return null;
    const ln = LINES[cur.i], nx = LINES[cur.i + 1];
    let until = nx ? C[nx.s] + nx.at - 0.25 : C.Finale + 6.9;
    if (ln.dur) until = Math.min(until, cur.at + ln.dur);
    if (ln.end != null) until = Math.min(until, C[ln.s] + ln.end);
    const n = Math.floor((T - cur.at) * 46);
    return { i: cur.i, at: cur.at, until, text: ln.text, pose: ln.pose, top: !!ln.top, n, typing: n < ln.text.length && T < until };
  }

  // ---- the demo conversation: the typed question, then the toolkit in three answers ----
  function buildScript(TK) {
    const GAP = [2.1, 2.0, 1.2], POSE = ['present', 'present', 'point'];
    const msgs = [{ id: 'g', role: 'lisa', text: GREETING, at: D.greet, type: 0, cards: [] }, { id: 'q', role: 'user', text: TK.HEADLINE, at: D.send, type: 0, cards: [] }];
    let t = D.answer;
    TK.SECTIONS.forEach((s, k) => {
      const lead = s.title.replace(/^\([ivx]+\)\s*/, ''), type = Math.ceil(lead.length / 2) * 0.034, c0 = t + type + 0.05;
      msgs.push({ id: 'm' + k, role: 'lisa', text: lead, at: t, type, pose: POSE[k], cards: s.ids.map((id, i) => ({ id, at: c0 + i * GAP[k] })) });
      t = c0 + s.ids.length * GAP[k];
    });
    return { msgs, end: t };
  }
  // a typist's rhythm: a beat after spaces, a longer one after punctuation
  function typeTimes(text, a, b) {
    const r = rng(29), w = [];
    for (let i = 0; i < text.length; i++) { const p = text[i - 1] || ''; w.push(0.7 + 0.6 * r() + (p === ' ' ? 0.35 : 0) + (/[,?.]/.test(p) ? 0.8 : 0)); }
    const tot = w.reduce((s, x) => s + x, 0); let acc = 0;
    return w.map(x => { const at = a + (b - a) * acc / tot; acc += x; return at; });
  }

  // ---- the page's room: the live Ask Lisa stage, stepped at 60 Hz from t = 0 ----
  function makeRoomSim(R) {
    const DT = 1 / 60;
    let st = null, cv = null, t = 0, ev = [], ei = 0, status = '', url = '', dirty = true, key = '';
    function reset() {
      cv = document.createElement('canvas'); status = '';
      st = R.createStage(cv, { layout: 'web', tod: 'day', manual: true, clock: { h: 10, m: 10 }, growth: 6, onStatus: s => { status = s; } });
      st.resize(1280, 720, 0, 0, 384 + 24);
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
  function simEvents(C, S) {
    const d = x => C.Demo + x;
    const out = [[0, st => { st.setHidden(true); st.setMode('hold'); }],
      [d(D.land), st => { st.setHidden(false); st.setMode('idle'); st.request('wave'); }],
      [d(D.greet), st => st.setTalking(true)], [d(D.greet + 2.4), st => st.setTalking(false)],
      [d(D.click), st => st.setMode('listen')], [d(D.send), st => st.setMode('think')]];
    S.msgs.filter(m => m.pose).forEach(m => out.push([d(m.at), st => { st.setMode('talk', m.pose); st.setTalking(true); }], [d(m.at + m.type), st => st.setTalking(false)]));
    out.push([d(S.end), st => st.setMode('hold')], [d(D.out), st => st.setHidden(true)]);
    return out;
  }
  function ensure(kit, C) {
    const k = ORDER.map(n => (+C[n]).toFixed(3)).join(',');
    if (kit.cueKey !== k) { kit.cueKey = k; kit.sim.events(k, simEvents(C, kit.script)); }
  }

  // ---- where the browser sits: the page's top-left on the frame, and its scale (page is 1280x720) ----
  const CH = 72;
  const FULL = { x: 0, y: 0, s: 1.5 }, HOME = { x: 618, y: 216, s: 0.8 }, ASKR = { x: 941, y: 251, s: 0.69 }, ZOOM = { x: 1920 - 1280 * 1.7, y: 1080 - 720 * 1.7, s: 1.7 };
  const mixB = (a, b, k) => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), s: lerp(a.s, b.s, k) });
  function browserRect(T, C) {
    const d = T - C.Demo;
    if (T < C.Why - 1) return mixB(FULL, HOME, MOTION.move(T, C.Page + 1.4, C.Page + 2.8));
    if (T < C.Ask - 1) return { x: HOME.x + 1400 * Easing.easeInCubic(clamp((T - (C.Why - 0.45)) / 0.75, 0, 1)), y: HOME.y, s: HOME.s };
    if (T < C.Demo) return { x: lerp(1960, ASKR.x, Easing.easeOutCubic(clamp((T - (C.Ask - 0.25)) / 0.85, 0, 1))), y: ASKR.y, s: ASKR.s };
    if (d < 3.0) return mixB(ASKR, HOME, MOTION.move(T, C.Demo, C.Demo + 0.9));
    if (d < 5.0) return mixB(HOME, FULL, MOTION.move(T, C.Demo + D.land, C.Demo + 3.9));
    if (d < 20) return mixB(FULL, ZOOM, MOTION.move(T, C.Demo + 5.6, C.Demo + 6.4));
    if (d < 38.7) return mixB(ZOOM, FULL, MOTION.move(T, C.Demo + 37.8, C.Demo + 38.6));
    if (T < C.Finale + 6) return mixB(FULL, HOME, MOTION.move(T, C.Demo + 38.8, C.Demo + 39.6));
    return mixB(HOME, FULL, MOTION.move(T, C.Finale + 6.9, C.Finale + 8.3));
  }
  function demoCover(T, C) { return MOTION.enter(T, C.Demo + D.land, 0.4) * (1 - MOTION.move(T, C.Demo + 38.8, C.Demo + 39.2)); }

  // ---- what the page shows at T ----
  const MEAS = {};
  function pageState(T, C, kit) {
    const S = kit.script, d = T - C.Demo, a = T - C.Ask, fr = kit.sim.frame(T);
    const inRoom = d >= D.land && d < D.out;
    const clear = T >= C.Finale + 7.2 ? MOTION.move(T, C.Finale + 7.2, C.Finale + 7.8) : 0;
    const live = d >= 0 && clear < 1, busy = live && d >= D.send && d < S.end;
    const log = S.msgs.map(m => {
      const on = live && d >= m.at;
      let shown = '', hidden = m.text;
      if (on) { const n = m.type ? Math.min(m.text.length, 2 * Math.floor((d - m.at) / 0.034)) : m.text.length; shown = m.text.slice(0, n); hidden = m.text.slice(n); }
      return { id: m.id, role: m.role, text: m.text, on, shown, hidden, cards: m.cards.map(c => { const k = live ? MOTION.enter(d, c.at, 0.3) : 0; return { id: c.id, o: k, dy: k >= 1 ? 0 : (1 - k) * 10 }; }) };
    });
    // the log follows its newest line, easing up to make room just before each one appears
    const bot = k => { const m = MEAS[k]; return m ? m.t + m.h : 0; };
    const blocks = [[D.greet, bot('g'), 128], [D.send, bot('q') + 29, 76]];
    S.msgs.forEach(m => { if (!m.pose) return; blocks.push([m.at, bot(m.id + ':lead'), 76]); m.cards.forEach(c => blocks.push([c.at, bot('c:' + c.id), 76])); });
    blocks.push([S.end, blocks[blocks.length - 1][1], 128]);
    let scroll = 0;
    if (live) {
      let i = -1; for (let j = 0; j < blocks.length; j++) if (d >= blocks[j][0] - 0.4) i = j;
      const tg = j => j < 0 ? 0 : Math.max(0, blocks[j][1] + blocks[j][2] - 676);
      if (i >= 0) scroll = lerp(tg(i - 1), tg(i), Easing.easeInOutCubic(clamp((d - blocks[i][0] + 0.4) / 0.45, 0, 1)));
    }
    // the typed question
    const ta = kit.typeAt, Q = kit.TK.HEADLINE;
    let n = 0; if (d >= D.typeA && d < D.send) while (n < ta.length && ta[n] <= d) n++;
    const focused = d >= D.click && d < D.send, lastKey = n ? ta[n - 1] : -9;
    let chips = live && d >= S.end ? NEXT_C : STARTERS_C, chipsO = busy ? 0 : 1;
    if (clear > 0) { chips = clear < 0.5 ? NEXT_C : STARTERS_C; chipsO = Math.abs(1 - 2 * clear); }
    // the Toolkit sheet, opened from outside during How it works
    const inAsk = a >= 4.9 && a < 14.6;
    const sO = inAsk ? Math.min(MOTION.enter(a, 4.95, 0.3), 1 - MOTION.move(a, 14.15, 14.45)) : 0;
    const sDy = !inAsk ? 560 : a < 14.15 ? (1 - Easing.easeOutCubic(clamp((a - 4.95) / 0.32, 0, 1))) * 560 : Easing.easeInCubic(clamp((a - 14.15) / 0.35, 0, 1)) * 560;
    const maxS = Math.max(0, (MEAS.sheetC ? MEAS.sheetC.h : 0) - 483), sec = k => clamp(MEAS[k] ? MEAS[k].t - 4 : 0, 0, maxS);
    const sScroll = inAsk ? lerp(lerp(0, sec('sec1'), Easing.easeInOutCubic(clamp((a - 8.1) / 0.7, 0, 1))), sec('sec2'), Easing.easeInOutCubic(clamp((a - 9.6) / 0.7, 0, 1))) : 0;
    const sy0 = 173 + sDy + 64 - sScroll, rect = k => { const m = MEAS[k]; return m ? [280 + m.l, sy0 + m.t, m.w, m.h] : null; };
    const rCopy = rect('s:P1:copy');
    return {
      room: fr, status: inRoom ? (fr.status || 'Saying hi') : 'Back soon',
      log, logO: 1 - clear, scroll, logPad: busy ? 76 : 128, dots: live && d >= D.send + 0.1 && d < D.answer ? d : null, dotsTop: bot('q') + 13,
      input: n ? Q.slice(0, n) : '', focused, caret: focused && (d - lastKey < 0.45 || Math.floor((d - D.click) / 0.53) % 2 === 0),
      sendO: n && !busy ? 1 : 0.55, sendDown: d >= D.send && d < D.send + 0.14, chips, chipsO, tkDown: a >= 4.85 && a < 4.99,
      sheet: { o: sO, dy: sDy, scroll: sScroll, copied: a >= 12.05 && a < 13.65 ? 'P1' : null, down: a >= 12.05 && a < 12.19 ? 'P1' : null, closeDown: a >= 14.1 && a < 14.24 },
      rInput: [892, 644, 356, 46], rS1: rect('s:S1'), rCopy, p1copy: rCopy ? [rCopy[0] + rCopy[2] / 2, rCopy[1] + rCopy[3] / 2] : null
    };
  }

  // ---- the page, redrawn from DoneeTalkToolkit's desktop layout at its native 1280x720 ----
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
  function Card({ it, mo, o, dy, copied, down }) {
    return (
      <div data-mo={mo} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 12px', background: '#f6eed8', boxShadow: '0 0 0 2px #c8963c', opacity: o == null ? 1 : o, transform: dy ? 'translateY(' + dy + 'px)' : 'none' }}>
        <span style={{ fontFamily: SILK, fontSize: 10, lineHeight: '13px', letterSpacing: '0.06em', color: '#8a5a14' }}>{it.kicker}</span>
        <span style={{ fontSize: 16, lineHeight: '22px', textWrap: 'pretty' }}>{it.quote}</span>
        {it.note ? <span style={{ fontSize: 13, lineHeight: '18px', color: '#6b6252', textWrap: 'pretty' }}>{it.note}</span> : null}
        <span data-mo={mo + ':copy'} style={{ alignSelf: 'flex-start', minHeight: 36, display: 'flex', alignItems: 'center', background: down ? '#efe4c8' : '#fffaf0', boxShadow: '0 0 0 2px #2c2a3a', padding: '0 12px', fontFamily: SILK, fontSize: 10, transform: down ? 'translate(1px,1px)' : 'none' }}>{copied ? 'Copied' : 'Copy line'}</span>
      </div>
    );
  }
  const dotO = (t, delay) => { const p = (((t - delay) % 1.1) + 1.1) % 1.1 / 1.1; return p < 0.35 ? 0.25 + 0.75 * p / 0.35 : p < 0.7 ? 1 - 0.75 * (p - 0.35) / 0.35 : 0.25; };
  function PageView({ ps, kit }) {
    const ref = useRef(null);
    useLayoutEffect(() => {
      const root = ref.current; if (!root) return;
      root.querySelectorAll('[data-mo]').forEach(el => { MEAS[el.getAttribute('data-mo')] = { t: el.offsetTop, h: el.offsetHeight, l: el.offsetLeft, w: el.offsetWidth }; });
    });
    const TK = kit.TK, fr = ps.room, sh = ps.sheet, shOn = sh.o > 0 ? 'visible' : 'hidden';
    const tab = sel => ({ padding: '7px 12px', fontFamily: SILK, fontSize: 12, lineHeight: '15px', letterSpacing: '0.04em', color: K.ink, background: sel ? '#e8c27e' : '#fffaf0', boxShadow: '0 0 0 2px #2c2a3a' });
    return (
      <div ref={ref} style={{ position: 'absolute', left: 0, top: CH, width: 1280, height: 720, overflow: 'hidden', background: '#e8dcc2', fontFamily: PXF, color: K.ink }}>
        {fr.url ? <img src={fr.url} style={Object.assign({ position: 'absolute', left: 0, top: 0, width: fr.w * 3, height: fr.h * 3, transform: fr.tf }, PIX)} /> : null}
        <div style={{ position: 'absolute', left: 14, top: 8, display: 'flex', flexDirection: 'column', gap: 3, padding: '7px 12px 7px 10px', background: '#f6eed8', boxShadow: '0 0 0 3px #2c2a3a, 4px 4px 0 3px rgba(44,42,58,0.18)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, background: '#c8963c', boxShadow: '0 0 0 2px #2c2a3a', flex: 'none' }}></span>
            <span style={{ fontFamily: SILK, fontSize: 13, lineHeight: '14px', letterSpacing: '0.08em' }}>ASK LISA</span>
          </div>
          <span style={{ fontSize: 12, lineHeight: '14px', color: '#6b6252', whiteSpace: 'nowrap' }}>{ps.status}</span>
        </div>
        <div style={Object.assign({}, BTN, { position: 'absolute', left: 698, top: 10, width: 108, height: 44, gap: 6, fontFamily: SILK, fontSize: 12, transform: ps.tkDown ? 'translate(2px,2px)' : 'none' })}>{Ico.kit}<span>Toolkit</span></div>
        <div style={Object.assign({}, BTN, { position: 'absolute', left: 816, top: 10, width: 44, height: 44 })}>{Ico.sound}</div>
        {[['can', 'Water'], ['mug', 'Tea'], ['book', 'Read']].map(([ic, label], i) => {
          const p = kit.icons[ic];
          return (
            <div key={ic} style={Object.assign({}, BTN, { position: 'absolute', left: 16, top: 288 + i * 64, width: 50, height: 50, flexDirection: 'column', gap: 2 })}>
              <img src={p.url} style={Object.assign({ width: p.w * 2, height: p.h * 2 }, PIX)} />
              <span style={{ fontFamily: SILK, fontSize: 8, lineHeight: '9px', color: '#6b6252' }}>{label}</span>
            </div>
          );
        })}
        <div style={{ position: 'absolute', left: 878, top: 26, width: 384, height: 676, background: '#f6eed8', boxShadow: '0 0 0 3px #fffaf0, 0 0 0 6px #2c2a3a, 7px 7px 0 6px rgba(44,42,58,0.18)' }}>
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative', padding: '24px 14px ' + ps.logPad + 'px', display: 'flex', flexDirection: 'column', gap: 13, transform: 'translateY(' + (-ps.scroll) + 'px)', opacity: ps.logO }}>
              {ps.log.map(m => m.role === 'user'
                ? <div key={m.id} data-mo={m.id} style={{ alignSelf: 'flex-end', maxWidth: '84%', padding: '8px 11px', background: '#efe4c8', boxShadow: '0 0 0 2px #2c2a3a', fontSize: 14, lineHeight: '19px', opacity: m.on ? 1 : 0 }}>{m.text}</div>
                : (
                  <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 7, maxWidth: '96%', opacity: m.on ? 1 : 0 }}>
                    <div data-mo={m.id === 'g' ? 'g' : m.id + ':lead'} style={{ fontSize: 15, lineHeight: '21px', textWrap: 'pretty' }}><span>{m.shown}</span><span style={{ opacity: 0 }}>{m.hidden}</span></div>
                    {m.cards.length ? <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{m.cards.map(c => <Card key={c.id} it={TK.item(c.id)} mo={'c:' + c.id} o={c.o} dy={c.dy} />)}</div> : null}
                  </div>
                ))}
              {ps.dots != null ? (
                <div style={{ position: 'absolute', left: 14, top: ps.dotsTop, display: 'flex', gap: 7, padding: '4px 0' }}>
                  {[0, 0.18, 0.36].map(dl => <span key={dl} style={{ width: 8, height: 8, background: '#8a5a14', opacity: dotO(ps.dots, dl) }}></span>)}
                </div>
              ) : null}
            </div>
          </div>
          <div style={{ position: 'absolute', left: 14, top: -19, padding: '5px 12px', background: '#c8963c', boxShadow: '0 0 0 3px #2c2a3a', fontFamily: SILK, fontSize: 13, lineHeight: '14px', letterSpacing: '0.06em' }}>LPA LISA</div>
        </div>
        <div style={{ position: 'absolute', left: 892, right: 32, bottom: 30, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ps.chipsO > 0 ? (
            <div style={{ display: 'flex', gap: 10, overflow: 'hidden', padding: '4px 4px 8px 4px', margin: '0 -4px', opacity: ps.chipsO }}>
              {ps.chips.map(c => <div key={c} style={{ flex: 'none', height: 44, padding: '0 14px', display: 'flex', alignItems: 'center', background: '#f6eed8', boxShadow: '0 0 0 2px #2c2a3a, 3px 3px 0 2px rgba(44,42,58,0.16)', fontSize: 15, lineHeight: '18px', whiteSpace: 'nowrap' }}>{c}</div>)}
            </div>
          ) : null}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: 0, height: 46, boxSizing: 'border-box', display: 'flex', alignItems: 'center', padding: '0 12px', background: '#fffaf0', boxShadow: '0 0 0 3px #2c2a3a, 4px 4px 0 3px rgba(44,42,58,0.18)' }}>
              <div style={{ flex: 1, minWidth: 0, height: 24, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                {ps.input ? <span style={{ flex: 'none', whiteSpace: 'pre', fontSize: 16, lineHeight: '20px' }}>{ps.input}</span> : null}
                <span style={{ flex: 'none', width: 2, height: 19, marginLeft: 1, background: K.ink, opacity: ps.caret ? 1 : 0 }}></span>
                {ps.input ? null : <span style={{ flex: 'none', whiteSpace: 'nowrap', fontSize: 16, lineHeight: '20px', color: 'rgba(44,42,58,0.42)' }}>Ask Lisa, or type what they said…</span>}
                <span style={{ flex: '1 1 auto', minWidth: 0 }}></span>
              </div>
            </div>
            <div style={Object.assign({}, BTN, { width: 46, height: 46, flex: 'none', background: '#c8963c', boxShadow: '0 0 0 3px #2c2a3a, 4px 4px 0 3px rgba(44,42,58,0.18)', opacity: ps.sendO, transform: ps.sendDown ? 'translate(2px,2px)' : 'none' })}>{Ico.send}</div>
          </div>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(44,42,58,0.4)', opacity: sh.o, visibility: shOn }}></div>
        <div style={{ position: 'absolute', left: 280, top: 173, width: 720, height: 547, display: 'flex', flexDirection: 'column', background: '#f6eed8', boxShadow: '0 -3px 0 0 #2c2a3a, 0 -6px 0 0 #fffaf0, 0 -9px 0 0 #2c2a3a', transform: 'translateY(' + sh.dy + 'px)', visibility: shOn }}>
          <div style={{ height: 64, flex: 'none', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 10, padding: '18px 16px 12px' }}>
            <span style={tab(false)}>Chat</span><span style={tab(true)}>Toolkit</span>
            <span style={{ flex: 1 }}></span>
            <span style={Object.assign({}, BTN, { width: 34, height: 34, background: sh.closeDown ? '#efe4c8' : '#fffaf0', boxShadow: '0 0 0 2px #2c2a3a' })}>{Ico.x}</span>
          </div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
            <div data-mo="sheetC" style={{ position: 'relative', padding: '4px 16px 20px', display: 'flex', flexDirection: 'column', gap: 12, transform: 'translateY(' + (-sh.scroll) + 'px)' }}>
              <p style={{ margin: 0, fontSize: 18, lineHeight: '24px', textWrap: 'pretty' }}>{TK.HEADLINE}</p>
              {TK.SECTIONS.map((s, i) => (
                <div key={i} data-mo={'sec' + i} style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 8 }}>
                  <span style={{ fontSize: 15, lineHeight: '20px', fontWeight: 600, color: '#8a5a14', textWrap: 'pretty' }}>{s.title}</span>
                  {s.ids.map(id => <Card key={id} it={TK.item(id)} mo={'s:' + id} copied={sh.copied === id} down={sh.down === id} />)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }
  function Browser({ B, ps, kit }) {
    if (B.x > 1930 || B.x + 1280 * B.s < -10) return null;
    const ch = CH * B.s;
    return (
      <React.Fragment>
        <div style={Object.assign({ position: 'absolute', left: B.x, top: B.y - ch, width: 1280 * B.s, height: 720 * B.s + ch, background: K.ink }, WIN())}></div>
        <div style={{ position: 'absolute', left: B.x, top: B.y - ch, width: 1280, height: 720 + CH, transform: 'scale(' + B.s + ')', transformOrigin: '0 0', overflow: 'hidden' }}>
          <Chrome />
          <PageView ps={ps} kit={kit} />
        </div>
      </React.Fragment>
    );
  }

  // ---- the pointer, the click marks and the callout rings (frame coordinates, mapped off the page) ----
  const CURSOR = ['X...........', 'XX..........', 'XWX.........', 'XWWX........', 'XWWWX.......', 'XWWWWX......', 'XWWWWWX.....', 'XWWWWWWX....', 'XWWWWWWWX...', 'XWWWWWWWWX..', 'XWWWWWXXXXX.', 'XWWXWWX.....', 'XWX.XWWX....', 'XX..XWWX....', 'X....XWWX...', '.....XWWX...', '......XX....'];
  function cursorImg() {
    const cv = document.createElement('canvas'); cv.width = 12; cv.height = 17; const g = cv.getContext('2d');
    CURSOR.forEach((r, y) => r.split('').forEach((c, x) => { if (c === '.') return; g.fillStyle = c === 'X' ? K.ink : K.paper; g.fillRect(x, y, 1, 1); }));
    return cv.toDataURL();
  }
  function track(t, pts) {
    if (t <= pts[0][0]) return [pts[0][1], pts[0][2]];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; if (t < b[0]) { const k = Easing.easeInOutCubic((t - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k)]; } }
    const z = pts[pts.length - 1]; return [z[1], z[2]];
  }
  function pointerAt(T, C, ps) {
    const a = T - C.Ask, d = T - C.Demo;
    let pts, clicks, o, t;
    if (a > 0 && a < 15) {
      const cp = ps.p1copy || [460, 420];
      pts = [[0.3, 1160, 560], [1.2, 1040, 667], [4.1, 1040, 667], [4.75, 752, 32], [5.5, 752, 32], [6.2, 640, 470], [11.2, 640, 470], [11.9, cp[0], cp[1]], [13.4, cp[0], cp[1]], [14.0, 967, 208]];
      clicks = [4.85, 12.05, 14.1]; t = a; o = life(a, 0.3, 14.8, 0.3, 0.3);
    } else if (d > 4.9 && d < 12.6) {
      pts = [[5.0, 1150, 790], [5.6, 1010, 670], [6.1, 1010, 670], [6.5, 1075, 706], [10.7, 1075, 706], [11.15, 1225, 667], [11.6, 1225, 667], [12.4, 1290, 790]];
      clicks = [D.click, D.send]; t = d; o = life(d, 5.0, 12.4, 0.2, 0.4);
    } else return null;
    const [x, y] = track(t, pts), c = clicks.map(k => t - k).filter(u => u >= 0 && u < 0.45);
    return { x, y, o, press: c.some(u => u < 0.14), burst: c.length ? c[0] : -1 };
  }
  function Pointer({ T, C, B, ps, kit }) {
    const P = pointerAt(T, C, ps);
    if (!P || P.o <= 0) return null;
    const vx = B.x + P.x * B.s, vy = B.y + P.y * B.s, u = Math.max(2.2, 1.7 * B.s), k = P.burst / 0.45;
    return (
      <React.Fragment>
        {P.burst >= 0 && [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
          const ang = i / 8 * Math.PI * 2, r = 8 + 34 * Easing.easeOutCubic(k), sz = 8 * (1 - k);
          return <div key={i} style={{ position: 'absolute', left: vx + Math.cos(ang) * r - sz / 2, top: vy + Math.sin(ang) * r - sz / 2, width: sz, height: sz, background: K.accent, boxShadow: '0 0 0 2px ' + K.ink, opacity: P.o * (1 - k) }}></div>;
        })}
        <img src={kit.cursor} style={Object.assign({ position: 'absolute', left: vx, top: vy, width: 12 * u, height: 17 * u, opacity: P.o, transformOrigin: '0 0', transform: P.press ? 'scale(0.86)' : 'none', filter: 'drop-shadow(3px 3px 0 rgba(44,42,58,0.25))' }, PIX)} />
      </React.Fragment>
    );
  }
  function Rings({ T, C, B, ps }) {
    const a = T - C.Ask;
    if (a < 0 || a > 15) return null;
    return [['01', ps.rInput, 0.6, 4.0], ['02', ps.rS1, 5.5, 7.6], ['03', ps.rCopy, 11.6, 13.5]].map(([tag, r, t0, t1]) => {
      if (!r) return null;
      const o = life(a, t0, t1, 0.25, 0.3);
      if (o <= 0) return null;
      const p = MOTION.pop(a, t0, 0.4), pad = 8;
      return (
        <div key={tag} style={{ position: 'absolute', left: B.x + r[0] * B.s - pad, top: B.y + r[1] * B.s - pad, width: r[2] * B.s + pad * 2, height: r[3] * B.s + pad * 2, opacity: o, transform: 'scale(' + (0.92 + 0.08 * p) + ')' }}>
          <div style={{ position: 'absolute', inset: 0, boxShadow: '0 0 0 4px ' + K.accent + ', 0 0 0 7px ' + K.ink }}></div>
          <div style={{ position: 'absolute', left: -7, top: -44, padding: '2px 10px', background: K.accent, boxShadow: '0 0 0 3px ' + K.ink, fontFamily: K.pix, fontSize: 24, lineHeight: '30px', color: K.ink }}>{tag}</div>
        </div>
      );
    });
  }

  // ---- the set: header, the cream window behind the explainers, and the explainers themselves ----
  function Backdrop({ T, kit }) {
    const w = kit.room.win;
    return (
      <React.Fragment>
        <div style={{ position: 'absolute', left: w.x * 4, top: w.y * 4, width: w.w * 4, height: w.h * 4, overflow: 'hidden', background: 'linear-gradient(#8ecae9, #c9e7f5)' }}>
          {[0, 1].map(i => <img key={i} src={kit.clouds} style={Object.assign({ position: 'absolute', left: -((T * 6) % 960) + i * 960, top: 40, width: 960, height: 80 }, PIX)} />)}
        </div>
        <img src={kit.room.url} style={Object.assign({ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080 }, PIX)} />
      </React.Fragment>
    );
  }
  function Header({ T, C }) {
    const o = Math.min(MOTION.enter(T, C.Page + 2.6, 0.6), 1 - MOTION.move(T, C.Finale + 6.8, C.Finale + 7.4)) * (1 - demoCover(T, C));
    if (o <= 0) return null;
    return (
      <div style={{ position: 'absolute', left: 96, right: 96, top: 44, height: 64, opacity: o }}>
        <div style={Object.assign({ position: 'absolute', left: 0, top: 0, height: 64, display: 'flex', alignItems: 'center', gap: 22, padding: '0 22px', background: K.bg }, WIN())}>
          <span style={{ fontFamily: K.head, fontWeight: 700, fontSize: 40, color: K.text }}>LPA GO!</span>
          <span style={{ fontFamily: K.pix, fontSize: 24, color: K.a700 }}>Ask Lisa: Donee Talk</span>
        </div>
        <div style={Object.assign({ position: 'absolute', right: 0, top: 0, height: 64, width: 470, background: K.bg }, WIN())}></div>
        {ORDER.map((n, i) => {
          const a = C[n], b = i < ORDER.length - 1 ? C[ORDER[i + 1]] : 1e9;
          const lo = T < a - 0.3 || T > b + 0.3 ? 0 : Math.min(MOTION.enter(T, a, 0.5), 1 - MOTION.move(T, b - 0.2, b + 0.1));
          return <div key={n} style={{ position: 'absolute', right: 22, top: 17, opacity: lo, fontFamily: K.pix, fontSize: 24, lineHeight: '30px', textTransform: 'uppercase', color: K.text }}>{LABELS[n]}</div>;
        })}
      </div>
    );
  }
  function ContentWindow({ T, C }) {
    const o = Math.min(MOTION.enter(T, C.Why - 0.4, 0.5), 1 - MOTION.move(T, C.Demo + 0.1, C.Demo + 0.6));
    if (o <= 0) return null;
    const k = MOTION.move(T, C.Ask - 0.45, C.Ask + 0.35), sc = 0.96 + 0.04 * MOTION.enter(T, C.Why - 0.4, 0.5);
    return <div style={Object.assign({ position: 'absolute', left: 440, top: 150, width: lerp(1384, 460, k), height: 650, background: K.bg, opacity: o, transform: 'scale(' + sc + ')', transformOrigin: '0% 50%' }, WIN())}></div>;
  }
  const QBadge = () => <div style={{ width: 34, height: 40, background: '#f3ca62', boxShadow: '0 0 0 3px ' + K.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: K.pix, fontSize: 28, color: K.ink }}>?</div>;
  const WORRIES = ['Will I have to care for you, or pay?', 'What if I make the wrong decision?', "But you're still healthy.", 'Can I really cope with this?'];
  function WhyCard({ T, C }) {
    const a = C.Why, o = life(T, a - 0.1, C.Ask - 0.3, 0.5, 0.4);
    if (o <= 0) return null;
    return (
      <div style={{ position: 'absolute', left: 500, right: 156, top: 206, height: 560, opacity: o, transform: 'translateX(' + (-60 * (1 - MOTION.enter(T, a - 0.1, 0.7))) + 'px)', display: 'grid', gridTemplateColumns: '1fr 1px 1fr', columnGap: 64 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div style={rise(T, a + 0.4)}><Kicker>Why it's needed</Kicker></div>
          <div style={Object.assign({ fontFamily: K.head, fontWeight: 600, fontSize: 104, lineHeight: '104px', color: K.text }, rise(T, a + 0.6, 36))}>A big ask</div>
          <div style={Object.assign({ fontSize: 34, lineHeight: '48px', color: K.text, textWrap: 'pretty' }, rise(T, a + 4.7))}>Your donee makes decisions for you if you ever lose mental capacity.</div>
          <div style={Object.assign({ fontSize: 34, lineHeight: '48px', color: K.text, textWrap: 'pretty', borderTop: '1px solid ' + K.divider, paddingTop: 22 }, rise(T, a + 9.1))}>Asking them is a big conversation, and many people don't know how to start.</div>
        </div>
        <div style={{ background: K.divider, transform: 'scaleY(' + MOTION.move(T, a + 0.2, a + 1.4) + ')', transformOrigin: 'top' }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 4 }}>
          <div style={Object.assign({ marginBottom: 14 }, rise(T, a + 13.0))}><Kicker>What they may worry about</Kicker></div>
          {WORRIES.map((w, i) => {
            const t0 = a + 13.3 + i * 0.45, p = MOTION.pop(T, t0, 0.45);
            return (
              <div key={i} style={Object.assign({ display: 'grid', gridTemplateColumns: '62px 1fr', alignItems: 'center', minHeight: 100, borderTop: i ? '1px solid ' + K.divider : 'none' }, rise(T, t0, 16))}>
                <div style={{ transform: 'scale(' + (0.6 + 0.4 * p) + ')', transformOrigin: '30% 50%' }}><QBadge /></div>
                <div style={{ fontSize: 34, lineHeight: '42px', color: K.text, textWrap: 'pretty' }}>{w}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  const STEPS = ['Type a question, or what they said.', 'Lisa answers with toolkit lines, word for word.', 'Copy a line, or browse the whole Toolkit.'];
  const STEP_AT = [0.5, 4.0, 11.4];
  function AskSteps({ T, C }) {
    const a = T - C.Ask, o = life(T, C.Ask + 0.2, C.Demo + 0.5, 0.5, 0.4);
    if (o <= 0) return null;
    return (
      <div style={{ position: 'absolute', left: 484, width: 376, top: 196, opacity: o, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={rise(T, C.Ask + 0.2)}><Kicker>What Ask Lisa does</Kicker></div>
        {STEPS.map((s, i) => {
          const on = MOTION.enter(a, STEP_AT[i], 0.3), off = i < 2 ? MOTION.enter(a, STEP_AT[i + 1], 0.3) : 0, cur = on * (1 - off);
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '58px 1fr', borderTop: '2px solid ' + (cur > 0.5 ? K.accent : K.divider), paddingTop: 16, opacity: 0.3 + 0.7 * cur + 0.25 * off }}>
              <span style={{ fontFamily: K.pix, fontSize: 28, lineHeight: '42px', color: K.a700 }}>{'0' + (i + 1)}</span>
              <span style={{ fontSize: 32, lineHeight: '42px', color: K.text, textWrap: 'pretty' }}>{s}</span>
            </div>
          );
        })}
      </div>
    );
  }

  // ---- the dialogue box: bottom of the frame outside the page, top of the frame while she is in it ----
  function Dialogue({ T, C }) {
    const base = life(T, C.Page + 3.0, C.Finale + 7.0, 0.4, 0.5);
    if (base <= 0) return null;
    const L = lineAt(T, C), dc = demoCover(T, C), top = dc > 0.5;
    const lo = L ? 1 - MOTION.move(T, L.until - 0.15, L.until) : 0;
    const o = top ? base * (2 * dc - 1) * (L && L.top ? Math.min(lo, MOTION.enter(T, L.at - 0.05, 0.25)) : 0) : base * (1 - 2 * dc);
    if (o <= 0) return null;
    const shown = L ? L.text.slice(0, Math.max(0, L.n)) : '', done = L && !L.typing;
    const box = top ? { left: 64, width: 1000, top: 150, height: 126 } : { left: 400, right: 96, top: 846, height: 186, transform: 'translateY(' + (1 - MOTION.enter(T, C.Page + 3.0, 0.5)) * 30 + 'px)' };
    const tx = top ? { left: 34, right: 64, top: 24, fontSize: 30, lineHeight: '40px' } : { left: 48, right: 90, top: 34, fontSize: 42, lineHeight: '58px' };
    return (
      <div style={Object.assign({ position: 'absolute', opacity: o }, box)}>
        <div style={Object.assign({ position: 'absolute', inset: 0, background: K.bg }, WIN())}></div>
        <div style={{ position: 'absolute', left: top ? 26 : 36, top: top ? -26 : -30, padding: top ? '4px 14px' : '6px 18px', background: K.accent, boxShadow: '0 0 0 4px ' + K.ink, fontFamily: K.pix, fontSize: top ? 24 : 28, lineHeight: top ? '28px' : '32px', color: K.ink }}>LPA Lisa</div>
        <div style={Object.assign({ position: 'absolute', fontFamily: K.head, color: K.text, opacity: lo, textWrap: 'pretty', fontVariantLigatures: 'none' }, tx)}>
          <span>{shown}</span><span style={{ opacity: 0 }}>{L ? L.text.slice(Math.max(0, L.n)) : ''}</span>
        </div>
        {done && <div style={{ position: 'absolute', right: top ? 24 : 34, bottom: (top ? 14 : 24) + (Math.floor(T * 2.5) % 2) * 6, fontSize: 24, color: K.accent, opacity: lo }}>▼</div>}
      </div>
    );
  }

  // ---- Lisa, the host ----
  const HOST = { cx: 236, bottom: 1032 }, HD = { w: 44, h: 48, s: 7 };
  const JUMPS = ['Why', 'Ask'], DRIFT = { Why: -14, Ask: 18 }, PUSH = { Why: [430, 70] };
  function sceneMove(T, C) {
    const ue = T - (C.Page + 2.2);
    if (ue < 0) return { gone: true };
    // she hops in from beyond the left edge: she was never inside the page
    if (ue < 1.05) { const p = ue / 1.05, k = Math.abs(Math.sin(Math.PI * 2 * p)); return { dx: lerp(-520, 0, Easing.easeOutCubic(p)), y: k * 90, sq: 1 + 0.06 * k, air: k > 0.05, pose: 'cheer', land: -1 }; }
    if (ue < 1.5) return { dx: 0, y: 0, sq: 1 - 0.16 * Math.sin(Math.PI * clamp((ue - 1.05) / 0.26, 0, 1)), land: ue - 1.05 };
    // and leaves the same way
    const ux = T - (C.Finale + 6.9);
    if (ux >= 0.95) return { gone: true };
    if (ux >= 0) { const p = ux / 0.95, k = Math.abs(Math.sin(Math.PI * 2 * p)); return { dx: lerp(DRIFT.Ask, -560, Easing.easeInCubic(p)), y: k * 80, sq: 1 + 0.06 * k, air: k > 0.05, pose: 'cheer', flip: true, land: -1 }; }
    if (ux > -0.9) return { dx: DRIFT.Ask, y: 0, sq: 1, pose: 'wave', land: -1 };
    let dx = 0;
    for (const n of JUMPS) {
      const d = DRIFT[n];
      if (PUSH[n]) {
        const u = T - (C[n] - 1.1), home = HOST.cx + dx, to = HOST.cx + d, [PX, PR] = PUSH[n];
        if (u < 0) break;
        if (u >= 1.9) { dx = d; continue; }
        if (u < 0.45) return { y: 0, sq: 1, dx: lerp(home, PX, Easing.easeInOutSine(u / 0.45)) - HOST.cx, walk: true, land: -1 };
        if (u < 1.15) { const k = (u - 0.45) / 0.7; return { y: 0, sq: 1 - 0.04 * Math.sin(Math.PI * k), dx: PX + PR * Easing.easeInOutCubic(k) - HOST.cx, pose: 'push', lean: Math.sin(Math.PI * Math.min(1, k * 1.3)) * 9, land: -1 }; }
        const k = (u - 1.15) / 0.75;
        return { y: 0, sq: 1, dx: lerp(PX + PR, to, Easing.easeInOutSine(k)) - HOST.cx, walk: k < 0.95, land: -1 };
      }
      const u = T - (C[n] - 0.5);
      if (u < 0) break;
      if (u >= 1.2) { dx = d; continue; }
      if (u < 0.18) return { y: 0, sq: 1 - 0.16 * Math.sin(Math.PI * u / 0.18), dx, land: -1 };
      if (u < 0.9) { const k = (u - 0.18) / 0.72; return { y: Math.sin(Math.PI * k) * 200, sq: 1 + 0.07 * Math.sin(Math.PI * k), air: true, dx: lerp(dx, d, Easing.easeInOutCubic(k)), land: -1 }; }
      return { y: 0, sq: 1 - 0.18 * Math.sin(Math.PI * clamp((u - 0.9) / 0.26, 0, 1)), dx: d, land: u - 0.9 };
    }
    return { y: 0, sq: 1, dx, land: -1 };
  }
  function demoCrouch(T, C) { const u = T - (C.Demo + 1.95); return u > 0 && u < 0.25 ? 1 - 0.16 * Math.sin(Math.PI * u / 0.25) : 1; }
  // her leap into the page's room and back out; false while the page's own Lisa stands in for her
  function demoLeap(T, C, H) {
    const t0 = C.Demo + D.leap, t1 = C.Demo + D.out;
    if (T < t0 || T >= t1 + 1.0) return null;
    const inU = (T - t0) / (D.land - D.leap), outU = (T - t1) / 1.0;
    if (inU >= 1 && outU < 0) return false;
    const b = browserRect(T, C), tgt = { cx: b.x + 560 * b.s, b: b.y + 662 * b.s, w: 264 * b.s };
    const [A, Bq, p] = inU < 1 ? [H, tgt, inU] : [tgt, H, outU];
    const k = Easing.easeInOutSine(clamp(p, 0, 1));
    return { cx: lerp(A.cx, Bq.cx, k), b: lerp(A.b, Bq.b, k) - Math.sin(Math.PI * k) * 300, w: lerp(A.w, Bq.w, k) };
  }
  function Lisa({ T, C, kit }) {
    const J = sceneMove(T, C);
    if (J.gone) return null;
    const L = lineAt(T, C), talking = !!(L && L.typing && !L.top);
    const bob = talking ? -Math.abs(Math.sin(T * 7.5)) * 7 : Math.round(Math.sin(T * 2.4)) * 3;
    const sway = talking ? Math.sin(T * 1.7) * 10 : 0;
    const lineHop = L && !L.top && !J.air && T - L.at < 0.34 ? Math.sin(Math.PI * clamp((T - L.at) / 0.34, 0, 1)) * 18 : 0;
    let w = HD.w * HD.s, cx = HOST.cx + J.dx + sway, b = HOST.bottom + bob - lineHop - (J.y || 0), squat = (J.sq || 1) * demoCrouch(T, C);
    const DL = demoLeap(T, C, { cx, b, w });
    if (DL === false) return null;
    if (DL) { w = DL.w; cx = DL.cx; b = DL.b; squat = 1; }
    const lu = T - (C.Demo + D.out + 1.0), landed = !DL && lu >= 0 && lu < 0.5;
    if (landed) squat *= 1 - 0.18 * Math.sin(Math.PI * clamp(lu / 0.26, 0, 1));
    const h = w * HD.h / HD.w, mouth = talking ? [1, 2, 1, 0][Math.floor(T * 9) % 4] : 0;
    let pose = 'idle';
    if (J.pose) pose = J.pose; else if (L && !L.top && T < L.until - 0.35 && L.pose) pose = L.pose;
    if (DL) pose = 'cheer';
    if (pose === 'wave') pose = 'wave' + (Math.floor(T * 5) % 2);
    const blink = ((T + 0.7) % 3.4) < 0.13 ? 1 : 0;
    const frame = kit.lisaHD[pose][J.walk ? Math.floor(T * 8) % 2 : 0][mouth][blink];
    const shadow = DL ? 0 : clamp(1 - (HOST.bottom - b) / 280, 0.25, 1), sw = 2 - squat;
    const land = J.land >= 0 ? J.land : landed ? lu : -1, dust = land >= 0 && land < 0.45 ? land / 0.45 : -1;
    const tf = [J.flip ? 'scaleX(-1)' : '', J.lean ? 'skewX(' + (-J.lean) + 'deg)' : ''].join(' ').trim() || 'none';
    return (
      <React.Fragment>
        {shadow > 0 && <div style={{ position: 'absolute', left: cx - 100, top: HOST.bottom - 16, width: 200, height: 26, borderRadius: '50%', background: 'rgba(45,43,43,0.18)', opacity: shadow, transform: 'scale(' + (0.5 + 0.5 * shadow) + ')' }}></div>}
        {dust >= 0 && [-1, 1].map(sd => [0, 1, 2].map(k => {
          const sz = (16 - k * 3) * (1 - dust);
          return <div key={sd + '' + k} style={{ position: 'absolute', left: cx + sd * (70 + dust * (90 + k * 50)) - sz / 2, top: HOST.bottom - 18 - dust * (18 + k * 16) - sz / 2, width: sz, height: sz, background: K.paper, boxShadow: '0 0 0 3px ' + K.ink, opacity: 1 - dust }}></div>;
        }))}
        <img src={frame} style={Object.assign({ position: 'absolute', left: cx - w * sw / 2, top: b - h * squat, width: w * sw, height: h * squat, transformOrigin: '50% 100%', transform: tf }, PIX)} />
      </React.Fragment>
    );
  }

  // ---- sound: the LPA GO! director (lpa-go-audio.js) with this video's beds, cues and lines ----
  let SOUND = null, AUDIO = null;
  const BEDMIX = { room: { room: 0.8, birds: 0.35, air: 0.15, traffic: 0.18 }, quiet: { room: 0.7, birds: 0.25, air: 0.12, traffic: 0.12 } };
  function bedMix(T, C) {
    const seq = [[-1, 'room', 0], [C.Demo + D.land, 'quiet', 0.8], [C.Demo + 38.8, 'room', 0.8]];
    let j = 0; for (let i = 0; i < seq.length; i++) if (T >= seq[i][0]) j = i;
    const cur = BEDMIX[seq[j][1]], prev = j > 0 ? BEDMIX[seq[j - 1][1]] : cur, p = seq[j][2] > 0 ? clamp((T - seq[j][0]) / seq[j][2], 0, 1) : 1, e = p * p * (3 - 2 * p), out = {};
    for (const n of AUDIO.BEDS) out[n] = (prev[n] || 0) * (1 - e) + (cur[n] || 0) * e;
    return out;
  }
  function musicCue(T, C) {
    const seq = [[-1, 'host', 0], [C.Why - 0.3, 'capacity', C.Why - 0.3], [C.Ask - 0.2, 'host', C.Ask - 0.2], [C.Demo + D.land, 'town', C.Demo + D.land], [C.Finale, 'finale', C.Finale]];
    let j = 0; for (let i = 0; i < seq.length; i++) if (T >= seq[i][0]) j = i;
    return { name: seq[j][1], at: Math.max(0, seq[j][2]), skip: 0 };
  }
  function SoundTrack({ T, C }) {
    const { time, playing } = useComposition();
    useEffect(() => {
      if (!SOUND || !AUDIO) return;
      SOUND.update({ time, playing, lines: LINES.map(l => ({ text: l.text, at: C[l.s] + l.at })), mix: bedMix(T, C), music: musicCue(T, C) });
    });
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
    const C = CUES;
    ensure(kit, C);
    const B = browserRect(T, C), ps = pageState(T, C, kit);
    return (
      <div ref={root} style={{ position: 'absolute', inset: 0, background: '#e8dcc2', overflow: 'hidden', fontFamily: K.head, color: K.text }}>
        <Backdrop T={T} kit={kit} />
        <ContentWindow T={T} C={C} />
        <Header T={T} C={C} />
        <WhyCard T={T} C={C} />
        <AskSteps T={T} C={C} />
        <Browser B={B} ps={ps} kit={kit} />
        <Rings T={T} C={C} B={B} ps={ps} />
        <Pointer T={T} C={C} B={B} ps={ps} kit={kit} />
        <Dialogue T={T} C={C} />
        <Lisa T={T} C={C} kit={kit} />
        <SoundTrack T={T} C={C} />
      </div>
    );
  }

  function buildVideoKit(HK, R, TK) {
    const host = HK.buildHostKit(), icons = {};
    ['can', 'mug', 'book'].forEach(k => { icons[k] = R.propIcon(k); });
    return Object.assign(host, { TK, icons, script: buildScript(TK), typeAt: typeTimes(TK.HEADLINE, D.typeA, D.typeB), sim: makeRoomSim(R), cursor: cursorImg() });
  }
  function LpaDoneeTalkVideo() {
    const [kit, setKit] = useState(null);
    const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS || { motionEditor: true });
    const [sound, setSound] = useState(null);
    useEffect(() => {
      const load = new Function('u', 'return import(u)'), url = p => new URL(p, document.baseURI).href;
      load(url('lpa-go-audio.js'))
        .then(au => { AUDIO = au; SOUND = au.createDirector({ base: document.baseURI, scenes: window.OM_SCENES }); setSound(SOUND); })
        .catch(e => console.error('sound failed', e));
      Promise.all([load(url('lpa-go-intro-kit.js')), load(url('lpa-lisa-room.js')), load(url('lpa-lisa-toolkit.js')), document.fonts ? document.fonts.ready : null])
        .then(([HK, R, TK]) => setKit(buildVideoKit(HK, R, TK)))
        .catch(e => console.error('Donee Talk video kit failed', e));
    }, []);
    useEffect(() => { if (sound) sound.set({ vo: t.voice !== false, amb: t.ambience !== false, level: (t.ambLevel ?? 70) / 100, mus: t.music !== false, musLevel: (t.musLevel ?? 60) / 100 }); }, [sound, t.voice, t.ambience, t.ambLevel, t.music, t.musLevel]);
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
          <TweakToggle label="Ambience" value={t.ambience !== false} onChange={v => setTweak('ambience', v)} />
          <TweakSlider label="Ambience level" value={t.ambLevel ?? 70} min={0} max={100} step={5} unit="%" onChange={v => setTweak('ambLevel', v)} />
          <TweakToggle label="Music" value={t.music !== false} onChange={v => setTweak('music', v)} />
          <TweakSlider label="Music level" value={t.musLevel ?? 60} min={0} max={100} step={5} unit="%" onChange={v => setTweak('musLevel', v)} />
        </TweaksPanel>
        <SoundChip dir={sound} />
      </React.Fragment>
    );
  }
  window.LpaDoneeTalkVideo = LpaDoneeTalkVideo;
})();
